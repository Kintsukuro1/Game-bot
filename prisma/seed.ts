import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando catálogo completo de Torn Wiki en la base de datos...');

  const items = [
    // ==========================================
    // 1. MEDICAL (Suministros Médicos)
    // ==========================================
    { name: 'Small First Aid Kit', description: 'Botiquín de primeros auxilios pequeño. Reduce tiempo de hospital.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 150, effect: JSON.stringify({ healHp: 20, reduceHospitalMin: 15 }) },
    { name: 'First Aid Kit', description: 'Botiquín de primeros auxilios estándar. Reduce 30 min de hospital.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 350, effect: JSON.stringify({ healHp: 50, reduceHospitalMin: 30 }) },
    { name: 'Morphine', description: 'Morfina quirúrgica. Reduce 70 min de hospital y restaura 15% de vida.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 1200, effect: JSON.stringify({ healPercent: 15, reduceHospitalMin: 70, medicalCooldownMin: 20 }) },
    { name: 'Blood Bag', description: 'Bolsa de sangre compatible para transfusión inmediata.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 2000, effect: JSON.stringify({ healPercent: 30, medicalCooldownMin: 30 }) },
    { name: 'Empty Blood Bag', description: 'Bolsa de sangre vacía lista para extracción.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 500, effect: JSON.stringify({ action: 'FILL_BLOOD' }) },
    { name: 'Bandage Roll', description: 'Vendas baratas de farmacia de barrio. Mejor que nada, apenas.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 60, effect: JSON.stringify({ healHp: 8, reduceHospitalMin: 5 }) },
    { name: 'Butterfly Stitches', description: 'Parches de sutura improvisados. Duelen al despegarlos, pero cierran la herida.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 220, effect: JSON.stringify({ healHp: 30, reduceHospitalMin: 20 }) },
    { name: 'Suero de la Dra. Reyes', description: 'Producto "de confianza" del laboratorio clandestino de La Química. Cura rápido, no preguntes de qué está hecho.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 1800, effect: JSON.stringify({ healPercent: 20, reduceHospitalMin: 45, medicalCooldownMin: 25 }) },
    { name: 'Antídoto Genérico', description: 'Neutraliza toxinas leves. La etiqueta dice "uso veterinario", pero funciona igual.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 900, effect: JSON.stringify({ healPercent: 10, reduceHospitalMin: 15, medicalCooldownMin: 15 }) },
    { name: 'Kit de Trauma Militar', description: 'Sobrante del arsenal del General Vance. Diseñado para sobrevivir en zona de guerra, no en una pelea de callejón, pero sirve igual.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 3200, effect: JSON.stringify({ healPercent: 40, reduceHospitalMin: 90, medicalCooldownMin: 35 }) },
    { name: 'Transfusión Exprés', description: 'Bolsa de sangre "urgente" comprada en el mercado negro sin muchas preguntas sobre el donante.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 2600, effect: JSON.stringify({ healPercent: 35, medicalCooldownMin: 30 }) },
    { name: 'Bolsa de Hielo Industrial', description: 'De la funeraria de la esquina. No preguntes para qué la usaban antes.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 400, effect: JSON.stringify({ healHp: 15, reduceHospitalMin: 25 }) },
    { name: 'Kit Quirúrgico Completo', description: 'El equipo completo de un cirujano que ya no ejerce (legalmente). Cura casi todo, casi.', type: 'MEDICAL', slot: null, weaponType: null, damage: 0, accuracy: 0, stealth: 0, price: 5500, effect: JSON.stringify({ healPercent: 60, reduceHospitalMin: 150, medicalCooldownMin: 45 }) },

    // ==========================================
    // 2. DRUGS (Drogas)
    // ==========================================
    { name: 'Xanax', description: 'Droga legendaria: +250 Energía (⚡), pero -35% Happy y riesgo de sobredosis.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 850000, effect: JSON.stringify({ addEnergy: 250, reduceHappyPercent: 35, drugCooldownMin: 480 }) },
    { name: 'Ecstasy', description: 'Duplica tu Felicidad (😊) actual.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 65000, effect: JSON.stringify({ doubleHappy: true, drugCooldownMin: 200 }) },
    { name: 'LSD', description: '+50 Energía (⚡), +20 Nerve (🧠), +50 Happy (😊) y +50% en Stats temporales.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 45000, effect: JSON.stringify({ addEnergy: 50, addNerve: 20, addHappy: 50, drugCooldownMin: 400 }) },
    { name: 'Speed', description: '+20% Fuerza (Strength) temporal y +50 Happy.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 30000, effect: JSON.stringify({ boostStat: 'strength', boostPercent: 20, addHappy: 50, drugCooldownMin: 300 }) },
    { name: 'Cannabis', description: '+2 a +3 Nerve (🧠) y +150 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 10000, effect: JSON.stringify({ addNerve: 3, addHappy: 150, drugCooldownMin: 90 }) },
    { name: 'Vicodin', description: '+25% en todas las Battle Stats por 4 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 25000, effect: JSON.stringify({ boostAllBattleStatsPercent: 25, drugCooldownMin: 360 }) },
    { name: 'Opium', description: 'Restaura 50% de Vida y cura hospitalización breve.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 40000, effect: JSON.stringify({ healPercent: 50, drugCooldownMin: 240 }) },
    { name: 'PCP', description: '+500 Happy (😊) y +20% Defensa temporal.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 50000, effect: JSON.stringify({ addHappy: 500, boostStat: 'defense', boostPercent: 20, drugCooldownMin: 360 }) },
    { name: 'Ketamine', description: '+20% Defensa y Destreza pero -20% Fuerza y Velocidad.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 35000, effect: JSON.stringify({ boostStat: 'defense', boostPercent: 20, drugCooldownMin: 240 }) },
    { name: 'Shrooms', description: '+25 Energía, +10 Nerve y alucinaciones caóticas.', type: 'CONSUMABLE', slot: null, weaponType: 'Drug', damage: 0, accuracy: 0, stealth: 0, price: 20000, effect: JSON.stringify({ addEnergy: 25, addNerve: 10, drugCooldownMin: 180 }) },

    // ==========================================
    // 3. ENERGY DRINKS (Bebidas Energéticas)
    // ==========================================
    { name: 'Can of Goose Juice', description: 'Bebida energética suave: +5 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 150000, effect: JSON.stringify({ addEnergy: 5, boosterCooldownHours: 2 }) },
    { name: 'Can of Damp Valley', description: 'Bebida energética: +10 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 300000, effect: JSON.stringify({ addEnergy: 10, boosterCooldownHours: 2 }) },
    { name: 'Can of Crocozade', description: 'Bebida energética: +15 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 450000, effect: JSON.stringify({ addEnergy: 15, boosterCooldownHours: 2 }) },
    { name: 'Can of Munster', description: 'Bebida energética premium: +20 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 600000, effect: JSON.stringify({ addEnergy: 20, boosterCooldownHours: 2 }) },
    { name: 'Can of Santa Shooters', description: 'Bebida navideña de edición limitada: +20 Energía (⚡).', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 650000, effect: JSON.stringify({ addEnergy: 20, boosterCooldownHours: 2 }) },
    { name: 'Can of Red Cow', description: 'Bebida energética de alta potencia: +25 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 800000, effect: JSON.stringify({ addEnergy: 25, boosterCooldownHours: 2 }) },
    { name: 'Can of Rockstar Rudolph', description: 'Bebida festiva: +25 Energía (⚡).', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 850000, effect: JSON.stringify({ addEnergy: 25, boosterCooldownHours: 2 }) },
    { name: 'Can of Taurine Elite', description: 'Bebida energética elite: +30 Energía (⚡). Booster Cooldown: 2 horas.', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 1100000, effect: JSON.stringify({ addEnergy: 30, boosterCooldownHours: 2 }) },
    { name: 'Can of X-MASS', description: 'Bebida legendaria de evento: +30 Energía (⚡).', type: 'CONSUMABLE', slot: null, weaponType: 'EnergyDrink', damage: 0, accuracy: 0, stealth: 0, price: 1200000, effect: JSON.stringify({ addEnergy: 30, boosterCooldownHours: 2 }) },

    // ==========================================
    // 4. ALCOHOL (Bebidas Alcohólicas)
    // ==========================================
    { name: 'Bottle of Beer', description: 'Cerveza clásica: +1 Nerve (🧠). Booster Cooldown: 1 hora.', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 500, effect: JSON.stringify({ addNerve: 1, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Champagne', description: 'Champán fino: +1 Nerve (🧠). Booster Cooldown: 1 hora.', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 800, effect: JSON.stringify({ addNerve: 1, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Saké', description: 'Licor de arroz tradicional: +1 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 750, effect: JSON.stringify({ addNerve: 1, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Tequila', description: 'Tequila importado: +1 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 900, effect: JSON.stringify({ addNerve: 1, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Kandy Kane', description: 'Licor de dulce festivo: +2 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 2500, effect: JSON.stringify({ addNerve: 2, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Pumpkin Brew', description: 'Cerveza artesanal de calabaza: +2 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 2800, effect: JSON.stringify({ addNerve: 2, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Christmas Cocktail', description: 'Cóctel navideño especiado: +3 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 5000, effect: JSON.stringify({ addNerve: 3, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Minty Mayhem', description: 'Licor de menta fuerte: +3 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 5500, effect: JSON.stringify({ addNerve: 3, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Wicked Witch', description: 'Bebida oscura de Halloween: +3 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 6000, effect: JSON.stringify({ addNerve: 3, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Mistletoe Madness', description: 'Bebida especial festiva: +4 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 9000, effect: JSON.stringify({ addNerve: 4, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Stinky Swamp Punch', description: 'Ponche casero potente: +4 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 9500, effect: JSON.stringify({ addNerve: 4, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Christmas Spirit', description: 'Licor supremo de Navidad: +5 Nerve (🧠). Booster Cooldown: 1 hora.', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 15000, effect: JSON.stringify({ addNerve: 5, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Green Stout', description: 'Cerveza especial de San Patricio: +5 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 16000, effect: JSON.stringify({ addNerve: 5, boosterCooldownHours: 1 }) },
    { name: 'Bottle of Moonshine', description: 'Destilado casero clandestino: +5 Nerve (🧠).', type: 'CONSUMABLE', slot: null, weaponType: 'Alcohol', damage: 0, accuracy: 0, stealth: 0, price: 18000, effect: JSON.stringify({ addNerve: 5, boosterCooldownHours: 1 }) },

    // ==========================================
    // 5. CANDY & FOOD (Dulces y Alimentos)
    // ==========================================
    { name: 'Lollipop', description: 'Paleta de caramelo: +25 Happy (😊). Booster Cooldown: 30 minutos.', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 100, effect: JSON.stringify({ addHappy: 25, boosterCooldownMin: 30 }) },
    { name: 'Box of Sweet Hearts', description: 'Caja de caramelos de corazón: +50 Happy (😊). Booster Cooldown: 30 minutos.', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 250, effect: JSON.stringify({ addHappy: 50, boosterCooldownMin: 30 }) },
    { name: 'Bag of Candy Kisses', description: 'Bolsa de besos de chocolate: +75 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 400, effect: JSON.stringify({ addHappy: 75, boosterCooldownMin: 30 }) },
    { name: 'Bag of Reindeer Droppings', description: 'Dulce festivo de chocolate crujiente: +100 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 800, effect: JSON.stringify({ addHappy: 100, boosterCooldownMin: 30 }) },
    { name: 'Bag of Tootsie Rolls', description: 'Bolsa de caramelos masticables: +125 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 1200, effect: JSON.stringify({ addHappy: 125, boosterCooldownMin: 30 }) },
    { name: 'Bag of Bloody Eyeballs', description: 'Gominolas de Halloween: +150 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Candy', damage: 0, accuracy: 0, stealth: 0, price: 1800, effect: JSON.stringify({ addHappy: 150, boosterCooldownMin: 30 }) },
    { name: 'Feathery Hotel Coupon', description: 'Cupón de hotel de lujo: Restaura 100% Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Booster', damage: 0, accuracy: 0, stealth: 0, price: 14000000, effect: JSON.stringify({ maxHappy: true, boosterCooldownHours: 24 }) },
    { name: 'Big Mac', description: 'Hamburguesa de comida rápida: +15 Happy (😊).', type: 'CONSUMABLE', slot: null, weaponType: 'Food', damage: 0, accuracy: 0, stealth: 0, price: 50, effect: JSON.stringify({ addHappy: 15 }) },

    // ==========================================
    // 6. MISCELLANEOUS & SUPPLY PACKS (Varios)
    // ==========================================
    { name: 'Donator Pack', description: 'Paquete de donador: Otorga 31 días de estatus Donator con bonus de energía.', type: 'MISC', slot: null, weaponType: 'SupplyPack', damage: 0, accuracy: 0, stealth: 0, price: 25000000, effect: JSON.stringify({ addDonatorDays: 31 }) },
    { name: 'Lottery Ticket', description: 'Boleto de lotería para el sorteo diario de Sinford.', type: 'MISC', slot: null, weaponType: 'Ticket', damage: 0, accuracy: 0, stealth: 0, price: 5000, effect: JSON.stringify({ lotteryEntry: true }) },
    { name: 'Six-Pack of Alcohol', description: 'Caja de 6 botellas de alcohol variadas.', type: 'MISC', slot: null, weaponType: 'SupplyPack', damage: 0, accuracy: 0, stealth: 0, price: 35000, effect: JSON.stringify({ unpackCategory: 'Alcohol', count: 6 }) },
    { name: 'Six-Pack of Energy Drink', description: 'Caja de 6 bebidas energéticas variadas.', type: 'MISC', slot: null, weaponType: 'SupplyPack', damage: 0, accuracy: 0, stealth: 0, price: 4500000, effect: JSON.stringify({ unpackCategory: 'EnergyDrink', count: 6 }) },

    // ==========================================
    // 7. PRIMARY WEAPONS (Armas Principales de Torn)
    // ==========================================
    { name: '9mm Uzi', description: 'Subfusil compacto de fuego rápido.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 68, accuracy: 45.5, stealth: 3.4, price: 1500 },
    { name: 'AK-47', description: 'Rifle de asalto soviético legendario y robusto.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 59, accuracy: 54.5, stealth: 2.7, price: 2800 },
    { name: 'AK74U', description: 'Variante acortada del AK-74 para combate urbano.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 49, accuracy: 43.5, stealth: 3.5, price: 1200 },
    { name: 'ArmaLite M-15A4', description: 'Rifle táctico de gran potencia de disparo.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 71, accuracy: 59.5, stealth: 3.0, price: 3500 },
    { name: 'Benelli M1 Tactical', description: 'Escopeta semiautomática de respuesta rápida.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 42, accuracy: 67.5, stealth: 2.8, price: 1800 },
    { name: 'Benelli M4 Super', description: 'Escopeta militar de combate cuerpo a cuerpo.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 62, accuracy: 57.5, stealth: 2.8, price: 3200 },
    { name: 'Bushmaster Carbon 15', description: 'Subfusil ultraligero de fibra de carbono.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 53, accuracy: 59.5, stealth: 2.8, price: 2000 },
    { name: 'Dual Bushmasters', description: 'Par de subfusiles Bushmaster simultáneos.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 79, accuracy: 49.5, stealth: 1.6, price: 6500 },
    { name: 'Dual MP5s', description: 'Par de subfusiles MP5 de cadencia extrema.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 81, accuracy: 48.5, stealth: 1.7, price: 7000 },
    { name: 'Dual P90s', description: 'Par de P90s con cargadores horizontales duales.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 80, accuracy: 47.5, stealth: 2.1, price: 6800 },
    { name: 'Dual TMPs', description: 'Dos subfusiles TMP automáticos.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 82, accuracy: 42.5, stealth: 1.9, price: 7200 },
    { name: 'Dual Uzis', description: 'Par de Uzis para lluvia de plomo.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 83, accuracy: 38.5, stealth: 2.2, price: 7500 },
    { name: 'Egg Propelled Launcher', description: 'Lanzador festivo modificado de explosivos.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Heavy Artillery', damage: 67, accuracy: 26.5, stealth: 3.8, price: 5000 },
    { name: 'Enfield SA-80', description: 'Rifle bullpup de alta precisión británica.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 66, accuracy: 57.5, stealth: 3.0, price: 3400 },
    { name: 'Gold Plated AK-47', description: 'Edición de lujo bañado en oro del AK-47.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 78, accuracy: 64.5, stealth: 2.7, price: 12000 },
    { name: 'Heckler & Koch SL8', description: 'Rifle deportivo derivado del famoso G36.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 63, accuracy: 48.5, stealth: 2.5, price: 2900 },
    { name: 'Ithaca 37', description: 'Escopeta de corredera clásica y confiable.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 52, accuracy: 64.5, stealth: 2.4, price: 1900 },
    { name: 'Jackhammer', description: 'Escopeta automática devastadora.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 72, accuracy: 54.5, stealth: 2.1, price: 5500 },
    { name: 'M16 A2 Rifle', description: 'Rifle estándar de las fuerzas armadas.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 64, accuracy: 49.5, stealth: 2.9, price: 3100 },
    { name: 'M249 SAW', description: 'Ametralladora ligera de contención masiva.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 70, accuracy: 43.5, stealth: 2.0, price: 4800 },
    { name: 'M4A1 Colt Carbine', description: 'Carabina táctica ligera y modulable.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 58, accuracy: 49.5, stealth: 2.8, price: 2600 },
    { name: 'Mag 7', description: 'Escopeta corta de carga por cargador.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 59, accuracy: 64.5, stealth: 2.7, price: 2400 },
    { name: 'Minigun', description: 'Ametralladora rotativa masiva a 6000 RPM.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 75, accuracy: 30.5, stealth: 1.3, price: 15000 },
    { name: 'MP 40', description: 'Subfusil histórico de la Segunda Guerra Mundial.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 40, accuracy: 43.5, stealth: 2.8, price: 900 },
    { name: 'MP5 Navy', description: 'Subfusil de fuerzas especiales navales.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 48, accuracy: 53.5, stealth: 3.1, price: 1600 },
    { name: 'Negev NG-5', description: 'Ametralladora pesada de fuego sostenido.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 72, accuracy: 37.5, stealth: 1.5, price: 5800 },
    { name: 'Neutrilux 2000', description: 'Ametralladora experimental de edición especial.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 62, accuracy: 27.5, stealth: 2.1, price: 4500 },
    { name: 'Nock Gun', description: 'Escopeta mítica de 7 cañones simultáneos.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 98, accuracy: 47.5, stealth: 1.9, price: 25000 },
    { name: 'P90', description: 'Subfusil compacto de munición perforante.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 51, accuracy: 53.5, stealth: 3.4, price: 2200 },
    { name: 'PKM', description: 'Ametralladora pesada de calibre ruso 7.62mm.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 78, accuracy: 50.0, stealth: 1.7, price: 8000 },
    { name: 'Prototype', description: 'Arma experimental de laboratorio militar.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 71, accuracy: 38.5, stealth: 2.0, price: 6000 },
    { name: 'Rheinmetall MG 3', description: 'Ametralladora alemana de altísima cadencia.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 69, accuracy: 38.5, stealth: 2.0, price: 5200 },
    { name: 'Sawed-Off Shotgun', description: 'Escopeta recortada para dispersión a quemarropa.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Shotgun', damage: 44, accuracy: 65.5, stealth: 2.4, price: 1100 },
    { name: 'SIG 550', description: 'Rifle de precisión de las fuerzas suizas.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 65, accuracy: 52.5, stealth: 2.9, price: 3300 },
    { name: 'SIG 552', description: 'Carabina compacta comando.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 72, accuracy: 52.5, stealth: 2.9, price: 4200 },
    { name: 'SKS Carbine', description: 'Carabina semiautomática tradicional.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 49, accuracy: 49.5, stealth: 2.6, price: 1300 },
    { name: 'Snow Cannon', description: 'Cañón de proyectiles congelados pesados.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Heavy Artillery', damage: 55, accuracy: 26.5, stealth: 3.6, price: 3000 },
    { name: 'Steyr AUG', description: 'Rifle bullpup austriaco con mira integrada.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 67, accuracy: 47.5, stealth: 2.7, price: 3600 },
    { name: 'Stoner 96', description: 'Ametralladora ligera modular.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Machine Gun', damage: 72, accuracy: 51.5, stealth: 2.2, price: 5900 },
    { name: 'Tavor TAR-21', description: 'Rifle de asalto israelí ergonómico.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 68, accuracy: 54.5, stealth: 3.2, price: 3800 },
    { name: 'Thompson', description: 'El clásico "Tommy Gun" de la era de la mafia.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'SMG', damage: 42, accuracy: 45.5, stealth: 2.9, price: 1000 },
    { name: 'Vektor CR-21', description: 'Rifle futurista de polímero.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 53, accuracy: 50.5, stealth: 3.0, price: 2100 },
    { name: 'XM8 Rifle', description: 'Rifle ligero de diseño modular avanzado.', type: 'WEAPON', slot: 'PRIMARY', weaponType: 'Rifle', damage: 53, accuracy: 58.5, stealth: 2.6, price: 2300 },

    // ==========================================
    // 8. SECONDARY WEAPONS (Armas Secundarias)
    // ==========================================
    { name: 'Type 98 Anti Tank', description: 'Cañón antitanque portable de tremenda destrucción.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 81, accuracy: 27.5, stealth: 1.3, price: 9000 },
    { name: 'Beretta 92FS', description: 'Pistola estándar de servicio militar de 9mm.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 51, accuracy: 53.5, stealth: 4.5, price: 1200 },
    { name: 'Beretta M9', description: 'Pistola reglamentaria de las fuerzas armadas.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 39, accuracy: 56.5, stealth: 4.5, price: 800 },
    { name: 'Beretta Pico', description: 'Pistola ultracompacta para ocultación total.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 57, accuracy: 55.5, stealth: 4.9, price: 1700 },
    { name: 'Blowgun', description: 'Cerbatana sigilosa con dardos venenosos.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Piercing', damage: 18, accuracy: 41.5, stealth: 6.6, price: 300 },
    { name: 'Blunderbuss', description: 'Trabuco antiguo de boca ancha.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Shotgun', damage: 49, accuracy: 26.5, stealth: 3.2, price: 950 },
    { name: 'BT MP9', description: 'Subfusil secundario suizo de disparo veloz.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'SMG', damage: 64, accuracy: 57.5, stealth: 3.4, price: 2900 },
    { name: 'China Lake', description: 'Lanzagranadas de bombeo pesado.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 75, accuracy: 30.0, stealth: 1.5, price: 7500 },
    { name: 'Cobra Derringer', description: 'Pistola de dos cañones de bolsillo.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 64, accuracy: 55.5, stealth: 4.5, price: 2200 },
    { name: 'Crossbow', description: 'Ballesta silenciosa de caza.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Piercing', damage: 38, accuracy: 65.5, stealth: 4.6, price: 1100 },
    { name: 'Desert Eagle', description: 'Pistola pesada de calibre .50 Magnum.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 62, accuracy: 38.5, stealth: 4.3, price: 3500 },
    { name: 'Dual 92G Berettas', description: 'Par de Berettas 92G simultáneas.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 67, accuracy: 32.5, stealth: 3.2, price: 4000 },
    { name: 'Fiveseven', description: 'Pistola de alta penetración de blindaje.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 55, accuracy: 51.5, stealth: 4.9, price: 1900 },
    { name: 'Flamethrower', description: 'Lanza llamas abrasador de área.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 70, accuracy: 41.5, stealth: 1.1, price: 6000 },
    { name: 'Flare Gun', description: 'Pistola de bengalas pirotécnica.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 21, accuracy: 24.5, stealth: 4.8, price: 400 },
    { name: 'Glock 17', description: 'Pistola de polímero austríaca básica.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 31, accuracy: 55.5, stealth: 4.5, price: 500 },
    { name: 'Harpoon', description: 'Lanzador de arpones de pesquería.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Piercing', damage: 50, accuracy: 65.5, stealth: 5.0, price: 1600 },
    { name: 'Homemade Pocket Shotgun', description: 'Escopeta recortada casera de un solo disparo.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Shotgun', damage: 66, accuracy: 62.5, stealth: 2.4, price: 2700 },
    { name: 'Lorcin 380', description: 'Pistola económica de bajo calibre.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 30, accuracy: 43.5, stealth: 4.8, price: 450 },
    { name: 'Luger', description: 'Pistola alemana coleccionable de articulación.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 38, accuracy: 50.5, stealth: 4.7, price: 1000 },
    { name: 'Magnum', description: 'Revólver pesado .44 Magnum de gran impacto.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 58, accuracy: 40.5, stealth: 3.8, price: 2500 },
    { name: 'Milkor MGL', description: 'Lanzagranadas múltiple de tambor.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 77, accuracy: 41.5, stealth: 1.4, price: 8500 },
    { name: 'MP5k', description: 'Versión acortada y ocultable del MP5.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'SMG', damage: 45, accuracy: 54.5, stealth: 3.1, price: 1400 },
    { name: 'Pink Mac-10', description: 'Subfusil Mac-10 personalizado de color rosa.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'SMG', damage: 77, accuracy: 47.5, stealth: 3.1, price: 5000 },
    { name: 'Qsz-92', description: 'Pistola reglamentaria del ejército chino.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 65, accuracy: 55.5, stealth: 4.6, price: 2800 },
    { name: 'Raven MP25', description: 'Pistola ultra pequeña y barata.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 32, accuracy: 54.5, stealth: 4.9, price: 400 },
    { name: 'RPG Launcher', description: 'Lanzacohetes antitanque altamente destructivo.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 80, accuracy: 41.5, stealth: 0.8, price: 9500 },
    { name: 'Ruger 57', description: 'Pistola moderna de alta velocidad de proyectil.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 35, accuracy: 58.5, stealth: 4.9, price: 700 },
    { name: 'S&W M29', description: 'Revólver clásico Smith & Wesson calibre .44.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 50, accuracy: 54.5, stealth: 4.0, price: 1600 },
    { name: 'S&W Revolver', description: 'Revólver tradicional Smith & Wesson.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 45, accuracy: 56.5, stealth: 3.9, price: 1300 },
    { name: 'Skorpion', description: 'Subfusil compacto de fabricación checa.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'SMG', damage: 43, accuracy: 56.5, stealth: 3.1, price: 1350 },
    { name: 'Slingshot', description: 'Tirachinas de precisión para canicas de acero.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Clubbing', damage: 16, accuracy: 56.5, stealth: 7.1, price: 100 },
    { name: 'SMAW Launcher', description: 'Lanzacohetes de asalto de hombro.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Heavy Artillery', damage: 80, accuracy: 35.0, stealth: 1.1, price: 9000 },
    { name: 'Springfield 1911', description: 'Pistola semiautomática .45 ACP atemporal.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 36, accuracy: 59.5, stealth: 4.6, price: 750 },
    { name: 'Taser', description: 'Dispositivo de descarga eléctrica incapacitante.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Mechanical', damage: 3, accuracy: 56.5, stealth: 6.1, price: 600 },
    { name: 'Taurus', description: 'Pistola confiable de manufactura brasileña.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 33, accuracy: 59.5, stealth: 4.5, price: 550 },
    { name: 'TMP', description: 'Subfusil táctico militar de polímero.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'SMG', damage: 40, accuracy: 47.5, stealth: 3.3, price: 1100 },
    { name: 'Tranquilizer Gun', description: 'Pistola de dardos sedantes nocturnos.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Piercing', damage: 18, accuracy: 47.5, stealth: 7.2, price: 1500 },
    { name: 'USP', description: 'Pistola universal de combate de Heckler & Koch.', type: 'WEAPON', slot: 'SECONDARY', weaponType: 'Pistol', damage: 47, accuracy: 60.5, stealth: 4.5, price: 1500 },

    // ==========================================
    // 9. MELEE WEAPONS (Armas Cuerpo a Cuerpo)
    // ==========================================
    { name: 'Axe', description: 'Hacha de corte pesado de madera.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 37, accuracy: 54.5, stealth: 5.9, price: 600 },
    { name: 'Baseball Bat', description: 'Bate de béisbol de madera de fresno.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 19, accuracy: 59.5, stealth: 6.6, price: 300 },
    { name: 'Blood Spattered Sickle', description: 'Hoz ensangrentada para cortes profundos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 39, accuracy: 57.5, stealth: 6.1, price: 1400 },
    { name: 'Bone Saw', description: 'Sierra quirúrgica de corte de hueso.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 56, accuracy: 54.0, stealth: 6.3, price: 2300 },
    { name: 'Bo Staff', description: 'Báculo largo de artes marciales.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 16, accuracy: 57.5, stealth: 5.6, price: 250 },
    { name: 'Bread Knife', description: 'Cuchillo de sierra de cocina filoso.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 42, accuracy: 67.5, stealth: 7.6, price: 800 },
    { name: 'Bug Swatter', description: 'Matamoscas de plástico decorativo.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 8, accuracy: 61.5, stealth: 7.8, price: 50 },
    { name: 'Butterfly Knife', description: 'Cuchillo mariposa de rápido despliegue.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 27, accuracy: 57.5, stealth: 8.3, price: 500 },
    { name: 'Cattle Prod', description: 'Pica eléctrica para control de ganado.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Mechanical', damage: 4, accuracy: 61.5, stealth: 6.6, price: 400 },
    { name: 'Chain Whip', description: 'Látigo de eslabones de acero de oriente.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 34, accuracy: 54.5, stealth: 4.9, price: 700 },
    { name: 'Chainsaw', description: 'Motosierra de gasolina devastadora.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Mechanical', damage: 64, accuracy: 25.5, stealth: 3.0, price: 3500 },
    { name: 'Claymore Sword', description: 'Mandoble escocés de dos manos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 60, accuracy: 51.5, stealth: 4.3, price: 3000 },
    { name: 'Cleaver', description: 'Macheta pesada de carnicero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 54, accuracy: 58.5, stealth: 6.6, price: 1900 },
    { name: 'Cricket Bat', description: 'Bate plano de cricket de sauce.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 21, accuracy: 44.5, stealth: 6.9, price: 350 },
    { name: 'Crowbar', description: 'Palanca de hierro de construcción.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 23, accuracy: 54.5, stealth: 6.6, price: 400 },
    { name: 'Dagger', description: 'Daga afilada de doble filo.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 31, accuracy: 62.5, stealth: 7.8, price: 650 },
    { name: "Devil's Pitchfork", description: 'Tridente diabólico ornamental de acero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 64, accuracy: 43.5, stealth: 5.0, price: 3200 },
    { name: 'Diamond Bladed Knife', description: 'Cuchillo con filo impregnado de diamante.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 63, accuracy: 64.5, stealth: 7.1, price: 8500 },
    { name: 'Diamond Icicle', description: 'Carámbano brillante puntiagudo.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 48, accuracy: 50.5, stealth: 7.6, price: 1600 },
    { name: 'Dual Axes', description: 'Par de hachas de combate doble.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 73, accuracy: 56.5, stealth: 4.1, price: 5000 },
    { name: 'Dual Hammers', description: 'Dos martillos pesados de guerra.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 73, accuracy: 56.5, stealth: 4.5, price: 5200 },
    { name: 'Dual Samurai Swords', description: 'Par de katanas japonesas pareadas.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 73, accuracy: 56.5, stealth: 3.6, price: 6000 },
    { name: 'Dual Scimitars', description: 'Par de alfanjes de hoja curva.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 73, accuracy: 56.5, stealth: 4.3, price: 5500 },
    { name: "Duke's Hammer", description: 'Martillo legendario de Duke.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 18, accuracy: 55.0, stealth: 7.6, price: 1500 },
    { name: 'Fine Chisel', description: 'Cincel fino para estocadas precisas.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 19, accuracy: 52.5, stealth: 8.0, price: 300 },
    { name: 'Flail', description: 'Mangual medieval con bola de picos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 74, accuracy: 30.5, stealth: 5.8, price: 4200 },
    { name: 'Frying Pan', description: 'Sartén pesada de hierro fundido.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 22, accuracy: 45.5, stealth: 6.0, price: 200 },
    { name: 'Golden Broomstick', description: 'Escoba bañada en oro ceremonial.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 63, accuracy: 50.5, stealth: 5.8, price: 3800 },
    { name: 'Golf Club', description: 'Putter de golf con cabeza metálica.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 31, accuracy: 61.0, stealth: 6.2, price: 500 },
    { name: 'Guandao', description: 'Alabarda tradicional de las artes marciales chinas.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 66, accuracy: 37.5, stealth: 5.0, price: 3600 },
    { name: 'Hammer', description: 'Martillo estándar de carpintero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 20, accuracy: 57.5, stealth: 7.6, price: 150 },
    { name: 'Handbag', description: 'Bolso pesado con objetos contundentes dentro.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 70, accuracy: 65.5, stealth: 7.6, price: 4500 },
    { name: 'Ice Pick', description: 'Punzón para picar hielo agudo.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 54, accuracy: 62.5, stealth: 7.0, price: 2100 },
    { name: 'Ivory Walking Cane', description: 'Bastón elegante de marfil con pomo reforzado.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 56, accuracy: 59.5, stealth: 6.8, price: 2500 },
    { name: 'Kama', description: 'Hoz tradicional de ninja.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 38, accuracy: 57.5, stealth: 6.4, price: 900 },
    { name: 'Katana', description: 'Espada japonesa de filo único excepcional.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 55, accuracy: 57.5, stealth: 4.9, price: 2200 },
    { name: 'Kitchen Knife', description: 'Cuchillo chef básico de cocina.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 28, accuracy: 57.5, stealth: 7.6, price: 200 },
    { name: 'Knuckle Dusters', description: 'Puño de acero reforzado para nudillos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 14, accuracy: 64.5, stealth: 7.9, price: 350 },
    { name: 'Kodachi', description: 'Espada japonesa corta para espacios cerrados.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 65, accuracy: 58.5, stealth: 4.1, price: 3300 },
    { name: 'Lead Pipe', description: 'Tubería pesada de plomo.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 29, accuracy: 35.5, stealth: 6.4, price: 250 },
    { name: 'Leather Bullwhip', description: 'Látigo de cuero trenzado.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 30, accuracy: 54.5, stealth: 5.4, price: 450 },
    { name: 'Macana', description: 'Garrote inca ceremonial pulido.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 60, accuracy: 67.5, stealth: 7.4, price: 3400 },
    { name: 'Madball', description: 'Bola pesada de hierro unida a una cadena.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 63, accuracy: 47.5, stealth: 6.8, price: 2900 },
    { name: 'Meat Hook', description: 'Gancho para colgar carne de matadero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 65, accuracy: 41.5, stealth: 7.2, price: 3100 },
    { name: 'Metal Nunchakus', description: 'Nunchacus de acero inoxidable.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 64, accuracy: 62.5, stealth: 6.5, price: 3200 },
    { name: 'Naval Cutlass', description: 'Machete/sable corto de corsario naval.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 67, accuracy: 54.5, stealth: 5.1, price: 3700 },
    { name: 'Ninja Claws', description: 'Garras de acero montadas en la muñeca.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 42, accuracy: 53.5, stealth: 7.4, price: 1200 },
    { name: 'Pair of High Heels', description: 'Tacones aguja metálicos punzantes.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 43, accuracy: 65.5, stealth: 7.1, price: 1100 },
    { name: 'Pair of Ice Skates', description: 'Patines de hielo con cuchillas afiladas.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 46, accuracy: 47.5, stealth: 7.0, price: 1300 },
    { name: 'Pen Knife', description: 'Cortaplumas pequeño desplegable.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 24, accuracy: 47.5, stealth: 8.5, price: 180 },
    { name: 'Penelope', description: 'Bate especial de misiones de Duke.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 17, accuracy: 57.0, stealth: 6.6, price: 1000 },
    { name: 'Petrified Humerus', description: 'Hueso fosilizado pesado.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 51, accuracy: 50.5, stealth: 6.8, price: 1800 },
    { name: 'Pillow', description: 'Almohada suave de plumas para burlas.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 3, accuracy: 65.5, stealth: 7.0, price: 20 },
    { name: 'Plastic Sword', description: 'Espada de juguete de plástico rígido.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 8, accuracy: 31.5, stealth: 7.1, price: 40 },
    { name: 'Poison Umbrella', description: 'Sombrilla táctica con punta venenosa.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 38, accuracy: 51.5, stealth: 8.5, price: 1500 },
    { name: 'Riding Crop', description: 'Fusta de equitación de cuero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 24, accuracy: 56.5, stealth: 5.4, price: 220 },
    { name: 'Rusty Sword', description: 'Espada vieja con mellas y óxido.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 25, accuracy: 17.5, stealth: 5.1, price: 300 },
    { name: 'Sai', description: 'Daga tridente tradicional de Okinawa.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 31, accuracy: 54.5, stealth: 6.8, price: 600 },
    { name: 'Samurai Sword', description: 'Katanas de forja tradicional.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 61, accuracy: 54.5, stealth: 4.9, price: 2800 },
    { name: 'Scalpel', description: 'Bisturí de precisión quirúrgica.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 58, accuracy: 49.5, stealth: 8.7, price: 2600 },
    { name: 'Scimitar', description: 'Alfanje turco de filo curvado.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 43, accuracy: 60.5, stealth: 5.4, price: 1200 },
    { name: 'Sledgehammer', description: 'Maza de demolición de 10 kg.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 61, accuracy: 52.5, stealth: 4.1, price: 2900 },
    { name: 'Spear', description: 'Lanza militar con punta de acero.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 41, accuracy: 50.5, stealth: 5.1, price: 900 },
    { name: 'Swiss Army Knife', description: 'Navaja suiza multiusos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 26, accuracy: 54.5, stealth: 8.4, price: 350 },
    { name: 'Twin Tiger Hooks', description: 'Par de ganchos de tigre chinos.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 50, accuracy: 55.5, stealth: 4.8, price: 2100 },
    { name: 'Wand of Destruction', description: 'Varita especial de colección.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Piercing', damage: 63, accuracy: 28.5, stealth: 5.4, price: 4000 },
    { name: 'Wooden Nunchaku', description: 'Nunchacus tradicionales de madera.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 25, accuracy: 61.5, stealth: 6.6, price: 400 },
    { name: 'Wushu Double Axes', description: 'Par de hachas dobles de wushu.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Clubbing', damage: 56, accuracy: 53.5, stealth: 4.4, price: 2300 },
    { name: 'Yasukuni Sword', description: 'Katana histórica de santuario.', type: 'WEAPON', slot: 'MELEE', weaponType: 'Slashing', damage: 68, accuracy: 51.5, stealth: 5.0, price: 4500 },

    // ==========================================
    // 10. DAMAGING TEMPORARY WEAPONS (Arrojadizas)
    // ==========================================
    { name: 'Book', description: 'Libro pesado arrojadizo.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 10, accuracy: 88.0, stealth: 7.5, price: 50 },
    { name: 'Brick', description: 'Ladrillo macizo de construcción.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 28, accuracy: 43.0, stealth: 7.3, price: 100 },
    { name: 'Claymore Mine', description: 'Mina antipersona direccional con metralla.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 83, accuracy: 27.0, stealth: 3.3, price: 3500 },
    { name: 'Fireworks', description: 'Caja de cohetes pirotécnicos explosivos.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 45, accuracy: 34.0, stealth: 4.3, price: 500 },
    { name: 'Grenade', description: 'Granada de fragmentación M67.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 86, accuracy: 106.0, stealth: 4.0, price: 4000 },
    { name: 'HEG', description: 'Granada de alto explosivo perforante.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 90, accuracy: 116.0, stealth: 3.8, price: 5500 },
    { name: 'Molotov Cocktail', description: 'Coctel incendiario casero.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 85, accuracy: 78.0, stealth: 3.9, price: 2500 },
    { name: 'Nail Bomb', description: 'Bomba casera cargada de clavos.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 99, accuracy: 106.0, stealth: 3.0, price: 6000 },
    { name: 'Ninja Star', description: 'Shuriken metálico arrojadizo.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Piercing', damage: 67, accuracy: 67.0, stealth: 7.6, price: 1800 },
    { name: 'Snowball', description: 'Bola de nieve congelada apretada.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Clubbing', damage: 5, accuracy: 50.0, stealth: 7.9, price: 10 },
    { name: 'Stick Grenade', description: 'Granada de mango Stielhandgranate.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Heavy Artillery', damage: 87, accuracy: 97.0, stealth: 3.6, price: 4200 },
    { name: 'Throwing Knife', description: 'Cuchillo balístico equilibrado.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Piercing', damage: 69, accuracy: 63.0, stealth: 7.9, price: 2000 },
    { name: 'Trout', description: 'Pescado fresco para abofetear al enemigo.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Clubbing', damage: 35, accuracy: 90.0, stealth: 7.3, price: 300 },
    { name: 'Wrench', description: 'Llave inglesa pesada de fontanero.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Clubbing', damage: 14, accuracy: 53.0, stealth: 7.6, price: 150 },

    // ==========================================
    // 11. UTILITY & BUFF TEMPORARY WEAPONS
    // ==========================================
    { name: 'Bolas', description: 'Bolas de caza: Inmoviliza al oponente por 3 turnos.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 31.0, stealth: 8.2, price: 1200, effect: JSON.stringify({ debuff: 'ENSNARED', turnsMissed: 3 }) },
    { name: 'Concussion Grenade', description: 'Granada de concusión: Reduce Destreza del oponente a 1/5.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 200.0, stealth: 10.0, price: 2500, effect: JSON.stringify({ debuff: 'CONCUSSED', stat: 'dexterity', multiplier: 0.2, durationSec: 20 }) },
    { name: 'Flash Grenade', description: 'Granada cegadora: Reduce Velocidad del oponente a 1/5.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 200.0, stealth: 10.0, price: 2500, effect: JSON.stringify({ debuff: 'BLINDED', stat: 'speed', multiplier: 0.2, durationSec: 20 }) },
    { name: 'Pepper Spray', description: 'Gas pimienta: Reduce Destreza del oponente a 1/5.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 200.0, stealth: 10.0, price: 1800, effect: JSON.stringify({ debuff: 'MACED', stat: 'dexterity', multiplier: 0.2, durationSec: 20 }) },
    { name: 'Smoke Grenade', description: 'Granada de humo: Reduce Velocidad del oponente a 1/3.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 200.0, stealth: 10.0, price: 2000, effect: JSON.stringify({ debuff: 'SMOKED', stat: 'speed', multiplier: 0.33, durationSec: 150 }) },
    { name: 'Tear Gas', description: 'Gas lacrimógeno: Reduce Destreza del oponente a 1/3.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Debuff', damage: 0, accuracy: 200.0, stealth: 10.0, price: 2000, effect: JSON.stringify({ debuff: 'GASSED', stat: 'dexterity', multiplier: 0.33, durationSec: 150 }) },

    // NEEDLES / STAT BOOSTERS
    { name: 'Epinephrine', description: 'Inyección de Epinefrina: +500% Fuerza por 120s.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Buff', damage: 0, accuracy: 0.0, stealth: 10.0, price: 4000, effect: JSON.stringify({ buff: 'STRENGTHENED', stat: 'strength', boostPercent: 500, durationSec: 120 }) },
    { name: 'Melatonin', description: 'Inyección de Melatonina: +500% Velocidad por 120s.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Buff', damage: 0, accuracy: 0.0, stealth: 10.0, price: 4000, effect: JSON.stringify({ buff: 'HASTENED', stat: 'speed', boostPercent: 500, durationSec: 120 }) },
    { name: 'Serotonin', description: 'Inyección de Serotonina: +300% Defensa por 120s y regenera 25% de vida.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Buff', damage: 0, accuracy: 0.0, stealth: 10.0, price: 4500, effect: JSON.stringify({ buff: 'HARDENED', stat: 'defense', boostPercent: 300, durationSec: 120, healPercent: 25 }) },
    { name: 'Tyrosine', description: 'Inyección de Tirosina: +500% Destreza por 120s.', type: 'WEAPON', slot: 'TEMPORARY', weaponType: 'Buff', damage: 0, accuracy: 0.0, stealth: 10.0, price: 4000, effect: JSON.stringify({ buff: 'SHARPENED', stat: 'dexterity', boostPercent: 500, durationSec: 120 }) },

    // ==========================================
    // 12. CHESTS & REWARD BOXES (Cofres de Misiones)
    // ==========================================
    { name: 'Cofre Diario del Sindicato', description: 'Cofre de suministros diarios del Sindicato. Ábrelo desde tu inventario para recibir $50,000 cash, 1,000 XP y un ítem especial.', type: 'CONSUMABLE', slot: null, weaponType: 'Chest', damage: 0, accuracy: 0, stealth: 0, price: 0, effect: JSON.stringify({ chestType: 'DAILY' }) },
    { name: 'Cofre Semanal de la Sombra', description: 'Cofre semanal de alta prioridad. Ábrelo desde tu inventario para recibir $250,000 cash, 5,000 XP, 5 Puntos de Maestría y un ítem táctico.', type: 'CONSUMABLE', slot: null, weaponType: 'Chest', damage: 0, accuracy: 0, stealth: 0, price: 0, effect: JSON.stringify({ chestType: 'WEEKLY' }) },
    { name: 'Cofre Mensual del Padrino', description: 'Cofre legendario mensual del Padrino. Ábrelo desde tu inventario para recibir $1,000,000 cash, 20,000 XP, 15 Puntos de Maestría y un armamento raro.', type: 'CONSUMABLE', slot: null, weaponType: 'Chest', damage: 0, accuracy: 0, stealth: 0, price: 0, effect: JSON.stringify({ chestType: 'MONTHLY' }) },
  ];

  console.log(`📦 Cargando ${items.length} ítems de Torn Wiki en la base de datos...`);

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }

  console.log(`✅ Semilla oficial de Torn Wiki completada. Total de ítems registrados: ${items.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
