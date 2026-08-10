import { prisma } from '../db/prisma.js';

export class PlayerService {
  static async getPlayerByDiscordId(discordId: string) {
    return prisma.player.findUnique({
      where: { discordId },
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

  static async registerPlayer(discordId: string, username: string) {
    // Check if player exists
    const existing = await this.getPlayerByDiscordId(discordId);
    if (existing) return existing;

    // Create player atomically with Wallet, Stats, and BodyParts
    return prisma.player.create({
      data: {
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

  static async regenerateStats() {
    // Regenerate +5 Energy, +1 Nerve every tick up to max
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
