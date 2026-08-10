import { prisma } from '../db/prisma.js';

export class MissionService {
  // Inicializar o consultar misiones activas
  static async getMissions(playerId: string) {
    const now = new Date();
    let missions = await prisma.playerMission.findMany({
      where: { playerId, isCompleted: false, expiresAt: { gt: now } },
    });

    if (missions.length === 0) {
      // Generar misiones diarias iniciales
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.playerMission.createMany({
        data: [
          {
            playerId,
            title: '🕵️ Maestro del Crimen',
            description: 'Comete 3 crímenes con éxito',
            type: 'CRIMES',
            requirement: 3,
            rewardCash: 1000n,
            rewardXp: 100,
            expiresAt,
          },
          {
            playerId,
            title: '🏋️ Entrenamiento Pesado',
            description: 'Realiza 5 entrenamientos en el Gimnasio',
            type: 'TRAINING',
            requirement: 5,
            rewardCash: 1500n,
            rewardXp: 150,
            expiresAt,
          },
        ],
      });

      missions = await prisma.playerMission.findMany({
        where: { playerId, isCompleted: false, expiresAt: { gt: now } },
      });
    }

    return missions;
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
            const player = await tx.player.findUnique({ where: { id: playerId } });
            if (player) {
              await tx.player.update({
                where: { id: playerId },
                data: { xp: player.xp + mission.rewardXp },
              });
            }
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
