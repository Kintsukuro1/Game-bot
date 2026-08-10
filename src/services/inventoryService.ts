import { prisma } from '../db/prisma.js';

export class InventoryService {
  // Añadir ítem al inventario con apilamiento (Stacking)
  static async addItem(playerId: string, itemId: string, quantity: number = 1) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { playerId, itemId, slot: null },
    });

    if (existing) {
      return prisma.inventoryItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return prisma.inventoryItem.create({
      data: {
        playerId,
        itemId,
        quantity,
      },
    });
  }

  // Quitar ítem del inventario
  static async removeItem(playerId: string, inventoryItemId: string, quantity: number = 1) {
    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!invItem || invItem.playerId !== playerId) {
      throw new Error('Objeto no encontrado en tu inventario.');
    }

    if (invItem.quantity <= quantity) {
      return prisma.inventoryItem.delete({
        where: { id: inventoryItemId },
      });
    }

    return prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantity: invItem.quantity - quantity },
    });
  }

  // Uso de Consumibles (Medical, Drugs, Energy Drinks, Alcohol, Candy)
  static async useItem(playerId: string, inventoryItemId: string) {
    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem || invItem.playerId !== playerId) {
        throw new Error('Objeto no encontrado.');
      }

      const item = invItem.item;
      const effect = item.effect ? JSON.parse(item.effect) : {};
      const stats = await tx.stats.findUnique({ where: { playerId } });
      const body = await tx.bodyParts.findUnique({ where: { playerId } });

      if (!stats || !body) throw new Error('Estadísticas del jugador no encontradas.');

      let message = `Consumiste **${item.name}**. `;

      // Aplica efectos según categoría oficial de Torn Wiki
      if (effect.addEnergy) {
        const newEnergy = Math.min(stats.energy + effect.addEnergy, stats.maxEnergy + 250); // permite sobrecargar
        await tx.stats.update({ where: { playerId }, data: { energy: newEnergy } });
        message += `⚡ +${effect.addEnergy} Energía (Total: ${newEnergy}). `;
      }

      if (effect.addNerve) {
        const newNerve = Math.min(stats.nerve + effect.addNerve, stats.maxNerve + 50);
        await tx.stats.update({ where: { playerId }, data: { nerve: newNerve } });
        message += `🧠 +${effect.addNerve} Nerve (Total: ${newNerve}). `;
      }

      if (effect.addHappy) {
        const newHappy = Math.min(stats.happy + effect.addHappy, stats.maxHappy + 1000);
        await tx.stats.update({ where: { playerId }, data: { happy: newHappy } });
        message += `😊 +${effect.addHappy} Happy (Total: ${newHappy}). `;
      }

      if (effect.doubleHappy) {
        const newHappy = Math.min(stats.happy * 2, stats.maxHappy * 2);
        await tx.stats.update({ where: { playerId }, data: { happy: newHappy } });
        message += `😊 ¡Felicidad duplicada! (Total: ${newHappy}). `;
      }

      if (effect.healHp) {
        // Curar todas las partes del cuerpo
        await tx.bodyParts.update({
          where: { playerId },
          data: {
            headHp: Math.min(body.headHp + effect.healHp, 100),
            torsoHp: Math.min(body.torsoHp + effect.healHp, 100),
            leftArmHp: Math.min(body.leftArmHp + effect.healHp, 100),
            rightArmHp: Math.min(body.rightArmHp + effect.healHp, 100),
            leftLegHp: Math.min(body.leftLegHp + effect.healHp, 100),
            rightLegHp: Math.min(body.rightLegHp + effect.healHp, 100),
          },
        });
        message += `🏥 Curados ${effect.healHp} HP en todas las zonas del cuerpo. `;
      }

      if (effect.healPercent) {
        const healAmt = Math.round(100 * (effect.healPercent / 100));
        await tx.bodyParts.update({
          where: { playerId },
          data: {
            headHp: Math.min(body.headHp + healAmt, 100),
            torsoHp: Math.min(body.torsoHp + healAmt, 100),
            leftArmHp: Math.min(body.leftArmHp + healAmt, 100),
            rightArmHp: Math.min(body.rightArmHp + healAmt, 100),
            leftLegHp: Math.min(body.leftLegHp + healAmt, 100),
            rightLegHp: Math.min(body.rightLegHp + healAmt, 100),
          },
        });
        message += `🏥 Restaurado ${effect.healPercent}% de salud corporal. `;
      }

      // Restar 1 unidad del inventario
      if (invItem.quantity <= 1) {
        await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
      } else {
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { quantity: invItem.quantity - 1 },
        });
      }

      return message;
    });
  }

  // Equipar / Desequipar Armas
  static async toggleEquipItem(playerId: string, inventoryItemId: string) {
    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem || invItem.playerId !== playerId) {
        throw new Error('Objeto no encontrado en inventario.');
      }

      const itemSlot = invItem.item.slot;
      if (!itemSlot) throw new Error('Este objeto no se puede equipar como arma.');

      if (invItem.isEquipped) {
        // Desequipar
        return tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { isEquipped: false, slot: null },
        });
      } else {
        // Desequipar cualquier arma previa en esa misma ranura
        await tx.inventoryItem.updateMany({
          where: { playerId, slot: itemSlot, isEquipped: true },
          data: { isEquipped: false, slot: null },
        });

        // Equipar nueva arma
        return tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { isEquipped: true, slot: itemSlot },
        });
      }
    });
  }
}
