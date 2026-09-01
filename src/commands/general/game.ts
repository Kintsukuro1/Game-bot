import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationIntegrationType, InteractionContextType, EmbedBuilder } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';

export const gameCommand = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Abre la interfaz interactiva de la Ciudad de Sinford')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    let player = await PlayerService.getPlayerByDiscordId(discordId);

    if (!player) {
      player = await PlayerService.registerPlayer(discordId, interaction.user.username);
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f0ff)
      .setTitle('🏙️ SINFORD UNDERWORLD — ACTIVIDAD WEB')
      .setDescription(
        `Bienvenido a **Sinford Underworld**, **${player.username}**.\n\n` +
        `**Rango:** Nivel ${player.level} | 💰 **Efectivo:** $${player.wallet?.cash.toLocaleString() || 0}\n\n` +
        `📱 *Abre la Discord Activity desde el botón de la sala para acceder al mapa interactivo y todos los módulos.*`
      )
      .setFooter({ text: 'Sinford Underworld • Discord Activity Application' });

    return interaction.reply({
      embeds: [embed],
    });
  },
};
