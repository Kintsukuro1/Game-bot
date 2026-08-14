import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { FactionService } from '../services/factionService.js';
import { AchievementService } from '../services/achievementService.js';
import { prisma } from '../db/prisma.js';
import { createFactionViewEmbed, createFactionButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActFaction(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const member = await prisma.factionMember.findUnique({
    where: { playerId: player.id },
    include: { faction: { include: { members: true } } },
  });
  const faction = member ? member.faction : null;
  const embed = createFactionViewEmbed(faction);
  const factionBtns = createFactionButtons(!!faction);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: factionBtns as any,
  });
}

export async function handleFactionCreate(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const factionName = `Facción de ${player.username}`;
    const faction = await FactionService.createFaction(player.id, factionName, 'Facción creada desde el Hub', guildId);

    let achMsg = '';
    try {
      const unlockedAchs = await AchievementService.checkAndUnlock(player.id);
      for (const ach of unlockedAchs) {
        achMsg += `\n🏆 **¡Logro desbloqueado: ${ach.title}!** ${ach.description} (+$${ach.rewardCash.toLocaleString()} recompensa)`;
      }
    } catch {}

    const embed = createFactionViewEmbed(faction);
    const factionBtns = createFactionButtons(true);
    const msg = `🎉 **¡Facción Creada!** Fundaste la facción **${faction.name}**.\n${achMsg}`.trim();
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: factionBtns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleFactionDep10k(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  try {
    await FactionService.depositTreasury(player.id, 10000n);
    const member = await prisma.factionMember.findUnique({
      where: { playerId: player.id },
      include: { faction: { include: { members: true } } },
    });
    const embed = createFactionViewEmbed(member?.faction);
    const factionBtns = createFactionButtons(true);
    const msg = '💰 **¡Depósito Exitoso!** Acreditaste **+$10,000** a la tesorería de tu facción.';
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: factionBtns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleFactionExecuteOc(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  try {
    const res = await FactionService.executeOrganizedCrime(player.id, 'Asalto al Banco Central');
    const member = await prisma.factionMember.findUnique({
      where: { playerId: player.id },
      include: { faction: { include: { members: true } } },
    });
    const embed = createFactionViewEmbed(member?.faction);
    const factionBtns = createFactionButtons(true);
    const msg = `🔥 **¡Crimen Organizado Exitoso!** Tu facción ejecutó el golpe y obtuvo **+$${res.rewardCash.toLocaleString()}** en la tesorería y **+${res.respectGained} Puntos de Respeto**.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: factionBtns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
