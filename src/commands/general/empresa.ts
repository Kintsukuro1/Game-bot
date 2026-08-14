import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { CompanyService } from '../../services/companyService.js';

export const empresaCommand = {
  data: new SlashCommandBuilder()
    .setName('empresa')
    .setDescription('Gestión de tu empresa en Sinford')
    .addSubcommand((sub) =>
      sub
        .setName('contratar')
        .setDescription('Contrata a otro jugador como empleado de tu empresa')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Jugador a contratar').setRequired(true))
        .addIntegerOption((opt) => opt.setName('salario').setDescription('Salario diario a pagar').setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId || 'GLOBAL';

    try {
      if (subcommand === 'contratar') {
        const ownerDiscordId = interaction.user.id;
        const targetUser = interaction.options.getUser('usuario', true);
        const salary = BigInt(interaction.options.getInteger('salario', true));

        const ownerPlayer = await PlayerService.getPlayerByDiscordId(ownerDiscordId, guildId);
        if (!ownerPlayer) {
          return interaction.reply({
            content: '❌ Necesitas registrarte primero usando `/empezar`.',
            ephemeral: true,
          });
        }

        const targetPlayer = await PlayerService.getPlayerByDiscordId(targetUser.id, guildId);
        if (!targetPlayer) {
          return interaction.reply({
            content: '❌ El jugador objetivo no está registrado en el juego.',
            ephemeral: true,
          });
        }

        if (ownerPlayer.id === targetPlayer.id) {
          return interaction.reply({
            content: '❌ No puedes contratarte a ti mismo como empleado.',
            ephemeral: true,
          });
        }

        await CompanyService.hireEmployee(ownerPlayer.id, targetPlayer.id, salary);

        return interaction.reply({
          content: `🤝 **¡Contratación Exitosa!** **${interaction.user.username}** ha contratado a **${targetUser.username}** en su empresa con un salario diario de **$${salary.toLocaleString()}**.`,
        });
      }
    } catch (err: any) {
      return interaction.reply({
        content: `❌ ${err.message}`,
        ephemeral: true,
      });
    }
  },
};
