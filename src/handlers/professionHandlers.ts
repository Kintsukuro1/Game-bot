import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { ProfessionService } from '../services/professionService.js';
import { createProfessionsViewEmbed, createProfessionsSelectRow, createBackButtonRow } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActProfessions(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createProfessionsViewEmbed(player);
  const selectRow = createProfessionsSelectRow(Boolean(player.profession));
  const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectProfession(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const selectedProf = interaction.values[0] as 'HACKER' | 'CONTRABANDISTA' | 'SICARIO';
  try {
    const res = await ProfessionService.chooseProfession(player.id, selectedProf);
    const updatedPlayer = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createProfessionsViewEmbed(updatedPlayer);
    const msg = `🎉 **¡Profesión Elegida!** Ahora eres **${res.emoji} ${res.professionName}**.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    const backRow = createBackButtonRow();
    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: [backRow as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
