import { prisma } from '../db/prisma.js';

export class DrugAndBoosterService {
  // 1. Consumo de Drogas (Xanax, Ecstasy, Cannabis)
  static async takeDrug(playerId: string, drugId: string) {
    return prisma.$transaction(async (tx) => {
      const stats = await tx.stats.findUnique({ where: { playerId } });
      if (!stats) throw new Error('Estadísticas no encontradas.');

      // Acumular nivel de adicción
      let addiction = await tx.playerAddiction.findUnique({ where: { playerId } });
      if (!addiction) {
        addiction = await tx.playerAddiction.create({ data: { playerId, level: 0 } });
      }

      // Probabilidad de Sobredosis (5% según diseño)
      const isOverdose = Math.random() < 0.05;

      if (isOverdose) {
        // Enviar al hospital por 60 minutos y reducir Happy a 0
        const hospitalUntil = new Date(Date.now() + 60 * 60 * 1000);
        await tx.player.update({
          where: { id: playerId },
          data: {
            hospitalUntil,
          },
        });

        await tx.playerAddiction.update({
          where: { playerId },
          data: { lastOverdoseAt: new Date() },
        });

        await tx.stats.update({
          where: { playerId },
          data: { happy: 0, energy: 0 },
        });

        throw new Error('💀 **¡SOBREDOSIS!** Has colapsado y fuiste ingresado de urgencia al hospital por 60 minutos. Tu energía y felicidad cayeron a 0.');
      }

      // Incrementar adicción en +15 puntos
      await tx.playerAddiction.update({
        where: { playerId },
        data: { level: Math.min(100, addiction.level + 15) },
      });

      if (drugId === 'XANAX') {
        const newEnergy = Math.min(1000, stats.energy + 250);
        await tx.stats.update({
          where: { playerId },
          data: { energy: newEnergy },
        });
        return { drugName: 'Xanax 💊', effectMsg: '¡Ganaste **+250⚡ de Energía** extra! (Adicción +15%)' };
      }

      if (drugId === 'ECSTASY') {
        const newHappy = Math.min(stats.maxHappy, stats.happy * 2);
        await tx.stats.update({
          where: { playerId },
          data: { happy: newHappy },
        });
        return { drugName: 'Éxtasis 🍬', effectMsg: '¡Tu Felicidad se ha **DUPLICADO**! (Adicción +15%)' };
      }

      if (drugId === 'CANNABIS') {
        const newNerve = Math.min(stats.maxNerve, stats.nerve + 3);
        await tx.stats.update({
          where: { playerId },
          data: { nerve: newNerve },
        });
        return { drugName: 'Cannabis 🌿', effectMsg: '¡Ganaste **+3🧠 de Nerve**! (Adicción +15%)' };
      }

      throw new Error('Droga no válida.');
    });
  }

  /**
   * Rehabilitación y Desintoxicación Médica en Suiza ($25,000)
   */
  static async detoxifyInSwitzerland(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < 25000n) {
        throw new Error('💸 Requiere $25,000 en efectivo para realizar el tratamiento de desintoxicación.');
      }

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { decrement: 25000n } },
      });

      await tx.playerAddiction.upsert({
        where: { playerId },
        update: { level: 0 },
        create: { playerId, level: 0 },
      });

      return { message: '🏥 **¡TRATAMIENTO EXITOSO!** Tu nivel de adicción se ha limpiado a 0% en la clínica suiza.' };
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
