import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { InventoryService } from '../services/inventoryService.js';
import { MissionService } from '../services/missionService.js';
import { AchievementService } from '../services/achievementService.js';
import {
  createInventoryViewEmbed,
  createInventoryItemSelectRow,
  createEquipmentViewEmbed,
  createBackButtonRow,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleHubInventory(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createInventoryViewEmbed(player);
  const selectRow = createInventoryItemSelectRow(player.inventory || []);
  const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];
  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleHubEquipment(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const embed = createEquipmentViewEmbed(player);
  await interaction.update({
    content: null,
    embeds: [embed],
    components: [backRow as any],
  });
}

export async function handleSelectInvItem(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const invItemId = interaction.values[0];
  const invItem = player.inventory?.find((i: any) => i.id === invItemId);

  if (!invItem) {
    await interaction.reply({ content: '❌ Objeto no encontrado.', ephemeral: true });
    return;
  }

  if (invItem.item.slot) {
    await InventoryService.toggleEquipItem(player.id, invItemId);
    await interaction.reply({
      content: `⚔️ Cambiaste el estado de equipamiento para **${invItem.item.name}**.`,
      ephemeral: true,
    });
  } else {
    let useMsg = await InventoryService.useItem(player.id, invItemId);
    await MissionService.progressMission(player.id, 'ITEMS', 1);

    try {
      const unlockedAchs = await AchievementService.checkAndUnlock(player.id);
      for (const ach of unlockedAchs) {
        useMsg += `\n🏆 **¡Logro desbloqueado: ${ach.title}!** ${ach.description} (+$${ach.rewardCash.toLocaleString()} recompensa)`;
      }
    } catch {}

    await interaction.reply({ content: useMsg, ephemeral: true });
  }
}
