import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { PlayerService } from '../../services/playerService.js';
import { prisma } from '../../db/prisma.js';

export const dueloCommand = {
  data: new SlashCommandBuilder()
    .setName('duelo')
    .setDescription('Reta a otro jugador a un duelo con apuesta en efectivo')
    .addSubcommand((sub) =>
      sub
        .setName('retar')
        .setDescription('Reta a un jugador a un duelo apostando dinero')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Jugador a retar').setRequired(true))
        .addIntegerOption((opt) => opt.setName('apuesta').setDescription('Monto a apostar (ambos arriesgan lo mismo)').setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId || 'GLOBAL';

    try {
      if (subcommand === 'retar') {
        const challengerUser = interaction.user;
        const challengedUser = interaction.options.getUser('usuario', true);
        const wagerAmount = BigInt(interaction.options.getInteger('apuesta', true));

        if (wagerAmount <= 0n) {
          return interaction.reply({
            content: '❌ El monto de la apuesta debe ser mayor a $0.',
            ephemeral: true,
          });
        }

        if (challengerUser.id === challengedUser.id) {
          return interaction.reply({
            content: '❌ No puedes retarte a duelo a ti mismo.',
            ephemeral: true,
          });
        }

        const challenger = await PlayerService.getPlayerByDiscordId(challengerUser.id, guildId);
        if (!challenger) {
          return interaction.reply({
            content: '❌ Necesitas registrarte primero con `/empezar` para participar en duelos.',
            ephemeral: true,
          });
        }

        const challenged = await PlayerService.getPlayerByDiscordId(challengedUser.id, guildId);
        if (!challenged) {
          return interaction.reply({
            content: `❌ El usuario <@${challengedUser.id}> aún no está registrado en el juego.`,
            ephemeral: true,
          });
        }

        if (!challenger.wallet || challenger.wallet.cash < wagerAmount) {
          return interaction.reply({
            content: `❌ No tienes suficiente efectivo para cubrir la apuesta de **$${wagerAmount.toLocaleString()}**. (Tu efectivo: **$${(challenger.wallet?.cash || 0n).toLocaleString()}**)`,
            ephemeral: true,
          });
        }

        // Crear reto de duelo con expiración a 5 minutos
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const duel = await prisma.duelChallenge.create({
          data: {
            guildId,
            challengerId: challenger.id,
            challengedId: challenged.id,
            wagerAmount,
            status: 'PENDING',
            expiresAt,
          },
        });

        const embed = new EmbedBuilder()
          .setColor(0xd32f2f)
          .setTitle('⚔️ ¡DESAFÍO DE DUELO PVP CON APUESTA!')
          .setDescription(
            `🔥 <@${challengerUser.id}> ha desafiado a duelo a <@${challengedUser.id}>.\n\n` +
            `💰 **Apuesta individual:** $${wagerAmount.toLocaleString()} en efectivo\n` +
            `🏆 **Pozo Total en Juego:** **$${(wagerAmount * 2n).toLocaleString()}** (El ganador se lo lleva todo)\n\n` +
            `⏳ <@${challengedUser.id}>, tienes **5 minutos** para aceptar o declinar el combate en los botones de abajo.`
          )
          .setFooter({ text: 'Duelo con Apuesta • Sinford Underworld Fight Club' });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`duel_accept_${duel.id}`)
            .setLabel(`Aceptar Duelo ($${wagerAmount.toLocaleString()})`)
            .setEmoji('⚔️')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`duel_decline_${duel.id}`)
            .setLabel('Declinar Duelo')
            .setEmoji('🏳️')
            .setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row as any],
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
