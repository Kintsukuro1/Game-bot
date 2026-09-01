import { prisma } from '../db/prisma.js';
import { MasteryBranch, PerkDefinition, PERKS } from '../config/gameData.js';
export { MasteryBranch, PerkDefinition, PERKS };

export class MasteryService {
  /**
   * Obtiene o inicializa el registro de maestría de un jugador.
   */
  static async getPlayerMastery(playerId: string, db: any = prisma) {
    let mastery = await db.playerMastery.findUnique({
      where: { playerId },
    });

    if (!mastery) {
      mastery = await db.playerMastery.create({
        data: {
          playerId,
          combatExp: 0,
          crimeExp: 0,
          businessExp: 0,
          factionExp: 0,
          perkPoints: 0,
        },
      });
    }

    return mastery;
  }

  /**
   * Añade experiencia a una rama específica de maestría y recalcula los puntos de perk.
   */
  static async addMasteryExp(playerId: string, branch: MasteryBranch, amount: number, db: any = prisma) {
    if (amount <= 0) return null;

    const currentMastery = await this.getPlayerMastery(playerId, db);

    const updateData: any = {};
    switch (branch) {
      case 'combat':
        updateData.combatExp = currentMastery.combatExp + amount;
        break;
      case 'crime':
        updateData.crimeExp = currentMastery.crimeExp + amount;
        break;
      case 'business':
        updateData.businessExp = currentMastery.businessExp + amount;
        break;
      case 'faction':
        updateData.factionExp = currentMastery.factionExp + amount;
        break;
    }

    // Calcular puntos de perk totales ganados (1 punto cada 500 EXP acumulados por rama)
    const newCombatExp = updateData.combatExp ?? currentMastery.combatExp;
    const newCrimeExp = updateData.crimeExp ?? currentMastery.crimeExp;
    const newBusinessExp = updateData.businessExp ?? currentMastery.businessExp;
    const newFactionExp = updateData.factionExp ?? currentMastery.factionExp;

    const totalPerkPoints =
      Math.floor(newCombatExp / 500) +
      Math.floor(newCrimeExp / 500) +
      Math.floor(newBusinessExp / 500) +
      Math.floor(newFactionExp / 500);

    updateData.perkPoints = totalPerkPoints;

    return db.playerMastery.update({
      where: { playerId },
      data: updateData,
    });
  }

  /**
   * Canjea un punto de Perk por una mejora permanente del personaje.
   */
  static async redeemPerk(playerId: string, perkId: string) {
    const perk = PERKS.find((p) => p.id === perkId);
    if (!perk) throw new Error('Mejora de maestría no encontrada.');

    return prisma.$transaction(async (tx) => {
      const mastery = await tx.playerMastery.findUnique({ where: { playerId } });
      if (!mastery || mastery.perkPoints < perk.cost) {
        throw new Error(`Puntos de Perk insuficientes. Requiere **${perk.cost} Pts** y tienes **${mastery?.perkPoints || 0} Pts**.`);
      }

      const stats = await tx.stats.findUnique({ where: { playerId } });
      if (!stats) throw new Error('Estadísticas del jugador no encontradas.');

      // Descontar punto de perk
      await tx.playerMastery.update({
        where: { playerId },
        data: { perkPoints: mastery.perkPoints - perk.cost },
      });

      // Aplicar mejora de estadísticas
      if (perk.id === 'PERK_ENERGY_CAP') {
        await tx.stats.update({
          where: { playerId },
          data: { maxEnergy: { increment: 25 }, energy: { increment: 25 } },
        });
      } else if (perk.id === 'PERK_NERVE_CAP') {
        await tx.stats.update({
          where: { playerId },
          data: { maxNerve: { increment: 5 }, nerve: { increment: 5 } },
        });
      } else if (perk.id === 'PERK_STRENGTH_BOOST') {
        await tx.stats.update({
          where: { playerId },
          data: { strength: { increment: 15 } },
        });
      } else if (perk.id === 'PERK_DEFENSE_BOOST') {
        await tx.stats.update({
          where: { playerId },
          data: { defense: { increment: 15 } },
        });
      } else if (perk.id === 'PERK_SPEED_BOOST') {
        await tx.stats.update({
          where: { playerId },
          data: { speed: { increment: 15 } },
        });
      } else if (perk.id === 'PERK_CRIME_SKILL') {
        await tx.stats.update({
          where: { playerId },
          data: { crimeSkill: { increment: 10 } },
        });
      } else if (perk.id === 'PERK_WORK_STATS') {
        await tx.stats.update({
          where: { playerId },
          data: { manualLabor: { increment: 15 }, intelligence: { increment: 15 } },
        });
      }

      return { perk, remainingPoints: mastery.perkPoints - perk.cost };
    });
  }

  /**
   * Calcula los niveles individuales de cada rama de maestría.
   */
  static calculateMasteryLevels(mastery: any) {
    return {
      combatLevel: Math.floor((mastery?.combatExp || 0) / 500) + 1,
      crimeLevel: Math.floor((mastery?.crimeExp || 0) / 500) + 1,
      businessLevel: Math.floor((mastery?.businessExp || 0) / 500) + 1,
      factionLevel: Math.floor((mastery?.factionExp || 0) / 500) + 1,
      perkPoints: mastery?.perkPoints || 0,
    };
  }
}
