import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { EducationService } from '../services/educationService.js';
import { createEducationViewEmbed, createEducationSelectRow, createBackButtonRow } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActEdu(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const activeCourse = await EducationService.getActiveCourse(player.id);
  const embed = createEducationViewEmbed(activeCourse, player.level);
  const selectRow = createEducationSelectRow();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [selectRow as any, backRow as any],
  });
}

export async function handleSelectEduCourse(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const courseId = interaction.values[0];
  try {
    const res = await EducationService.enrollCourse(player.id, courseId);
    const activeCourse = await EducationService.getActiveCourse(player.id);
    const embed = createEducationViewEmbed(activeCourse, player.level);
    const selectRow = createEducationSelectRow();
    const backRow = createBackButtonRow();
    const msg = `🎓 **¡Matrícula Exitosa!** Te inscribiste en **${res.courseName}**. Duración: **${res.durationHours} horas**.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: [selectRow as any, backRow as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
