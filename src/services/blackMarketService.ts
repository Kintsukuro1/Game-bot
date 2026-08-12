import { prisma } from '../db/prisma.js';
import { DEFAULT_GUILD_ID } from '../config/constants.js';
import { InsufficientFundsError } from '../errors/gameErrors.js';

export class BlackMarketService {
  // Obtener o inicializar el Mercado Negro activo (duración: 2 horas)
  static async getOrCreateActiveBlackMarket(guildId: string = DEFAULT_GUILD_ID) {
    const now = new Date();

    let activeEvent = await prisma.blackMarketEvent.findFirst({
      where: {
        guildId,
        isActive: true,
        expiresAt: { gt: now },
      },
    });

    if (!activeEvent) {
      const npcs = ['El Ruso 🕵️', 'El Flaco Charly 🧥', 'Vane El Químico 🧪'];
      const locations = ['Muelle 4 del Puerto', 'El Callejón del Sapo', 'Distrito Industrial Abandonado'];

      const npcName = npcs[Math.floor(Math.random() * npcs.length)];
      const locationName = locations[Math.floor(Math.random() * locations.length)];
      const clueMessage = `🕵️ **Rumor Urbano:** Se ha visto a **${npcName}** merodeando cerca de **${locationName}**. El Mercado Negro estará abierto por 2 horas.`;
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      activeEvent = await prisma.blackMarketEvent.create({
        data: {
          guildId,
          npcName,
          locationName,
          clueMessage,
          adrenalinaStock: 1, // 1 sola unidad por evento para todo el servidor
          sueroStock: 1,
          m32Stock: 1,
          isActive: true,
          expiresAt,
        },
      });
    }

    return activeEvent;
  }

  // Calcular precio escalado según uso previo (+50% por uso previo)
  static calculateScaledPrice(basePrice: bigint, previousUses: number): bigint {
    const multiplier = Math.pow(1.5, previousUses);
    return BigInt(Math.floor(Number(basePrice) * multiplier));
  }

  // Comprar objeto del Mercado Negro con 4 Controles Anti-Abuso
  static async buyBlackMarketItem(playerId: string, itemType: 'ADRENALINA' | 'SUERO' | 'M32') {
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

      // Verificación de descuento por profesión Contrabandista (-10%)
      const isSmuggler = player.profession === 'CONTRABANDISTA';
      const discountFactor = isSmuggler ? 0.90 : 1.0;

      // 1. INYECCIÓN DE ADRENALINA PURA (+5⚡ Max Energy permanente)
      if (itemType === 'ADRENALINA') {
        if (activeEvent.adrenalinaStock <= 0) {
          throw new Error('📦 ¡AGOTADO! La Inyección de Adrenalina ya fue comprada por otro jugador en este evento.');
        }

        // BARRERA 1: Hard Cap (Máximo 5/5 por personaje)
        if (player.stats.adrenalinaUses >= 5) {
          throw new Error('💉 **Límite Alcanzado (5/5 usos)**: Tu organismo ha alcanzado la tolerancia máxima a la Adrenalina Pura.');
        }

        // BARRERA 2: Escalado de Precio (+50% por uso previo)
        const baseCost = 100000n;
        const rawScaledCost = this.calculateScaledPrice(baseCost, player.stats.adrenalinaUses);
        const finalCost = BigInt(Math.floor(Number(rawScaledCost) * discountFactor));

        if (player.wallet.cash < finalCost) {
          throw new InsufficientFundsError(finalCost, player.wallet.cash);
        }

        // BARRERA 3: Riesgo de Toxicidad / OD (15% si uso previo > 0)
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

        // Deducir efectivo y descontar stock global
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
          cost: finalCost,
          msg: `💉 **¡Mejora Permanente!** Tu Energía Máxima aumentó a **${player.stats.maxEnergy + 5}⚡** (Uso ${player.stats.adrenalinaUses + 1}/5).`,
        };
      }

      // 2. SUERO MUSCULAR EXPERIMENTAL (+1.0 Strength permanente)
      if (itemType === 'SUERO') {
        if (activeEvent.sueroStock <= 0) {
          throw new Error('📦 ¡AGOTADO! El Suero Muscular ya fue comprado por otro jugador en este evento.');
        }

        // BARRERA 1: Hard Cap (Máximo 3/3 por personaje)
        if (player.stats.sueroUses >= 3) {
          throw new Error('🧪 **Límite Alcanzado (3/3 usos)**: Has alcanzado el límite genético máximo de Suero Muscular.');
        }

        // BARRERA 2: Escalado de Precio (+50% por uso previo)
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
          cost: finalCost,
          msg: `🧪 **¡Fuerza Permanente!** Tu Fuerza aumentó a **${(player.stats.strength + 1.0).toFixed(1)} STRENGTH** (Uso ${player.stats.sueroUses + 1}/3).`,
        };
      }

      throw new Error('Objeto no válido.');
    });
  }
}
