import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { createGameHubEmbed, createGameHubButtons } from '../../ui/embeds.js';

export const gameCommand = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Abre la interfaz principal del Hub de la Ciudad de Sinford')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    let player = await PlayerService.getPlayerByDiscordId(discordId);

    if (!player) {
      player = await PlayerService.registerPlayer(discordId, interaction.user.username);
    }

    const embed = createGameHubEmbed(player);
    const buttons = createGameHubButtons(player.level);

    return interaction.reply({
      embeds: [embed],
      components: buttons as any,
    });
  },
};
