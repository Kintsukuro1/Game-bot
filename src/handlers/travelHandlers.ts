import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { TravelService } from '../services/travelService.js';
import { AchievementService } from '../services/achievementService.js';
import {
  createTravelViewEmbed,
  createTravelDestinationSelect,
  createTravelButtons,
} from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActTravel(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const travelState = await TravelService.getTravelState(player.id);
  const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
  const embed = createTravelViewEmbed(freshPlayer, travelState);
  const btnRow = createTravelButtons(travelState);

  const components =
    !travelState.isTraveling && travelState.destination === 'Home'
      ? [createTravelDestinationSelect() as any, ...btnRow as any]
      : (btnRow as any);

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectTravelDestination(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const destinationId = interaction.values[0];

  try {
    const travelState = await TravelService.startTravel(player.id, destinationId);

    let achMsg = '';
    try {
      const unlockedAchs = await AchievementService.checkAndUnlock(player.id);
      for (const ach of unlockedAchs) {
        achMsg += `\n🏆 **¡Logro desbloqueado: ${ach.title}!** ${ach.description} (+$${ach.rewardCash.toLocaleString()} recompensa)`;
      }
    } catch {}

    const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
    const embed = createTravelViewEmbed(freshPlayer, travelState);
    const btnRow = createTravelButtons(travelState);

    const msg = `✈️ **¡Vuelo Despegado!** Compraste tu boleto hacia **${destinationId}** y estás en el aire.\n${achMsg}`.trim();
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btnRow as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleTravelReturnHome(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const travelState = await TravelService.returnHome(player.id);
    const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
    const embed = createTravelViewEmbed(freshPlayer, travelState);
    const selectRow = createTravelDestinationSelect();
    const btnRow = createTravelButtons(travelState);

    const msg = '🏠 **¡Bienvenido de vuelta a Sinford!** Has regresado a casa sano y salvo.';
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: [selectRow as any, ...btnRow as any],
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
