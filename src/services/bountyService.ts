import { prisma } from '../db/prisma.js';

export class BountyService {
  // 1. Poner una recompensa (Bounty) sobre un jugador objetivo
  static async placeBounty(
    placedById: string,
    targetIdentifier: string,
    rewardCash: bigint,
    reason?: string,
    isAnonymous: boolean = false
  ) {
    if (rewardCash < 1000n) throw new Error('La recompensa mínima para un Bounty es de **$1,000**.');

    return prisma.$transaction(async (tx) => {
      const placer = await tx.player.findUnique({
        where: { id: placedById },
        include: { wallet: true },
      });

      if (!placer || !placer.wallet) throw new Error('Tus datos de jugador no existen.');

      // Buscar por ID de Discord, ID interno o Nombre de usuario
      const target = await tx.player.findFirst({
        where: {
          OR: [
            { id: targetIdentifier },
            { discordId: targetIdentifier },
            { username: { equals: targetIdentifier } },
          ],
        },
      });

      if (!target) throw new Error('El jugador objetivo no fue encontrado.');

      if (placer.id === target.id) throw new Error('No puedes colocar una recompensa sobre ti mismo.');

      // Comisión: 10% estándar, 20% si es anónimo
      const feePercent = isAnonymous ? 20n : 10n;
      const fee = (rewardCash * feePercent) / 100n;
      const totalCost = rewardCash + fee;

      if (placer.wallet.cash < totalCost) {
        throw new Error(
          `Efectivo insuficiente. El costo total con ${feePercent}% de comisión (${
            isAnonymous ? 'tarifa anónima' : 'comisión estándar'
          }) es **$${totalCost.toLocaleString()}**.`
        );
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
          metadata: JSON.stringify({
            targetUsername: target.username,
            reward: rewardCash.toString(),
            fee: fee.toString(),
            isAnonymous,
            reason: reason || null,
          }),
        },
      });

      // Crear registro de Bounty (Expiración en 7 días)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const bounty = await tx.bounty.create({
        data: {
          placedById: placer.id,
          targetPlayerId: target.id,
          reward: rewardCash,
          fee,
          reason: reason ? reason.trim() : null,
          isAnonymous,
          expiresAt,
        },
        include: {
          targetPlayer: {
            select: { id: true, username: true, level: true, hospitalUntil: true, jailUntil: true, profession: true },
          },
          placedBy: {
            select: { id: true, username: true },
          },
        },
      });

      return { bounty, targetUsername: target.username, rewardCash, fee, isAnonymous };
    });
  }

  // 2. Lista de Bounties activos con relaciones de jugador
  static async getActiveBounties() {
    await this.ensureSystemBounties();

    const now = new Date();
    return prisma.bounty.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
      include: {
        targetPlayer: {
          select: {
            id: true,
            username: true,
            level: true,
            hospitalUntil: true,
            jailUntil: true,
            profession: true,
          },
        },
        placedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { reward: 'desc' },
      take: 20,
    });
  }

  // 3. Buscar posibles jugadores como objetivos de Bounty
  static async searchTargets(query: string, excludePlayerId: string) {
    return prisma.player.findMany({
      where: {
        id: { not: excludePlayerId },
        username: { contains: query },
      },
      select: {
        id: true,
        username: true,
        level: true,
        profession: true,
      },
      take: 10,
    });
  }

  // 4. Garantizar bounties del sistema si hay pocos activos
  static async ensureSystemBounties() {
    const now = new Date();
    const activeCount = await prisma.bounty.count({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });

    if (activeCount >= 3) return;

    // Buscar jugadores que no tengan un bounty activo
    const playersWithoutBounty = await prisma.player.findMany({
      where: {
        bountiesTarget: {
          none: {
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
        },
      },
      take: 3 - activeCount,
    });

    const systemReasons = [
      'Buscado vivo o muerto por el Sindicato por sabotaje industrial.',
      'Contrato de ejecución por interferir en operaciones de contrabando.',
      'Infiltración sospechosa en los servidores del Banco Central.',
      'Deuda pendiente de liquidación con las familias del bajo mundo.',
    ];

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < playersWithoutBounty.length; i++) {
      const target = playersWithoutBounty[i];
      const reward = BigInt((i + 1) * 25000 + 10000);
      const reason = systemReasons[i % systemReasons.length];

      await prisma.bounty.create({
        data: {
          placedById: null,
          targetPlayerId: target.id,
          reward,
          fee: 0n,
          reason,
          isAnonymous: false,
          expiresAt,
        },
      });
    }
  }

  // 5. Reclamar Bounty automáticamente al ganar un combate
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
      const attacker = await tx.player.findUnique({ where: { id: attackerId }, include: { wallet: true } });
      if (!attacker || !attacker.wallet) return null;

      const isHitman = attacker.profession === 'SICARIO';
      const finalReward = isHitman ? activeBounty.reward * 2n : activeBounty.reward;

      const balanceBefore = attacker.wallet.cash;
      const balanceAfter = attacker.wallet.cash + finalReward;

      // Acreditar recompensa al cazador
      await tx.wallet.update({
        where: { playerId: attackerId },
        data: { cash: { increment: finalReward } },
      });

      await tx.transaction.create({
        data: {
          playerId: attackerId,
          amount: finalReward,
          balanceBefore,
          balanceAfter,
          type: 'BOUNTY_REWARD',
          source: 'BOUNTY_SYSTEM',
          metadata: JSON.stringify({ targetPlayerId: defenderId, reward: finalReward.toString(), isHitmanBonus: isHitman }),
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
