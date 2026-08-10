import { prisma } from '../db/prisma.js';

export interface CrimeDefinition {
  id: string;
  name: string;
  category: string;
  nerveCost: number;
  minLevel: number;
  baseSuccessRate: number; // 0.0 a 1.0
  minReward: number;
  maxReward: number;
  crimeExpReward: number;
  failJailMinutes: number;
}

export const CRIMES: CrimeDefinition[] = [
  {
    id: 'search_cash',
    name: 'Buscar dinero tirado (Search for Cash)',
    category: 'Basic',
    nerveCost: 2,
    minLevel: 1,
    baseSuccessRate: 0.90,
    minReward: 20,
    maxReward: 150,
    crimeExpReward: 10,
    failJailMinutes: 0, // Fallo simple
  },
  {
    id: 'shoplifting',
    name: 'Hurto en tiendas (Shoplifting)',
    category: 'Basic',
    nerveCost: 3,
    minLevel: 1,
    baseSuccessRate: 0.80,
    minReward: 100,
    maxReward: 500,
    crimeExpReward: 25,
    failJailMinutes: 15,
  },
  {
    id: 'pickpocketing',
    name: 'Robo de carteras (Pickpocketing)',
    category: 'Theft',
    nerveCost: 4,
    minLevel: 2,
    baseSuccessRate: 0.70,
    minReward: 300,
    maxReward: 1200,
    crimeExpReward: 45,
    failJailMinutes: 20,
  },
  {
    id: 'larceny',
    name: 'Robo a propiedad (Larceny)',
    category: 'Theft',
    nerveCost: 6,
    minLevel: 3,
    baseSuccessRate: 0.60,
    minReward: 1500,
    maxReward: 5000,
    crimeExpReward: 80,
    failJailMinutes: 30,
  },
  {
    id: 'armed_robbery',
    name: 'Asalto a mano armada (Armed Robbery)',
    category: 'Armed',
    nerveCost: 10,
    minLevel: 5,
    baseSuccessRate: 0.45,
    minReward: 8000,
    maxReward: 25000,
    crimeExpReward: 150,
    failJailMinutes: 45,
  },
];

export class CrimeService {
  // 1. Ejecución de un Crimen
  static async commitCrime(playerId: string, crimeId: string) {
    const crime = CRIMES.find((c) => c.id === crimeId);
    if (!crime) throw new Error('Crimen no encontrado.');

    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, wallet: true },
      });

      if (!player || !player.stats || !player.wallet) {
        throw new Error('Datos del jugador no encontrados.');
      }

      // Verificación de estado de Hospital o Prisión
      const now = new Date();
      if (player.hospitalUntil && player.hospitalUntil > now) {
        throw new Error('🏥 Estás hospitalizado y no puedes cometer crímenes.');
      }

      if (player.jailUntil && player.jailUntil > now) {
        throw new Error('🚨 Estás en prisión. No puedes cometer crímenes.');
      }

      if (player.level < crime.minLevel) {
        throw new Error(`🔒 Requieres Nivel ${crime.minLevel} para cometer este crimen.`);
      }

      if (player.stats.nerve < crime.nerveCost) {
        throw new Error(`🧠 Nerve insuficiente. Cometer este crimen requiere **${crime.nerveCost}🧠** y tienes **${player.stats.nerve}🧠**.`);
      }

      // Consumir Nerve
      const newNerve = player.stats.nerve - crime.nerveCost;
      await tx.stats.update({
        where: { playerId },
        data: { nerve: newNerve },
      });

      // Cálculo de éxito: BaseRate + (CrimeSkill * 0.05)
      const effectiveRate = Math.min(crime.baseSuccessRate + (player.stats.crimeSkill * 0.05), 0.95);
      const isSuccess = Math.random() <= effectiveRate;

      if (isSuccess) {
        // Éxito: Recompensa de dinero y Crime XP
        const rewardAmount = Math.floor(crime.minReward + Math.random() * (crime.maxReward - crime.minReward + 1));
        const rewardBigInt = BigInt(rewardAmount);

        const balanceBefore = player.wallet.cash;
        const balanceAfter = player.wallet.cash + rewardBigInt;

        await tx.wallet.update({
          where: { playerId },
          data: { cash: balanceAfter },
        });

        // Registrar transacción auditable
        await tx.transaction.create({
          data: {
            playerId,
            amount: rewardBigInt,
            balanceBefore,
            balanceAfter,
            type: 'CRIME_REWARD',
            source: 'CRIME_ENGINE',
            metadata: JSON.stringify({ crimeId: crime.id, crimeName: crime.name, rewardAmount }),
          },
        });

        // Incrementar Crime Skill y Crime XP
        const newCrimeExp = player.stats.crimeExp + crime.crimeExpReward;
        const newCrimeSkill = player.stats.crimeSkill + 0.02;

        await tx.stats.update({
          where: { playerId },
          data: {
            crimeExp: newCrimeExp,
            crimeSkill: newCrimeSkill,
          },
        });

        return {
          success: true,
          crimeName: crime.name,
          rewardAmount,
          nerveRemaining: newNerve,
          newCrimeSkill,
          message: `🎉 **¡Crimen Exitoso!** Completaste **${crime.name}** y obtuviste **+$${rewardAmount.toLocaleString()}** y **+${crime.crimeExpReward} Crime XP**.`,
        };
      } else {
        // Fallo: Si el crimen tiene tiempo de prisión, enviar a Jail
        let failMessage = `❌ **¡Crimen Fallido!** Fuiste descubierto al intentar **${crime.name}**.`;

        if (crime.failJailMinutes > 0) {
          const jailUntil = new Date(Date.now() + crime.failJailMinutes * 60 * 1000);
          await tx.player.update({
            where: { id: playerId },
            data: { jailUntil },
          });
          failMessage += ` 🚨 La policía te arrestó y fuiste enviado a prisión por **${crime.failJailMinutes} minutos**.`;
        }

        return {
          success: false,
          crimeName: crime.name,
          rewardAmount: 0,
          nerveRemaining: newNerve,
          message: failMessage,
        };
      }
    });
  }

  // 2. Obtener lista de encarcelados
  static async getJailedPlayers() {
    const now = new Date();
    return prisma.player.findMany({
      where: {
        jailUntil: { gt: now },
      },
      include: { wallet: true },
      take: 10,
    });
  }

  // 3. Pagar Fianza (Bail)
  static async payBail(payerId: string, jailedPlayerId: string) {
    return prisma.$transaction(async (tx) => {
      const payerWallet = await tx.wallet.findUnique({ where: { playerId: payerId } });
      const jailedPlayer = await tx.player.findUnique({ where: { id: jailedPlayerId } });

      if (!payerWallet || !jailedPlayer) throw new Error('Jugador no encontrado.');

      const now = new Date();
      if (!jailedPlayer.jailUntil || jailedPlayer.jailUntil <= now) {
        throw new Error('El jugador no se encuentra prisionero.');
      }

      const remainingMin = Math.ceil((jailedPlayer.jailUntil.getTime() - now.getTime()) / 60000);
      // Fórmula oficial de Torn Wiki: BailCost = $100 * remainingJailMinutes * playerLevel
      const bailCostAmount = BigInt(100 * remainingMin * jailedPlayer.level);

      if (payerWallet.cash < bailCostAmount) {
        throw new Error(`Efectivo insuficiente. Pagar la fianza cuesta **$${bailCostAmount.toLocaleString()}**.`);
      }

      const balanceBefore = payerWallet.cash;
      const balanceAfter = payerWallet.cash - bailCostAmount;

      await tx.wallet.update({
        where: { playerId: payerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId: payerId,
          amount: -bailCostAmount,
          balanceBefore,
          balanceAfter,
          type: 'JAIL_BAIL_FEE',
          source: 'JAIL_SYSTEM',
          metadata: JSON.stringify({ freedPlayerId: jailedPlayer.id, freedUsername: jailedPlayer.username }),
        },
      });

      // Liberar al prisionero
      await tx.player.update({
        where: { id: jailedPlayerId },
        data: { jailUntil: null },
      });

      return { freedUsername: jailedPlayer.username, bailCostAmount };
    });
  }

  // 4. Sacar a un prisionero (Bust) - Cuesta 5🧠
  static async bustPlayer(busterId: string, jailedPlayerId: string) {
    return prisma.$transaction(async (tx) => {
      const buster = await tx.player.findUnique({
        where: { id: busterId },
        include: { stats: true },
      });
      const jailedPlayer = await tx.player.findUnique({ where: { id: jailedPlayerId } });

      if (!buster || !buster.stats || !jailedPlayer) throw new Error('Jugador no encontrado.');

      if (buster.id === jailedPlayerId) {
        throw new Error('Usa la opción de fuga propia (Self Bust) para liberarte a ti mismo.');
      }

      if (buster.stats.nerve < 5) {
        throw new Error('🧠 Requieres al menos 5🧠 de Nerve para intentar sacar a un prisionero.');
      }

      const now = new Date();
      if (!jailedPlayer.jailUntil || jailedPlayer.jailUntil <= now) {
        throw new Error('El jugador objetivo no está prisionero.');
      }

      // Consumir 5🧠
      await tx.stats.update({
        where: { playerId: busterId },
        data: { nerve: buster.stats.nerve - 5 },
      });

      const isSuccess = Math.random() <= 0.65;

      if (isSuccess) {
        await tx.player.update({
          where: { id: jailedPlayerId },
          data: { jailUntil: null },
        });

        return { success: true, message: `🔓 ¡Rescate exitoso! Liberaste a **${jailedPlayer.username}** de la prisión.` };
      } else {
        // Fallo: El rescatador va a prisión por 15m
        const jailUntil = new Date(Date.now() + 15 * 60 * 1000);
        await tx.player.update({
          where: { id: busterId },
          data: { jailUntil },
        });

        return { success: false, message: `🚨 ¡Fallo en el rescate! Fuiste capturado por los guardias y enviado a prisión por 15 minutos.` };
      }
    });
  }

  // 5. Fuga propia de prisión (Self Bust) - Cuesta 50% de Nerve Total
  static async selfBust(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true },
      });

      if (!player || !player.stats) throw new Error('Jugador no encontrado.');

      const now = new Date();
      if (!player.jailUntil || player.jailUntil <= now) {
        throw new Error('No estás encarcelado.');
      }

      const costNerve = Math.ceil(player.stats.maxNerve * 0.5);
      if (player.stats.nerve < costNerve) {
        throw new Error(`🧠 Fuga propia requiere el 50% de tu Nerve (**${costNerve}🧠**). Tienes **${player.stats.nerve}🧠**.`);
      }

      // Consumir 50% Nerve
      await tx.stats.update({
        where: { playerId },
        data: { nerve: player.stats.nerve - costNerve },
      });

      const isSuccess = Math.random() <= 0.50;

      if (isSuccess) {
        await tx.player.update({
          where: { id: playerId },
          data: { jailUntil: null },
        });
        return { success: true, message: `🔓 ¡Fuga espectacular! Lograste escapar de prisión.` };
      } else {
        // Fallo: Añade +15m de prisión
        const newJailUntil = new Date(player.jailUntil.getTime() + 15 * 60 * 1000);
        await tx.player.update({
          where: { id: playerId },
          data: { jailUntil: newJailUntil },
        });
        return { success: false, message: `🚨 ¡Fallo en la fuga! Los guardias te atraparon y sumaron **+15 minutos** a tu condena.` };
      }
    });
  }
}
