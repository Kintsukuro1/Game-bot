import { PlayerService } from '../src/services/playerService.js';
import { prisma } from '../src/db/prisma.js';

async function testPlayerServiceFase2() {
  console.log('🧪 Iniciando prueba unitaria de Fase 2 (Jugador, Stats & Working Stats)...');

  const testDiscordId = '987654321098765432';
  const testUsername = 'Fase2Tester';

  // Cleanup old test player
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });

  // 1. Test One-Time Registration with /empezar
  console.log('🔹 Probando registro único /empezar con Working Stats...');
  const player = await PlayerService.registerPlayer(testDiscordId, testUsername);

  if (!player || player.username !== testUsername) {
    throw new Error('Fallo al registrar el jugador.');
  }

  if (player.wallet?.cash !== 100n) {
    throw new Error('El efectivo inicial debe ser $100.');
  }

  const stats = player.stats;
  if (!stats) throw new Error('Las estadísticas no fueron creadas.');

  if (
    stats.strength !== 1.0 ||
    stats.defense !== 1.0 ||
    stats.speed !== 1.0 ||
    stats.dexterity !== 1.0
  ) {
    throw new Error('Las Battle Stats iniciales deben ser 1.0.');
  }

  if (
    stats.manualLabor !== 1.0 ||
    stats.intelligence !== 1.0 ||
    stats.endurance !== 1.0
  ) {
    throw new Error('Las Working Stats iniciales (manualLabor, intelligence, endurance) deben ser 1.0.');
  }

  console.log('✅ Registro inicial con Battle Stats y Working Stats verificado.');

  // 2. Cleanup test data
  await prisma.player.delete({ where: { id: player.id } });
  console.log('🧹 Limpieza de datos completada.');
  console.log('🎉 ¡Todas las pruebas unitarias de Fase 2 pasaron exitosamente!');
}

testPlayerServiceFase2()
  .catch((err) => {
    console.error('❌ Error en prueba unitaria:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
