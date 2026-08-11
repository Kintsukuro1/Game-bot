import { prisma } from '../db/prisma.js';

export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  baseSalary: number;
  reqLabor: number;
  reqIntel: number;
  reqEndurance: number;
}

export const JOBS: JobDefinition[] = [
  {
    id: 'GROCER',
    name: 'Abarrotes & Comercio (Grocer)',
    description: 'Trabajo inicial en el supermercado de la ciudad. Requiere Fuerza Manual.',
    baseSalary: 250,
    reqLabor: 1.0,
    reqIntel: 1.0,
    reqEndurance: 1.0,
  },
  {
    id: 'CASINO',
    name: 'Casino de Sinford',
    description: 'Trabaja como croupier o seguridad en el casino. Requiere Inteligencia y Resistencia.',
    baseSalary: 600,
    reqLabor: 2.0,
    reqIntel: 5.0,
    reqEndurance: 3.0,
  },
  {
    id: 'MEDICAL',
    name: 'Hospital Central (Medical)',
    description: 'Asistente médico y enfermería. Requiere alta Inteligencia.',
    baseSalary: 1200,
    reqLabor: 2.0,
    reqIntel: 10.0,
    reqEndurance: 5.0,
  },
];

export class JobService {
  static async applyJob(playerId: string, jobId: string) {
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) throw new Error('Trabajo no encontrado.');

    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true },
      });

      if (!player || !player.stats) throw new Error('Jugador no encontrado.');

      // Validar requisitos de Working Stats
      if (
        player.stats.manualLabor < job.reqLabor ||
        player.stats.intelligence < job.reqIntel ||
        player.stats.endurance < job.reqEndurance
      ) {
        throw new Error(`🔒 Requisitos de Working Stats no cumplidos para **${job.name}**:\n• Fuerza Manual: ${player.stats.manualLabor.toFixed(1)}/${job.reqLabor}\n• Inteligencia: ${player.stats.intelligence.toFixed(1)}/${job.reqIntel}\n• Resistencia: ${player.stats.endurance.toFixed(1)}/${job.reqEndurance}`);
      }

      const existingJob = await tx.playerJob.findUnique({ where: { playerId } });
      if (existingJob) {
        await tx.playerJob.update({
          where: { playerId },
          data: { jobId, rank: 1, lastPaidAt: new Date() },
        });
      } else {
        await tx.playerJob.create({
          data: { playerId, jobId, rank: 1 },
        });
      }

      return { jobName: job.name, salary: job.baseSalary };
    });
  }

  static async collectSalary(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const playerJob = await tx.playerJob.findUnique({ where: { playerId } });
      if (!playerJob) throw new Error('No tienes un trabajo activo. Aplica a uno primero.');

      const job = JOBS.find((j) => j.id === playerJob.jobId);
      if (!job) throw new Error('Trabajo no encontrado.');

      const now = new Date();
      const hoursSincePaid = (now.getTime() - new Date(playerJob.lastPaidAt).getTime()) / (1000 * 60 * 60);

      if (hoursSincePaid < 24) {
        const hoursLeft = Math.ceil(24 - hoursSincePaid);
        throw new Error(`⏳ Ya cobraste tu salario diario. Siguiente cobro disponible en **${hoursLeft} horas**.`);
      }

      const salary = BigInt(job.baseSalary * playerJob.rank);
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash + salary;

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { increment: salary } },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: salary,
          balanceBefore,
          balanceAfter,
          type: 'JOB_SALARY',
          source: 'JOB_SYSTEM',
          metadata: JSON.stringify({ jobId: job.id, rank: playerJob.rank }),
        },
      });

      // Aumentar Working Stats y Job Points
      const playerStats = await tx.stats.findUnique({ where: { playerId } });
      if (playerStats) {
        await tx.stats.update({
          where: { playerId },
          data: {
            manualLabor: playerStats.manualLabor + 0.5,
            intelligence: playerStats.intelligence + 0.5,
            endurance: playerStats.endurance + 0.5,
          },
        });
      }

      await tx.playerJob.update({
        where: { playerId },
        data: {
          jobPoints: playerJob.jobPoints + 5,
          lastPaidAt: now,
        },
      });

      return { salary, jobName: job.name, jobPointsGained: 5 };
    });
  }
}
