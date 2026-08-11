import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { createGameHubEmbed, createGameHubButtons } from '../../ui/embeds.js';
import { IS_COMPONENTS_V2_FLAG } from '../../ui/visualComponents.js';

export const gameCommand = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Abre la interfaz principal del Hub de la Ciudad de Sinford'),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    let player = await PlayerService.getPlayerByDiscordId(discordId);

    if (!player) {
      player = await PlayerService.registerPlayer(discordId, interaction.user.username);
    }

    const container = createGameHubEmbed(player);
    const buttons = createGameHubButtons();

    return interaction.reply({
      components: [container, ...buttons] as any,
      flags: IS_COMPONENTS_V2_FLAG,
    });
  },
};
