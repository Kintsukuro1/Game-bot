import { prisma } from '../db/prisma.js';
import { DEFAULT_GUILD_ID } from '../config/constants.js';
import { InsufficientFundsError } from '../errors/gameErrors.js';

export interface BossDefinition {
  type: string;
  category: 'DAILY' | 'WEEKLY_FACTION';
  name: string;
  maxHp: number;
  description: string;
  durationHours: number;
  abilityName: string;
  abilityDescription: string;
}

export type BossPhase = 'NORMAL' | 'ENRAGED' | 'DESPERATE';

export function getBossPhase(currentHp: number, maxHp: number): { phase: BossPhase; title: string; emoji: string } {
  const pct = (currentHp / maxHp) * 100;
  if (pct > 60) {
    return { phase: 'NORMAL', title: 'Fase 1: Control Inicial', emoji: '🟢' };
  } else if (pct > 20) {
    return { phase: 'ENRAGED', title: 'Fase 2: ENFURECIDO 🔥', emoji: '🔥' };
  } else {
    return { phase: 'DESPERATE', title: 'Fase 3: MODO DESESPERADO ⚡', emoji: '⚡' };
  }
}

export const BOSS_DEFINITIONS: Record<string, BossDefinition> = {
  CHEN_CARNICERO: {
    type: 'CHEN_CARNICERO',
    category: 'DAILY',
    name: '🥩 Chen "El Fileteador" (El Carnicero del Barrio Chino)',
    maxHp: 250000,
    description: 'Carnicero impulsivo de la Tríada de la Flor de Loto. Empuña dos hachas de deshuesar y habla mezclando español con chino.',
    durationHours: 24,
    abilityName: '🥩 Tajazo Desangrante',
    abilityDescription: '15% de probabilidad de infligir un desangrado profundo (+5 HP de daño adicional al torso).',
  },
  PAYASO_SINFORD: {
    type: 'PAYASO_SINFORD',
    category: 'DAILY',
    name: '🤡 "Pepino" el Payaso de Sinford',
    maxHp: 280000,
    description: 'Ex-animador de cumpleaños que perdió la cordura (y la licencia de payasería) tras años haciendo globoflexia gratis para la mafia.',
    durationHours: 24,
    abilityName: '🤡 Confusión de Carpa',
    abilityDescription: '20% de probabilidad de hacer tropezar al jugador, anulando el ataque y causando 15 HP de auto-daño.',
  },
  QUIMICA_REYES: {
    type: 'QUIMICA_REYES',
    category: 'DAILY',
    name: '🧪 Dra. "La Química" Reyes',
    maxHp: 300000,
    description: 'Le quitaron la matrícula por "experimentar de más" con los pacientes. Cocina sustancias en un laboratorio clandestino.',
    durationHours: 24,
    abilityName: '🧪 Toxicidad Radiactiva',
    abilityDescription: '25% de probabilidad de contaminarte con reactivos, reduciendo tu daño asestado un -15%.',
  },
  SAL_GRASA_MORETTI: {
    type: 'SAL_GRASA_MORETTI',
    category: 'DAILY',
    name: '🍔 Sal "Grasa" Moretti (Big Sal\'s Burgers)',
    maxHp: 260000,
    description: 'Dueño de la cadena de comida rápida más denunciada por Sanidad de todo Sinford. Nadie sabe qué carne usa.',
    durationHours: 24,
    abilityName: '🍔 Ataque de Colesterol',
    abilityDescription: '20% de probabilidad de empastartarte en grasa hirviendo, aumentando el costo de energía del turno a 30⚡.',
  },
  CAPITANA_IBARRA: {
    type: 'CAPITANA_IBARRA',
    category: 'WEEKLY_FACTION',
    name: '👮‍♀️ Capitana "Placa de Oro" Ibarra',
    maxHp: 7000000,
    description: 'La policía más corrupta que ha pisado Sinford. Cobra "impuesto de tránsito" a cualquiera que respire cerca de su comisaría.',
    durationHours: 52,
    abilityName: '👮‍♀️ Impuesto Policial',
    abilityDescription: '15% de probabilidad de confiscación instantánea de $1,000 en efectivo de tu bolsillo.',
  },
  ALCAIDE_VOSS: {
    type: 'ALCAIDE_VOSS',
    category: 'WEEKLY_FACTION',
    name: '⛓️ Alcaide Voss (Prisión Central de Sinford)',
    maxHp: 7500000,
    description: 'Dirige la cárcel como su reality show personal con apuestas clandestinas e incentivos para riñas.',
    durationHours: 52,
    abilityName: '⛓️ Normativa del Penal',
    abilityDescription: 'Armas de fuego sufren penalización del -30% de daño; armas cuerpo a cuerpo obtienen +20% de bonus.',
  },
  PRESIDENTE_HARRISON: {
    type: 'PRESIDENTE_HARRISON',
    category: 'WEEKLY_FACTION',
    name: '🏛️ El Presidente Corrupto ("Presidente Harrison")',
    maxHp: 10000000,
    description: 'Mandatario corrupto escoltado por el Servicio Secreto y mercenarios de elite.',
    durationHours: 52,
    abilityName: '🏛️ Escudo del Servicio Secreto',
    abilityDescription: 'Absorbe un 20% de todo el daño recibido mientras su salud sea mayor al 50%.',
  },
  GENERAL_VANCE: {
    type: 'GENERAL_VANCE',
    category: 'WEEKLY_FACTION',
    name: '🪖 El Jefe Militar ("General Vance")',
    maxHp: 8000000,
    description: 'Comandante supremo de la base militar Fuerte Sinford. Opera desde un búnker blindado.',
    durationHours: 52,
    abilityName: '🪖 Bombardeo Táctico',
    abilityDescription: 'Fuego de mortero constante que incrementa el contraataque base en +10 HP.',
  },
  DON_CARBONE: {
    type: 'DON_CARBONE',
    category: 'WEEKLY_FACTION',
    name: '🎩 El Capo de la Mafia ("Don Ernesto Carbone")',
    maxHp: 6000000,
    description: 'El Padrino de la mafia italiana de Sinford. Controla el inframundo y la extorsión.',
    durationHours: 52,
    abilityName: '🎩 Pagaré Mafioso',
    abilityDescription: 'Exige cobro de extorsión sustrayendo $500 de tu efectivo en mano al contraatacar.',
  },
};

export class BossService {
  // Citas cómicas y dramáticas de los World Bosses ajustadas a la fase
  static getRandomBossQuote(type: string, phase: BossPhase = 'NORMAL'): string {
    if (type === 'CHEN_CARNICERO') {
      if (phase === 'DESPERATE') {
        return '🥩 Chen "El Fileteador": "¡Aiyaaaa! ¡Mi delantal está destrozado y chorreando! ¡LOS VOY A FILETEAR A TODOS, HIJOS DE PUTA!"';
      }
      if (phase === 'ENRAGED') {
        return '🥩 Chen "El Fileteador": "¡Basta de charrasca suave! ¡Mis dos hachas tienen hambre de tu puta columna!"';
      }
      return '🥩 Chen "El Fileteador": "¡Nǐ hǎo, pendejo! ¿Tú vienes a comprar corte de primera o vienes a ser la carne del caldo de hoy?"';
    }

    if (type === 'PAYASO_SINFORD') {
      if (phase === 'DESPERATE') {
        return '🤡 "Pepino": "¡JAJAJAJA! ¿Crees que me duele, pedazo de mierda? ¡HE TRABAJADO EN 500 CUMPLEAÑOS INFANTILES, ESTO ES UN PASEO!"';
      }
      if (phase === 'ENRAGED') {
        return '🤡 "Pepino": "¡HONK HONK! ¡Se acabó la magia, imbécil! ¡Ahora te tragas la bomba de confeti en los pulmones!"';
      }
      return '🤡 "Pepino": "¡Sorpresa, hijo de puta! ¿Creíste que la fiesta terminaba con pastel? ¡Termina con tus dientes en el piso!"';
    }

    if (type === 'QUIMICA_REYES') {
      if (phase === 'DESPERATE') {
        return '🧪 Dra. Reyes: "¡No toques esa probeta, imbecil! Si yo caigo, ¡NOS VAMOS A DESINTEGRAR JUNTOS EN ÁCIDO FLUORHÍDRICO!"';
      }
      if (phase === 'ENRAGED') {
        return '🧪 Dra. Reyes: "Aumentando la dosis de neurotoxina... ¡Averigüemos cuántos segundos aguantas antes de convulsionar!"';
      }
      return '🧪 Dra. Reyes: "Relájate, esto no va a doler... mentira, va a doler como la puta madre. Pero anota la hora, me sirve de dato."';
    }

    if (type === 'SAL_GRASA_MORETTI') {
      if (phase === 'DESPERATE') {
        return '🍔 Sal "Grasa": "¡ME VAN A CERRAR EL LOCAL! ¡Voy a meter la cabeza de todos ustedes en la freidora a 200 grados!"';
      }
      if (phase === 'ENRAGED') {
        return '🍔 Sal "Grasa": "¡Aceite hirviendo para la mesa cuatro! ¡Preparen las papas con salsa de tus propias vísceras!"';
      }
      return '🍔 Sal "Grasa": "¿Preguntas qué mierda lleva la hamburguesa especial? Hoy TÚ eres el puto ingrediente sorpresa, campeón."';
    }

    if (type === 'CAPITANA_IBARRA') {
      if (phase === 'DESPERATE') {
        return '👮‍♀️ Capitana Ibarra: "¡Llamen al escuadrón antimotines! ¡A estos criminales de mierda no los saca vivos nadie de mi jurisdicción!"';
      }
      if (phase === 'ENRAGED') {
        return '👮‍♀️ Capitana Ibarra: "¡Resistencia a la autoridad de grado tres! ¡Te voy a moler a macanazos hasta que no te reconozca tu madre!"';
      }
      return '👮‍♀️ Capitana Ibarra: "Tienes derecho a guardar silencio, imbécil. Yo tengo derecho a no escucharte una mierda de todas formas."';
    }

    if (type === 'ALCAIDE_VOSS') {
      if (phase === 'DESPERATE') {
        return '⛓️ Alcaide Voss: "¡Cierren el pabellón de máxima seguridad! ¡Si este motín no para, disparo a matar a todo lo que se mueva!"';
      }
      if (phase === 'ENRAGED') {
        return '⛓️ Alcaide Voss: "¡Doble guardia a las celdas! ¡Hoy nadie sale con vida de esta arena de combate!"';
      }
      return '⛓️ Alcaide Voss: "Bienvenido a mi puta prisión. Las reglas son simples: yo gano las apuestas, tú pagas con lo que te quede de cuerpo."';
    }

    if (type === 'PRESIDENTE_HARRISON') {
      if (phase === 'DESPERATE') {
        return '🏛️ Presidente Harrison: "¡ACTIVACIÓN DEL PROTOCOLO CERO! ¡Tiren la bomba táctica si es necesario, pero elimínenlos!"';
      }
      if (phase === 'ENRAGED') {
        return '🏛️ Presidente Harrison: "¡Francotiradores en los tejados! ¡No permitan que esta escoria dañe mi imagen pública!"';
      }
      return '🏛️ Presidente Harrison: "Tienen a toda la ciudad en su contra, pandilleros. Mi Servicio Secreto los convertirá en polvo."';
    }

    if (type === 'GENERAL_VANCE') {
      if (phase === 'DESPERATE') {
        return '🪖 General Vance: "¡BÚNKER EN PELIGRO! ¡FUEGO DE ARTILLERÍA PESADA A MI PROPIA POSICIÓN! ¡QUE NO QUEDE NADA!"';
      }
      if (phase === 'ENRAGED') {
        return '🪖 General Vance: "¡Cargadores incendiarios listos! ¡Barran este callejón con napalm!"';
      }
      return '🪖 General Vance: "Esto no es una pelea de callejones, es una guerra abierta. ¡Preparen el bombardeo de morteros!"';
    }

    if (type === 'DON_CARBONE') {
      if (phase === 'DESPERATE') {
        return '🎩 Don Ernesto Carbone: "¡Cosa Nostra no se rinde ante ratas de alcantarilla! ¡Traigan las ametralladoras Thompson y acábennos!"';
      }
      if (phase === 'ENRAGED') {
        return '🎩 Don Ernesto Carbone: "¡Envien a los sicarios de la familia! ¡Que sus cuerpos floten en la bahía al amanecer!"';
      }
      return '🎩 Don Ernesto Carbone: "Ustedes creen que dominan las calles, pero yo soy dueño de cada juez, policía y callejón de esta ciudad."';
    }

    return '⚔️ ¡Prepara tus armas para el combate!';
  }

  // Obtener o inicializar el Boss activo para la categoría indicada
  static async getOrCreateActiveBoss(guildId: string = DEFAULT_GUILD_ID, category: 'DAILY' | 'WEEKLY_FACTION') {
    const now = new Date();

    let activeBoss = await prisma.worldBoss.findFirst({
      where: {
        guildId,
        category,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
      include: {
        damageLogs: {
          include: { player: true },
          orderBy: { damageDealt: 'desc' },
        },
      },
    });

    if (!activeBoss) {
      // Crear nuevo boss según la categoría
      let def: BossDefinition;

      if (category === 'DAILY') {
        const dailyTypes = [
          BOSS_DEFINITIONS.CHEN_CARNICERO,
          BOSS_DEFINITIONS.PAYASO_SINFORD,
          BOSS_DEFINITIONS.QUIMICA_REYES,
          BOSS_DEFINITIONS.SAL_GRASA_MORETTI,
        ];
        def = dailyTypes[Math.floor(Math.random() * dailyTypes.length)];
      } else {
        const weeklyTypes = [
          BOSS_DEFINITIONS.PRESIDENTE_HARRISON,
          BOSS_DEFINITIONS.GENERAL_VANCE,
          BOSS_DEFINITIONS.DON_CARBONE,
          BOSS_DEFINITIONS.CAPITANA_IBARRA,
          BOSS_DEFINITIONS.ALCAIDE_VOSS,
        ];
        def = weeklyTypes[Math.floor(Math.random() * weeklyTypes.length)];
      }

      const expiresAt = new Date(Date.now() + def.durationHours * 60 * 60 * 1000);

      activeBoss = await prisma.worldBoss.create({
        data: {
          guildId,
          name: def.name,
          type: def.type,
          category: def.category,
          maxHp: def.maxHp,
          currentHp: def.maxHp,
          status: 'ACTIVE',
          expiresAt,
        },
        include: {
          damageLogs: {
            include: { player: true },
            orderBy: { damageDealt: 'desc' },
          },
        },
      });
    }

    return activeBoss;
  }

  // Atacar al World Boss con Selección Táctica de Acción
  static async attackBoss(
    playerId: string,
    bossId: string,
    actionType: 'FRONTAL' | 'COVER' | 'ITEM' | 'TAUNT' = 'FRONTAL'
  ) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, bodyParts: true, inventory: { include: { item: true } }, wallet: true },
      });

      if (!player || !player.stats || !player.bodyParts || !player.wallet) {
        throw new Error('Jugador no encontrado.');
      }

      const now = new Date();
      if (player.hospitalUntil && player.hospitalUntil > now) {
        throw new Error('🏥 Estás hospitalizado y no puedes participar en el combate contra el Boss.');
      }

      if (player.jailUntil && player.jailUntil > now) {
        throw new Error('🚨 Estás encarcelado y no puedes participar en el combate contra el Boss.');
      }

      // Determinar consumo de energía según acción táctica
      let energyCost = 25;
      if (actionType === 'COVER') energyCost = 30;
      if (actionType === 'ITEM') energyCost = 20;
      if (actionType === 'TAUNT') energyCost = 15;

      if (player.stats.energy < energyCost) {
        throw new Error(`⚡ Energía insuficiente para la acción táctica. Requiere **${energyCost}⚡** y tienes **${player.stats.energy}⚡**.`);
      }

      const boss = await tx.worldBoss.findUnique({
        where: { id: bossId },
      });

      if (!boss || boss.status !== 'ACTIVE' || boss.expiresAt <= now) {
        throw new Error('El Boss ya no se encuentra activo o ha sido derrotado.');
      }

      let factionMember: any = null;
      if (boss.category === 'WEEKLY_FACTION') {
        factionMember = await tx.factionMember.findUnique({ where: { playerId } });
        if (!factionMember) {
          throw new Error('🔒 Los Bosses Semanales son exclusivos para miembros de una Facción. ¡Únete a una facción para participar!');
        }
      }

      // Procesar acción de ÍTEM si aplica
      let usedMedicalItemName = '';
      let healedHp = 0;
      if (actionType === 'ITEM') {
        const medicalInv = player.inventory.find((i) => i.item.type === 'MEDICAL' && i.quantity > 0);
        if (!medicalInv) {
          throw new Error('💊 No tienes ningún objeto médico (botiquín, vendas) en tu inventario para usar en combate.');
        }

        usedMedicalItemName = medicalInv.item.name;
        healedHp = Math.min(30, 100 - player.bodyParts.torsoHp);

        if (medicalInv.quantity > 1) {
          await tx.inventoryItem.update({
            where: { id: medicalInv.id },
            data: { quantity: medicalInv.quantity - 1 },
          });
        } else {
          await tx.inventoryItem.delete({ where: { id: medicalInv.id } });
        }

        await tx.bodyParts.update({
          where: { playerId },
          data: { torsoHp: player.bodyParts.torsoHp + healedHp },
        });
      }

      // Consumir energía
      await tx.stats.update({
        where: { playerId },
        data: { energy: player.stats.energy - energyCost },
      });

      // Calcular Fase actual del Boss
      const phaseInfo = getBossPhase(boss.currentHp, boss.maxHp);
      let phaseCounterMult = 1.0;
      let playerCritBonus = 0.0;

      if (phaseInfo.phase === 'ENRAGED') {
        phaseCounterMult = 1.5;
      } else if (phaseInfo.phase === 'DESPERATE') {
        phaseCounterMult = 2.0;
        playerCritBonus = 0.20; // +20% chance de crit en fase desesperada
      }

      // Seleccionar armas y calcular daño base del jugador
      const weapons = player.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
      const bestWeapon = weapons[0]?.item || { name: 'Puños', damage: 15, weaponType: 'MELEE' };

      let actionDamageMult = 1.0;
      if (actionType === 'COVER') actionDamageMult = 0.75;
      if (actionType === 'ITEM') actionDamageMult = 0.90;
      if (actionType === 'TAUNT') actionDamageMult = 0.50;

      // Habilidad del Alcaide Voss (Desarme / Melee bonus)
      if (boss.type === 'ALCAIDE_VOSS' && actionType !== 'COVER') {
        if (bestWeapon.weaponType === 'MELEE') {
          actionDamageMult += 0.20;
        } else {
          actionDamageMult -= 0.30;
        }
      }

      // Habilidad del Presidente Harrison (Escudo del Servicio Secreto)
      if (boss.type === 'PRESIDENTE_HARRISON' && boss.currentHp > boss.maxHp * 0.5 && actionType !== 'COVER') {
        actionDamageMult -= 0.20;
      }

      const isCrit = Math.random() < (0.10 + playerCritBonus);
      const critMult = isCrit ? 1.5 : 1.0;

      let rawDamage = Math.floor(
        bestWeapon.damage * (1 + player.stats.strength / 20) * (0.9 + Math.random() * 0.3) * actionDamageMult * critMult
      );

      // Evaluación de la Habilidad Especial de Payaso Pepino (Trip / Miss)
      let isTrippedByClown = false;
      if (boss.type === 'PAYASO_SINFORD' && actionType !== 'COVER' && Math.random() < 0.20) {
        isTrippedByClown = true;
        rawDamage = 0;
      }

      // Evaluación de Habilidad de Dra. Reyes (Toxicidad)
      if (boss.type === 'QUIMICA_REYES' && actionType !== 'COVER' && Math.random() < 0.25) {
        rawDamage = Math.floor(rawDamage * 0.85);
      }

      const damageDealt = Math.max(rawDamage, isTrippedByClown ? 0 : 30);
      const newBossHp = Math.max(0, boss.currentHp - damageDealt);
      const isDefeated = newBossHp <= 0;

      // Actualizar vida del Boss
      await tx.worldBoss.update({
        where: { id: boss.id },
        data: {
          currentHp: newBossHp,
          status: isDefeated ? 'DEFEATED' : 'ACTIVE',
          defeatedAt: isDefeated ? new Date() : null,
          lastHitBy: isDefeated ? player.username : boss.lastHitBy,
        },
      });

      // Bonus de daño asignado para la Facción con Taunt
      const effectiveLogDamage = actionType === 'TAUNT' ? Math.floor(damageDealt * 1.25) : damageDealt;

      const existingLog = await tx.worldBossDamage.findUnique({
        where: { bossId_playerId: { bossId: boss.id, playerId } },
      });

      if (existingLog) {
        await tx.worldBossDamage.update({
          where: { id: existingLog.id },
          data: {
            damageDealt: existingLog.damageDealt + effectiveLogDamage,
            attacksCount: existingLog.attacksCount + 1,
            factionId: factionMember ? factionMember.factionId : null,
          },
        });
      } else {
        await tx.worldBossDamage.create({
          data: {
            bossId: boss.id,
            playerId,
            factionId: factionMember ? factionMember.factionId : null,
            damageDealt: effectiveLogDamage,
            attacksCount: 1,
          },
        });
      }

      // Calcular contraataque del Boss
      let baseCounter = Math.floor((10 + Math.random() * 10) * phaseCounterMult);
      if (boss.type === 'GENERAL_VANCE' && actionType !== 'COVER') {
        baseCounter += 10;
      }

      // Si usó Cobertura Táctica, reduce el contraataque un 50%
      if (actionType === 'COVER') {
        baseCounter = Math.floor(baseCounter * 0.5);
      }

      let extraEffectNote = '';

      if (isTrippedByClown) {
        baseCounter += 15;
        extraEffectNote = '🤡 **¡Te tropezaste con el pastel de Pepino!** Fallaste el ataque y sufriste **15 HP** de auto-daño.';
      }

      // Habilidad de Chen El Fileteador (Tajazo Desangrante)
      if (boss.type === 'CHEN_CARNICERO' && actionType !== 'COVER' && Math.random() < 0.15) {
        baseCounter += 5;
        extraEffectNote = '🥩 **¡Chen te asestó un Tajazo Desangrante!** Sufriste +5 HP de sangrado extra.';
      }

      // Habilidad de Capitana Ibarra (Extorsión Policial)
      if (boss.type === 'CAPITANA_IBARRA' && actionType !== 'COVER' && Math.random() < 0.15 && player.wallet.cash >= 1000n) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: player.wallet.cash - 1000n },
        });
        extraEffectNote = '👮‍♀️ **¡Capitana Ibarra te cobró un "Impuesto de Tránsito"!** Perdiste **$1,000** de efectivo.';
      }

      // Habilidad de Don Carbone (Pagaré Mafioso)
      if (boss.type === 'DON_CARBONE' && actionType !== 'COVER' && player.wallet.cash >= 500n) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: player.wallet.cash - 500n },
        });
        extraEffectNote = '🎩 **¡Don Carbone te cobró extorsión mafiosa!** Te sustrajo **$500** en efectivo.';
      }

      const currentTorso = actionType === 'ITEM' ? player.bodyParts.torsoHp + healedHp : player.bodyParts.torsoHp;
      const newTorsoHp = Math.max(0, currentTorso - baseCounter);

      await tx.bodyParts.update({
        where: { playerId },
        data: { torsoHp: newTorsoHp },
      });

      const quote = this.getRandomBossQuote(boss.type, phaseInfo.phase);

      return {
        bossName: boss.name,
        bossType: boss.type,
        actionType,
        damageDealt,
        isCrit,
        remainingBossHp: newBossHp,
        isDefeated,
        counterDamage: baseCounter,
        phaseTitle: phaseInfo.title,
        phaseEmoji: phaseInfo.emoji,
        healedHp,
        usedMedicalItemName,
        extraEffectNote,
        quote,
      };
    });
  }

  // Reclamar Hitos Personales de Daño en Bosses Diarios
  static async claimDailyMilestones(playerId: string, bossId: string) {
    return prisma.$transaction(async (tx) => {
      const damageLog = await tx.worldBossDamage.findUnique({
        where: { bossId_playerId: { bossId, playerId } },
      });

      if (!damageLog || damageLog.damageDealt < 5000) {
        throw new Error('Requieres acumular al menos 5,000 de daño para reclamar el primer hito de recompensa.');
      }

      const totalDamage = damageLog.damageDealt;
      let rewardCash = 2500n;
      let rewardXp = 100;
      let milestoneTitle = 'Hito 1 (5,000 Daño)';

      if (totalDamage >= 35000) {
        rewardCash = 15000n;
        rewardXp = 500;
        milestoneTitle = 'Hito 3 (35,000 Daño Épico)';
      } else if (totalDamage >= 15000) {
        rewardCash = 7500n;
        rewardXp = 250;
        milestoneTitle = 'Hito 2 (15,000 Daño)';
      }

      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (!wallet) throw new Error('Cartera no encontrada.');

      await tx.wallet.update({
        where: { playerId },
        data: { cash: { increment: rewardCash } },
      });

      const player = await tx.player.findUnique({ where: { id: playerId } });
      if (player) {
        await tx.player.update({
          where: { id: playerId },
          data: { xp: player.xp + rewardXp },
        });
      }

      return { milestoneTitle, rewardCash, rewardXp, totalDamage };
    });
  }
}
