import { prisma } from '../db/prisma.js';

export interface CourseDefinition {
  id: string;
  name: string;
  category: string;
  cost: number;
  durationHours: number;
  bonusDescription: string;
}

export const COURSES: CourseDefinition[] = [
  {
    id: 'BIO101',
    name: 'Introducción a la Biología',
    category: 'Biology',
    cost: 500,
    durationHours: 1,
    bonusDescription: '+10% curación de botiquines médicos y menor tiempo de hospital.',
  },
  {
    id: 'LAW101',
    name: 'Derecho Comunitario (Common Law)',
    category: 'Law',
    cost: 1000,
    durationHours: 2,
    bonusDescription: 'Descuento del 20% en costos de fianza (Bail) y permiso para comprar libertad.',
  },
  {
    id: 'BUS101',
    name: 'Gestión Comercial (Business Mgmt)',
    category: 'Business',
    cost: 1500,
    durationHours: 3,
    bonusDescription: '+10% ganancias en salario de trabajo e interés bancario.',
  },
  {
    id: 'COMBAT101',
    name: 'Tácticas de Combate Urbano',
    category: 'Combat',
    cost: 2500,
    durationHours: 4,
    bonusDescription: '+5% daño extra con armas de fuego y cuerpo a cuerpo.',
  },
];

export class EducationService {
  static async enrollCourse(playerId: string, courseId: string) {
    const course = COURSES.find((c) => c.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');

    return prisma.$transaction(async (tx) => {
      const activeCourse = await tx.playerEducation.findFirst({
        where: { playerId, isCompleted: false },
      });

      if (activeCourse) {
        throw new Error(' Ya estás inscrito en un curso. Espera a finalizarlo para iniciar otro.');
      }

      const completed = await tx.playerEducation.findFirst({
        where: { playerId, courseId, isCompleted: true },
      });

      if (completed) {
        throw new Error(' Ya has completado este curso anteriormente.');
      }

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet || wallet.cash < BigInt(course.cost)) {
        throw new Error(`Efectivo insuficiente. La matrícula cuesta **$${course.cost.toLocaleString()}**.`);
      }

      const balanceBefore = wallet.cash;
      const balanceAfter = wallet.cash - BigInt(course.cost);

      await tx.wallet.update({
        where: { playerId },
        data: { cash: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          playerId,
          amount: -BigInt(course.cost),
          balanceBefore,
          balanceAfter,
          type: 'EDUCATION_FEE',
          source: 'UNIVERSITY',
          metadata: JSON.stringify({ courseId: course.id, courseName: course.name }),
        },
      });

      const completesAt = new Date(Date.now() + course.durationHours * 60 * 60 * 1000);
      const enrollment = await tx.playerEducation.create({
        data: {
          playerId,
          courseId,
          completesAt,
        },
      });

      return { courseName: course.name, durationHours: course.durationHours, completesAt };
    });
  }

  static async getActiveCourse(playerId: string) {
    const now = new Date();
    const active = await prisma.playerEducation.findFirst({
      where: { playerId, isCompleted: false },
    });

    if (!active) return null;

    if (active.completesAt <= now) {
      // Finalizar curso automáticamente
      await prisma.playerEducation.update({
        where: { id: active.id },
        data: { isCompleted: true },
      });
      return { ...active, isCompleted: true, justFinished: true };
    }

    return active;
  }
}
