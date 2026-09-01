import { prisma } from '../db/prisma.js';
import { DEFAULT_GUILD_ID } from '../config/constants.js';
import { InsufficientFundsError } from '../errors/gameErrors.js';

export class BlackMarketService {
  // Obtener o inicializar el Mercado Negro activo (duración: 2 horas) con stock limitado por nivel
  static async getOrCreateActiveBlackMarket(guildId: string = DEFAULT_GUILD_ID, playerId?: string) {
    const now = new Date();

    let activeEvent = await prisma.blackMarketEvent.findFirst({
      where: {
        guildId,
        isActive: true,
        expiresAt: { gt: now },
      },
    });

    if (!activeEvent) {
      const npcs = ['El Ruso 🕵️', 'El Flaco Charly 🧥', 'Vane El Químico 🧪', 'La Patrona 💋'];
      const locations = ['Muelle 4 del Puerto', 'El Callejón del Sapo', 'Distrito Industrial Abandonado', 'Búnker de la Bahía'];

      const npcName = npcs[Math.floor(Math.random() * npcs.length)];
      const locationName = locations[Math.floor(Math.random() * locations.length)];
      const clueMessage = `🕵️ **Rumor Urbano:** Se ha visto a **${npcName}** en **${locationName}** ofreciendo un embarque clandestino de armas de alto calibre. El Mercado Negro cierra en 2 horas.`;
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      activeEvent = await prisma.blackMarketEvent.create({
        data: {
          guildId,
          npcName,
          locationName,
          clueMessage,
          adrenalinaStock: 1,
          sueroStock: 1,
          m32Stock: 1,
          isActive: true,
          expiresAt,
        },
      });
    }

    let playerLevel = 1;
    let isSmuggler = false;

    if (playerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (player) {
        playerLevel = player.level;
        isSmuggler = player.profession === 'CONTRABANDISTA';
      }
    }

    // Cálculo de stock máximo por cargamento según Nivel (+50% para Contrabandistas)
    const baseMaxStock = Math.max(3, 3 + Math.floor(playerLevel / 2));
    const maxStock = isSmuggler ? Math.floor(baseMaxStock * 1.5) : baseMaxStock;

    // Obtener catálogo de armas balísticas de alto calibre (> $2,500)
    const weapons = await prisma.item.findMany({
      where: { type: 'WEAPON', price: { gt: 2500 } },
      orderBy: { price: 'asc' },
    });

    // Consultar compras realizadas en la sesión activa del Mercado Negro
    const eventPurchases = playerId
      ? await prisma.transaction.findMany({
          where: {
            playerId,
            type: 'BLACK_MARKET_PURCHASE',
            timestamp: { gte: activeEvent.createdAt },
          },
        })
      : [];

    const enrichedWeapons = weapons.map((w) => {
      const boughtCount = eventPurchases.filter((tx) => {
        try {
          const meta = JSON.parse(tx.metadata || '{}');
          return meta.itemId === w.id;
        } catch {
          return false;
        }
      }).length;

      const stockRemaining = Math.max(0, maxStock - boughtCount);

      return {
        ...w,
        maxStock,
        stockRemaining,
      };
    });

    return {
      event: activeEvent,
      weapons: enrichedWeapons,
      maxStock,
    };
  }

  // Calcular precio escalado según uso previo (+50% por uso previo)
  static calculateScaledPrice(basePrice: bigint, previousUses: number): bigint {
    const multiplier = Math.pow(1.5, previousUses);
    return BigInt(Math.floor(Number(basePrice) * multiplier));
  }

  // Comprar objeto o arma del Mercado Negro con cupo limitado de cargamento
  static async buyBlackMarketItem(playerId: string, itemType: string) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const activeEvent = await tx.blackMarketEvent.findFirst({
        where: { isActive: true, expiresAt: { gt: now } },
      });

      if (!activeEvent) {
        throw new Error('🕵️ El Mercado Negro se ha retirado de la ciudad. Espera a la siguiente pista urbana.');
      }

      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, wallet: true },
      });

      if (!player || !player.stats || !player.wallet) {
        throw new Error('Jugador no encontrado.');
      }

      const isSmuggler = player.profession === 'CONTRABANDISTA';
      const discountFactor = isSmuggler ? 0.90 : 1.0;

      // 1. INYECCIÓN DE ADRENALINA PURA (+5⚡ Max Energy permanente)
      if (itemType === 'ADRENALINA') {
        if (activeEvent.adrenalinaStock <= 0) {
          throw new Error('📦 ¡AGOTADO! La Inyección de Adrenalina ya fue comprada por otro jugador en este evento.');
        }

        if (player.stats.adrenalinaUses >= 5) {
          throw new Error('💉 **Límite Alcanzado (5/5 usos)**: Tu organismo ha alcanzado la tolerancia máxima a la Adrenalina Pura.');
        }

        const baseCost = 100000n;
        const rawScaledCost = this.calculateScaledPrice(baseCost, player.stats.adrenalinaUses);
        const finalCost = BigInt(Math.floor(Number(rawScaledCost) * discountFactor));

        if (player.wallet.cash < finalCost) {
          throw new InsufficientFundsError(finalCost, player.wallet.cash);
        }

        const isOverdose = player.stats.adrenalinaUses > 0 && Math.random() < 0.15;
        if (isOverdose) {
          const hospitalUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
          await tx.player.update({
            where: { id: playerId },
            data: { hospitalUntil },
          });
          await tx.stats.update({
            where: { playerId },
            data: { happy: 0 },
          });
          throw new Error('💀 **¡COLAPSO BIOLÓGICO!** Tu cuerpo rechazó la sustancia experimental. Fuiste hospitalizado por 2 horas y tu Felicidad cayó a 0.');
        }

        await tx.wallet.update({
          where: { playerId },
          data: { cash: { decrement: finalCost } },
        });

        await tx.blackMarketEvent.update({
          where: { id: activeEvent.id },
          data: { adrenalinaStock: 0 },
        });

        await tx.stats.update({
          where: { playerId },
          data: {
            maxEnergy: player.stats.maxEnergy + 5,
            adrenalinaUses: player.stats.adrenalinaUses + 1,
          },
        });

        return {
          itemName: 'Inyección de Adrenalina Pura 💉',
          cost: Number(finalCost),
          msg: `💉 **¡Mejora Permanente!** Tu Energía Máxima aumentó a **${player.stats.maxEnergy + 5}⚡** (Uso ${player.stats.adrenalinaUses + 1}/5).`,
        };
      }

      // 2. SUERO MUSCULAR EXPERIMENTAL (+1.0 Strength permanente)
      if (itemType === 'SUERO') {
        if (activeEvent.sueroStock <= 0) {
          throw new Error('📦 ¡AGOTADO! El Suero Muscular ya fue comprado por otro jugador en este evento.');
        }

        if (player.stats.sueroUses >= 3) {
          throw new Error('🧪 **Límite Alcanzado (3/3 usos)**: Has alcanzado el límite genético máximo de Suero Muscular.');
        }

        const baseCost = 75000n;
        const rawScaledCost = this.calculateScaledPrice(baseCost, player.stats.sueroUses);
        const finalCost = BigInt(Math.floor(Number(rawScaledCost) * discountFactor));

        if (player.wallet.cash < finalCost) {
          throw new InsufficientFundsError(finalCost, player.wallet.cash);
        }

        await tx.wallet.update({
          where: { playerId },
          data: { cash: { decrement: finalCost } },
        });

        await tx.blackMarketEvent.update({
          where: { id: activeEvent.id },
          data: { sueroStock: 0 },
        });

        await tx.stats.update({
          where: { playerId },
          data: {
            strength: player.stats.strength + 1.0,
            sueroUses: player.stats.sueroUses + 1,
          },
        });

        return {
          itemName: 'Suero Muscular Experimental 🧪',
          cost: Number(finalCost),
          msg: `🧪 **¡Fuerza Permanente!** Tu Fuerza aumentó a **${(player.stats.strength + 1.0).toFixed(1)} STRENGTH** (Uso ${player.stats.sueroUses + 1}/3).`,
        };
      }

      // 3. COMPRA DE ARMA DE CONTRABANDO DE ALTO CALIBRE CON CUPO LIMITADO POR CARGAMENTO
      let dbItem = await tx.item.findUnique({ where: { id: itemType } });
      if (!dbItem) {
        dbItem = await tx.item.findFirst({ where: { name: itemType } });
      }

      if (dbItem) {
        const baseMaxStock = Math.max(3, 3 + Math.floor(player.level / 2));
        const maxStock = isSmuggler ? Math.floor(baseMaxStock * 1.5) : baseMaxStock;

        // Comprobar compras previas de esta arma en el cargamento activo
        const pastPurchases = await tx.transaction.findMany({
          where: {
            playerId: player.id,
            type: 'BLACK_MARKET_PURCHASE',
            timestamp: { gte: activeEvent.createdAt },
          },
        });

        const boughtInShipment = pastPurchases.filter((tx) => {
          try {
            const meta = JSON.parse(tx.metadata || '{}');
            return meta.itemId === dbItem.id;
          } catch {
            return false;
          }
        }).length;

        if (boughtInShipment >= maxStock) {
          throw new Error(`📦 **¡CARGAMENTO AGOTADO!** Has alcanzado tu límite de **${maxStock} unidades** de **${dbItem.name}** en este embarque. (Nivel ${player.level}${isSmuggler ? ' + Bonus Contrabandista' : ''}).`);
        }

        const baseCost = BigInt(dbItem.price);
        const finalCost = BigInt(Math.floor(Number(baseCost) * discountFactor));

        if (player.wallet.cash < finalCost) {
          throw new InsufficientFundsError(finalCost, player.wallet.cash);
        }

        const balanceBefore = player.wallet.cash;
        const balanceAfter = player.wallet.cash - finalCost;

        await tx.wallet.update({
          where: { playerId },
          data: { cash: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            playerId,
            amount: -finalCost,
            balanceBefore,
            balanceAfter,
            type: 'BLACK_MARKET_PURCHASE',
            source: 'BLACK_MARKET',
            metadata: JSON.stringify({ itemId: dbItem.id, itemName: dbItem.name, price: Number(finalCost) }),
          },
        });

        const existingInv = await tx.inventoryItem.findFirst({
          where: { playerId, itemId: dbItem.id, slot: null },
        });

        if (existingInv) {
          await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: existingInv.quantity + 1 },
          });
        } else {
          await tx.inventoryItem.create({
            data: { playerId, itemId: dbItem.id, quantity: 1 },
          });
        }

        return {
          itemName: dbItem.name,
          cost: Number(finalCost),
          msg: `⚔️ **¡Compra de Armamento Exitosa!** Adquiriste **${dbItem.name}** por **$${finalCost.toLocaleString()}** (Stock: ${maxStock - boughtInShipment - 1}/${maxStock}). Se añadió a tu Armería.`,
        };
      }

      throw new Error('Objeto o arma no encontrada en el catálogo del Mercado Negro.');
    });
  }
}
