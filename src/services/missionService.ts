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

export type PeriodicityType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface MissionTemplate {
  title: string;
  description: string;
  type: MissionType;
  periodicity: PeriodicityType;
  minLevel: number;
  requirement: number;
  rewardCash: bigint;
  rewardXp: number;
}

export const MISSION_POOL: MissionTemplate[] = [
  // ==========================================
  // ☀️ 1. MISIONES DIARIAS (DAILY - MinLevel 1 a 15)
  // ==========================================
  // CRIMES
  { title: '🕵️ Maestro del Crimen', description: 'Comete 3 crímenes con éxito', type: 'CRIMES', periodicity: 'DAILY', minLevel: 1, requirement: 3, rewardCash: 1500n, rewardXp: 100 },
  { title: '🔪 Noche de Trabajo Sucio', description: 'Comete 6 crímenes con éxito', type: 'CRIMES', periodicity: 'DAILY', minLevel: 1, requirement: 6, rewardCash: 3500n, rewardXp: 250 },
  { title: '💀 Currículum del Hampa', description: 'Comete 10 crímenes con éxito', type: 'CRIMES', periodicity: 'DAILY', minLevel: 5, requirement: 10, rewardCash: 7500n, rewardXp: 500 },

  // TRAINING
  { title: '🏋️ Entrenamiento Pesado', description: 'Realiza 5 entrenamientos en el Gimnasio', type: 'TRAINING', periodicity: 'DAILY', minLevel: 1, requirement: 5, rewardCash: 2000n, rewardXp: 150 },
  { title: '💪 Sudando la Deuda', description: 'Realiza 8 entrenamientos en el Gimnasio', type: 'TRAINING', periodicity: 'DAILY', minLevel: 1, requirement: 8, rewardCash: 4000n, rewardXp: 300 },
  { title: '🦴 Sin Dolor No Hay Botín', description: 'Realiza 12 entrenamientos en el Gimnasio', type: 'TRAINING', periodicity: 'DAILY', minLevel: 5, requirement: 12, rewardCash: 8000n, rewardXp: 600 },

  // ATTACKS
  { title: '🥊 Buscabullas', description: 'Gana 2 peleas contra otros jugadores', type: 'ATTACKS', periodicity: 'DAILY', minLevel: 1, requirement: 2, rewardCash: 2500n, rewardXp: 200 },
  { title: '⚔️ Reputación de Calle', description: 'Gana 4 peleas contra otros jugadores', type: 'ATTACKS', periodicity: 'DAILY', minLevel: 3, requirement: 4, rewardCash: 5500n, rewardXp: 450 },

  // ITEMS
  { title: '🎒 Vaciando el Bolsillo', description: 'Usa 3 objetos de tu inventario', type: 'ITEMS', periodicity: 'DAILY', minLevel: 1, requirement: 3, rewardCash: 1800n, rewardXp: 120 },
  { title: '💊 Cliente Frecuente', description: 'Usa 6 objetos de tu inventario', type: 'ITEMS', periodicity: 'DAILY', minLevel: 1, requirement: 6, rewardCash: 3800n, rewardXp: 280 },

  // BANK & EDUCATION & MARKET (Nivel 1+)
  { title: '🏦 Inversionista Inicial', description: 'Realiza 1 inversión a plazo fijo en el banco', type: 'BANK', periodicity: 'DAILY', minLevel: 1, requirement: 1, rewardCash: 3000n, rewardXp: 200 },
  { title: '🎓 Mente Estudiosa', description: 'Matricúlate o avanza en un curso universitario', type: 'EDUCATION', periodicity: 'DAILY', minLevel: 1, requirement: 1, rewardCash: 2500n, rewardXp: 200 },
  { title: '🛍️ Cliente del Callejón', description: 'Adquiere 1 objeto en el Mercado Negro', type: 'MARKET', periodicity: 'DAILY', minLevel: 5, requirement: 1, rewardCash: 2500n, rewardXp: 180 },

  // ADVANCED MODULES (Nivel 3+, 5+, 10+, 15+)
  { title: '🎯 Cazarrecompensas', description: 'Coloca o cobra 1 recompensa en el Tablón', type: 'BOUNTY', periodicity: 'DAILY', minLevel: 3, requirement: 1, rewardCash: 4500n, rewardXp: 300 },
  { title: '🏎️ Pisotón al Acelerador', description: 'Compite en 1 carrera de Drag Racing', type: 'RACING', periodicity: 'DAILY', minLevel: 5, requirement: 1, rewardCash: 2800n, rewardXp: 180 },
  { title: '👹 Frente de Batalla', description: 'Asesta 1 ataque táctico contra el World Boss', type: 'BOSS', periodicity: 'DAILY', minLevel: 5, requirement: 1, rewardCash: 5000n, rewardXp: 400 },
  { title: '📊 Corredor de Bolsa', description: 'Realiza 1 compra o venta en la Bolsa de Valores', type: 'STOCKS', periodicity: 'DAILY', minLevel: 10, requirement: 1, rewardCash: 3500n, rewardXp: 220 },
  { title: '✈️ Pasaporte Sellado', description: 'Realiza 1 vuelo internacional', type: 'TRAVEL', periodicity: 'DAILY', minLevel: 15, requirement: 1, rewardCash: 3200n, rewardXp: 250 },


  // ==========================================
  // 📅 2. MISIONES SEMANALES (WEEKLY)
  // ==========================================
  { title: '⛓️ Imperio del Crimen Semanal', description: 'Comete 25 crímenes exitosos esta semana', type: 'CRIMES', periodicity: 'WEEKLY', minLevel: 1, requirement: 25, rewardCash: 25000n, rewardXp: 1500 },
  { title: '🏋️ Cultura Fisicoculturista', description: 'Realiza 40 entrenamientos en el Gimnasio', type: 'TRAINING', periodicity: 'WEEKLY', minLevel: 1, requirement: 40, rewardCash: 30000n, rewardXp: 1800 },
  { title: '🩸 Gladiador Urbano', description: 'Gana 15 peleas contra otros jugadores', type: 'ATTACKS', periodicity: 'WEEKLY', minLevel: 1, requirement: 15, rewardCash: 35000n, rewardXp: 2200 },
  { title: '🧪 Farmacia Ambulante', description: 'Usa 20 consumibles de tu inventario', type: 'ITEMS', periodicity: 'WEEKLY', minLevel: 1, requirement: 20, rewardCash: 20000n, rewardXp: 1200 },
  { title: '💼 Capitalista Semanal', description: 'Realiza 5 inversiones en el Banco', type: 'BANK', periodicity: 'WEEKLY', minLevel: 1, requirement: 5, rewardCash: 30000n, rewardXp: 1500 },
  { title: '🎓 Erudito de Sinford', description: 'Avanza en 5 lecciones universitarias', type: 'EDUCATION', periodicity: 'WEEKLY', minLevel: 1, requirement: 5, rewardCash: 25000n, rewardXp: 1600 },
  { title: '🎯 Contratista Peligroso', description: 'Completa o publica 5 Recompensas', type: 'BOUNTY', periodicity: 'WEEKLY', minLevel: 3, requirement: 5, rewardCash: 45000n, rewardXp: 2500 },
  { title: '🏎️ Rey del Asfalto', description: 'Compite en 10 carreras de Drag Racing', type: 'RACING', periodicity: 'WEEKLY', minLevel: 5, requirement: 10, rewardCash: 35000n, rewardXp: 2000 },
  { title: '💥 Castigador del Jefe', description: 'Asesta 10 ataques tácticos a World Bosses', type: 'BOSS', periodicity: 'WEEKLY', minLevel: 5, requirement: 10, rewardCash: 50000n, rewardXp: 3000 },
  { title: '📈 Inversor de Alto Riesgo', description: 'Realiza 10 operaciones en la Bolsa de Valores', type: 'STOCKS', periodicity: 'WEEKLY', minLevel: 10, requirement: 10, rewardCash: 40000n, rewardXp: 2200 },
  { title: '✈️ Pasajero Frecuente', description: 'Realiza 6 vuelos internacionales', type: 'TRAVEL', periodicity: 'WEEKLY', minLevel: 15, requirement: 6, rewardCash: 45000n, rewardXp: 2500 },


  // ==========================================
  // 🌕 3. MISIONES MENSUALES (MONTHLY)
  // ==========================================
  { title: '👑 Leyenda del Inframundo', description: 'Comete 100 crímenes exitosos este mes', type: 'CRIMES', periodicity: 'MONTHLY', minLevel: 1, requirement: 100, rewardCash: 120000n, rewardXp: 8000 },
  { title: '🦴 Titán de Hierro', description: 'Realiza 150 entrenamientos en el Gimnasio', type: 'TRAINING', periodicity: 'MONTHLY', minLevel: 1, requirement: 150, rewardCash: 150000n, rewardXp: 10000 },
  { title: '🩸 Depredador Supremo', description: 'Gana 50 peleas contra otros jugadores', type: 'ATTACKS', periodicity: 'MONTHLY', minLevel: 1, requirement: 50, rewardCash: 180000n, rewardXp: 12000 },
  { title: '📜 Doctorado Honoris Causa', description: 'Avanza 15 lecciones en la Universidad', type: 'EDUCATION', periodicity: 'MONTHLY', minLevel: 1, requirement: 15, rewardCash: 100000n, rewardXp: 7500 },
  { title: '🎯 Sindicato de Cazadores', description: 'Completa 20 contratos de Recompensas', type: 'BOUNTY', periodicity: 'MONTHLY', minLevel: 3, requirement: 20, rewardCash: 220000n, rewardXp: 15000 },
  { title: '🏁 Piloto Legendario', description: 'Compite en 35 carreras de Drag Racing', type: 'RACING', periodicity: 'MONTHLY', minLevel: 5, requirement: 35, rewardCash: 160000n, rewardXp: 11000 },
  { title: '👹 Aniquilador de Titanes', description: 'Asesta 30 ataques a World Bosses', type: 'BOSS', periodicity: 'MONTHLY', minLevel: 5, requirement: 30, rewardCash: 250000n, rewardXp: 18000 },
  { title: '📊 Magnate de Wall Street', description: 'Realiza 40 operaciones bursátiles', type: 'STOCKS', periodicity: 'MONTHLY', minLevel: 10, requirement: 40, rewardCash: 200000n, rewardXp: 14000 },
  { title: '🌍 Trotamundos Incorregible', description: 'Realiza 20 vuelos internacionales', type: 'TRAVEL', periodicity: 'MONTHLY', minLevel: 15, requirement: 20, rewardCash: 220000n, rewardXp: 15000 },
];

export class MissionService {
  // Próximo reinicio diario (00:00:00 UTC)
  static getNextDailyReset(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCHours(24, 0, 0, 0);
    return nextReset;
  }

  // Próximo reinicio semanal (Lunes 00:00:00 UTC)
  static getNextWeeklyReset(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    const day = nextReset.getUTCDay();
    const diff = nextReset.getUTCDate() + (day === 0 ? 1 : 8 - day); // próximo lunes
    nextReset.setUTCDate(diff);
    nextReset.setUTCHours(0, 0, 0, 0);
    return nextReset;
  }

  // Próximo reinicio mensual (Día 1 del próximo mes 00:00:00 UTC)
  static getNextMonthlyReset(): Date {
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    return nextReset;
  }

  // Obtener fecha de expiración según periodicidad
  static getResetForPeriodicity(periodicity: PeriodicityType): Date {
    if (periodicity === 'WEEKLY') return this.getNextWeeklyReset();
    if (periodicity === 'MONTHLY') return this.getNextMonthlyReset();
    return this.getNextDailyReset();
  }

  // Inicializar o consultar misiones activas por periodicidad (DAILY, WEEKLY, MONTHLY)
  static async getMissions(playerId: string, periodicity: PeriodicityType = 'DAILY') {
    const now = new Date();
    const nextReset = this.getResetForPeriodicity(periodicity);

    let missions = await prisma.playerMission.findMany({
      where: { playerId, periodicity, expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' },
    });

    if (missions.length === 0) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      const level = player?.level || 1;

      // Multiplicador por Tier de Nivel del Jugador
      let rewardMultiplier = 1.0;
      if (level >= 16) rewardMultiplier = 3.5;
      else if (level >= 6) rewardMultiplier = 2.0;

      // Número de misiones por periodicidad
      let requiredCount = 5;
      if (periodicity === 'WEEKLY') requiredCount = 3;
      if (periodicity === 'MONTHLY') requiredCount = 2;

      // Filtrar misiones disponibles por periodicidad Y nivel de jugador (minLevel)
      let availableTemplates = MISSION_POOL.filter(
        (m) => m.periodicity === periodicity && level >= m.minLevel
      );

      // Fallback si no hay suficientes misiones filtradas por nivel
      if (availableTemplates.length < requiredCount) {
        availableTemplates = MISSION_POOL.filter(
          (m) => m.periodicity === periodicity && m.minLevel <= 1
        );
      }

      // Mezclar aleatoriamente y seleccionar sin repetir tipo
      const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
      const selectedMissions: MissionTemplate[] = [];
      const usedTypes = new Set<MissionType>();

      for (const tmpl of shuffled) {
        if (selectedMissions.length >= requiredCount) break;
        if (!usedTypes.has(tmpl.type)) {
          selectedMissions.push(tmpl);
          usedTypes.add(tmpl.type);
        }
      }

      // Si aún no se completó la cuota, tomar de las restantes
      if (selectedMissions.length < requiredCount) {
        for (const tmpl of shuffled) {
          if (selectedMissions.length >= requiredCount) break;
          if (!selectedMissions.includes(tmpl)) {
            selectedMissions.push(tmpl);
          }
        }
      }

      await prisma.playerMission.createMany({
        data: selectedMissions.map((m) => ({
          playerId,
          title: m.title,
          description: m.description,
          type: m.type,
          periodicity,
          minLevel: m.minLevel,
          requirement: m.requirement,
          rewardCash: BigInt(Math.floor(Number(m.rewardCash) * rewardMultiplier)),
          rewardXp: Math.floor(m.rewardXp * rewardMultiplier),
          isCompleted: false,
          isClaimed: false,
          expiresAt: nextReset,
        })),
      });

      missions = await prisma.playerMission.findMany({
        where: { playerId, periodicity, expiresAt: { gt: now } },
        orderBy: { createdAt: 'asc' },
      });
    }

    const resetTime = missions[0]?.expiresAt || nextReset;
    const resetDateStr = resetTime.toISOString().split('T')[0];

    // Verificar si el Cofre del periodo fue reclamado
    const chestCooldown = await prisma.cooldown.findFirst({
      where: {
        playerId,
        type: `CHEST_${periodicity}_${resetDateStr}`,
      },
    });

    const targetRequiredMissions = periodicity === 'DAILY' ? 5 : periodicity === 'WEEKLY' ? 3 : 2;
    const isAllCompleted = missions.length >= targetRequiredMissions && missions.every((m) => m.isCompleted);
    const isChestClaimed = Boolean(chestCooldown);
    const canClaimChest = isAllCompleted && !isChestClaimed;

    return {
      periodicity,
      missions,
      canClaimChest,
      isChestClaimed,
      nextResetAt: resetTime.toISOString(),
    };
  }

  // Avanzar progreso de misión (se aplica a todas las periodicidades activas)
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

  // Reclamar recompensa individual de una misión
  static async claimMissionReward(playerId: string, missionId: string) {
    return prisma.$transaction(async (tx) => {
      const mission = await tx.playerMission.findUnique({ where: { id: missionId } });

      if (!mission || mission.playerId !== playerId) {
        throw new Error('Misión no encontrada.');
      }

      if (!mission.isCompleted && mission.progress < mission.requirement) {
        throw new Error('Esta misión aún no ha sido completada.');
      }

      if (mission.isClaimed) {
        throw new Error('Ya has reclamado la recompensa de esta misión.');
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
              metadata: JSON.stringify({ missionTitle: mission.title, periodicity: mission.periodicity }),
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

  // Reclamar Cofre al Inventario (al completar todas las misiones del periodo)
  static async claimChestToInventory(playerId: string, periodicity: PeriodicityType = 'DAILY') {
    const { missions, canClaimChest, isChestClaimed } = await this.getMissions(playerId, periodicity);

    if (isChestClaimed) {
      throw new Error(`Ya has reclamado el Cofre ${periodicity} en este ciclo.`);
    }

    if (!canClaimChest) {
      throw new Error(`Debes completar todas las misiones ${periodicity.toLowerCase()}s para reclamar el Cofre.`);
    }

    const resetTime = missions[0]?.expiresAt || this.getResetForPeriodicity(periodicity);
    const resetDateStr = resetTime.toISOString().split('T')[0];

    let chestItemName = 'Cofre Diario del Sindicato';
    if (periodicity === 'WEEKLY') chestItemName = 'Cofre Semanal de la Sombra';
    if (periodicity === 'MONTHLY') chestItemName = 'Cofre Mensual del Padrino';

    return prisma.$transaction(async (tx) => {
      // Registrar cooldown para evitar reclamos duplicados
      await tx.cooldown.create({
        data: {
          playerId,
          type: `CHEST_${periodicity}_${resetDateStr}`,
          expiresAt: resetTime,
        },
      });

      // Entregar ítem de Cofre directamente al inventario del jugador
      const chestItem = await tx.item.findFirst({ where: { name: chestItemName } });
      if (!chestItem) {
        throw new Error(`El ítem ${chestItemName} no se encuentra registrado en el sistema.`);
      }

      const existingInv = await tx.inventoryItem.findFirst({
        where: { playerId, itemId: chestItem.id, slot: null },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { quantity: existingInv.quantity + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: { playerId, itemId: chestItem.id, quantity: 1 },
        });
      }

      return {
        chestItemName,
        message: `🎁 **¡${chestItemName} AÑADIDO AL INVENTARIO!** Revisa tu inventario para abrirlo cuando desees.`,
      };
    });
  }
}
