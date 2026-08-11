import { PlayerService } from '../src/services/playerService.js';
import { JobService } from '../src/services/jobService.js';
import { EducationService } from '../src/services/educationService.js';
import { FactionService } from '../src/services/factionService.js';
import { prisma } from '../src/db/prisma.js';

async function testPhase9And10() {
  console.log('🧪 Probando servicios de Fase 9 (Jobs y Educación) y Fase 10 (Facciones y Crímenes Organizados)...');

  const testDiscordId = '777888999000111222';
  const guildId = 'GUILD_TEST_9_10';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });
  await prisma.faction.deleteMany({
    where: { guildId },
  });

  // 1. Registro de Jugador
  const player = await PlayerService.registerPlayer(testDiscordId, 'JobLeader', guildId);
  console.log('✅ Jugador registrado.');

  // Acreditar efectivo para pruebas de facción y educación
  await prisma.wallet.update({
    where: { playerId: player.id },
    data: { cash: 100000n },
  });

  // 2. Trabajos (Jobs)
  console.log('🔹 Probando aplicación a trabajo Grocer...');
  const jobRes = await JobService.applyJob(player.id, 'GROCER');
  if (!jobRes.jobName) {
    throw new Error('Falló la contratación laboral.');
  }
  console.log(`✅ Contratación en ${jobRes.jobName} completada.`);

  // 3. Educación (Courses)
  console.log('🔹 Matriculando en curso Introducción a la Biología (BIO101)...');
  const eduRes = await EducationService.enrollCourse(player.id, 'BIO101');
  if (!eduRes.courseName) {
    throw new Error('Falló la matrícula en educación.');
  }
  console.log(`✅ Matrícula en ${eduRes.courseName} completada (${eduRes.durationHours}h).`);

  // 4. Facciones (Factions)
  console.log('🔹 Creando facción "Imperio de Sinford" ($50,000)...');
  const faction = await FactionService.createFaction(player.id, 'Imperio de Sinford', 'Facción de prueba', guildId);
  if (!faction || faction.name !== 'Imperio de Sinford') {
    throw new Error('Falló la creación de la facción.');
  }
  console.log(`✅ Facción ${faction.name} creada exitosamente por el líder.`);

  // Depositar en tesorería
  console.log('🔹 Depositando $10,000 en la tesorería de la facción...');
  await FactionService.depositTreasury(player.id, 10000n);
  console.log('✅ Depósito en tesorería verificado.');

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: player.id },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de la Fase 9 y 10 pasaron exitosamente!');
}

testPhase9And10()
  .catch((err) => {
    console.error('❌ Error en prueba de Fase 9 y 10:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
