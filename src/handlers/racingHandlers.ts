import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { RacingService } from '../services/racingService.js';
import {
  createRacingViewEmbed,
  createRacingTrackSelect,
  createRacingResultEmbed,
  createRacingButtons,
  createBackButtonRow,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActRacing(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
  const embed = createRacingViewEmbed(freshPlayer);
  const selectRow = createRacingTrackSelect();
  const backRow = createBackButtonRow();

  await interaction.update({
    content: null,
    embeds: [embed],
    components: [selectRow as any, backRow as any],
  });
}

export async function handleSelectRacingTrack(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const trackId = interaction.values[0];

  try {
    const result = await RacingService.startRace(player.id, trackId);
    const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
    const embed = createRacingResultEmbed(freshPlayer, result);
    const btnRow = createRacingButtons();

    await interaction.update({
      content: null,
      embeds: [embed],
      components: btnRow as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
