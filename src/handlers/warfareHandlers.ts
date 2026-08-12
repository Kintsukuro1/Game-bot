import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { WarfareService } from '../services/warfareService.js';
import { createWarfareViewEmbed, createBackButtonRow } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActWar(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  _player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const rankings = await WarfareService.getFactionRankings(guildId);
  const embed = createWarfareViewEmbed(rankings);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}
