import express, { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { PlayerService } from '../services/playerService.js';
import { GymService } from '../services/gymService.js';
import { CrimeService } from '../services/crimeService.js';
import { BlackMarketService } from '../services/blackMarketService.js';
import { FactionService } from '../services/factionService.js';
import { BountyService } from '../services/bountyService.js';
import { CasinoService } from '../services/casinoService.js';
import { InvestmentService } from '../services/investmentService.js';
import { BossService, calculateBossBodyParts, getOrGenerateWeakSpot } from '../services/bossService.js';
import { ShopService, SHOP_CATEGORIES } from '../services/shopService.js';
import { EducationService } from '../services/educationService.js';
import { PropertyService } from '../services/propertyService.js';
import { ProfessionService } from '../services/professionService.js';
import { MissionService } from '../services/missionService.js';
import { MasteryService } from '../services/masteryService.js';
import { TravelService } from '../services/travelService.js';
import { DrugAndBoosterService } from '../services/drugAndBoosterService.js';
import { CombatService } from '../services/combatService.js';
import { RacingService } from '../services/racingService.js';
import { WarfareService } from '../services/warfareService.js';
import { CompanyService, COMPANY_TYPES } from '../services/companyService.js';
import { InventoryService } from '../services/inventoryService.js';

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
} from '../config/gameData.js';
import { activityFeedService } from '../services/activityFeedService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { checkModuleLevel } from './authRoutes.js';
import { serializeBigInt } from '../utils/serializer.js';

export function createGameRouter(io: SocketIOServer) {
  const gameRouter = express.Router();

  // Entrenamiento en Gimnasio
  gameRouter.post('/gym/train', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      const trainCount = Math.max(1, Math.floor(Number(energyAmount) / 5));
      const result = await GymService.trainStat(player.id, stat as any, trainCount);

      await MissionService.progressMission(player.id, 'TRAINING', trainCount);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(result));

      return res.json({ gains: result.gain, ...result });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error durante el entrenamiento.' });
    }
  });

  gameRouter.get('/gym/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  gameRouter.post('/gym/upgrade', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const newGym = await GymService.upgradeGym(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ success: true, newGym, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al mejorar el gimnasio.' });
    }
  });

  // Lista de Crímenes disponibles
  gameRouter.get('/crimes', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ crimes: CRIMES });
  });

  // Ejecución de Crimen
  gameRouter.post('/crimes/commit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      if (result.success) {
        await MissionService.progressMission(player.id, 'CRIMES', 1);
      }

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

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

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar crimen.' });
    }
  });

  // Mercado Negro Estado & Catálogo de Armas
  gameRouter.get('/market/blackmarket', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const data = await BlackMarketService.getOrCreateActiveBlackMarket(guildId, player?.id);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener estado del Mercado Negro.' });
    }
  });

  // Compra en Mercado Negro
  gameRouter.post('/market/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar en el Mercado Negro.' });
    }
  });

  // Información de Facción del Jugador
  gameRouter.get('/faction', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      return res.json({ hasFaction: true, faction: member.faction });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener información de Facción.' });
    }
  });

  // Depositar en Tesorería
  gameRouter.post('/faction/deposit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  gameRouter.get('/bounties', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const bounties = await BountyService.getActiveBounties();
      return res.json({ bounties });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener lista de recompensas.' });
    }
  });

  // Colocar una recompensa sobre un objetivo
  gameRouter.post('/bounties/place', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  gameRouter.post('/casino/slots', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { betAmount } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CasinoService.playSlots(player.id, BigInt(betAmount || 5000));
      if (result.isWin) {
        activityFeedService.logActivity(
          'CASINO',
          '[CASINO]',
          `${player.username} ganó $${Number(result.netGain).toLocaleString()} en Tragamonedas!`
        );
      }
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en las tragamonedas del casino.' });
    }
  });

  // Casino: Blackjack
  gameRouter.post('/casino/blackjack', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { betAmount } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CasinoService.playBlackjack(player.id, BigInt(betAmount || 10000));
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en el Blackjack del casino.' });
    }
  });

  // Banco e Inversiones
  gameRouter.get('/bank/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      return res.json({ investments, stocks, initialStocks: INITIAL_STOCKS });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener datos bancarios.' });
    }
  });

  gameRouter.post('/bank/invest', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { amount, durationDays = 7 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.createBankInvestment(player.id, BigInt(amount), Number(durationDays));
      await MissionService.progressMission(player.id, 'BANK', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al realizar inversión.' });
    }
  });

  gameRouter.post('/bank/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { investmentId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.claimBankInvestment(player.id, investmentId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al cobrar inversión.' });
    }
  });

  // Prisión (Jail)
  gameRouter.get('/jail/list', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const jailed = await CrimeService.getJailedPlayers();
      return res.json({ prisoners: jailed });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener prisioneros.' });
    }
  });

  gameRouter.post('/jail/bail', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { jailedPlayerId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.payBail(player.id, jailedPlayerId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al pagar la fianza.' });
    }
  });

  gameRouter.post('/jail/bust', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { jailedPlayerId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.bustPlayer(player.id, jailedPlayerId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al intentar rescate en prisión.' });
    }
  });

  gameRouter.post('/jail/self-bust', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CrimeService.selfBust(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al intentar fuga propia.' });
    }
  });

  // World Boss Raid
  gameRouter.get('/boss/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { guildId } = req.user!;
      const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
      const bodyParts = calculateBossBodyParts(boss.currentHp, boss.maxHp);
      const activeWeakSpot = getOrGenerateWeakSpot(boss.id);

      return res.json({ boss: { ...boss, bodyParts, activeWeakSpot } });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener Boss activo.' });
    }
  });

  gameRouter.post('/boss/attack', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { bossId, actionType = 'ATK_PRIMARY', targetPart = 'TORSO' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.attackBoss(player.id, bossId, actionType, targetPart);

      await MissionService.progressMission(player.id, 'ATTACKS', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

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

      return res.json({ result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al atacar al Jefe de Ciudad.' });
    }
  });

  gameRouter.post('/boss/quick-heal', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.quickMedicalHeal(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar botiquín rápido.' });
    }
  });

  gameRouter.post('/boss/quick-energy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await BossService.quickEnergyDrink(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al consumir energizante.' });
    }
  });

  // Tienda General (Shop)
  gameRouter.get('/shop/catalog', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const catIndex = Number(req.query.catIndex || 0);
      const items = await ShopService.getCatalogByCategory(catIndex);
      return res.json({ items, categories: SHOP_CATEGORIES });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener catálogo de la tienda.' });
    }
  });

  gameRouter.post('/shop/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { itemId, quantity = 1 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ShopService.buyItem(player.id, itemId, Number(quantity));
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar objeto en la tienda.' });
    }
  });

  // Educación
  gameRouter.get('/education/courses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const activeCourse = await EducationService.getActiveCourse(player.id);
      const completedCourses = await EducationService.getCompletedCourses(player.id);
      const activeModifiers = await EducationService.getEducationModifiers(player.id);

      return res.json({
        courses: COURSES,
        activeCourse,
        completedCourses,
        activeModifiers,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener cursos universitarios.' });
    }
  });

  gameRouter.post('/education/enroll', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { courseId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await EducationService.enrollCourse(player.id, courseId);
      await MissionService.progressMission(player.id, 'EDUCATION', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al matricularse en el curso.' });
    }
  });

  // Propiedades / Bienes Raíces
  gameRouter.get('/property/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  gameRouter.post('/property/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { propertyType } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await PropertyService.buyProperty(player.id, propertyType);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ property: result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al adquirir propiedad.' });
    }
  });

  // Profesiones / Especializaciones
  gameRouter.get('/profession/list', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ professions: PROFESSIONS });
  });

  gameRouter.post('/profession/choose', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { profession } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ProfessionService.chooseProfession(player.id, profession);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al seleccionar profesión.' });
    }
  });

  // Misiones Diarias
  gameRouter.get('/missions/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const periodicity = ((req.query.periodicity as string) || 'DAILY').toUpperCase() as any;

      if (req.query.all === 'true') {
        const daily = await MissionService.getMissions(player.id, 'DAILY');
        const weekly = await MissionService.getMissions(player.id, 'WEEKLY');
        const monthly = await MissionService.getMissions(player.id, 'MONTHLY');

        return res.json({ daily, weekly, monthly });
      }

      const result = await MissionService.getMissions(player.id, periodicity);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener misiones.' });
    }
  });

  gameRouter.post('/missions/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { missionId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await MissionService.claimMissionReward(player.id, missionId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al reclamar misión.' });
    }
  });

  gameRouter.post('/missions/claim-chest', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const periodicity = (req.body.periodicity || 'DAILY').toUpperCase() as any;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await MissionService.claimChestToInventory(player.id, periodicity);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al reclamar el Cofre al inventario.' });
    }
  });

  // Recompensas / Bounties
  gameRouter.get('/bounty/list', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      const bounties = await BountyService.getActiveBounties();
      return res.json({ bounties, isHitman: player?.profession === 'SICARIO' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener lista de recompensas.' });
    }
  });

  gameRouter.post('/bounty/place', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { targetDiscordId, targetPlayerId, targetUsername, rewardCash, reason, isAnonymous } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });
      if (!checkModuleLevel(res, player.level, 3, 'Caza de Recompensas')) return;

      const targetIdentifier = targetPlayerId || targetDiscordId || targetUsername;
      if (!targetIdentifier) {
        return res.status(400).json({ error: 'Debes especificar un objetivo válido.' });
      }

      const result = await BountyService.placeBounty(
        player.id,
        targetIdentifier,
        BigInt(rewardCash),
        reason,
        Boolean(isAnonymous)
      );

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      activityFeedService.logActivity(
        'BOUNTY',
        '[RECOMPENSA]',
        `🎯 ${player.username} colocó un bounty de $${BigInt(rewardCash).toLocaleString()} sobre ${result.targetUsername}${isAnonymous ? ' (Anónimo)' : ''}.`
      );

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al colocar recompensa sobre el objetivo.' });
    }
  });

  gameRouter.get('/bounty/search-targets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const query = String(req.query.q || '');
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const targets = await BountyService.searchTargets(query, player.id);
      return res.json({ targets });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al buscar objetivos.' });
    }
  });

  // Bolsa de Valores / Stock Market
  gameRouter.get('/stocks/list', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  gameRouter.post('/stocks/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { symbol, shares = 1000 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.buyStockShares(player.id, symbol, Number(shares));
      await MissionService.progressMission(player.id, 'STOCKS', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar acciones en Bolsa.' });
    }
  });

  gameRouter.post('/stocks/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { symbol } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await InvestmentService.claimWeeklyStockDividend(player.id, symbol);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al cobrar dividendos de acciones.' });
    }
  });

  // Maestría & Perks del Personaje
  gameRouter.get('/mastery/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  gameRouter.post('/mastery/redeem', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { perkId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await MasteryService.redeemPerk(player.id, perkId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al canjear perk de maestría.' });
    }
  });

  // Viajes Internacionales & Suiza Detox
  gameRouter.get('/travel/state', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

  gameRouter.post('/travel/fly', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { destinationId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const travelState = await TravelService.startTravel(player.id, destinationId);
      await MissionService.progressMission(player.id, 'TRAVEL', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ travelState, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al iniciar vuelo internacional.' });
    }
  });

  gameRouter.post('/travel/return', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const travelState = await TravelService.returnHome(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ travelState, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al retornar a Sinford.' });
    }
  });

  gameRouter.post('/travel/detox', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.detoxifyInSwitzerland(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en desintoxicación médica.' });
    }
  });

  // Drogas & Boosters Clandestinos
  gameRouter.post('/drugs/take', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { drugId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.takeDrug(player.id, drugId);
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al consumir droga.' });
    }
  });

  gameRouter.post('/boosters/use', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { boosterId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await DrugAndBoosterService.useBooster(player.id, boosterId);
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar booster.' });
    }
  });

  // Combate PvP Directo entre Jugadores
  gameRouter.post('/combat/attack-player', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { targetDiscordId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const combatResult = await CombatService.executePvPCombat(discordId, targetDiscordId, guildId);
      await MissionService.progressMission(player.id, 'ATTACKS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result: combatResult, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al iniciar combate PvP.' });
    }
  });

  gameRouter.post('/combat/post-action', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      await WarfareService.recordWarHit(winnerId, loserId);
      const bounty = await BountyService.checkAndClaimBounty(winnerId, loserId);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result, bounty, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar acción post-combate.' });
    }
  });

  // Drag Racing Ilegal
  gameRouter.get('/racing/info', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ tracks: TRACKS });
  });

  gameRouter.post('/racing/race', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { trackId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const raceResult = await RacingService.startRace(player.id, trackId);
      await MissionService.progressMission(player.id, 'RACING', 1);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result: raceResult, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al competir en la carrera.' });
    }
  });

  // Facción Acciones Avanzadas
  gameRouter.post('/faction/create', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { name, description = '' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const faction = await FactionService.createFaction(player.id, name, description, guildId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ faction, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al crear facción.' });
    }
  });

  gameRouter.post('/faction/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { factionId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const member = await FactionService.joinFaction(player.id, factionId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ member, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al unirse a la facción.' });
    }
  });

  gameRouter.post('/faction/oc', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { ocName = 'Atraco al Camión Blindado' } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await FactionService.executeOrganizedCrime(player.id, ocName);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al ejecutar Crimen Organizado de Facción.' });
    }
  });

  // Equipar / Desequipar Armas en Inventario
  gameRouter.post('/inventory/equip', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { inventoryItemId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      await InventoryService.toggleEquipItem(player.id, inventoryItemId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ success: true, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al equipar/desequipar objeto.' });
    }
  });

  // Vender Ítem en Casa de Empeño (50% del valor)
  gameRouter.post('/inventory/sell', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { inventoryItemId, quantity = 1 } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await ShopService.sellItem(player.id, inventoryItemId, Number(quantity));
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ ...result, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al vender objeto del inventario.' });
    }
  });

  // 🏢 Empresas de Jugadores
  gameRouter.get('/company/info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const company = await prisma.company.findUnique({ where: { ownerId: player.id } });

      return res.json({ company, companyTypes: COMPANY_TYPES });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al obtener información de empresa.' });
    }
  });

  gameRouter.post('/company/buy', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { type, name } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const company = await CompanyService.buyCompany(player.id, type, name, guildId);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ company, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al comprar empresa.' });
    }
  });

  gameRouter.post('/company/collect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const result = await CompanyService.collectCompanyRevenue(player.id);
      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ revenueCollected: result.revenueCollected.toString(), player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al retirar ganancias de la empresa.' });
    }
  });

  return gameRouter;
}
