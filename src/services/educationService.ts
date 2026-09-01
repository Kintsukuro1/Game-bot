import { prisma } from '../db/prisma.js';
import { CourseDefinition, COURSES } from '../config/gameData.js';
export { CourseDefinition, COURSES };

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
