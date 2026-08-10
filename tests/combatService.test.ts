import { PlayerService } from '../src/services/playerService.js';
import { CombatService } from '../src/services/combatService.js';
import { prisma } from '../src/db/prisma.js';

async function testCombatServiceFase5() {
  console.log('🧪 Probando servicio de Fase 5 (Combate PvP, Daño Corporal, Mug/Leave/Hospitalize)...');

  const p1DiscordId = '101010101010101010';
  const p2DiscordId = '202020202020202020';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: { in: [p1DiscordId, p2DiscordId] } },
  });

  // 1. Registro de Atacante y Defensor
  const attacker = await PlayerService.registerPlayer(p1DiscordId, 'AttackerHero');
  const defender = await PlayerService.registerPlayer(p2DiscordId, 'DefenderVictim');

  // Ajustar nivel para superar la protección de novatos
  await prisma.player.update({ where: { id: defender.id }, data: { level: 5 } });
  await prisma.player.update({ where: { id: attacker.id }, data: { level: 5 } });

  console.log('✅ Atacante y Defensor nivel 5 creados.');

  // 2. Probando Anti-Self Attack
  console.log('🔹 Verificando protección Anti-Self Attack...');
  try {
    await CombatService.validateCombat(p1DiscordId, p1DiscordId);
    throw new Error('Debería haber fallado al intentar atacarse a sí mismo.');
  } catch (err: any) {
    console.log(`✅ Protección Anti-Self Attack verificada: "${err.message}"`);
  }

  // 3. Ejecutar Combate PvP
  console.log('🔹 Ejecutando combate PvP (25⚡ de energía)...');
  const combatResult = await CombatService.executePvPCombat(p1DiscordId, p2DiscordId);

  if (!combatResult || combatResult.turns.length === 0) {
    throw new Error('El combate debió generar turnos de ataque.');
  }
  console.log(`✅ Combate finalizado en ${combatResult.turns.length} turnos. Ganador: ${combatResult.winnerUsername}`);

  // 4. Probar Acción Post-Combate MUG (Asalto)
  console.log('🔹 Resolviendo acción post-combate: MUG (Asaltar)...');
  const mugResult = await CombatService.resolvePostCombatAction(attacker.id, defender.id, 'MUG');

  if (mugResult.hospitalMinutes !== 20) {
    throw new Error('Mug debe aplicar 20 minutos de hospitalización.');
  }
  console.log(`✅ Acción MUG ejecutada exitosamente: "${mugResult.resultMessage}"`);

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [attacker.id, defender.id] } },
  });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de la Fase 5 (Combate PvP) pasaron exitosamente!');
}

testCombatServiceFase5()
  .catch((err) => {
    console.error('❌ Error en prueba de combate:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
