import { prisma } from '../db/prisma.js';

export interface ShopCategoryInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const SHOP_CATEGORIES: ShopCategoryInfo[] = [
  {
    id: 'general',
    name: 'General & Alimentos',
    emoji: '🍎',
    description: 'Comida rápida, dulces, loterías y paquetes de suministros generales.',
  },
  {
    id: 'medical',
    name: 'Medicina & Salud',
    emoji: '🏥',
    description: 'Botiquines de primeros auxilios, transfusiones y bolsas de sangre.',
  },
  {
    id: 'boosters',
    name: 'Drogas, Alcohol & Energéticas',
    emoji: '💊',
    description: 'Bebidas energéticas, licores, esteroides y drogas para boostear stats.',
  },
  {
    id: 'weapons',
    name: 'Armería & Armamentos',
    emoji: '⚔️',
    description: 'Pistolas, rifles de asalto, subfusiles, katanas y granadas pesadas.',
  },
];

export class ShopService {
  // Cálculo de Nivel Mínimo requerido según el precio y la potencia del ítem
  static getItemMinLevel(item: any): number {
    if (item.price <= 500) return 1;
    if (item.price <= 2500) return 3;
    if (item.price <= 10000) return 5;
    if (item.price <= 100000) return 10;
    return 15;
  }

  // Obtener catálogo filtrado por la categoría activa (0: General, 1: Medicina, 2: Drogas, 3: Armería)
  static async getCatalogByCategory(catIndex: number) {
    const validIndex = ((catIndex % SHOP_CATEGORIES.length) + SHOP_CATEGORIES.length) % SHOP_CATEGORIES.length;

    switch (validIndex) {
      case 0: // General & Alimentos
        return prisma.item.findMany({
          where: {
            OR: [
              { type: 'MISC' },
              { type: 'CONSUMABLE', weaponType: { in: ['Food', 'Candy', 'SupplyPack', 'Ticket'] } },
            ],
          },
          orderBy: { price: 'asc' },
        });

      case 1: // Medicina & Salud
        return prisma.item.findMany({
          where: { type: 'MEDICAL' },
          orderBy: { price: 'asc' },
        });

      case 2: // Drogas, Alcohol & Energéticas
        return prisma.item.findMany({
          where: {
            type: 'CONSUMABLE',
            OR: [
              { weaponType: { in: ['Drug', 'EnergyDrink', 'Alcohol', 'Booster'] } },
              { weaponType: null },
            ],
          },
          orderBy: { price: 'asc' },
        });

      case 3: // Armería & Armamentos
        return prisma.item.findMany({
          where: { type: 'WEAPON' },
          orderBy: { price: 'asc' },
        });

      default:
        return prisma.item.findMany({ orderBy: { price: 'asc' } });
    }
  }

  // Catálogo completo o por tipo
  static async getCatalog(category?: string) {
    return prisma.item.findMany({
      where: category ? { type: category } : undefined,
      orderBy: { price: 'asc' },
    });
  }

  // Compra atómica de ítems en la tienda con verificación estricta de nivel
  static async buyItem(playerId: string, itemId: string, quantity: number = 1) {
    if (quantity <= 0) throw new Error('La cantidad a comprar debe ser al menos 1.');

    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) throw new Error('El objeto no existe en el catálogo.');

      const player = await tx.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error('Jugador no encontrado.');

      const minLevel = this.getItemMinLevel(item);
      if (player.level < minLevel) {
        throw new Error(`Nivel insuficiente para comprar este objeto. Requieres **Nivel ${minLevel}** (Tu nivel: **${player.level}**).`);
      }

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
