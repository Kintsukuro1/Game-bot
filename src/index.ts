import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { handleInteraction } from './events/interactionCreate.js';
import { startScheduler } from './services/scheduler.js';
import { empezarCommand } from './commands/general/empezar.js';
import { gameCommand } from './commands/general/game.js';
import { atacarCommand } from './commands/general/atacar.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || token === 'your_bot_token_here') {
  console.warn('⚠️ Token de Discord no configurado en .env. Modifica el archivo .env con tus credenciales.');
}

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`🤖 Bot iniciado con éxito como: ${client.user?.tag}`);

  // Register Slash Commands globally or per guild
  if (token && clientId && clientId !== 'your_client_id_here') {
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      const commandList = [
        empezarCommand.data.toJSON(),
        gameCommand.data.toJSON(),
        atacarCommand.data.toJSON(),
      ];

      console.log('🔄 Registrando comandos Slash (/empezar, /game, /atacar) en Discord REST API...');
      await rest.put(Routes.applicationCommands(clientId), { body: commandList });
      console.log('✅ Comandos Slash registrados correctamente.');
    } catch (error) {
      console.error('❌ Error registrando comandos Slash:', error);
    }
  }

  // Start background scheduler
  startScheduler();
});

client.on('interactionCreate', handleInteraction);

if (token && token !== 'your_bot_token_here') {
  client.login(token).catch((err) => {
    console.error('❌ Error de login en Discord:', err.message);
  });
} else {
  console.log('ℹ️ Modo sin conexión de Discord (Para pruebas locales de BD/Servicios).');
}
