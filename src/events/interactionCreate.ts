import { Interaction } from 'discord.js';
import { empezarCommand } from '../commands/general/empezar.js';
import { gameCommand } from '../commands/general/game.js';
import { atacarCommand } from '../commands/general/atacar.js';
import { adminCommand } from '../commands/general/admin.js';
import { profileCommand } from '../commands/general/profile.js';
import { empresaCommand } from '../commands/general/empresa.js';
import { dueloCommand } from '../commands/general/duelo.js';

const commands = new Map<string, any>([
  [empezarCommand.data.name, empezarCommand],
  [gameCommand.data.name, gameCommand],
  [atacarCommand.data.name, atacarCommand],
  [adminCommand.data.name, adminCommand],
  [profileCommand.data.name, profileCommand],
  [empresaCommand.data.name, empresaCommand],
  [dueloCommand.data.name, dueloCommand],
]);

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
      return;
    }

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await interaction.reply({
        content: '📱 **Sinford Underworld Web App**: Abre la aplicación Discord Activity desde el botón superior para disfrutar de la experiencia gráfica interactiva completada.',
        ephemeral: true,
      }).catch(() => {});
    }
  } catch (error) {
    console.error('❌ Error manejando interacción:', error);
  }
}
