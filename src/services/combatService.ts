import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';

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
  static ENERGY_COST = 25;
  static NEWBIE_LEVEL_PROTECTION = 2;

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

  // 2. Motor de combate turno por turno (Fórmulas de Torn Wiki)
  static async executePvPCombat(attackerDiscordId: string, defenderDiscordId: string, guildId: string = 'GLOBAL'): Promise<CombatResult> {
    const { attacker, defender } = await this.validateCombat(attackerDiscordId, defenderDiscordId, guildId);

    // Consumir 25⚡ de energía del atacante atómicamente
    await prisma.stats.update({
      where: { playerId: attacker.id },
      data: { energy: attacker.stats!.energy - this.ENERGY_COST },
    });

    // Obtener armas equipadas
    const attackerWeapons = attacker.inventory.filter((i) => i.isEquipped && i.item.type === 'WEAPON');
    const primaryWeapon = attackerWeapons.find((i) => i.slot === 'PRIMARY')?.item;
    const secondaryWeapon = attackerWeapons.find((i) => i.slot === 'SECONDARY')?.item;
    const meleeWeapon = attackerWeapons.find((i) => i.slot === 'MELEE')?.item;

    const activeWeapon = primaryWeapon || secondaryWeapon || meleeWeapon || {
      name: 'Puños desnudos',
      damage: 15,
      accuracy: 50.0,
      slot: 'MELEE',
    };

    const defenderBody = { ...defender.bodyParts! };
    let defenderTotalHp = defenderBody.headHp + defenderBody.torsoHp + defenderBody.leftArmHp + defenderBody.rightArmHp + defenderBody.leftLegHp + defenderBody.rightLegHp;

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
    let totalDamageDealt = 0;

    // Simular hasta 10 turnos de combate
    while (turnCount <= 10 && defenderTotalHp > 0) {
      const attackerSpeed = attacker.stats!.speed;
      const defenderDex = defender.stats!.dexterity;
      const weaponAcc = activeWeapon.accuracy || 50.0;

      // Hit chance fórmula: 0.5 * (AttackerSpeed / DefenderDexterity) * (WeaponAccuracy / 50)
      const hitChance = Math.min(Math.max(0.5 * (attackerSpeed / Math.max(defenderDex, 0.1)) * (weaponAcc / 50), 0.1), 0.95);
      const isHit = Math.random() <= hitChance;

      if (!isHit) {
        turns.push({
          turnNumber: turnCount,
          attackerName: attacker.username,
          weaponName: activeWeapon.name,
          bodyPart: 'Ninguna',
          isHit: false,
          isCritical: false,
          damage: 0,
          remainingHp: defenderTotalHp,
        });
        turnCount++;
        continue;
      }

      // Selección aleatoria de parte del cuerpo objetivo
      const targetPart = bodyPartList[Math.floor(Math.random() * bodyPartList.length)];
      const partMultiplier = targetPart === 'headHp' ? 1.5 : targetPart === 'torsoHp' ? 1.0 : 0.8;

      // Damage fórmula: WeaponDamage * sqrt(AttackerStrength / DefenderDefense) * Multiplier * Random(0.85, 1.15)
      const attackerStr = attacker.stats!.strength;
      const defenderDef = defender.stats!.defense;
      const statRatio = Math.sqrt(attackerStr / Math.max(defenderDef, 0.1));
      const isCritical = Math.random() < 0.15; // 15% crit chance
      const critMultiplier = isCritical ? 1.75 : 1.0;

      const randomFactor = 0.85 + Math.random() * 0.3;
      const rawDamage = activeWeapon.damage * statRatio * partMultiplier * critMultiplier * randomFactor;
      const finalDamage = Math.max(Math.round(rawDamage), 5);

      // Aplicar daño a la zona del cuerpo
      defenderBody[targetPart] = Math.max(defenderBody[targetPart] - finalDamage, 0);
      defenderTotalHp = defenderBody.headHp + defenderBody.torsoHp + defenderBody.leftArmHp + defenderBody.rightArmHp + defenderBody.leftLegHp + defenderBody.rightLegHp;
      totalDamageDealt += finalDamage;

      turns.push({
        turnNumber: turnCount,
        attackerName: attacker.username,
        weaponName: activeWeapon.name,
        bodyPart: bodyPartNames[targetPart],
        isHit: true,
        isCritical,
        damage: finalDamage,
        remainingHp: defenderTotalHp,
      });

      turnCount++;
    }

    // Actualizar salud corporal en la base de datos
    await prisma.bodyParts.update({
      where: { playerId: defender.id },
      data: {
        headHp: defenderBody.headHp,
        torsoHp: defenderBody.torsoHp,
        leftArmHp: defenderBody.leftArmHp,
        rightArmHp: defenderBody.rightArmHp,
        leftLegHp: defenderBody.leftLegHp,
        rightLegHp: defenderBody.rightLegHp,
      },
    });

    const attackerWon = defenderTotalHp <= 0 || totalDamageDealt > 50;

    return {
      winnerId: attackerWon ? attacker.id : defender.id,
      loserId: attackerWon ? defender.id : attacker.id,
      winnerUsername: attackerWon ? attacker.username : defender.username,
      loserUsername: attackerWon ? defender.username : attacker.username,
      turns,
      totalDamageDealt,
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

      // Otorgar XP al atacante
      await tx.player.update({
        where: { id: attackerId },
        data: { xp: attacker.xp + xpGain },
      });

      return { resultMessage, xpGain, stolenCash, hospitalMinutes };
    });
  }
}
