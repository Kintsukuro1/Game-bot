import { prisma } from '../db/prisma.js';

export interface DestinationDefinition {
  id: string;
  name: string;
  cost: number;
  durationMinutes: number;
}

export const DESTINATIONS: DestinationDefinition[] = [
  { id: 'Mexico', name: 'México 🇲🇽', cost: 500, durationMinutes: 15 },
  { id: 'United Kingdom', name: 'Reino Unido 🇬🇧', cost: 1500, durationMinutes: 45 },
  { id: 'Japan', name: 'Japón 🇯🇵', cost: 3000, durationMinutes: 90 },
  { id: 'Switzerland', name: 'Suiza 🇨🇭', cost: 5000, durationMinutes: 120 },
];

export class TravelService {
  static async getTravelState(playerId: string) {
    const state = await prisma.travelState.findUnique({ where: { playerId } });
    if (!state) {
      return prisma.travelState.create({
        data: { playerId, destination: 'Home', isTraveling: false },
      });
    }

    const now = new Date();
    if (state.isTraveling && state.arrivesAt <= now) {
      return prisma.travelState.update({
        where: { playerId },
        data: { isTraveling: false },
      });
    }

    return state;
  }

  static async startTravel(playerId: string, destinationId: string) {
    const dest = DESTINATIONS.find((d) => d.id === destinationId);
    if (!dest) throw new Error('Destino internacional no válido.');

    return prisma.$transaction(async (tx) => {
      const currentState = await tx.travelState.findUnique({ where: { playerId } });
      if (currentState && currentState.isTraveling) {
        throw new Error('✈️ Ya estás en medio de un vuelo internacional.');
      }

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      const cost = BigInt(dest.cost);

      if (!wallet || wallet.cash < cost) {
        throw new Error(`Efectivo insuficiente. El billete de avión a **${dest.name}** cuesta **$${cost.toLocaleString()}**.`);
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
          type: 'TRAVEL_TICKET',
          source: 'AIRLINE',
          metadata: JSON.stringify({ destination: dest.id }),
        },
      });

      const arrivesAt = new Date(Date.now() + dest.durationMinutes * 60 * 1000);
      return tx.travelState.upsert({
        where: { playerId },
        create: { playerId, destination: dest.id, isTraveling: true, arrivesAt },
        update: { destination: dest.id, isTraveling: true, arrivesAt },
      });
    });
  }

  static async returnHome(playerId: string) {
    return prisma.travelState.upsert({
      where: { playerId },
      create: { playerId, destination: 'Home', isTraveling: false },
      update: { destination: 'Home', isTraveling: false },
    });
  }
}
