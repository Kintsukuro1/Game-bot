import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
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
  const backRow = createBackButtonRow();
  const embed = createProfileViewEmbed(player);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
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
  _player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const refreshedPlayer = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
  if (!refreshedPlayer) return;
  const embed = createGameHubEmbed(refreshedPlayer);
  const buttons = createGameHubButtons(refreshedPlayer.level);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: buttons as any,
  });
}
