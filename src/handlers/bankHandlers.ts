import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { EconomyService } from '../services/economyService.js';
import { createBankViewEmbed, createBankActionButtons } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActBank(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const embed = createBankViewEmbed(player);
  const bankButtons = createBankActionButtons();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: bankButtons as any,
  });
}

export async function handleBankDep100(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    await EconomyService.deposit(player.id, 100n);
    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createBankViewEmbed(updated);
    const msg = '💰 **¡Depósito Exitoso!** Depositaste **+$100** en tu cuenta bancaria.';
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({ content: newContent, embeds: [embed] });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBankDepAll(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const cashAmt = player.wallet?.cash || 0n;
    await EconomyService.deposit(player.id, cashAmt);
    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createBankViewEmbed(updated);
    const msg = `💰 **¡Depósito Exitoso!** Depositaste todo tu efectivo (**+$${cashAmt.toLocaleString()}**) en el banco.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({ content: newContent, embeds: [embed] });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBankWit100(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    await EconomyService.withdraw(player.id, 100n);
    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createBankViewEmbed(updated);
    const msg = '💵 **¡Retiro Exitoso!** Retiraste **-$100** de tu cuenta bancaria.';
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({ content: newContent, embeds: [embed] });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleBankWitAll(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const bankAmt = player.wallet?.bank || 0n;
    await EconomyService.withdraw(player.id, bankAmt);
    const updated = await PlayerService.getPlayerByDiscordId(interaction.user.id, guildId);
    const embed = createBankViewEmbed(updated);
    const msg = `💵 **¡Retiro Exitoso!** Retiraste todo tu saldo bancario (**-$${bankAmt.toLocaleString()}**).`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({ content: newContent, embeds: [embed] });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
