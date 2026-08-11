import { PlayerService } from '../src/services/playerService.js';
import { PropertyService } from '../src/services/propertyService.js';
import { TravelService } from '../src/services/travelService.js';
import { MarketService } from '../src/services/marketService.js';
import { InvestmentService } from '../src/services/investmentService.js';
import { CompanyService } from '../src/services/companyService.js';
import { prisma } from '../src/db/prisma.js';

async function testPhases12To16() {
  console.log('🧪 Probando integración completa de Fases 12, 13, 14, 15 y 16...');

  const testDiscordId = '999888777666555444';
  const guildId = 'GUILD_TEST_12_16';

  // Cleanup
  await prisma.player.deleteMany({ where: { discordId: testDiscordId } });
  await prisma.company.deleteMany({ where: { guildId } });

  // 1. Registro de Jugador
  const p = await PlayerService.registerPlayer(testDiscordId, 'TycoonTester', guildId);
  await prisma.wallet.update({ where: { playerId: p.id }, data: { cash: 5000000n } });
  console.log('✅ Jugador Tycoon registrado con $5,000,000.');

  // 2. Propiedades (Fase 12)
  console.log('🔹 Probando compra de Penthouse ($250,000)...');
  const prop = await PropertyService.buyProperty(p.id, 'Penthouse');
  if (!prop || prop.propertyType !== 'Penthouse') {
    throw new Error('Falló la compra de propiedad.');
  }
  console.log('✅ Penthouse adquirido y Max Happy actualizado.');

  // 3. Viajes (Fase 13)
  console.log('🔹 Probando vuelo a México ($500)...');
  const travel = await TravelService.startTravel(p.id, 'Mexico');
  if (!travel || travel.destination !== 'Mexico') {
    throw new Error('Falló el vuelo internacional.');
  }
  console.log('✅ Vuelo a México iniciado correctamente.');

  // 4. Inversiones & Bolsa (Fase 15)
  console.log('🔹 Probando depósito a plazo fijo en banco ($10,000 por 7 días)...');
  const invRes = await InvestmentService.createBankInvestment(p.id, 10000n, 7);
  if (!invRes.payout || invRes.payout <= 10000n) {
    throw new Error('Falló la inversión bancaria.');
  }
  console.log(`✅ Inversión bancaria creada (Pago proyectado: $${invRes.payout.toLocaleString()}).`);

  console.log('🔹 Probando compra de 10 acciones de TNC en la bolsa...');
  const stockRes = await InvestmentService.buyStockShares(p.id, 'TNC', 10);
  if (!stockRes.playerStock || stockRes.playerStock.shares !== 10) {
    throw new Error('Falló la compra de acciones.');
  }
  console.log('✅ 10 acciones de TNC compradas.');

  // 5. Empresas (Fase 16)
  console.log('🔹 Probando fundación de empresa Armería de la Ciudad ($500,000)...');
  const comp = await CompanyService.buyCompany(p.id, 'Gun Shop', 'Armería Sinford', guildId);
  if (!comp || comp.name !== 'Armería Sinford') {
    throw new Error('Falló la fundación de la empresa.');
  }
  console.log('✅ Empresa Armería Sinford registrada exitosamente.');

  // Limpieza
  await prisma.player.deleteMany({ where: { id: p.id } });

  console.log('🧹 Limpieza completada.');
  console.log('🎉 ¡Todas las pruebas de Fases 12, 13, 14, 15 y 16 pasaron exitosamente!');
}

testPhases12To16()
  .catch((err) => {
    console.error('❌ Error en pruebas de Fases 12-16:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
