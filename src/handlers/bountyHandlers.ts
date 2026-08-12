import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { BountyService } from '../services/bountyService.js';
import { createBountiesViewEmbed, createBackButtonRow } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActBounties(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const bounties = await BountyService.getActiveBounties();
  const embed = createBountiesViewEmbed(bounties, player.level);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}
