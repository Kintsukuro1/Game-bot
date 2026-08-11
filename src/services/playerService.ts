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
            nerve: 10,
            maxNerve: 10,
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

  // Cálculo de Vida Máxima (HP) por Nivel: 100 + (Level - 1) * 20
  static getMaxHpForLevel(level: number): number {
    return 100 + (level - 1) * 20;
  }

  // Cálculo de Nerve Máximo por Nivel: 10 + Math.floor((Level - 1) / 5) * 2
  static getMaxNerveForLevel(level: number): number {
    return 10 + Math.floor((level - 1) / 5) * 2;
  }

  // Título de Rango de Honor por Nivel (Torn Wiki Standard)
  static getPlayerRankTitle(level: number): string {
    if (level >= 100) return '👑✨ El Padrino de la Ciudad (Cap Máximo)';
    if (level >= 50) return '🏆 Leyenda de la Sombra';
    if (level >= 35) return '👑 Magnate de Sinford';
    if (level >= 25) return '💼 Ejecutivo de Negocios';
    if (level >= 15) return '🟣 Capo del Inframundo';
    if (level >= 10) return '🔴 Pandillero Consolidado';
    if (level >= 5) return '🟡 Operador de la Ciudad';
    return '🟢 Novato de las Callejuelas';
  }

  // Otorgar XP y verificar Subida de Nivel con Recompensas y Restauración Total
  static async addXp(playerId: string, xpGained: number) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { wallet: true, stats: true },
    });
    if (!player) return null;

    let newXp = player.xp + xpGained;
    let newLevel = player.level;
    let leveledUp = false;

    let required = this.getRequiredXpForNextLevel(newLevel);
    while (newXp >= required && newLevel < 100) {
      newLevel += 1;
      leveledUp = true;
      required = this.getRequiredXpForNextLevel(newLevel);
    }

    if (!leveledUp) {
      const updated = await prisma.player.update({
        where: { id: playerId },
        data: { xp: newXp },
        include: { wallet: true, stats: true, bodyParts: true, inventory: true },
      });
      return {
        updated,
        leveledUp: false,
        oldLevel: player.level,
        newLevel: player.level,
        cashBonus: 0n,
        rankTitle: this.getPlayerRankTitle(player.level),
      };
    }

    // Recompensas al Subir de Nivel (Level-Up Perks)
    const cashBonus = BigInt(newLevel * 2500);
    const newMaxNerve = this.getMaxNerveForLevel(newLevel);
    const rankTitle = this.getPlayerRankTitle(newLevel);

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar Cartera y crear registro contable
      const balanceBefore = player.wallet?.cash || 0n;
      const balanceAfter = balanceBefore + cashBonus;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: cashBonus,
          balanceBefore,
          balanceAfter,
          type: 'LEVEL_UP_BONUS',
          source: 'SYSTEM',
          metadata: JSON.stringify({ oldLevel: player.level, newLevel, cashBonus: Number(cashBonus) }),
        },
      });

      // 2. Restauración Total de Energía, Nerve y Happy
      await tx.stats.update({
        where: { playerId },
        data: {
          energy: player.stats?.maxEnergy || 100,
          maxNerve: newMaxNerve,
          nerve: newMaxNerve,
          happy: player.stats?.maxHappy || 100,
        },
      });

      // 3. Curación completa de extremidades corporales
      await tx.bodyParts.update({
        where: { playerId },
        data: {
          headHp: 100,
          torsoHp: 100,
          leftArmHp: 100,
          rightArmHp: 100,
          leftLegHp: 100,
          rightLegHp: 100,
        },
      });

      // 4. Actualizar XP y Nivel en el Jugador
      const updated = await tx.player.update({
        where: { id: playerId },
        data: {
          xp: newXp,
          level: newLevel,
        },
        include: { wallet: true, stats: true, bodyParts: true, inventory: true },
      });

      return {
        updated,
        leveledUp: true,
        oldLevel: player.level,
        newLevel,
        cashBonus,
        rankTitle,
      };
    });
  }

  // Regeneración periódica de Energía y Nerve
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
