import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';

export type MissionType =
  | 'ATTACKS'
  | 'CRIMES'
  | 'ITEMS'
  | 'TRAINING'
  | 'BANK'
  | 'STOCKS'
  | 'BOUNTY'
  | 'RACING'
  | 'TRAVEL'
  | 'EDUCATION'
  | 'BOSS'
  | 'MARKET';

export interface MissionTemplate {
  title: string;
  description: string;
  type: MissionType;
  requirement: number;
  rewardCash: bigint;
  rewardXp: number;
}

export const MISSION_POOL: MissionTemplate[] = [
  // ── CRIMES ──
  { title: '🕵️ Maestro del Crimen', description: 'Comete 3 crímenes con éxito', type: 'CRIMES', requirement: 3, rewardCash: 1500n, rewardXp: 100 },
  { title: '🔪 Noche de Trabajo Sucio', description: 'Comete 6 crímenes con éxito', type: 'CRIMES', requirement: 6, rewardCash: 3500n, rewardXp: 250 },
  { title: '💀 Currículum del Hampa', description: 'Comete 10 crímenes con éxito', type: 'CRIMES', requirement: 10, rewardCash: 7500n, rewardXp: 500 },

  // ── TRAINING ──
  { title: '🏋️ Entrenamiento Pesado', description: 'Realiza 5 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 5, rewardCash: 2000n, rewardXp: 150 },
  { title: '💪 Sudando la Deuda', description: 'Realiza 8 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 8, rewardCash: 4000n, rewardXp: 300 },
  { title: '🦴 Sin Dolor No Hay Botín', description: 'Realiza 12 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 12, rewardCash: 8000n, rewardXp: 600 },

  // ── ATTACKS ──
  { title: '🥊 Buscabullas', description: 'Gana 2 peleas contra otros jugadores', type: 'ATTACKS', requirement: 2, rewardCash: 2500n, rewardXp: 200 },
  { title: '⚔️ Reputación de Calle', description: 'Gana 4 peleas contra otros jugadores', type: 'ATTACKS', requirement: 4, rewardCash: 5500n, rewardXp: 450 },
  { title: '🩸 El Terror del Barrio', description: 'Gana 7 peleas contra otros jugadores', type: 'ATTACKS', requirement: 7, rewardCash: 12000n, rewardXp: 800 },

  // ── ITEMS ──
  { title: '🎒 Vaciando el Bolsillo', description: 'Usa 3 objetos de tu inventario', type: 'ITEMS', requirement: 3, rewardCash: 1800n, rewardXp: 120 },
  { title: '💊 Cliente Frecuente', description: 'Usa 6 objetos de tu inventario', type: 'ITEMS', requirement: 6, rewardCash: 3800n, rewardXp: 280 },
  { title: '🧪 Probando de Todo un Poco', description: 'Usa 10 objetos de tu inventario', type: 'ITEMS', requirement: 10, rewardCash: 8500n, rewardXp: 550 },

  // ── BANK ──
  { title: '🏦 Inversionista Inicial', description: 'Realiza 1 inversión a plazo fijo en el banco', type: 'BANK', requirement: 1, rewardCash: 3000n, rewardXp: 200 },
  { title: '💼 Movimiento de Capitales', description: 'Realiza 2 inversiones bancarias', type: 'BANK', requirement: 2, rewardCash: 7000n, rewardXp: 400 },

  // ── STOCKS ──
  { title: '📊 Corredor de Bolsa', description: 'Realiza 1 compra o venta en la Bolsa de Valores', type: 'STOCKS', requirement: 1, rewardCash: 3500n, rewardXp: 220 },
  { title: '📈 Tiburón Financiero', description: 'Realiza 3 operaciones bursátiles', type: 'STOCKS', requirement: 3, rewardCash: 8000n, rewardXp: 500 },

  // ── BOUNTY ──
  { title: '🎯 Cazarrecompensas', description: 'Coloca o cobra 1 recompensa en el Tablón', type: 'BOUNTY', requirement: 1, rewardCash: 4500n, rewardXp: 300 },
  { title: '🕶️ Contrato del Sindicato', description: 'Completa o publica 2 contratos de Bounty', type: 'BOUNTY', requirement: 2, rewardCash: 10000n, rewardXp: 650 },

  // ── RACING ──
  { title: '🏎️ Pisotón al Acelerador', description: 'Compite en 1 carrera de Drag Racing', type: 'RACING', requirement: 1, rewardCash: 2800n, rewardXp: 180 },
  { title: '🏁 As del Volante', description: 'Compite en 3 carreras ilegales', type: 'RACING', requirement: 3, rewardCash: 6500n, rewardXp: 400 },

  // ── TRAVEL ──
  { title: '✈️ Pasaporte Sellado', description: 'Realiza 1 vuelo internacional', type: 'TRAVEL', requirement: 1, rewardCash: 3200n, rewardXp: 250 },
  { title: '🌍 Contrabandista Viajero', description: 'Realiza 2 vuelos internacionales', type: 'TRAVEL', requirement: 2, rewardCash: 7500n, rewardXp: 500 },

  // ── EDUCATION ──
  { title: '🎓 Mente Estudiosa', description: 'Matricúlate o avanza en un curso universitario', type: 'EDUCATION', requirement: 1, rewardCash: 2500n, rewardXp: 200 },
  { title: '📜 Grado Académico', description: 'Avanza en 2 clases o cursos en la Universidad', type: 'EDUCATION', requirement: 2, rewardCash: 6000n, rewardXp: 450 },

  // ── BOSS ──
  { title: '👹 Frente de Batalla', description: 'Asesta 1 ataque táctico contra el World Boss', type: 'BOSS', requirement: 1, rewardCash: 5000n, rewardXp: 400 },
  { title: '💥 Golpe Maestro al Jefe', description: 'Asesta 3 ataques tácticos al World Boss', type: 'BOSS', requirement: 3, rewardCash: 12000n, rewardXp: 850 },

  // ── MARKET ──
  { title: '🛍️ Cliente del Callejón', description: 'Adquiere 1 objeto en el Mercado Negro', type: 'MARKET', requirement: 1, rewardCash: 2500n, rewardXp: 180 },
];

export class MissionService {
  // Obtener fecha del próximo reinicio diario (00:00:00 UTC)
  static getNextDailyReset(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCHours(24, 0, 0, 0); // 00:00:00 UTC del día siguiente
    return nextReset;
  }

  // Inicializar o consultar misiones activas del ciclo diario actual
  static async getMissions(playerId: string) {
    const now = new Date();
    const nextReset = MissionService.getNextDailyReset();

    let missions = await prisma.playerMission.findMany({
      where: { playerId, expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' },
    });

    if (missions.length === 0) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      const level = player?.level || 1;

      // Multiplicador por Tier de Nivel del Jugador
      let rewardMultiplier = 1.0;
      if (level >= 16) rewardMultiplier = 3.5;
      else if (level >= 6) rewardMultiplier = 2.0;

      // Seleccionar 5 categorías aleatorias sin repetir tipo
      const allTypes: MissionType[] = [
        'CRIMES',
        'TRAINING',
        'ATTACKS',
        'ITEMS',
        'BANK',
        'STOCKS',
        'BOUNTY',
        'RACING',
        'TRAVEL',
        'EDUCATION',
        'BOSS',
        'MARKET',
      ];
      const selectedTypes = [...allTypes].sort(() => Math.random() - 0.5).slice(0, 5);

      const selectedMissions = selectedTypes.map((type) => {
        const poolForType = MISSION_POOL.filter((m) => m.type === type);
        const template = poolForType[Math.floor(Math.random() * poolForType.length)];

        return {
          title: template.title,
          description: template.description,
          type: template.type,
          requirement: template.requirement,
          rewardCash: BigInt(Math.floor(Number(template.rewardCash) * rewardMultiplier)),
          rewardXp: Math.floor(template.rewardXp * rewardMultiplier),
        };
      });

      await prisma.playerMission.createMany({
        data: selectedMissions.map((m) => ({
          playerId,
          title: m.title,
          description: m.description,
          type: m.type,
          requirement: m.requirement,
          rewardCash: m.rewardCash,
          rewardXp: m.rewardXp,
          isCompleted: false,
          isClaimed: false,
          expiresAt: nextReset,
        })),
      });

      missions = await prisma.playerMission.findMany({
        where: { playerId, expiresAt: { gt: now } },
        orderBy: { createdAt: 'asc' },
      });
    }

    const resetTime = missions[0]?.expiresAt || nextReset;
    const resetDateStr = resetTime.toISOString().split('T')[0];

    // Verificar si el Gran Cofre Diario ya fue reclamado hoy
    const chestCooldown = await prisma.cooldown.findFirst({
      where: {
        playerId,
        type: `DAILY_CHEST_${resetDateStr}`,
      },
    });

    const isAllCompleted = missions.length >= 5 && missions.every((m) => m.isCompleted);
    const isChestClaimed = Boolean(chestCooldown);
    const canClaimChest = isAllCompleted && !isChestClaimed;

    return {
      missions,
      canClaimChest,
      isChestClaimed,
      nextResetAt: resetTime.toISOString(),
    };
  }

  // Avanzar progreso de misión
  static async progressMission(playerId: string, type: MissionType, amount: number = 1) {
    const now = new Date();
    const activeMissions = await prisma.playerMission.findMany({
      where: { playerId, type, isCompleted: false, expiresAt: { gt: now } },
    });

    for (const mission of activeMissions) {
      const newProgress = mission.progress + amount;
      const isCompleted = newProgress >= mission.requirement;

      await prisma.playerMission.update({
        where: { id: mission.id },
        data: {
          progress: Math.min(newProgress, mission.requirement),
          isCompleted,
        },
      });
    }
  }

  // Reclamar recompensa individual de una misión completa
  static async claimMissionReward(playerId: string, missionId: string) {
    return prisma.$transaction(async (tx) => {
      const mission = await tx.playerMission.findUnique({ where: { id: missionId } });

      if (!mission || mission.playerId !== playerId) {
        throw new Error('Asignación no encontrada.');
      }

      if (!mission.isCompleted && mission.progress < mission.requirement) {
        throw new Error('Esta asignación aún no ha sido completada.');
      }

      if (mission.isClaimed) {
        throw new Error('Ya has reclamado la recompensa de esta asignación.');
      }

      // Marcar como reclamada
      await tx.playerMission.update({
        where: { id: missionId },
        data: { isClaimed: true, isCompleted: true },
      });

      // Entregar efectivo
      if (mission.rewardCash > 0n) {
        const wallet = await tx.wallet.findUnique({ where: { playerId } });
        if (wallet) {
          const balanceBefore = wallet.cash;
          const balanceAfter = wallet.cash + mission.rewardCash;

          await tx.wallet.update({
            where: { playerId },
            data: { cash: balanceAfter },
          });

          await tx.transaction.create({
            data: {
              playerId,
              amount: mission.rewardCash,
              balanceBefore,
              balanceAfter,
              type: 'MISSION_REWARD',
              source: 'SYSTEM',
              metadata: JSON.stringify({ missionTitle: mission.title }),
            },
          });
        }
      }

      // Entregar XP
      if (mission.rewardXp > 0) {
        await PlayerService.addXp(playerId, mission.rewardXp, tx);
      }

      return {
        missionTitle: mission.title,
        rewardCash: mission.rewardCash,
        rewardXp: mission.rewardXp,
      };
    });
  }

  // Reclamar Gran Cofre Diario (5/5 Misiones completadas)
  static async claimDailyChest(playerId: string) {
    const { missions, canClaimChest, isChestClaimed } = await this.getMissions(playerId);

    if (isChestClaimed) {
      throw new Error('Ya has reclamado el Cofre Diario del Sindicato hoy.');
    }

    if (!canClaimChest) {
      throw new Error('Debes completar las 5 asignaciones del día para desbloquear el Cofre Diario.');
    }

    const resetTime = missions[0]?.expiresAt || this.getNextDailyReset();
    const resetDateStr = resetTime.toISOString().split('T')[0];

    const chestCashReward = 50000n;
    const chestXpReward = 1000;

    return prisma.$transaction(async (tx) => {
      // Registrar cooldown diario
      await tx.cooldown.create({
        data: {
          playerId,
          type: `DAILY_CHEST_${resetDateStr}`,
          expiresAt: resetTime,
        },
      });

      // Acreditar dinero
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (wallet) {
        const balanceBefore = wallet.cash;
        const balanceAfter = wallet.cash + chestCashReward;

        await tx.wallet.update({
          where: { playerId },
          data: { cash: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            playerId,
            amount: chestCashReward,
            balanceBefore,
            balanceAfter,
            type: 'DAILY_CHEST_REWARD',
            source: 'SYNDICATE_CHEST',
            metadata: JSON.stringify({ rewardCash: chestCashReward.toString(), rewardXp: chestXpReward }),
          },
        });
      }

      // Acreditar XP
      await PlayerService.addXp(playerId, chestXpReward, tx);

      // Entregar ítem de regalo (First Aid Kit)
      const medItem = await tx.item.findFirst({ where: { name: 'First Aid Kit' } });
      if (medItem) {
        const existingInv = await tx.inventoryItem.findFirst({
          where: { playerId, itemId: medItem.id, slot: null },
        });
        if (existingInv) {
          await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: existingInv.quantity + 1 },
          });
        } else {
          await tx.inventoryItem.create({
            data: { playerId, itemId: medItem.id, quantity: 1 },
          });
        }
      }

      return {
        rewardCash: chestCashReward,
        rewardXp: chestXpReward,
        rewardItemName: 'First Aid Kit',
      };
    });
  }
}
