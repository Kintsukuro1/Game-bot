import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ShopService } from '../services/shopService.js';
import { createShopCatalogEmbed, createShopSelectRow, createShopNavButtons } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActShop(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const catalog = await ShopService.getCatalogByCategory(0);
  const embed = createShopCatalogEmbed(catalog, player.level, 0);
  const selectRow = createShopSelectRow(catalog);
  const navBtns = createShopNavButtons(0);
  const components = selectRow ? [selectRow as any, ...navBtns as any] : [...navBtns as any];

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectShopItem(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const itemId = interaction.values[0];
  try {
    const result = await ShopService.buyItem(player.id, itemId, 1);
    await interaction.reply({
      content: `🛍️ ¡Compraste **${result.item.name}** por **$${result.totalCost.toLocaleString()}**! El ítem ha sido enviado a tu inventario.`,
      ephemeral: true,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al comprar: ${err.message}`, ephemeral: true });
  }
}

export async function handleShopCategory(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const catIndexStr = interaction.customId.replace('shop_cat_', '');
  const targetIndex = parseInt(catIndexStr, 10);

  if (!isNaN(targetIndex)) {
    const catalog = await ShopService.getCatalogByCategory(targetIndex);
    const embed = createShopCatalogEmbed(catalog, player.level, targetIndex);
    const selectRow = createShopSelectRow(catalog);
    const navBtns = createShopNavButtons(targetIndex);
    const components = selectRow ? [selectRow as any, ...navBtns as any] : [...navBtns as any];

    await interaction.update({
      content: null,
      embeds: [embed],
      components,
    });
  }
}
