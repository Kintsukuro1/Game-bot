import { prisma } from '../db/prisma.js';

export class CasinoService {
  // 1. Tragamonedas (Slots Machine)
  static async playSlots(playerId: string, betCash: bigint) {
    if (betCash <= 0n) throw new Error('La apuesta debe ser mayor a 0.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < betCash) {
        throw new Error(`Efectivo insuficiente. Tienes **$${wallet?.cash.toLocaleString()}**.`);
      }

      const symbols = ['🍒', '🔔', '7️⃣', '💎'];
      const r1 = symbols[Math.floor(Math.random() * symbols.length)];
      const r2 = symbols[Math.floor(Math.random() * symbols.length)];
      const r3 = symbols[Math.floor(Math.random() * symbols.length)];

      let multiplier = 0n;
      if (r1 === r2 && r2 === r3) {
        multiplier = r1 === '💎' ? 50n : 10n; // Jackpot
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        multiplier = 2n; // Par
      }

      const winAmount = betCash * multiplier;
      const netGain = winAmount - betCash;

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + netGain;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: netGain,
          balanceBefore,
          balanceAfter,
          type: netGain >= 0n ? 'CASINO_SLOTS_WIN' : 'CASINO_SLOTS_LOSS',
          source: 'CASINO',
          metadata: JSON.stringify({ reels: `${r1} ${r2} ${r3}`, multiplier: multiplier.toString() }),
        },
      });

      return { reels: `${r1} ${r2} ${r3}`, netGain, isWin: netGain > 0n };
    });
  }

  // 2. Blackjack (Duelo de 21 contra la casa)
  static async playBlackjack(playerId: string, betCash: bigint) {
    if (betCash <= 0n) throw new Error('La apuesta debe ser mayor a 0.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < betCash) {
        throw new Error(`Efectivo insuficiente. Tienes **$${wallet?.cash.toLocaleString()}**.`);
      }

      const playerHand = Math.floor(Math.random() * 10) + 12; // 12-21
      const dealerHand = Math.floor(Math.random() * 10) + 12; // 12-21

      let isWin = false;
      let multiplier = 0n;

      if (playerHand <= 21 && (dealerHand > 21 || playerHand > dealerHand)) {
        isWin = true;
        multiplier = playerHand === 21 ? 3n : 2n;
      }

      const winAmount = betCash * multiplier;
      const netGain = winAmount - betCash;

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + netGain;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: netGain,
          balanceBefore,
          balanceAfter,
          type: netGain >= 0n ? 'CASINO_BJ_WIN' : 'CASINO_BJ_LOSS',
          source: 'CASINO',
          metadata: JSON.stringify({ playerHand, dealerHand }),
        },
      });

      return { playerHand, dealerHand, isWin, netGain };
    });
  }
}
