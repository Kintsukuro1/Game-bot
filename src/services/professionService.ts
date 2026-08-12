import { prisma } from '../db/prisma.js';
import { InsufficientFundsError, LevelRequirementError } from '../errors/gameErrors.js';

export interface ProfessionInfo {
  id: 'HACKER' | 'CONTRABANDISTA' | 'SICARIO';
  name: string;
  emoji: string;
  description: string;
  perks: string[];
}

export const PROFESSIONS: ProfessionInfo[] = [
  {
    id: 'HACKER',
    name: 'Hacker Informático',
    emoji: '💻',
    description: 'Especialista en intrusión de sistemas y vulneración de cuentas bancarias.',
    perks: [
      'Acceso al comando de Hacking Bancario contra otros jugadores',
      'Roba entre 3% y 8% del saldo en banco del objetivo',
      'Tasa de éxito potenciada por tu estadística de Inteligencia',
    ],
  },
  {
    id: 'CONTRABANDISTA',
    name: 'Contrabandista Internacional',
    emoji: '📦',
    description: 'Experto en logística clandestina y evasión de aduanas.',
    perks: [
      '10% de descuento automático en todas las compras del Mercado Negro',
      '-50% de tiempo de espera en vuelos internacionales',
      'Doble capacidad de carga de mercancías del extranjero',
    ],
  },
  {
    id: 'SICARIO',
    name: 'Sicario & Cazador de Recompensas',
    emoji: '🎯',
    description: 'Asesino a sueldo implacable especializado en duelos de alto riesgo.',
    perks: [
      'Recompensas dobles (2x Cash) al cobrar cualquier Bounty',
      '+10% de probabilidad de asestar golpes críticos en combate PvP',
      'Mayor reputación ganada en guerras de facción',
    ],
  },
];

export class ProfessionService {
  // Elegir profesión a Nivel 10+
  static async chooseProfession(playerId: string, profession: 'HACKER' | 'CONTRABANDISTA' | 'SICARIO') {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error('Jugador no encontrado.');

      if (player.level < 10) {
        throw new LevelRequirementError(10, player.level);
      }

      if (player.profession) {
        throw new Error(`Ya tienes una profesión activa: **${player.profession}**. Para cambiar de especialidad debes consultar con el sindicato.`);
      }

      const updated = await tx.player.update({
        where: { id: playerId },
        data: { profession },
      });

      const profDef = PROFESSIONS.find((p) => p.id === profession);

      return { professionName: profDef?.name || profession, emoji: profDef?.emoji || '🎭' };
    });
  }

  // Hacking Bancario exclusivo de la profesión Hacker (10🧠 Nerve)
  static async executeBankHack(hackerId: string, targetDiscordId: string) {
    return prisma.$transaction(async (tx) => {
      const hacker = await tx.player.findUnique({
        where: { id: hackerId },
        include: { stats: true, wallet: true },
      });

      if (!hacker || !hacker.stats || !hacker.wallet) {
        throw new Error('Hacker no encontrado.');
      }

      if (hacker.profession !== 'HACKER') {
        throw new Error('🔒 Esta acción requiere la profesión de **Hacker Informático (Nivel 10+)**.');
      }

      const now = new Date();
      if (hacker.jailUntil && hacker.jailUntil > now) {
        throw new Error('🚨 Estás en prisión y no puedes realizar ataques cibernéticos.');
      }

      if (hacker.stats.nerve < 10) {
        throw new Error(`🧠 Requieres **10🧠 de Nerve** para iniciar una intrusión cibernética (Tienes ${hacker.stats.nerve}🧠).`);
      }

      const target = await tx.player.findFirst({
        where: { discordId: targetDiscordId, guildId: hacker.guildId },
        include: { wallet: true },
      });

      if (!target || !target.wallet) {
        throw new Error('El objetivo no existe o no está registrado en este servidor.');
      }

      if (target.id === hackerId) {
        throw new Error('No puedes hackear tu propia cuenta bancaria.');
      }

      // Consumir 10🧠 Nerve
      await tx.stats.update({
        where: { playerId: hackerId },
        data: { nerve: hacker.stats.nerve - 10 },
      });

      // Tasa de éxito: 35% base + (Intel * 0.02)
      const successRate = Math.min(0.35 + hacker.stats.intelligence * 0.02, 0.75);
      const isSuccess = Math.random() <= successRate;

      if (isSuccess) {
        const stealPercent = 3 + Math.floor(Math.random() * 6); // 3% a 8%
        const stolenAmount = (target.wallet.bank * BigInt(stealPercent)) / 100n;

        if (stolenAmount <= 0n) {
          return {
            success: true,
            stolenAmount: 0n,
            msg: `💻 **Intrusión Exitosa:** Accediste a la cuenta bancaria de **${target.username}**, pero la cuenta no tenía saldo bancario.`,
          };
        }

        // Transferencia bancaria atómica
        await tx.wallet.update({
          where: { playerId: target.id },
          data: { bank: { decrement: stolenAmount } },
        });

        await tx.wallet.update({
          where: { playerId: hackerId },
          data: { cash: { increment: stolenAmount } },
        });

        await tx.transaction.create({
          data: {
            playerId: hackerId,
            amount: stolenAmount,
            balanceBefore: hacker.wallet.cash,
            balanceAfter: hacker.wallet.cash + stolenAmount,
            type: 'BANK_HACK_REWARD',
            source: target.id,
            metadata: JSON.stringify({ targetUsername: target.username, stealPercent }),
          },
        });

        return {
          success: true,
          stolenAmount,
          msg: `💻 **¡Hacking Bancario Exitoso!** Vulneraste la cuenta de **${target.username}** y transferiste **+$${stolenAmount.toLocaleString()}** a tu cartera.`,
        };
      } else {
        // Fallo: Prisión por 60 min
        const jailUntil = new Date(Date.now() + 60 * 60 * 1000);
        await tx.player.update({
          where: { id: hackerId },
          data: { jailUntil },
        });

        return {
          success: false,
          stolenAmount: 0n,
          msg: `🚨 **¡Intrusión Detectada!** El firewall bancario rastreó tu IP. Fuiste arrestado y enviado a prisión por **60 minutos**.`,
        };
      }
    });
  }
}
