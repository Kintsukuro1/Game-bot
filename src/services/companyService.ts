import { prisma } from '../db/prisma.js';

export interface CompanyDefinition {
  type: string;
  name: string;
  price: number;
  dailyRevenue: number;
}

export const COMPANY_TYPES: CompanyDefinition[] = [
  { type: 'Sweet Shop', name: 'Tienda de Dulces', price: 100000, dailyRevenue: 5000 },
  { type: 'Gun Shop', name: 'Armería de la Ciudad', price: 500000, dailyRevenue: 30000 },
  { type: 'Logistics Firm', name: 'Firma de Logística', price: 1000000, dailyRevenue: 75000 },
];

export class CompanyService {
  static async buyCompany(ownerId: string, type: string, name: string, guildId: string = 'GLOBAL') {
    const compDef = COMPANY_TYPES.find((c) => c.type === type);
    if (!compDef) throw new Error('Tipo de empresa no válido.');

    return prisma.$transaction(async (tx) => {
      const existing = await tx.company.findUnique({ where: { ownerId } });
      if (existing) throw new Error('Ya eres dueño de una empresa en la ciudad.');

      const wallet = await tx.wallet.findUnique({ where: { playerId: ownerId } });
      const cost = BigInt(compDef.price);

      if (!wallet || wallet.cash < cost) {
        throw new Error(`Efectivo insuficiente. Comprar la empresa cuesta **$${cost.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - cost;

      await tx.wallet.update({
        where: { playerId: ownerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId: ownerId,
          amount: -cost,
          balanceBefore,
          balanceAfter,
          type: 'COMPANY_PURCHASE',
          source: 'BUSINESS_MARKET',
          metadata: JSON.stringify({ type, companyName: name }),
        },
      });

      const company = await tx.company.create({
        data: {
          guildId,
          ownerId,
          name,
          type,
          revenue: BigInt(compDef.dailyRevenue),
        },
      });

      return company;
    });
  }

  static async hireEmployee(ownerId: string, targetPlayerId: string, salary: bigint) {
    return prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { ownerId } });
      if (!company) throw new Error('No eres dueño de ninguna empresa.');

      const existingEmp = await tx.companyEmployee.findUnique({ where: { playerId: targetPlayerId } });
      if (existingEmp) throw new Error('El jugador ya trabaja en otra empresa.');

      return tx.companyEmployee.create({
        data: {
          companyId: company.id,
          playerId: targetPlayerId,
          salary,
        },
      });
    });
  }

  static async collectCompanyRevenue(ownerId: string) {
    return prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { ownerId } });
      if (!company) throw new Error('No eres dueño de ninguna empresa.');

      if (company.revenue <= 0n) throw new Error('La empresa no tiene ganancias acumuladas para cobrar.');

      const revenueToCollect = company.revenue;
      const wallet = await tx.wallet.findUnique({ where: { playerId: ownerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + revenueToCollect;

      await tx.wallet.update({
        where: { playerId: ownerId },
        data: { cash: balanceAfter },
      });

      await tx.company.update({
        where: { id: company.id },
        data: { revenue: 0n },
      });

      await tx.transaction.create({
        data: {
          playerId: ownerId,
          amount: revenueToCollect,
          balanceBefore,
          balanceAfter,
          type: 'COMPANY_REVENUE_COLLECT',
          source: company.id,
          metadata: JSON.stringify({ companyName: company.name }),
        },
      });

      return { revenueCollected: revenueToCollect, companyName: company.name };
    });
  }
}
