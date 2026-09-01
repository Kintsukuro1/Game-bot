import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { MarketService } from '../services/marketService.js';
import { PlayerService } from '../services/playerService.js';
import {
  createPlayerMarketEmbed,
  createPlayerMarketSelect,
  createBackButtonRow,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

async function getActiveMarketItemsWithItem() {
  const marketItems = await prisma.marketItem.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const itemIds = marketItems.map((m) => m.itemId);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
  });

  return marketItems.map((m) => ({
    ...m,
    item: items.find((i) => i.id === m.itemId),
  }));
}

export async function handleActMarket(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const items = await getActiveMarketItemsWithItem();

  const embed = createPlayerMarketEmbed(items, player);
  const selectRow = createPlayerMarketSelect(items);
  const backRow = createBackButtonRow();

  const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectMarketBuy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const marketItemId = interaction.values[0];

  try {
    const res = await MarketService.buyMarketItem(player.id, marketItemId);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);

    const items = await getActiveMarketItemsWithItem();

    const embed = createPlayerMarketEmbed(items, freshPlayer || player);
    const selectRow = createPlayerMarketSelect(items);
    const backRow = createBackButtonRow();
    const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];

    await interaction.update({
      content: `📦 **¡Compra P2P completada!** Has adquirido el objeto del mercado por **$${res.price.toLocaleString()}** y ha sido añadido a tu inventario.`,
      embeds: [embed],
      components,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al comprar del mercado: ${err.message}`, ephemeral: true });
  }
}
