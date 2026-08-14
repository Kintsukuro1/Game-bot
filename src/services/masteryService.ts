import { prisma } from '../db/prisma.js';

export type MasteryBranch = 'combat' | 'crime' | 'business' | 'faction';

export class MasteryService {
  /**
   * Obtiene o inicializa el registro de maestría de un jugador.
   */
  static async getPlayerMastery(playerId: string) {
    let mastery = await prisma.playerMastery.findUnique({
      where: { playerId },
    });

    if (!mastery) {
      mastery = await prisma.playerMastery.create({
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
  static async addMasteryExp(playerId: string, branch: MasteryBranch, amount: number) {
    if (amount <= 0) return null;

    const currentMastery = await this.getPlayerMastery(playerId);

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

    return prisma.playerMastery.update({
      where: { playerId },
      data: updateData,
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
