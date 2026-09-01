# 🌐 05_DISCORD_ACTIVITY_MIGRATION_PLAN.md — Plan de Migración a Discord Embedded Activity

> **Estado:** Documento de Planificación Activo  
> **Objetivo:** Adaptar el juego RPG estilo Torn desde la interfaz actual basada en Bot de Chat (Embeds/Botones) hacia una **Discord Embedded Activity (App Web Embebida en Iframe)** reutilizando el 100% de la lógica de negocio y base de datos existente.

---

## 1. Visión General de la Arquitectura Híbrida

La arquitectura conservará el backend en TypeScript y Node.js, pero expondrá dos interfaces complementarias:
1. **Frontend Activity (Iframe Web App):** Interfaz gráfica interactiva enriquecida (mapa de la ciudad 2D, muñeco anatómico de salud corporal, grid de inventario RPG, arena de combate animada y minijuegos de casino/carreras).
2. **Discord Bot (Notificaciones Push & Launcher):** Bot de Discord tradicional para enviar avisos a canales/DMs (alertas de guerra, bounties, recuperaciones de hospital) con un botón que abre directamente la Activity en Discord y el comando `/game` como lanzador principal.

```text
               +-------------------------------------------------------+
               |                  CLIENTE DISCORD                      |
               |  +-------------------------------------------------+  |
               |  | Activity (Web App Iframe / Vite + React / SDK)  |  |
               |  +------------------------+------------------------+  |
               +---------------------------|---------------------------+
                                           | WSS / HTTPS Proxy (discordsays.com)
                                           v
               +-------------------------------------------------------+
               |        PROCESO UNIFICADO NODE.JS (src/index.ts)       |
               |                                                       |
               |  +------------------------+  +---------------------+  |
               |  | Express API Server     |  | Discord.js Client   |  |
               |  | - Auth OAuth2 Middl.   |  | - Command Launcher  |  |
               |  | - REST & Socket.io     |  | - Push Notifications|  |
               |  +-----------+------------+  +----------+----------+  |
               |              |                          |             |
               |              +------------+-------------+             |
               |                           |                           |
               |                           v                           |
               |               startScheduler() & Services             |
               |               (Player, Gym, Combat, Factions)         |
               |                           |                           |
               |                           v                           |
               |                  Prisma ORM Singleton                 |
               +---------------------------+---------------------------+
                                           | TCP PostgreSQL
                                           v
               +-------------------------------------------------------+
               |      BASE DE DATOS (PostgreSQL VM / Supabase)         |
               +-------------------------------------------------------+
```

---

## 2. Matriz de Reutilización Técnica

| Componente del Proyecto | Nivel de Reutilización | Acción Requerida |
| :--- | :---: | :--- |
| **`prisma/schema.prisma`** | 100% | Sin cambios en modelos de datos existentes. |
| **`src/services/*`** | 100% | Exponer mediante controladores HTTP/REST o eventos Socket.io. |
| **`src/services/scheduler.ts`** | 100% | Continuar ejecutando crons en el proceso servidor. |
| **`src/config/*`** | 100% | Compartir constantes y fórmulas con el frontend web. |
| **Autenticación (`src/events`)** | 20% | Reemplazar captura de `interaction.user.id` por middleware OAuth2 + JWT propio. |
| **Interfaz de Usuario (`src/commands`, `src/ui`)** | 0% | Crear nuevo proyecto Frontend Web (`client/`) con Vite, React y CSS glassmorphism/retro arcade. |

---

## 3. Decisiones de Diseño Pendientes (Proceso Grill-Me)

A continuación se registran los ejes de decisión clave alineados con el desarrollador:

1. **Framework Frontend:** `Vite + React + TypeScript` con CSS Moderno (Glassmorphism / Dark Mode).
2. **Mapeo de Rutas y API Backend:** `Express + REST API + WebSockets (Socket.io)`. REST para CRUD/perfil y WebSockets para combate PvP en vivo y notificaciones instantáneas.
3. **Coexistencia con Bot de Discord:** `Transición Total a Activity App`. La Activity embebida es la interfaz principal del juego (100% App Web). El Bot se mantiene como launcher (`/game` / botón de lanzamiento) y notificador push.
4. **Estilo Visual & UX:** Fusión entre `Sleek Minimalist Dark Dashboard` (interfaz limpia, moderna y oscura) y `Crime City / Retro Arcade` (iconografía de crimen, detalles tácticos y estética RPG).
5. **Estrategia de Despliegue y SSL:** `Cloudflare Tunnel (cloudflared)` para túneles HTTPS en desarrollo local, mapeado en el Developer Portal de Discord.
6. **Prioridad de Vistas Frontend (MVP Activity):** `FASE A`: Autenticación OAuth2 silenciosa + Perfil con Diagrama Anatómico de Salud + Hub de la Ciudad + Gimnasio e Inventario Grid.

---

## 4. Configuración en el Developer Portal

Para convertir la aplicación de Discord actual en una Embedded Activity, es necesario ajustar los parámetros clave en el [Discord Developer Portal](https://discord.com/developers/applications):

### 4.1 Habilitación de Activities y Entry Point Command
- **Enable Activities:** En la pestaña *Activities* -> *Settings*, activar el switch **Enable Activity**.
- **Default Entry Point Command ("Launch"):**
  - Al habilitar Activities, Discord genera automáticamente un comando primario de entrada (Entry Point Command).
  - Configuración: Mantendremos el handler por defecto de Discord para lanzar la Activity al presionar "Launch". Además, nuestro comando slash `/game` existente en el Bot responderá con un botón interactivo de tipo `LaunchActivity` para abrir el iframe con un solo clic.

### 4.2 Installation Contexts
Discord permite instalar las aplicaciones bajo dos modelos principales:
- **Guild Install (`Context 0`):** La app se instala en servidores específicos. Los miembros pueden ejecutar la Activity en canales de voz y canales de texto del servidor.
- **User Install (`Context 1`):** La app se instala directamente en la cuenta personal del usuario de Discord. Permite abrir la Activity en DMs, chats grupales privados y cualquier servidor sin requerir que el bot esté instalado en ese servidor.
- **Decisión:** Habilitar **ambos contextos (Guild Install + User Install)** para maximizar la distribución y permitir que los jugadores accedan a su imperio criminal desde cualquier lugar en Discord.

### 4.3 Redirect URI Placeholder
- En el flujo del **Embedded App SDK (`@discord/embedded-app-sdk`)**, el cliente de Discord solicita la autorización vía RPC (`discordSdk.commands.authorize`) y devuelve el `code` de autorización directamente mediante comunicación `postMessage` al iframe. **El cliente nunca realiza una redirección HTTP de navegador**.
- Por lo tanto, la Redirect URI registrada en el Developer Portal **NUNCA se utiliza ni se invoca** en el flujo de ejecución de una Activity.
- **Configuración requerida:** Registraremos únicamente la URL placeholder fija `https://127.0.0.1` en *OAuth2* -> *Redirects* para cumplir formalmente con la validación de la interfaz del Developer Portal. No aplica registrar rutas tipo `discordsays.com/.proxy/api/auth/token` porque no existe redirección HTTP receptora.

### 4.4 URL Mappings (Dev vs. Producción)
Discord enruta todo el tráfico del iframe a través del proxy seguro `https://{client_id}.discordsays.com`. En la pestaña *Activities* -> *URL Mappings* se debe mapear la raíz y prefijos:

| Entorno | Prefix Path | Target URL | Propósito |
| :--- | :--- | :--- | :--- |
| **Desarrollo (Local)** | `/` | `https://xxxx.trycloudflare.com` | Redirige todo el tráfico del iframe al túnel local de `cloudflared` (servidor Express + Vite). |
| **Producción** | `/` | `https://underworld.juegotorn.com` | Redirige el iframe a la aplicación Express sirviendo el build estático de React en `/dist` y las rutas API `/api/*`. |
| **CDN (Opcional)** | `/assets` | `https://my-game-cdn.r2.dev` | Si los sprites pesados de armas y mapas se migran a un bucket R2/S3 externo, se mapea un prefijo dedicado para evitar bloqueos por CSP. |

---

## 5. Autenticación y Seguridad (OAuth2 + JWT propio)

### 5.1 Flujo de Autenticación Stateless
La Activity implementa un intercambio de credenciales seguro y *stateless* donde **nunca** se expone el `DISCORD_CLIENT_SECRET` en el navegador del usuario ni se satura la API de Discord con peticiones repetitivas:

```text
[Cliente React (Iframe)]              [Discord Client / API]            [Backend Express (Server)]
           |                                     |                                   |
           |-- 1. discordSdk.commands.authorize()|                                   |
           |------------------------------------>|                                   |
           |<-- 2. Devuelve { code } ------------|                                   |
           |                                                                         |
           |-- 3. POST /api/auth/token { code } ------------------------------------>|
           |                                                                         |-- 4. Intercambia code con Discord
           |                                                                         |   (DISCORD_CLIENT_SECRET)
           |                                                                         |------------------------------------> [Discord OAuth2 API]
           |                                                                         |<------------------------------------ Token: access_token, refresh_token
           |                                                                         |
           |                                                                         |-- 5. Valida 1 vez /users/@me y guarda refresh_token en DB
           |                                                                         |-- 6. Genera Session JWT local
           |                                                                         |   (firmado con SESSION_JWT_SECRET)
           |<-- 7. Devuelve { access_token, token: <session_jwt>, user_id } ---------|
           |
           |-- 8. discordSdk.commands.authenticate({ access_token })
           |------------------------------------>|
           |<-- 9. Confirma autenticación SDK ---|
           |       (Descarta access_token)
           |
           |-- 10. REST / Sockets (Header: Authorization: Bearer <session_jwt>) ------>| (Middleware valida JWT localmente
           |                                                                         |  en 0ms sin llamadas de red)
```

**Propósitos diferenciados de tokens:**
- **`access_token` de Discord:** Viaja al cliente **únicamente** para ejecutarse una sola vez en `discordSdk.commands.authenticate({ access_token })` y completar el handshake del iframe con el cliente de Discord. El cliente lo descarta inmediatamente después y no lo reutiliza para ninguna otra llamada.
- **`session_jwt` propio:** Token firmado por nuestro backend con `SESSION_JWT_SECRET`. Se almacena en la memoria del cliente y se adjunta en la cabecera `Authorization: Bearer <session_jwt>` para todas las llamadas REST y en el objeto `auth` de Socket.io.

### 5.2 Scopes Solicitados
- `identify`: Acceso al `id`, `username`, `global_name` y `avatar` del jugador.
- `guilds`: Permite identificar el `guildId` en el que se ejecuta la Activity para aplicar el aislamiento por servidor (`guildId_discordId` en Prisma).
- `applications.commands`: Permite registrar y manejar interacciones de comandos.
- `rpc.activities.write` *(Evaluado)*: Permite escribir el Rich Presence del jugador dentro de su estado en Discord (ej: *"Entrenando en el Gimnasio"*, *"En combate PvP contra Boss"*).

### 5.3 Regla Estricta Server-Side y Middleware `requireAuth` con JWT Propio

> [!CAUTION]
> **REGLA ABSOLUTA DE SEGURIDAD:** Ningún endpoint REST ni evento de WebSocket confiará en un `discordId` enviado en el cuerpo de la petición (body JSON) o en parámetros URL. Tampoco se llamará a la API de Discord (`/users/@me`) en cada petición HTTP para evitar agotar límites de rate limit.

1. **Funcionamiento del Middleware `requireAuth`:**
   - El backend **NO** consulta la API de Discord en cada request.
   - En su lugar, el middleware verifica y decodifica el JWT de sesión propio proporcionado en el header `Authorization: Bearer <session_jwt>`.
   - La firma se valida localmente en memoria usando `SESSION_JWT_SECRET` en <1ms.
   - El payload del JWT (`{ discordId, guildId, exp }`) asigna directamente `req.user = { discordId, guildId }`.

2. **Por qué esta arquitectura es la correcta para escalar:**
   - **Es Stateless:** Cualquier nodo o instancia del backend puede validar la autenticación sin consultar a una base de datos centralizada de sesiones ni a Discord.
   - **Inmune a Rate Limits de Discord:** Evita hacer miles de peticiones de red externas a `discord.com/api/v10/users/@me` por segundo.
   - **Rendimiento:** Validación criptográfica ultrarrápida en memoria.

3. **Riesgos Concretos si se vulnera la identificación:**
   - **Economía:** Un atacante en DevTools podría llamar `POST /api/economy/transfer { from: "victim_id", to: "attacker_id", amount: 1000000000 }`.
   - **PvP y Salud:** Podría forzar ataques desde la cuenta de otro jugador sin gastar energía personal.
   - **Casino & Crímenes:** Podría simular triunfos ilimitados en la ruleta o crímenes asignándose los fondos.

### 5.4 Expiración Corta y Refresh Token (`POST /api/auth/refresh`)
- El **JWT propio** emitido por el backend tendrá una **expiración corta de 15 minutos** por seguridad.
- **Persistencia en Base de Datos:** El `refresh_token` de Discord **NO** se guarda en cookies del navegador (evitando problemas de Third-Party Cookie Blocking en iframes) ni en la memoria volátil del servidor. Se persiste en PostgreSQL (asociado al `discordId` del jugador vía Prisma).
- **Flujo de Renovación Transparente (`POST /api/auth/refresh`):**
  1. El cliente detecta un error `401 Unauthorized` o que su `session_jwt` está por expirar, y llama a `POST /api/auth/refresh` enviando el `session_jwt` actual (incluso vencido) en el header `Authorization`.
  2. El backend decodifica el `discordId` del JWT (verificando la firma con `SESSION_JWT_SECRET` sin requerir que la fecha de expiración sea válida).
  3. El backend busca en PostgreSQL vía Prisma el `refresh_token` de Discord almacenado para ese `discordId`.
  4. Intercambia ese `refresh_token` con la API OAuth2 de Discord para obtener un nuevo `access_token` (y actualiza el `refresh_token` en PostgreSQL si Discord rota y devuelve uno nuevo).
  5. Reemite un nuevo `session_jwt` de 15 minutos y lo devuelve al cliente.

> [!NOTE]
> Este diseño es **100% stateless en la capa HTTP**: no depende de cookies del navegador ni de almacenes de sesión en memoria del proceso Express, apoyándose únicamente en la tabla de PostgreSQL existente. Es completamente coherente con la arquitectura de escalado horizontal descrita en la Sección 7.3.

### 5.5 Superficie de Ataque y Rate Limiting
Al exponer una API HTTP en Express:
- **Rate Limiting Global y por Usuario:** Se aplicará `express-rate-limit` por IP y por `userId` decodificado del JWT (máximo 3 peticiones de crimen/segundo, máximo 5 acciones de casino/gimnasio por segundo).
- **Transacciones Atómicas:** Toda operación económica y de inventario continuará utilizando `prisma.$transaction` para evitar la duplicación de ítems o saldo mediante race conditions.

---

## 6. Networking y Content Security Policy (Proxy de Discord)

### 6.1 Funcionamiento del Proxy de Discord
Discord aísla las Activities dentro del origen seguro `https://{client_id}.discordsays.com`. Cualquier petición HTTP o WebSocket saliente que intente conectar directamente a un dominio no mapeado en el Developer Portal será bloqueada por el navegador con un error de Content Security Policy (`blocked:csp`).

### 6.2 Construcción de URLs y Compatibilidad `/.proxy/`
- El `@discord/embedded-app-sdk` resuelve el subdominio proxy del cliente de Discord automáticamente.
- **Rutas Relativas:** Todas las peticiones del frontend en React utilizarán rutas relativas `/api/...`.
- **Prefijo `/.proxy/`:** Aceptamos por compatibilidad tanto `/api/...` como `/.proxy/api/...` mediante reescritura de rutas en Express (`app.use('/.proxy/api', apiRouter)` y `app.use('/api', apiRouter)`).

### 6.3 Ubicación de Assets Estáticos
- Los assets estáticos del juego (sprites de armas, íconos de ítems, mapas de la ciudad y avatares) vivirán dentro de la carpeta `client/public/assets/`.
- Se servirán bajo el mismo dominio de la Activity (sin requerir dominios externos adicionales ni configuraciones de CSP complejas).

### 6.4 Cookies vs. Bearer Token Headers
- Los navegadores modernos bloquean severamente las cookies de terceros (Third-Party Cookies) dentro de iframes. Para usar cookies se requerirían configuraciones complejas de `SameSite=None; Secure; Partitioned;` (CHIPS spec).
- **Decisión:** **Se descarta totalmente el uso de Cookies para peticiones generales.** Toda la autenticación se manejará pasando el JWT propio mediante cabeceras HTTP:
  ```http
  Authorization: Bearer <session_jwt>
  ```
  Y en WebSockets pasando el token en el objeto de autenticación inicial de Socket.io:
  ```javascript
  const socket = io({ auth: { token: sessionJwt } });
  ```

### 6.5 WebSockets y Mitigación de Timeouts en Proxy de Discord
- El proxy de Discord soporta WebSockets a través de WSS (`wss://{client_id}.discordsays.com/.proxy/ws`).
- **Aclaración de Infraestructura & Proxy Cloudflare:** Aunque nuestro backend Node.js corre en una VM sin límites propios de conexión, el tráfico WSS transita obligatoriamente por la infraestructura proxy de Discord (que corre sobre Cloudflare Workers). No existe documentación pública oficial que garantice conexiones WSS indefinidas sin cierres por inactividad o timeouts de proxy.
- **Mitigación obligatoria en el Frontend (`useSocket.ts`):**
  - Configurar **heartbeat / ping-pong** periódico cada 25 segundos para mantener el socket activo.
  - Implementar **reconexión automática con backoff exponencial** en Socket.io (`reconnection: true`, `reconnectionDelay: 1000`, `reconnectionDelayMax: 5000`).
  - Al reconectar, el socket re-autentica su `sessionJwt` de forma transparente sin perder el estado del jugador.

### 6.6 Instancias Multijugador (`instanceId`)
- El SDK de Discord expone la propiedad `discordSdk.instanceId`, un identificador único para el canal de voz o grupo de chat donde se inició la Activity.
- **Decisión:** El `instanceId` se utilizará **únicamente como sala (room) de Socket.io** para funciones de tiempo real y espectadores efímeros (ej. jugadores compartiendo la misma mesa de casino visual en un canal de voz, o espectadores viendo un combate PvP en vivo).
- **Consistencia del Jugador:** El estado persistente del personaje (salud corporal, cartera de dinero, inventario, nivel y estadísticas) **siempre** se resuelve por el `discordId` autenticado en PostgreSQL vía Prisma, **independientemente del `instanceId`**. Esto garantiza que el juego sea consistente y 100% jugable tanto en solitario como cambiando de canales de voz.

---

## 7. Arquitectura de Proceso (Bot vs. Servidor Activity)

### 7.1 Decisión: Proceso Unificado Monolítico (`Single-Process Node.js`)
Dado que la infraestructura actual corre en Node.js conectándose a una VM externa con PostgreSQL via Prisma, la API de Express (Activity Backend), el Cliente de Discord.js (Bot Launcher y Notificador) y el Scheduler de Cron (`startScheduler()`) se ejecutarán en **un solo proceso Node.js unificado** (`src/index.ts`).

### 7.2 Justificación
1. **Eficiencia de Conexiones:** Evita duplicar el pool de conexiones de Prisma ORM hacia la base de datos PostgreSQL.
2. **Simplicidad de Despliegue:** Un único comando (`npm start` o `pm2 start`) levanta el juego completo.
3. **Escalabilidad Futura:** La lógica de Express vive desacoplada en `src/server.ts`. Si en el futuro el tráfico requiere separar el Bot de la API, se pueden dividir en dos microservicios con cero cambios en la lógica de negocio.

```text
+-----------------------------------------------------------------------------------+
|                        PROCESO UNIFICADO NODE.JS (src/index.ts)                   |
|                                                                                   |
|  +---------------------------+  +--------------------------+  +-----------------+  |
|  |  Servidor Express API     |  | Bot Client (discord.js)  |  | startScheduler()|  |
|  |  - REST Endpoints         |  | - Command /game Launcher |  | - Cron Regenerat|  |
|  |  - WebSockets (Socket.io) |  | - Push Notifications     |  |   (5min & 1h)   |  |
|  +-------------+-------------+  +------------+-------------+  +--------+--------+  |
|                |                             |                       |            |
|                +-----------------------------+-----------------------+            |
|                                              v                               |
|                                   Prisma ORM Singleton Client                     |
+----------------------------------------------+------------------------------------+
                                               |
                                               v
                                 Base de Datos PostgreSQL (VM)
```

### 7.3 Preparación para Escalado Horizontal (Diseño Futuro)
*Esta subsección documenta la preparación arquitectónica para escalar sin requerir reescrituras:*
- **Auth Stateless:** Gracias a la autenticación por JWT propia (Sección 5.3), cualquier número de instancias del backend Express en un cluster puede validar las peticiones REST sin compartir memoria ni consultar bases de datos de sesiones.
- **Adaptador de Redis para WebSockets (`@socket.io/redis-adapter`):** Si en el futuro el proceso unificado se separa en múltiples nodos tras un Load Balancer (ej. AWS NGINX / Cloudflare), Socket.io requerirá activar el adaptador de Redis. Esto permitirá que la emisión de eventos en tiempo real (combate PvP, salas de `instanceId`, notificaciones) se propague entre jugadores conectados a diferentes instancias del servidor.
- **Nota:** Fuera del alcance del MVP actual, pero la arquitectura de JWT y Sockets queda preparada sin requerir rediseño futuro.

---

## 8. Despliegue en Producción

### 8.1 Desarrollo vs. Producción
- **Desarrollo (Túnel Local):** Se utilizará **Cloudflare Tunnel (`cloudflared`)** mediante `npx cloudflared tunnel --url http://localhost:3000`. Genera un túnel HTTPS dinámico (ej. `https://xxx.trycloudflare.com`) para pruebas en tiempo real dentro del cliente de Discord.
- **Producción (URL Fija HTTPS):** Discord requiere un dominio estable con SSL (ej. `https://underworld.juegotorn.com`). No se pueden usar Quick Tunnels en producción porque la URL cambia al reiniciar el túnel.

### 8.2 Opciones de Infraestructura de Producción
- **Opción A (Recomendada):** Mantener el proceso Node.js unificado en la **misma VM Linux** donde reside la base de datos PostgreSQL (o una VPS dedicada de Hetzner/DigitalOcean), gestionado por **PM2** o **Docker Compose** tras un proxy inverso **Nginx / Caddy** con SSL automático de Let's Encrypt.
- **Opción B (Cloud PaaS):** Desplegar el proceso Node.js en **Railway** o **Render** con conexión SSL cifrada hacia la VM de PostgreSQL.

---

## 9. Plan de Transición para Jugadores Existentes

### 9.1 Convivencia y Migración de Comandos
- Durante la etapa de desarrollo y pruebas Beta, el Bot de comandos slash continuará operando normalmente en paralelo.
- El día del **Lanzamiento Oficial de la Activity**:
  - Se desplegará la versión unificada del backend.
  - Los comandos slash de gameplay (`/atacar`, `/empresa`, `/gym`) se actualizarán para devolver un mensaje informativo con un botón interactivo de lanzamiento: *"¡El juego se ha actualizado a Discord Activity! Haz clic abajo para jugar en pantalla completa"*.
  - El comando `/game` se mantendrá como el lanzador primario.

### 9.2 Preservación Intacta del Estado de Juego
- Dado que todos los datos (cartera, nivel, extremidades corporales, miembros de facción, condenas de cárcel y hospitalizaciones) residen en la base de datos PostgreSQL compartida via Prisma, los jugadores **conservarán el 100% de su progreso**.
- Al abrir la Activity por primera vez, el flujo OAuth2 autenticará al usuario y cargará su partida existente sin pérdida de datos ni desincronización de temporizadores.

---

## 10. Consideraciones de Mobile (Cliente Móvil de Discord)

### 10.1 Desafíos UX en Pantallas Táctiles (iOS / Android)
Una gran parte de los usuarios de Discord consumen Activities desde teléfonos móviles. El diseño se construirá bajo un **enfoque Responsive Adaptive**:

1. **Controles Duales para Inventario (Drag-and-Drop vs. Tap):**
   - El arrastre (drag-and-drop) en iframes móviles suele interferir con el scroll pasivo de la pantalla.
   - **Solución:** Soporte dual. En Desktop se permite drag-and-drop; en dispositivos móviles/táctiles se habilita la selección por toque (*Tap-to-Select* y botón *Equipar / Usar*).
2. **Diagrama Anatómico de Salud Adaptativo:**
   - En móviles, el cuerpo humano 2D de salud por extremidades se ajustará automáticamente en formato vertical (*Portrait Layout*) para evitar desbordamientos laterales.
3. **Zonas Táctiles Seguras (Touch Targets):**
   - Todos los botones interactivos (ej. entrenar en gimnasio, ejecutar crimen) tendrán un tamaño mínimo de **44x44px** con espaciado adecuado para prevenir toques accidental.

---

## 11. Arquitectura del Proyecto React Frontend propuesta (`client/`)

```text
client/
├── public/
│   ├── assets/              # Iconos de ítems, mapas de la ciudad, sprites de armas
│   └── favicon.ico
├── src/
│   ├── components/          # Componentes UI reutilizables
│   │   ├── common/          # Botones, Modales, Tarjetas estilo Dark Dashboard
│   │   ├── health/          # Diagrama Anatómico de Salud Corporal (Cabeza, Torso, Extremidades)
│   │   ├── inventory/       # Grid de Inventario RPG (Drag-and-drop & Tap-to-select)
│   │   ├── gym/             # Sliders de Entrenamiento y Animaciones de Stats
│   │   └── hub/             # Mapa interactivo de Distritos de la Ciudad
│   ├── hooks/               # Custom Hooks
│   │   ├── useDiscordSdk.ts # Hook de inicialización y auth con @discord/embedded-app-sdk
│   │   ├── usePlayer.ts     # Hook de estado del jugador y salud corporal
│   │   └── useSocket.ts     # Hook de conexión WebSocket (Socket.io con heartbeat & reconnect)
│   ├── services/            # Cliente API REST (Axios/Fetch con interceptor Bearer JWT)
│   ├── styles/              # Design System CSS (Glassmorphism, Dark Mode, Crime Retro accents)
│   ├── App.tsx              # Componente principal con Layout y Navegación
│   └── main.tsx             # Punto de entrada Vite + React
├── index.html
├── package.json
└── vite.config.ts           # Configuración con server.proxy para /api y /socket.io
```

---

## 12. Hoja de Ruta de Ejecución Técnica (Checklist)

- [ ] **Paso 1: Configuración en Discord Developer Portal**
  - [ ] Activar **Enable Activity** en la pestaña Activities.
  - [ ] Configurar **Installation Contexts** (Guild Install + User Install).
  - [ ] Registrar Redirect URI placeholder (`https://127.0.0.1`).
  - [ ] Mapear URL Mappings de desarrollo (Túnel Cloudflare `/` ➔ `https://xxxx.trycloudflare.com`).

- [ ] **Paso 2: Inicialización del Cliente Frontend (`client/`)**
  - [ ] Crear el proyecto `client/` con `Vite + React + TypeScript`.
  - [ ] Instalar `@discord/embedded-app-sdk`, `socket.io-client`, `axios` y configurar `vite.config.ts`.
  - [ ] Configurar `server.proxy` en `vite.config.ts` redirigiendo `/api` y `/socket.io` al servidor Express local en dev (evitando bloqueos de CORS).
  - [ ] Implementar el Hook `useDiscordSdk.ts` para la autorización y autenticación inicial.

- [ ] **Paso 3: Servidor API Express & Auth con JWT Propio (`src/server.ts`)**
  - [ ] Instalar `express`, `cors`, `socket.io`, `jsonwebtoken`, `@types/jsonwebtoken` en el proyecto backend.
  - [ ] Actualizar `.env.example` y `.env` con las variables: `VITE_DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_JWT_SECRET`.
  - [ ] Agregar campo `discordRefreshToken` (o tabla dedicada) al schema de Prisma para persistir el `refresh_token` de Discord por jugador, usado exclusivamente por `POST /api/auth/refresh`.
  - [ ] Implementar `POST /api/auth/token` (Valida token de Discord 1 vez y emite JWT propio de sesión de 15 min firmando `discordId` y `guildId`).
  - [ ] Implementar `POST /api/auth/refresh` (Usa el `refresh_token` de Discord para renovar el `access_token` y reemitir el JWT de sesión).
  - [ ] Crear el middleware `requireAuth` que valida localmente el JWT en la cabecera `Authorization: Bearer <session_jwt>`.
  - [ ] Configurar soporte de rutas `/api` y `/.proxy/api`.

- [ ] **Paso 4: Exposición de Servicios Existentes a REST & WebSockets**
  - [ ] Exponer `PlayerService` (`GET /api/player/profile`, `GET /api/player/health`).
  - [ ] Exponer `GymService` (`POST /api/gym/train`).
  - [ ] Exponer `InventoryService` (`GET /api/inventory`, `POST /api/inventory/equip`).
  - [ ] Configurar servidor Socket.io enlazando salas con `discordSdk.instanceId` para tiempo real efímero y usando `discordId` para el estado persistente.

- [ ] **Paso 5: Desarrollo de Componentes UI en React**
  - [ ] Implementar el **Diagrama Anatómico de Salud Corporal** (representación visual de HP en Cabeza, Torso y Extremidades).
  - [ ] Construir el **Hub de la Ciudad** (Navegación visual por Distritos).
  - [ ] Desarrollar el **Grid de Inventario RPG** (con soporte Touch/Tap y Drag-and-drop).
  - [ ] Construir la interfaz interactiva del **Gimnasio**.

- [ ] **Paso 6: Robustez de WebSockets, Integración y Pruebas**
  - [ ] Implementar en `useSocket.ts` el mecanismo de heartbeat (ping/pong a 25s) y reconexión automática con backoff exponencial.
  - [ ] Probar empíricamente una conexión WSS viva durante 30-60 minutos simulando un combate o guerra de facción a través del proxy de Discord.
  - [ ] Integrar el arranque de Express y Socket.io dentro de `src/index.ts` junto a `discord.js` y `startScheduler()`.
  - [ ] Levantar el túnel HTTPS `cloudflared` y verificar la carga completa de la Activity en el cliente de Discord (Desktop & Mobile).
