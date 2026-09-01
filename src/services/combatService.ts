import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';
import { MasteryService } from './masteryService.js';
import { COMBAT_ENERGY_COST, NEWBIE_LEVEL_PROTECTION } from '../config/constants.js';

export interface CombatTurn {
  turnNumber: number;
  attackerName: string;
  weaponName: string;
  bodyPart: string;
  isHit: boolean;
  isCritical: boolean;
  damage: number;
  remainingHp: number;
}

export interface CombatResult {
  winnerId: string;
  loserId: string;
  winnerUsername: string;
  loserUsername: string;
  turns: CombatTurn[];
  totalDamageDealt: number;
}

export class CombatService {
  // Constantes de combate
  static ENERGY_COST = COMBAT_ENERGY_COST;
  static NEWBIE_LEVEL_PROTECTION = NEWBIE_LEVEL_PROTECTION;

  // 1. Validaciones previas al combate
  static async validateCombat(attackerDiscordId: string, defenderDiscordId: string, guildId: string = 'GLOBAL') {
    if (attackerDiscordId === defenderDiscordId) {
      throw new Error('❌ No puedes atacarte a ti mismo.');
    }

    const attacker = await PlayerService.getPlayerByDiscordId(attackerDiscordId, guildId);

    if (!attacker || !attacker.stats) {
      throw new Error('❌ Debes estar registrado con `/empezar` para atacar.');
    }

    if (attacker.stats.energy < this.ENERGY_COST) {
      throw new Error(`⚡ Energía insuficiente para atacar. Requiere **${this.ENERGY_COST}⚡** y tienes **${attacker.stats.energy}⚡**.`);
    }

    const defender = await PlayerService.getPlayerByDiscordId(defenderDiscordId, guildId);

    if (!defender || !defender.stats || !defender.bodyParts) {
      throw new Error('❌ El jugador objetivo no está registrado o no existe en este servidor.');
    }

    // Protección de novatos
    if (defender.level < this.NEWBIE_LEVEL_PROTECTION) {
      throw new Error(`🛡️ El jugador **${defender.username}** tiene protección de novato (Nivel menor a ${this.NEWBIE_LEVEL_PROTECTION}).`);
    }

    // Verificación de Hospital y Cárcel
    const now = new Date();
    if (defender.hospitalUntil && defender.hospitalUntil > now) {
      const remainingMin = Math.ceil((defender.hospitalUntil.getTime() - now.getTime()) / 60000);
      throw new Error(`🏥 **${defender.username}** está hospitalizado durante los próximos ${remainingMin} minutos.`);
    }

    if (defender.jailUntil && defender.jailUntil > now) {
      const remainingMin = Math.ceil((defender.jailUntil.getTime() - now.getTime()) / 60000);
      throw new Error(`🚨 **${defender.username}** está en prisión durante los próximos ${remainingMin} minutos.`);
    }

    return { attacker, defender };
  }

  // 2. Motor de combate turno por turno bidireccional (Fórmulas de Torn Wiki)
  static async executePvPCombat(attackerDiscordId: string, defenderDiscordId: string, guildId: string = 'GLOBAL'): Promise<CombatResult> {
    const { attacker, defender } = await this.validateCombat(attackerDiscordId, defenderDiscordId, guildId);

    // Consumir 25⚡ de energía del atacante atómicamente
    await prisma.stats.update({
      where: { playerId: attacker.id },
      data: { energy: attacker.stats!.energy - this.ENERGY_COST },
    });

    // Obtener armas equipadas del atacante
    const attackerWeapons = attacker.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
    const attackerWeapon = attackerWeapons.find((i) => i.slot === 'PRIMARY')?.item ||
      attackerWeapons.find((i) => i.slot === 'SECONDARY')?.item ||
      attackerWeapons.find((i) => i.slot === 'MELEE')?.item || {
        name: 'Puños desnudos',
        damage: 15,
        accuracy: 50.0,
        slot: 'MELEE',
      };

    // Obtener armas equipadas del defensor
    const defenderWeapons = defender.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
    const defenderWeapon = defenderWeapons.find((i) => i.slot === 'PRIMARY')?.item ||
      defenderWeapons.find((i) => i.slot === 'SECONDARY')?.item ||
      defenderWeapons.find((i) => i.slot === 'MELEE')?.item || {
        name: 'Puños desnudos',
        damage: 15,
        accuracy: 50.0,
        slot: 'MELEE',
      };

    const attackerBody = { ...attacker.bodyParts! };
    const defenderBody = { ...defender.bodyParts! };

    const calcTotalHp = (body: typeof attackerBody) =>
      body.headHp + body.torsoHp + body.leftArmHp + body.rightArmHp + body.leftLegHp + body.rightLegHp;

    const attackerInitialHp = calcTotalHp(attackerBody);
    const defenderInitialHp = calcTotalHp(defenderBody);
    let attackerTotalHp = attackerInitialHp;
    let defenderTotalHp = defenderInitialHp;

    const turns: CombatTurn[] = [];
    const bodyPartList = ['headHp', 'torsoHp', 'leftArmHp', 'rightArmHp', 'leftLegHp', 'rightLegHp'] as const;
    const bodyPartNames: Record<string, string> = {
      headHp: '🧠 Cabeza',
      torsoHp: '🫀 Torso',
      leftArmHp: '💪 Brazo Izquierdo',
      rightArmHp: '💪 Brazo Derecho',
      leftLegHp: '🦵 Pierna Izquierda',
      rightLegHp: '🦵 Pierna Derecha',
    };

    let turnCount = 1;
    let totalDamageDealtByAttacker = 0;

    // Simular hasta 10 rondas de combate bidireccional
    while (turnCount <= 10 && defenderTotalHp > 0 && attackerTotalHp > 0) {
      // --- FASE A: Golpe del Atacante ---
      const atkSpeed = attacker.stats!.speed;
      const defDex = defender.stats!.dexterity;
      const atkWeaponAcc = attackerWeapon.accuracy || 50.0;

      const atkHitChance = Math.min(Math.max(0.5 * (atkSpeed / Math.max(defDex, 0.1)) * (atkWeaponAcc / 50), 0.1), 0.95);
      const isAtkHit = Math.random() <= atkHitChance;

      if (!isAtkHit) {
        turns.push({
          turnNumber: turnCount,
          attackerName: attacker.username,
          weaponName: attackerWeapon.name,
          bodyPart: 'Ninguna (Fallo)',
          isHit: false,
          isCritical: false,
          damage: 0,
          remainingHp: defenderTotalHp,
        });
      } else {
        const targetPart = bodyPartList[Math.floor(Math.random() * bodyPartList.length)];
        const partMultiplier = targetPart === 'headHp' ? 1.5 : targetPart === 'torsoHp' ? 1.0 : 0.8;
        const statRatio = Math.sqrt(attacker.stats!.strength / Math.max(defender.stats!.defense, 0.1));
        const isCrit = Math.random() < 0.15;
        const critMultiplier = isCrit ? 1.75 : 1.0;
        const randomFactor = 0.85 + Math.random() * 0.3;

        const rawDmg = attackerWeapon.damage * statRatio * partMultiplier * critMultiplier * randomFactor;
        const finalDmg = Math.max(Math.round(rawDmg), 5);

        defenderBody[targetPart] = Math.max(defenderBody[targetPart] - finalDmg, 0);
        defenderTotalHp = calcTotalHp(defenderBody);
        totalDamageDealtByAttacker += finalDmg;

        turns.push({
          turnNumber: turnCount,
          attackerName: attacker.username,
          weaponName: attackerWeapon.name,
          bodyPart: bodyPartNames[targetPart],
          isHit: true,
          isCritical: isCrit,
          damage: finalDmg,
          remainingHp: defenderTotalHp,
        });
      }

      // Si el defensor fue noqueado, termina el combate
      if (defenderTotalHp <= 0) break;

      // --- FASE B: Contraataque del Defensor ---
      const defSpeed = defender.stats!.speed;
      const atkDex = attacker.stats!.dexterity;
      const defWeaponAcc = defenderWeapon.accuracy || 50.0;

      const defHitChance = Math.min(Math.max(0.5 * (defSpeed / Math.max(atkDex, 0.1)) * (defWeaponAcc / 50), 0.1), 0.95);
      const isDefHit = Math.random() <= defHitChance;

      if (!isDefHit) {
        turns.push({
          turnNumber: turnCount,
          attackerName: defender.username,
          weaponName: defenderWeapon.name,
          bodyPart: 'Ninguna (Fallo)',
          isHit: false,
          isCritical: false,
          damage: 0,
          remainingHp: attackerTotalHp,
        });
      } else {
        const targetPart = bodyPartList[Math.floor(Math.random() * bodyPartList.length)];
        const partMultiplier = targetPart === 'headHp' ? 1.5 : targetPart === 'torsoHp' ? 1.0 : 0.8;
        const statRatio = Math.sqrt(defender.stats!.strength / Math.max(attacker.stats!.defense, 0.1));
        const isCrit = Math.random() < 0.15;
        const critMultiplier = isCrit ? 1.75 : 1.0;
        const randomFactor = 0.85 + Math.random() * 0.3;

        const rawDmg = defenderWeapon.damage * statRatio * partMultiplier * critMultiplier * randomFactor;
        const finalDmg = Math.max(Math.round(rawDmg), 5);

        attackerBody[targetPart] = Math.max(attackerBody[targetPart] - finalDmg, 0);
        attackerTotalHp = calcTotalHp(attackerBody);

        turns.push({
          turnNumber: turnCount,
          attackerName: defender.username,
          weaponName: defenderWeapon.name,
          bodyPart: bodyPartNames[targetPart],
          isHit: true,
          isCritical: isCrit,
          damage: finalDmg,
          remainingHp: attackerTotalHp,
        });
      }

      // Si el atacante fue noqueado, termina el combate
      if (attackerTotalHp <= 0) break;

      turnCount++;
    }

    // Actualizar salud corporal de ambos combatientes en base de datos
    await prisma.$transaction([
      prisma.bodyParts.update({
        where: { playerId: defender.id },
        data: {
          headHp: defenderBody.headHp,
          torsoHp: defenderBody.torsoHp,
          leftArmHp: defenderBody.leftArmHp,
          rightArmHp: defenderBody.rightArmHp,
          leftLegHp: defenderBody.leftLegHp,
          rightLegHp: defenderBody.rightLegHp,
        },
      }),
      prisma.bodyParts.update({
        where: { playerId: attacker.id },
        data: {
          headHp: attackerBody.headHp,
          torsoHp: attackerBody.torsoHp,
          leftArmHp: attackerBody.leftArmHp,
          rightArmHp: attackerBody.rightArmHp,
          leftLegHp: attackerBody.leftLegHp,
          rightLegHp: attackerBody.rightLegHp,
        },
      }),
    ]);

    // Determinación de la victoria
    let attackerWon: boolean;
    if (defenderTotalHp <= 0) {
      attackerWon = true;
    } else if (attackerTotalHp <= 0) {
      attackerWon = false;
    } else {
      // Comparar porcentaje de vida restante
      const atkPct = attackerTotalHp / Math.max(attackerInitialHp, 1);
      const defPct = defenderTotalHp / Math.max(defenderInitialHp, 1);
      attackerWon = atkPct >= defPct;
    }

    // Si el atacante perdió (fue noqueado), se le hospitaliza 15 minutos automáticamente
    if (!attackerWon) {
      const hospitalUntil = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.player.update({
        where: { id: attacker.id },
        data: { hospitalUntil },
      });
    }

    return {
      winnerId: attackerWon ? attacker.id : defender.id,
      loserId: attackerWon ? defender.id : attacker.id,
      winnerUsername: attackerWon ? attacker.username : defender.username,
      loserUsername: attackerWon ? defender.username : attacker.username,
      turns,
      totalDamageDealt: totalDamageDealtByAttacker,
    };
  }

  // 3. Resolver Acción Posterior a la Victoria (Leave, Mug, Hospitalize)
  static async resolvePostCombatAction(
    attackerId: string,
    defenderId: string,
    action: 'LEAVE' | 'MUG' | 'HOSPITALIZE'
  ) {
    return prisma.$transaction(async (tx) => {
      const attacker = await tx.player.findUnique({ where: { id: attackerId } });
      const defender = await tx.player.findUnique({ where: { id: defenderId }, include: { wallet: true } });

      if (!attacker || !defender || !defender.wallet) {
        throw new Error('Jugadores no encontrados.');
      }

      let xpGain = 0;
      let stolenCash = 0n;
      let hospitalMinutes = 15;
      let resultMessage = '';

      switch (action) {
        case 'LEAVE': {
          xpGain = 100;
          hospitalMinutes = 15;
          resultMessage = `🚪 Dejaste tirado a **${defender.username}** en la calle. Ganaste **+${xpGain} XP** por respeto.`;
          break;
        }
        case 'MUG': {
          // Anti-Farm: Verificar si ya asaltó a esta persona 2 veces en las últimas 24 horas
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentMugsCount = await tx.transaction.count({
            where: {
              playerId: attackerId,
              source: defenderId,
              type: 'MUG_REWARD',
              timestamp: { gte: twentyFourHoursAgo },
            },
          });

          if (recentMugsCount >= 2) {
            throw new Error(`❌ Has alcanzado el límite máximo de 2 asaltos (Mug) diarios a **${defender.username}**.`);
          }

          xpGain = 40;
          hospitalMinutes = 20;
          // Robar entre 5% y 15% del dinero en efectivo del perdedor
          const mugPercent = 5 + Math.floor(Math.random() * 11);
          stolenCash = (defender.wallet.cash * BigInt(mugPercent)) / 100n;

          if (stolenCash > 0n) {
            // Acreditar a atacante
            await tx.wallet.update({
              where: { playerId: attackerId },
              data: { cash: { increment: stolenCash } },
            });

            // Restar a perdedor
            await tx.wallet.update({
              where: { playerId: defenderId },
              data: { cash: { decrement: stolenCash } },
            });

            // Registrar transacción auditable
            await tx.transaction.create({
              data: {
                playerId: attackerId,
                amount: stolenCash,
                balanceBefore: 0n,
                balanceAfter: stolenCash,
                type: 'MUG_REWARD',
                source: defenderId,
                metadata: JSON.stringify({ victimUsername: defender.username, mugPercent }),
              },
            });
          }

          resultMessage = `💸 Asaltaste a **${defender.username}** y le robaste **$${stolenCash.toLocaleString()}** (${mugPercent}% del efectivo). Ganaste **+${xpGain} XP**.`;
          break;
        }
        case 'HOSPITALIZE': {
          xpGain = 20;
          hospitalMinutes = 60;
          resultMessage = `🚑 Hospitalizaste severamente a **${defender.username}** por **${hospitalMinutes} minutos**. Ganaste **+${xpGain} XP**.`;
          break;
        }
      }

      // Aplicar hospitalización al perdedor
      const hospitalUntil = new Date(Date.now() + hospitalMinutes * 60 * 1000);
      await tx.player.update({
        where: { id: defenderId },
        data: { hospitalUntil },
      });

      // Anti-Farm: Verificar si atacó a la misma persona en menos de 1 hora para anular XP
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttacksCount = await tx.cooldown.count({
        where: {
          playerId: attackerId,
          type: `ATTACK_${defenderId}`,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentAttacksCount > 0) {
        xpGain = 0; // Se anula la XP por farmear al mismo objetivo
      }

      // Registrar cooldown de ataque
      await tx.cooldown.create({
        data: {
          playerId: attackerId,
          type: `ATTACK_${defenderId}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Otorgar XP al atacante
      if (xpGain > 0) {
        await tx.player.update({
          where: { id: attackerId },
          data: { xp: attacker.xp + xpGain },
        });
      }

      // Otorgar Experiencia de Maestría de Combate (+25 EXP)
      await MasteryService.addMasteryExp(attackerId, 'combat', 25, tx);

      return { resultMessage, xpGain, stolenCash, hospitalMinutes };
    });
  }
}
