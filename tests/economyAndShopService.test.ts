import { PlayerService } from '../src/services/playerService.js';
import { EconomyService } from '../src/services/economyService.js';
import { InventoryService } from '../src/services/inventoryService.js';
import { ShopService } from '../src/services/shopService.js';
import { prisma } from '../src/db/prisma.js';

async function testFase3Services() {
  console.log('🧪 Probando servicios de Fase 3 (Economía, Transacciones Auditables, Inventario y Tienda)...');

  const senderId = '111222333444555666';
  const receiverId = '777888999000111222';

  // Cleanup
  await prisma.player.deleteMany({
    where: { discordId: { in: [senderId, receiverId] } },
  });

  // 1. Registro de jugadores
  const p1 = await PlayerService.registerPlayer(senderId, 'SenderPlayer');
  const p2 = await PlayerService.registerPlayer(receiverId, 'ReceiverPlayer');

  console.log('✅ Jugadores creados con $100 en efectivo.');

  // 2. Probar Depósito Bancario
  console.log('🔹 Probando depósito bancario de $50...');
  const walletDep = await EconomyService.deposit(p1.id, 50n);
  if (walletDep.cash !== 50n || walletDep.bank !== 50n) {
    throw new Error(`Error en depósito bancario. Efectivo: ${walletDep.cash}, Banco: ${walletDep.bank}`);
  }
  console.log('✅ Depósito en banco verificado ($50 efectivo / $50 banco).');

  // 3. Probar Retiro Bancario
  console.log('🔹 Probando retiro bancario de $20...');
  const walletWit = await EconomyService.withdraw(p1.id, 20n);
  if (walletWit.cash !== 70n || walletWit.bank !== 30n) {
    throw new Error(`Error en retiro bancario.`);
  }
  console.log('✅ Retiro de banco verificado ($70 efectivo / $30 banco).');

  // 4. Probar Transferencia entre Jugadores
  console.log('🔹 Probando transferencia de $20 de p1 a p2...');
  await EconomyService.transferCash(p1.id, receiverId, 20n);
  const p1Updated = await PlayerService.getPlayerByDiscordId(senderId);
  const p2Updated = await PlayerService.getPlayerByDiscordId(receiverId);

  if (p1Updated?.wallet?.cash !== 50n || p2Updated?.wallet?.cash !== 120n) {
    throw new Error('Error en transferencia monetaria.');
  }
  console.log('✅ Transferencia verificada.');

  // 5. Verificar Registro de Transacciones Auditables (Transaction model)
  const txs = await EconomyService.getTransactionHistory(p1.id);
  if (txs.length < 3) {
    throw new Error('Las transacciones auditables no fueron registradas correctamente.');
  }
  console.log(`✅ ${txs.length} registros de auditoría de transacciones verificados.`);

  // 6. Probar Compra de Objeto en Tienda
  const itemToBuy = await prisma.item.findFirst({ where: { name: 'Small First Aid Kit' } });
  if (itemToBuy) {
    console.log(`🔹 Probando compra en tienda de '${itemToBuy.name}' por $${itemToBuy.price}...`);
    await ShopService.buyItem(p1.id, itemToBuy.id, 1);
    const inv = await prisma.inventoryItem.findFirst({ where: { playerId: p1.id, itemId: itemToBuy.id } });
    if (!inv || inv.quantity !== 1) {
      throw new Error('Error en compra de tienda.');
    }
    console.log('✅ Compra de tienda e inventario verificada.');
  }

  // Limpieza
  await prisma.player.deleteMany({
    where: { id: { in: [p1.id, p2.id] } },
  });
  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de Fase 3 pasaron exitosamente!');
}

testFase3Services()
  .catch((err) => {
    console.error('❌ Error en prueba unitaria:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
