import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CombatService } from '../../services/combatService.js';
import { createCombatResultEmbed, createPostCombatActionButtons } from '../../ui/embeds.js';

export const atacarCommand = {
  data: new SlashCommandBuilder()
    .setName('atacar')
    .setDescription('Inicia un combate PvP atómico contra otro jugador (Consume 25⚡)')
    .addUserOption((option) =>
      option.setName('usuario').setDescription('El jugador al que deseas atacar').setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('usuario', true);
    const attackerDiscordId = interaction.user.id;
    const defenderDiscordId = targetUser.id;
    const guildId = interaction.guildId || 'GLOBAL';

    try {
      await interaction.deferReply();

      // Ejecutar combate PvP aislado por servidor (guildId)
      const combatResult = await CombatService.executePvPCombat(attackerDiscordId, defenderDiscordId, guildId);
      const embed = createCombatResultEmbed(combatResult);
      const postActionButtons = createPostCombatActionButtons(combatResult.winnerId, combatResult.loserId);

      return interaction.editReply({
        embeds: [embed],
        components: postActionButtons as any,
      });
    } catch (err: any) {
      if (interaction.deferred) {
        return interaction.editReply({ content: `❌ ${err.message}` });
      }
      return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};
