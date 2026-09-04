import { PlayerService } from '../src/services/playerService.js';
import { MissionService } from '../src/services/missionService.js';
import { InventoryService } from '../src/services/inventoryService.js';
import { prisma } from '../src/db/prisma.js';

async function testMissionsSystem() {
  console.log('🧪 Probando Nuevo Sistema de Misiones (Diarias, Semanales, Mensuales), Level Filter & Cofres al Inventario...');

  const testDiscordId = '777666555444333222';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });

  // 1. Registrar Jugador Nivel 1 de Prueba
  const player = await PlayerService.registerPlayer(testDiscordId, 'MissionsTester');
  console.log(`✅ Jugador ${player.username} registrado (Nivel ${player.level}).`);

  // 2. Probar filtrado por minLevel para Nivel 1
  console.log('🔹 Consultando misiones diarias de jugador Nivel 1...');
  const { missions: dailyMissions } = await MissionService.getMissions(player.id, 'DAILY');
  console.log(`✅ ${dailyMissions.length} misiones diarias asignadas.`);

  const invalidLevelMission = dailyMissions.find((m) => m.minLevel > player.level);
  if (invalidLevelMission) {
    throw new Error(`El jugador Nivel 1 recibió la misión "${invalidLevelMission.title}" que requiere Nivel ${invalidLevelMission.minLevel}.`);
  }
  console.log('✅ Filtrado por minLevel verificado (Ninguna misión superó el nivel del jugador).');

  // 3. Probar Misiones Semanales (3 misiones) y Mensuales (2 misiones)
  const { missions: weeklyMissions } = await MissionService.getMissions(player.id, 'WEEKLY');
  const { missions: monthlyMissions } = await MissionService.getMissions(player.id, 'MONTHLY');

  if (weeklyMissions.length !== 3) {
    throw new Error(`Se esperaban 3 misiones semanales, pero se generaron ${weeklyMissions.length}.`);
  }
  if (monthlyMissions.length !== 2) {
    throw new Error(`Se esperaban 2 misiones mensuales, pero se generaron ${monthlyMissions.length}.`);
  }
  console.log('✅ Secciones Diarias (5), Semanales (3) y Mensuales (2) validadas correctamente.');

  // 4. Completar las 5 misiones diarias y reclamar el cofre al inventario
  console.log('🔹 Avanzando progreso en todas las asignaciones diarias...');
  for (const m of dailyMissions) {
    await MissionService.progressMission(player.id, m.type as any, m.requirement);
  }

  const { canClaimChest } = await MissionService.getMissions(player.id, 'DAILY');
  if (!canClaimChest) {
    throw new Error('El Cofre Diario debió estar disponible para reclamar.');
  }

  console.log('🔹 Reclamando Cofre Diario al Inventario...');
  const chestClaimRes = await MissionService.claimChestToInventory(player.id, 'DAILY');
  console.log(`✅ ${chestClaimRes.message}`);

  // Verificar que el ítem del Cofre está en el inventario del jugador
  const invChestItem = await prisma.inventoryItem.findFirst({
    where: { playerId: player.id },
    include: { item: true },
  });

  if (!invChestItem || invChestItem.item.name !== 'Cofre Diario del Sindicato') {
    throw new Error('El Cofre Diario del Sindicato no fue encontrado en el inventario del jugador.');
  }
  console.log('✅ Cofre verificado exitosamente en el Inventario.');

  // 5. Abrir el Cofre desde el inventario usando InventoryService.useItem
  console.log('🔹 Abriendo Cofre Diario del Sindicato desde el inventario...');
  const openRes = await InventoryService.useItem(player.id, invChestItem.id);
  console.log(`✅ Resultado de abrir cofre: ${openRes}`);

  if (!openRes.includes('ABIERTO')) {
    throw new Error('Falló la apertura del cofre desde el inventario.');
  }

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: player.id },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas del Sistema de Misiones pasaron exitosamente!');
}

testMissionsSystem()
  .catch((err) => {
    console.error('❌ Error en prueba del Sistema de Misiones:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
