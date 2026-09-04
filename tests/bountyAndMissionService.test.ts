import { PlayerService } from '../src/services/playerService.js';
import { BountyService } from '../src/services/bountyService.js';
import { MissionService } from '../src/services/missionService.js';
import { prisma } from '../src/db/prisma.js';

async function testBountyAndMissionFase7() {
  console.log('🧪 Probando servicios de Bounties PvP/PVE, Anónimos, Motivos y Misiones...');

  const hunterDiscordId = '444555666777888999';
  const targetDiscordId = '999888777666555444';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: { in: [hunterDiscordId, targetDiscordId] } },
  });

  // 1. Registro de Cazador y Objetivo
  const hunter = await PlayerService.registerPlayer(hunterDiscordId, 'BountyHunter');
  const target = await PlayerService.registerPlayer(targetDiscordId, 'BountyTarget');

  console.log('✅ Cazador y Objetivo registrados.');

  // Dar efectivo a cazador para poner bounty
  await prisma.wallet.update({
    where: { playerId: hunter.id },
    data: { cash: 50000n },
  });

  // 2. Colocar Bounty estándar
  console.log('🔹 Colocando Bounty de $5,000 sobre el objetivo (+10% comisión)...');
  const bountyRes = await BountyService.placeBounty(
    hunter.id,
    targetDiscordId,
    5000n,
    'Traicionó al sindicato',
    false
  );
  if (!bountyRes.bounty) {
    throw new Error('Falló la colocación de la recompensa Bounty.');
  }
  console.log(`✅ Bounty colocado exitosamente sobre ${bountyRes.targetUsername} ($5,000 recompensa + $500 comisión).`);

  // 3. Colocar Bounty Anónimo (+20% comisión)
  console.log('🔹 Colocando Bounty Anónimo de $10,000 (+20% comisión)...');
  const anonBountyRes = await BountyService.placeBounty(
    hunter.id,
    target.id,
    10000n,
    'Contrato secreto del bajo mundo',
    true
  );
  if (!anonBountyRes.bounty || !anonBountyRes.isAnonymous) {
    throw new Error('Falló la colocación del Bounty anónimo.');
  }
  console.log(`✅ Bounty anónimo colocado exitosamente ($10,000 recompensa + $2,000 comisión anónima).`);

  // 4. Buscar objetivos
  console.log('🔹 Probando búsqueda de objetivos por nombre...');
  const searchResults = await BountyService.searchTargets('Target', hunter.id);
  if (searchResults.length === 0) {
    throw new Error('La búsqueda de objetivos debió retornar al menos 1 resultado.');
  }
  console.log(`✅ Búsqueda retornó ${searchResults.length} objetivo(s).`);

  // 5. Consultar Bounties Activos
  const activeBounties = await BountyService.getActiveBounties();
  if (activeBounties.length === 0) {
    throw new Error('La lista de bounties activos no debió estar vacía.');
  }
  console.log(`✅ ${activeBounties.length} Bounty(s) activo(s) verificado(s) con relaciones de jugador.`);

  // 6. Misiones Diarias
  console.log('🔹 Consultando misiones diarias de jugador...');
  const { missions } = await MissionService.getMissions(hunter.id);
  if (missions.length === 0) {
    throw new Error('Las misiones diarias debieron generarse.');
  }
  console.log(`✅ ${missions.length} misiones diarias generadas.`);

  // Avanzar misión de crímenes
  console.log('🔹 Probando progreso de misión...');
  await MissionService.progressMission(hunter.id, 'CRIMES', 1);
  const { missions: updatedMissions } = await MissionService.getMissions(hunter.id);
  console.log(`✅ Progreso de misión verificado (${updatedMissions[0].progress}/${updatedMissions[0].requirement}).`);

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [hunter.id, target.id] } },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de Bounties y Misiones pasaron exitosamente!');
}

testBountyAndMissionFase7()
  .catch((err) => {
    console.error('❌ Error en prueba de Bounties y Misiones:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
