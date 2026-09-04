import { PlayerService } from '../src/services/playerService.js';
import { MissionService } from '../src/services/missionService.js';
import { prisma } from '../src/db/prisma.js';

async function testDailyMissionsSystem() {
  console.log('🧪 Probando Nuevo Sistema de Misiones Diarias & Cofre del Sindicato...');

  const testDiscordId = '777666555444333222';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });

  // 1. Registrar Jugador de Prueba
  const player = await PlayerService.registerPlayer(testDiscordId, 'DailyAgent');
  console.log('✅ Jugador registrado.');

  // 2. Obtener misiones iniciales
  console.log('🔹 Consultando misiones diarias de jugador (debe generar 5 misiones)...');
  const { missions, canClaimChest, isChestClaimed } = await MissionService.getMissions(player.id);

  console.log(`✅ ${missions.length} misiones asignadas (Cofre disponible: ${canClaimChest}, Reclamado: ${isChestClaimed}).`);
  if (missions.length !== 5) {
    throw new Error(`Se esperaban 5 misiones diarias, pero se generaron ${missions.length}.`);
  }

  // 3. Simular progreso en las 5 misiones
  console.log('🔹 Avanzando progreso en todas las asignaciones del día...');
  for (const m of missions) {
    await MissionService.progressMission(player.id, m.type as any, m.requirement);
  }

  // Verificar progreso completado
  const { missions: updatedMissions, canClaimChest: canClaimNow } = await MissionService.getMissions(player.id);
  const allCompleted = updatedMissions.every((m) => m.isCompleted);
  console.log(`✅ Todas las misiones completadas: ${allCompleted}. Cofre desbloqueado: ${canClaimNow}.`);
  if (!allCompleted || !canClaimNow) {
    throw new Error('Todas las misiones debieron estar completas y el cofre disponible.');
  }

  // 4. Probar reclamo manual de recompensa individual
  const firstMission = updatedMissions[0];
  console.log(`🔹 Reclamando recompensa individual de asignación: ${firstMission.title}...`);
  const claimRes = await MissionService.claimMissionReward(player.id, firstMission.id);
  console.log(`✅ Recompensa de misión reclamada: +$${claimRes.rewardCash.toLocaleString()} y +${claimRes.rewardXp} XP.`);

  // 5. Probar reclamo del Gran Cofre Diario del Sindicato
  console.log('🔹 Reclamando Gran Cofre Diario del Sindicato ($50,000 + 1,000 XP + 1x First Aid Kit)...');
  const chestRes = await MissionService.claimDailyChest(player.id);
  console.log(`✅ Cofre reclamado con éxito: +$${chestRes.rewardCash.toLocaleString()}, +${chestRes.rewardXp} XP y 1x ${chestRes.rewardItemName}.`);

  if (chestRes.rewardCash !== 50000n || chestRes.rewardXp !== 1000) {
    throw new Error('Las recompensas del Cofre Diario no coinciden.');
  }

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: player.id },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de Misiones Diarias y Cofre del Sindicato pasaron exitosamente!');
}

testDailyMissionsSystem()
  .catch((err) => {
    console.error('❌ Error en prueba de Misiones Diarias:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
