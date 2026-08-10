import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { handleInteraction } from './events/interactionCreate.js';
import { startScheduler } from './services/scheduler.js';
import { empezarCommand } from './commands/general/empezar.js';
import { gameCommand } from './commands/general/game.js';
import { atacarCommand } from './commands/general/atacar.js';
import { adminCommand } from './commands/general/admin.js';

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

  // Usar siempre el ID real autenticado de la aplicación del bot
  const botClientId = client.user?.id || clientId;

  if (token && botClientId && botClientId !== 'your_client_id_here') {
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      const commandList = [
        empezarCommand.data.toJSON(),
        gameCommand.data.toJSON(),
        atacarCommand.data.toJSON(),
        adminCommand.data.toJSON(),
      ];

      console.log(`🔄 [Global Sync] Sincronizando ${commandList.length} comandos Slash globales (/empezar, /game, /atacar, /admin)...`);
      await rest.put(Routes.applicationCommands(botClientId), { body: commandList });
      console.log(`🌐 [Global Sync] ¡Comandos Slash sincronizados globalmente con éxito en todos los servidores!`);
    } catch (error: any) {
      console.error('❌ Error en la sincronización global de comandos Slash:', error?.message || error);
    }
  }

  // Iniciar temporizadores de fondo (Regeneración de energía, etc.)
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
