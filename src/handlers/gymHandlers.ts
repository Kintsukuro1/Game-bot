import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { GymService } from '../services/gymService.js';
import { MissionService } from '../services/missionService.js';
import { NPCService } from '../services/npcService.js';
import { createGymViewEmbed, createGymButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActGym(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const embed = createGymViewEmbed(player);
  const gymButtons = createGymButtons();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: gymButtons as any,
  });
}

export async function handleGymTrain(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const statMap: Record<string, 'strength' | 'defense' | 'speed' | 'dexterity'> = {
    gym_train_strength: 'strength',
    gym_train_defense: 'defense',
    gym_train_speed: 'speed',
    gym_train_dexterity: 'dexterity',
  };

  try {
    const statName = statMap[interaction.customId];
    const result = await GymService.trainStat(player.id, statName, 1);
    await MissionService.progressMission(player.id, 'TRAINING', 1);

    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createGymViewEmbed(updated);
    const gymButtons = createGymButtons();
    const reaction = NPCService.getReaction('tony', 'success');

    const msg = `🏋️ **¡Entrenamiento exitoso en ${result.gymName}!** Aumentaste **+${result.gain.toFixed(3)}** de **${result.statName.toUpperCase()}**.`;
    const newContent = appendActionLog(interaction.message?.content, [msg, reaction], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: gymButtons as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleGymUpgrade(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const newGym = await GymService.upgradeGym(player.id);
    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createGymViewEmbed(updated);
    const gymButtons = createGymButtons();
    const msg = `🎉 **¡Membresía Mejorada!** Bienvenido a **${newGym.name}** (Tier ${newGym.tier}).`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: gymButtons as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
