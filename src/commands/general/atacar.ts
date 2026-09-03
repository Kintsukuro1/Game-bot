import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { CombatService } from '../../services/combatService.js';

export const atacarCommand = {
  data: new SlashCommandBuilder()
    .setName('atacar')
    .setDescription('Inicia un combate PvP contra otro jugador (Consume 25⚡)')
    .addUserOption((option) =>
      option.setName('usuario').setDescription('El jugador al que deseas atacar').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('usuario', true);
    const attackerDiscordId = interaction.user.id;
    const defenderDiscordId = targetUser.id;

    try {
      await interaction.deferReply();

      const result = await CombatService.executePvPCombat(attackerDiscordId, defenderDiscordId);
      const embed = new EmbedBuilder()
        .setColor(0xdc143c)
        .setTitle(`⚔️ COMBATE PvP — GANADOR: ${result.winnerUsername}`)
        .setDescription(
          `**Daño total infligido:** ${result.totalDamageDealt} HP\n\n` +
          `📱 *Para ver el combate en tiempo real y batallas avanzadas, abre la Discord Activity.*`
        )
        .setFooter({ text: 'Sinford Underworld Combat Engine' });

      return interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      if (interaction.deferred) {
        return interaction.editReply({ content: `❌ ${err.message}` });
      }
      return interaction.reply({ content: `❌ ${err.message}`, flags: [MessageFlags.Ephemeral] });
    }
  },
};
