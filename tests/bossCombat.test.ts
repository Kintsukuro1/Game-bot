import { PlayerService } from '../src/services/playerService.js';
import { BossService } from '../src/services/bossService.js';
import { prisma } from '../src/db/prisma.js';

async function testBossCombatInteractive() {
  console.log('🧪 Iniciando pruebas de Combate Interactivo contra Bosses (Estilo Torn)...');

  const testDiscordId = '987654321098765432';
  const testGuildId = 'TEST_BOSS_GUILD';

  // 1. Limpieza de datos previos
  await prisma.player.deleteMany({
    where: { discordId: testDiscordId },
  });
  await prisma.worldBoss.deleteMany({
    where: { guildId: testGuildId },
  });

  // 2. Crear Jugador de Prueba
  const player = await PlayerService.registerPlayer(testDiscordId, 'BossHunter');
  await prisma.player.update({
    where: { id: player.id },
    data: { level: 10, guildId: testGuildId },
  });
  await prisma.stats.update({
    where: { playerId: player.id },
    data: {
      energy: 100,
      maxEnergy: 100,
      strength: 35.0,
      speed: 30.0,
      defense: 25.0,
      dexterity: 25.0,
    },
  });

  // 3. Crear Ítems de Prueba (Arma Principal, Secundaria, Botiquín, Bebida Energética)
  const primaryItem = await prisma.item.upsert({
    where: { name: 'Rifle Táctico M4A1' },
    update: {},
    create: {
      name: 'Rifle Táctico M4A1',
      description: 'Rifle de asalto de alta precisión',
      type: 'WEAPON',
      weaponType: 'Rifle',
      slot: 'PRIMARY',
      damage: 65,
      accuracy: 60.0,
      price: 15000,
    },
  });

  const medItem = await prisma.item.upsert({
    where: { name: 'Botiquín de Campaña' },
    update: {},
    create: {
      name: 'Botiquín de Campaña',
      description: 'Cura heridas severas',
      type: 'MEDICAL',
      price: 2000,
      effect: JSON.stringify({ healHp: 40 }),
    },
  });

  const energyItem = await prisma.item.upsert({
    where: { name: 'Bebida Energética RedSin' },
    update: {},
    create: {
      name: 'Bebida Energética RedSin',
      description: 'Restaura 25⚡ de energía',
      type: 'CONSUMABLE',
      price: 1500,
      effect: JSON.stringify({ addEnergy: 25 }),
    },
  });

  // Equipar Rifle y añadir consumibles al inventario
  await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: primaryItem.id,
      quantity: 1,
      isEquipped: true,
      slot: 'PRIMARY',
    },
  });

  await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: medItem.id,
      quantity: 3,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: energyItem.id,
      quantity: 2,
    },
  });

  console.log('✅ Jugador de prueba configurado con arma principal y consumibles.');

  // 4. Crear Boss Activo
  const boss = await BossService.getOrCreateActiveBoss(testGuildId, 'DAILY');
  console.log(`✅ Boss Diario inicializado: "${boss.name}" (${boss.currentHp}/${boss.maxHp} HP).`);

  // 5. Test de Ataque con Arma Principal (25⚡ de energía)
  console.log('🔹 Ejecutando Ataque Principal (ATK_PRIMARY)...');
  const resPrimary = await BossService.attackBoss(player.id, boss.id, 'ATK_PRIMARY');

  if (resPrimary.energyUsed !== 25) {
    throw new Error(`Consumo de energía esperado: 25⚡, obtenido: ${resPrimary.energyUsed}⚡`);
  }
  if (!resPrimary.weaponName.includes('M4A1')) {
    throw new Error(`Arma esperada: M4A1, obtenida: ${resPrimary.weaponName}`);
  }
  console.log(`✅ Ataque Principal ejecutado con éxito. Daño infligido: ${resPrimary.damageDealt} HP. Contraataque: -${resPrimary.bodyPartDamage} HP a ${resPrimary.bodyPartStruck}.`);

  // 6. Test de Cobertura Táctica (10⚡ de energía, mitigación del 60%)
  console.log('🔹 Ejecutando Cobertura Táctica (TACTICAL_COVER)...');
  const resCover = await BossService.attackBoss(player.id, boss.id, 'TACTICAL_COVER');

  if (resCover.energyUsed !== 10) {
    throw new Error(`Consumo de energía de cobertura esperado: 10⚡, obtenido: ${resCover.energyUsed}⚡`);
  }
  console.log(`✅ Cobertura ejecutada. Contraataque reducido mitigado a: -${resCover.bodyPartDamage} HP en ${resCover.bodyPartStruck}.`);

  // 7. Test de Inyección Médica en Combate (TACTICAL_MED)
  console.log('🔹 Ejecutando Inyección Médica (TACTICAL_MED)...');
  const resMed = await BossService.attackBoss(player.id, boss.id, 'TACTICAL_MED');

  if (resMed.energyUsed !== 15) {
    throw new Error(`Consumo de energía médica esperado: 15⚡, obtenido: ${resMed.energyUsed}⚡`);
  }
  if (!resMed.usedMedicalItemName) {
    throw new Error('Debería haber consumido un objeto médico.');
  }
  console.log(`✅ Inyección médica aplicada: ${resMed.usedMedicalItemName} (+${resMed.healedHp} HP curados).`);

  // 8. Test de Recarga Rápida de Energía
  console.log('🔹 Probando recarga rápida de energizante desde la consola...');
  const resEnergyDrink = await BossService.quickEnergyDrink(player.id);
  console.log(`✅ Energizante consumido: ${resEnergyDrink.itemName} (+${resEnergyDrink.addEnergy}⚡). Total: ${resEnergyDrink.currentEnergy}⚡.`);

  // 9. Test de Noqueo Justo y Alta Médica Inmediata
  console.log('🔹 Probando sistema de Noqueo Justo (Triage 5 min) y Alta con Botiquín...');
  // Reducir salud crítica para forzar noqueo
  await prisma.bodyParts.update({
    where: { playerId: player.id },
    data: { torsoHp: 2, headHp: 2 },
  });

  const resKnockout = await BossService.attackBoss(player.id, boss.id, 'ATK_PRIMARY');
  if (!resKnockout.isKnockedOut) {
    throw new Error('El jugador debió quedar noqueado al llegar a 0 HP en torso/cabeza.');
  }
  if (resKnockout.hospitalMinutes !== 5) {
    throw new Error(`El tiempo de hospitalización de triage debe ser de 5 min, se obtuvo: ${resKnockout.hospitalMinutes}`);
  }
  console.log(`✅ Noqueo correcto con hospitalización justa de ${resKnockout.hospitalMinutes} minutos.`);

  // Probar Alta Inmediata usando Botiquín rápido
  console.log('🔹 Usando Botiquín Rápido para estabilizarse y salir del hospital...');
  const resQuickMed = await BossService.quickMedicalHeal(player.id);
  const playerAfterMed = await prisma.player.findUnique({ where: { id: player.id } });

  if (playerAfterMed?.hospitalUntil !== null) {
    throw new Error('El botiquín debió retirar el estado de hospitalización al estabilizar el torso/cabeza.');
  }
  console.log(`✅ Alta hospitalaria inmediata confirmada. Torso: ${resQuickMed.torsoHp} HP, Cabeza: ${resQuickMed.headHp} HP.`);

  // 10. Limpieza Final
  await prisma.player.deleteMany({ where: { discordId: testDiscordId } });
  await prisma.worldBoss.deleteMany({ where: { guildId: testGuildId } });

  console.log('🧹 Limpieza de entorno de pruebas completada.');
  console.log('🎉 ¡Todas las pruebas del Combate Interactivo contra Bosses pasaron con éxito!');
}

testBossCombatInteractive()
  .catch((err) => {
    console.error('❌ Error en pruebas de Boss Combat:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
