import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { MissionService } from '../services/missionService.js';
import { createMissionsViewEmbed, createBackButtonRow } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActMissions(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const missions = await MissionService.getMissions(player.id);
  const embed = createMissionsViewEmbed(missions);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}
