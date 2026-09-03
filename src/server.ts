import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from './db/prisma.js';
import { PlayerService } from './services/playerService.js';
import { GymService } from './services/gymService.js';
import { InventoryService } from './services/inventoryService.js';
import { CrimeService } from './services/crimeService.js';
import { BlackMarketService } from './services/blackMarketService.js';
import { FactionService } from './services/factionService.js';
import { BountyService } from './services/bountyService.js';
import { CasinoService } from './services/casinoService.js';
import { InvestmentService } from './services/investmentService.js';
import { BossService, calculateBossBodyParts, getOrGenerateWeakSpot } from './services/bossService.js';
import { ShopService, SHOP_CATEGORIES } from './services/shopService.js';
import { EducationService } from './services/educationService.js';
import { PropertyService } from './services/propertyService.js';
import { ProfessionService } from './services/professionService.js';
import { MissionService } from './services/missionService.js';
import { MasteryService } from './services/masteryService.js';
import { TravelService } from './services/travelService.js';
import { DrugAndBoosterService } from './services/drugAndBoosterService.js';
import { CombatService } from './services/combatService.js';
import { RacingService } from './services/racingService.js';
import { WarfareService } from './services/warfareService.js';
import { CompanyService, COMPANY_TYPES } from './services/companyService.js';
import {
  GYMS,
  CRIMES,
  COURSES,
  PROPERTIES,
  PROFESSIONS,
  DESTINATIONS,
  TRACKS,
  INITIAL_STOCKS,
  PERKS,
} from './config/gameData.js';
import { activityFeedService } from './services/activityFeedService.js';

dotenv.config();

const SESSION_JWT_SECRET = process.env.SESSION_JWT_SECRET || 'super_secret_jwt_key_change_in_production';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    discordId: string;
    guildId: string;
    playerId: string;
  };
}

// Middleware de autenticación Stateless por JWT
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó token de autorización.' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'DEV_MOCK_JWT_TOKEN') {
    req.user = {
      discordId: '1364741760055775262',
      guildId: 'GLOBAL',
      playerId: 'dev-1',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, SESSION_JWT_SECRET) as {
      discordId: string;
      guildId: string;
      playerId: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado. Solicita renovación vía /api/auth/refresh.' });
  }
}

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);

  // Servidor Socket.io para comunicación en tiempo real
  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
    path: '/socket.io',
  });

  activityFeedService.setSocketServer(io);

  // Middleware de Auth para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Autenticación requerida para WebSocket.'));
    }

    try {
      const decoded = jwt.verify(token, SESSION_JWT_SECRET) as {
        discordId: string;
        guildId: string;
        playerId: string;
      };
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Token WebSocket inválido o expirado.'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`🔌 [Socket.io] Conectado usuario: ${user?.discordId}`);

    if (user?.discordId) {
      socket.join(`user:${user.discordId}`);
    }

    // Unirse a sala de instancia multijugador efímera (instanceId) si se especifica
    socket.on('join_instance', (instanceId: string) => {
      if (instanceId) {
        socket.join(`instance:${instanceId}`);
        console.log(`🏰 [Socket.io] Usuario ${user?.discordId} se unió a la sala instance:${instanceId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Desconectado usuario: ${user?.discordId}`);
    });
  });

  // Reescritura de compatibilidad para /.proxy/api y /api
  const apiRouter = express.Router();

  // -------------------------------------------------------------
  // AUTENTICACIÓN OAUTH2 & JWT
  // -------------------------------------------------------------

  // 1. Intercambio de OAuth2 code por access_token de Discord y emisión de JWT propio
  apiRouter.post('/auth/token', async (req: Request, res: Response) => {
    try {
      console.log('📩 [Backend Auth] Recibida petición en /api/auth/token:', req.body);
      const { code, guildId = 'GLOBAL' } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Falta parámetro "code".' });
      }

      if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Credenciales de Discord no configuradas en el servidor.' });
      }

      // Intercambiar code con Discord OAuth2 API
      // NOTA: Para Activities, NO se usa redirect_uri porque el code viene
      // del comando RPC authorize() del SDK, no de un flujo de redirect.
      const tokenParams = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      });

      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('❌ Error OAuth2 Discord:', errorData);
        return res.status(400).json({ error: 'Error al intercambiar código OAuth2 con Discord.' });
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };

      // Validar usuario consultando /users/@me (1 sola vez)
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
        return res.status(401).json({ error: 'No se pudo obtener información del usuario desde Discord.' });
      }

      const userData = (await userResponse.json()) as {
        id: string;
        username: string;
        global_name?: string;
      };

      // Registrar o recuperar jugador en la base de datos
      const player = await PlayerService.registerPlayer(
        userData.id,
        userData.global_name || userData.username,
        guildId
      );

      // Persistir el refresh_token de Discord en PostgreSQL
      await prisma.player.update({
        where: { id: player.id },
        data: { discordRefreshToken: tokenData.refresh_token },
      });

      // Emitir Session JWT propio de 15 minutos
      const sessionJwt = jwt.sign(
        {
          discordId: userData.id,
          guildId: player.guildId,
          playerId: player.id,
        },
        SESSION_JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        access_token: tokenData.access_token,
        token: sessionJwt,
        user: {
          id: player.id,
          discordId: userData.id,
          username: player.username,
        },
      });
    } catch (error: any) {
      console.error('❌ Error en /api/auth/token:', error);
      return res.status(500).json({ error: 'Error interno del servidor en autenticación.' });
    }
  });

  function checkModuleLevel(res: Response, playerLevel: number, requiredLevel: number, moduleName: string): boolean {
    if (playerLevel < requiredLevel) {
      res.status(403).json({
        error: `🔒 Acceso restringido: El módulo ${moduleName} requiere Nivel ${requiredLevel} (Tu nivel actual: Nivel ${playerLevel}).`,
      });
      return false;
    }
    return true;
  }

  // 2. Renovación de JWT expirado usando el refresh_token guardado en DB
  apiRouter.post('/auth/refresh', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Se requiere token actual en Authorization header.' });
      }

      const currentJwt = authHeader.split(' ')[1];
      let decoded: any;

      try {
        // Ignorar expiración para leer el discordId del JWT de 15m vencido
        decoded = jwt.verify(currentJwt, SESSION_JWT_SECRET, { ignoreExpiration: true });
      } catch (err) {
        return res.status(401).json({ error: 'Firma de token inválida.' });
      }

      const discordId = decoded?.discordId;
      if (!discordId) {
        return res.status(401).json({ error: 'Payload de token no válido.' });
      }

      // Buscar el refresh_token persistido en PostgreSQL
      const player = await prisma.player.findFirst({
        where: { discordId },
      });

      if (!player || !player.discordRefreshToken) {
        return res.status(401).json({ error: 'No existe refresh token guardado para este usuario.' });
      }

      if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Credenciales de Discord no configuradas.' });
      }

      // Intercambiar refresh_token con Discord OAuth2 API
      const refreshParams = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: player.discordRefreshToken,
      });

      const refreshResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refreshParams.toString(),
      });

      if (!refreshResponse.ok) {
        return res.status(401).json({ error: 'El refresh token de Discord ha sido revocado o ha expirado.' });
      }

      const refreshData = (await refreshResponse.json()) as {
        access_token: string;
        refresh_token: string;
      };

      // Actualizar el refresh_token en PostgreSQL si rotó
      if (refreshData.refresh_token) {
        await prisma.player.update({
          where: { id: player.id },
          data: { discordRefreshToken: refreshData.refresh_token },
        });
      }

      // Reemitir nuevo Session JWT propio por 15 minutos
      const newSessionJwt = jwt.sign(
        {
          discordId: player.discordId,
          guildId: player.guildId,
          playerId: player.id,
        },
        SESSION_JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        access_token: refreshData.access_token,
        token: newSessionJwt,
      });
    } catch (error: any) {
      console.error('❌ Error en /api/auth/refresh:', error);
      return res.status(500).json({ error: 'Error interno al renovar credenciales.' });
    }
  });

  // -------------------------------------------------------------
  // RUTAS PROTEGIDAS DEL JUEGO (REST API)
  // -------------------------------------------------------------

  // Feed de Actividad del Distrito
  apiRouter.get('/activity/recent', (_req: Request, res: Response) => {
    return res.json({ activities: activityFeedService.getRecentActivities(25) });
  });

  // Perfil del jugador y Salud Corporal
  apiRouter.get('/player/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      // Mapear BigInt a Number/String para serialización JSON limpia
      const serialized = JSON.parse(
        JSON.stringify(player, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      return res.json({ player: serialized });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener perfil del jugador.' });
    }
  });

  // Entrenamiento en Gimnasio
  apiRouter.post('/gym/train', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { stat, energyAmount = 5 } = req.body;

      if (!['strength', 'defense', 'speed', 'dexterity'].includes(stat)) {
        return res.status(400).json({ error: 'Stat de entrenamiento inválida.' });
      }

      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      // 5 de energía por cada trainCount
      const trainCount = Math.max(1, Math.floor(Number(energyAmount) / 5));
      const result = await GymService.trainStat(player.id, stat as any, trainCount);
      
      // Avanzar misión diaria de entrenamiento
      await MissionService.progressMission(player.id, 'TRAINING', trainCount);

      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      // Notificar cambio de estado vía Socket.io si la conexión está activa
      io.to(`user:${discordId}`).emit('player_stats_updated', serialized);

      return res.json({ gains: result.gain, ...serialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error durante el entrenamiento.' });
    }
  });
  apiRouter.get('/gym/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const currentGym = GymService.getGymByTier(player.gymTier);
      const nextGym = GYMS.find((g) => g.tier === player.gymTier + 1) || null;

      return res.json({
        gymTier: player.gymTier,
        gymExp: player.gymExp,
        currentGym,
        nextGym,
        allGyms: GYMS,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener información del gimnasio.' });
    }
  });

  // Mejorar membresía de Gimnasio
  apiRouter.post('/gym/upgrade', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const newGym = await GymService.upgradeGym(player.id);
      
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const serialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      io.to(`user:${discordId}`).emit('player_stats_updated', serialized);

      return res.json({ success: true, newGym, player: serialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al mejorar el gimnasio.' });
    }
  });

  // Inventario
  apiRouter.get('/inventory', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const inventory = await prisma.inventoryItem.findMany({
        where: { playerId: player.id },
        include: { item: true },
      });

      const serialized = JSON.parse(
        JSON.stringify(inventory, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      return res.json({ inventory: serialized });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener inventario.' });
    }
  });

  // Usar Objeto del Inventario
  apiRouter.post('/inventory/use', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { itemId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const invItem = await prisma.inventoryItem.findFirst({
        where: { playerId: player.id, itemId },
        include: { item: true },
      });

      if (!invItem || invItem.quantity <= 0) {
        return res.status(400).json({ error: 'No posees este objeto en tu inventario.' });
      }

      if (invItem.quantity === 1) {
        await prisma.inventoryItem.delete({ where: { id: invItem.id } });
      } else {
        await prisma.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: invItem.quantity - 1 },
        });
      }

      // Avanzar misión diaria de ítems
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ success: true, item: invItem.item, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar objeto.' });
    }
  });

  // Lista de Crímenes disponibles
  apiRouter.get('/crimes', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ crimes: CRIMES });
  });

  // Ejecución de Crimen
  apiRouter.post('/crimes/commit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { crimeId } = req.body;

      if (!crimeId) {
        return res.status(400).json({ error: 'Falta parámetro "crimeId".' });
      }

      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const result = await CrimeService.commitCrime(player.id, crimeId);
      
      // Avanzar misión diaria de crímenes si tuvo éxito
      if (result.success) {
        await MissionService.progressMission(player.id, 'CRIMES', 1);
      }

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const serialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      io.to(`user:${discordId}`).emit('player_stats_updated', serialized);

      // Log de Actividad en vivo
      const crimeInfo = CRIMES.find((c) => c.id === crimeId);
      if (result.success) {
        activityFeedService.logActivity(
          'CRIME',
          '[CRIMEN]',
          `${player.username} ejecutó con éxito '${crimeInfo?.name || crimeId}'`
        );
      } else {
        activityFeedService.logActivity(
          'CRIME',
          '[ALERTA]',
          `${player.username} falló la operación '${crimeInfo?.name || crimeId}'`,
          'text-rose-400'
        );
      }

      return res.json({ ...result, player: serialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar crimen.' });
    }
  });

  // Mercado Negro Estado & Catálogo de Armas
  apiRouter.get('/market/blackmarket', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const data = await BlackMarketService.getOrCreateActiveBlackMarket(guildId, player?.id);
      const serialized = JSON.parse(
        JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json(serialized);
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener estado del Mercado Negro.' });
    }
  });

  // Compra en Mercado Negro (Armas Balísticas & Contrabando)
  apiRouter.post('/market/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { itemType, itemId } = req.body;
      const targetId = itemId || itemType;

      if (!targetId) {
        return res.status(400).json({ error: 'Falta parámetro "itemId" o "itemType".' });
      }

      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const result = await BlackMarketService.buyBlackMarketItem(player.id, targetId);
      
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const serialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const serializedResult = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      io.to(`user:${discordId}`).emit('player_stats_updated', serialized);

      return res.json({ ...serializedResult, player: serialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar en el Mercado Negro.' });
    }
  });

  // Información de Facción del Jugador
  apiRouter.get('/faction', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const member = await prisma.factionMember.findUnique({
        where: { playerId: player.id },
        include: { faction: { include: { members: true } } },
      });

      if (!member) {
        return res.json({ hasFaction: false });
      }

      const serialized = JSON.parse(
        JSON.stringify(member.faction, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      return res.json({ hasFaction: true, faction: serialized });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener información de Facción.' });
    }
  });

  // Depositar en Tesorería
  apiRouter.post('/faction/deposit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { amount } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await FactionService.depositTreasury(player.id, BigInt(amount || 10000));
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al depositar en la tesorería.' });
    }
  });

  // Lista de Bounties activos
  apiRouter.get('/bounties', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const bounties = await BountyService.getActiveBounties();
      const serialized = JSON.parse(
        JSON.stringify(bounties, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json({ bounties: serialized });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener lista de recompensas.' });
    }
  });

  // Colocar una recompensa sobre un objetivo
  apiRouter.post('/bounties/place', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { targetDiscordId, rewardCash } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BountyService.placeBounty(player.id, targetDiscordId, BigInt(rewardCash || 5000));
      activityFeedService.logActivity(
        'BOUNTY',
        '[RECOMPENSA]',
        `${player.username} colocó una recompensa de $${Number(rewardCash || 5000).toLocaleString()} sobre un objetivo.`
      );
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al publicar la recompensa.' });
    }
  });

  // Casino: Slots
  apiRouter.post('/casino/slots', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { betAmount } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CasinoService.playSlots(player.id, BigInt(betAmount || 5000));
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      if (result.isWin) {
        activityFeedService.logActivity(
          'CASINO',
          '[CASINO]',
          `${player.username} ganó $${Number(result.netGain).toLocaleString()} en Tragamonedas!`
        );
      }
      return res.json(serialized);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en las tragamonedas del casino.' });
    }
  });

  // Casino: Blackjack
  apiRouter.post('/casino/blackjack', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { betAmount } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CasinoService.playBlackjack(player.id, BigInt(betAmount || 10000));
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json(serialized);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en el Blackjack del casino.' });
    }
  });

  // Banco e Inversiones
  apiRouter.get('/bank/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const investments = await prisma.bankInvestment.findMany({
        where: { playerId: player.id },
        orderBy: { createdAt: 'desc' },
      });
      const stocks = await prisma.playerStock.findMany({
        where: { playerId: player.id },
      });

      const serializedInvestments = JSON.parse(
        JSON.stringify(investments, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      const serializedStocks = JSON.parse(
        JSON.stringify(stocks, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      return res.json({ investments: serializedInvestments, stocks: serializedStocks, initialStocks: INITIAL_STOCKS });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener datos bancarios.' });
    }
  });

  apiRouter.post('/bank/invest', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { amount, durationDays = 7 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.createBankInvestment(player.id, BigInt(amount), Number(durationDays));
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...serialized, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al realizar inversión.' });
    }
  });

  apiRouter.post('/bank/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { investmentId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.claimBankInvestment(player.id, investmentId);
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...serialized, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al cobrar inversión.' });
    }
  });

  // Prisión (Jail)
  apiRouter.get('/jail/list', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const jailed = await CrimeService.getJailedPlayers();
      const serialized = JSON.parse(
        JSON.stringify(jailed, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json({ prisoners: serialized });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener prisioneros.' });
    }
  });

  apiRouter.post('/jail/bail', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { jailedPlayerId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.payBail(player.id, jailedPlayerId);
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...serialized, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al pagar la fianza.' });
    }
  });

  apiRouter.post('/jail/bust', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { jailedPlayerId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.bustPlayer(player.id, jailedPlayerId);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al intentar rescate en prisión.' });
    }
  });

  apiRouter.post('/jail/self-bust', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.selfBust(player.id);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al intentar fuga propia.' });
    }
  });

  // World Boss Raid
  apiRouter.get('/boss/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { guildId } = req.user!;
      const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
      const bodyParts = calculateBossBodyParts(boss.currentHp, boss.maxHp);
      const activeWeakSpot = getOrGenerateWeakSpot(boss.id);
      const serialized = JSON.parse(
        JSON.stringify(boss, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json({ boss: { ...serialized, bodyParts, activeWeakSpot } });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener Boss activo.' });
    }
  });

  apiRouter.post('/boss/attack', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { bossId, actionType = 'ATK_PRIMARY', targetPart = 'TORSO' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.attackBoss(player.id, bossId, actionType, targetPart);

      // Avanzar misión diaria de ataques
      await MissionService.progressMission(player.id, 'ATTACKS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      // Emitir evento público a toda la ciudad de combate contra World Boss en vivo
      io.emit('world_boss_attack_event', {
        playerName: player.username,
        bossName: result.bossName,
        damageDealt: result.damageDealt,
        bossPartStruck: result.bossPartStruck,
        isCrit: result.isCrit,
        isWeakSpotHit: result.isWeakSpotHit,
        remainingBossHp: result.remainingBossHp,
        bossMaxHp: result.bossMaxHp,
        timestamp: new Date().toISOString(),
      });

      return res.json({ result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al atacar al Jefe de Ciudad.' });
    }
  });

  apiRouter.post('/boss/quick-heal', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.quickMedicalHeal(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar botiquín rápido.' });
    }
  });

  apiRouter.post('/boss/quick-energy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.quickEnergyDrink(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al consumir energizante.' });
    }
  });

  // Tienda General (Shop)
  apiRouter.get('/shop/catalog', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const catIndex = Number(req.query.catIndex || 0);
      const items = await ShopService.getCatalogByCategory(catIndex);
      return res.json({ items, categories: SHOP_CATEGORIES });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener catálogo de la tienda.' });
    }
  });

  apiRouter.post('/shop/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { itemId, quantity = 1 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ShopService.buyItem(player.id, itemId, Number(quantity));
      const serialized = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...serialized, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar objeto en la tienda.' });
    }
  });

  // Educación
  apiRouter.get('/education/courses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const activeCourse = await EducationService.getActiveCourse(player.id);
      return res.json({ courses: COURSES, activeCourse });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener cursos universitarios.' });
    }
  });

  apiRouter.post('/education/enroll', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { courseId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await EducationService.enrollCourse(player.id, courseId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al matricularse en el curso.' });
    }
  });

  // Propiedades / Bienes Raíces
  apiRouter.get('/property/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const property = await PropertyService.getPlayerProperty(player.id);
      return res.json({ property, availableProperties: PROPERTIES });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener información inmobiliaria.' });
    }
  });

  apiRouter.post('/property/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { propertyType } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await PropertyService.buyProperty(player.id, propertyType);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ property: result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al adquirir propiedad.' });
    }
  });

  // Profesiones / Especializaciones
  apiRouter.get('/profession/list', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ professions: PROFESSIONS });
  });

  apiRouter.post('/profession/choose', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { profession } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ProfessionService.chooseProfession(player.id, profession);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al seleccionar profesión.' });
    }
  });

  // Misiones Diarias
  apiRouter.get('/missions/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const { missions: rawMissions, nextResetAt } = await MissionService.getMissions(player.id);
      const missions = JSON.parse(
        JSON.stringify(rawMissions, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json({ missions, nextResetAt });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener misiones diarias.' });
    }
  });

  // Recompensas / Bounties
  apiRouter.get('/bounty/list', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const bounties = await BountyService.getActiveBounties();
      const serialized = JSON.parse(
        JSON.stringify(bounties, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      return res.json({ bounties: serialized });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener lista de recompensas.' });
    }
  });

  apiRouter.post('/bounty/place', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { targetDiscordId, rewardCash } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });
      if (!checkModuleLevel(res, player.level, 3, 'Caza de Recompensas')) return;

      const result = await BountyService.placeBounty(player.id, targetDiscordId, BigInt(rewardCash));
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al colocar recompensa sobre el objetivo.' });
    }
  });

  // Bolsa de Valores / Stock Market
  apiRouter.get('/stocks/list', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const playerStocks = await prisma.playerStock.findMany({ where: { playerId: player.id } });
      return res.json({ stocks: INITIAL_STOCKS, playerStocks });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener información del mercado accionario.' });
    }
  });

  apiRouter.post('/stocks/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { symbol, shares = 1000 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.buyStockShares(player.id, symbol, Number(shares));
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar acciones en Bolsa.' });
    }
  });

  apiRouter.post('/stocks/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { symbol } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.claimWeeklyStockDividend(player.id, symbol);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al cobrar dividendos de acciones.' });
    }
  });

  // Maestría & Perks del Personaje
  apiRouter.get('/mastery/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const rawMastery = await MasteryService.getPlayerMastery(player.id);
      const levels = MasteryService.calculateMasteryLevels(rawMastery);
      return res.json({ mastery: rawMastery, levels, perks: PERKS });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener maestrías del jugador.' });
    }
  });

  apiRouter.post('/mastery/redeem', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { perkId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await MasteryService.redeemPerk(player.id, perkId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al canjear perk de maestría.' });
    }
  });

  // Viajes Internacionales & Suiza Detox
  apiRouter.get('/travel/state', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const travelState = await TravelService.getTravelState(player.id);
      return res.json({ travelState, destinations: DESTINATIONS });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener estado de viaje.' });
    }
  });

  apiRouter.post('/travel/fly', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { destinationId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const travelState = await TravelService.startTravel(player.id, destinationId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ travelState, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al iniciar vuelo internacional.' });
    }
  });

  apiRouter.post('/travel/return', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const travelState = await TravelService.returnHome(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ travelState, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al retornar a Sinford.' });
    }
  });

  apiRouter.post('/travel/detox', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.detoxifyInSwitzerland(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en desintoxicación médica.' });
    }
  });

  // Drogas & Boosters Clandestinos
  apiRouter.post('/drugs/take', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { drugId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.takeDrug(player.id, drugId);

      // Avanzar misión diaria de uso de objetos
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al consumir droga.' });
    }
  });

  apiRouter.post('/boosters/use', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { boosterId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.useBooster(player.id, boosterId);

      // Avanzar misión diaria de uso de objetos
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar booster.' });
    }
  });

  // Combate PvP Directo entre Jugadores
  apiRouter.post('/combat/attack-player', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { targetDiscordId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const combatResult = await CombatService.executePvPCombat(discordId, targetDiscordId, guildId);

      // Avanzar misión diaria de ataques
      await MissionService.progressMission(player.id, 'ATTACKS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result: combatResult, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al iniciar combate PvP.' });
    }
  });

  apiRouter.post('/combat/post-action', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { winnerId, loserId, actionType } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player || player.id !== winnerId) {
        return res.status(403).json({ error: 'Solo el ganador puede elegir la acción posterior al combate.' });
      }

      const actionEnum = actionType as 'LEAVE' | 'MUG' | 'HOSPITALIZE';
      const result = await CombatService.resolvePostCombatAction(winnerId, loserId, actionEnum);
      await MissionService.progressMission(winnerId, 'ATTACKS', 1);

      // Record hit in warfare if in war
      await WarfareService.recordWarHit(winnerId, loserId);

      // Check bounty claim
      const bounty = await BountyService.checkAndClaimBounty(winnerId, loserId);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result, bounty, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar acción post-combate.' });
    }
  });

  // Drag Racing Ilegal
  apiRouter.get('/racing/info', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ tracks: TRACKS });
  });

  apiRouter.post('/racing/race', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { trackId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const raceResult = await RacingService.startRace(player.id, trackId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result: raceResult, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al competir en la carrera.' });
    }
  });

  // Facción Acciones Avanzadas
  apiRouter.post('/faction/create', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { name, description = '' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const faction = await FactionService.createFaction(player.id, name, description, guildId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ faction, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al crear facción.' });
    }
  });

  apiRouter.post('/faction/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { factionId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const member = await FactionService.joinFaction(player.id, factionId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ member, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al unirse a la facción.' });
    }
  });

  apiRouter.post('/faction/oc', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { ocName = 'Atraco al Camión Blindado' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await FactionService.executeOrganizedCrime(player.id, ocName);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ result, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar Crimen Organizado de Facción.' });
    }
  });

  // Equipar / Desequipar Armas en Inventario
  apiRouter.post('/inventory/equip', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { inventoryItemId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      await InventoryService.toggleEquipItem(player.id, inventoryItemId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ success: true, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al equipar/desequipar objeto.' });
    }
  });

  // Vender Ítem en Casa de Empeño (50% del valor)
  apiRouter.post('/inventory/sell', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { inventoryItemId, quantity = 1 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ShopService.sellItem(player.id, inventoryItemId, Number(quantity));
      const serializedResult = JSON.parse(
        JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ ...serializedResult, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al vender objeto del inventario.' });
    }
  });

  // 🏢 Empresas de Jugadores
  apiRouter.get('/company/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const company = await prisma.company.findUnique({ where: { ownerId: player.id } });
      const serializedCompany = company
        ? JSON.parse(JSON.stringify(company, (_, value) => (typeof value === 'bigint' ? value.toString() : value)))
        : null;

      return res.json({ company: serializedCompany, companyTypes: COMPANY_TYPES });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener información de empresa.' });
    }
  });

  apiRouter.post('/company/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { type, name } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const company = await CompanyService.buyCompany(player.id, type, name, guildId);
      const serializedCompany = JSON.parse(
        JSON.stringify(company, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ company: serializedCompany, player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar empresa.' });
    }
  });

  apiRouter.post('/company/collect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CompanyService.collectCompanyRevenue(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${discordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ revenueCollected: result.revenueCollected.toString(), player: playerSerialized });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al retirar ganancias de la empresa.' });
    }
  });

  // 🛠️ Panel de Administración Exclusivo (Discord ID: 287396390747766795)
  const AUTHORIZED_ADMIN_DISCORD_ID = '287396390747766795';

  const requireAdminGuard = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.discordId !== AUTHORIZED_ADMIN_DISCORD_ID) {
      return res.status(403).json({ error: '🔒 Acceso denegado: Se requiere autorización de Desarrollador Principal.' });
    }
    next();
  };

  apiRouter.post('/admin/give-cash', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId, amount = '1000000' } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      await prisma.wallet.update({
        where: { playerId: target.id },
        data: { cash: { increment: BigInt(amount) } },
      });

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ message: `Se otorgaron $${BigInt(amount).toLocaleString()} a ${target.username}.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en comando de administración.' });
    }
  });

  apiRouter.post('/admin/reset-energy', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      const stats = await prisma.stats.findUnique({ where: { playerId: target.id } });
      if (stats) {
        await prisma.stats.update({
          where: { playerId: target.id },
          data: { energy: stats.maxEnergy },
        });
      }

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ message: `Energía de ${target.username} restaurada al 100%.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al restaurar energía.' });
    }
  });

  apiRouter.post('/admin/set-level', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId, level = 10 } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      await prisma.player.update({
        where: { id: target.id },
        data: { level: Number(level) },
      });

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      const playerSerialized = JSON.parse(
        JSON.stringify(updatedPlayer, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
      );
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', playerSerialized);

      return res.json({ message: `Nivel de ${target.username} actualizado a Nivel ${level}.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al fijar nivel.' });
    }
  });

  // Registrar sub-router con soporte tanto para /api como /.proxy/api
  app.use('/api', apiRouter);
  app.use('/.proxy/api', apiRouter);

  return { app, server, io };
}
