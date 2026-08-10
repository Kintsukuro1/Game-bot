import { prisma } from '../db/prisma.js';

export class BountyService {
  // 1. Poner una recompensa (Bounty) sobre un jugador objetivo
  static async placeBounty(placedById: string, targetDiscordId: string, rewardCash: bigint) {
    if (rewardCash < 1000n) throw new Error('La recompensa mínima para un Bounty es de **$1,000**.');

    return prisma.$transaction(async (tx) => {
      const placer = await tx.player.findUnique({
        where: { id: placedById },
        include: { wallet: true },
      });

      if (!placer || !placer.wallet) throw new Error('Tus datos de jugador no existen.');

      const target = await tx.player.findFirst({
        where: { discordId: targetDiscordId, guildId: placer.guildId },
      });

      if (!target) throw new Error('El jugador objetivo no está registrado en este servidor.');

      if (placer.id === target.id) throw new Error('No puedes colocar una recompensa sobre ti mismo.');

      // Comisión del 10% de cazadores
      const fee = (rewardCash * 10n) / 100n;
      const totalCost = rewardCash + fee;

      if (placer.wallet.cash < totalCost) {
        throw new Error(`Efectivo insuficiente. El costo total con 10% de comisión es **$${totalCost.toLocaleString()}**.`);
      }

      const balanceBefore = placer.wallet.cash;
      const balanceAfter = placer.wallet.cash - totalCost;

      // Deducción de dinero
      await tx.wallet.update({
        where: { playerId: placedById },
        data: { cash: balanceAfter },
      });

      // Registro de transacción auditable
      await tx.transaction.create({
        data: {
          playerId: placedById,
          amount: -totalCost,
          balanceBefore,
          balanceAfter,
          type: 'BOUNTY_PLACED',
          source: target.id,
          metadata: JSON.stringify({ targetUsername: target.username, reward: rewardCash.toString(), fee: fee.toString() }),
        },
      });

      // Crear registro de Bounty (Expiración en 7 días)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const bounty = await tx.bounty.create({
        data: {
          placedById,
          targetPlayerId: target.id,
          reward: rewardCash,
          fee,
          expiresAt,
        },
      });

      return { bounty, targetUsername: target.username, rewardCash, fee };
    });
  }

  // 2. Lista de Bounties activos
  static async getActiveBounties() {
    const now = new Date();
    return prisma.bounty.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
      orderBy: { reward: 'desc' },
      take: 10,
    });
  }

  // 3. Reclamar Bounty automáticamente al ganar un combate
  static async checkAndClaimBounty(attackerId: string, defenderId: string) {
    const now = new Date();
    const activeBounty = await prisma.bounty.findFirst({
      where: {
        targetPlayerId: defenderId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });

    if (!activeBounty) return null;

    return prisma.$transaction(async (tx) => {
      const attackerWallet = await tx.wallet.findUnique({ where: { playerId: attackerId } });
      if (!attackerWallet) return null;

      const balanceBefore = attackerWallet.cash;
      const balanceAfter = attackerWallet.cash + activeBounty.reward;

      // Acreditar recompensa al cazador
      await tx.wallet.update({
        where: { playerId: attackerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId: attackerId,
          amount: activeBounty.reward,
          balanceBefore,
          balanceAfter,
          type: 'BOUNTY_CLAIMED',
          source: defenderId,
          metadata: JSON.stringify({ bountyId: activeBounty.id, reward: activeBounty.reward.toString() }),
        },
      });

      // Marcar Bounty como cobrado
      await tx.bounty.update({
        where: { id: activeBounty.id },
        data: {
          status: 'CLAIMED',
          claimedById: attackerId,
        },
      });

      return activeBounty;
    });
  }
}
