import { prisma } from '../db/prisma.js';
import { MAX_INVESTMENT_CAP, INVESTMENT_INTEREST_RATE_28_DAYS } from '../config/constants.js';
import { InsufficientFundsError, InvalidAmountError } from '../errors/gameErrors.js';

export interface StockDefinition {
  symbol: string;
  name: string;
  price: number;
}

export const INITIAL_STOCKS: StockDefinition[] = [
  { symbol: 'TNC', name: 'Torn National Bank', price: 150 },
  { symbol: 'SYS', name: 'Sinford Systems', price: 420 },
  { symbol: 'MED', name: 'PharmaCorp Meds', price: 890 },
  { symbol: 'OIL', name: 'Underworld Energy', price: 1250 },
];

export class InvestmentService {
  // 1. Inversiones Billetera Bancaria a Plazo Fijo Rebalanceadas
  static async createBankInvestment(playerId: string, amount: bigint, durationDays: number) {
    if (amount < 1000n) throw new InvalidAmountError('La inversión mínima en el banco es de **$1,000**.');

    if (amount > MAX_INVESTMENT_CAP) {
      throw new InvalidAmountError(`🏦 La inversión máxima permitida a plazo fijo es de **$${MAX_INVESTMENT_CAP.toLocaleString()}**.`);
    }

    let interestRate = 0.015; // 1.5% por 7 días
    if (durationDays === 14) interestRate = 0.035; // 3.5% por 14 días
    if (durationDays === 28) interestRate = INVESTMENT_INTEREST_RATE_28_DAYS; // 6% por 28 días (rebalanceado)

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < amount) {
        throw new InsufficientFundsError(amount, wallet?.cash || 0n);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - amount;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { decrement: amount } },
      });

      const payout = amount + BigInt(Math.floor(Number(amount) * interestRate));
      const maturesAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      const inv = await tx.bankInvestment.create({
        data: {
          playerId,
          amount,
          interestRate,
          payout,
          maturesAt,
        },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          type: 'BANK_INVESTMENT',
          source: 'BANK',
          metadata: JSON.stringify({ payout: payout.toString(), durationDays }),
        },
      });

      return { inv, payout };
    });
  }

  static async claimBankInvestment(playerId: string, investmentId: string) {
    return prisma.$transaction(async (tx) => {
      const inv = await tx.bankInvestment.findUnique({ where: { id: investmentId } });
      if (!inv || inv.playerId !== playerId || inv.isClaimed) {
        throw new Error('Inversión bancaria no encontrada o ya reclamada.');
      }

      const now = new Date();
      if (inv.maturesAt > now) {
        const daysRemaining = Math.ceil((inv.maturesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(`⏳ Tu inversión aún no ha madurado. Faltan **${daysRemaining} días**.`);
      }

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + inv.payout;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { increment: inv.payout } },
      });

      await tx.bankInvestment.update({
        where: { id: inv.id },
        data: { isClaimed: true },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: inv.payout,
          balanceBefore,
          balanceAfter,
          type: 'BANK_INVESTMENT_MATURED',
          source: 'BANK',
          metadata: JSON.stringify({ payout: inv.payout.toString() }),
        },
      });

      return { payout: inv.payout };
    });
  }

  // 2. Mercado Accionario (Stock Market)
  static async buyStockShares(playerId: string, symbol: string, sharesCount: number) {
    if (sharesCount <= 0) throw new InvalidAmountError('La cantidad de acciones a comprar debe ser un valor entero estrictamente mayor a 0.');

    const stock = INITIAL_STOCKS.find((s) => s.symbol === symbol);
    if (!stock) throw new Error('Acción no encontrada en la bolsa.');

    const totalCost = BigInt(stock.price * sharesCount);

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < totalCost) {
        throw new InsufficientFundsError(totalCost, wallet?.cash || 0n);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - totalCost;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { decrement: totalCost } },
      });

      const playerStock = await tx.playerStock.upsert({
        where: { playerId_symbol: { playerId, symbol } },
        create: { playerId, symbol, shares: sharesCount },
        update: { shares: { increment: sharesCount } },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -totalCost,
          balanceBefore,
          balanceAfter,
          type: 'STOCK_PURCHASE',
          source: 'STOCK_MARKET',
          metadata: JSON.stringify({ symbol, shares: sharesCount }),
        },
      });

      return { playerStock, totalCost };
    });
  }
}
