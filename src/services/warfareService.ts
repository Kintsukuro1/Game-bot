import { prisma } from '../db/prisma.js';

export class WarfareService {
  // 1. Declarar Guerra a otra Facción
  static async declareWar(leaderId: string, targetFactionId: string) {
    return prisma.$transaction(async (tx) => {
      const leaderMember = await tx.factionMember.findUnique({
        where: { playerId: leaderId },
        include: { faction: true },
      });

      if (!leaderMember || (leaderMember.role !== 'LEADER' && leaderMember.role !== 'CO_LEADER')) {
        throw new Error('Solo el Líder o Co-Líder de la facción puede declarar la guerra.');
      }

      const challengerFaction = leaderMember.faction;
      if (challengerFaction.id === targetFactionId) {
        throw new Error('No puedes declarar la guerra a tu propia facción.');
      }

      const defenderFaction = await tx.faction.findUnique({ where: { id: targetFactionId } });
      if (!defenderFaction) throw new Error('La facción enemiga no existe.');

      // Verificar si ya existe una guerra activa entre ambas facciones
      const activeWar = await tx.factionWar.findFirst({
        where: {
          OR: [
            { challengerId: challengerFaction.id, defenderId: targetFactionId, status: 'ACTIVE' },
            { challengerId: targetFactionId, defenderId: challengerFaction.id, status: 'ACTIVE' },
          ],
        },
      });

      if (activeWar) {
        throw new Error(`Ya existe una guerra activa contra la facción **${defenderFaction.name}**.`);
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      const war = await tx.factionWar.create({
        data: {
          challengerId: challengerFaction.id,
          defenderId: targetFactionId,
          targetScore: 100,
          expiresAt,
        },
      });

      return { war, challengerName: challengerFaction.name, defenderName: defenderFaction.name };
    });
  }

  // 2. Registrar golpe de guerra al ganar un combate PvP
  static async recordWarHit(winnerId: string, loserId: string) {
    const winnerMember = await prisma.factionMember.findUnique({ where: { playerId: winnerId } });
    const loserMember = await prisma.factionMember.findUnique({ where: { playerId: loserId } });

    if (!winnerMember || !loserMember || winnerMember.factionId === loserMember.factionId) {
      return null;
    }

    const now = new Date();
    const activeWar = await prisma.factionWar.findFirst({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
        OR: [
          { challengerId: winnerMember.factionId, defenderId: loserMember.factionId },
          { challengerId: loserMember.factionId, defenderId: winnerMember.factionId },
        ],
      },
    });

    if (!activeWar) return null;

    const isChallenger = activeWar.challengerId === winnerMember.factionId;
    const pointsGained = 10;
    const respectGained = 15;

    return prisma.$transaction(async (tx) => {
      // Sumar puntos de guerra al marcador de la facción ganadora
      const newChallengerScore = isChallenger ? activeWar.challengerScore + pointsGained : activeWar.challengerScore;
      const newDefenderScore = !isChallenger ? activeWar.defenderScore + pointsGained : activeWar.defenderScore;

      const currentScore = isChallenger ? newChallengerScore : newDefenderScore;
      const hasWon = currentScore >= activeWar.targetScore;

      // Sumar respeto a la facción
      await tx.faction.update({
        where: { id: winnerMember.factionId },
        data: { respect: { increment: respectGained } },
      });

      if (hasWon) {
        // Finalizar Guerra con victoria y recompensa de $100,000 + 500 Respect
        await tx.factionWar.update({
          where: { id: activeWar.id },
          data: {
            challengerScore: newChallengerScore,
            defenderScore: newDefenderScore,
            status: 'FINISHED',
            winnerId: winnerMember.factionId,
          },
        });

        await tx.faction.update({
          where: { id: winnerMember.factionId },
          data: {
            treasury: { increment: 100000n },
            respect: { increment: 500 },
          },
        });

        return { warFinished: true, winningFactionId: winnerMember.factionId, pointsGained };
      } else {
        await tx.factionWar.update({
          where: { id: activeWar.id },
          data: {
            challengerScore: newChallengerScore,
            defenderScore: newDefenderScore,
          },
        });

        return { warFinished: false, currentScore, targetScore: activeWar.targetScore, pointsGained };
      }
    });
  }

  // 3. Rankings de Facciones por Respeto
  static async getFactionRankings(guildId: string = 'GLOBAL') {
    return prisma.faction.findMany({
      where: { guildId },
      orderBy: { respect: 'desc' },
      include: { members: true },
      take: 10,
    });
  }
}
