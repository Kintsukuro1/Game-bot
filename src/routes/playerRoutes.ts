import express, { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { PlayerService } from '../services/playerService.js';
import { MissionService } from '../services/missionService.js';
import { activityFeedService } from '../services/activityFeedService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { serializeBigInt } from '../utils/serializer.js';

export function createPlayerRouter(io: SocketIOServer) {
  const playerRouter = express.Router();

  // Feed de Actividad del Distrito
  playerRouter.get('/activity/recent', (_req: Request, res: Response) => {
    return res.json({ activities: activityFeedService.getRecentActivities(25) });
  });

  // Perfil del jugador y Salud Corporal
  playerRouter.get('/player/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      return res.json({ player });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener perfil del jugador.' });
    }
  });

  // Inventario
  playerRouter.get('/inventory', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) {
        return res.status(404).json({ error: 'Jugador no encontrado.' });
      }

      const inventory = await prisma.inventoryItem.findMany({
        where: { playerId: player.id },
        include: { item: true },
      });

      return res.json({ inventory });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener inventario.' });
    }
  });

  // Usar Objeto del Inventario
  playerRouter.post('/inventory/use', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordId, guildId } = req.user!;
      const { itemId } = req.body;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

      const invItem = await prisma.inventoryItem.findFirst({
        where: { playerId: player.id, itemId },
        include: { item: true },
      });

      if (!invItem || invItem.quantity <= 0) {
        return res.status(400).json({ error: 'No posees este objeto en tu inventario.' });
      }

      if (invItem.quantity === 1) {
        await prisma.inventoryItem.delete({ where: { id: invItem.id } });
      } else {
        await prisma.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: invItem.quantity - 1 },
        });
      }

      // Avanzar misión diaria de ítems
      await MissionService.progressMission(player.id, 'ITEMS', 1);

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
      io.to(`user:${discordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ success: true, item: invItem.item, player: updatedPlayer });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al usar objeto.' });
    }
  });

  return playerRouter;
}
