import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { CrimeService } from '../services/crimeService.js';
import { createJailViewEmbed, createJailActionButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActJail(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  _player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const jailedPlayers = await CrimeService.getJailedPlayers();
  const embed = createJailViewEmbed(jailedPlayers);
  const jailButtons = createJailActionButtons();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: jailButtons as any,
  });
}

export async function handleJailSelfBust(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  try {
    const res = await CrimeService.selfBust(player.id);
    const jailedPlayers = await CrimeService.getJailedPlayers();
    const embed = createJailViewEmbed(jailedPlayers);
    const jailButtons = createJailActionButtons();
    const newContent = appendActionLog(interaction.message?.content, [res.message], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: jailButtons as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
