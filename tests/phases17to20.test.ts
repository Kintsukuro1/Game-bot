import { PlayerService } from '../src/services/playerService.js';
import { RacingService } from '../src/services/racingService.js';
import { CasinoService } from '../src/services/casinoService.js';
import { DrugAndBoosterService } from '../src/services/drugAndBoosterService.js';
import { AchievementService } from '../src/services/achievementService.js';
import { prisma } from '../src/db/prisma.js';

async function testPhases17To20() {
  console.log('🧪 Probando integración completa de Fases 17, 18, 19 y 20...');

  const testDiscordId = '123123123123123123';
  const guildId = 'GUILD_TEST_17_20';

  // Cleanup
  await prisma.player.deleteMany({ where: { discordId: testDiscordId } });

  // 1. Registro de Jugador
  const p = await PlayerService.registerPlayer(testDiscordId, 'Protester', guildId);
  await prisma.wallet.update({ where: { playerId: p.id }, data: { cash: 50000n } });
  console.log('✅ Jugador registrado para Fases 17-20.');

  // 2. Racing (Fase 17)
  console.log('🔹 Probando carrera de autos en Anillo Industrial...');
  const race = await RacingService.startRace(p.id, 'Industrial Ring');
  if (!race || !race.timeSeconds) {
    throw new Error('Falló la carrera de autos.');
  }
  console.log(`✅ Carrera finalizada en ${race.timeSeconds.toFixed(1)} segundos.`);

  // 3. Casino (Fase 18)
  console.log('🔹 Probando tragamonedas ($100 de apuesta)...');
  const slots = await CasinoService.playSlots(p.id, 100n);
  if (!slots.reels) {
    throw new Error('Falló la máquina de tragamonedas.');
  }
  console.log(`✅ Tragamonedas jugadas: ${slots.reels} (Ganancia neta: $${slots.netGain}).`);

  // 4. Drogas y Boosters (Fase 19)
  console.log('🔹 Probando consumo de bebida energética (+100⚡)...');
  const booster = await DrugAndBoosterService.useBooster(p.id, 'ENERGY_DRINK');
  if (!booster.boosterName) {
    throw new Error('Falló el consumo del booster.');
  }
  console.log(`✅ ${booster.boosterName} consumida exitosamente.`);

  // 5. Logros y Leaderboards (Fase 20)
  console.log('🔹 Desbloqueando logro "Primeros Pasos"...');
  const ach = await AchievementService.unlockAchievement(p.id, 'FIRST_STEPS');
  if (ach) {
    console.log(`✅ Logro desbloqueado: ${ach.title} (Recompensa: +$${ach.rewardCash}).`);
  }

  const leaderboards = await AchievementService.getLeaderboards(guildId, 'level');
  if (leaderboards.length < 1) {
    throw new Error('Falló el sistema de clasificaciones.');
  }
  console.log('✅ Clasificación global por nivel verificada.');

  // Limpieza
  await prisma.player.deleteMany({ where: { id: p.id } });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de Fases 17, 18, 19 y 20 pasaron exitosamente!');
}

testPhases17To20()
  .catch((err) => {
    console.error('❌ Error en pruebas de Fases 17-20:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
