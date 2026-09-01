import { prisma } from '../db/prisma.js';

export class MarketService {
  // 1. Mercado de Jugadores (Player Market)
  static async listItemForSale(sellerId: string, inventoryItemId: string, price: bigint) {
    if (price <= 0n) throw new Error('El precio de venta debe ser mayor a 0.');

    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findFirst({
        where: { id: inventoryItemId, playerId: sellerId },
        include: { item: true },
      });

      if (!invItem || invItem.quantity <= 0) {
        throw new Error('No posees este ítem en tu inventario.');
      }

      // Descontar 1 unidad del inventario del vendedor
      if (invItem.quantity === 1) {
        await tx.inventoryItem.delete({ where: { id: invItem.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: invItem.quantity - 1 },
        });
      }

      const marketItem = await tx.marketItem.create({
        data: {
          sellerId,
          itemId: invItem.itemId,
          price,
          quantity: 1,
          status: 'ACTIVE',
        },
      });

      return marketItem;
    });
  }

  static async getActiveMarketItems() {
    return prisma.marketItem.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  }

  static async buyMarketItem(buyerId: string, marketItemId: string) {
    return prisma.$transaction(async (tx) => {
      const listing = await tx.marketItem.findUnique({ where: { id: marketItemId } });
      if (!listing || listing.status !== 'ACTIVE') {
        throw new Error('La oferta del mercado ya no está disponible.');
      }

      if (listing.sellerId === buyerId) {
        throw new Error('No puedes comprar tu propio objeto del mercado.');
      }

      const buyerWallet = await tx.wallet.findUnique({ where: { playerId: buyerId } });
      if (!buyerWallet || buyerWallet.cash < listing.price) {
        throw new Error(`Efectivo insuficiente. El objeto cuesta **$${listing.price.toLocaleString()}**.`);
      }

      const sellerWallet = await tx.wallet.findUnique({ where: { playerId: listing.sellerId } });

      // Transferir dinero del comprador al vendedor
      await tx.wallet.update({
        where: { playerId: buyerId },
        data: { cash: buyerWallet.cash - listing.price },
      });

      if (sellerWallet) {
        await tx.wallet.update({
          where: { playerId: listing.sellerId },
          data: { cash: sellerWallet.cash + listing.price },
        });
      }

      // Marcar listado como vendido
      await tx.marketItem.update({
        where: { id: listing.id },
        data: { status: 'SOLD' },
      });

      // Transferir ítem al inventario del comprador
      const existingInv = await tx.inventoryItem.findFirst({
        where: { playerId: buyerId, itemId: listing.itemId, isEquipped: false },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { quantity: existingInv.quantity + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            playerId: buyerId,
            itemId: listing.itemId,
            quantity: 1,
          },
        });
      }

      return { price: listing.price };
    });
  }

  // 2. Comercio Directo (Direct Trade)
  static async createTrade(senderId: string, receiverId: string, senderCash: bigint) {
    if (senderId === receiverId) throw new Error('No puedes comerciar contigo mismo.');

    return prisma.trade.create({
      data: {
        senderId,
        receiverId,
        senderCash,
        status: 'PENDING',
      },
    });
  }

  static async confirmTrade(tradeId: string, playerId: string) {
    return prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUnique({ where: { id: tradeId } });
      if (!trade || trade.status !== 'PENDING') throw new Error('Intercambio no válido.');

      if (trade.senderId === playerId) {
        trade.senderConfirmed = true;
      } else if (trade.receiverId === playerId) {
        trade.receiverConfirmed = true;
      } else {
        throw new Error('No formas parte de este intercambio.');
      }

      if (trade.senderConfirmed && trade.receiverConfirmed) {
        // Transferencia atómica de fondos
        if (trade.senderCash > 0n) {
          const senderWallet = await tx.wallet.findUnique({ where: { playerId: trade.senderId } });
          if (!senderWallet || senderWallet.cash < trade.senderCash) {
            throw new Error('El iniciador del intercambio no posee los fondos suficientes acordados.');
          }
          await tx.wallet.update({
            where: { playerId: trade.senderId },
            data: { cash: { decrement: trade.senderCash } },
          });
          await tx.wallet.update({
            where: { playerId: trade.receiverId },
            data: { cash: { increment: trade.senderCash } },
          });
        }

        if (trade.receiverCash > 0n) {
          const receiverWallet = await tx.wallet.findUnique({ where: { playerId: trade.receiverId } });
          if (!receiverWallet || receiverWallet.cash < trade.receiverCash) {
            throw new Error('El receptor del intercambio no posee los fondos suficientes acordados.');
          }
          await tx.wallet.update({
            where: { playerId: trade.receiverId },
            data: { cash: { decrement: trade.receiverCash } },
          });
          await tx.wallet.update({
            where: { playerId: trade.senderId },
            data: { cash: { increment: trade.receiverCash } },
          });
        }

        await tx.trade.update({
          where: { id: trade.id },
          data: { status: 'COMPLETED' },
        });

        return { completed: true };
      } else {
        await tx.trade.update({
          where: { id: trade.id },
          data: {
            senderConfirmed: trade.senderConfirmed,
            receiverConfirmed: trade.receiverConfirmed,
          },
        });

        return { completed: false };
      }
    });
  }
}
