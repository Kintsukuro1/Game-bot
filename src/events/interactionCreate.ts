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
import { JobService } from '../services/jobService.js';
import { EducationService } from '../services/educationService.js';
import { FactionService } from '../services/factionService.js';
import { WarfareService } from '../services/warfareService.js';
import { prisma } from '../db/prisma.js';
import { IS_COMPONENTS_V2_FLAG, createV2Container } from '../ui/visualComponents.js';
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
  createJobsViewEmbed,
  createJobsButtons,
  createEducationViewEmbed,
  createEducationSelectRow,
  createFactionViewEmbed,
  createFactionButtons,
  createWarfareViewEmbed,
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
import { profileCommand } from '../commands/general/profile.js';

const commands = new Map<string, any>([
  [empezarCommand.data.name, empezarCommand],
  [gameCommand.data.name, gameCommand],
  [atacarCommand.data.name, atacarCommand],
  [adminCommand.data.name, adminCommand],
  [profileCommand.data.name, profileCommand],
]);

function sendV2Update(interaction: any, container: any, content: string | null = null) {
  return interaction.update({
    content,
    components: [container],
    flags: IS_COMPONENTS_V2_FLAG,
  });
}

export async function handleInteraction(interaction: Interaction) {
  try {
    // 1. Manejador de Comandos Slash (/empezar, /game, /atacar, /admin, /profile)
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
      return;
    }

    const guildId = interaction.guildId || 'GLOBAL';

    // 2. Manejador de Select Menus (Crímenes, Cursos, Tienda e Inventario)
    if (interaction.isStringSelectMenu()) {
      const discordId = interaction.user.id;
      const player = await PlayerService.getPlayerByDiscordId(discordId, guildId);

      if (!player) {
        return interaction.reply({ content: '❌ Necesitas registrarte primero en este servidor con `/empezar`.', ephemeral: true });
      }

      if (interaction.customId === 'select_edu_course') {
        const courseId = interaction.values[0];
        try {
          const res = await EducationService.enrollCourse(player.id, courseId);
          const activeCourse = await EducationService.getActiveCourse(player.id);
          const selectRow = createEducationSelectRow();
          const backRow = createBackButtonRow();
          const container = createEducationViewEmbed(activeCourse, [selectRow, backRow]);

          return sendV2Update(
            interaction,
            container,
            `🎓 **¡Matrícula Exitosa!** Te inscribiste en **${res.courseName}**. Duración: **${res.durationHours} horas**.`
          );
        } catch (err: any) {
          return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
        }
      }

      if (interaction.customId === 'select_crime') {
        const crimeId = interaction.values[0];
        try {
          const result = await CrimeService.commitCrime(player.id, crimeId);
          await MissionService.progressMission(player.id, 'CRIMES', 1);

          const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
          const selectRow = createCrimeSelectRow();
          const backRow = createBackButtonRow();
          const container = createCrimesViewEmbed(updated, [selectRow, backRow]);

          return sendV2Update(interaction, container, result.message);
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

        const warRes = await WarfareService.recordWarHit(winnerId, loserId);
        let warBonusStr = '';
        if (warRes) {
          if (warRes.warFinished) {
            warBonusStr = `\n⚔️ **¡GUERRA GANADA!** Tu facción alcanzó el objetivo de puntos y ganó **+$100,000** en la tesorería y +500 Puntos de Respeto.`;
          } else {
            warBonusStr = `\n⚔️ **¡Golpe de Guerra!** +${warRes.pointsGained} pts de guerra y +15 Puntos de Respeto para tu facción (Marcador: ${warRes.currentScore}/${warRes.targetScore}).`;
          }
        }

        const claimedBounty = await BountyService.checkAndClaimBounty(winnerId, loserId);
        let bountyBonusStr = '';
        if (claimedBounty) {
          bountyBonusStr = `\n🎯 **¡BOUNTY RECLAMADO!** Cobraste una recompensa de **+$${claimedBounty.reward.toLocaleString()}**.`;
        }

        return interaction.update({
          content: `🎯 **Acción completada:** ${res.resultMessage}${warBonusStr}${bountyBonusStr}`,
          components: [createV2Container(0xdc143c, [backRow])],
          flags: IS_COMPONENTS_V2_FLAG,
        });
      }

      switch (interaction.customId) {
        case 'act_war': {
          const rankings = await WarfareService.getFactionRankings(guildId);
          const container = createWarfareViewEmbed(rankings, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_jobs': {
          const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
          const container = createJobsViewEmbed(playerJob, createJobsButtons());
          return sendV2Update(interaction, container);
        }
        case 'job_collect_salary': {
          try {
            const res = await JobService.collectSalary(player.id);
            const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
            const container = createJobsViewEmbed(playerJob, createJobsButtons());
            return sendV2Update(
              interaction,
              container,
              `💵 **¡Salario Cobrado!** Recibiste **+$${res.salary.toLocaleString()}** de tu trabajo en **${res.jobName}** y +5 Job Points.`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'job_apply_grocer':
        case 'job_apply_casino':
        case 'job_apply_medical': {
          const map: Record<string, string> = {
            job_apply_grocer: 'GROCER',
            job_apply_casino: 'CASINO',
            job_apply_medical: 'MEDICAL',
          };
          try {
            const jobId = map[interaction.customId];
            const res = await JobService.applyJob(player.id, jobId);
            const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
            const container = createJobsViewEmbed(playerJob, createJobsButtons());
            return sendV2Update(
              interaction,
              container,
              `🎉 **¡Contratado!** Ahora trabajas en **${res.jobName}** (Salario Base: $${res.salary}/día).`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'act_edu': {
          const activeCourse = await EducationService.getActiveCourse(player.id);
          const selectRow = createEducationSelectRow();
          const container = createEducationViewEmbed(activeCourse, [selectRow, backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_faction': {
          const member = await prisma.factionMember.findUnique({
            where: { playerId: player.id },
            include: { faction: { include: { members: true } } },
          });
          const faction = member ? member.faction : null;
          const container = createFactionViewEmbed(faction, createFactionButtons(!!faction));
          return sendV2Update(interaction, container);
        }
        case 'faction_create': {
          try {
            const factionName = `Facción de ${player.username}`;
            const faction = await FactionService.createFaction(player.id, factionName, 'Facción creada desde el Hub', guildId);
            const container = createFactionViewEmbed(faction, createFactionButtons(true));
            return sendV2Update(
              interaction,
              container,
              `🎉 **¡Facción Creada!** Fundaste la facción **${faction.name}**.`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'faction_dep_10k': {
          try {
            await FactionService.depositTreasury(player.id, 10000n);
            const member = await prisma.factionMember.findUnique({
              where: { playerId: player.id },
              include: { faction: { include: { members: true } } },
            });
            const container = createFactionViewEmbed(member?.faction, createFactionButtons(true));
            return sendV2Update(
              interaction,
              container,
              '💰 **¡Depósito Exitoso!** Acreditaste **+$10,000** a la tesorería de tu facción.'
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'faction_execute_oc': {
          try {
            const res = await FactionService.executeOrganizedCrime(player.id, 'Asalto al Banco Central');
            const member = await prisma.factionMember.findUnique({
              where: { playerId: player.id },
              include: { faction: { include: { members: true } } },
            });
            const container = createFactionViewEmbed(member?.faction, createFactionButtons(true));
            return sendV2Update(
              interaction,
              container,
              `🔥 **¡Crimen Organizado Exitoso!** Tu facción ejecutó el golpe y obtuvo **+$${res.rewardCash.toLocaleString()}** en la tesorería y **+${res.respectGained} Puntos de Respeto**.`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'hub_profile': {
          const container = createProfileViewEmbed(player, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'hub_stats': {
          const container = createStatsViewEmbed(player, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_gym': {
          const container = createGymViewEmbed(player, createGymButtons());
          return sendV2Update(interaction, container);
        }
        case 'act_crime': {
          const selectRow = createCrimeSelectRow();
          const container = createCrimesViewEmbed(player, [selectRow, backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_bounties': {
          const bounties = await BountyService.getActiveBounties();
          const container = createBountiesViewEmbed(bounties, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_missions': {
          const missions = await MissionService.getMissions(player.id);
          const container = createMissionsViewEmbed(missions, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_jail': {
          const jailedPlayers = await CrimeService.getJailedPlayers();
          const container = createJailViewEmbed(jailedPlayers, createJailActionButtons());
          return sendV2Update(interaction, container);
        }
        case 'jail_self_bust': {
          try {
            const res = await CrimeService.selfBust(player.id);
            const jailedPlayers = await CrimeService.getJailedPlayers();
            const container = createJailViewEmbed(jailedPlayers, createJailActionButtons());
            return sendV2Update(interaction, container, res.message);
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'hub_inventory': {
          const selectRow = createInventoryItemSelectRow(player.inventory || []);
          const rows = selectRow ? [selectRow, backRow] : [backRow];
          const container = createInventoryViewEmbed(player, rows);
          return sendV2Update(interaction, container);
        }
        case 'hub_equipment': {
          const container = createEquipmentViewEmbed(player, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_bank': {
          const container = createBankViewEmbed(player, createBankActionButtons());
          return sendV2Update(interaction, container);
        }
        case 'act_shop': {
          const catalog = await ShopService.getCatalog();
          const selectRow = createShopSelectRow(catalog);
          const container = createShopCatalogEmbed(catalog, [selectRow, backRow]);
          return sendV2Update(interaction, container);
        }
        case 'act_tx_history': {
          const txs = await EconomyService.getTransactionHistory(player.id);
          const container = createTxHistoryEmbed(player, txs, [backRow]);
          return sendV2Update(interaction, container);
        }
        case 'nav_back_hub': {
          const refreshedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
          const container = createGameHubEmbed(refreshedPlayer, createGameHubButtons());
          return sendV2Update(interaction, container);
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
            const container = createGymViewEmbed(updated, createGymButtons());

            return sendV2Update(
              interaction,
              container,
              `🏋️ **¡Entrenamiento exitoso en ${result.gymName}!** Aumentaste **+${result.gain.toFixed(3)}** de **${result.statName.toUpperCase()}**.`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'gym_upgrade': {
          try {
            const newGym = await GymService.upgradeGym(player.id);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const container = createGymViewEmbed(updated, createGymButtons());

            return sendV2Update(
              interaction,
              container,
              `🎉 **¡Membresía Mejorada!** Bienvenido a **${newGym.name}** (Tier ${newGym.tier}).`
            );
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }

        // --- Operaciones Bancarias ---
        case 'bank_dep_100': {
          try {
            await EconomyService.deposit(player.id, 100n);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const container = createBankViewEmbed(updated, createBankActionButtons());
            return sendV2Update(interaction, container);
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_dep_all': {
          try {
            const cashAmt = player.wallet?.cash || 0n;
            await EconomyService.deposit(player.id, cashAmt);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const container = createBankViewEmbed(updated, createBankActionButtons());
            return sendV2Update(interaction, container);
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_wit_100': {
          try {
            await EconomyService.withdraw(player.id, 100n);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const container = createBankViewEmbed(updated, createBankActionButtons());
            return sendV2Update(interaction, container);
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_wit_all': {
          try {
            const bankAmt = player.wallet?.bank || 0n;
            await EconomyService.withdraw(player.id, bankAmt);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const container = createBankViewEmbed(updated, createBankActionButtons());
            return sendV2Update(interaction, container);
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
