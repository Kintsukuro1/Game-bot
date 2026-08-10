import cron from 'node-cron';
import { PlayerService } from './playerService.js';

export function startScheduler() {
  console.log('⏰ Iniciando Scheduler de regeneración de energía/nerve (Cada 5 minutos)...');

  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', async () => {
    try {
      await PlayerService.regenerateStats();
      console.log('⚡ [Scheduler] Regeneración de Energía y Nerve completada.');
    } catch (error) {
      console.error('❌ [Scheduler Error]:', error);
    }
  });
}
