import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { createProfileViewEmbed } from '../../ui/embeds.js';

export const profileCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Muestra el perfil, finanzas y estadísticas de tu personaje'),
  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    let player = await PlayerService.getPlayerByDiscordId(discordId);

    if (!player) {
      return interaction.reply({
        content: `❌ Aún no tienes personaje registrado. Usa \`/empezar\` para comenzar a jugar.`,
        ephemeral: true,
      });
    }

    const embed = createProfileViewEmbed(player);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
