import { PlayerService } from '../src/services/playerService.js';
import { EducationService } from '../src/services/educationService.js';
import { CrimeService } from '../src/services/crimeService.js';
import { prisma } from '../src/db/prisma.js';

async function testEducationEngineIntegration() {
  console.log('🧪 Probando Universidad Central de Sinford (Prerrequisitos, Stats Permanentes y Pasivas de Motor)...');

  const testDiscordId = '888777666555444333';

  // Cleanup previo
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });

  // 1. Registrar Jugador de Prueba
  const player = await PlayerService.registerPlayer(testDiscordId, 'UniversityStudent');
  console.log('✅ Jugador de prueba registrado.');

  // Asignar efectivo para matrículas
  await prisma.wallet.update({
    where: { playerId: player.id },
    data: { cash: 50000n },
  });

  // 2. Probar bloqueo por prerrequisito (intentar enroll en BIO201 sin BIO101)
  console.log('🔹 Probando validación de prerrequisito (BIO201 sin BIO101)...');
  try {
    await EducationService.enrollCourse(player.id, 'BIO201');
    throw new Error('Debió fallar por falta de prerrequisito BIO101.');
  } catch (err: any) {
    if (err.message.includes('BIO101') || err.message.includes('Introducción a la Biología')) {
      console.log('✅ Bloqueo por prerrequisito funcionando correctamente.');
    } else {
      throw err;
    }
  }

  // 3. Matricularse en BIO101
  console.log('🔹 Matriculándose en BIO101...');
  const enrollRes = await EducationService.enrollCourse(player.id, 'BIO101');
  console.log(`✅ Matriculado en ${enrollRes.courseName}. Completa a las ${enrollRes.completesAt}.`);

  // 4. Simular finalización de tiempo y entrega de Stats permanentes
  console.log('🔹 Simulando finalización de BIO101...');
  await prisma.playerEducation.updateMany({
    where: { playerId: player.id, courseId: 'BIO101' },
    data: { completesAt: new Date(Date.now() - 1000) },
  });

  const activeRes = await EducationService.getActiveCourse(player.id);
  if (!activeRes?.justFinished) {
    throw new Error('El curso debió marcarse como justo finalizado.');
  }
  console.log('✅ Curso BIO101 finalizado exitosamente.');

  // Verificar incremento de stat Inteligencia (+5)
  const updatedStats = await prisma.stats.findUnique({ where: { playerId: player.id } });
  console.log(`✅ Stat de Inteligencia post-graduación: ${updatedStats?.intelligence} (Base inicial era 1.0).`);
  if ((updatedStats?.intelligence || 0) < 6.0) {
    throw new Error('El incremento permanente de estadística no se aplicó.');
  }

  // 5. Matricularse en LAW101 para probar pasiva de descuento de fianza
  console.log('🔹 Matriculándose en LAW101...');
  await EducationService.enrollCourse(player.id, 'LAW101');
  await prisma.playerEducation.updateMany({
    where: { playerId: player.id, courseId: 'LAW101' },
    data: { completesAt: new Date(Date.now() - 1000) },
  });
  await EducationService.getActiveCourse(player.id);

  // 6. Verificar Modificadores Pasivos
  const modifiers = await EducationService.getEducationModifiers(player.id);
  console.log(`✅ Pasivas activas detectadas: HealingBoost=${modifiers.healingBoost * 100}%, BailDiscount=${modifiers.bailDiscount * 100}%.`);
  if (modifiers.healingBoost !== 0.10 || modifiers.bailDiscount !== 0.20) {
    throw new Error('Los modificadores pasivos acumulados no coinciden con los cursos completados.');
  }

  // 7. Probar descuento de fianza en CrimeService.payBail
  console.log('🔹 Probando descuento pasivo del 20% en fianza de prisión...');
  // Crear prisionero ficticio
  const jailedDiscordId = '111222333444555666';
  await prisma.player.deleteMany({ where: { discordId: jailedDiscordId } });
  const jailedPlayer = await PlayerService.registerPlayer(jailedDiscordId, 'JailedDummy');
  await prisma.player.update({
    where: { id: jailedPlayer.id },
    data: { jailUntil: new Date(Date.now() + 60 * 60 * 1000) }, // 60 mins
  });

  const bailRes = await CrimeService.payBail(player.id, jailedPlayer.id);
  // Costo base = 100 * 60 * 1 = $6,000. Con 20% descuento LAW101 = $4,800.
  console.log(`✅ Fianza pagada con descuento universitario: $${bailRes.bailCostAmount.toLocaleString()} (Costo base sin título: $6,000).`);
  if (bailRes.bailCostAmount !== 4800n) {
    throw new Error(`El descuento de fianza no se aplicó correctamente. Esperado $4,800, obtenido $${bailRes.bailCostAmount}`);
  }

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [player.id, jailedPlayer.id] } },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de integración de la Universidad Central pasaron exitosamente!');
}

testEducationEngineIntegration()
  .catch((err) => {
    console.error('❌ Error en prueba de integración de Universidad:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
