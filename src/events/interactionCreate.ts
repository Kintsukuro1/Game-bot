import { Interaction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { EconomyService } from '../services/economyService.js';
import { InventoryService } from '../services/inventoryService.js';
import { ShopService } from '../services/shopService.js';
import { GymService } from '../services/gymService.js';
import { CombatService } from '../services/combatService.js';
import { CrimeService } from '../services/crimeService.js';
import { BountyService } from '../services/bountyService.js';
import { MissionService } from '../services/missionService.js';
import {
  createGameHubEmbed,
  createGameHubButtons,
  createProfileViewEmbed,
  createStatsViewEmbed,
  createGymViewEmbed,
  createGymButtons,
  createCrimesViewEmbed,
  createCrimeSelectRow,
  createJailViewEmbed,
  createJailActionButtons,
  createBountiesViewEmbed,
  createMissionsViewEmbed,
  createInventoryViewEmbed,
  createInventoryItemSelectRow,
  createEquipmentViewEmbed,
  createBankViewEmbed,
  createBankActionButtons,
  createShopCatalogEmbed,
  createShopSelectRow,
  createTxHistoryEmbed,
  createBackButtonRow,
} from '../ui/embeds.js';
import { empezarCommand } from '../commands/general/empezar.js';
import { gameCommand } from '../commands/general/game.js';
import { atacarCommand } from '../commands/general/atacar.js';
import { adminCommand } from '../commands/general/admin.js';

const commands = new Map<string, any>([
  [empezarCommand.data.name, empezarCommand],
  [gameCommand.data.name, gameCommand],
  [atacarCommand.data.name, atacarCommand],
  [adminCommand.data.name, adminCommand],
]);

export async function handleInteraction(interaction: Interaction) {
  try {
    // 1. Manejador de Comandos Slash (/empezar, /game, /atacar, /admin)
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
      return;
    }

    const guildId = interaction.guildId || 'GLOBAL';

    // 2. Manejador de Select Menus (Crímenes, Tienda e Inventario)
    if (interaction.isStringSelectMenu()) {
      const discordId = interaction.user.id;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        return interaction.reply({ content: '❌ Necesitas registrarte primero en este servidor con `/empezar`.', ephemeral: true });
      }

      if (interaction.customId === 'select_crime') {
        const crimeId = interaction.values[0];
        try {
          const result = await CrimeService.commitCrime(player.id, crimeId);
          await MissionService.progressMission(player.id, 'CRIMES', 1);

          const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
          const embed = createCrimesViewEmbed(updated);
          const selectRow = createCrimeSelectRow();
          const backRow = createBackButtonRow();

          return interaction.update({
            content: result.message,
            embeds: [embed],
            components: [selectRow as any, backRow as any],
          });
        } catch (err: any) {
          return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
        }
      }

      if (interaction.customId === 'select_shop_item') {
        const itemId = interaction.values[0];
        try {
          const result = await ShopService.buyItem(player.id, itemId, 1);
          return interaction.reply({
            content: `🛍️ ¡Compraste **${result.item.name}** por **$${result.totalCost.toLocaleString()}**! El ítem ha sido enviado a tu inventario.`,
            ephemeral: true,
          });
        } catch (err: any) {
          return interaction.reply({ content: `❌ Error al comprar: ${err.message}`, ephemeral: true });
        }
      }

      if (interaction.customId === 'select_inv_item') {
        const invItemId = interaction.values[0];
        const invItem = player.inventory?.find((i: any) => i.id === invItemId);

        if (!invItem) {
          return interaction.reply({ content: '❌ Objeto no encontrado.', ephemeral: true });
        }

        if (invItem.item.slot) {
          await InventoryService.toggleEquipItem(player.id, invItemId);
          return interaction.reply({
            content: `⚔️ Cambiaste el estado de equipamiento para **${invItem.item.name}**.`,
            ephemeral: true,
          });
        } else {
          const useMsg = await InventoryService.useItem(player.id, invItemId);
          await MissionService.progressMission(player.id, 'ITEMS', 1);
          return interaction.reply({ content: useMsg, ephemeral: true });
        }
      }
    }

    // 3. Manejador de Botones Interactivos
    if (interaction.isButton()) {
      const discordId = interaction.user.id;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        return interaction.reply({
          content: '❌ Necesitas registrarte primero en este servidor usando el comando `/empezar`.',
          ephemeral: true,
        });
      }

      const backRow = createBackButtonRow();

      if (interaction.customId.startsWith('post_combat_')) {
        const [_, actionType, winnerId, loserId] = interaction.customId.split('_');

        if (player.id !== winnerId) {
          return interaction.reply({
            content: '❌ Solo el ganador del combate puede elegir la acción posterior.',
            ephemeral: true,
          });
        }

        const actionMap: Record<string, 'LEAVE' | 'MUG' | 'HOSPITALIZE'> = {
          leave: 'LEAVE',
          mug: 'MUG',
          hosp: 'HOSPITALIZE',
        };

        const actionEnum = actionMap[actionType];
        const res = await CombatService.resolvePostCombatAction(winnerId, loserId, actionEnum);
        await MissionService.progressMission(winnerId, 'ATTACKS', 1);

        // Reclamar Bounty si existe
        const claimedBounty = await BountyService.checkAndClaimBounty(winnerId, loserId);
        let bountyBonusStr = '';
        if (claimedBounty) {
          bountyBonusStr = `\n🎯 **¡BOUNTY RECLAMADO!** Cobraste una recompensa de **+$${claimedBounty.reward.toLocaleString()}**.`;
        }

        return interaction.update({
          content: `🎯 **Acción completada:** ${res.resultMessage}${bountyBonusStr}`,
          components: [backRow as any],
        });
      }

      switch (interaction.customId) {
        case 'hub_profile': {
          const embed = createProfileViewEmbed(player);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'hub_stats': {
          const embed = createStatsViewEmbed(player);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'act_gym': {
          const embed = createGymViewEmbed(player);
          const gymButtons = createGymButtons();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: gymButtons as any,
          });
        }
        case 'act_crime': {
          const embed = createCrimesViewEmbed(player);
          const selectRow = createCrimeSelectRow();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [selectRow as any, backRow as any],
          });
        }
        case 'act_bounties': {
          const bounties = await BountyService.getActiveBounties();
          const embed = createBountiesViewEmbed(bounties);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'act_missions': {
          const missions = await MissionService.getMissions(player.id);
          const embed = createMissionsViewEmbed(missions);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'act_jail': {
          const jailedPlayers = await CrimeService.getJailedPlayers();
          const embed = createJailViewEmbed(jailedPlayers);
          const jailButtons = createJailActionButtons();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: jailButtons as any,
          });
        }
        case 'jail_self_bust': {
          try {
            const res = await CrimeService.selfBust(player.id);
            const jailedPlayers = await CrimeService.getJailedPlayers();
            const embed = createJailViewEmbed(jailedPlayers);
            const jailButtons = createJailActionButtons();
            return interaction.update({
              content: res.message,
              embeds: [embed],
              components: jailButtons as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'hub_inventory': {
          const embed = createInventoryViewEmbed(player);
          const selectRow = createInventoryItemSelectRow(player.inventory || []);
          const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];
          return interaction.update({
            content: null,
            embeds: [embed],
            components,
          });
        }
        case 'hub_equipment': {
          const embed = createEquipmentViewEmbed(player);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'act_bank': {
          const embed = createBankViewEmbed(player);
          const bankButtons = createBankActionButtons();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: bankButtons as any,
          });
        }
        case 'act_shop': {
          const catalog = await ShopService.getCatalog();
          const embed = createShopCatalogEmbed(catalog);
          const selectRow = createShopSelectRow(catalog);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [selectRow as any, backRow as any],
          });
        }
        case 'act_tx_history': {
          const txs = await EconomyService.getTransactionHistory(player.id);
          const embed = createTxHistoryEmbed(player, txs);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'nav_back_hub': {
          const refreshedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
          const embed = createGameHubEmbed(refreshedPlayer);
          const buttons = createGameHubButtons();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: buttons as any,
          });
        }

        // --- Entrenamiento de Gimnasio ---
        case 'gym_train_strength':
        case 'gym_train_defense':
        case 'gym_train_speed':
        case 'gym_train_dexterity': {
          const statMap: Record<string, 'strength' | 'defense' | 'speed' | 'dexterity'> = {
            gym_train_strength: 'strength',
            gym_train_defense: 'defense',
            gym_train_speed: 'speed',
            gym_train_dexterity: 'dexterity',
          };

          try {
            const statName = statMap[interaction.customId];
            const result = await GymService.trainStat(player.id, statName, 1);
            await MissionService.progressMission(player.id, 'TRAINING', 1);

            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createGymViewEmbed(updated);
            const gymButtons = createGymButtons();

            return interaction.update({
              content: `🏋️ **¡Entrenamiento exitoso en ${result.gymName}!** Aumentaste **+${result.gain.toFixed(3)}** de **${result.statName.toUpperCase()}**.`,
              embeds: [embed],
              components: gymButtons as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'gym_upgrade': {
          try {
            const newGym = await GymService.upgradeGym(player.id);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createGymViewEmbed(updated);
            const gymButtons = createGymButtons();

            return interaction.update({
              content: `🎉 **¡Membresía Mejorada!** Bienvenido a **${newGym.name}** (Tier ${newGym.tier}).`,
              embeds: [embed],
              components: gymButtons as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }

        // --- Operaciones Bancarias ---
        case 'bank_dep_100': {
          try {
            await EconomyService.deposit(player.id, 100n);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createBankViewEmbed(updated);
            return interaction.update({ embeds: [embed] });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_dep_all': {
          try {
            const cashAmt = player.wallet?.cash || 0n;
            await EconomyService.deposit(player.id, cashAmt);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createBankViewEmbed(updated);
            return interaction.update({ embeds: [embed] });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_wit_100': {
          try {
            await EconomyService.withdraw(player.id, 100n);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createBankViewEmbed(updated);
            return interaction.update({ embeds: [embed] });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_wit_all': {
          try {
            const bankAmt = player.wallet?.bank || 0n;
            await EconomyService.withdraw(player.id, bankAmt);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createBankViewEmbed(updated);
            return interaction.update({ embeds: [embed] });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error manejando interacción:', error);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: '🚨 Ocurrió un error al procesar la interacción.',
        ephemeral: true,
      }).catch(() => {});
    }
  }
}
