import { ButtonInteraction, StringSelectMenuInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { EconomyService } from '../services/economyService.js';
import {
  createProfileViewEmbed,
  createStatsViewEmbed,
  createSecretAlleyViewEmbed,
  createTxHistoryEmbed,
  createGameHubEmbed,
  createGameHubButtons,
  createBackButtonRow,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleHubProfile(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const embed = createProfileViewEmbed(player);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('act_mastery').setLabel('Maestrías & Perks').setEmoji('🌟').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_tx_history').setLabel('Historial $').setEmoji('📜').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🏙️').setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    content: null,
    embeds: [embed],
    components: [row as any],
  });
}

export async function handleHubStats(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createStatsViewEmbed(player);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}

export async function handleActSecretAlley(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createSecretAlleyViewEmbed(player);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}

export async function handleActTxHistory(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const txs = await EconomyService.getTransactionHistory(player.id);
  const embed = createTxHistoryEmbed(player, txs);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}

export async function handleNavBackHub(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const embed = createGameHubEmbed(player);
  const buttons = createGameHubButtons(player.level);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: buttons as any,
  });
}
