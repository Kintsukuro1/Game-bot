import { prisma } from '../db/prisma.js';

export class PlayerService {
  static async getPlayerByDiscordId(discordId: string, guildId: string = 'GLOBAL') {
    return prisma.player.findUnique({
      where: {
        guildId_discordId: {
          guildId,
          discordId,
        },
      },
      include: {
        wallet: true,
        stats: true,
        bodyParts: true,
        inventory: {
          include: { item: true },
        },
      },
    });
  }

  static async registerPlayer(discordId: string, username: string, guildId: string = 'GLOBAL') {
    const existing = await this.getPlayerByDiscordId(discordId, guildId);
    if (existing) return existing;

    return prisma.player.create({
      data: {
        guildId,
        discordId,
        username,
        wallet: {
          create: { cash: 100n, bank: 0n },
        },
        stats: {
          create: {
            energy: 100,
            maxEnergy: 100,
            nerve: 100,
            maxNerve: 100,
            happy: 100,
            maxHappy: 100,
            strength: 1.0,
            defense: 1.0,
            speed: 1.0,
            dexterity: 1.0,
            manualLabor: 1.0,
            intelligence: 1.0,
            endurance: 1.0,
          },
        },
        bodyParts: {
          create: {
            headHp: 100,
            torsoHp: 100,
            leftArmHp: 100,
            rightArmHp: 100,
            leftLegHp: 100,
            rightLegHp: 100,
          },
        },
      },
      include: {
        wallet: true,
        stats: true,
        bodyParts: true,
        inventory: { include: { item: true } },
      },
    });
  }

  // Cálculo de Experiencia requerida por Nivel: 100 * (Level ^ 2)
  static getRequiredXpForNextLevel(level: number): number {
    return 100 * (level ** 2);
  }

  // Otorgar XP y verificar Subida de Nivel
  static async addXp(playerId: string, xpGained: number) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return null;

    let newXp = player.xp + xpGained;
    let newLevel = player.level;
    let leveledUp = false;

    let required = this.getRequiredXpForNextLevel(newLevel);
    while (newXp >= required) {
      newLevel += 1;
      leveledUp = true;
      required = this.getRequiredXpForNextLevel(newLevel);
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });

    return {
      updated,
      leveledUp,
      oldLevel: player.level,
      newLevel,
    };
  }

  static async regenerateStats() {
    const players = await prisma.player.findMany({
      include: { stats: true },
    });

    for (const player of players) {
      if (!player.stats) continue;

      const newEnergy = Math.min(player.stats.energy + 5, player.stats.maxEnergy);
      const newNerve = Math.min(player.stats.nerve + 1, player.stats.maxNerve);

      if (newEnergy !== player.stats.energy || newNerve !== player.stats.nerve) {
        await prisma.stats.update({
          where: { playerId: player.id },
          data: {
            energy: newEnergy,
            nerve: newNerve,
          },
        });
      }
    }
  }
}
