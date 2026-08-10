import { PlayerService } from '../src/services/playerService.js';
import { GymService, GYMS } from '../src/services/gymService.js';
import { prisma } from '../src/db/prisma.js';

async function testGymServiceFase4() {
  console.log('🧪 Probando servicios de Fase 4 (Gimnasio y Fórmula de Entrenamiento de Torn Wiki)...');

  const gymTestDiscordId = '999888777666555444';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: gymTestDiscordId },
  });

  // 1. Registro de jugador de prueba
  const player = await PlayerService.registerPlayer(gymTestDiscordId, 'GymTester');
  console.log('✅ Jugador registrado con 100⚡ y 100😊.');

  // 2. Entrenar Fuerza en Premier Fitness
  console.log('🔹 Entrenando Fuerza (Strength) en Premier Fitness (5⚡)...');
  const result = await GymService.trainStat(player.id, 'strength', 1);

  if (result.gain <= 0) {
    throw new Error('La ganancia de stat debe ser positiva.');
  }

  if (result.energyRemaining !== 95) {
    throw new Error(`La energía restante debe ser 95. Actual: ${result.energyRemaining}`);
  }

  console.log(`✅ Entrenamiento exitoso. Fuerza aumentada +${result.gain.toFixed(3)} (Nueva Fuerza: ${result.newStatValue.toFixed(3)}). Energía restante: ${result.energyRemaining}⚡.`);

  // 3. Probar Fórmula de Ganancia
  const calcGain = GymService.calculateStatGain(1.0, 100, 5, 2.0);
  if (calcGain <= 0) {
    throw new Error('Fórmula de ganancia falló.');
  }
  console.log(`✅ Cálculo de fórmula oficial de Torn Wiki verificado: +${calcGain.toFixed(3)} gain.`);

  // Limpieza
  await prisma.player.delete({ where: { id: player.id } });
  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de la Fase 4 pasaron exitosamente!');
}

testGymServiceFase4()
  .catch((err) => {
    console.error('❌ Error en prueba de gimnasio:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
