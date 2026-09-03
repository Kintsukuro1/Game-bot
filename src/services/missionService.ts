import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';

export interface MissionTemplate {
  title: string;
  description: string;
  type: 'ATTACKS' | 'CRIMES' | 'ITEMS' | 'TRAINING';
  requirement: number;
  rewardCash: bigint;
  rewardXp: number;
}

export const MISSION_POOL: MissionTemplate[] = [
  // CRIMES
  { title: '🕵️ Maestro del Crimen', description: 'Comete 3 crímenes con éxito', type: 'CRIMES', requirement: 3, rewardCash: 1000n, rewardXp: 100 },
  { title: '🔪 Noche de Trabajo Sucio', description: 'Comete 6 crímenes con éxito', type: 'CRIMES', requirement: 6, rewardCash: 2200n, rewardXp: 220 },
  { title: '💀 Currículum del Hampa', description: 'Comete 10 crímenes con éxito en el día', type: 'CRIMES', requirement: 10, rewardCash: 4000n, rewardXp: 400 },

  // TRAINING
  { title: '🏋️ Entrenamiento Pesado', description: 'Realiza 5 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 5, rewardCash: 1500n, rewardXp: 150 },
  { title: '💪 Sudando la Deuda', description: 'Realiza 8 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 8, rewardCash: 2600n, rewardXp: 260 },
  { title: '🦴 Sin Dolor No Hay Botín', description: 'Realiza 12 entrenamientos en el Gimnasio', type: 'TRAINING', requirement: 12, rewardCash: 4500n, rewardXp: 450 },

  // ATTACKS
  { title: '🥊 Buscabullas', description: 'Gana 2 peleas contra otros jugadores', type: 'ATTACKS', requirement: 2, rewardCash: 1800n, rewardXp: 180 },
  { title: '⚔️ Reputación de Calle', description: 'Gana 4 peleas contra otros jugadores', type: 'ATTACKS', requirement: 4, rewardCash: 3200n, rewardXp: 320 },
  { title: '🩸 El Terror del Barrio', description: 'Gana 7 peleas contra otros jugadores', type: 'ATTACKS', requirement: 7, rewardCash: 5500n, rewardXp: 550 },

  // ITEMS
  { title: '🎒 Vaciando el Bolsillo Ajeno', description: 'Usa 3 objetos de tu inventario', type: 'ITEMS', requirement: 3, rewardCash: 1200n, rewardXp: 120 },
  { title: '💊 Cliente Frecuente', description: 'Usa 6 objetos de tu inventario', type: 'ITEMS', requirement: 6, rewardCash: 2400n, rewardXp: 240 },
  { title: '🧪 Probando de Todo un Poco', description: 'Usa 10 objetos de tu inventario', type: 'ITEMS', requirement: 10, rewardCash: 4200n, rewardXp: 420 },
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
      // Seleccionar 3 misiones aleatorias sin repetir tipo
      const allTypes: Array<'ATTACKS' | 'CRIMES' | 'ITEMS' | 'TRAINING'> = ['CRIMES', 'TRAINING', 'ATTACKS', 'ITEMS'];
      const selectedTypes = [...allTypes].sort(() => Math.random() - 0.5).slice(0, 3);

      const selectedMissions = selectedTypes.map((type) => {
        const poolForType = MISSION_POOL.filter((m) => m.type === type);
        return poolForType[Math.floor(Math.random() * poolForType.length)];
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
          expiresAt: nextReset,
        })),
      });

      missions = await prisma.playerMission.findMany({
        where: { playerId, expiresAt: { gt: now } },
        orderBy: { createdAt: 'asc' },
      });
    }

    const resetTime = missions[0]?.expiresAt || nextReset;

    return {
      missions,
      nextResetAt: resetTime.toISOString(),
    };
  }

  // Avanzar progreso de misión
  static async progressMission(playerId: string, type: 'ATTACKS' | 'CRIMES' | 'ITEMS' | 'TRAINING', amount: number = 1) {
    const now = new Date();
    const activeMissions = await prisma.playerMission.findMany({
      where: { playerId, type, isCompleted: false, expiresAt: { gt: now } },
    });

    for (const mission of activeMissions) {
      const newProgress = mission.progress + amount;
      if (newProgress >= mission.requirement) {
        // Misión Completada
        await prisma.$transaction(async (tx) => {
          await tx.playerMission.update({
            where: { id: mission.id },
            data: { progress: mission.requirement, isCompleted: true },
          });

          // Otorgar recompensas
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

          if (mission.rewardXp > 0) {
            await PlayerService.addXp(playerId, mission.rewardXp, tx);
          }
        });
      } else {
        await prisma.playerMission.update({
          where: { id: mission.id },
          data: { progress: newProgress },
        });
      }
    }
  }
}
