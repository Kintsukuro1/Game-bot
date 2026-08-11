import { prisma } from '../db/prisma.js';

export class DrugAndBoosterService {
  // 1. Consumo de Drogas (Xanax, Ecstasy, Cannabis)
  static async takeDrug(playerId: string, drugId: string) {
    return prisma.$transaction(async (tx) => {
      const stats = await tx.stats.findUnique({ where: { playerId } });
      if (!stats) throw new Error('Estadísticas no encontradas.');

      // Probabilidad de Sobredosis (2%)
      const isOverdose = Math.random() < 0.02;

      if (isOverdose) {
        // Enviar al hospital por 60 minutos y reducir Happy a 0
        const hospitalUntil = new Date(Date.now() + 60 * 60 * 1000);
        await tx.player.update({
          where: { id: playerId },
          data: {
            hospitalUntil,
          },
        });

        await tx.stats.update({
          where: { playerId },
          data: { happy: 0, energy: 0 },
        });

        throw new Error('💀 **¡SOBREDOSIS!** Has colapsado y fuiste ingresado de urgencia al hospital por 60 minutos. Tu energía y felicidad cayeron a 0.');
      }

      if (drugId === 'XANAX') {
        const newEnergy = Math.min(1000, stats.energy + 250);
        await tx.stats.update({
          where: { playerId },
          data: { energy: newEnergy },
        });
        return { drugName: 'Xanax 💊', effectMsg: '¡Ganaste **+250⚡ de Energía** extra!' };
      }

      if (drugId === 'ECSTASY') {
        const newHappy = Math.min(stats.maxHappy, stats.happy * 2);
        await tx.stats.update({
          where: { playerId },
          data: { happy: newHappy },
        });
        return { drugName: 'Éxtasis 🍬', effectMsg: '¡Tu Felicidad se ha **DUPLICADO**!' };
      }

      if (drugId === 'CANNABIS') {
        const newNerve = Math.min(stats.maxNerve, stats.nerve + 3);
        await tx.stats.update({
          where: { playerId },
          data: { nerve: newNerve },
        });
        return { drugName: 'Cannabis 🌿', effectMsg: '¡Ganaste **+3🧠 de Nerve**!' };
      }

      throw new Error('Droga no válida.');
    });
  }

  // 2. Consumo de Boosters (Bebidas Energéticas, Dulces, Cerveza)
  static async useBooster(playerId: string, boosterId: string) {
    return prisma.$transaction(async (tx) => {
      const stats = await tx.stats.findUnique({ where: { playerId } });
      if (!stats) throw new Error('Estadísticas no encontradas.');

      if (boosterId === 'ENERGY_DRINK') {
        const newEnergy = Math.min(stats.maxEnergy + 500, stats.energy + 100);
        await tx.stats.update({
          where: { playerId },
          data: { energy: newEnergy },
        });
        return { boosterName: 'Bebida Energética 🥤', effectMsg: '¡Ganaste **+100⚡ de Energía**!' };
      }

      if (boosterId === 'CHOCOLATE') {
        const newHappy = Math.min(stats.maxHappy, stats.happy + 150);
        await tx.stats.update({
          where: { playerId },
          data: { happy: newHappy },
        });
        return { boosterName: 'Caja de Chocolates 🍫', effectMsg: '¡Ganaste **+150😊 de Felicidad**!' };
      }

      throw new Error('Booster no válido.');
    });
  }
}
