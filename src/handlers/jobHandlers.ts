import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { JobService } from '../services/jobService.js';
import { prisma } from '../db/prisma.js';
import { createJobsViewEmbed, createJobsButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActJobs(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
  const embed = createJobsViewEmbed(playerJob, player.level);
  const jobBtns = createJobsButtons();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: jobBtns as any,
  });
}

export async function handleJobCollectSalary(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  try {
    const res = await JobService.collectSalary(player.id);
    const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
    const embed = createJobsViewEmbed(playerJob, player.level);
    const jobBtns = createJobsButtons();
    const msg = `💵 **¡Salario Cobrado!** Recibiste **+$${res.salary.toLocaleString()}** de tu trabajo en **${res.jobName}** y +5 Job Points.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: jobBtns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleJobApply(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const map: Record<string, string> = {
    job_apply_grocer: 'GROCER',
    job_apply_casino: 'CASINO',
    job_apply_medical: 'MEDICAL',
  };

  try {
    const jobId = map[interaction.customId];
    const res = await JobService.applyJob(player.id, jobId);
    const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
    const embed = createJobsViewEmbed(playerJob, player.level);
    const jobBtns = createJobsButtons();
    const msg = `🎉 **¡Contratado!** Ahora trabajas en **${res.jobName}** (Salario Base: $${res.salary}/día).`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: jobBtns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
