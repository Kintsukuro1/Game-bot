import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';

export const empezarCommand = {
  data: new SlashCommandBuilder()
    .setName('empezar')
    .setDescription('Comando de inicio y registro en Sinford Underworld'),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    let player = await PlayerService.getPlayerByDiscordId(discordId);
    let isNew = false;

    if (!player) {
      player = await PlayerService.registerPlayer(discordId, username);
      isNew = true;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f0ff)
      .setTitle(isNew ? '🎉 ¡BIENVENIDO A SINFORD!' : '🏙️ PERFIL SINCRONIZADO')
      .setDescription(
        `${isNew ? `Se han acreditado **$100** de efectivo inicial a tu cuenta, **${username}**.\n\n` : `Ya estabas registrado en Sinford Underworld, **${username}**.\n\n`}` +
        `📱 *Abre la Discord Activity para jugar en vivo desde la aplicación gráfica.*`
      )
      .setFooter({ text: 'Sinford Underworld • Discord Activity Application' });

    return interaction.reply({
      embeds: [embed],
    });
  },
};
