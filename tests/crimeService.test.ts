import { PlayerService } from '../src/services/playerService.js';
import { CrimeService, CRIMES } from '../src/services/crimeService.js';
import { prisma } from '../src/db/prisma.js';

async function testCrimeServiceFase6() {
  console.log('🧪 Probando servicio de Fase 6 (Crímenes, Crime Skill, Prisión, Rescates y Fianzas)...');

  const criminalDiscordId = '333444555666777888';
  const helperDiscordId = '888777666555444333';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: { in: [criminalDiscordId, helperDiscordId] } },
  });

  // 1. Registro de jugadores
  const player = await PlayerService.registerPlayer(criminalDiscordId, 'MasterCriminal');
  const helper = await PlayerService.registerPlayer(helperDiscordId, 'BailHelper');

  console.log('✅ Criminal y Rescatador registrados.');

  // 2. Ejecutar un Crimen Básico (Search for Cash)
  console.log('🔹 Ejecutando crimen: Search for Cash (2🧠)...');
  const res = await CrimeService.commitCrime(player.id, 'search_cash');

  if (!res.crimeName) {
    throw new Error('El crimen no devolvió un nombre válido.');
  }

  if (res.nerveRemaining !== 98) {
    throw new Error(`El Nerve restante debió ser 98. Actual: ${res.nerveRemaining}`);
  }
  console.log(`✅ Resultado de crimen: ${res.message}`);

  // 3. Probar Encarcelamiento y Fianza
  console.log('🔹 Simulando encarcelamiento y pago de fianza...');
  const jailUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
  await prisma.player.update({ where: { id: player.id }, data: { jailUntil } });

  const jailedList = await CrimeService.getJailedPlayers();
  if (jailedList.length === 0) {
    throw new Error('El jugador encarcelado debería aparecer en la lista de prisión.');
  }
  console.log(`✅ Jugador en lista de prisión verificado (Encarcelados: ${jailedList.length}).`);

  // Pagar Fianza
  const bailRes = await CrimeService.payBail(helper.id, player.id);
  if (!bailRes.freedUsername) {
    throw new Error('La fianza no se procesó correctamente.');
  }
  console.log(`✅ Fianza pagada exitosamente: $${bailRes.bailCostAmount.toLocaleString()} pagados para liberar a ${bailRes.freedUsername}.`);

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [player.id, helper.id] } },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de la Fase 6 (Crímenes & Jail) pasaron exitosamente!');
}

testCrimeServiceFase6()
  .catch((err) => {
    console.error('❌ Error en prueba de crímenes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
