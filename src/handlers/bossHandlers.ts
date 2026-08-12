import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { BossService } from '../services/bossService.js';
import { prisma } from '../db/prisma.js';
import {
  createDailyBossViewEmbed,
  createWeeklyBossViewEmbed,
  createBossActionButtons,
} from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActBossDaily(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
  const damageLog = await prisma.worldBossDamage.findUnique({
    where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
  });
  const embed = createDailyBossViewEmbed(boss, damageLog);
  const btns = createBossActionButtons('DAILY');
  await interaction.update({
    content: null,
    embeds: [embed],
    components: btns as any,
  });
}

export async function handleActBossWeekly(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  _player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const boss = await BossService.getOrCreateActiveBoss(guildId, 'WEEKLY_FACTION');
  const damageLogs = await prisma.worldBossDamage.findMany({
    where: { bossId: boss.id },
    include: { player: true },
    orderBy: { damageDealt: 'desc' },
  });
  const embed = createWeeklyBossViewEmbed(boss, damageLogs);
  const btns = createBossActionButtons('WEEKLY_FACTION');
  await interaction.update({
    content: null,
    embeds: [embed],
    components: btns as any,
  });
}

export async function handleBossAttack(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const category = interaction.customId === 'boss_attack_DAILY' ? 'DAILY' : 'WEEKLY_FACTION';
  try {
    const boss = await BossService.getOrCreateActiveBoss(guildId, category);
    const res = await BossService.attackBoss(player.id, boss.id);

    const updatedBoss = await BossService.getOrCreateActiveBoss(guildId, category);
    const damageLog = await prisma.worldBossDamage.findUnique({
      where: { bossId_playerId: { bossId: updatedBoss.id, playerId: player.id } },
    });
    const damageLogs = await prisma.worldBossDamage.findMany({
      where: { bossId: updatedBoss.id },
      include: { player: true },
      orderBy: { damageDealt: 'desc' },
    });

    const embed = category === 'DAILY'
      ? createDailyBossViewEmbed(updatedBoss, damageLog)
      : createWeeklyBossViewEmbed(updatedBoss, damageLogs);

    const btns = createBossActionButtons(category);
    const attackMsg = `⚔️ **¡Ataque Asestado!** Infligiste **+${res.damageDealt.toLocaleString()} HP** a **${res.bossName}**.\n${res.quote}`;
    const newContent = appendActionLog(interaction.message?.content, [attackMsg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBossClaimDaily(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
    const res = await BossService.claimDailyMilestones(player.id, boss.id);

    const damageLog = await prisma.worldBossDamage.findUnique({
      where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
    });
    const embed = createDailyBossViewEmbed(boss, damageLog);
    const btns = createBossActionButtons('DAILY');
    const claimMsg = `🎉 **¡Recompensa de Hito Reclamada!** Alcanzaste **${res.milestoneTitle}** y ganaste **+$${res.rewardCash.toLocaleString()}** y **+${res.rewardXp} XP**.`;
    const newContent = appendActionLog(interaction.message?.content, [claimMsg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
