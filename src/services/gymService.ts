import { prisma } from '../db/prisma.js';

export interface GymInfo {
  tier: number;
  name: string;
  cost: number;
  energyPerTrain: number;
  multiplier: number;
  requiredExp: number;
}

export const GYMS: GymInfo[] = [
  { tier: 1, name: 'Premier Fitness', cost: 0, energyPerTrain: 5, multiplier: 2.0, requiredExp: 0 },
  { tier: 2, name: "Average Joe's", cost: 1000, energyPerTrain: 5, multiplier: 2.4, requiredExp: 200 },
  { tier: 3, name: "Woody's Workout", cost: 5000, energyPerTrain: 5, multiplier: 2.8, requiredExp: 500 },
  { tier: 4, name: 'Global Gym', cost: 15000, energyPerTrain: 5, multiplier: 3.2, requiredExp: 1000 },
  { tier: 5, name: "Gold's Gym", cost: 50000, energyPerTrain: 10, multiplier: 4.5, requiredExp: 2500 },
  { tier: 6, name: 'Anarchy Fitness', cost: 250000, energyPerTrain: 10, multiplier: 6.0, requiredExp: 6000 },
  { tier: 7, name: 'The Asylum Heavy Weight', cost: 1000000, energyPerTrain: 10, multiplier: 8.5, requiredExp: 15000 },
];

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

      return {
        statName,
        gain: totalGain,
        newStatValue: newStatVal,
        energyRemaining: newEnergy,
        happyRemaining: newHappy,
        gymName: gym.name,
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

      await tx.player.update({
        where: { id: playerId },
        data: { gymTier: nextTier },
      });

      return nextGym;
    });
  }
}
