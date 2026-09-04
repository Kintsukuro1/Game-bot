import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { activityFeedService } from './services/activityFeedService.js';
import { bigIntJsonReplacer } from './utils/serializer.js';
import { SESSION_JWT_SECRET, AuthenticatedRequest, requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/authRoutes.js';
import { createPlayerRouter } from './routes/playerRoutes.js';
import { createGameRouter } from './routes/gameRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';

dotenv.config();

// Exportaciones para retrocompatibilidad de módulos existentes
export { SESSION_JWT_SECRET, AuthenticatedRequest, requireAuth };

export function createServer() {
  const app = express();

  // Configuración global de Express para serializar valores BigInt automáticamente en res.json()
  app.set('json replacer', bigIntJsonReplacer);

  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);

  // Servidor Socket.io para comunicación en tiempo real
  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
    path: '/socket.io',
  });

  activityFeedService.setSocketServer(io);

  // Middleware de Auth para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Autenticación requerida para WebSocket.'));
    }

    try {
      const decoded = jwt.verify(token, SESSION_JWT_SECRET) as {
        discordId: string;
        guildId: string;
        playerId: string;
      };
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Token WebSocket inválido o expirado.'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`🔌 [Socket.io] Conectado usuario: ${user?.discordId}`);

    if (user?.discordId) {
      socket.join(`user:${user.discordId}`);
    }

    // Unirse a sala de instancia multijugador efímera (instanceId) si se especifica
    socket.on('join_instance', (instanceId: string) => {
      if (instanceId) {
        socket.join(`instance:${instanceId}`);
        console.log(`🏰 [Socket.io] Usuario ${user?.discordId} se unió a la sala instance:${instanceId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Desconectado usuario: ${user?.discordId}`);
    });
  });

  // Reescritura de compatibilidad para /.proxy/api y /api
  const apiRouter = express.Router();

  // Montar routers modulares
  apiRouter.use(authRouter);
  apiRouter.use(createPlayerRouter(io));
  apiRouter.use(createGameRouter(io));
  apiRouter.use(createAdminRouter(io));

  // Registrar sub-router con soporte tanto para /api como /.proxy/api
  app.use('/api', apiRouter);
  app.use('/.proxy/api', apiRouter);

  // Servir el cliente Web / Discord Activity (client/dist)
  const clientDistPath = path.join(process.cwd(), 'client', 'dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.use('/.proxy', express.static(clientDistPath));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/.proxy/api')) {
        return res.sendFile(path.join(clientDistPath, 'index.html'));
      }
      next();
    });
  } else {
    app.get('/', (_req: Request, res: Response) => {
      res.send('⚡ Servidor de Discord Activity & Bot activo. El frontend client/dist aún no ha sido compilado.');
    });
  }

  return { app, server, io };
}
