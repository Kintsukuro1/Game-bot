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
import { NPCService } from '../services/npcService.js';
import { BossService } from '../services/bossService.js';
import { BlackMarketService } from '../services/blackMarketService.js';
import { ProfessionService } from '../services/professionService.js';
import { prisma } from '../db/prisma.js';
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
  createShopNavButtons,
  createTxHistoryEmbed,
  createBackButtonRow,
  createSecretAlleyViewEmbed,
  createDailyBossViewEmbed,
  createWeeklyBossViewEmbed,
  createBossActionButtons,
  createBlackMarketViewEmbed,
  createBlackMarketButtons,
  createProfessionsViewEmbed,
  createProfessionsSelectRow,
} from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
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
          const embed = createEducationViewEmbed(activeCourse, player.level);
          const selectRow = createEducationSelectRow();
          const backRow = createBackButtonRow();
          const msg = `🎓 **¡Matrícula Exitosa!** Te inscribiste en **${res.courseName}**. Duración: **${res.durationHours} horas**.`;
          const newContent = appendActionLog(interaction.message?.content, [msg], 5);

          return interaction.update({
            content: newContent,
            embeds: [embed],
            components: [selectRow as any, backRow as any],
          });
        } catch (err: any) {
          return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
        }
      }

      if (interaction.customId === 'select_profession') {
        const selectedProf = interaction.values[0] as 'HACKER' | 'CONTRABANDISTA' | 'SICARIO';
        try {
          const res = await ProfessionService.chooseProfession(player.id, selectedProf);
          const updatedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
          const embed = createProfessionsViewEmbed(updatedPlayer);
          const msg = `🎉 **¡Profesión Elegida!** Ahora eres **${res.emoji} ${res.professionName}**.`;
          const newContent = appendActionLog(interaction.message?.content, [msg], 5);

          const backRow = createBackButtonRow();
          return interaction.update({
            content: newContent,
            embeds: [embed],
            components: [backRow as any],
          });
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
          const embed = createCrimesViewEmbed(updated);
          const selectRow = createCrimeSelectRow();
          const backRow = createBackButtonRow();

          const reaction = result.success
            ? NPCService.getReaction('charly', 'success')
            : NPCService.getReaction('charly', 'failure');

          const newContent = appendActionLog(interaction.message?.content, [result.message, reaction], 5);

          return interaction.update({
            content: newContent,
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

        const warRes = await WarfareService.recordWarHit(winnerId, loserId);
        let warBonusStr = '';
        if (warRes) {
          if (warRes.warFinished) {
            warBonusStr = `\n⚔️ **¡GUERRA GANADA!** Tu facción alcanzó el objetivo de puntos y ganó **+$100,000** en la tesorería.`;
          } else {
            warBonusStr = `\n⚔️ **¡Golpe de Guerra!** +${warRes.pointsGained} pts de guerra (Marcador: ${warRes.currentScore}/${warRes.targetScore}).`;
          }
        }

        const claimedBounty = await BountyService.checkAndClaimBounty(winnerId, loserId);
        let bountyBonusStr = '';
        if (claimedBounty) {
          bountyBonusStr = `\n🎯 **¡BOUNTY RECLAMADO!** Cobraste una recompensa de **+$${claimedBounty.reward.toLocaleString()}**.`;
        }

        const fullMsg = `🎯 **Acción completada:** ${res.resultMessage}${warBonusStr}${bountyBonusStr}`;
        const newContent = appendActionLog(interaction.message?.content, fullMsg.split('\n'), 5);

        return interaction.update({
          content: newContent,
          components: [backRow as any],
        });
      }

      // Navegación entre Categorías de la Tienda (◀️ shop_cat_X ▶️)
      if (interaction.customId.startsWith('shop_cat_') && interaction.customId !== 'shop_cat_info') {
        const catIndexStr = interaction.customId.replace('shop_cat_', '');
        const targetIndex = parseInt(catIndexStr, 10);

        if (!isNaN(targetIndex)) {
          const catalog = await ShopService.getCatalogByCategory(targetIndex);
          const embed = createShopCatalogEmbed(catalog, player.level, targetIndex);
          const selectRow = createShopSelectRow(catalog);
          const navBtns = createShopNavButtons(targetIndex);
          const components = selectRow ? [selectRow as any, ...navBtns as any] : [...navBtns as any];

          return interaction.update({
            content: null,
            embeds: [embed],
            components,
          });
        }
      }

      switch (interaction.customId) {
        case 'act_war': {
          const rankings = await WarfareService.getFactionRankings(guildId);
          const embed = createWarfareViewEmbed(rankings);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
        }
        case 'act_jobs': {
          const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
          const embed = createJobsViewEmbed(playerJob, player.level);
          const jobBtns = createJobsButtons();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: jobBtns as any,
          });
        }
        case 'job_collect_salary': {
          try {
            const res = await JobService.collectSalary(player.id);
            const playerJob = await prisma.playerJob.findUnique({ where: { playerId: player.id } });
            const embed = createJobsViewEmbed(playerJob, player.level);
            const jobBtns = createJobsButtons();
            const msg = `💵 **¡Salario Cobrado!** Recibiste **+$${res.salary.toLocaleString()}** de tu trabajo en **${res.jobName}** y +5 Job Points.`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: jobBtns as any,
            });
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
            const embed = createJobsViewEmbed(playerJob, player.level);
            const jobBtns = createJobsButtons();
            const msg = `🎉 **¡Contratado!** Ahora trabajas en **${res.jobName}** (Salario Base: $${res.salary}/día).`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: jobBtns as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'act_edu': {
          const activeCourse = await EducationService.getActiveCourse(player.id);
          const embed = createEducationViewEmbed(activeCourse, player.level);
          const selectRow = createEducationSelectRow();
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [selectRow as any, backRow as any],
          });
        }
        case 'act_faction': {
          const member = await prisma.factionMember.findUnique({
            where: { playerId: player.id },
            include: { faction: { include: { members: true } } },
          });
          const faction = member ? member.faction : null;
          const embed = createFactionViewEmbed(faction);
          const factionBtns = createFactionButtons(!!faction);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: factionBtns as any,
          });
        }
        case 'faction_create': {
          try {
            const factionName = `Facción de ${player.username}`;
            const faction = await FactionService.createFaction(player.id, factionName, 'Facción creada desde el Hub', guildId);
            const embed = createFactionViewEmbed(faction);
            const factionBtns = createFactionButtons(true);
            const msg = `🎉 **¡Facción Creada!** Fundaste la facción **${faction.name}**.`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: factionBtns as any,
            });
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
            const embed = createFactionViewEmbed(member?.faction);
            const factionBtns = createFactionButtons(true);
            const msg = '💰 **¡Depósito Exitoso!** Acreditaste **+$10,000** a la tesorería de tu facción.';
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: factionBtns as any,
            });
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
            const embed = createFactionViewEmbed(member?.faction);
            const factionBtns = createFactionButtons(true);
            const msg = `🔥 **¡Crimen Organizado Exitoso!** Tu facción ejecutó el golpe y obtuvo **+$${res.rewardCash.toLocaleString()}** en la tesorería y **+${res.respectGained} Puntos de Respeto**.`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: factionBtns as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
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
          const embed = createBountiesViewEmbed(bounties, player.level);
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
            const newContent = appendActionLog(interaction.message?.content, [res.message], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: jailButtons as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'act_secret_alley': {
          const embed = createSecretAlleyViewEmbed(player);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: [backRow as any],
          });
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
          const catalog = await ShopService.getCatalogByCategory(0);
          const embed = createShopCatalogEmbed(catalog, player.level, 0);
          const selectRow = createShopSelectRow(catalog);
          const navBtns = createShopNavButtons(0);
          const components = selectRow ? [selectRow as any, ...navBtns as any] : [...navBtns as any];

          return interaction.update({
            content: null,
            embeds: [embed],
            components,
          });
        }
        case 'act_boss_daily': {
          const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
          const damageLog = await prisma.worldBossDamage.findUnique({
            where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
          });
          const embed = createDailyBossViewEmbed(boss, damageLog);
          const btns = createBossActionButtons('DAILY');
          return interaction.update({
            content: null,
            embeds: [embed],
            components: btns as any,
          });
        }
        case 'act_boss_weekly': {
          const boss = await BossService.getOrCreateActiveBoss(guildId, 'WEEKLY_FACTION');
          const damageLogs = await prisma.worldBossDamage.findMany({
            where: { bossId: boss.id },
            include: { player: true },
            orderBy: { damageDealt: 'desc' },
          });
          const embed = createWeeklyBossViewEmbed(boss, damageLogs);
          const btns = createBossActionButtons('WEEKLY_FACTION');
          return interaction.update({
            content: null,
            embeds: [embed],
            components: btns as any,
          });
        }
        case 'boss_attack_DAILY':
        case 'boss_attack_WEEKLY_FACTION': {
          const category = interaction.customId === 'boss_attack_DAILY' ? 'DAILY' : 'WEEKLY_FACTION';
          try {
            const boss = await BossService.getOrCreateActiveBoss(guildId, category);
            const res = await BossService.attackBoss(player.id, boss.id);

            const updatedBoss = await BossService.getOrCreateActiveBoss(guildId, category);
            const damageLog = await prisma.worldBossDamage.findUnique({
              where: { bossId_playerId: { bossId: updatedBoss.id, playerId: player.id } },
            });
            const damageLogs = await prisma.worldBossDamage.findMany({
              where: { bossId: updatedBoss.id },
              include: { player: true },
              orderBy: { damageDealt: 'desc' },
            });

            const embed = category === 'DAILY'
              ? createDailyBossViewEmbed(updatedBoss, damageLog)
              : createWeeklyBossViewEmbed(updatedBoss, damageLogs);

            const btns = createBossActionButtons(category);
            const attackMsg = `⚔️ **¡Ataque Asestado!** Infligiste **+${res.damageDealt.toLocaleString()} HP** a **${res.bossName}**.\n${res.quote}`;
            const newContent = appendActionLog(interaction.message?.content, [attackMsg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: btns as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'boss_claim_DAILY': {
          try {
            const boss = await BossService.getOrCreateActiveBoss(guildId, 'DAILY');
            const res = await BossService.claimDailyMilestones(player.id, boss.id);

            const damageLog = await prisma.worldBossDamage.findUnique({
              where: { bossId_playerId: { bossId: boss.id, playerId: player.id } },
            });
            const embed = createDailyBossViewEmbed(boss, damageLog);
            const btns = createBossActionButtons('DAILY');
            const claimMsg = `🎉 **¡Recompensa de Hito Reclamada!** Alcanzaste **${res.milestoneTitle}** y ganaste **+$${res.rewardCash.toLocaleString()}** y **+${res.rewardXp} XP**.`;
            const newContent = appendActionLog(interaction.message?.content, [claimMsg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: btns as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'act_black_market': {
          const event = await BlackMarketService.getOrCreateActiveBlackMarket(guildId);
          const embed = createBlackMarketViewEmbed(event, player);
          const btns = createBlackMarketButtons(event);
          return interaction.update({
            content: null,
            embeds: [embed],
            components: btns as any,
          });
        }
        case 'bm_buy_adrenalina':
        case 'bm_buy_suero': {
          const itemType = interaction.customId === 'bm_buy_adrenalina' ? 'ADRENALINA' : 'SUERO';
          try {
            const res = await BlackMarketService.buyBlackMarketItem(player.id, itemType);
            const refreshedPlayer = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const event = await BlackMarketService.getOrCreateActiveBlackMarket(guildId);
            const embed = createBlackMarketViewEmbed(event, refreshedPlayer);
            const btns = createBlackMarketButtons(event);
            const newContent = appendActionLog(interaction.message?.content, [res.msg], 5);

            return interaction.update({
              content: newContent,
              embeds: [embed],
              components: btns as any,
            });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'act_professions': {
          const embed = createProfessionsViewEmbed(player);
          const selectRow = createProfessionsSelectRow(Boolean(player.profession));
          const components = selectRow ? [selectRow as any, backRow as any] : [backRow as any];

          return interaction.update({
            content: null,
            embeds: [embed],
            components,
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
          if (!refreshedPlayer) return;
          const embed = createGameHubEmbed(refreshedPlayer);
          const buttons = createGameHubButtons(refreshedPlayer.level);
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
            const reaction = NPCService.getReaction('tony', 'success');

            const msg = `🏋️ **¡Entrenamiento exitoso en ${result.gymName}!** Aumentaste **+${result.gain.toFixed(3)}** de **${result.statName.toUpperCase()}**.`;
            const newContent = appendActionLog(interaction.message?.content, [msg, reaction], 5);

            return interaction.update({
              content: newContent,
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
            const msg = `🎉 **¡Membresía Mejorada!** Bienvenido a **${newGym.name}** (Tier ${newGym.tier}).`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({
              content: newContent,
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
            const msg = '💰 **¡Depósito Exitoso!** Depositaste **+$100** en tu cuenta bancaria.';
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({ content: newContent, embeds: [embed] });
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
            const msg = `💰 **¡Depósito Exitoso!** Depositaste todo tu efectivo (**+$${cashAmt.toLocaleString()}**) en el banco.`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({ content: newContent, embeds: [embed] });
          } catch (err: any) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
          }
        }
        case 'bank_wit_100': {
          try {
            await EconomyService.withdraw(player.id, 100n);
            const updated = await PlayerService.getPlayerByDiscordId(discordId, guildId);
            const embed = createBankViewEmbed(updated);
            const msg = '💵 **¡Retiro Exitoso!** Retiraste **-$100** de tu cuenta bancaria.';
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({ content: newContent, embeds: [embed] });
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
            const msg = `💵 **¡Retiro Exitoso!** Retiraste todo tu saldo bancario (**-$${bankAmt.toLocaleString()}**).`;
            const newContent = appendActionLog(interaction.message?.content, [msg], 5);

            return interaction.update({ content: newContent, embeds: [embed] });
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
