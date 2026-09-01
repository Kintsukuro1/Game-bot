import { prisma } from '../db/prisma.js';
import { MAX_INVESTMENT_CAP, INVESTMENT_INTEREST_RATE_28_DAYS } from '../config/constants.js';
import { InsufficientFundsError, InvalidAmountError } from '../errors/gameErrors.js';
import { StockDefinition, INITIAL_STOCKS } from '../config/gameData.js';
export { StockDefinition, INITIAL_STOCKS };

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

  // Venta de Acciones (Stock Market)
  static async sellStockShares(playerId: string, symbol: string, sharesCount: number) {
    if (sharesCount <= 0) throw new InvalidAmountError('La cantidad de acciones a vender debe ser un valor entero estrictamente mayor a 0.');

    const stock = INITIAL_STOCKS.find((s) => s.symbol === symbol);
    if (!stock) throw new Error('Acción no encontrada en la bolsa.');

    return prisma.$transaction(async (tx) => {
      const playerStock = await tx.playerStock.findUnique({
        where: { playerId_symbol: { playerId, symbol } },
      });

      if (!playerStock || playerStock.shares < sharesCount) {
        throw new Error(`No posees suficientes acciones de **${symbol}** para vender (Tienes: ${playerStock?.shares || 0}).`);
      }

      const totalRevenue = BigInt(stock.price * sharesCount);
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + totalRevenue;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { increment: totalRevenue } },
      });

      const updatedShares = playerStock.shares - sharesCount;
      if (updatedShares === 0) {
        await tx.playerStock.delete({
          where: { playerId_symbol: { playerId, symbol } },
        });
      } else {
        await tx.playerStock.update({
          where: { playerId_symbol: { playerId, symbol } },
          data: { shares: updatedShares },
        });
      }

      await tx.transaction.create({
        data: {
          playerId,
          amount: totalRevenue,
          balanceBefore,
          balanceAfter,
          type: 'STOCK_SALE',
          source: 'STOCK_MARKET',
          metadata: JSON.stringify({ symbol, shares: sharesCount }),
        },
      });

      return { totalRevenue, remainingShares: updatedShares };
    });
  }

  /**
   * Cobro de Dividendos Semanales por Bloque de 10,000 Acciones
   */
  static async claimWeeklyStockDividend(playerId: string, symbol: string) {
    return prisma.$transaction(async (tx) => {
      const playerStock = await tx.playerStock.findUnique({
        where: { playerId_symbol: { playerId, symbol } },
      });

      if (!playerStock || playerStock.shares < 10000) {
        throw new Error(`📊 Requiere mantener un bloque de al menos 10,000 acciones de **${symbol}** para recibir dividendos.`);
      }

      // Verificar cooldown de dividendo de 7 días
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDividend = await tx.cooldown.findFirst({
        where: {
          playerId,
          type: `STOCK_DIVIDEND_${symbol}`,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      if (recentDividend) {
        const remainingDays = Math.ceil((recentDividend.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        throw new Error(`⏳ Ya cobraste el dividendo de **${symbol}** esta semana. Vuelve en **${remainingDays} días**.`);
      }

      let rewardMsg = '';
      if (symbol === 'TNC') {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: { increment: 50000n } },
        });
        rewardMsg = '💵 ¡Recibiste un dividendo bancario pasivo de **$50,000 en efectivo**!';
      } else if (symbol === 'MED') {
        const medItem = await tx.item.findFirst({ where: { name: 'First Aid Kit' } });
        if (medItem) {
          const existingInv = await tx.inventoryItem.findFirst({
            where: { playerId, itemId: medItem.id, slot: null },
          });
          if (existingInv) {
            await tx.inventoryItem.update({
              where: { id: existingInv.id },
              data: { quantity: existingInv.quantity + 5 },
            });
          } else {
            await tx.inventoryItem.create({
              data: { playerId, itemId: medItem.id, quantity: 5 },
            });
          }
        }
        rewardMsg = '📦 ¡Recibiste un dividendo de **5x First Aid Kit** entregados a tu inventario!';
      } else if (symbol === 'OIL') {
        await tx.stats.update({
          where: { playerId },
          data: { energy: { increment: 100 } },
        });
        rewardMsg = '⚡ ¡Recibiste un dividendo energético de **+100⚡ de Energía**!';
      } else {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: { increment: 25000n } },
        });
        rewardMsg = '✈️ ¡Recibiste un bono de transporte de **$25,000** en efectivo!';
      }

      await tx.cooldown.create({
        data: {
          playerId,
          type: `STOCK_DIVIDEND_${symbol}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { symbol, rewardMsg };
    });
  }
}
