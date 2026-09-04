import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '../db/prisma.js';
import { PlayerService } from '../services/playerService.js';
import { SESSION_JWT_SECRET } from '../middleware/auth.js';

dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export const authRouter = express.Router();

export function checkModuleLevel(res: Response, playerLevel: number, requiredLevel: number, moduleName: string): boolean {
  if (playerLevel < requiredLevel) {
    res.status(403).json({
      error: `🔒 Acceso restringido: El módulo ${moduleName} requiere Nivel ${requiredLevel} (Tu nivel actual: Nivel ${playerLevel}).`,
    });
    return false;
  }
  return true;
}

// 1. Intercambio de OAuth2 code por access_token de Discord y emisión de JWT propio
authRouter.post('/auth/token', async (req: Request, res: Response) => {
  try {
    console.log('📩 [Backend Auth] Recibida petición en /api/auth/token:', req.body);
    const { code, guildId = 'GLOBAL' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Falta parámetro "code".' });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Credenciales de Discord no configuradas en el servidor.' });
    }

    // Intercambiar code con Discord OAuth2 API
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    });

    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Error OAuth2 Discord:', errorData);
      return res.status(400).json({ error: 'Error al intercambiar código OAuth2 con Discord.' });
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Validar usuario consultando /users/@me (1 sola vez)
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: 'No se pudo obtener información del usuario desde Discord.' });
    }

    const userData = (await userResponse.json()) as {
      id: string;
      username: string;
      global_name?: string;
    };

    // Registrar o recuperar jugador en la base de datos
    const player = await PlayerService.registerPlayer(
      userData.id,
      userData.global_name || userData.username,
      guildId
    );

    // Persistir el refresh_token de Discord en PostgreSQL
    await prisma.player.update({
      where: { id: player.id },
      data: { discordRefreshToken: tokenData.refresh_token },
    });

    // Emitir Session JWT propio de 15 minutos
    const sessionJwt = jwt.sign(
      {
        discordId: userData.id,
        guildId: player.guildId,
        playerId: player.id,
      },
      SESSION_JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      access_token: tokenData.access_token,
      token: sessionJwt,
      user: {
        id: player.id,
        discordId: userData.id,
        username: player.username,
      },
    });
  } catch (error: any) {
    console.error('❌ Error en /api/auth/token:', error);
    return res.status(500).json({ error: 'Error interno del servidor en autenticación.' });
  }
});

// 2. Renovación de JWT expirado usando el refresh_token guardado en DB
authRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Se requiere token actual en Authorization header.' });
    }

    const currentJwt = authHeader.split(' ')[1];
    let decoded: any;

    try {
      // Ignorar expiración para leer el discordId del JWT de 15m vencido
      decoded = jwt.verify(currentJwt, SESSION_JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(401).json({ error: 'Firma de token inválida.' });
    }

    const discordId = decoded?.discordId;
    if (!discordId) {
      return res.status(401).json({ error: 'Payload de token no válido.' });
    }

    // Buscar el refresh_token persistido en PostgreSQL
    const player = await prisma.player.findFirst({
      where: { discordId },
    });

    if (!player || !player.discordRefreshToken) {
      return res.status(401).json({ error: 'No existe refresh token guardado para este usuario.' });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Credenciales de Discord no configuradas.' });
    }

    // Intercambiar refresh_token con Discord OAuth2 API
    const refreshParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: player.discordRefreshToken,
    });

    const refreshResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: refreshParams.toString(),
    });

    if (!refreshResponse.ok) {
      return res.status(401).json({ error: 'El refresh token de Discord ha sido revocado o ha expirado.' });
    }

    const refreshData = (await refreshResponse.json()) as {
      access_token: string;
      refresh_token: string;
    };

    // Actualizar el refresh_token en PostgreSQL si rotó
    if (refreshData.refresh_token) {
      await prisma.player.update({
        where: { id: player.id },
        data: { discordRefreshToken: refreshData.refresh_token },
      });
    }

    // Reemitir nuevo Session JWT propio por 15 minutos
    const newSessionJwt = jwt.sign(
      {
        discordId: player.discordId,
        guildId: player.guildId,
        playerId: player.id,
      },
      SESSION_JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      access_token: refreshData.access_token,
      token: newSessionJwt,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/auth/refresh:', error);
    return res.status(500).json({ error: 'Error interno al renovar credenciales.' });
  }
});
