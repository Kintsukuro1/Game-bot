import { prisma } from '../db/prisma.js';
import { RaceTrack, TRACKS } from '../config/gameData.js';
export { RaceTrack, TRACKS };

export class RacingService {
  static async startRace(playerId: string, trackId: string) {
    const track = TRACKS.find((t) => t.id === trackId);
    if (!track) throw new Error('Pista de carreras no encontrada.');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      const fee = BigInt(track.entryFee);

      if (!wallet || wallet.cash < fee) {
        throw new Error(`Efectivo insuficiente. La inscripción cuesta **$${fee.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - fee;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      const stats = await tx.stats.findUnique({ where: { playerId } });
      const playerSpeed = stats ? stats.speed : 1.0;

      // Tiempo simulado en segundos según velocidad y distancia
      const baseTime = track.distanceKm * 30;
      const speedDiscount = Math.min(baseTime * 0.4, playerSpeed * 2);
      const timeSeconds = Math.max(10, baseTime - speedDiscount + (Math.random() * 5 - 2.5));

      const race = await tx.raceResult.create({
        data: {
          playerId,
          trackId: track.id,
          position: 1,
          timeSeconds,
        },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -fee,
          balanceBefore,
          balanceAfter,
          type: 'RACING_FEE',
          source: 'SPEEDWAY',
          metadata: JSON.stringify({ trackId: track.id, timeSeconds }),
        },
      });

      return { trackName: track.name, timeSeconds };
    });
  }
}
