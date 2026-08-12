import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { BlackMarketService } from '../services/blackMarketService.js';
import { createBlackMarketViewEmbed, createBlackMarketButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActBlackMarket(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const event = await BlackMarketService.getOrCreateActiveBlackMarket(guildId);
  const embed = createBlackMarketViewEmbed(event, player);
  const btns = createBlackMarketButtons(event);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: btns as any,
  });
}

export async function handleBmBuy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const itemType = interaction.customId === 'bm_buy_adrenalina' ? 'ADRENALINA' : 'SUERO';
  try {
    const res = await BlackMarketService.buyBlackMarketItem(player.id, itemType);
    const refreshedPlayer = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const event = await BlackMarketService.getOrCreateActiveBlackMarket(guildId);
    const embed = createBlackMarketViewEmbed(event, refreshedPlayer);
    const btns = createBlackMarketButtons(event);
    const newContent = appendActionLog(interaction.message?.content, [res.msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
