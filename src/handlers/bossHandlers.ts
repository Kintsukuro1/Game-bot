import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { BossService, BossCombatActionType } from '../services/bossService.js';
import { PlayerService } from '../services/playerService.js';
import { AchievementService } from '../services/achievementService.js';
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
  if (player.level < 5) {
    await interaction.reply({ content: '🔒 El Boss Diario requiere **Nivel 5** o superior.', ephemeral: true });
    return;
  }

  const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
  const damageLog = await prisma.worldBossDamage.findUnique({
    where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
  });
  const embed = createDailyBossViewEmbed(boss, damageLog, player);
  const btns = createBossActionButtons('DAILY', player);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: btns as any,
  });
}

export async function handleActBossWeekly(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (player.level < 10) {
    await interaction.reply({ content: '🔒 La Raid de Facción requiere **Nivel 10** o superior.', ephemeral: true });
    return;
  }
  const boss = await BossService.getOrCreateActiveBoss(guildId, 'WEEKLY_FACTION');
  const damageLogs = await prisma.worldBossDamage.findMany({
    where: { bossId: boss.id },
    include: { player: true },
    orderBy: { damageDealt: 'desc' },
  });
  const embed = createWeeklyBossViewEmbed(boss, damageLogs, player);
  const btns = createBossActionButtons('WEEKLY_FACTION', player);
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
  const customId = interaction.customId;
  let category: 'DAILY' | 'WEEKLY_FACTION' = 'DAILY';
  let actionType: BossCombatActionType = 'ATK_PRIMARY';

  if (customId.includes('WEEKLY_FACTION')) {
    category = 'WEEKLY_FACTION';
  }

  if (customId.includes('ATK_PRIMARY') || customId.includes('FRONTAL')) actionType = 'ATK_PRIMARY';
  else if (customId.includes('ATK_SECONDARY')) actionType = 'ATK_SECONDARY';
  else if (customId.includes('ATK_MELEE')) actionType = 'ATK_MELEE';
  else if (customId.includes('TACTICAL_COVER') || customId.includes('_COVER_')) actionType = 'TACTICAL_COVER';
  else if (customId.includes('TACTICAL_MED') || customId.includes('_ITEM_')) actionType = 'TACTICAL_MED';
  else if (customId.includes('TACTICAL_THROWABLE')) actionType = 'TACTICAL_THROWABLE';
  else if (customId.includes('FACTION_TAUNT') || customId.includes('_TAUNT_')) actionType = 'FACTION_TAUNT';

  try {
    const boss = await BossService.getOrCreateActiveBoss(guildId, category);
    const res = await BossService.attackBoss(player.id, boss.id, actionType);

    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
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
      ? createDailyBossViewEmbed(updatedBoss, damageLog, freshPlayer || player)
      : createWeeklyBossViewEmbed(updatedBoss, damageLogs, freshPlayer || player);

    const btns = createBossActionButtons(category, freshPlayer || player);

    // Formateo del registro de combate
    let actionHeader = '';
    if (actionType === 'TACTICAL_MED') {
      actionHeader = `💉 **[Inyección Médica con ${res.usedMedicalItemName}]** (+${res.healedHp} HP curados al torso y cabeza)`;
    } else if (actionType === 'TACTICAL_COVER') {
      actionHeader = `🛡️ **[Tomar Cobertura]** Te resguardaste tras una barricada (-60% daño recibido este turno).`;
    } else if (actionType === 'FACTION_TAUNT') {
      actionHeader = `📢 **[Provocar al Jefe]** ¡Avisaste a tu facción y atrajiste la atención del jefe! (+25% daño de facción).`;
    } else {
      const critTag = res.isCrit ? ' 💥 **¡IMPACTO CRÍTICO!**' : '';
      if (res.isHit) {
        actionHeader = `⚔️ **[Ataque con ${res.weaponName}]**${critTag} Infligiste **+${res.damageDealt.toLocaleString()} HP** al jefe.`;
      } else {
        actionHeader = `💨 **[Ataque con ${res.weaponName}]** Fallaste el disparo contra el jefe.`;
      }
    }

    let attackMsg = `${actionHeader}\n` +
      `🛡️ Contraataque del Jefe (${res.phaseEmoji} ${res.phaseTitle}): Sufriste **-${res.bodyPartDamage} HP** en **${res.bodyPartStruck}**.\n` +
      `${res.extraEffectNote ? `${res.extraEffectNote}\n` : ''}`;

    if (res.isKnockedOut) {
      attackMsg += `💀 💥 **¡HAS QUEDADO INCAPACITADO!** Fuiste evacuado al hospital de campaña (Triage: ${res.hospitalMinutes} min). Usa un Botiquín para darte el alta de inmediato.\n`;
    }

    attackMsg += `${res.quote}`;

    if (res.isDefeated) {
      attackMsg += `\n\n🎉 **¡VICTORIA! ${res.bossName} HA SIDO DERROTADO POR LOS COMBATIENTES!**`;
      for (const log of damageLogs) {
        try {
          await AchievementService.checkAndUnlock(log.playerId);
        } catch {}
      }
    }

    try {
      const unlockedAchs = await AchievementService.checkAndUnlock(player.id);
      for (const ach of unlockedAchs) {
        attackMsg += `\n🏆 **¡Logro desbloqueado: ${ach.title}!** ${ach.description} (+$${ach.rewardCash.toLocaleString()} recompensa)`;
      }
    } catch {}

    const newContent = appendActionLog(interaction.message?.content, [attackMsg], 4);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBossQuickMedical(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const customId = interaction.customId;
  const category: 'DAILY' | 'WEEKLY_FACTION' = customId.includes('WEEKLY_FACTION') ? 'WEEKLY_FACTION' : 'DAILY';

  try {
    const res = await BossService.quickMedicalHeal(player.id);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const boss = await BossService.getOrCreateActiveBoss(guildId, category);
    const damageLog = await prisma.worldBossDamage.findUnique({
      where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
    });
    const damageLogs = await prisma.worldBossDamage.findMany({
      where: { bossId: boss.id },
      include: { player: true },
      orderBy: { damageDealt: 'desc' },
    });

    const embed = category === 'DAILY'
      ? createDailyBossViewEmbed(boss, damageLog, freshPlayer || player)
      : createWeeklyBossViewEmbed(boss, damageLogs, freshPlayer || player);

    const btns = createBossActionButtons(category, freshPlayer || player);
    const healMsg = `💉 **¡Primeros Auxilios Aplicados!** Usaste **${res.itemName}** y recuperaste salud (🫀 Torso: ${res.torsoHp} HP, 🧠 Cabeza: ${res.headHp} HP).`;
    const newContent = appendActionLog(interaction.message?.content, [healMsg], 4);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBossQuickEnergy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const customId = interaction.customId;
  const category: 'DAILY' | 'WEEKLY_FACTION' = customId.includes('WEEKLY_FACTION') ? 'WEEKLY_FACTION' : 'DAILY';

  try {
    const res = await BossService.quickEnergyDrink(player.id);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const boss = await BossService.getOrCreateActiveBoss(guildId, category);
    const damageLog = await prisma.worldBossDamage.findUnique({
      where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
    });
    const damageLogs = await prisma.worldBossDamage.findMany({
      where: { bossId: boss.id },
      include: { player: true },
      orderBy: { damageDealt: 'desc' },
    });

    const embed = category === 'DAILY'
      ? createDailyBossViewEmbed(boss, damageLog, freshPlayer || player)
      : createWeeklyBossViewEmbed(boss, damageLogs, freshPlayer || player);

    const btns = createBossActionButtons(category, freshPlayer || player);
    const energyMsg = `🔋 **¡Energizante Consumido!** Tomaste **${res.itemName}** y recuperaste **+${res.addEnergy}⚡** (Energía total: **${res.currentEnergy}⚡**).`;
    const newContent = appendActionLog(interaction.message?.content, [energyMsg], 4);

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

    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const damageLog = await prisma.worldBossDamage.findUnique({
      where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
    });
    const embed = createDailyBossViewEmbed(boss, damageLog, freshPlayer || player);
    const btns = createBossActionButtons('DAILY', freshPlayer || player);
    const claimMsg = `🎉 **¡Recompensa de Hito Reclamada!** Alcanzaste **${res.milestoneTitle}** y ganaste **+$${res.rewardCash.toLocaleString()}** y **+${res.rewardXp} XP**.`;
    const newContent = appendActionLog(interaction.message?.content, [claimMsg], 4);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

