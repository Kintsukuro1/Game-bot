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
}

export const BOSS_DEFINITIONS: Record<string, BossDefinition> = {
  CHEN_CARNICERO: {
    type: 'CHEN_CARNICERO',
    category: 'DAILY',
    name: '🥩 Chen "El Fileteador" (El Carnicero del Barrio Chino)',
    maxHp: 250000,
    description: 'Carnicero impulsivo de la Tríada de la Flor de Loto. Empuña dos hachas de deshuesar y habla mezclando español con chino.',
    durationHours: 24,
  },
  PRESIDENTE_HARRISON: {
    type: 'PRESIDENTE_HARRISON',
    category: 'WEEKLY_FACTION',
    name: '🏛️ El Presidente Corrupto ("Presidente Harrison")',
    maxHp: 10000000,
    description: 'Mandatario corrupto escoltado por el Servicio Secreto y mercenarios de elite.',
    durationHours: 52,
  },
  GENERAL_VANCE: {
    type: 'GENERAL_VANCE',
    category: 'WEEKLY_FACTION',
    name: '🪖 El Jefe Militar ("General Vance")',
    maxHp: 8000000,
    description: 'Comandante supremo de la base militar Fuerte Sinford. Opera desde un búnker blindado.',
    durationHours: 52,
  },
  DON_CARBONE: {
    type: 'DON_CARBONE',
    category: 'WEEKLY_FACTION',
    name: '🎩 El Capo de la Mafia ("Don Ernesto Carbone")',
    maxHp: 6000000,
    description: 'El Padrino de la mafia italiana de Sinford. Controla el inframundo y la extorsión.',
    durationHours: 52,
  },
};

export class BossService {
  // Citas cómicas y dramáticas de los World Bosses
  static getRandomBossQuote(type: string): string {
    if (type === 'CHEN_CARNICERO') {
      const quotes = [
        '🥩 Chen "El Fileteador": "¡Nǐ hǎo, pendejo! ¿Tú vienes a comprar corte de primera o vienes a ser la carne del caldo de hoy?"',
        '🥩 Chen "El Fileteador": "¡Aiyaaaa! ¡Tú manchaste mi delantal limpio! Ahora te voy a hacer char siu (cerdo asado) en 5 segundos, hǎo bu hǎo?"',
        '🥩 Chen "El Fileteador": "¡Xièxie por la visita! ¡Toma este tajazo con 100% de descuento directo a tu cabeza!"',
        '🥩 Chen "El Fileteador": "¿Tú preguntas qué clase de carne es esta del gancho? ...Tú mejor no quieras saber. Solo come y no hagas preguntas."',
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (type === 'PRESIDENTE_HARRISON') {
      return '🏛️ Presidente Harrison: "Tienen a toda la ciudad en su contra, pandilleros. Mi Servicio Secreto los convertirá en polvo."';
    }

    if (type === 'GENERAL_VANCE') {
      return '🪖 General Vance: "Esto no es una pelea de callejones, es una guerra abierta. ¡Preparen el bombardeo de morteros!"';
    }

    if (type === 'DON_CARBONE') {
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
        def = BOSS_DEFINITIONS.CHEN_CARNICERO;
      } else {
        const weeklyTypes = [BOSS_DEFINITIONS.PRESIDENTE_HARRISON, BOSS_DEFINITIONS.GENERAL_VANCE, BOSS_DEFINITIONS.DON_CARBONE];
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

  // Atacar al World Boss (25⚡ de energía)
  static async attackBoss(playerId: string, bossId: string) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { stats: true, bodyParts: true, inventory: { include: { item: true } } },
      });

      if (!player || !player.stats || !player.bodyParts) {
        throw new Error('Jugador no encontrado.');
      }

      const now = new Date();
      if (player.hospitalUntil && player.hospitalUntil > now) {
        throw new Error('🏥 Estás hospitalizado y no puedes participar en el ataque al Boss.');
      }

      if (player.jailUntil && player.jailUntil > now) {
        throw new Error('🚨 Estás encarcelado y no puedes participar en el ataque al Boss.');
      }

      if (player.stats.energy < 25) {
        throw new Error(`⚡ Energía insuficiente. Atacar al Boss requiere **25⚡** y tienes **${player.stats.energy}⚡**.`);
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

      // Consumir 25⚡
      await tx.stats.update({
        where: { playerId },
        data: { energy: player.stats.energy - 25 },
      });

      // Calcular daño del atacante
      const weapons = player.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
      const bestWeapon = weapons[0]?.item || { name: 'Puños', damage: 15 };
      const rawDamage = Math.floor(bestWeapon.damage * (1 + player.stats.strength / 20) * (0.9 + Math.random() * 0.3));
      const damageDealt = Math.max(rawDamage, 50);

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

      // Registrar o actualizar daño del jugador
      const existingLog = await tx.worldBossDamage.findUnique({
        where: { bossId_playerId: { bossId: boss.id, playerId } },
      });

      if (existingLog) {
        await tx.worldBossDamage.update({
          where: { id: existingLog.id },
          data: {
            damageDealt: existingLog.damageDealt + damageDealt,
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
            damageDealt,
            attacksCount: 1,
          },
        });
      }

      // Contraataque del Boss (Causa 10-20 daño al torso)
      const counterDamage = Math.floor(10 + Math.random() * 10);
      const newTorsoHp = Math.max(0, player.bodyParts.torsoHp - counterDamage);

      await tx.bodyParts.update({
        where: { playerId },
        data: { torsoHp: newTorsoHp },
      });

      const quote = this.getRandomBossQuote(boss.type);

      return {
        bossName: boss.name,
        bossType: boss.type,
        damageDealt,
        remainingBossHp: newBossHp,
        isDefeated,
        counterDamage,
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
