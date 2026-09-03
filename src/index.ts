import { Client, Events, GatewayIntentBits, REST, Routes, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { handleInteraction } from './events/interactionCreate.js';
import { startScheduler } from './services/scheduler.js';
import { createServer } from './server.js';
import { empezarCommand } from './commands/general/empezar.js';
import { gameCommand } from './commands/general/game.js';
import { atacarCommand } from './commands/general/atacar.js';
import { adminCommand } from './commands/general/admin.js';
import { profileCommand } from './commands/general/profile.js';
import { empresaCommand } from './commands/general/empresa.js';
import { dueloCommand } from './commands/general/duelo.js';
import { cambiarColorCommand } from './commands/general/cambiarcolor.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const PORT = process.env.PORT || 3000;

// Iniciar Servidor Express API + WebSockets para la Discord Activity
const { server } = createServer();
server.listen(PORT, () => {
  console.log(`🌐 [Activity API] Servidor Express & WebSockets escuchando en el puerto ${PORT}`);
  console.log(`📡 API Endpoints listos en http://localhost:${PORT}/api/ e en /.proxy/api/`);
});

if (!token || token === 'your_bot_token_here') {
  console.warn('⚠️ Token de Discord no configurado en .env. Modifica el archivo .env con tus credenciales.');
}

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
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
        profileCommand.data.toJSON(),
        empresaCommand.data.toJSON(),
        dueloCommand.data.toJSON(),
        cambiarColorCommand.data.toJSON(),
      ];

      console.log(`🔄 [Global Sync] Sincronizando ${commandList.length} comandos Slash globales...`);
      try {
        const existingGlobal = (await rest.get(Routes.applicationCommands(botClientId))) as any[];
        const entryPointCmds = existingGlobal.filter((cmd) => cmd.type === 4);
        const fullGlobalList = [...commandList, ...entryPointCmds];
        await rest.put(Routes.applicationCommands(botClientId), { body: fullGlobalList });
        console.log(`🌐 [Global Sync] ¡Comandos registrados globalmente con éxito!`);
      } catch (err: any) {
        await rest.put(Routes.applicationCommands(botClientId), { body: commandList }).catch(() => {});
      }

      // Sincronización INSTANTÁNEA en los servidores donde está presente el bot
      for (const [guildId, guild] of client.guilds.cache) {
        console.log(`⚡ [Instant Guild Sync] Sincronizando comandos en el servidor: ${guild.name} (${guildId})...`);
        try {
          const existingGuild = (await rest.get(Routes.applicationGuildCommands(botClientId, guildId))) as any[];
          const guildEntryPoints = existingGuild.filter((cmd) => cmd.type === 4);
          const fullGuildList = [...commandList, ...guildEntryPoints];
          await rest.put(Routes.applicationGuildCommands(botClientId, guildId), { body: fullGuildList });
        } catch (err: any) {
          await rest.put(Routes.applicationGuildCommands(botClientId, guildId), { body: commandList }).catch(() => {});
        }
      }
      console.log(`✅ [Instant Guild Sync] ¡Comandos desplegados al instante!`);
    } catch (error: any) {
      console.error('❌ Error en la sincronización de comandos Slash:', error?.message || error);
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
  console.log('ℹ️ Modo sin conexión de Discord (Servidor API Express + Servicios BD activos en puerto ' + PORT + ').');
}

