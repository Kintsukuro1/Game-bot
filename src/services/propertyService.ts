import { prisma } from '../db/prisma.js';
import { PropertyDefinition, PROPERTIES } from '../config/gameData.js';
export { PropertyDefinition, PROPERTIES };

export class PropertyService {
  static async getPlayerProperty(playerId: string) {
    const prop = await prisma.playerProperty.findUnique({ where: { playerId } });
    if (!prop) {
      return prisma.playerProperty.create({
        data: { playerId, propertyType: 'Shack', maxHappy: 100 },
      });
    }
    return prop;
  }

  static async buyProperty(playerId: string, propertyType: string) {
    const propDef = PROPERTIES.find((p) => p.type === propertyType);
    if (!propDef) throw new Error('Propiedad no válida.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      const cost = BigInt(propDef.price);

      if (!wallet || wallet.cash < cost) {
        throw new Error(`Efectivo insuficiente. La propiedad cuesta **$${cost.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - cost;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -cost,
          balanceBefore,
          balanceAfter,
          type: 'PROPERTY_PURCHASE',
          source: 'REAL_ESTATE',
          metadata: JSON.stringify({ propertyType: propDef.type }),
        },
      });

      const updatedProp = await tx.playerProperty.upsert({
        where: { playerId },
        create: { playerId, propertyType: propDef.type, maxHappy: propDef.maxHappy },
        update: { propertyType: propDef.type, maxHappy: propDef.maxHappy },
      });

      await tx.stats.update({
        where: { playerId },
        data: { maxHappy: propDef.maxHappy },
      });

      return updatedProp;
    });
  }

  static async hireStaff(playerId: string, staffType: string) {
    const staffCosts: Record<string, number> = {
      Maid: 500,
      Butler: 1500,
      Guard: 2500,
      Doctor: 5000,
      Pilot: 10000,
    };

    const cost = staffCosts[staffType];
    if (!cost) throw new Error('Tipo de personal no válido.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < BigInt(cost)) {
        throw new Error(`Efectivo insuficiente para contratar **${staffType}** ($${cost}).`);
      }

      await tx.wallet.update({
        where: { playerId },
        data: { cash: wallet.cash - BigInt(cost) },
      });

      const prop = await tx.playerProperty.upsert({
        where: { playerId },
        create: { playerId, propertyType: 'Shack', maxHappy: 300, hasStaff: true, staffType },
        update: { hasStaff: true, staffType, maxHappy: { increment: 200 } },
      });

      await tx.stats.update({
        where: { playerId },
        data: { maxHappy: prop.maxHappy },
      });

      return prop;
    });
  }
}
