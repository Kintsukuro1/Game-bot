import { useEffect, useState, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { api } from '../lib/api';

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || '123456789';

// ────────────────────────────────────────────────────────────────
// Singleton: El DiscordSDK DEBE instanciarse UNA SOLA VEZ a nivel
// de módulo. React 18 Strict Mode ejecuta useEffect dos veces en
// desarrollo, lo que causaba "Already authing" al duplicar la
// llamada a authorize().
// ────────────────────────────────────────────────────────────────
let discordSdkInstance: DiscordSDK | null = null;
let authPromise: Promise<AuthResult> | null = null;

interface AuthResult {
  discordSdk: DiscordSDK;
  user: DiscordAuthUser;
  sessionToken: string;
  guildId: string;
  instanceId: string;
}

export interface DiscordAuthUser {
  id: string;
  discordId: string;
  username: string;
  avatar?: string;
}

export interface DiscordSdkState {
  discordSdk: DiscordSDK | null;
  user: DiscordAuthUser | null;
  sessionToken: string | null;
  guildId: string;
  instanceId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  debugStep: string;
  error: string | null;
  diagnostics: string[];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stepName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout ${timeoutMs / 1000}s en: ${stepName}`)), timeoutMs)
    ),
  ]);
}

// Log de diagnóstico a nivel de módulo (persiste entre re-renders)
const diagLog: string[] = [];
function addDiag(msg: string) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(`🔬 ${entry}`);
  diagLog.push(entry);
}

/**
 * Ejecuta el flujo completo de autenticación del SDK exactamente una vez.
 * Si se llama múltiples veces (React Strict Mode), reutiliza la misma promesa.
 */
function performAuth(onStep: (msg: string) => void): Promise<AuthResult> {
  if (authPromise) {
    onStep('(reutilizando flujo de auth existente)');
    return authPromise;
  }

  authPromise = _doAuth(onStep);
  return authPromise;
}

async function _doAuth(onStep: (msg: string) => void): Promise<AuthResult> {
  // ── Paso 1: Instanciar SDK y esperar ready() ──
  onStep('Paso 1/4: Conectando SDK con Discord Client...');

  if (!discordSdkInstance) {
    discordSdkInstance = new DiscordSDK(CLIENT_ID);
  }

  await withTimeout(
    discordSdkInstance.ready(),
    30000,
    'SDK ready() handshake con Discord Client'
  );
  addDiag('✅ Paso 1 OK: ready()');

  const currentGuildId = discordSdkInstance.guildId || 'GLOBAL';
  const currentInstanceId = discordSdkInstance.instanceId || '';

  // ── Verificación previa de token de sesión persistido ──
  try {
    const savedToken = localStorage.getItem('app_user_session_token');
    if (savedToken) {
      addDiag('🔍 Verificando sesión persistida previa en caché...');
      const checkRes = await api.get('/player/profile', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      // El endpoint /player/profile devuelve { player: { ... } }
      const playerProfile = checkRes.data?.player;
      if (playerProfile && (playerProfile.discordId || playerProfile.id)) {
        addDiag(`⚡ Sesión previa válida para ${playerProfile.username}. Autenticación instantánea sin modal.`);
        return {
          discordSdk: discordSdkInstance,
          user: {
            id: playerProfile.id,
            discordId: playerProfile.discordId,
            username: playerProfile.username,
          },
          sessionToken: savedToken,
          guildId: currentGuildId,
          instanceId: currentInstanceId,
        };
      }
    }
  } catch (e) {
    addDiag('ℹ️ Caché expirada o no disponible, continuando con OAuth...');
  }

  // ── Paso 2: Ejecutar authorize RPC con fallback silencioso (prompt: none) ──
  onStep('Paso 2/4: Verificando autorización de Discord...');

  let code: string;
  try {
    // Intentar autorización silenciosa en segundo plano (prompt: 'none')
    const authRes = await withTimeout(
      discordSdkInstance.commands.authorize({
        client_id: CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none' as any,
        scope: ['identify', 'guilds'],
      }),
      10000,
      'Autorización silenciosa (prompt: none)'
    );
    code = authRes.code;
    addDiag('✅ Paso 2 OK: Autorización silenciosa automática (sin modal)');
  } catch (silentErr) {
    addDiag('ℹ️ Primera autorización requerida: solicitando consentimiento del usuario...');
    const authRes = await withTimeout(
      discordSdkInstance.commands.authorize({
        client_id: CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'consent' as any,
        scope: ['identify', 'guilds'],
      }),
      45000,
      'Autorización de usuario (prompt: consent)'
    );
    code = authRes.code;
    addDiag('✅ Paso 2 OK: Autorización manual concedida');
  }

  // ── Paso 3: Intercambiar code con backend Express ──
  onStep('Paso 3/4: Autenticando con el servidor...');

  const response = await withTimeout(
    api.post('/auth/token', {
      code,
      guildId: currentGuildId,
    }),
    15000,
    'Petición REST /auth/token'
  );

  const { access_token, token: sessionJwt, user } = response.data;
  addDiag(`✅ Paso 3 OK: JWT recibido, user=${user?.username}`);

  // Guardar en caché local de forma segura
  try {
    if (sessionJwt) {
      localStorage.getItem('app_user_session_token');
      localStorage.setItem('app_user_session_token', sessionJwt);
    }
  } catch (e) {
    console.warn('Error al guardar token en localStorage:', e);
  }

  // ── Paso 4: Completar handshake del iframe con authenticate() ──
  onStep('Paso 4/4: Finalizando handshake...');
  addDiag(`Paso 4: authenticate() con access_token (${access_token ? 'presente' : '❌ VACÍO'})`);

  await withTimeout(
    discordSdkInstance.commands.authenticate({ access_token }),
    10000,
    'SDK authenticate()'
  );
  addDiag('✅ Paso 4 OK: authenticate()');

  return {
    discordSdk: discordSdkInstance,
    user,
    sessionToken: sessionJwt,
    guildId: currentGuildId,
    instanceId: currentInstanceId,
  };
}

export function useDiscordSdk() {
  const [state, setState] = useState<DiscordSdkState>({
    discordSdk: null,
    user: null,
    sessionToken: null,
    guildId: 'GLOBAL',
    instanceId: '',
    isAuthenticated: false,
    isLoading: true,
    debugStep: 'Iniciando...',
    error: null,
    diagnostics: [],
  });

  const startedRef = useRef(false);

  useEffect(() => {
    // ── Guardia contra doble ejecución (React Strict Mode) ──
    if (startedRef.current) return;
    startedRef.current = true;

    async function setup() {
      try {
        addDiag(`CLIENT_ID: ${CLIENT_ID}`);
        addDiag(`origin: ${window.location.origin}`);
        addDiag(`inIframe: ${window.self !== window.top}`);

        if (!CLIENT_ID || CLIENT_ID === '123456789') {
          throw new Error('VITE_DISCORD_CLIENT_ID no configurado en el entorno.');
        }

        const queryParams = new URLSearchParams(window.location.search);
        const hasFrameId = queryParams.has('frame_id');
        const hasInstanceId = queryParams.has('instance_id');
        const isInIframe = window.self !== window.top;

        addDiag(`frame_id: ${hasFrameId ? '✅' : '❌'}, instance_id: ${hasInstanceId ? '✅' : '❌'}`);

        const isInsideDiscordIframe = isInIframe || hasFrameId || hasInstanceId;

        // Modo navegador directo (desarrollo sin Discord)
        if (!isInsideDiscordIframe) {
          addDiag('Modo navegador directo — datos mock');
          setState({
            discordSdk: null,
            user: { id: 'dev-1', discordId: '1364741760055775262', username: 'Jugador Pruebas Web' },
            sessionToken: 'DEV_MOCK_JWT_TOKEN',
            guildId: 'GLOBAL',
            instanceId: 'dev-room',
            isAuthenticated: true,
            isLoading: false,
            debugStep: 'Modo Simulación Navegador',
            error: null,
            diagnostics: [],
          });
          return;
        }

        // ── Ejecutar flujo de auth (singleton, safe contra doble ejecución) ──
        const result = await performAuth((stepMsg) => {
          addDiag(stepMsg);
          setState((prev) => ({ ...prev, debugStep: stepMsg }));
        });

        addDiag('🎉 ¡Activity autenticada exitosamente!');

        setState({
          discordSdk: result.discordSdk,
          user: result.user,
          sessionToken: result.sessionToken,
          guildId: result.guildId,
          instanceId: result.instanceId,
          isAuthenticated: true,
          isLoading: false,
          debugStep: 'Listo',
          error: null,
          diagnostics: [],
        });
      } catch (err: any) {
        console.error('❌ Error durante autenticación Discord Activity:', err);
        addDiag(`❌ ERROR: ${err?.message || err}`);

        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          'Error desconocido al conectar con Discord Activity.';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
          diagnostics: [...diagLog],
        }));
      }
    }

    setup();
  }, []);

  return state;
}
