import { prisma } from '../db/prisma.js';
import { MasteryService } from './masteryService.js';
import { PlayerService } from './playerService.js';
import { EducationService } from './educationService.js';
import { CrimeDefinition, CRIMES } from '../config/gameData.js';
export { CrimeDefinition, CRIMES };

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
      const currentHeat = player.stats.heat || 0;

      // Penalización por Heat en la tasa de éxito (hasta -20% si Heat está al 100%)
      const heatPenalty = (currentHeat / 100) * 0.20;

      // Cálculo de éxito: BaseRate + (CrimeSkill * 0.05) - heatPenalty
      const effectiveRate = Math.max(0.10, Math.min(crime.baseSuccessRate + (player.stats.crimeSkill * 0.05) - heatPenalty, 0.95));
      const isSuccess = Math.random() <= effectiveRate;

      if (isSuccess) {
        // Éxito: Recompensa de dinero, Crime XP y ganancia de Heat
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

        // Incrementar Crime Skill, Crime XP y Heat
        const newCrimeExp = player.stats.crimeExp + crime.crimeExpReward;
        const newCrimeSkill = player.stats.crimeSkill + 0.02;

        let heatGain = 5;
        if (crime.category === 'Theft') heatGain = 10;
        if (crime.category === 'Felony') heatGain = 15;
        const newHeat = Math.min(100, currentHeat + heatGain);

        await tx.stats.update({
          where: { playerId },
          data: {
            nerve: newNerve,
            crimeExp: newCrimeExp,
            crimeSkill: newCrimeSkill,
            heat: newHeat,
          },
        });

        await MasteryService.addMasteryExp(playerId, 'crime', crime.crimeExpReward, tx);
        await PlayerService.addXp(playerId, crime.crimeExpReward, tx);

        return {
          success: true,
          crimeName: crime.name,
          rewardAmount,
          nerveRemaining: newNerve,
          newCrimeSkill,
          heat: newHeat,
          message: `🎉 **¡Crimen Exitoso!** Completaste **${crime.name}** y obtuviste **+$${rewardAmount.toLocaleString()}** (+${heatGain}% Heat).`,
        };
      } else {
        // Fallo: Incrementar Heat +25% y calcular condena policial
        let newHeat = Math.min(100, currentHeat + 25);
        let failMessage = `❌ **¡Crimen Fallido!** Fuiste descubierto al intentar **${crime.name}**.`;

        if (crime.failJailMinutes > 0) {
          const extraJailMult = 1 + (newHeat / 100);
          const effectiveJailMinutes = Math.floor(crime.failJailMinutes * extraJailMult);
          const jailUntil = new Date(Date.now() + effectiveJailMinutes * 60 * 1000);

          // Al ser procesado e ingresado a prisión, el Heat se resetea a 0%
          newHeat = 0;

          await tx.player.update({
            where: { id: playerId },
            data: { jailUntil },
          });
          failMessage += ` 🚨 La policía te arrestó (Heat elevado) y fuiste enviado a prisión por **${effectiveJailMinutes} minutos**.`;
        }

        await tx.stats.update({
          where: { playerId },
          data: {
            nerve: newNerve,
            heat: newHeat,
          },
        });

        return {
          success: false,
          crimeName: crime.name,
          rewardAmount: 0,
          nerveRemaining: newNerve,
          heat: newHeat,
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
      const rawBailCostAmount = BigInt(100 * remainingMin * jailedPlayer.level);

      // Aplicar descuento por pasiva de Educación si aplica
      const eduMods = await EducationService.getEducationModifiers(payerId);
      let bailCostAmount = rawBailCostAmount;
      if (eduMods.bailDiscount > 0) {
        const discountFactor = Math.max(0, 1 - eduMods.bailDiscount);
        bailCostAmount = BigInt(Math.floor(Number(rawBailCostAmount) * discountFactor));
      }

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

      const eduMods = await EducationService.getEducationModifiers(busterId);
      const baseRate = Math.min(0.65 + eduMods.bustSuccessBoost, 0.90);
      const isSuccess = Math.random() <= baseRate;

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
