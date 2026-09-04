import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const SESSION_JWT_SECRET = process.env.SESSION_JWT_SECRET || 'super_secret_jwt_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: {
    discordId: string;
    guildId: string;
    playerId: string;
  };
}

// Middleware de autenticación Stateless por JWT
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó token de autorización.' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'DEV_MOCK_JWT_TOKEN') {
    req.user = {
      discordId: '1364741760055775262',
      guildId: 'GLOBAL',
      playerId: 'dev-1',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, SESSION_JWT_SECRET) as {
      discordId: string;
      guildId: string;
      playerId: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado. Solicita renovación vía /api/auth/refresh.' });
  }
}
