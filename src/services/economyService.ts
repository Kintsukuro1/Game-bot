import { prisma } from '../db/prisma.js';
import { InsufficientFundsError, InvalidAmountError } from '../errors/gameErrors.js';

export class EconomyService {
  // Depósito de Efectivo a Banco con incremento/decremento atómico
  static async deposit(playerId: string, amount: bigint) {
    if (amount <= 0n) throw new InvalidAmountError('El monto a depositar debe ser un valor estrictamente positivo.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      if (wallet.cash < amount) {
        throw new InsufficientFundsError(amount, wallet.cash);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - amount;

      // Actualizar cartera de forma atómica
      const updatedWallet = await tx.wallet.update({
        where: { playerId },
        data: {
          cash: { decrement: amount },
          bank: { increment: amount },
        },
      });

      // Crear registro estricto de transacción
      await tx.transaction.create({
        data: {
          playerId,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          type: 'BANK_DEPOSIT',
          source: 'BANK',
          metadata: JSON.stringify({ action: 'Deposit cash to bank', amount: amount.toString() }),
        },
      });

      return updatedWallet;
    });
  }

  // Retiro de Banco a Efectivo con incremento/decremento atómico
  static async withdraw(playerId: string, amount: bigint) {
    if (amount <= 0n) throw new InvalidAmountError('El monto a retirar debe ser un valor estrictamente positivo.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      if (wallet.bank < amount) {
        throw new InsufficientFundsError(amount, wallet.bank);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + amount;

      const updatedWallet = await tx.wallet.update({
        where: { playerId },
        data: {
          cash: { increment: amount },
          bank: { decrement: amount },
        },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: amount,
          balanceBefore,
          balanceAfter,
          type: 'BANK_WITHDRAW',
          source: 'BANK',
          metadata: JSON.stringify({ action: 'Withdraw bank to cash', amount: amount.toString() }),
        },
      });

      return updatedWallet;
    });
  }

  // Transferencia atómica de dinero entre jugadores
  static async transferCash(senderId: string, receiverDiscordId: string, amount: bigint) {
    if (amount <= 0n) throw new InvalidAmountError('El monto a transferir debe ser un valor estrictamente positivo.');

    return prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({ where: { playerId: senderId }, include: { player: true } });
      if (!senderWallet) throw new Error('Cartera de remitente no encontrada.');

      if (senderWallet.cash < amount) {
        throw new InsufficientFundsError(amount, senderWallet.cash);
      }

      const receiver = await tx.player.findFirst({
        where: { discordId: receiverDiscordId },
        include: { wallet: true },
      });

      if (!receiver || !receiver.wallet) {
        throw new Error('El jugador destinatario no existe o no se ha registrado en el juego.');
      }

      if (receiver.id === senderId) {
        throw new Error('No puedes transferirte dinero a ti mismo.');
      }

      // Restar a remitente atómicamente
      const senderBefore = senderWallet.cash;
      const senderAfter = senderWallet.cash - amount;

      await tx.wallet.update({
        where: { playerId: senderId },
        data: { cash: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          playerId: senderId,
          amount: -amount,
          balanceBefore: senderBefore,
          balanceAfter: senderAfter,
          type: 'PLAYER_TRANSFER_SENT',
          source: receiver.id,
          metadata: JSON.stringify({ receiverUsername: receiver.username, amount: amount.toString() }),
        },
      });

      // Sumar a destinatario atómicamente
      const receiverBefore = receiver.wallet.cash;
      const receiverAfter = receiver.wallet.cash + amount;

      await tx.wallet.update({
        where: { playerId: receiver.id },
        data: { cash: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          playerId: receiver.id,
          amount: amount,
          balanceBefore: receiverBefore,
          balanceAfter: receiverAfter,
          type: 'PLAYER_TRANSFER_RECEIVED',
          source: senderId,
          metadata: JSON.stringify({ senderId, amount: amount.toString() }),
        },
      });

      return { receiverUsername: receiver.username, amount };
    });
  }

  // Obtener historial de transacciones de un jugador
  static async getTransactionHistory(playerId: string, limit: number = 10) {
    return prisma.transaction.findMany({
      where: { playerId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
