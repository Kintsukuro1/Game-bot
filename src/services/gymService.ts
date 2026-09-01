import { prisma } from '../db/prisma.js';
import { MasteryService } from './masteryService.js';
import { GymInfo, GYMS } from '../config/gameData.js';
export { GymInfo, GYMS };

export class GymService {
  // Obtener gimnasio actual del jugador
  static getGymByTier(tier: number): GymInfo {
    return GYMS.find((g) => g.tier === tier) || GYMS[0];
  }

  // Fórmula oficial de entrenamiento de Torn Wiki (Stat Growth Curve)
  static calculateStatGain(
    currentStat: number,
    happy: number,
    energySpent: number,
    gymMultiplier: number,
    modifierBonus: number = 1.0
  ): number {
    let baseGain: number;

    if (currentStat < 50000) {
      // 1. Curva progresiva inicial para stats de nivel bajo/medio (< 50,000)
      const happyFactor = (happy / 250) + 0.05;
      const statFactor = Math.sqrt(1 + (currentStat / 1000));
      baseGain = happyFactor * statFactor;
    } else {
      // 2. Curva avanzada logarítmica para stats altas (>= 50,000)
      const a = 3.480061091e-7;
      const b = 2.5; // Constante oficial corregida de Torn Wiki
      const c = 3.091619094e-6;
      const d = 6.82775184551527e-5;
      const e = -0.0301431777;

      const statLog = Math.log(Math.max(currentStat, 1));
      baseGain = (a * statLog + b) * (1 + c * happy) + d * happy + e;
    }

    const energyFactor = energySpent / 5;
    const gain = modifierBonus * (gymMultiplier / 2.0) * energyFactor * baseGain;
    return Math.max(gain, 0.05);
  }

  // Entrenar una estadística de combate (Strength, Defense, Speed, Dexterity)
  static async trainStat(
    playerId: string,
    statName: 'strength' | 'defense' | 'speed' | 'dexterity',
    trainCount: number = 1
  ) {
    if (trainCount <= 0) throw new Error('La cantidad de entrenamientos debe ser al menos 1.');

    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, wallet: true },
      });

      if (!player || !player.stats) throw new Error('Estadísticas del jugador no encontradas.');

      const gym = this.getGymByTier(player.gymTier);
      const totalEnergyCost = gym.energyPerTrain * trainCount;

      if (player.stats.energy < totalEnergyCost) {
        throw new Error(`Energía insuficiente. Entrenar x${trainCount} en ${gym.name} requiere **${totalEnergyCost}⚡** y tienes **${player.stats.energy}⚡**.`);
      }

      // Reducción de Happy (consumo de ~50% de la energía gastada)
      const happyLoss = Math.ceil(totalEnergyCost * 0.5);
      const currentHappy = player.stats.happy;

      // Calcular ganancia acumulada
      let currentStatVal = player.stats[statName];
      let totalGain = 0;

      for (let i = 0; i < trainCount; i++) {
        const gain = this.calculateStatGain(currentStatVal, currentHappy, gym.energyPerTrain, gym.multiplier);
        totalGain += gain;
        currentStatVal += gain;
      }

      const newStatVal = player.stats[statName] + totalGain;
      const newEnergy = player.stats.energy - totalEnergyCost;
      const newHappy = Math.max(player.stats.happy - happyLoss, 0);
      const newGymExp = player.gymExp + totalEnergyCost;

      // Actualizar estadísticas de combate y recursos
      await tx.stats.update({
        where: { playerId },
        data: {
          [statName]: newStatVal,
          energy: newEnergy,
          happy: newHappy,
        },
      });

      // Actualizar progreso del gimnasio
      await tx.player.update({
        where: { id: playerId },
        data: { gymExp: newGymExp },
      });

      // Otorgar Experiencia de Maestría de Combate
      await MasteryService.addMasteryExp(playerId, 'combat', totalEnergyCost * 5, tx);

      return {
        statName,
        gain: totalGain,
        newStatValue: newStatVal,
        energyRemaining: newEnergy,
        happyRemaining: newHappy,
        gymTier: gym.tier,
        gymName: gym.name,
        gymExp: newGymExp,
      };
    });
  }

  // Mejorar membresía de gimnasio al siguiente Tier
  static async upgradeGym(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { wallet: true },
      });

      if (!player || !player.wallet) throw new Error('Datos del jugador no encontrados.');

      const nextTier = player.gymTier + 1;
      const nextGym = GYMS.find((g) => g.tier === nextTier);

      if (!nextGym) throw new Error('¡Ya estás en el Gimnasio de máximo nivel!');

      if (player.gymExp < nextGym.requiredExp) {
        throw new Error(`Experiencia de gimnasio insuficiente. Requieres **${nextGym.requiredExp} Exp** y tienes **${player.gymExp} Exp**.`);
      }

      if (player.wallet.cash < BigInt(nextGym.cost)) {
        throw new Error(`Efectivo insuficiente. La membresía cuesta **$${nextGym.cost.toLocaleString()}**.`);
      }

      // Deducción atómica de dinero
      const balanceBefore = player.wallet.cash;
      const balanceAfter = player.wallet.cash - BigInt(nextGym.cost);

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { decrement: BigInt(nextGym.cost) } },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -BigInt(nextGym.cost),
          balanceBefore,
          balanceAfter,
          type: 'GYM_MEMBERSHIP_FEE',
          source: 'GYM',
          metadata: JSON.stringify({ newGymName: nextGym.name, tier: nextTier }),
        },
      });

      const newGymExp = Math.max(0, player.gymExp - nextGym.requiredExp);

      await tx.player.update({
        where: { id: playerId },
        data: {
          gymTier: nextTier,
          gymExp: newGymExp,
        },
      });

      return { ...nextGym, gymExp: newGymExp };
    });
  }
}
