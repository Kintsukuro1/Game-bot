import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';

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
        flags: [MessageFlags.Ephemeral],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f0ff)
      .setTitle(`👤 Perfil de ${player.username}`)
      .setDescription(
        `• **Nivel:** ${player.level}\n` +
        `• **Efectivo:** $${player.wallet?.cash.toLocaleString() || 0}\n` +
        `• **Banco:** $${player.wallet?.bank.toLocaleString() || 0}\n` +
        `• **Energía:** ${player.stats?.energy}/${player.stats?.maxEnergy} ⚡\n` +
        `• **Nerve:** ${player.stats?.nerve}/${player.stats?.maxNerve} 🧠\n\n` +
        `📱 *Abre la Discord Activity para ver tu estado de salud anatómico y gestionar tu equipamiento.*`
      )
      .setFooter({ text: 'Sinford Underworld' });

    return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
  },
};
