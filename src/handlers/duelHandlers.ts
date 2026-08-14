import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { CombatService } from '../services/combatService.js';
import { AchievementService } from '../services/achievementService.js';
import { createCombatResultEmbed, createPostCombatActionButtons } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleDuelAccept(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const duelId = interaction.customId.replace('duel_accept_', '');

  const duel = await prisma.duelChallenge.findUnique({
    where: { id: duelId },
  });

  if (!duel || duel.status !== 'PENDING') {
    await interaction.reply({
      content: '❌ Este desafío de duelo ya no está disponible, fue cancelado o ya fue resuelto.',
      ephemeral: true,
    });
    return;
  }

  if (duel.expiresAt <= new Date()) {
    await prisma.duelChallenge.update({
      where: { id: duel.id },
      data: { status: 'EXPIRED' },
    });
    await interaction.reply({
      content: '⌛ Este desafío de duelo ha expirado (límite de 5 minutos transcurrido).',
      ephemeral: true,
    });
    return;
  }

  if (player.id !== duel.challengedId) {
    await interaction.reply({
      content: '❌ Este duelo no es para ti. Solo el jugador retado puede aceptarlo.',
      ephemeral: true,
    });
    return;
  }

  const challenger = await prisma.player.findUnique({
    where: { id: duel.challengerId },
    include: { wallet: true },
  });
  const challenged = await prisma.player.findUnique({
    where: { id: duel.challengedId },
    include: { wallet: true },
  });

  if (!challenger || !challenger.wallet || challenger.wallet.cash < duel.wagerAmount) {
    await prisma.duelChallenge.update({
      where: { id: duel.id },
      data: { status: 'CANCELLED' },
    });
    await interaction.reply({
      content: `❌ El retador (**${challenger?.username || 'Desconocido'}**) no tiene suficiente efectivo ($${duel.wagerAmount.toLocaleString()}) para cubrir su apuesta. Duelo cancelado.`,
    });
    return;
  }

  if (!challenged || !challenged.wallet || challenged.wallet.cash < duel.wagerAmount) {
    await interaction.reply({
      content: `❌ No tienes suficiente efectivo ($${duel.wagerAmount.toLocaleString()}) para cubrir la apuesta del duelo. (Tu efectivo: **$${(challenged?.wallet?.cash || 0n).toLocaleString()}**)`,
      ephemeral: true,
    });
    return;
  }

  try {
    // 1. Descontar apuesta a ambos participantes y marcar ACCEPTED
    await prisma.$transaction([
      prisma.wallet.update({
        where: { playerId: challenger.id },
        data: { cash: { decrement: duel.wagerAmount } },
      }),
      prisma.wallet.update({
        where: { playerId: challenged.id },
        data: { cash: { decrement: duel.wagerAmount } },
      }),
      prisma.duelChallenge.update({
        where: { id: duel.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    // 2. Ejecutar Combate PvP
    const combatResult = await CombatService.executePvPCombat(challenger.discordId, challenged.discordId, guildId);

    // 3. Entregar el pozo acumulado al ganador
    const potAmount = duel.wagerAmount * 2n;
    const winnerPlayerId = combatResult.winnerId;
    const loserPlayerId = combatResult.loserId;

    await prisma.$transaction(async (tx) => {
      const winnerWallet = await tx.wallet.findUnique({ where: { playerId: winnerPlayerId } });
      if (winnerWallet) {
        const before = winnerWallet.cash;
        const after = before + potAmount;
        await tx.wallet.update({
          where: { playerId: winnerPlayerId },
          data: { cash: after },
        });

        await tx.transaction.create({
          data: {
            playerId: winnerPlayerId,
            amount: duel.wagerAmount,
            balanceBefore: before,
            balanceAfter: after,
            type: 'DUEL_WIN',
            source: loserPlayerId,
            metadata: JSON.stringify({ duelId: duel.id, wager: duel.wagerAmount.toString() }),
          },
        });
      }

      const loserWallet = await tx.wallet.findUnique({ where: { playerId: loserPlayerId } });
      if (loserWallet) {
        await tx.transaction.create({
          data: {
            playerId: loserPlayerId,
            amount: -duel.wagerAmount,
            balanceBefore: loserWallet.cash + duel.wagerAmount,
            balanceAfter: loserWallet.cash,
            type: 'DUEL_LOSS',
            source: winnerPlayerId,
            metadata: JSON.stringify({ duelId: duel.id, wager: duel.wagerAmount.toString() }),
          },
        });
      }
    });

    try {
      await AchievementService.checkAndUnlock(winnerPlayerId);
    } catch {}

    const combatEmbed = createCombatResultEmbed(combatResult);
    combatEmbed.setDescription(
      `💰 **¡DUELO FINALIZADO!**\n` +
      `🏆 **Ganador del Pozo:** **${combatResult.winnerUsername}** se embolsó **+$${potAmount.toLocaleString()}** (+$${duel.wagerAmount.toLocaleString()} netos).\n` +
      `💀 **Perdedor:** **${combatResult.loserUsername}** perdió **-$${duel.wagerAmount.toLocaleString()}**.\n\n` +
      `**Daño total infligido:** ${combatResult.totalDamageDealt} HP\n\n` +
      `**Desglose del combate por turnos:**`
    );

    const postActionButtons = createPostCombatActionButtons(combatResult.winnerId, combatResult.loserId);

    await interaction.update({
      content: `💥 **¡El duelo entre <@${challenger.discordId}> y <@${challenged.discordId}> ha concluido!**`,
      embeds: [combatEmbed],
      components: postActionButtons as any,
    });
  } catch (err: any) {
    await interaction.reply({
      content: `❌ Error al resolver el combate del duelo: ${err.message}`,
      ephemeral: true,
    });
  }
}

export async function handleDuelDecline(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const duelId = interaction.customId.replace('duel_decline_', '');

  const duel = await prisma.duelChallenge.findUnique({
    where: { id: duelId },
  });

  if (!duel || duel.status !== 'PENDING') {
    await interaction.reply({
      content: '❌ Este desafío de duelo ya no está disponible o ya fue resuelto.',
      ephemeral: true,
    });
    return;
  }

  if (player.id !== duel.challengedId) {
    await interaction.reply({
      content: '❌ Solo el jugador retado puede declinar este duelo.',
      ephemeral: true,
    });
    return;
  }

  await prisma.duelChallenge.update({
    where: { id: duel.id },
    data: { status: 'DECLINED' },
  });

  await interaction.update({
    content: `🏳️ **Duelo Rechazado:** <@${player.discordId}> prefirió no arriesgar su dinero y declinó el reto de duelo.`,
    embeds: [],
    components: [],
  });
}
