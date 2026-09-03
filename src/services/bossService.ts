import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';
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

export type BossTargetPart = 'HEAD' | 'TORSO' | 'LEFT_ARM' | 'RIGHT_ARM' | 'LEFT_LEG' | 'RIGHT_LEG';

export interface BossWeakSpot {
  partKey: BossTargetPart;
  partName: string;
  expiresAt: number;
  multiplier: number;
}

const activeWeakSpots: Record<string, BossWeakSpot> = {};

export function getOrGenerateWeakSpot(bossId: string): BossWeakSpot {
  const now = Date.now();
  const existing = activeWeakSpots[bossId];
  if (existing && existing.expiresAt > now) {
    return existing;
  }

  const parts: { key: BossTargetPart; name: string }[] = [
    { key: 'HEAD', name: '🧠 Cabeza (Trauma Craneal Expuesto)' },
    { key: 'TORSO', name: '🫀 Torso (Arteria Principal Expuesta)' },
    { key: 'LEFT_ARM', name: '💪 Brazo Izquierdo (Articulación Expuesta)' },
    { key: 'RIGHT_ARM', name: '💪 Brazo Derecho (Articulación Expuesta)' },
    { key: 'LEFT_LEG', name: '🦵 Pierna Izquierda (Tendón Expuesto)' },
    { key: 'RIGHT_LEG', name: '🦵 Pierna Derecha (Tendón Expuesto)' },
  ];

  const selected = parts[Math.floor(Math.random() * parts.length)];
  const newWeakSpot: BossWeakSpot = {
    partKey: selected.key,
    partName: selected.name,
    expiresAt: now + 45000, // 45s de duración en vivo
    multiplier: 2.5,
  };

  activeWeakSpots[bossId] = newWeakSpot;
  return newWeakSpot;
}

export type BossPhase = 'NORMAL' | 'ENRAGED' | 'DESPERATE';

export type BossCombatActionType =
  | 'ATK_PRIMARY'
  | 'ATK_SECONDARY'
  | 'ATK_MELEE'
  | 'TACTICAL_COVER'
  | 'TACTICAL_MED'
  | 'TACTICAL_THROWABLE'
  | 'FACTION_TAUNT'
  | 'FRONTAL'
  | 'COVER'
  | 'ITEM'
  | 'TAUNT';

export interface BossBodyParts {
  headHp: number;
  maxHeadHp: number;
  torsoHp: number;
  maxTorsoHp: number;
  leftArmHp: number;
  maxLeftArmHp: number;
  rightArmHp: number;
  maxRightArmHp: number;
  leftLegHp: number;
  maxLeftLegHp: number;
  rightLegHp: number;
  maxRightLegHp: number;
}

export function calculateBossBodyParts(currentHp: number, maxHp: number): BossBodyParts {
  const maxHeadHp = Math.floor(maxHp * 0.15);
  const maxTorsoHp = Math.floor(maxHp * 0.35);
  const maxLeftArmHp = Math.floor(maxHp * 0.125);
  const maxRightArmHp = Math.floor(maxHp * 0.125);
  const maxLeftLegHp = Math.floor(maxHp * 0.125);
  const maxRightLegHp = Math.floor(maxHp * 0.125);

  const ratio = Math.max(0, currentHp / maxHp);

  return {
    headHp: Math.floor(maxHeadHp * ratio),
    maxHeadHp,
    torsoHp: Math.floor(maxTorsoHp * ratio),
    maxTorsoHp,
    leftArmHp: Math.floor(maxLeftArmHp * ratio),
    maxLeftArmHp,
    rightArmHp: Math.floor(maxRightArmHp * ratio),
    maxRightArmHp,
    leftLegHp: Math.floor(maxLeftLegHp * ratio),
    maxLeftLegHp,
    rightLegHp: Math.floor(maxRightLegHp * ratio),
    maxRightLegHp,
  };
}

export interface BossAttackResult {
  bossName: string;
  bossType: string;
  actionType: BossCombatActionType;
  weaponName: string;
  isHit: boolean;
  damageDealt: number;
  isCrit: boolean;
  isWeakSpotHit?: boolean;
  activeWeakSpot?: BossWeakSpot;
  targetPart: BossTargetPart;
  remainingBossHp: number;
  bossMaxHp: number;
  bossBodyParts: BossBodyParts;
  bossPartStruck: string;
  isDefeated: boolean;
  counterDamage: number;
  bodyPartStruck: string;
  bodyPartDamage: number;
  updatedPlayerBody: {
    headHp: number;
    torsoHp: number;
    leftArmHp: number;
    rightArmHp: number;
    leftLegHp: number;
    rightLegHp: number;
  };
  isKnockedOut: boolean;
  hospitalMinutes: number;
  energyUsed: number;
  remainingEnergy: number;
  phaseTitle: string;
  phaseEmoji: string;
  healedHp?: number;
  usedMedicalItemName?: string;
  extraEffectNote?: string;
  quote: string;
}

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

  // Atacar al World Boss con Selección Táctica de Acción y Daño Anatómico
  static async attackBoss(
    playerId: string,
    bossId: string,
    rawActionType: BossCombatActionType = 'ATK_PRIMARY',
    targetPart: BossTargetPart = 'TORSO'
  ): Promise<BossAttackResult> {
    // Mapeo retrocompatible
    let actionType: BossCombatActionType = rawActionType;
    if (rawActionType === 'FRONTAL') actionType = 'ATK_PRIMARY';
    if (rawActionType === 'COVER') actionType = 'TACTICAL_COVER';
    if (rawActionType === 'ITEM') actionType = 'TACTICAL_MED';
    if (rawActionType === 'TAUNT') actionType = 'FACTION_TAUNT';

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
        const remainingMin = Math.ceil((player.hospitalUntil.getTime() - now.getTime()) / 60000);
        throw new Error(`🏥 Estás hospitalizado durante los próximos **${remainingMin} minutos**. Puedes usar un Botiquín rápido para darte el alta.`);
      }

      if (player.jailUntil && player.jailUntil > now) {
        throw new Error('🚨 Estás encarcelado y no puedes participar en el combate contra el Boss.');
      }

      // Determinar consumo de energía según acción táctica
      let energyCost = 25; // default para primaria
      if (actionType === 'ATK_SECONDARY' || actionType === 'ATK_MELEE') energyCost = 15;
      if (actionType === 'TACTICAL_COVER') energyCost = 10;
      if (actionType === 'TACTICAL_MED') energyCost = 15;
      if (actionType === 'TACTICAL_THROWABLE') energyCost = 20;
      if (actionType === 'FACTION_TAUNT') energyCost = 15;

      if (player.stats.energy < energyCost) {
        throw new Error(`⚡ Energía insuficiente para esta acción táctica. Requiere **${energyCost}⚡** y tienes **${player.stats.energy}⚡**.`);
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

      // Obtener o generar Punto Débil Expuesto en Tiempo Real
      const activeWeakSpot = getOrGenerateWeakSpot(boss.id);
      const isWeakSpotHit = targetPart === activeWeakSpot.partKey && Date.now() < activeWeakSpot.expiresAt;

      // 1. Procesar acción de ÍTEM MÉDICO si aplica
      let usedMedicalItemName = '';
      let healedHp = 0;
      const currentBody = { ...player.bodyParts };

      if (actionType === 'TACTICAL_MED') {
        const medicalInv = player.inventory.find((i) => i.item.type === 'MEDICAL' && i.quantity > 0);
        if (!medicalInv) {
          throw new Error('💊 No tienes ningún objeto médico (botiquín, vendas) en tu inventario para usar en combate.');
        }

        usedMedicalItemName = medicalInv.item.name;
        // Priorizar curación a Torso y Cabeza
        const torsoDeficit = 100 - currentBody.torsoHp;
        const headDeficit = 100 - currentBody.headHp;
        const totalHealPool = 40;

        const healTorso = Math.min(torsoDeficit, Math.floor(totalHealPool * 0.6));
        const healHead = Math.min(headDeficit, totalHealPool - healTorso);

        currentBody.torsoHp = Math.min(100, currentBody.torsoHp + healTorso);
        currentBody.headHp = Math.min(100, currentBody.headHp + healHead);
        currentBody.leftArmHp = Math.min(100, currentBody.leftArmHp + 10);
        currentBody.rightArmHp = Math.min(100, currentBody.rightArmHp + 10);
        healedHp = healTorso + healHead;

        if (medicalInv.quantity > 1) {
          await tx.inventoryItem.update({
            where: { id: medicalInv.id },
            data: { quantity: medicalInv.quantity - 1 },
          });
        } else {
          await tx.inventoryItem.delete({ where: { id: medicalInv.id } });
        }
      }

      // Consumir energía del jugador
      const remainingEnergy = player.stats.energy - energyCost;
      await tx.stats.update({
        where: { playerId },
        data: { energy: remainingEnergy },
      });

      // 2. Determinar fase y modificadores del Jefe
      const phaseInfo = getBossPhase(boss.currentHp, boss.maxHp);
      let phaseCounterMult = 1.0;
      let playerCritBonus = 0.0;

      if (phaseInfo.phase === 'ENRAGED') {
        phaseCounterMult = 1.35;
      } else if (phaseInfo.phase === 'DESPERATE') {
        phaseCounterMult = 1.75;
        playerCritBonus = 0.15; // +15% probabilidad de crítico en fase desesperada
      }

      // 3. Selección de Armamento según acción
      const equippedWeapons = player.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
      const primaryWep = equippedWeapons.find((i) => i.slot === 'PRIMARY')?.item;
      const secondaryWep = equippedWeapons.find((i) => i.slot === 'SECONDARY')?.item;
      const meleeWep = equippedWeapons.find((i) => i.slot === 'MELEE')?.item;

      let chosenWeapon: { name: string; damage: number; accuracy: number; weaponType?: string | null } = {
        name: 'Puños',
        damage: 15,
        accuracy: 50.0,
        weaponType: 'MELEE',
      };

      if (actionType === 'ATK_PRIMARY') {
        chosenWeapon = primaryWep || secondaryWep || meleeWep || chosenWeapon;
      } else if (actionType === 'ATK_SECONDARY') {
        chosenWeapon = secondaryWep || meleeWep || chosenWeapon;
      } else if (actionType === 'ATK_MELEE') {
        chosenWeapon = meleeWep || chosenWeapon;
      } else if (actionType === 'TACTICAL_THROWABLE') {
        chosenWeapon = { name: 'Granada Táctica', damage: 45, accuracy: 75.0, weaponType: 'Heavy Artillery' };
      } else if (actionType === 'TACTICAL_COVER') {
        chosenWeapon = { name: 'Disparo de Cobertura', damage: 12, accuracy: 40.0, weaponType: 'Pistol' };
      }

      // 4. Modificadores de Apuntado Anatómico Objetivo
      let targetAccuracyPenalty = 0.0;
      let targetDamageMult = 1.0;
      let bossPartStruckName = '🫀 Torso del Jefe';

      if (targetPart === 'HEAD') {
        targetAccuracyPenalty = 0.20; // Disparo a la cabeza es más difícil
        targetDamageMult = 1.75; // Alto impacto crítico
        bossPartStruckName = '🧠 Cabeza del Jefe';
      } else if (targetPart === 'TORSO') {
        targetAccuracyPenalty = -0.10; // Masa corporal grande (+10% acierto)
        targetDamageMult = 1.0;
        bossPartStruckName = '🫀 Torso del Jefe';
      } else if (targetPart === 'LEFT_ARM') {
        targetAccuracyPenalty = 0.05;
        targetDamageMult = 1.0;
        bossPartStruckName = '💪 Brazo Izquierdo del Jefe';
      } else if (targetPart === 'RIGHT_ARM') {
        targetAccuracyPenalty = 0.05;
        targetDamageMult = 1.0;
        bossPartStruckName = '💪 Brazo Derecho del Jefe';
      } else if (targetPart === 'LEFT_LEG') {
        targetAccuracyPenalty = 0.05;
        targetDamageMult = 1.0;
        bossPartStruckName = '🦵 Pierna Izquierda del Jefe';
      } else if (targetPart === 'RIGHT_LEG') {
        targetAccuracyPenalty = 0.05;
        targetDamageMult = 1.0;
        bossPartStruckName = '🦵 Pierna Derecha del Jefe';
      }

      // Multiplicador por Punto Débil Expuesto
      if (isWeakSpotHit) {
        targetDamageMult *= activeWeakSpot.multiplier; // x2.5
      }

      // 5. Penalizaciones por extremidades dañadas del jugador
      let accuracyPenalty = targetAccuracyPenalty;
      let damagePenalty = 0.0;
      if (currentBody.leftArmHp < 40 || currentBody.rightArmHp < 40) {
        accuracyPenalty += 0.10;
      }
      if (currentBody.leftArmHp < 30 && currentBody.rightArmHp < 30) {
        accuracyPenalty += 0.15;
        damagePenalty += 0.15;
      }

      // 6. Cálculo de Acierto (Hit Chance estilo Torn)
      const attackerSpeed = player.stats.speed;
      const bossDex = 20.0;
      const weaponAcc = chosenWeapon.accuracy || 50.0;
      const hitChance = Math.min(
        Math.max(0.5 * (attackerSpeed / bossDex) * (weaponAcc / 50.0) - accuracyPenalty, 0.15),
        0.95
      );
      const isHit = actionType === 'TACTICAL_MED' ? false : Math.random() <= hitChance;

      // 7. Cálculo de Daño al Jefe
      let rawDamage = 0;
      let isCrit = false;
      let bossNegatedDamage = false;

      if (isHit) {
        let actionDamageMult = 1.0;
        if (actionType === 'TACTICAL_COVER') actionDamageMult = 0.50;
        if (actionType === 'FACTION_TAUNT') actionDamageMult = 0.60;
        if (actionType === 'ATK_PRIMARY') actionDamageMult = 1.15;
        if (actionType === 'TACTICAL_THROWABLE') actionDamageMult = 1.30;

        // Modificadores de pasivas de jefes
        if (boss.type === 'ALCAIDE_VOSS') {
          if (chosenWeapon.weaponType === 'MELEE') {
            actionDamageMult += 0.20;
          } else {
            actionDamageMult -= 0.30;
          }
        }
        if (boss.type === 'PRESIDENTE_HARRISON' && boss.currentHp > boss.maxHp * 0.5) {
          actionDamageMult -= 0.20;
        }

        isCrit = Math.random() < (0.12 + playerCritBonus);
        const critMult = isCrit ? 1.65 : 1.0;

        const statRatio = Math.sqrt(player.stats.strength / 15.0);
        const randomFactor = 0.85 + Math.random() * 0.3;
        rawDamage = Math.floor(
          chosenWeapon.damage * statRatio * actionDamageMult * targetDamageMult * critMult * (1.0 - damagePenalty) * randomFactor
        );

        // Habilidad de Payaso Pepino (Trip)
        if (boss.type === 'PAYASO_SINFORD' && actionType !== 'TACTICAL_COVER' && Math.random() < 0.15) {
          bossNegatedDamage = true;
        }

        // Habilidad de Dra. Reyes (Toxicidad)
        if (boss.type === 'QUIMICA_REYES' && actionType !== 'TACTICAL_COVER' && Math.random() < 0.20) {
          rawDamage = Math.floor(rawDamage * 0.85);
        }
      }

      const damageDealt = isHit && !bossNegatedDamage ? Math.max(rawDamage, 25) : 0;
      const newBossHp = Math.max(0, boss.currentHp - damageDealt);
      const isDefeated = newBossHp <= 0;

      const bossBodyParts = calculateBossBodyParts(newBossHp, boss.maxHp);

      // Actualizar vida del Boss en DB
      await tx.worldBoss.update({
        where: { id: boss.id },
        data: {
          currentHp: newBossHp,
          status: isDefeated ? 'DEFEATED' : 'ACTIVE',
          defeatedAt: isDefeated ? new Date() : null,
          lastHitBy: isDefeated ? player.username : boss.lastHitBy,
        },
      });

      // Registro de daño acumulado
      const effectiveLogDamage = actionType === 'FACTION_TAUNT' ? Math.floor(damageDealt * 1.25) : damageDealt;
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

      // 7. Contraataque del Boss (Distribuido a las 6 Partes Corporales)
      let baseCounter = Math.floor((12 + Math.random() * 12) * phaseCounterMult);
      if (boss.type === 'GENERAL_VANCE' && actionType !== 'TACTICAL_COVER') {
        baseCounter += 10;
      }

      // Reducción por Cobertura Táctica
      if (actionType === 'TACTICAL_COVER') {
        baseCounter = Math.floor(baseCounter * 0.40);
      }

      // Selección de Parte Corporal Objetivo del Jugador (Ponderada)
      const partRoll = Math.random();
      let targetPartKey: 'headHp' | 'torsoHp' | 'leftArmHp' | 'rightArmHp' | 'leftLegHp' | 'rightLegHp' = 'torsoHp';
      let targetPartName = '🫀 Torso';
      let partMultiplier = 1.0;

      if (partRoll < 0.40) {
        targetPartKey = 'torsoHp';
        targetPartName = '🫀 Torso';
        partMultiplier = 1.0;
      } else if (partRoll < 0.55) {
        targetPartKey = 'headHp';
        targetPartName = '🧠 Cabeza';
        partMultiplier = 1.3;
      } else if (partRoll < 0.68) {
        targetPartKey = 'leftArmHp';
        targetPartName = '💪 Brazo Izquierdo';
        partMultiplier = 0.8;
      } else if (partRoll < 0.80) {
        targetPartKey = 'rightArmHp';
        targetPartName = '💪 Brazo Derecho';
        partMultiplier = 0.8;
      } else if (partRoll < 0.90) {
        targetPartKey = 'leftLegHp';
        targetPartName = '🦵 Pierna Izquierda';
        partMultiplier = 0.8;
      } else {
        targetPartKey = 'rightLegHp';
        targetPartName = '🦵 Pierna Derecha';
        partMultiplier = 0.8;
      }

      // Si está en cobertura, desviar impactos críticos de cabeza/torso
      if (actionType === 'TACTICAL_COVER' && (targetPartKey === 'headHp' || targetPartKey === 'torsoHp')) {
        targetPartKey = 'leftArmHp';
        targetPartName = '🛡️ Cobertura (Brazo Izq)';
        partMultiplier = 0.5;
      }

      const bodyPartDamage = Math.max(Math.floor(baseCounter * partMultiplier), 4);
      currentBody[targetPartKey] = Math.max(0, currentBody[targetPartKey] - bodyPartDamage);

      // Efectos adicionales de habilidades de jefes
      let extraEffectNote = '';
      if (bossNegatedDamage) {
        extraEffectNote = '🤡 **¡Resbalaste con un globo de agua de Pepino y fallaste el golpe!**';
      }

      if (boss.type === 'CHEN_CARNICERO' && actionType !== 'TACTICAL_COVER' && Math.random() < 0.15) {
        currentBody.torsoHp = Math.max(0, currentBody.torsoHp - 5);
        extraEffectNote = (extraEffectNote ? extraEffectNote + '\n' : '') + '🥩 **¡Chen te asestó un Tajazo Desangrante!** (+5 HP de sangrado extra al torso).';
      }

      if (boss.type === 'CAPITANA_IBARRA' && actionType !== 'TACTICAL_COVER' && Math.random() < 0.15 && player.wallet.cash >= 1000n) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: player.wallet.cash - 1000n },
        });
        extraEffectNote = (extraEffectNote ? extraEffectNote + '\n' : '') + '👮‍♀️ **¡Capitana Ibarra te cobró un "Impuesto de Tránsito"!** Perdiste **$1,000** en efectivo.';
      }

      if (boss.type === 'DON_CARBONE' && actionType !== 'TACTICAL_COVER' && player.wallet.cash >= 500n) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: player.wallet.cash - 500n },
        });
        extraEffectNote = (extraEffectNote ? extraEffectNote + '\n' : '') + '🎩 **¡Don Carbone te cobró extorsión mafiosa!** Perdiste **$500** en efectivo.';
      }

      // 8. Verificar Estado de Noqueo / Hospitalización Justa
      const isKnockedOut = currentBody.torsoHp <= 0 || currentBody.headHp <= 0;
      let hospitalMinutes = 0;

      if (isKnockedOut) {
        hospitalMinutes = 5; // Triage corto de 5 minutos
        const hospitalUntil = new Date(Date.now() + hospitalMinutes * 60 * 1000);
        await tx.player.update({
          where: { id: playerId },
          data: { hospitalUntil },
        });
      }

      // Guardar salud corporal actualizada
      await tx.bodyParts.update({
        where: { playerId },
        data: {
          headHp: currentBody.headHp,
          torsoHp: currentBody.torsoHp,
          leftArmHp: currentBody.leftArmHp,
          rightArmHp: currentBody.rightArmHp,
          leftLegHp: currentBody.leftLegHp,
          rightLegHp: currentBody.rightLegHp,
        },
      });

      const quote = this.getRandomBossQuote(boss.type, phaseInfo.phase);

      await PlayerService.addXp(playerId, 25, tx);

      return {
        bossName: boss.name,
        bossType: boss.type,
        actionType,
        weaponName: chosenWeapon.name,
        isHit,
        damageDealt,
        isCrit,
        isWeakSpotHit,
        activeWeakSpot,
        targetPart,
        remainingBossHp: newBossHp,
        bossMaxHp: boss.maxHp,
        bossBodyParts,
        bossPartStruck: isHit && damageDealt > 0 ? bossPartStruckName : 'Ninguna (Ataque fallido)',
        isDefeated,
        counterDamage: baseCounter,
        bodyPartStruck: targetPartName,
        bodyPartDamage,
        updatedPlayerBody: currentBody,
        isKnockedOut,
        hospitalMinutes,
        energyUsed: energyCost,
        remainingEnergy,
        phaseTitle: phaseInfo.title,
        phaseEmoji: phaseInfo.emoji,
        healedHp,
        usedMedicalItemName,
        extraEffectNote,
        quote,
      };
    });
  }

  // Curación Rápida con Botiquín desde el Combate o Hospital
  static async quickMedicalHeal(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { bodyParts: true, inventory: { include: { item: true } } },
      });

      if (!player || !player.bodyParts) throw new Error('Jugador no encontrado.');

      const medItem = player.inventory.find((i) => i.item.type === 'MEDICAL' && i.quantity > 0);
      if (!medItem) {
        throw new Error('💊 No tienes ningún objeto médico en tu inventario.');
      }

      // Curar 40 HP a Torso y Cabeza, y 25 HP al resto
      const newTorso = Math.min(100, player.bodyParts.torsoHp + 40);
      const newHead = Math.min(100, player.bodyParts.headHp + 40);
      const newLeftArm = Math.min(100, player.bodyParts.leftArmHp + 25);
      const newRightArm = Math.min(100, player.bodyParts.rightArmHp + 25);
      const newLeftLeg = Math.min(100, player.bodyParts.leftLegHp + 25);
      const newRightLeg = Math.min(100, player.bodyParts.rightLegHp + 25);

      await tx.bodyParts.update({
        where: { playerId },
        data: {
          torsoHp: newTorso,
          headHp: newHead,
          leftArmHp: newLeftArm,
          rightArmHp: newRightArm,
          leftLegHp: newLeftLeg,
          rightLegHp: newRightLeg,
        },
      });

      // Si estaba hospitalizado, darle el alta médica inmediata si torso/cabeza están estabilizados
      if (player.hospitalUntil && newTorso >= 30 && newHead >= 30) {
        await tx.player.update({
          where: { id: playerId },
          data: { hospitalUntil: null },
        });
      }

      // Restar 1 unidad
      if (medItem.quantity > 1) {
        await tx.inventoryItem.update({
          where: { id: medItem.id },
          data: { quantity: medItem.quantity - 1 },
        });
      } else {
        await tx.inventoryItem.delete({ where: { id: medItem.id } });
      }

      return {
        itemName: medItem.item.name,
        torsoHp: newTorso,
        headHp: newHead,
      };
    });
  }

  // Recarga Rápida de Energía desde el Combate
  static async quickEnergyDrink(playerId: string) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, inventory: { include: { item: true } } },
      });

      if (!player || !player.stats) throw new Error('Jugador no encontrado.');

      // Buscar consumible energético (efecto addEnergy)
      const energyItem = player.inventory.find((i) => {
        if (i.quantity <= 0) return false;
        if (!i.item.effect) return false;
        try {
          const eff = JSON.parse(i.item.effect);
          return !!eff.addEnergy;
        } catch {
          return false;
        }
      });

      if (!energyItem) {
        throw new Error('🔋 No tienes ningún energizante o consumible de energía en tu inventario.');
      }

      const eff = JSON.parse(energyItem.item.effect!);
      const addEnergy = eff.addEnergy || 25;
      const newEnergy = Math.min(player.stats.energy + addEnergy, player.stats.maxEnergy + 100);

      await tx.stats.update({
        where: { playerId },
        data: { energy: newEnergy },
      });

      if (energyItem.quantity > 1) {
        await tx.inventoryItem.update({
          where: { id: energyItem.id },
          data: { quantity: energyItem.quantity - 1 },
        });
      } else {
        await tx.inventoryItem.delete({ where: { id: energyItem.id } });
      }

      return {
        itemName: energyItem.item.name,
        addEnergy,
        currentEnergy: newEnergy,
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

