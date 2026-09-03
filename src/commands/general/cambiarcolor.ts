import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  Role,
  GuildMember,
  Routes,
  MessageFlags,
} from 'discord.js';
import { prisma } from '../../db/prisma.js';
import { PlayerService } from '../../services/playerService.js';

function isMemberBooster(member: GuildMember): boolean {
  return member.premiumSince !== null || member.permissions.has(PermissionFlagsBits.Administrator);
}

function isValidHex(hex: string): boolean {
  const clean = hex.trim().replace(/^#/, '');
  return /^[0-9A-Fa-f]{6}$/.test(clean) || /^[0-9A-Fa-f]{3}$/.test(clean);
}

function parseHexToInt(hex: string): number {
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return parseInt(clean, 16);
}

function formatHex(hex: string): string {
  let clean = hex.trim().replace(/^#/, '').toUpperCase();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return `#${clean}`;
}

async function getMemberBoosterRole(guildMember: GuildMember): Promise<Role | null> {
  const player = await PlayerService.getPlayerByDiscordId(guildMember.id, 'GLOBAL');
  if (player?.boosterRoleId) {
    const existingRole = guildMember.guild.roles.cache.get(player.boosterRoleId);
    if (existingRole) return existingRole;
  }
  return null;
}

export const cambiarColorCommand = {
  data: new SlashCommandBuilder()
    .setName('cambiarcolor')
    .setDescription('Panel de Roles Exclusivo para Server Boosters (Crear, editar nombre/icono y color de rol)')
    .addAttachmentOption((opt) =>
      opt
        .setName('icono')
        .setDescription('Sube directamente un archivo de imagen (PNG/JPG) para el ícono de tu rol')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Este comando solo puede ser utilizado dentro de un servidor de Discord.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Verificar si el usuario es Booster o Administrador
    if (!isMemberBooster(member)) {
      const nonBoosterEmbed = new EmbedBuilder()
        .setTitle('✨ Función Exclusiva para Server Boosters')
        .setDescription(
          '¡Gracias por formar parte de nuestro servidor!\n\n' +
            'Las funciones de **Roles Personalizados** (Crear rol propio, cambiarle el nombre, ícono y colores gradiente/holográficos) están reservadas para los **Server Boosters** de Discord.\n\n' +
            '⭐ **¿Qué obtienes al mejorar el servidor?**\n' +
            '• ➕ **Crear tu Rol Personal único** (Límite de 1 rol por usuario).\n' +
            '• ✏️ **Personalizar el nombre e ícono de tu rol** (subiendo imágenes directamente).\n' +
            '• 🎨 **Elegir entre colores Sólidos, Gradientes e Holográficos**.\n\n' +
            '¡Haz Boost en el servidor para desbloquear este panel al instante!'
        )
        .setColor(0xf47fff)
        .setTimestamp();

      return interaction.reply({
        embeds: [nonBoosterEmbed],
        flags: [MessageFlags.Ephemeral],
      });
    }

    const userRole = await getMemberBoosterRole(member);
    const uploadedIcon = interaction.options.getAttachment('icono');
    let attachmentStatusMsg = '';

    // Si el usuario adjuntó una imagen directamente al ejecutar /cambiarcolor icono: [archivo]
    if (uploadedIcon) {
      if (userRole) {
        try {
          await userRole.setIcon(uploadedIcon.url);
          attachmentStatusMsg = `\n\n🖼️ **¡Ícono Actualizado!** Se ha procesado y aplicado la imagen subida (\`${uploadedIcon.name}\`) a tu rol personal.`;
        } catch (err: any) {
          attachmentStatusMsg = '\n\n⚠️ *No se pudo aplicar la imagen subida como ícono. (Discord requiere Server Boost Nivel 2 en el servidor para íconos de rol).*';
        }
      } else {
        attachmentStatusMsg = '\n\n💡 *Has adjuntado una imagen. Por favor selecciona **Crear Rol Personal** en el menú para generar tu rol.*';
      }
    }

    const mainEmbed = new EmbedBuilder()
      .setTitle('⭐ Panel de Roles para Server Boosters')
      .setDescription(
        `¡Hola **${member.displayName}**! Como Server Booster tienes acceso a la gestión de tu rol personalizado.\n\n` +
          `**Rol Personal Actual:** ${userRole ? `<@&${userRole.id}>` : '*Ninguno creado todavía*'}` +
          attachmentStatusMsg +
          '\n\nSelecciona una de las siguientes opciones en el menú inferior:'
      )
      .setColor(userRole?.color || 0xf47fff)
      .setFooter({ text: 'Sistema de Roles Personalizados para Boosters • Puedes adjuntar una imagen en /cambiarcolor icono:' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('cambiarcolor_main_menu')
      .setPlaceholder('Elige una acción para tu rol personal...')
      .addOptions([
        {
          label: 'Crear Rol Personal',
          value: 'create_role',
          description: 'Crea tu propio rol único (Solo 1 rol permitido)',
          emoji: '➕',
        },
        {
          label: 'Editar Nombre e Ícono',
          value: 'edit_role',
          description: 'Cambia el nombre y la imagen/icono de tu rol',
          emoji: '✏️',
        },
        {
          label: 'Cambiar Color del Rol',
          value: 'change_color',
          description: 'Selecciona entre estilos Sólido, Gradiente u Holográfico',
          emoji: '🎨',
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    return interaction.reply({
      embeds: [mainEmbed],
      components: [row],
      flags: [MessageFlags.Ephemeral],
    });
  },

  async handleSelectMenu(interaction: StringSelectMenuInteraction) {
    if (!interaction.guild) return;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const customId = interaction.customId;

    if (!isMemberBooster(member)) {
      return interaction.reply({
        content: '❌ Necesitas ser Server Booster para usar este menú.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (customId === 'cambiarcolor_main_menu') {
      const selected = interaction.values[0];

      if (selected === 'create_role') {
        const player = await PlayerService.getPlayerByDiscordId(interaction.user.id, 'GLOBAL');
        let existingRole: Role | null = null;
        if (player?.boosterRoleId) {
          existingRole = interaction.guild.roles.cache.get(player.boosterRoleId) || null;
        }

        if (existingRole) {
          return interaction.reply({
            content: `❌ Ya has creado tu rol personal (<@&${existingRole.id}>). Solo puedes tener **1 rol personal**. Si deseas modificarlo, usa las opciones de **Editar Nombre e Ícono** o **Cambiar Color**.`,
            flags: [MessageFlags.Ephemeral],
          });
        }

        const modal = new ModalBuilder()
          .setCustomId('cambiarcolor_modal_create')
          .setTitle('➕ Crear Rol Personal (Booster)');

        const nameInput = new TextInputBuilder()
          .setCustomId('role_name')
          .setLabel('Nombre del Rol')
          .setPlaceholder('Ej: VIP Leyenda')
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(32)
          .setRequired(true);

        const hexInput = new TextInputBuilder()
          .setCustomId('role_hex')
          .setLabel('Color Inicial (Hex ej: #F47FFF)')
          .setPlaceholder('#F47FFF')
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(7)
          .setRequired(true);

        const iconInput = new TextInputBuilder()
          .setCustomId('role_icon')
          .setLabel('URL del Ícono del Rol (Opcional)')
          .setPlaceholder('https://i.imgur.com/tu_imagen.png')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(hexInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(iconInput)
        );

        return interaction.showModal(modal);
      }

      if (selected === 'edit_role') {
        const userRole = await getMemberBoosterRole(member);
        if (!userRole) {
          return interaction.reply({
            content: '❌ Aún no tienes un rol personal creado. Selecciona primero la opción **Crear Rol Personal**.',
            flags: [MessageFlags.Ephemeral],
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`cambiarcolor_modal_edit:${userRole.id}`)
          .setTitle('✏️ Editar Nombre e Ícono de Rol');

        const nameInput = new TextInputBuilder()
          .setCustomId('role_name')
          .setLabel('Nuevo Nombre del Rol')
          .setValue(userRole.name)
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(32)
          .setRequired(true);

        const iconInput = new TextInputBuilder()
          .setCustomId('role_icon')
          .setLabel('URL de Ícono (Dejar vacío = mantener)')
          .setPlaceholder('https://i.imgur.com/tu_imagen.png')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(iconInput)
        );

        return interaction.showModal(modal);
      }

      if (selected === 'change_color') {
        const userRole = await getMemberBoosterRole(member);
        if (!userRole) {
          return interaction.reply({
            content: '❌ Aún no tienes un rol personal creado. Selecciona primero la opción **Crear Rol Personal**.',
            flags: [MessageFlags.Ephemeral],
          });
        }

        const colorEmbed = new EmbedBuilder()
          .setTitle('🎨 Estilos de Color para tu Rol Personal')
          .setDescription(
            `Elige el estilo de color que deseas aplicar al rol **${userRole.name}**:\n\n` +
              '• 🎨 **Color Sólido**: Un único color plano o brillante.\n' +
              '• 🌈 **Gradiente**: Transición suave entre dos colores.\n' +
              '• ✨ **Holográfico**: Efecto brillante animado de 3 colores.'
          )
          .setColor(userRole.color || 0xf47fff);

        const styleSelect = new StringSelectMenuBuilder()
          .setCustomId(`cambiarcolor_select_style:${userRole.id}`)
          .setPlaceholder('Selecciona el estilo de color...')
          .addOptions([
            {
              label: 'Color Sólido',
              value: 'solid',
              description: 'Un único color plano constante',
              emoji: '🎨',
            },
            {
              label: 'Gradiente',
              value: 'gradient',
              description: 'Transición entre color primario y secundario',
              emoji: '🌈',
            },
            {
              label: 'Holográfico',
              value: 'holographic',
              description: 'Efecto brillante tricolor holográfico',
              emoji: '✨',
            },
          ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(styleSelect);

        return interaction.reply({
          embeds: [colorEmbed],
          components: [row],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    if (customId.startsWith('cambiarcolor_select_style:')) {
      const roleId = customId.split(':')[1];
      const style = interaction.values[0];

      let title = '🎨 Configurar Color Sólido';
      if (style === 'gradient') title = '🌈 Configurar Color Gradiente';
      if (style === 'holographic') title = '✨ Configurar Color Holográfico';

      const modal = new ModalBuilder()
        .setCustomId(`cambiarcolor_modal_color:${style}:${roleId}`)
        .setTitle(title);

      const primaryInput = new TextInputBuilder()
        .setCustomId('primary_hex')
        .setLabel('Color Primario (Hex: #FF0000)')
        .setPlaceholder('#FF0000')
        .setStyle(TextInputStyle.Short)
        .setMinLength(3)
        .setMaxLength(7)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(primaryInput));

      if (style === 'gradient' || style === 'holographic') {
        const secondaryInput = new TextInputBuilder()
          .setCustomId('secondary_hex')
          .setLabel('Color Secundario (Hex: #00FF00)')
          .setPlaceholder('#00FF00')
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(7)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(secondaryInput));
      }

      if (style === 'holographic') {
        const tertiaryInput = new TextInputBuilder()
          .setCustomId('tertiary_hex')
          .setLabel('Color Terciario (Hex: #0000FF)')
          .setPlaceholder('#0000FF')
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(7)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(tertiaryInput));
      }

      return interaction.showModal(modal);
    }
  },

  async handleModalSubmit(interaction: ModalSubmitInteraction) {
    if (!interaction.guild) return;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: '❌ El bot no tiene permiso de `Gestionar Roles` (`MANAGE_ROLES`).',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const customId = interaction.customId;

    // 1. Crear Rol Personal
    if (customId === 'cambiarcolor_modal_create') {
      const roleName = interaction.fields.getTextInputValue('role_name');
      const roleHexRaw = interaction.fields.getTextInputValue('role_hex');
      const roleIconUrl = interaction.fields.getTextInputValue('role_icon') || null;

      if (!isValidHex(roleHexRaw)) {
        return interaction.reply({
          content: `❌ El código hexadecimal '${roleHexRaw}' no es válido. Usa formato '#RRGGBB' o '#RGB'.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      const colorInt = parseHexToInt(roleHexRaw);

      try {
        const targetPosition = Math.max(1, botMember.roles.highest.position - 1);
        const newRole = await interaction.guild.roles.create({
          name: roleName,
          colors: { primaryColor: colorInt },
          position: targetPosition,
          reason: `Rol Personal Booster para ${interaction.user.tag}`,
        });

        if (roleIconUrl) {
          await newRole.setIcon(roleIconUrl).catch(() => {});
        }

        await member.roles.add(newRole);

        // Guardar la ID del rol en la base de datos
        let player = await PlayerService.getPlayerByDiscordId(interaction.user.id, 'GLOBAL');
        if (!player) {
          player = await PlayerService.registerPlayer(interaction.user.id, interaction.user.username, 'GLOBAL');
        }

        await prisma.player.update({
          where: { id: player.id },
          data: { boosterRoleId: newRole.id },
        });

        const successEmbed = new EmbedBuilder()
          .setTitle('🎉 ¡Rol Personal Creado con Éxito!')
          .setDescription(
            `Se ha creado tu rol exclusivo **<@&${newRole.id}>** y ha sido asignado a tu perfil.\n\n` +
              `• **Nombre:** \`${newRole.name}\`\n` +
              `• **Color:** \`${formatHex(roleHexRaw)}\`\n` +
              (roleIconUrl ? `• **Ícono:** [Ver Imagen](${roleIconUrl})\n\n` : '\n') +
              '*(Recuerda que solo puedes crear **1 rol personal**. Ahora puedes usar las opciones de editar o cambiar color en cualquier momento).*'
          )
          .setColor(colorInt)
          .setTimestamp();

        return interaction.reply({
          embeds: [successEmbed],
          flags: [MessageFlags.Ephemeral],
        });
      } catch (err: any) {
        console.error('❌ Error creando rol personal:', err);
        return interaction.reply({
          content: `❌ Ocurrió un error al crear el rol: ${err.message || err}`,
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    // 2. Editar Nombre e Ícono del Rol Personal
    if (customId.startsWith('cambiarcolor_modal_edit:')) {
      const roleId = customId.split(':')[1];
      const targetRole = interaction.guild.roles.cache.get(roleId);

      if (!targetRole) {
        return interaction.reply({
          content: '❌ Tu rol personal no fue encontrado en el servidor.',
          flags: [MessageFlags.Ephemeral],
        });
      }

      const newName = interaction.fields.getTextInputValue('role_name');
      const newIconUrl = interaction.fields.getTextInputValue('role_icon') || null;

      try {
        await targetRole.setName(newName);
        let iconUpdated = false;
        let iconErrorMsg = '';

        if (newIconUrl) {
          try {
            await targetRole.setIcon(newIconUrl);
            iconUpdated = true;
          } catch (err: any) {
            iconErrorMsg =
              '\n\n⚠️ *Nota sobre el ícono: La API de Discord requiere que el servidor alcance el Nivel 2 de Boost para permitir íconos de rol personalizados.*';
          }
        }

        const editEmbed = new EmbedBuilder()
          .setTitle('✏️ Rol Personal Actualizado')
          .setDescription(
            `Se han guardado los cambios para el rol **<@&${targetRole.id}>**:\n\n` +
              `• **Nuevo Nombre:** \`${newName}\`\n` +
              (iconUpdated ? `• **Ícono Actualizado:** [Ver Imagen](${newIconUrl})` : '') +
              iconErrorMsg
          )
          .setColor(targetRole.color || 0xf47fff)
          .setTimestamp();

        return interaction.reply({
          embeds: [editEmbed],
          flags: [MessageFlags.Ephemeral],
        });
      } catch (err: any) {
        console.error('❌ Error editando rol:', err);
        return interaction.reply({
          content: `❌ Error al actualizar el rol: ${err.message || err}`,
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    // 3. Cambiar Color del Rol (Sólido, Gradiente, Holográfico)
    if (customId.startsWith('cambiarcolor_modal_color:')) {
      const parts = customId.split(':');
      const style = parts[1];
      const roleId = parts[2];

      const targetRole = interaction.guild.roles.cache.get(roleId);
      if (!targetRole) {
        return interaction.reply({
          content: '❌ El rol no existe en el servidor.',
          flags: [MessageFlags.Ephemeral],
        });
      }

      const primaryHexRaw = interaction.fields.getTextInputValue('primary_hex');
      let secondaryHexRaw: string | null = null;
      let tertiaryHexRaw: string | null = null;

      if (style === 'gradient' || style === 'holographic') {
        secondaryHexRaw = interaction.fields.getTextInputValue('secondary_hex');
      }

      if (style === 'holographic') {
        tertiaryHexRaw = interaction.fields.getTextInputValue('tertiary_hex');
      }

      if (!isValidHex(primaryHexRaw)) {
        return interaction.reply({
          content: `❌ El código hexadecimal primario '${primaryHexRaw}' no es válido. Usa formato '#RRGGBB' o '#RGB'.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (secondaryHexRaw && !isValidHex(secondaryHexRaw)) {
        return interaction.reply({
          content: `❌ El código hexadecimal secundario '${secondaryHexRaw}' no es válido. Usa formato '#RRGGBB' o '#RGB'.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (tertiaryHexRaw && !isValidHex(tertiaryHexRaw)) {
        return interaction.reply({
          content: `❌ El código hexadecimal terciario '${tertiaryHexRaw}' no es válido. Usa formato '#RRGGBB' o '#RGB'.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      const primaryInt = parseHexToInt(primaryHexRaw);
      const secondaryInt = secondaryHexRaw ? parseHexToInt(secondaryHexRaw) : null;
      const tertiaryInt = tertiaryHexRaw ? parseHexToInt(tertiaryHexRaw) : null;

      const primaryFormatted = formatHex(primaryHexRaw);
      const secondaryFormatted = secondaryHexRaw ? formatHex(secondaryHexRaw) : null;
      const tertiaryFormatted = tertiaryHexRaw ? formatHex(tertiaryHexRaw) : null;

      let isEnhancedApplied = true;
      let boostNotice = '';

      try {
        // Enviar color principal en nivel superior y objeto colors para la API de Discord
        const patchBody: any = {
          color: primaryInt,
          colors: {
            primary_color: primaryInt,
            secondary_color: secondaryInt,
            tertiary_color: tertiaryInt,
          },
        };

        await interaction.client.rest.patch(Routes.guildRole(interaction.guild.id, targetRole.id), {
          body: patchBody,
        });
      } catch (err: any) {
        // Si el servidor no tiene desbloqueado el perk de Enhanced Role Styles en Discord (error 670008), fallback a color sólido
        if (err.code === 670008 || err.rawError?.code === 670008 || err.status === 400) {
          try {
            await targetRole.setColor(primaryInt);
            isEnhancedApplied = false;
            boostNotice =
              '\n\n⚠️ *Nota: Se ha aplicado el Color Primario Sólido. Para mostrar los efectos visuales de Gradiente e Holográfico en Discord, el servidor requiere activar las mejoras de Server Boost correspondientes a "Enhanced Role Styles".*';
          } catch (fallbackErr: any) {
            throw fallbackErr;
          }
        } else {
          throw err;
        }
      }

      let styleLabel = 'Color Sólido 🎨';
      let colorsDescription = `• **Primario**: \`${primaryFormatted}\``;

      if (style === 'gradient') {
        styleLabel = isEnhancedApplied ? 'Gradiente 🌈' : 'Color Sólido (Gradiente sin boost)';
        colorsDescription = `• **Primario**: \`${primaryFormatted}\`\n• **Secundario**: \`${secondaryFormatted}\``;
      } else if (style === 'holographic') {
        styleLabel = isEnhancedApplied ? 'Holográfico ✨' : 'Color Sólido (Holográfico sin boost)';
        colorsDescription = `• **Primario**: \`${primaryFormatted}\`\n• **Secundario**: \`${secondaryFormatted}\`\n• **Terciario**: \`${tertiaryFormatted}\``;
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Estilo de Color Aplicado')
        .setDescription(
          `Se ha actualizado el color del rol **${targetRole.name}** correctamente.\n\n` +
            `**Estilo:** ${styleLabel}\n\n` +
            `**Valores Hexadecimales:**\n${colorsDescription}` +
            boostNotice
        )
        .setColor(primaryInt)
        .setTimestamp();

      return interaction.reply({
        embeds: [successEmbed],
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
