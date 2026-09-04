import { prisma } from '../db/prisma.js';
import { CourseDefinition, COURSES } from '../config/gameData.js';
export { CourseDefinition, COURSES };

export class EducationService {
  static async enrollCourse(playerId: string, courseId: string) {
    const course = COURSES.find((c) => c.id === courseId);
    if (!course) throw new Error('Curso no encontrado.');

    return prisma.$transaction(async (tx) => {
      // 1. Verificar si ya está realizando un curso
      const activeCourse = await tx.playerEducation.findFirst({
        where: { playerId, isCompleted: false },
      });

      if (activeCourse) {
        throw new Error('Ya estás inscrito en un curso. Espera a finalizarlo para iniciar otro.');
      }

      // 2. Verificar si ya completó este curso
      const completed = await tx.playerEducation.findFirst({
        where: { playerId, courseId, isCompleted: true },
      });

      if (completed) {
        throw new Error('Ya has completado este curso anteriormente.');
      }

      // 3. Verificar prerrequisitos (si aplica)
      if (course.prerequisiteId) {
        const prereqCompleted = await tx.playerEducation.findFirst({
          where: { playerId, courseId: course.prerequisiteId, isCompleted: true },
        });

        if (!prereqCompleted) {
          const prereqCourse = COURSES.find((c) => c.id === course.prerequisiteId);
          throw new Error(
            `Requieres haber completado primero el curso previo: **${prereqCourse?.name || course.prerequisiteId}**.`
          );
        }
      }

      // 4. Cobro de matrícula
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
      const course = COURSES.find((c) => c.id === active.courseId);

      // Finalizar curso en la base de datos
      await prisma.playerEducation.update({
        where: { id: active.id },
        data: { isCompleted: true },
      });

      // Otorgar aumentos permanentes de estadísticas si el curso los define
      if (course?.statBonus) {
        const statData: any = {};
        if (course.statBonus.intelligence) statData.intelligence = { increment: course.statBonus.intelligence };
        if (course.statBonus.endurance) statData.endurance = { increment: course.statBonus.endurance };
        if (course.statBonus.manualLabor) statData.manualLabor = { increment: course.statBonus.manualLabor };
        if (course.statBonus.crimeSkill) statData.crimeSkill = { increment: course.statBonus.crimeSkill };
        if (course.statBonus.strength) statData.strength = { increment: course.statBonus.strength };

        if (Object.keys(statData).length > 0) {
          await prisma.stats.update({
            where: { playerId },
            data: statData,
          });
        }
      }

      return { ...active, isCompleted: true, justFinished: true, courseName: course?.name };
    }

    return active;
  }

  // Obtener lista de cursos completados por un jugador
  static async getCompletedCourses(playerId: string) {
    const completedRecords = await prisma.playerEducation.findMany({
      where: { playerId, isCompleted: true },
    });

    const completedIds = new Set(completedRecords.map((r) => r.courseId));
    return COURSES.filter((c) => completedIds.has(c.id));
  }

  // Obtener todos los modificadores pasivos acumulados de cursos completados
  static async getEducationModifiers(playerId: string) {
    const completedCourses = await this.getCompletedCourses(playerId);

    const perks = completedCourses
      .map((c) => c.passivePerk)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    return {
      healingBoost: perks.filter((p) => p.type === 'HEALING_BOOST').reduce((acc, p) => acc + p.value, 0),
      hospitalReduction: perks.filter((p) => p.type === 'HOSPITAL_REDUCTION').reduce((acc, p) => acc + p.value, 0),
      healthCapBoost: perks.filter((p) => p.type === 'HEALTH_CAP').reduce((acc, p) => acc + p.value, 0),
      bailDiscount: perks.filter((p) => p.type === 'BAIL_DISCOUNT').reduce((acc, p) => acc + p.value, 0),
      bustSuccessBoost: perks.filter((p) => p.type === 'BUST_SUCCESS').reduce((acc, p) => acc + p.value, 0),
      salaryBoost: perks.filter((p) => p.type === 'SALARY_BOOST').reduce((acc, p) => acc + p.value, 0),
      stockDividendBoost: perks.filter((p) => p.type === 'STOCK_DIVIDEND').reduce((acc, p) => acc + p.value, 0),
      bankInterestBoost: perks.filter((p) => p.type === 'BANK_INTEREST_BOOST').reduce((acc, p) => acc + p.value, 0),
      combatAccuracyBoost: perks.filter((p) => p.type === 'COMBAT_ACCURACY').reduce((acc, p) => acc + p.value, 0),
      combatCritBoost: perks.filter((p) => p.type === 'COMBAT_CRIT').reduce((acc, p) => acc + p.value, 0),
      bossDamageBoost: perks.filter((p) => p.type === 'BOSS_DAMAGE').reduce((acc, p) => acc + p.value, 0),
      cyberExpBoost: perks.filter((p) => p.type === 'CYBER_EXP').reduce((acc, p) => acc + p.value, 0),
      cyberStealBoost: perks.filter((p) => p.type === 'CYBER_STEAL').reduce((acc, p) => acc + p.value, 0),
      hackNerveReduction: perks.filter((p) => p.type === 'HACK_NERVE_REDUCTION').reduce((acc, p) => acc + p.value, 0),
    };
  }
}
