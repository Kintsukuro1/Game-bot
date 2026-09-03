import { Server as SocketIOServer } from 'socket.io';

export interface ActivityFeedItem {
  id: string;
  type: 'CRIME' | 'CASINO' | 'BOUNTY' | 'TRAIN' | 'HOSPITAL' | 'JAIL' | 'BANK' | 'SYSTEM' | 'LEVEL' | 'MARKET' | 'FACTION';
  tag: string;
  message: string;
  timestamp: string;
  color?: string;
}

class ActivityFeedService {
  private io: SocketIOServer | null = null;
  private buffer: ActivityFeedItem[] = [
    {
      id: 'init-1',
      type: 'SYSTEM',
      tag: '[SISTEMA]',
      message: 'Bienvenido al sector central de Sinford. Red neural y comunicaciones de la ciudad activas.',
      timestamp: new Date().toISOString(),
      color: 'text-cyan-400',
    },
    {
      id: 'init-2',
      type: 'SYSTEM',
      tag: '[ALERTA]',
      message: 'Patrullajes de la policía cibernética incrementados en el Distrito Central.',
      timestamp: new Date().toISOString(),
      color: 'text-amber-400',
    },
    {
      id: 'init-3',
      type: 'MARKET',
      tag: '[MERCADO NEGRO]',
      message: 'El Contrabandista de Muelle 4 ha renovado sus suministros tácticos.',
      timestamp: new Date().toISOString(),
      color: 'text-emerald-400',
    },
  ];

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public logActivity(
    type: ActivityFeedItem['type'],
    tag: string,
    message: string,
    color?: string
  ): ActivityFeedItem {
    const item: ActivityFeedItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      tag,
      message,
      timestamp: new Date().toISOString(),
      color: color || this.getDefaultColor(type),
    };

    this.buffer.unshift(item);
    if (this.buffer.length > 50) {
      this.buffer.pop();
    }

    if (this.io) {
      this.io.emit('global_activity', item);
    }

    return item;
  }

  public getRecentActivities(limit = 25): ActivityFeedItem[] {
    return this.buffer.slice(0, limit);
  }

  private getDefaultColor(type: ActivityFeedItem['type']): string {
    switch (type) {
      case 'CRIME':
        return 'text-amber-400';
      case 'CASINO':
        return 'text-purple-400';
      case 'BOUNTY':
        return 'text-rose-400';
      case 'TRAIN':
        return 'text-emerald-400';
      case 'HOSPITAL':
        return 'text-red-400';
      case 'JAIL':
        return 'text-orange-400';
      case 'BANK':
        return 'text-emerald-400';
      case 'LEVEL':
        return 'text-cyan-400';
      case 'FACTION':
        return 'text-indigo-400';
      case 'MARKET':
        return 'text-cyan-300';
      default:
        return 'text-slate-300';
    }
  }
}

export const activityFeedService = new ActivityFeedService();
