import express, { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { PlayerService } from '../services/playerService.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { serializeBigInt } from '../utils/serializer.js';

export function createAdminRouter(io: SocketIOServer) {
  const adminRouter = express.Router();

  const AUTHORIZED_ADMIN_DISCORD_ID = '287396390747766795';

  const requireAdminGuard = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.discordId !== AUTHORIZED_ADMIN_DISCORD_ID) {
      return res.status(403).json({ error: '🔒 Acceso denegado: Se requiere autorización de Desarrollador Principal.' });
    }
    next();
  };

  adminRouter.post('/admin/give-cash', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId, amount = '1000000' } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      await prisma.wallet.update({
        where: { playerId: target.id },
        data: { cash: { increment: BigInt(amount) } },
      });

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ message: `Se otorgaron $${BigInt(amount).toLocaleString()} a ${target.username}.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error en comando de administración.' });
    }
  });

  adminRouter.post('/admin/reset-energy', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      const stats = await prisma.stats.findUnique({ where: { playerId: target.id } });
      if (stats) {
        await prisma.stats.update({
          where: { playerId: target.id },
          data: { energy: stats.maxEnergy },
        });
      }

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ message: `Energía de ${target.username} restaurada al 100%.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al restaurar energía.' });
    }
  });

  adminRouter.post('/admin/set-level', requireAuth, requireAdminGuard, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetDiscordId, level = 10 } = req.body;
      const { guildId } = req.user!;
      const target = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      if (!target) return res.status(404).json({ error: 'Jugador objetivo no encontrado.' });

      await prisma.player.update({
        where: { id: target.id },
        data: { level: Number(level) },
      });

      const updatedPlayer = await PlayerService.getPlayerByDiscordId(targetDiscordId, guildId);
      io.to(`user:${targetDiscordId}`).emit('player_stats_updated', serializeBigInt(updatedPlayer));

      return res.json({ message: `Nivel de ${target.username} actualizado a Nivel ${level}.` });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || 'Error al fijar nivel.' });
    }
  });

  return adminRouter;
}
