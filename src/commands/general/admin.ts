import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { prisma } from '../../db/prisma.js';

export const adminCommand = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comando de administración del servidor Sinford Underworld')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('dar_efectivo')
        .setDescription('Otorga efectivo a un jugador')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Jugador objetivo').setRequired(true))
        .addIntegerOption((opt) => opt.setName('monto').setDescription('Cantidad de dinero').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('liberar')
        .setDescription('Libera a un jugador de la prisión o del hospital')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Jugador objetivo').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('estado_bd').setDescription('Verifica la conexión y salud de la base de datos')),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId || 'GLOBAL';

    try {
      if (subcommand === 'dar_efectivo') {
        const targetUser = interaction.options.getUser('usuario', true);
        const amount = BigInt(interaction.options.getInteger('monto', true));

        const target = await PlayerService.getPlayerByDiscordId(targetUser.id, guildId);

        if (!target || !target.wallet) {
          return interaction.reply({ content: '❌ El jugador no existe o no se ha registrado en este servidor.', ephemeral: true });
        }

        const balanceBefore = target.wallet.cash;
        const balanceAfter = target.wallet.cash + amount;

        await prisma.wallet.update({
          where: { playerId: target.id },
          data: { cash: balanceAfter },
        });

        await prisma.transaction.create({
          data: {
            playerId: target.id,
            amount,
            balanceBefore,
            balanceAfter,
            type: 'ADMIN_GIVE_CASH',
            source: interaction.user.id,
            metadata: JSON.stringify({ adminDiscordId: interaction.user.id }),
          },
        });

        return interaction.reply({
          content: `✅ Se otorgaron **+$${amount.toLocaleString()}** a **${target.username}**. Nuevo saldo: **$${balanceAfter.toLocaleString()}**.`,
          ephemeral: true,
        });
      }

      if (subcommand === 'liberar') {
        const targetUser = interaction.options.getUser('usuario', true);
        const target = await PlayerService.getPlayerByDiscordId(targetUser.id, guildId);

        if (!target) {
          return interaction.reply({ content: '❌ El jugador no existe en este servidor.', ephemeral: true });
        }

        await prisma.player.update({
          where: { id: target.id },
          data: { hospitalUntil: null, jailUntil: null },
        });

        return interaction.reply({
          content: `✅ **${target.username}** fue liberado del Hospital y de Prisión.`,
          ephemeral: true,
        });
      }

      if (subcommand === 'estado_bd') {
        const playerCount = await prisma.player.count();
        const itemCount = await prisma.item.count();
        const txCount = await prisma.transaction.count();

        return interaction.reply({
          content: `🟢 **Estado de la Base de Datos:** OK\n• Jugadores registrados globales: **${playerCount}**\n• Ítems en catálogo: **${itemCount}**\n• Transacciones auditadas: **${txCount}**`,
          ephemeral: true,
        });
      }
    } catch (err: any) {
      return interaction.reply({ content: `❌ Error de administración: ${err.message}`, ephemeral: true });
    }
  },
};
