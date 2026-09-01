import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { MasteryService } from '../services/masteryService.js';
import { PlayerService } from '../services/playerService.js';
import {
  createMasteryViewEmbed,
  createMasteryPerkSelect,
  createMasteryButtons,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActMastery(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const mastery = await MasteryService.getPlayerMastery(player.id);
  const embed = createMasteryViewEmbed(mastery, player);
  const selectRow = createMasteryPerkSelect(mastery.perkPoints);
  const btns = createMasteryButtons();

  const components = selectRow ? [selectRow as any, ...btns as any] : [...btns as any];

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectMasteryPerk(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const perkId = interaction.values[0];

  try {
    const res = await MasteryService.redeemPerk(player.id, perkId);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);
    const mastery = await MasteryService.getPlayerMastery(player.id);

    const embed = createMasteryViewEmbed(mastery, freshPlayer || player);
    const selectRow = createMasteryPerkSelect(res.remainingPoints);
    const btns = createMasteryButtons();
    const components = selectRow ? [selectRow as any, ...btns as any] : [...btns as any];

    await interaction.update({
      content: `🌟 **¡Mejora desbloqueada!** Has adquirido **${res.perk.name}** (${res.perk.description}). Te quedan **${res.remainingPoints} Pts** de Perk.`,
      embeds: [embed],
      components,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al canjear perk: ${err.message}`, ephemeral: true });
  }
}
