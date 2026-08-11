import { PlayerService } from '../src/services/playerService.js';
import { FactionService } from '../src/services/factionService.js';
import { WarfareService } from '../src/services/warfareService.js';
import { prisma } from '../src/db/prisma.js';

async function testWarfareServiceFase11() {
  console.log('🧪 Probando servicio de Fase 11 (Guerras entre Facciones y Rankings)...');

  const leader1DiscordId = '111111111111111111';
  const leader2DiscordId = '222222222222222222';
  const guildId = 'GUILD_TEST_11';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: { in: [leader1DiscordId, leader2DiscordId] } },
  });
  await prisma.faction.deleteMany({
    where: { guildId },
  });

  // 1. Registro de Líderes y Creación de Facciones
  const p1 = await PlayerService.registerPlayer(leader1DiscordId, 'LeaderAlpha', guildId);
  const p2 = await PlayerService.registerPlayer(leader2DiscordId, 'LeaderBeta', guildId);

  await prisma.wallet.update({ where: { playerId: p1.id }, data: { cash: 100000n } });
  await prisma.wallet.update({ where: { playerId: p2.id }, data: { cash: 100000n } });

  const f1 = await FactionService.createFaction(p1.id, 'Facción Alfa', 'Primera facción', guildId);
  const f2 = await FactionService.createFaction(p2.id, 'Facción Beta', 'Segunda facción', guildId);

  console.log('✅ Facciones Alfa y Beta creadas.');

  // 2. Declarar Guerra
  console.log('🔹 Declarando guerra entre Facción Alfa y Facción Beta...');
  const warRes = await WarfareService.declareWar(p1.id, f2.id);
  if (!warRes.war) {
    throw new Error('La declaración de guerra falló.');
  }
  console.log(`✅ Guerra declarada exitosamente entre ${warRes.challengerName} y ${warRes.defenderName}.`);

  // 3. Registrar golpe de guerra
  console.log('🔹 Simulando victoria en combate durante la guerra (+10 pts guerra, +15 respect)...');
  const hitRes = await WarfareService.recordWarHit(p1.id, p2.id);
  if (!hitRes || hitRes.pointsGained !== 10) {
    throw new Error('El golpe de guerra no sumó la puntuación correspondiente.');
  }
  console.log(`✅ Golpe de guerra registrado. Marcador de guerra actualizado.`);

  // 4. Rankings de facciones
  const rankings = await WarfareService.getFactionRankings(guildId);
  if (rankings.length < 2) {
    throw new Error('El ranking de facciones debió devolver 2 facciones.');
  }
  console.log(`✅ Ranking de facciones verificado. Facción líder: ${rankings[0].name} (${rankings[0].respect} Respeto).`);

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [p1.id, p2.id] } },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de la Fase 11 (Warfare & Rankings) pasaron exitosamente!');
}

testWarfareServiceFase11()
  .catch((err) => {
    console.error('❌ Error en prueba de Fase 11:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
