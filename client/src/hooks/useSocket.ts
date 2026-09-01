import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(sessionJwt: string | null, instanceId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionJwt) return;

    console.log('⚡ Conectando Socket.io con Heartbeat & Backoff exponential...');

    const socketInstance = io({
      path: '/socket.io',
      auth: { token: sessionJwt },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('🌐 Socket.io conectado exitosamente.');
      setIsConnected(true);

      if (instanceId) {
        socketInstance.emit('join_instance', instanceId);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn(`⚠️ Socket.io desconectado. Razón: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Error de conexión Socket.io:', err.message);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [sessionJwt, instanceId]);

  return {
    socket,
    isConnected,
  };
}
