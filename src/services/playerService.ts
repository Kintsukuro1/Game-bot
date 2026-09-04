import { prisma } from '../db/prisma.js';
import { AchievementService } from './achievementService.js';
import { serializeBigInt } from '../utils/serializer.js';

export class PlayerService {
  static async getPlayerByDiscordId(discordId: string, _guildId: string = 'GLOBAL') {
    // Buscar primero un registro GLOBAL (preferido)
    let player = await prisma.player.findFirst({
      where: { discordId, guildId: 'GLOBAL' },
      include: {
        wallet: true,
        stats: true,
        bodyParts: true,
        mastery: true,
        addiction: true,
        inventory: {
          include: { item: true },
        },
      },
    });

    if (player) return player;

    // Si no hay registro GLOBAL, buscar cualquier registro existente
    player = await prisma.player.findFirst({
      where: { discordId },
      include: {
        wallet: true,
        stats: true,
        bodyParts: true,
        mastery: true,
        addiction: true,
        inventory: {
          include: { item: true },
        },
      },
    });

    // Migrar registro de servidor específico a GLOBAL
    if (player && player.guildId !== 'GLOBAL') {
      try {
        player = await prisma.player.update({
          where: { id: player.id },
          data: { guildId: 'GLOBAL' },
          include: {
            wallet: true,
            stats: true,
            bodyParts: true,
            mastery: true,
            addiction: true,
            inventory: {
              include: { item: true },
            },
          },
        });
      } catch (err) {
        // Si falla la migración (ej: unique constraint), devolver el registro tal cual
        console.warn(`⚠️ No se pudo migrar jugador ${discordId} a GLOBAL:`, err);
      }
    }

    // Auto-nivelar si el jugador ya acumuló XP suficiente para el siguiente nivel
    if (player) {
      const reqXp = this.getRequiredXpForNextLevel(player.level);
      console.log(`[AUTO-LEVELUP CHECK] Player ${player.discordId} | Level: ${player.level} | XP: ${player.xp} | Required: ${reqXp} | ShouldLevelUp: ${player.xp >= reqXp}`);
      if (player.xp >= reqXp) {
        try {
          const levelUpRes = await this.addXp(player.id, 0);
          console.log(`[AUTO-LEVELUP RESULT] leveledUp: ${levelUpRes?.leveledUp} | newLevel: ${levelUpRes?.newLevel} | updated.level: ${levelUpRes?.updated?.level}`);
          if (levelUpRes?.updated) {
            player = levelUpRes.updated;
          }
        } catch (err) {
          console.error(`[AUTO-LEVELUP ERROR]`, err);
        }
      }
    }

    return player;
  }

  static async registerPlayer(discordId: string, username: string, _guildId: string = 'GLOBAL') {
    const existing = await this.getPlayerByDiscordId(discordId, 'GLOBAL');
    if (existing) {
      if (existing.username !== username) {
        await prisma.player.update({
          where: { id: existing.id },
          data: { username },
        });
      }
      return existing;
    }

    const newPlayer = await prisma.player.create({
      data: {
        guildId: 'GLOBAL',
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
        mastery: true,
        addiction: true,
        inventory: { include: { item: true } },
      },
    });

    try {
      await AchievementService.checkAndUnlock(newPlayer.id);
    } catch {}

    return newPlayer;
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
  static async addXp(playerId: string, xpGained: number, db: any = prisma) {
    const player = await db.player.findUnique({
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
      const updated = await db.player.update({
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

    // 1. Actualizar Cartera y crear registro contable
    const balanceBefore = player.wallet?.cash || 0n;
    const balanceAfter = balanceBefore + cashBonus;

    if (player.wallet) {
      await db.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await db.transaction.create({
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
    }

    // 2. Restauración Total de Energía, Nerve y Happy
    if (player.stats) {
      await db.stats.update({
        where: { playerId },
        data: {
          energy: player.stats.maxEnergy || 100,
          maxNerve: newMaxNerve,
          nerve: newMaxNerve,
          happy: player.stats.maxHappy || 100,
        },
      });
    }

    // 3. Curación completa de extremidades corporales
    await db.bodyParts.updateMany({
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
    const updated = await db.player.update({
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
  }

  // Regeneración periódica completa (Energía, Nerve, Happy, Partes Corporales y Hospital/Cárcel)
  static async regenerateStats(io?: any) {
    const now = new Date();
    const players = await prisma.player.findMany({
      include: { stats: true, bodyParts: true },
    });

    for (const player of players) {
      if (!player.stats || !player.bodyParts) continue;
      let hasUpdated = false;

      // 1. Regenerar Energía, Nerve, Happy y Reducir Nivel de Alerta (Heat)
      const newEnergy = Math.min(player.stats.energy + 5, player.stats.maxEnergy);
      const newNerve = Math.min(player.stats.nerve + 1, player.stats.maxNerve);
      const newHappy = Math.min(player.stats.happy + 5, player.stats.maxHappy);
      const currentHeat = player.stats.heat || 0;
      const newHeat = Math.max(0, currentHeat - 5);

      if (
        newEnergy !== player.stats.energy ||
        newNerve !== player.stats.nerve ||
        newHappy !== player.stats.happy ||
        newHeat !== currentHeat
      ) {
        await prisma.stats.update({
          where: { playerId: player.id },
          data: {
            energy: newEnergy,
            nerve: newNerve,
            happy: newHappy,
            heat: newHeat,
          },
        });
        hasUpdated = true;
      }

      // 2. Regeneración gradual de Partes Corporales (+5 HP por tick hasta 100)
      const b = player.bodyParts;
      const newHead = Math.min(b.headHp + 5, 100);
      const newTorso = Math.min(b.torsoHp + 5, 100);
      const newLArm = Math.min(b.leftArmHp + 5, 100);
      const newRArm = Math.min(b.rightArmHp + 5, 100);
      const newLLeg = Math.min(b.leftLegHp + 5, 100);
      const newRLeg = Math.min(b.rightLegHp + 5, 100);

      if (
        newHead !== b.headHp ||
        newTorso !== b.torsoHp ||
        newLArm !== b.leftArmHp ||
        newRArm !== b.rightArmHp ||
        newLLeg !== b.leftLegHp ||
        newRLeg !== b.rightLegHp
      ) {
        await prisma.bodyParts.update({
          where: { playerId: player.id },
          data: {
            headHp: newHead,
            torsoHp: newTorso,
            leftArmHp: newLArm,
            rightArmHp: newRArm,
            leftLegHp: newLLeg,
            rightLegHp: newRLeg,
          },
        });
        hasUpdated = true;
      }

      // 3. Limpieza de temporizadores de Hospital y Cárcel vencidos
      let playerUpdates: any = {};
      if (player.hospitalUntil && player.hospitalUntil <= now) {
        playerUpdates.hospitalUntil = null;
      }
      if (player.jailUntil && player.jailUntil <= now) {
        playerUpdates.jailUntil = null;
      }

      if (Object.keys(playerUpdates).length > 0) {
        await prisma.player.update({
          where: { id: player.id },
          data: playerUpdates,
        });
        hasUpdated = true;
      }

      // Notificar cliente vía WebSocket si hubo cambios en sus estadísticas
      if (hasUpdated && io) {
        try {
          const updatedPlayer = await this.getPlayerByDiscordId(player.discordId, player.guildId);
          if (updatedPlayer) {
            io.to(`user:${player.discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));
          }
        } catch {}
      }
    }
  }
}
