import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PropertyService } from '../services/propertyService.js';
import { PlayerService } from '../services/playerService.js';
import {
  createPropertyViewEmbed,
  createPropertySelect,
  createPropertyButtons,
} from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActProperties(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const prop = await PropertyService.getPlayerProperty(player.id);
  const embed = createPropertyViewEmbed(prop, player);
  const selectRow = createPropertySelect();
  const btns = createPropertyButtons();

  await interaction.update({
    content: null,
    embeds: [embed],
    components: [selectRow as any, ...btns as any],
  });
}

export async function handleSelectPropertyBuy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const propertyType = interaction.values[0];

  try {
    const updatedProp = await PropertyService.buyProperty(player.id, propertyType);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);

    const embed = createPropertyViewEmbed(updatedProp, freshPlayer || player);
    const selectRow = createPropertySelect();
    const btns = createPropertyButtons();

    await interaction.update({
      content: `🏡 **¡Enhorabuena!** Compraste **${propertyType}**. Tu felicidad máxima ahora es de **${freshPlayer?.stats?.maxHappy || updatedProp.maxHappy} Happy**.`,
      embeds: [embed],
      components: [selectRow as any, ...btns as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al comprar propiedad: ${err.message}`, ephemeral: true });
  }
}

export async function handlePropertyStaff(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  let staffType = 'Maid';
  if (interaction.customId === 'prop_hire_butler') staffType = 'Butler';
  if (interaction.customId === 'prop_hire_guard') staffType = 'Guard';

  try {
    const updatedProp = await PropertyService.hireStaff(player.id, staffType);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);

    const embed = createPropertyViewEmbed(updatedProp, freshPlayer || player);
    const selectRow = createPropertySelect();
    const btns = createPropertyButtons();

    await interaction.update({
      content: `🤵 **¡Personal contratado!** Has contratado un(a) **${staffType}** para tu propiedad. Max Happy aumentado.`,
      embeds: [embed],
      components: [selectRow as any, ...btns as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error al contratar personal: ${err.message}`, ephemeral: true });
  }
}
