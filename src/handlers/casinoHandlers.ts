import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { CasinoService } from '../services/casinoService.js';
import { PlayerService } from '../services/playerService.js';
import { createCasinoViewEmbed, createCasinoButtons } from '../ui/embeds.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActCasino(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const embed = createCasinoViewEmbed(player);
  const btns = createCasinoButtons();
  await interaction.update({
    content: null,
    embeds: [embed],
    components: btns as any,
  });
}

export async function handleCasinoSlots(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  let betAmount = 500n;
  if (interaction.customId.includes('2500')) betAmount = 2500n;
  if (interaction.customId.includes('10000')) betAmount = 10000n;

  try {
    const result = await CasinoService.playSlots(player.id, betAmount);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);

    const embed = createCasinoViewEmbed(freshPlayer || player);
    const btns = createCasinoButtons();

    let resultMsg = '';
    if (result.isWin) {
      resultMsg = `🎰 **[TRAGAMONEDAS]** [ ${result.reels} ] — 🎉 **¡GANASTE!** Cobraste **+$${result.netGain.toLocaleString()}** en efectivo.`;
    } else {
      resultMsg = `🎰 **[TRAGAMONEDAS]** [ ${result.reels} ] — 💸 **Mala suerte.** Perdiste tu apuesta de **-$${betAmount.toLocaleString()}**.`;
    }

    await interaction.update({
      content: resultMsg,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error en el Casino: ${err.message}`, ephemeral: true });
  }
}

export async function handleCasinoBlackjack(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  let betAmount = 1000n;
  if (interaction.customId.includes('5000')) betAmount = 5000n;

  try {
    const result = await CasinoService.playBlackjack(player.id, betAmount);
    const freshPlayer = await PlayerService.getPlayerByDiscordId(player.discordId, guildId);

    const embed = createCasinoViewEmbed(freshPlayer || player);
    const btns = createCasinoButtons();

    let resultMsg = '';
    if (result.isWin) {
      resultMsg = `🃏 **[BLACKJACK]** Tu mano: **${result.playerHand}** | Casa: **${result.dealerHand}** — 🎉 **¡VICTORIA!** Ganaste **+$${result.netGain.toLocaleString()}**.`;
    } else {
      resultMsg = `🃏 **[BLACKJACK]** Tu mano: **${result.playerHand}** | Casa: **${result.dealerHand}** — 💀 **La casa gana.** Perdiste **-$${betAmount.toLocaleString()}**.`;
    }

    await interaction.update({
      content: resultMsg,
      embeds: [embed],
      components: btns as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ Error en Blackjack: ${err.message}`, ephemeral: true });
  }
}
