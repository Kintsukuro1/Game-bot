import { prisma } from '../db/prisma.js';
import { DEFAULT_GUILD_ID } from '../config/constants.js';
import { InsufficientFundsError, InvalidAmountError } from '../errors/gameErrors.js';

export class FactionService {
  // 1. Crear Facción
  static async createFaction(leaderId: string, name: string, description: string = '', guildId: string = DEFAULT_GUILD_ID) {
    if (name.length < 3 || name.length > 32) {
      throw new Error('El nombre de la facción debe tener entre 3 y 32 caracteres.');
    }

    return prisma.$transaction(async (tx) => {
      const leaderMember = await tx.factionMember.findUnique({ where: { playerId: leaderId } });
      if (leaderMember) {
        throw new Error('Ya perteneces a una facción. Abandónala para crear una nueva.');
      }

      const wallet = await tx.wallet.findUnique({ where: { playerId: leaderId } });
      const createCost = 50000n;

      if (!wallet || wallet.cash < createCost) {
        throw new InsufficientFundsError(createCost, wallet?.cash || 0n);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - createCost;

      await tx.wallet.update({
        where: { playerId: leaderId },
        data: { cash: { decrement: createCost } },
      });

      await tx.transaction.create({
        data: {
          playerId: leaderId,
          amount: -createCost,
          balanceBefore,
          balanceAfter,
          type: 'FACTION_CREATION_FEE',
          source: 'FACTION_SYSTEM',
          metadata: JSON.stringify({ factionName: name }),
        },
      });

      const faction = await tx.faction.create({
        data: {
          guildId,
          name,
          description,
          leaderId,
          members: {
            create: {
              playerId: leaderId,
              role: 'LEADER',
            },
          },
        },
        include: { members: true },
      });

      return faction;
    });
  }

  // 2. Unirse a una facción
  static async joinFaction(playerId: string, factionId: string) {
    return prisma.$transaction(async (tx) => {
      const existingMember = await tx.factionMember.findUnique({ where: { playerId } });
      if (existingMember) {
        throw new Error('Ya perteneces a una facción.');
      }

      const faction = await tx.faction.findUnique({ where: { id: factionId }, include: { members: true } });
      if (!faction) throw new Error('Facción no encontrada.');

      if (faction.members.length >= 20) {
        throw new Error('La facción ha alcanzado el límite de 20 miembros.');
      }

      return tx.factionMember.create({
        data: {
          factionId,
          playerId,
          role: 'MEMBER',
        },
      });
    });
  }

  // 3. Depositar en la Tesorería de la Facción con operaciones atómicas
  static async depositTreasury(playerId: string, amount: bigint) {
    if (amount <= 0n) throw new InvalidAmountError('El monto a depositar debe ser mayor a 0.');

    return prisma.$transaction(async (tx) => {
      const member = await tx.factionMember.findUnique({ where: { playerId } });
      if (!member) throw new Error('No perteneces a ninguna facción.');

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

      await tx.faction.update({
        where: { id: member.factionId },
        data: { treasury: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          type: 'FACTION_TREASURY_DEPOSIT',
          source: member.factionId,
          metadata: JSON.stringify({ factionId: member.factionId, amount: amount.toString() }),
        },
      });

      return { amount };
    });
  }

  // 4. Crear y Ejecutar Crimen Organizado (Organized Crime - OC)
  static async executeOrganizedCrime(leaderId: string, ocName: string) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.factionMember.findUnique({ where: { playerId: leaderId } });
      if (!member || (member.role !== 'LEADER' && member.role !== 'CO_LEADER')) {
        throw new Error('Solo el Líder o Co-Líder puede iniciar un Crimen Organizado.');
      }

      const faction = await tx.faction.findUnique({
        where: { id: member.factionId },
        include: { members: true },
      });

      if (!faction) throw new Error('Facción no encontrada.');
      if (faction.members.length < 2) {
        throw new Error('Se requieren al menos 2 miembros en la facción para un Crimen Organizado.');
      }

      const rewardCash = 50000n;
      const respectGained = 150;

      // Sumar fondos a la tesorería y respeto a la facción
      await tx.faction.update({
        where: { id: faction.id },
        data: {
          treasury: { increment: rewardCash },
          respect: { increment: respectGained },
        },
      });

      await tx.organizedCrime.create({
        data: {
          factionId: faction.id,
          name: ocName,
          status: 'EXECUTED',
          reward: rewardCash,
          respect: respectGained,
        },
      });

      return { factionName: faction.name, rewardCash, respectGained };
    });
  }
}
