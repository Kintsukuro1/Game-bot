import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { InvestmentService } from '../services/investmentService.js';
import { PlayerService } from '../services/playerService.js';
import {
  createStockMarketEmbed,
  createStockBuySelect,
  createStockButtons,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActStocks(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const playerStocks = await prisma.playerStock.findMany({
    where: { playerId: player.id },
  });

  const embed = createStockMarketEmbed(playerStocks, player);
  const selectRow = createStockBuySelect();
  const btns = createStockButtons();

  await interaction.update({
    content: null,
    embeds: [embed],
    components: [selectRow as any, ...btns as any],
  });
}

export async function handleSelectStockBuy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const symbol = interaction.values[0];

  try {
    const res = await InvestmentService.buyStockShares(player.id, symbol, 1000);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const playerStocks = await prisma.playerStock.findMany({
      where: { playerId: player.id },
    });

    const embed = createStockMarketEmbed(playerStocks, freshPlayer || player);
    const selectRow = createStockBuySelect();
    const btns = createStockButtons();

    await interaction.update({
      content: `📈 **¡Compra exitosa!** Adquiriste **1,000 acciones** de **${symbol}** por **$${res.totalCost.toLocaleString()}** (Total en posesión: ${res.playerStock.shares} acciones).`,
      embeds: [embed],
      components: [selectRow as any, ...btns as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error en la Bolsa: ${err.message}`, ephemeral: true });
  }
}

export async function handleStockClaimDividend(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const symbol = interaction.customId.replace('stock_claim_', '');

  try {
    const res = await InvestmentService.claimWeeklyStockDividend(player.id, symbol);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const playerStocks = await prisma.playerStock.findMany({
      where: { playerId: player.id },
    });

    const embed = createStockMarketEmbed(playerStocks, freshPlayer || player);
    const selectRow = createStockBuySelect();
    const btns = createStockButtons();

    await interaction.update({
      content: res.rewardMsg,
      embeds: [embed],
      components: [selectRow as any, ...btns as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al cobrar dividendo: ${err.message}`, ephemeral: true });
  }
}
