import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { createGameHubEmbed, createGameHubButtons } from '../../ui/embeds.js';

export const empezarCommand = {
  data: new SlashCommandBuilder()
    .setName('empezar')
    .setDescription('Comando único de registro e inicio de tu aventura en Sinford Underworld'),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const guildId = interaction.guildId || 'GLOBAL';

    let player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
    let messagePrefix = '';

    if (!player) {
      player = await PlayerService.registerPlayer(discordId, username, guildId);
      messagePrefix = `🎉 **¡Registro Completado!** Bienvenido a Sinford, **${username}**. Se han acreditado **$100** de efectivo inicial a tu cuenta en este servidor.\n\n`;
    } else {
      messagePrefix = `ℹ️ Ya estás registrado en este servidor de Sinford Underworld. Cargando tu Hub central...\n\n`;
    }

    const embed = createGameHubEmbed(player);
    const buttons = createGameHubButtons();

    return interaction.reply({
      content: messagePrefix,
      embeds: [embed],
      components: buttons as any,
    });
  },
};
