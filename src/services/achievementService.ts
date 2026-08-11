import { prisma } from '../db/prisma.js';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rewardCash: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'FIRST_STEPS', title: 'Primeros Pasos', description: 'Regístrate en la ciudad de Sinford', rewardCash: 500 },
  { id: 'MILLIONAIRE', title: 'Millonario del Inframundo', description: 'Acumula $1,000,000 en efectivo o banco', rewardCash: 50000 },
  { id: 'CRIME_BOSS', title: 'Jefe del Crimen', description: 'Alcanza un Crime Skill superior a 5.0', rewardCash: 25000 },
  { id: 'PVP_CHAMPION', title: 'Campeón de Combate', description: 'Entrena tus Battle Stats a nivel superior', rewardCash: 10000 },
];

export class AchievementService {
  static async unlockAchievement(playerId: string, achievementId: string) {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) throw new Error('Logro no encontrado.');

    return prisma.$transaction(async (tx) => {
      const existing = await tx.playerAchievement.findUnique({
        where: { playerId_achievementId: { playerId, achievementId } },
      });

      if (existing) return null; // Ya desbloqueado

      const unlocked = await tx.playerAchievement.create({
        data: { playerId, achievementId },
      });

      // Otorgar recompensa en efectivo
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (wallet) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: wallet.cash + BigInt(ach.rewardCash) },
        });
      }

      return { title: ach.title, description: ach.description, rewardCash: ach.rewardCash };
    });
  }

  static async getLeaderboards(guildId: string = 'GLOBAL', category: 'level' | 'wealth' | 'stats') {
    if (category === 'level') {
      return prisma.player.findMany({
        where: { guildId },
        orderBy: { level: 'desc' },
        take: 10,
      });
    }

    if (category === 'wealth') {
      return prisma.player.findMany({
        where: { guildId },
        include: { wallet: true },
        take: 10,
      });
    }

    return prisma.player.findMany({
      where: { guildId },
      include: { stats: true },
      take: 10,
    });
  }
}
