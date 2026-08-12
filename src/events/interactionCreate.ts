import { Interaction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { resolveHandler } from '../handlers/registry.js';
import { empezarCommand } from '../commands/general/empezar.js';
import { gameCommand } from '../commands/general/game.js';
import { atacarCommand } from '../commands/general/atacar.js';
import { adminCommand } from '../commands/general/admin.js';
import { profileCommand } from '../commands/general/profile.js';

const commands = new Map<string, any>([
  [empezarCommand.data.name, empezarCommand],
  [gameCommand.data.name, gameCommand],
  [atacarCommand.data.name, atacarCommand],
  [adminCommand.data.name, adminCommand],
  [profileCommand.data.name, profileCommand],
]);

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    // 1. Manejador de Comandos Slash (/empezar, /game, /atacar, /admin, /profile)
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
      return;
    }

    // 2. Manejador de Botones y Menús de Selección
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const guildId = interaction.guildId || 'GLOBAL';
      const discordId = interaction.user.id;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        await interaction.reply({
          content: '❌ Necesitas registrarte primero en este servidor usando el comando `/empezar`.',
          ephemeral: true,
        });
        return;
      }

      const handler = resolveHandler(interaction.customId);
      if (handler) {
        await handler(interaction, player, guildId);
      } else {
        console.warn(`⚠️ No handler found for customId: ${interaction.customId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error manejando interacción:', error);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: '🚨 Ocurrió un error al procesar la interacción.',
        ephemeral: true,
      }).catch(() => {});
    }
  }
}
