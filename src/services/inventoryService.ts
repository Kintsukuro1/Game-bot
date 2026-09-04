import { prisma } from '../db/prisma.js';
import { PlayerService } from './playerService.js';

export class InventoryService {
  // Añadir ítem al inventario con apilamiento (Stacking)
  static async addItem(playerId: string, itemId: string, quantity: number = 1) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { playerId, itemId, slot: null },
    });

    if (existing) {
      return prisma.inventoryItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return prisma.inventoryItem.create({
      data: {
        playerId,
        itemId,
        quantity,
      },
    });
  }

  // Quitar ítem del inventario
  static async removeItem(playerId: string, inventoryItemId: string, quantity: number = 1) {
    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!invItem || invItem.playerId !== playerId) {
      throw new Error('Objeto no encontrado en tu inventario.');
    }

    if (invItem.quantity <= quantity) {
      return prisma.inventoryItem.delete({
        where: { id: inventoryItemId },
      });
    }

    return prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantity: invItem.quantity - quantity },
    });
  }

  // Uso de Consumibles (Medical, Drugs, Energy Drinks, Alcohol, Candy)
  static async useItem(playerId: string, inventoryItemId: string) {
    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem || invItem.playerId !== playerId) {
        throw new Error('Objeto no encontrado.');
      }

      const item = invItem.item;
      const effect = item.effect ? JSON.parse(item.effect) : {};
      const stats = await tx.stats.findUnique({ where: { playerId } });
      const body = await tx.bodyParts.findUnique({ where: { playerId } });

      if (!stats || !body) throw new Error('Estadísticas del jugador no encontradas.');

      let message = `Consumiste **${item.name}**. `;

      // Manejador de Apertura de Cofres (DAILY, WEEKLY, MONTHLY)
      if (effect.chestType) {
        let cashReward = 0n;
        let xpReward = 0;
        let masteryReward = 0;
        let giftItemName = '';

        if (effect.chestType === 'DAILY') {
          cashReward = 50000n;
          xpReward = 1000;
          giftItemName = 'First Aid Kit';
        } else if (effect.chestType === 'WEEKLY') {
          cashReward = 250000n;
          xpReward = 5000;
          masteryReward = 5;
          giftItemName = 'Xanax';
        } else if (effect.chestType === 'MONTHLY') {
          cashReward = 1000000n;
          xpReward = 20000;
          masteryReward = 15;
          giftItemName = 'Feathery Hotel Coupon';
        }

        // 1. Acreditar efectivo
        if (cashReward > 0n) {
          const wallet = await tx.wallet.findUnique({ where: { playerId } });
          if (wallet) {
            const balanceBefore = wallet.cash;
            const balanceAfter = wallet.cash + cashReward;

            await tx.wallet.update({
              where: { playerId },
              data: { cash: balanceAfter },
            });

            await tx.transaction.create({
              data: {
                playerId,
                amount: cashReward,
                balanceBefore,
                balanceAfter,
                type: 'CHEST_OPEN_REWARD',
                source: item.name,
                metadata: JSON.stringify({ chestType: effect.chestType }),
              },
            });
          }
        }

        // 2. Acreditar XP
        if (xpReward > 0) {
          await PlayerService.addXp(playerId, xpReward, tx);
        }

        // 3. Acreditar Puntos de Maestría si aplica
        if (masteryReward > 0) {
          const mastery = await tx.playerMastery.findUnique({ where: { playerId } });
          if (mastery) {
            await tx.playerMastery.update({
              where: { playerId },
              data: { perkPoints: mastery.perkPoints + masteryReward },
            });
          } else {
            await tx.playerMastery.create({
              data: { playerId, perkPoints: masteryReward },
            });
          }
        }

        // 4. Entregar Ítem de Regalo si existe
        if (giftItemName) {
          const giftItem = await tx.item.findFirst({ where: { name: giftItemName } });
          if (giftItem) {
            const existingInv = await tx.inventoryItem.findFirst({
              where: { playerId, itemId: giftItem.id, slot: null },
            });
            if (existingInv) {
              await tx.inventoryItem.update({
                where: { id: existingInv.id },
                data: { quantity: existingInv.quantity + 1 },
              });
            } else {
              await tx.inventoryItem.create({
                data: { playerId, itemId: giftItem.id, quantity: 1 },
              });
            }
          }
        }

        // Consumir 1 unidad del cofre
        if (invItem.quantity <= 1) {
          await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
        } else {
          await tx.inventoryItem.update({
            where: { id: inventoryItemId },
            data: { quantity: invItem.quantity - 1 },
          });
        }

        return `🎁 **¡${item.name.toUpperCase()} ABIERTO!** Obtuviste **+$${cashReward.toLocaleString()}**, **+${xpReward.toLocaleString()} XP**${masteryReward > 0 ? `, **+${masteryReward} Puntos de Maestría**` : ''}${giftItemName ? ` y 1 **${giftItemName}**` : ''}.`;
      }

      // Si es una Droga, procesar adicción y riesgo de sobredosis
      const isDrug = item.weaponType === 'Drug' || effect.drugCooldownMin;
      if (isDrug) {
        let addiction = await tx.playerAddiction.findUnique({ where: { playerId } });
        if (!addiction) {
          addiction = await tx.playerAddiction.create({ data: { playerId, level: 0 } });
        }

        const isOverdose = Math.random() < 0.05; // 5% probabilidad de sobredosis
        if (isOverdose) {
          // Descontar ítem usado
          if (invItem.quantity <= 1) {
            await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
          } else {
            await tx.inventoryItem.update({
              where: { id: inventoryItemId },
              data: { quantity: invItem.quantity - 1 },
            });
          }

          const hospitalUntil = new Date(Date.now() + 60 * 60 * 1000);
          await tx.player.update({
            where: { id: playerId },
            data: { hospitalUntil },
          });

          await tx.playerAddiction.update({
            where: { playerId },
            data: { lastOverdoseAt: new Date() },
          });

          await tx.stats.update({
            where: { playerId },
            data: { happy: 0, energy: 0 },
          });

          return `💀 **¡SOBREDOSIS CON ${item.name.toUpperCase()}!** Colapsaste en el suelo y fuiste trasladado de urgencia al hospital por 60 minutos. Tu energía y felicidad cayeron a 0.`;
        }

        // Incrementar nivel de adicción (+15%)
        await tx.playerAddiction.update({
          where: { playerId },
          data: { level: Math.min(100, addiction.level + 15) },
        });
        message += `(💊 Adicción: ${Math.min(100, addiction.level + 15)}%). `;
      }

      // Aplica efectos según categoría oficial de Torn Wiki
      if (effect.addEnergy) {
        const newEnergy = Math.min(stats.energy + effect.addEnergy, stats.maxEnergy + 250); // permite sobrecargar
        await tx.stats.update({ where: { playerId }, data: { energy: newEnergy } });
        message += `⚡ +${effect.addEnergy} Energía (Total: ${newEnergy}). `;
      }

      if (effect.addNerve) {
        const newNerve = Math.min(stats.nerve + effect.addNerve, stats.maxNerve + 50);
        await tx.stats.update({ where: { playerId }, data: { nerve: newNerve } });
        message += `🧠 +${effect.addNerve} Nerve (Total: ${newNerve}). `;
      }

      if (effect.addHappy) {
        const newHappy = Math.min(stats.happy + effect.addHappy, stats.maxHappy + 1000);
        await tx.stats.update({ where: { playerId }, data: { happy: newHappy } });
        message += `😊 +${effect.addHappy} Happy (Total: ${newHappy}). `;
      }

      if (effect.doubleHappy) {
        const newHappy = Math.min(stats.happy * 2, stats.maxHappy * 2);
        await tx.stats.update({ where: { playerId }, data: { happy: newHappy } });
        message += `😊 ¡Felicidad duplicada! (Total: ${newHappy}). `;
      }

      if (effect.reduceHappyPercent) {
        const happyLoss = Math.round(stats.happy * (effect.reduceHappyPercent / 100));
        const newHappy = Math.max(stats.happy - happyLoss, 0);
        await tx.stats.update({ where: { playerId }, data: { happy: newHappy } });
        message += `😊 -${effect.reduceHappyPercent}% Happy (Total: ${newHappy}). `;
      }

      if (effect.reduceHospitalMin) {
        const playerRec = await tx.player.findUnique({ where: { id: playerId } });
        if (playerRec?.hospitalUntil && playerRec.hospitalUntil > new Date()) {
          const newHospital = new Date(playerRec.hospitalUntil.getTime() - effect.reduceHospitalMin * 60 * 1000);
          const finalHospital = newHospital <= new Date() ? null : newHospital;
          await tx.player.update({
            where: { id: playerId },
            data: { hospitalUntil: finalHospital },
          });
          message += `🏥 -${effect.reduceHospitalMin} min de hospital. `;
        }
      }

      if (effect.healHp) {
        // Curar todas las partes del cuerpo
        await tx.bodyParts.update({
          where: { playerId },
          data: {
            headHp: Math.min(body.headHp + effect.healHp, 100),
            torsoHp: Math.min(body.torsoHp + effect.healHp, 100),
            leftArmHp: Math.min(body.leftArmHp + effect.healHp, 100),
            rightArmHp: Math.min(body.rightArmHp + effect.healHp, 100),
            leftLegHp: Math.min(body.leftLegHp + effect.healHp, 100),
            rightLegHp: Math.min(body.rightLegHp + effect.healHp, 100),
          },
        });
        message += `🏥 Curados ${effect.healHp} HP en todas las zonas del cuerpo. `;
      }

      if (effect.healPercent) {
        const healAmt = Math.round(100 * (effect.healPercent / 100));
        await tx.bodyParts.update({
          where: { playerId },
          data: {
            headHp: Math.min(body.headHp + healAmt, 100),
            torsoHp: Math.min(body.torsoHp + healAmt, 100),
            leftArmHp: Math.min(body.leftArmHp + healAmt, 100),
            rightArmHp: Math.min(body.rightArmHp + healAmt, 100),
            leftLegHp: Math.min(body.leftLegHp + healAmt, 100),
            rightLegHp: Math.min(body.rightLegHp + healAmt, 100),
          },
        });
        message += `🏥 Restaurado ${effect.healPercent}% de salud corporal. `;
      }

      // Restar 1 unidad del inventario
      if (invItem.quantity <= 1) {
        await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
      } else {
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { quantity: invItem.quantity - 1 },
        });
      }

      return message;
    });
  }

  // Equipar / Desequipar Armas
  static async toggleEquipItem(playerId: string, inventoryItemId: string) {
    return prisma.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem || invItem.playerId !== playerId) {
        throw new Error('Objeto no encontrado en inventario.');
      }

      const itemSlot = invItem.item.slot;
      if (!itemSlot) throw new Error('Este objeto no se puede equipar como arma.');

      if (invItem.isEquipped) {
        // Desequipar
        return tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { isEquipped: false, slot: null },
        });
      } else {
        // Desequipar cualquier arma previa en esa misma ranura
        await tx.inventoryItem.updateMany({
          where: { playerId, slot: itemSlot, isEquipped: true },
          data: { isEquipped: false, slot: null },
        });

        // Equipar nueva arma
        return tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { isEquipped: true, slot: itemSlot },
        });
      }
    });
  }
}
