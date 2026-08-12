import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PlayerService } from '../services/playerService.js';

import { handleHubProfile, handleHubStats, handleActSecretAlley, handleActTxHistory, handleNavBackHub } from './hubHandlers.js';
import { handleActGym, handleGymTrain, handleGymUpgrade } from './gymHandlers.js';
import { handleActCrime, handleSelectCrime } from './crimeHandlers.js';
import { handleActJail, handleJailSelfBust } from './jailHandlers.js';
import { handleActShop, handleSelectShopItem, handleShopCategory } from './shopHandlers.js';
import { handleHubInventory, handleHubEquipment, handleSelectInvItem } from './inventoryHandlers.js';
import { handleActBank, handleBankDep100, handleBankDepAll, handleBankWit100, handleBankWitAll } from './bankHandlers.js';
import { handleActJobs, handleJobCollectSalary, handleJobApply } from './jobHandlers.js';
import { handleActEdu, handleSelectEduCourse } from './educationHandlers.js';
import { handleActFaction, handleFactionCreate, handleFactionDep10k, handleFactionExecuteOc } from './factionHandlers.js';
import { handleActWar } from './warfareHandlers.js';
import { handlePostCombatAction } from './combatHandlers.js';
import { handleActBounties } from './bountyHandlers.js';
import { handleActMissions } from './missionHandlers.js';
import { handleActBossDaily, handleActBossWeekly, handleBossAttack, handleBossClaimDaily } from './bossHandlers.js';
import { handleActBlackMarket, handleBmBuy } from './blackMarketHandlers.js';
import { handleActProfessions, handleSelectProfession } from './professionHandlers.js';

export type PlayerWithRelations = NonNullable<Awaited<ReturnType<typeof PlayerService.getPlayerByDiscordId>>>;

export type HandlerFn = (
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
) => Promise<void>;

interface PrefixRule {
  prefix: string;
  handler: HandlerFn;
  exclude?: string[];
}

const exactHandlers = new Map<string, HandlerFn>([
  // Select Menus
  ['select_edu_course', handleSelectEduCourse],
  ['select_profession', handleSelectProfession],
  ['select_crime', handleSelectCrime],
  ['select_shop_item', handleSelectShopItem],
  ['select_inv_item', handleSelectInvItem],

  // Buttons - Hub & Perfil
  ['hub_profile', handleHubProfile],
  ['hub_stats', handleHubStats],
  ['act_secret_alley', handleActSecretAlley],
  ['act_tx_history', handleActTxHistory],
  ['nav_back_hub', handleNavBackHub],

  // Buttons - Gimnasio
  ['act_gym', handleActGym],
  ['gym_train_strength', handleGymTrain],
  ['gym_train_defense', handleGymTrain],
  ['gym_train_speed', handleGymTrain],
  ['gym_train_dexterity', handleGymTrain],
  ['gym_upgrade', handleGymUpgrade],

  // Buttons - Crímenes & Prisión
  ['act_crime', handleActCrime],
  ['act_jail', handleActJail],
  ['jail_self_bust', handleJailSelfBust],

  // Buttons - Tienda
  ['act_shop', handleActShop],

  // Buttons - Inventario & Equipamiento
  ['hub_inventory', handleHubInventory],
  ['hub_equipment', handleHubEquipment],

  // Buttons - Banco
  ['act_bank', handleActBank],
  ['bank_dep_100', handleBankDep100],
  ['bank_dep_all', handleBankDepAll],
  ['bank_wit_100', handleBankWit100],
  ['bank_wit_all', handleBankWitAll],

  // Buttons - Empleos
  ['act_jobs', handleActJobs],
  ['job_collect_salary', handleJobCollectSalary],
  ['job_apply_grocer', handleJobApply],
  ['job_apply_casino', handleJobApply],
  ['job_apply_medical', handleJobApply],

  // Buttons - Educación
  ['act_edu', handleActEdu],

  // Buttons - Facciones & Guerra
  ['act_faction', handleActFaction],
  ['faction_create', handleFactionCreate],
  ['faction_dep_10k', handleFactionDep10k],
  ['faction_execute_oc', handleFactionExecuteOc],
  ['act_war', handleActWar],

  // Buttons - Bounties & Misiones
  ['act_bounties', handleActBounties],
  ['act_missions', handleActMissions],

  // Buttons - World Bosses
  ['act_boss_daily', handleActBossDaily],
  ['act_boss_weekly', handleActBossWeekly],
  ['boss_attack_DAILY', handleBossAttack],
  ['boss_attack_WEEKLY_FACTION', handleBossAttack],
  ['boss_claim_DAILY', handleBossClaimDaily],

  // Buttons - Mercado Negro
  ['act_black_market', handleActBlackMarket],
  ['bm_buy_adrenalina', handleBmBuy],
  ['bm_buy_suero', handleBmBuy],

  // Buttons - Profesiones
  ['act_professions', handleActProfessions],
]);

const prefixRules: PrefixRule[] = [
  {
    prefix: 'post_combat_',
    handler: handlePostCombatAction,
  },
  {
    prefix: 'shop_cat_',
    handler: handleShopCategory,
    exclude: ['shop_cat_info'],
  },
];

export function resolveHandler(customId: string): HandlerFn | null {
  // 1. Coincidencia exacta
  const exact = exactHandlers.get(customId);
  if (exact) return exact;

  // 2. Coincidencia por prefijo
  for (const rule of prefixRules) {
    if (customId.startsWith(rule.prefix)) {
      if (rule.exclude && rule.exclude.includes(customId)) {
        continue;
      }
      return rule.handler;
    }
  }

  return null;
}
