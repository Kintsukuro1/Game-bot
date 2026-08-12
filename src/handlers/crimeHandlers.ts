import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { CrimeService } from '../services/crimeService.js';
import { MissionService } from '../services/missionService.js';
import { NPCService } from '../services/npcService.js';
import { createCrimesViewEmbed, createCrimeSelectRow, createBackButtonRow } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActCrime(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createCrimesViewEmbed(player);
  const selectRow = createCrimeSelectRow();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [selectRow as any, backRow as any],
  });
}

export async function handleSelectCrime(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const crimeId = interaction.values[0];
  try {
    const result = await CrimeService.commitCrime(player.id, crimeId);
    await MissionService.progressMission(player.id, 'CRIMES', 1);

    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createCrimesViewEmbed(updated);
    const selectRow = createCrimeSelectRow();
    const backRow = createBackButtonRow();

    const reaction = result.success
      ? NPCService.getReaction('charly', 'success')
      : NPCService.getReaction('charly', 'failure');

    const newContent = appendActionLog(interaction.message?.content, [result.message, reaction], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: [selectRow as any, backRow as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
