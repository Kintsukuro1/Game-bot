import { prisma } from '../db/prisma.js';

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
  // 1. Inversiones Billetera Bancaria a Plazo Fijo
  static async createBankInvestment(playerId: string, amount: bigint, durationDays: number) {
    if (amount < 1000n) throw new Error('La inversión mínima en el banco es de **$1,000**.');

    let interestRate = 0.05; // 5% por 7 días
    if (durationDays === 14) interestRate = 0.12; // 12% por 14 días
    if (durationDays === 28) interestRate = 0.30; // 30% por 28 días

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < amount) {
        throw new Error(`Efectivo insuficiente. Tienes **$${wallet?.cash.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - amount;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
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
        data: { cash: balanceAfter },
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
    if (sharesCount <= 0) throw new Error('La cantidad de acciones debe ser mayor a 0.');

    const stock = INITIAL_STOCKS.find((s) => s.symbol === symbol);
    if (!stock) throw new Error('Acción no encontrada en la bolsa.');

    const totalCost = BigInt(stock.price * sharesCount);

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < totalCost) {
        throw new Error(`Efectivo insuficiente. Comprar ${sharesCount} acciones de ${stock.symbol} cuesta **$${totalCost.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - totalCost;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
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
