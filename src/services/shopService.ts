import { prisma } from '../db/prisma.js';
import { InventoryService } from './inventoryService.js';

export class ShopService {
  // Catálogo de la Armería y Mercado de Suministros
  static async getCatalog(category?: string) {
    return prisma.item.findMany({
      where: category ? { type: category } : undefined,
      orderBy: { price: 'asc' },
    });
  }

  // Compra atómica de ítems en la tienda
  static async buyItem(playerId: string, itemId: string, quantity: number = 1) {
    if (quantity <= 0) throw new Error('La cantidad a comprar debe ser al menos 1.');

    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) throw new Error('El objeto no existe en el catálogo.');

      const totalCost = BigInt(item.price * quantity);

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera del jugador no encontrada.');

      if (wallet.cash < totalCost) {
        throw new Error(`Efectivo insuficiente. El costo total es **$${totalCost.toLocaleString()}** y tienes **$${wallet.cash.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - totalCost;

      // Deducción de efectivo atómica
      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      // Auditoría estricta de transacción monetaria
      await tx.transaction.create({
        data: {
          playerId,
          amount: -totalCost,
          balanceBefore,
          balanceAfter,
          type: 'ITEM_PURCHASE',
          source: 'SHOP',
          metadata: JSON.stringify({ itemId: item.id, itemName: item.name, quantity, unitPrice: item.price }),
        },
      });

      // Añadir al inventario
      const existingInv = await tx.inventoryItem.findFirst({
        where: { playerId, itemId, slot: null },
      });

      if (existingInv) {
        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: { quantity: existingInv.quantity + quantity },
        });
      } else {
        await tx.inventoryItem.create({
          data: { playerId, itemId, quantity },
        });
      }

      return { item, quantity, totalCost };
    });
  }

  // Venta de ítem al 50% de su valor
  static async sellItem(playerId: string, inventoryItemId: string, quantity: number = 1) {
    if (quantity <= 0) throw new Error('La cantidad a vender debe ser al menos 1.');

    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem || invItem.playerId !== playerId) {
        throw new Error('Objeto no encontrado en tu inventario.');
      }

      if (invItem.quantity < quantity) {
        throw new Error(`Cantidad insuficiente para vender. Tienes x${invItem.quantity}.`);
      }

      const item = invItem.item;
      const unitSellPrice = Math.floor(item.price * 0.5);
      const totalEarned = BigInt(unitSellPrice * quantity);

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera del jugador no encontrada.');

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + totalEarned;

      // Acreditar efectivo atómicamente
      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      // Crear transacción de auditoría
      await tx.transaction.create({
        data: {
          playerId,
          amount: totalEarned,
          balanceBefore,
          balanceAfter,
          type: 'ITEM_SELL',
          source: 'SHOP',
          metadata: JSON.stringify({ itemId: item.id, itemName: item.name, quantity, unitSellPrice }),
        },
      });

      // Reducir o eliminar de inventario
      if (invItem.quantity <= quantity) {
        await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
      } else {
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { quantity: invItem.quantity - quantity },
        });
      }

      return { item, quantity, totalEarned };
    });
  }
}
