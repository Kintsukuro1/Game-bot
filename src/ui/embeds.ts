import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { PlayerService } from '../services/playerService.js';
import { GYMS, GymService } from '../services/gymService.js';
import { CombatResult } from '../services/combatService.js';
import { CRIMES } from '../services/crimeService.js';
import { JOBS } from '../services/jobService.js';
import { COURSES } from '../services/educationService.js';
import { ShopService, SHOP_CATEGORIES } from '../services/shopService.js';
import { NPCService } from '../services/npcService.js';
import { BossService, BOSS_DEFINITIONS, getBossPhase } from '../services/bossService.js';
import { BlackMarketService } from '../services/blackMarketService.js';
import { PROFESSIONS } from '../services/professionService.js';
import { DESTINATIONS } from '../services/travelService.js';
import { TRACKS } from '../services/racingService.js';
import { COMPANY_TYPES } from '../services/companyService.js';
import { PROPERTIES } from '../services/propertyService.js';
import { INITIAL_STOCKS } from '../services/investmentService.js';
import { PERKS, MasteryService } from '../services/masteryService.js';
import {
  renderProgressBar,
  renderHealthBar,
  renderAnatomicalDoll,
  translateItemType,
  translateWeaponType,
  translateSlot,
  translateTxType,
} from './visualComponents.js';

// 1. Hub Principal con Progresión Espaciada y Desbloqueo Gradual por Hitos (Niveles 1, 3, 5, 10, 15)
export function createGameHubEmbed(player: any) {
  const stats = player.stats;
  const wallet = player.wallet;
  const level = player.level || 1;

  const energyBar = renderProgressBar(stats.energy, stats.maxEnergy, 8, '⚡', '░');
  const nerveBar = renderProgressBar(stats.nerve, stats.maxNerve, 8, '🧠', '░');
  const happyBar = renderProgressBar(stats.happy, stats.maxHappy, 8, '😊', '░');

  const unlockedList = [];
  unlockedList.push('• **👤 Perfil & 📊 Stats:** Tu información general y nivel.');
  unlockedList.push('• **🏋️ Gimnasio & 🕵️ Crímenes:** Entrenar stats y robar en las calles.');
  unlockedList.push('• **🛒 Tienda de Conveniencia & 🚨 Prisión:** Compras básicas y hospital/prisión.');

  if (level >= 3) {
    unlockedList.push('• **💼 Trabajos & 📋 Misiones:** Salarios diarios y misiones diarias.');
    unlockedList.push('• **🏥 Farmacia Hospitalaria:** Insumos médicos profesionales.');
  }

  if (level >= 5) {
    unlockedList.push('• **🎓 Universidad & 🏦 Banco:** Cursos pasivos e interés bancario.');
    unlockedList.push('• **🎒 Inventario & 🥩 Boss Diario:** Equipamiento y desafíos diarios.');
    unlockedList.push('• **🎰 Casino, 🏠 Inmobiliaria & 📈 Bolsa:** Tragamonedas, penthouse y acciones.');
  }

  if (level >= 10) {
    unlockedList.push('• **🏴 Facción, ⚔️ Guerras & 🏴 Raids:** Duelos de pandilla y bosses comunitarios.');
  }

  if (level >= 15) {
    unlockedList.push('• **🕳️ El Callejón del Sapo:** Mercado negro subterráneo y atracos de elite.');
  }

  const rankTitle = PlayerService.getPlayerRankTitle(level);

  return new EmbedBuilder()
    .setColor(0x2f3136)
    .setTitle('🏙️ LA CIUDAD DE SINFORD')
    .setDescription(
      `Bienvenido a la central de la ciudad, **${player.username}**.\n` +
      `**Rango Urbano:** ${rankTitle} (Nivel ${level} / 100)\n\n` +
      `**Estado Rápido & Vitalidad:**\n` +
      `⚡ Energía: ${energyBar} (**${stats.energy}/${stats.maxEnergy}**)\n` +
      `🧠 Nerve: ${nerveBar} (**${stats.nerve}/${stats.maxNerve}**)\n` +
      `😊 Happy: ${happyBar} (**${stats.happy}/${stats.maxHappy}**)\n\n` +
      `💰 Efectivo: **$${wallet.cash.toLocaleString()}** | 🏦 Banco: **$${wallet.bank.toLocaleString()}**`
    )
    .addFields({
      name: '🔍 Distritos & Mecánicas Desbloqueadas',
      value: unlockedList.join('\n'),
      inline: false,
    })
    .setFooter({ text: `Sinford Underworld • Nivel ${level} • Pulsa los botones para navegar` })
    .setTimestamp();
}

// Botones del Hub generados dinámicamente según el nivel de hito del jugador (Niveles 1, 3, 5, 10, 15)
export function createGameHubButtons(playerLevel: number = 1) {
  // Fila 1: Perfil, Stats, Trabajos (Nv. 3), Educación (Nv. 5), Misiones (Nv. 3)
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('hub_profile').setLabel('Perfil').setEmoji('👤').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('hub_stats').setLabel('Stats').setEmoji('📊').setStyle(ButtonStyle.Primary),
    playerLevel >= 3
      ? new ButtonBuilder().setCustomId('act_jobs').setLabel('Trabajos').setEmoji('💼').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_jobs').setLabel('🔒 Nv. 3').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_edu').setLabel('Educación').setEmoji('🎓').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_edu').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 3
      ? new ButtonBuilder().setCustomId('act_missions').setLabel('Misiones').setEmoji('📋').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_missions').setLabel('🔒 Nv. 3').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  // Fila 2: Gimnasio (Nv. 1), Crímenes (Nv. 1), Bounties (Nv. 10), Facción (Nv. 10), Guerras (Nv. 10)
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('act_gym').setLabel('Gimnasio').setEmoji('🏋️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_crime').setLabel('Crímenes').setEmoji('🕵️').setStyle(ButtonStyle.Danger),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_bounties').setLabel('Bounties').setEmoji('🎯').setStyle(ButtonStyle.Danger)
      : new ButtonBuilder().setCustomId('locked_bounties').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_faction').setLabel('Facción').setEmoji('🏴').setStyle(ButtonStyle.Danger)
      : new ButtonBuilder().setCustomId('locked_faction').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_war').setLabel('Guerras').setEmoji('⚔️').setStyle(ButtonStyle.Danger)
      : new ButtonBuilder().setCustomId('locked_war').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  // Fila 3: Inventario (Nv. 5), Banco (Nv. 5), Tienda (Nv. 1), Prisión (Nv. 1), El Callejón del Sapo (Nv. 15)
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('hub_inventory').setLabel('Inventario').setEmoji('🎒').setStyle(ButtonStyle.Secondary)
      : new ButtonBuilder().setCustomId('locked_inv').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_bank').setLabel('Banco').setEmoji('🏦').setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId('locked_bank').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('act_shop').setLabel('Tienda').setEmoji('🛒').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_jail').setLabel('Prisión').setEmoji('🚨').setStyle(ButtonStyle.Secondary),
    playerLevel >= 15
      ? new ButtonBuilder().setCustomId('act_secret_alley').setLabel('Callejón').setEmoji('🕳️').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_secret').setLabel('🔒 Nv. 15').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  // Fila 4: Boss Diario (Nv. 5), Raid de Facción (Nv. 10), Mercado Negro (Nv. 5), Profesiones (Nv. 10), Viajes (Nv. 5)
  const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_boss_daily').setLabel('Boss Diario (Chen 🥩)').setStyle(ButtonStyle.Danger)
      : new ButtonBuilder().setCustomId('locked_boss_daily').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_boss_weekly').setLabel('Raid de Facción (🏴)').setStyle(ButtonStyle.Danger)
      : new ButtonBuilder().setCustomId('locked_boss_weekly').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_black_market').setLabel('Mercado Negro').setEmoji('🕵️').setStyle(ButtonStyle.Secondary)
      : new ButtonBuilder().setCustomId('locked_bm').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_professions').setLabel('Profesión').setEmoji('🎭').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_prof').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_travel').setLabel('Viajes').setEmoji('✈️').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_travel').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  // Fila 5: Carreras (Nv. 5), Empresa (Nv. 10), Casino (Nv. 5), Propiedades (Nv. 5), Bolsa (Nv. 5)
  const row5 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_racing').setLabel('Carreras').setEmoji('🏎️').setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId('locked_racing').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 10
      ? new ButtonBuilder().setCustomId('act_company').setLabel('Empresa').setEmoji('🏢').setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId('locked_company').setLabel('🔒 Nv. 10').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_casino').setLabel('Casino').setEmoji('🎰').setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId('locked_casino').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_properties').setLabel('Inmuebles').setEmoji('🏠').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_properties').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true),
    playerLevel >= 5
      ? new ButtonBuilder().setCustomId('act_stocks').setLabel('Bolsa').setEmoji('📈').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId('locked_stocks').setLabel('🔒 Nv. 5').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  return [row1, row2, row3, row4, row5];
}

// Vista del Lugar Secreto Descubierto: El Callejón del Sapo (Nivel 15+)
export function createSecretAlleyViewEmbed(player: any) {
  const quote = NPCService.getRandomQuote('corleone', player?.level || 15);
  return new EmbedBuilder()
    .setColor(0x006400)
    .setTitle('🚨 NUEVO LUGAR DESCUBIERTO — 🕳️ El Callejón del Sapo')
    .setDescription(
      `${quote}\n\n` +
      `*No sabes qué es esto. Probablemente no deberías haber entrado aquí.*\n\n` +
      `**Actividades Clandestinas:**\n` +
      `• **🐸 Don Corleone "El Sapo":** Te ofrece contratos de atraco de alto riesgo.\n` +
      `• **🧪 El Profe Vane:** Mercado negro de drogas y estimulantes raros.\n` +
      `• **🎲 Dados Clandestinos:** Apuestas ilegales sin comisiones bancarias.`
    )
    .setFooter({ text: 'Lugar Secreto (Nivel 15+) • Humor & Caos de Sinford Underworld' });
}

// 2. Vista de Perfil General con Barras de Salud Visuales en 6 Partes Corporales
export function createProfileViewEmbed(player: any) {
  const wallet = player.wallet;
  const stats = player.stats;
  const body = player.bodyParts;
  const createdDate = new Date(player.createdAt).toLocaleDateString('es-ES');
  const rankTitle = PlayerService.getPlayerRankTitle(player.level);
  const maxHp = PlayerService.getMaxHpForLevel(player.level);
  const addictionLevel = player.addiction?.level || 0;
  const mastery = player.mastery;
  const combatLvl = Math.floor((mastery?.combatExp || 0) / 500) + 1;
  const crimeLvl = Math.floor((mastery?.crimeExp || 0) / 500) + 1;
  const bizLvl = Math.floor((mastery?.businessExp || 0) / 500) + 1;
  const facLvl = Math.floor((mastery?.factionExp || 0) / 500) + 1;
  const perkPoints = mastery?.perkPoints || 0;

  return new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle(`👤 Perfil de Jugador — ${player.username}`)
    .setDescription(
      `**Rango Urbano:** ${rankTitle}\n` +
      `**ID de Discord:** \`${player.discordId}\` | **Miembro desde:** ${createdDate}`
    )
    .addFields(
      {
        name: '⭐ Progresión Base',
        value: `Nivel: **${player.level} / 100**\nExperiencia (XP): **${player.xp.toLocaleString()} XP**`,
        inline: true,
      },
      {
        name: '💰 Finanzas',
        value: `Efectivo en Mano: **$${wallet.cash.toLocaleString()}**\nDepositado en Banco: **$${wallet.bank.toLocaleString()}**`,
        inline: true,
      },
      {
        name: '⚡ Vitalidad & Adicción',
        value: `Energía: **${stats.energy}/${stats.maxEnergy}** ⚡\nNerve: **${stats.nerve}/${stats.maxNerve}** 🧠\nFelicidad: **${stats.happy}/${stats.maxHappy}** 😊\n💊 Adicción: **${addictionLevel}%**`,
        inline: true,
      },
      {
        name: '🏆 Maestrías de Jugador (Builds)',
        value:
          `⚔️ **Combate:** Nivel ${combatLvl} | 🕵️ **Crimen:** Nivel ${crimeLvl}\n` +
          `💼 **Negocios:** Nivel ${bizLvl} | 🏴 **Facción:** Nivel ${facLvl}\n` +
          `🎯 Puntos de Perk Disponibles: **${perkPoints} Puntos**`,
        inline: false,
      },
      {
        name: `🏥 Salud Corporal (HP Máx: ${maxHp} HP)`,
        value:
          `🧠 **Cabeza:** ${renderHealthBar(body.headHp, 100)}\n` +
          `🫀 **Torso:** ${renderHealthBar(body.torsoHp, 100)}\n` +
          `💪 **Brazo Izquierdo:** ${renderHealthBar(body.leftArmHp, 100)}\n` +
          `💪 **Brazo Derecho:** ${renderHealthBar(body.rightArmHp, 100)}\n` +
          `🦵 **Pierna Izquierda:** ${renderHealthBar(body.leftLegHp, 100)}\n` +
          `🦵 **Pierna Derecha:** ${renderHealthBar(body.rightLegHp, 100)}`,
        inline: false,
      }
    )
    .setFooter({ text: 'Pantalla de Perfil General • Sinford Underworld' });
}

// 3. Vista de Guerras y Rankings de Facciones
export function createWarfareViewEmbed(rankings: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle('⚔️ GUERRAS Y RANKING DE FACCIONES')
    .setDescription('Compite contra otras facciones por la supremacía de la ciudad y el control del respeto.');

  if (rankings.length === 0) {
    embed.addFields({ name: '🏆 Ranking de Facciones', value: 'Aún no se han fundado facciones en este servidor.' });
  } else {
    const list = rankings.map((f, i) =>
      `\`#${i + 1}\` **${f.name}** — ⭐ **${f.respect.toLocaleString()} Respeto** | 👥 **${f.members?.length || 1} Miembros** | 🏦 **$${BigInt(f.treasury).toLocaleString()}**`
    ).join('\n');
    embed.addFields({ name: '🏆 Top Facciones de la Ciudad', value: list });
  }

  embed.setFooter({ text: 'Los duelos de combate durante la guerra aportan +10 pts de guerra y +15 Respeto' });
  return embed;
}

// 4. Vista de Trabajos (Jobs)
export function createJobsViewEmbed(playerJob: any, playerLevel: number = 1) {
  const quote = NPCService.getRandomQuote('marta', playerLevel);
  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle('💼 EMPLEOS Y CENTRO LABORAL DE SINFORD')
    .setDescription(`${quote}\n\nTrabaja diariamente para ganar salarios en efectivo, Job Points y aumentar tus Working Stats.`);

  if (playerJob) {
    const jobDef = JOBS.find((j) => j.id === playerJob.jobId);
    embed.addFields({
      name: '👔 Empleo Actual',
      value: `• Trabajo: **${jobDef?.name || playerJob.jobId}**\n• Rango: **Rango ${playerJob.rank}**\n• Salario Diario: **$${((jobDef?.baseSalary || 100) * playerJob.rank).toLocaleString()}**\n• Job Points: **${playerJob.jobPoints} Puntos**`,
    });
  } else {
    embed.addFields({ name: '👔 Empleo Actual', value: 'No tienes un trabajo activo. Elige uno del catálogo abajo.' });
  }

  const jobList = JOBS.map((j) =>
    `• **${j.name}** — Salario Base: **$${j.baseSalary.toLocaleString()}** (Req: Labor ${j.reqLabor}, Intel ${j.reqIntel}, End ${j.reqEndurance})`
  ).join('\n');

  embed.addFields({ name: '📋 Trabajos Disponibles', value: jobList });
  embed.setFooter({ text: 'Selecciona una acción laboral abajo' });

  return embed;
}

export function createJobsButtons() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('job_collect_salary').setLabel('Cobrar Salario Diario').setEmoji('💵').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('job_apply_grocer').setLabel('Abarrotes').setEmoji('🛒').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('job_apply_casino').setLabel('Casino').setEmoji('🎰').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('job_apply_medical').setLabel('Hospital').setEmoji('🏥').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

// 5. Vista de Educación (Courses)
export function createEducationViewEmbed(activeCourse: any, playerLevel: number = 1) {
  const quote = NPCService.getRandomQuote('prof_albert', playerLevel);
  const embed = new EmbedBuilder()
    .setColor(0x9370db)
    .setTitle('🎓 UNIVERSIDAD DE SINFORD — CURSOS Y EDUCACIÓN')
    .setDescription(`${quote}\n\nInscríbete en cursos para obtener habilidades pasivas permanentes y bonificaciones.`);

  if (activeCourse) {
    const courseDef = COURSES.find((c) => c.id === activeCourse.courseId);
    const dateStr = new Date(activeCourse.completesAt).toLocaleTimeString('es-ES');
    embed.addFields({
      name: '📖 Curso Activo',
      value: `• Curso: **${courseDef?.name || activeCourse.courseId}**\n• Finaliza a las: **${dateStr}** ${activeCourse.isCompleted ? '`[¡COMPLETADO!]`' : '`[EN PROGRESO]`'}`,
    });
  } else {
    embed.addFields({ name: '📖 Curso Activo', value: 'No estás inscrito en ningún curso actualmente.' });
  }

  const courseList = COURSES.map((c) =>
    `• **${c.name}** — Costo: **$${c.cost.toLocaleString()}** (${c.durationHours}h) ➔ ${c.bonusDescription}`
  ).join('\n');

  embed.addFields({ name: '📚 Catálogo de Cursos', value: courseList });
  embed.setFooter({ text: 'Inscríbete seleccionando un curso abajo' });

  return embed;
}

export function createEducationSelectRow() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_edu_course')
    .setPlaceholder('Selecciona un curso para matricularte...');

  const options = COURSES.map((c) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${c.name} ($${c.cost})`)
      .setValue(c.id)
      .setDescription(`Duración: ${c.durationHours}h — ${c.bonusDescription.substring(0, 45)}`)
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 6. Vista de Facción
export function createFactionViewEmbed(faction: any) {
  const embed = new EmbedBuilder()
    .setColor(0x800080)
    .setTitle(`🏴 FACCIÓN — ${faction ? faction.name : 'Sin Facción'}`);

  if (!faction) {
    embed.setDescription('No perteneces a ninguna facción actualmente. Crea una por **$50,000** o únete a una existente.');
  } else {
    embed.setDescription(
      `**Descripción:** ${faction.description || 'Sin descripción'}\n\n` +
      `👑 Líder ID: \`${faction.leaderId}\` | 👥 Miembros: **${faction.members?.length || 1}/20**\n` +
      `⭐ Respeto: **${faction.respect.toLocaleString()} Puntos** | 🏦 Tesorería: **$${BigInt(faction.treasury).toLocaleString()}**`
    );
  }

  embed.setFooter({ text: 'Juego en equipo y Crímenes Organizados' });
  return embed;
}

export function createFactionButtons(hasFaction: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>();

  if (!hasFaction) {
    row.addComponents(
      new ButtonBuilder().setCustomId('faction_create').setLabel('Crear Facción ($50k)').setEmoji('➕').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId('faction_dep_10k').setLabel('Depositar $10,000').setEmoji('💵').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('faction_execute_oc').setLabel('Iniciar Crimen Organizado').setEmoji('🔥').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
    );
  }

  return [row];
}

// 7. Vista de Bounties
export function createBountiesViewEmbed(bounties: any[], playerLevel: number = 1) {
  const quote = NPCService.getRandomQuote('callahan', playerLevel);
  const embed = new EmbedBuilder()
    .setColor(0xb22222)
    .setTitle('🎯 RECOMPENSAS PvP — BOUNTIES')
    .setDescription(`${quote}\n\nDerrota en combate a un jugador objetivo para reclamar la recompensa en efectivo.`);

  if (bounties.length === 0) {
    embed.addFields({ name: '📋 Bounties Activos', value: 'No hay recompensas activas en este momento.' });
  } else {
    const list = bounties.map((b) =>
      `• **Recompensa:** **$${b.reward.toLocaleString()}** (ID Objetivo: \`${b.targetPlayerId}\`) — Expira en 7 días`
    ).join('\n');
    embed.addFields({ name: '📋 Bounties Activos', value: list });
  }

  embed.setFooter({ text: 'Recompensas PvP con 10% de comisión' });
  return embed;
}

// 8. Vista de Misiones
export function createMissionsViewEmbed(missions: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0x4682b4)
    .setTitle('📋 MISIONES DIARIAS')
    .setDescription('Completa objetivos diarios para ganar efectivo y experiencia extra.');

  if (missions.length === 0) {
    embed.addFields({ name: '🎯 Misiones Activas', value: '¡Has completado todas tus misiones diarias!' });
  } else {
    const list = missions.map((m) =>
      `• **${m.title}**: ${m.description} (${m.progress}/${m.requirement}) — Recompensa: **+$${m.rewardCash.toLocaleString()}** | **+${m.rewardXp} XP** ${m.isCompleted ? '`[COMPLETADA]`' : ''}`
    ).join('\n');
    embed.addFields({ name: '🎯 Misiones Activas', value: list });
  }

  embed.setFooter({ text: 'Se reinician cada 24 horas' });
  return embed;
}

// 9. Vista de Crímenes
export function createCrimesViewEmbed(player: any) {
  const stats = player.stats;
  const quote = NPCService.getRandomQuote('charly', player?.level || 1);

  const embed = new EmbedBuilder()
    .setColor(0x800000)
    .setTitle(`🕵️ ACTIVIDADES ILÍCITAS Y CRÍMENES`)
    .setDescription(
      `${quote}\n\n` +
      `Comete crímenes para obtener dinero rápido y aumentar tu **Crime Skill**.\n\n` +
      `🧠 Nerve Disponible: **${stats.nerve}/${stats.maxNerve}** | 📈 Crime Skill: **${stats.crimeSkill.toFixed(2)}** | ⭐ Crime XP: **${stats.crimeExp.toLocaleString()}**`
    );

  const crimeList = CRIMES.map(
    (c) => `• **${c.name}** — Costo: **${c.nerveCost}🧠** | Requisito: **Nivel ${c.minLevel}** | Botín: **$${c.minReward.toLocaleString()} - $${c.maxReward.toLocaleString()}**`
  ).join('\n');

  embed.addFields({ name: '📋 Lista de Crímenes', value: crimeList });
  embed.setFooter({ text: 'Selecciona un crimen abajo para cometerlo' });

  return embed;
}

export function createCrimeSelectRow() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_crime')
    .setPlaceholder('Selecciona un crimen para cometerlo...');

  const options = CRIMES.map((c) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${c.name} (${c.nerveCost}🧠)`)
      .setValue(c.id)
      .setDescription(`Botín: $${c.minReward} - $${c.maxReward}`)
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 10. Vista de Prisión (Jail)
export function createJailViewEmbed(jailedPlayers: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0x4b0082)
    .setTitle('🚨 PRISIÓN DE LA CIUDAD DE SINFORD')
    .setDescription('Revisa la lista de prisioneros encarcelados. Puedes sacarlos mediante rescate o fianza.');

  if (jailedPlayers.length === 0) {
    embed.addFields({ name: '🔓 Estado de Celda', value: 'No hay prisioneros actualmente encarcelados.' });
  } else {
    const now = new Date();
    const list = jailedPlayers.map((p) => {
      const remainingMin = Math.ceil((new Date(p.jailUntil).getTime() - now.getTime()) / 60000);
      const bailCost = 100 * remainingMin * p.level;
      return `• **${p.username}** (Nivel ${p.level}) — Restante: **${remainingMin} min** | Fianza: **$${bailCost.toLocaleString()}**`;
    }).join('\n');

    embed.addFields({ name: '🔒 Prisioneros Encarcelados', value: list });
  }

  embed.setFooter({ text: 'Pulsa los botones para interactuar con la prisión' });
  return embed;
}

export function createJailActionButtons() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('jail_self_bust').setLabel('Fuga Propia (50% Nerve)').setEmoji('🔓').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

// 11. Vista de Estadísticas (Battle Stats & Working Stats)
export function createStatsViewEmbed(player: any) {
  const stats = player.stats;

  return new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle(`📊 Estadísticas de ${player.username}`)
    .addFields(
      {
        name: '⚔️ Battle Stats (Estadísticas de Combate)',
        value:
          `💪 **Fuerza (Strength):** ${stats.strength.toFixed(2)}\n` +
          `🛡️ **Defensa (Defense):** ${stats.defense.toFixed(2)}\n` +
          `⚡ **Velocidad (Speed):** ${stats.speed.toFixed(2)}\n` +
          `🎯 **Destreza (Dexterity):** ${stats.dexterity.toFixed(2)}`,
        inline: true,
      },
      {
        name: '💼 Working Stats (Estadísticas Laborales)',
        value:
          `🔨 **Fuerza Manual (Manual Labor):** ${stats.manualLabor.toFixed(2)}\n` +
          `🧠 **Inteligencia (Intelligence):** ${stats.intelligence.toFixed(2)}\n` +
          `🏋️ **Resistencia (Endurance):** ${stats.endurance.toFixed(2)}`,
        inline: true,
      }
    )
    .setFooter({ text: 'Utiliza el Gimnasio y Trabajos para aumentar tus stats' });
}

// 12. Vista de Gimnasio
export function createGymViewEmbed(player: any) {
  const stats = player.stats;
  const currentGym = GymService.getGymByTier(player.gymTier);
  const nextGym = GYMS.find((g) => g.tier === player.gymTier + 1);
  const quote = NPCService.getRandomQuote('tony', player?.level || 1);

  return new EmbedBuilder()
    .setColor(0x32cd32)
    .setTitle(`🏋️ GIMNASIO — ${currentGym.name}`)
    .setDescription(
      `${quote}\n\n` +
      `Entrena tus **Battle Stats** para dominar en combate. Cada sesión de entrenamiento consume **${currentGym.energyPerTrain}⚡ de Energía**.\n\n` +
      `**Recursos Actuales:**\n` +
      `⚡ Energía: **${stats.energy}/${stats.maxEnergy}** | 😊 Happy: **${stats.happy}/${stats.maxHappy}**\n` +
      `⭐ Exp de Gimnasio: **${player.gymExp.toLocaleString()} Exp**`
    )
    .addFields(
      {
        name: '⚔️ Battle Stats Actuales',
        value:
          `💪 Fuerza: **${stats.strength.toFixed(2)}**\n` +
          `🛡️ Defensa: **${stats.defense.toFixed(2)}**\n` +
          `⚡ Velocidad: **${stats.speed.toFixed(2)}**\n` +
          `🎯 Destreza: **${stats.dexterity.toFixed(2)}**`,
        inline: true,
      },
      {
        name: '🏆 Membresía de Gimnasio',
        value:
          `Nivel de Gimnasio: **Tier ${currentGym.tier}** (${currentGym.multiplier}x multiplicador)\n` +
          (nextGym
            ? `Siguiente Gimnasio: **${nextGym.name}**\nCosto: **$${nextGym.cost.toLocaleString()}** | Requisito: **${nextGym.requiredExp} Exp**`
            : '¡Has alcanzado el gimnasio de máximo nivel!'),
        inline: true,
      }
    )
    .setFooter({ text: 'Fórmula de ganancia inspirada en Torn Wiki' });
}

export function createGymButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('gym_train_strength').setLabel('Entrenar Fuerza').setEmoji('💪').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('gym_train_defense').setLabel('Entrenar Defensa').setEmoji('🛡️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('gym_train_speed').setLabel('Entrenar Velocidad').setEmoji('⚡').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('gym_train_dexterity').setLabel('Entrenar Destreza').setEmoji('🎯').setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('gym_upgrade').setLabel('Mejorar Gimnasio').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

// 13. Vista y Resultados de Combate PvP
export function createCombatResultEmbed(result: CombatResult) {
  const embed = new EmbedBuilder()
    .setColor(0xdc143c)
    .setTitle(`⚔️ COMBATE PvP — GANADOR: ${result.winnerUsername}`)
    .setDescription(`**Daño total infligido:** ${result.totalDamageDealt} HP\n\n**Desglose del combate por turnos:**`);

  const turnLog = result.turns.map((t) => {
    if (!t.isHit) {
      return `\`[Turno ${t.turnNumber}]\` **${t.attackerName}** usó **${t.weaponName}** y ❌ **FALLÓ** el disparo.`;
    }
    const critTag = t.isCritical ? ' 💥 **¡IMPACTO CRÍTICO!**' : '';
    return `\`[Turno ${t.turnNumber}]\` **${t.attackerName}** atacó con **${t.weaponName}** en la zona **${t.bodyPart}** causando **-${t.damage} HP**${critTag}.`;
  }).join('\n');

  embed.addFields({ name: '📜 Registro de Ataques', value: turnLog.substring(0, 1024) });
  embed.setFooter({ text: 'Selecciona la acción posterior a la victoria abajo' });

  return embed;
}

export function createPostCombatActionButtons(winnerId: string, loserId: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`post_combat_leave_${winnerId}_${loserId}`).setLabel('Dejar Tirado (+100 XP)').setEmoji('🚪').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`post_combat_mug_${winnerId}_${loserId}`).setLabel('Asaltar Dinero (+40 XP)').setEmoji('💸').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`post_combat_hosp_${winnerId}_${loserId}`).setLabel('Hospitalizar 60m (+20 XP)').setEmoji('🚑').setStyle(ButtonStyle.Danger)
  );

  return [row];
}

// 14. Vista de Inventario
export function createInventoryViewEmbed(player: any) {
  const items = player.inventory || [];

  const embed = new EmbedBuilder()
    .setColor(0xd2691e)
    .setTitle(`🎒 Inventario de ${player.username}`);

  if (items.length === 0) {
    embed.setDescription('Tu inventario está vacío. Compra objetos en la **🛒 Tienda** o completa crímenes.');
  } else {
    const itemList = items
      .map((inv: any) => {
        const typeTranslated = translateWeaponType(inv.item.weaponType) || translateItemType(inv.item.type);
        return `• **${inv.item.name}** x${inv.quantity} (${typeTranslated}) ${inv.isEquipped ? '`[EQUIPADO]`' : ''}`;
      })
      .join('\n');
    embed.setDescription(itemList);
  }

  embed.setFooter({ text: `Capacidad: ${items.length}/100 objetos` });
  return embed;
}

export function createInventoryItemSelectRow(inventory: any[]) {
  if (!inventory || inventory.length === 0) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_inv_item')
    .setPlaceholder('Selecciona un objeto del inventario para interactuar...');

  const options = inventory.slice(0, 25).map((inv: any) => {
    const typeTranslated = translateWeaponType(inv.item.weaponType) || translateItemType(inv.item.type);
    return new StringSelectMenuOptionBuilder()
      .setLabel(`${inv.item.name} (x${inv.quantity})`)
      .setValue(inv.id)
      .setDescription(`${typeTranslated} — ${inv.isEquipped ? 'Equipado' : 'Sin equipar'}`);
  });

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 15. Vista de Equipamiento
export function createEquipmentViewEmbed(player: any) {
  const inventory = player.inventory || [];
  const primary = inventory.find((i: any) => i.isEquipped && i.slot === 'PRIMARY')?.item?.name || 'Ninguna (Puños)';
  const secondary = inventory.find((i: any) => i.isEquipped && i.slot === 'SECONDARY')?.item?.name || 'Ninguna';
  const melee = inventory.find((i: any) => i.isEquipped && i.slot === 'MELEE')?.item?.name || 'Ninguna';
  const temporary = inventory.find((i: any) => i.isEquipped && i.slot === 'TEMPORARY')?.item?.name || 'Ninguna';

  return new EmbedBuilder()
    .setColor(0x4b0082)
    .setTitle(`⚔️ Equipamiento de Combate — ${player.username}`)
    .addFields(
      { name: '🔫 Arma Principal', value: `**${primary}**`, inline: true },
      { name: '🔫 Arma Secundaria', value: `**${secondary}**`, inline: true },
      { name: '🔪 Arma Cuerpo a Cuerpo', value: `**${melee}**`, inline: true },
      { name: '💣 Arma Temporal', value: `**${temporary}**`, inline: true }
    )
    .setFooter({ text: 'Equipa armas desde tu inventario' });
}

// 16. Vista de Banco y Finanzas
export function createBankViewEmbed(player: any) {
  const wallet = player.wallet;
  const quote = NPCService.getRandomQuote('salieri', player?.level || 1);

  return new EmbedBuilder()
    .setColor(0x2e8b57)
    .setTitle(`🏦 Banco Central de Sinford — ${player.username}`)
    .setDescription(
      `${quote}\n\n` +
      `Gestiona tus fondos de manera segura sin riesgos de robo.\n\n` +
      `💰 **Efectivo en Mano:** $${wallet.cash.toLocaleString()}\n` +
      `🏦 **Saldo en Banco:** $${wallet.bank.toLocaleString()}`
    )
    .setFooter({ text: 'Selecciona una acción bancaria abajo' });
}

export function createBankActionButtons() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('bank_dep_100').setLabel('Depositar $100').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('bank_dep_all').setLabel('Depositar Todo').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('bank_wit_100').setLabel('Retirar $100').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bank_wit_all').setLabel('Retirar Todo').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

// 17. Vista de Tienda de la Ciudad Paginada por Categorías
export function createShopCatalogEmbed(catalog: any[], playerLevel: number = 1, catIndex: number = 0) {
  const category = SHOP_CATEGORIES[catIndex] || SHOP_CATEGORIES[0];
  const quote = NPCService.getRandomQuote('jimmy');

  const embed = new EmbedBuilder()
    .setColor(0xff8c00)
    .setTitle(`🛒 TIENDA DE SINFORD — ${category.emoji} ${category.name.toUpperCase()}`)
    .setDescription(
      `${quote}\n\n` +
      `**Sección (${catIndex + 1}/${SHOP_CATEGORIES.length}):** ${category.description}\n` +
      `Navega entre las secciones usando los botones **◀️ Anterior** y **▶️ Siguiente** abajo.`
    );

  if (catalog.length === 0) {
    embed.addFields({ name: `📦 Productos de ${category.name}`, value: 'No hay productos en esta categoría actualmente.' });
  } else {
    const itemList = catalog.slice(0, 15).map((item: any) => {
      const minLevel = ShopService.getItemMinLevel(item);
      const lockTag = playerLevel >= minLevel ? '' : ` \`[🔒 Nv. ${minLevel}]\``;
      const typeTranslated = translateWeaponType(item.weaponType) || translateItemType(item.type);
      return `• **${item.name}** — **$${item.price.toLocaleString()}** (${typeTranslated})${lockTag}`;
    }).join('\n');

    embed.addFields({ name: `📦 Productos de ${category.name}`, value: itemList });
  }

  embed.setFooter({ text: `Tu Nivel: ${playerLevel} • Sección ${catIndex + 1} de ${SHOP_CATEGORIES.length} • Sinford Armory` });

  return embed;
}

// Botones de Navegación entre Categorías de la Tienda
export function createShopNavButtons(currentCatIndex: number = 0) {
  const total = SHOP_CATEGORIES.length;
  const prevIndex = (currentCatIndex - 1 + total) % total;
  const nextIndex = (currentCatIndex + 1) % total;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`shop_cat_${prevIndex}`).setLabel('Anterior').setEmoji('◀️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('shop_cat_info').setLabel(`Sección ${currentCatIndex + 1}/${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`shop_cat_${nextIndex}`).setLabel('Siguiente').setEmoji('▶️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_market').setLabel('Mercado P2P').setEmoji('📦').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

export function createShopSelectRow(catalog: any[]) {
  if (!catalog || catalog.length === 0) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_shop_item')
    .setPlaceholder('Selecciona un objeto de esta sección para comprar...');

  const options = catalog.slice(0, 25).map((item: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${item.name} ($${item.price.toLocaleString()})`)
      .setValue(item.id)
      .setDescription((item.description || 'Sin descripción').substring(0, 50))
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 18. Vista de Historial de Transacciones
export function createTxHistoryEmbed(player: any, txs: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0x708090)
    .setTitle(`📜 Historial de Transacciones de ${player.username}`);

  if (txs.length === 0) {
    embed.setDescription('Aún no tienes registro de transacciones monetarias.');
  } else {
    const list = txs.map((tx: any) => {
      const dateStr = new Date(tx.timestamp).toLocaleTimeString('es-ES');
      const sign = tx.amount >= 0n ? '+' : '';
      const typeTranslated = translateTxType(tx.type);
      return `\`[${dateStr}]\` **${typeTranslated}**: ${sign}$${tx.amount.toLocaleString()} (Antes: $${tx.balanceBefore.toLocaleString()} ➔ Después: $${tx.balanceAfter.toLocaleString()})`;
    }).join('\n');

    embed.setDescription(list);
  }

  embed.setFooter({ text: 'Registro auditable atómico' });
  return embed;
}

// Botón universal de navegación para regresar al Hub
export function createBackButtonRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );
}

// 19. Vista de Boss Diario (Consola de Combate Táctico)
export function createDailyBossViewEmbed(boss: any, playerDamageLog?: any, player?: any) {
  const phaseInfo = getBossPhase(boss.currentHp, boss.maxHp);
  const def = BOSS_DEFINITIONS[boss.type] || {
    abilityName: '⚔️ Habilidad Desconocida',
    abilityDescription: 'Sin datos tácticos.',
  };
  const hpBar = renderProgressBar(boss.currentHp, boss.maxHp, 12, '🟥', '░');
  const playerDamage = playerDamageLog ? playerDamageLog.damageDealt : 0;
  const quote = BossService.getRandomBossQuote(boss.type, phaseInfo.phase);

  const stats = player?.stats;
  const energyText = stats ? `⚡ **Energía Disponible:** \`${stats.energy} / ${stats.maxEnergy}⚡\`` : '';
  const anatomicalDoll = player?.bodyParts ? renderAnatomicalDoll(player.bodyParts) : '';

  const embed = new EmbedBuilder()
    .setColor(phaseInfo.phase === 'DESPERATE' ? 0xff0000 : phaseInfo.phase === 'ENRAGED' ? 0xff5500 : 0xd32f2f)
    .setTitle(`${phaseInfo.emoji} WORLD BOSS DIARIO — ${boss.name}`)
    .setDescription(
      `**Estado del Combate:** ${phaseInfo.title}\n` +
      `❤️ **Salud del Jefe:** ${hpBar} (**${boss.currentHp.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP**)\n\n` +
      `⚡ **Pasiva del Jefe:** **${def.abilityName}**\n` +
      `*${def.abilityDescription}*\n\n` +
      `💬 **Frase del Jefe:**\n> ${quote}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🫀 **Tu Estado Físico y Recursos:**\n` +
      `${energyText}\n` +
      `${anatomicalDoll}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 **Tu Daño Acumulado:** **${playerDamage.toLocaleString()} HP**\n` +
      `• Hito 1 (5k HP): $2,500 + 100 XP ${playerDamage >= 5000 ? '✅' : '🔒'}\n` +
      `• Hito 2 (15k HP): $7,500 + 250 XP ${playerDamage >= 15000 ? '✅' : '🔒'}\n` +
      `• Hito 3 (35k HP Épico): $15,000 + 500 XP ${playerDamage >= 35000 ? '✅' : '🔒'}`
    )
    .setFooter({ text: 'Consola de Combate Táctico • Elige tu arma o táctica abajo' });

  return embed;
}

// 20. Vista de Boss Semanal (Raid de Facción Táctico)
export function createWeeklyBossViewEmbed(boss: any, damageLogs: any[], player?: any) {
  const phaseInfo = getBossPhase(boss.currentHp, boss.maxHp);
  const def = BOSS_DEFINITIONS[boss.type] || {
    abilityName: '⚔️ Habilidad Desconocida',
    abilityDescription: 'Sin datos tácticos.',
  };
  const hpBar = renderProgressBar(boss.currentHp, boss.maxHp, 12, '🟪', '░');
  const quote = BossService.getRandomBossQuote(boss.type, phaseInfo.phase);

  const stats = player?.stats;
  const energyText = stats ? `⚡ **Energía Disponible:** \`${stats.energy} / ${stats.maxEnergy}⚡\`` : '';
  const anatomicalDoll = player?.bodyParts ? renderAnatomicalDoll(player.bodyParts) : '';

  const embed = new EmbedBuilder()
    .setColor(phaseInfo.phase === 'DESPERATE' ? 0x9900cc : phaseInfo.phase === 'ENRAGED' ? 0xaa00aa : 0x8e24aa)
    .setTitle(`${phaseInfo.emoji} RAID DE FACCIÓN SEMANAL — ${boss.name}`)
    .setDescription(
      `**Estado de Incursión:** ${phaseInfo.title}\n` +
      `💜 **Salud de la Fortaleza:** ${hpBar} (**${boss.currentHp.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP**)\n\n` +
      `⚡ **Pasiva de Fortaleza:** **${def.abilityName}**\n` +
      `*${def.abilityDescription}*\n\n` +
      `💬 **Desafío del Jefe:**\n> ${quote}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🫀 **Tu Estado Físico y Recursos:**\n` +
      `${energyText}\n` +
      `${anatomicalDoll}`
    );

  if (!damageLogs || damageLogs.length === 0) {
    embed.addFields({ name: 'Sin ataques registrados', value: '¡Sé la primera facción en enviar combatientes!' });
  } else {
    const list = damageLogs.slice(0, 5).map((log: any, idx: number) => {
      const pName = log.player ? log.player.username : 'Combatiente';
      return `${idx + 1}. **${pName}**: ${log.damageDealt.toLocaleString()} HP infligidos (${log.attacksCount} ataques)`;
    }).join('\n');

    embed.addFields(
      { name: '🎯 Recompensa para la Tesorería de Facción Ganadora', value: '+$500,000 en tesorería + 2,500 Puntos de Respeto + Buff Semanal' },
      { name: '📊 Clasificación:', value: list }
    );
  }

  embed.setFooter({ text: 'Raid de Facción de Fin de Semana • Elige tu acción táctica' });
  return embed;
}

export function createBossActionButtons(category: 'DAILY' | 'WEEKLY_FACTION', player?: any) {
  const inventory = player?.inventory || [];
  const primaryWep = inventory.find((i: any) => i.isEquipped && i.slot === 'PRIMARY')?.item;
  const secondaryWep = inventory.find((i: any) => i.isEquipped && i.slot === 'SECONDARY')?.item;
  const meleeWep = inventory.find((i: any) => i.isEquipped && i.slot === 'MELEE')?.item;

  const medCount = inventory
    .filter((i: any) => i.item.type === 'MEDICAL' && i.quantity > 0)
    .reduce((sum: number, i: any) => sum + i.quantity, 0);

  const throwCount = inventory
    .filter((i: any) => i.item.type === 'WEAPON' && (i.slot === 'TEMPORARY' || i.item.weaponType === 'Debuff' || i.item.weaponType === 'Heavy Artillery') && i.quantity > 0)
    .reduce((sum: number, i: any) => sum + i.quantity, 0);

  const hasEnergyItems = inventory.some((i: any) => {
    if (i.quantity <= 0 || !i.item.effect) return false;
    try {
      const eff = JSON.parse(i.item.effect);
      return !!eff.addEnergy;
    } catch {
      return false;
    }
  });

  const playerEnergy = player?.stats?.energy ?? 100;

  // Fila 1: Selección de Armamento
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`boss_act_ATK_PRIMARY_${category}`)
      .setLabel(primaryWep ? `🔫 ${primaryWep.name.substring(0, 15)} (25⚡)` : '🔫 Primaria (25⚡)')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(playerEnergy < 25),
    new ButtonBuilder()
      .setCustomId(`boss_act_ATK_SECONDARY_${category}`)
      .setLabel(secondaryWep ? `🎯 ${secondaryWep.name.substring(0, 15)} (15⚡)` : '🎯 Secundaria (15⚡)')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(playerEnergy < 15),
    new ButtonBuilder()
      .setCustomId(`boss_act_ATK_MELEE_${category}`)
      .setLabel(meleeWep ? `🗡️ ${meleeWep.name.substring(0, 15)} (15⚡)` : '🗡️ Puños/Melee (15⚡)')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(playerEnergy < 15)
  );

  // Fila 2: Tácticas y Recursos de Apoyo
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`boss_act_TACTICAL_COVER_${category}`)
      .setLabel('🛡️ Cobertura (10⚡)')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(playerEnergy < 10),
    new ButtonBuilder()
      .setCustomId(`boss_act_TACTICAL_MED_${category}`)
      .setLabel(`💉 Botiquín (${medCount}) (15⚡)`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(playerEnergy < 15 || medCount === 0),
    new ButtonBuilder()
      .setCustomId(`boss_act_TACTICAL_THROWABLE_${category}`)
      .setLabel(`💣 Granada (${throwCount}) (20⚡)`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(playerEnergy < 20 || throwCount === 0)
  );

  if (category === 'WEEKLY_FACTION') {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`boss_act_FACTION_TAUNT_${category}`)
        .setLabel('📢 Provocar (15⚡)')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(playerEnergy < 15)
    );
  }

  // Fila 3: Reclamos, Energía Rápida y Retirada
  const row3 = new ActionRowBuilder<ButtonBuilder>();

  if (playerEnergy < 15 && hasEnergyItems) {
    row3.addComponents(
      new ButtonBuilder()
        .setCustomId(`boss_quick_energy_${category}`)
        .setLabel('🔋 Tomar Energizante')
        .setStyle(ButtonStyle.Success)
    );
  }

  row3.addComponents(
    new ButtonBuilder()
      .setCustomId(`boss_claim_${category}`)
      .setLabel('Reclamar Hitos')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('nav_back_hub')
      .setLabel('Retirada / Hub')
      .setEmoji('🏙️')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

// 21. Vista de Mercado Negro (C.26)
export function createBlackMarketViewEmbed(event: any, player: any) {
  const stats = player.stats || {};
  const isSmuggler = player.profession === 'CONTRABANDISTA';
  const discountText = isSmuggler ? ' (🟢 -10% Descuento de Contrabandista aplicado)' : '';

  const adrUses = stats.adrenalinaUses || 0;
  const sueroUses = stats.sueroUses || 0;

  const adrBaseCost = 100000n;
  const sueroBaseCost = 75000n;

  const adrPrice = BlackMarketService.calculateScaledPrice(adrBaseCost, adrUses);
  const sueroPrice = BlackMarketService.calculateScaledPrice(sueroBaseCost, sueroUses);

  const adrFinal = isSmuggler ? (adrPrice * 90n) / 100n : adrPrice;
  const sueroFinal = isSmuggler ? (sueroPrice * 90n) / 100n : sueroPrice;

  return new EmbedBuilder()
    .setColor(0x1a1a1a)
    .setTitle(`🕵️ MERCADO NEGRO — ${event.npcName}`)
    .setDescription(
      `*${event.clueMessage}*\n\n` +
      `**Ubicación Actual:** ${event.locationName}${discountText}\n\n` +
      `**Catálogo Exclusivo en Efectivo:**\n` +
      `• 💉 **Inyección de Adrenalina Pura** — **$${adrFinal.toLocaleString()}** (Stock: ${event.adrenalinaStock}/1 | Tu Uso: ${adrUses}/5 usos máx)\n` +
      `  *Efecto: +5 Energía Máxima (⚡) permanente por uso*\n\n` +
      `• 🧪 **Suero Muscular Experimental** — **$${sueroFinal.toLocaleString()}** (Stock: ${event.sueroStock}/1 | Tu Uso: ${sueroUses}/3 usos máx)\n` +
      `  *Efecto: +1.0 Strength permanente por uso*\n\n` +
      `⚠️ *Controles Anti-Abuso: Stock limitado a 1 unidad por servidor, escalado de precios +50% y riesgo del 15% de Sobredosis si consumes múltiples en 24h.*`
    )
    .setFooter({ text: 'Pago en Efectivo en Mano Solamente • 2 Horas de Duración' });
}

export function createBlackMarketButtons(event: any) {
  const adrBtn = new ButtonBuilder()
    .setCustomId('bm_buy_adrenalina')
    .setLabel('Comprar Adrenalina (+5⚡)')
    .setEmoji('💉')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(event.adrenalinaStock <= 0);

  const sueroBtn = new ButtonBuilder()
    .setCustomId('bm_buy_suero')
    .setLabel('Comprar Suero (+1.0 STR)')
    .setEmoji('🧪')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(event.sueroStock <= 0);

  const backBtn = new ButtonBuilder()
    .setCustomId('nav_back_hub')
    .setLabel('Volver al Hub')
    .setEmoji('🏙️')
    .setStyle(ButtonStyle.Secondary);

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(adrBtn, sueroBtn, backBtn)];
}

// 22. Vista de Profesiones Ilegales (C.30)
export function createProfessionsViewEmbed(player: any) {
  const currentProf = player.profession;
  const embed = new EmbedBuilder()
    .setColor(0x4a148c)
    .setTitle('🎭 PROFESIONES ILEGALES — Especialización de Nivel 10+');

  if (currentProf) {
    const prof = PROFESSIONS.find((p) => p.id === currentProf);
    embed.setDescription(
      `**Tu Profesión Activa:** ${prof?.emoji} **${prof?.name}**\n\n` +
      `**Beneficios Exclusivos de tu Clase:**\n` +
      (prof?.perks.map((perk) => `• ${perk}`).join('\n') || '')
    );
  } else {
    embed.setDescription(
      `Has alcanzado el **Nivel 10**. Es momento de elegir tu especialización del inframundo.\n\n` +
      PROFESSIONS.map((p) => `${p.emoji} **${p.name}**:\n${p.description}\n${p.perks.map((perk) => `  • ${perk}`).join('\n')}`).join('\n\n')
    );
  }

  embed.setFooter({ text: 'Especialización Única • Torn City Standard' });
  return embed;
}

export function createProfessionsSelectRow(hasProfession: boolean) {
  if (hasProfession) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_profession')
    .setPlaceholder('Elige tu especialización de Nivel 10...');

  const options = PROFESSIONS.map((p) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${p.emoji} ${p.name}`)
      .setValue(p.id)
      .setDescription(p.description.substring(0, 50))
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 23. Vista de Viajes Internacionales
export function createTravelViewEmbed(player: any, travelState: any) {
  const embed = new EmbedBuilder()
    .setColor(0x0288d1)
    .setTitle('✈️ AEROPUERTO INTERNACIONAL DE SINFORD');

  if (travelState.isTraveling) {
    const dest = DESTINATIONS.find((d) => d.id === travelState.destination);
    const destName = dest ? dest.name : travelState.destination;
    const msLeft = new Date(travelState.arrivesAt).getTime() - Date.now();
    const minLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60)));

    embed.setDescription(
      `✈️ **¡Estás a bordo de un vuelo internacional!**\n\n` +
      `📍 **Destino:** ${destName}\n` +
      `⏳ **Tiempo restante estimado:** ~${minLeft} minuto(s).\n\n` +
      `*Relájate con los cacahuates rancios de la aerolínea mientras cruzas el espacio aéreo.*`
    );
    embed.setFooter({ text: 'En Vuelo • Los controles de Sinford están bloqueados hasta aterrizar' });
    return embed;
  }

  if (travelState.destination !== 'Home') {
    const dest = DESTINATIONS.find((d) => d.id === travelState.destination);
    const destName = dest ? dest.name : travelState.destination;

    embed.setDescription(
      `🛬 **Te encuentras actualmente en:** ${destName}\n\n` +
      `Estás fuera de Sinford City. Disfruta del aire extranjero o toma el vuelo de regreso a casa cuando estés listo.\n\n` +
      `💵 **Efectivo en mano:** $${player.wallet.cash.toLocaleString()}`
    );
    embed.setFooter({ text: 'Extranjero • Haz clic en Regresar a Sinford para volver' });
    return embed;
  }

  // En Casa (Home)
  const destList = DESTINATIONS.map(
    (d) => `• **${d.name}**: $${d.cost.toLocaleString()} • ⏱️ ${d.durationMinutes} min de vuelo`
  ).join('\n');

  embed.setDescription(
    `Bienvenido a la terminal de vuelos de Sinford.\n\n` +
    `💵 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n\n` +
    `🌍 **Destinos Internacionales Disponibles:**\n${destList}\n\n` +
    `*Selecciona tu destino en el menú desplegable de abajo para comprar tu boleto y despegar.*`
  );
  embed.setFooter({ text: 'Agencia de Viajes de Sinford • Sal de la ciudad para expandir tus horizontes' });
  return embed;
}

export function createTravelDestinationSelect() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_travel_destination')
    .setPlaceholder('✈️ Selecciona un destino internacional para viajar...');

  const options = DESTINATIONS.map((d) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(d.name)
      .setValue(d.id)
      .setDescription(`Costo: $${d.cost.toLocaleString()} • Vuelo: ${d.durationMinutes} min`)
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createTravelButtons(travelState: any) {
  const buttons: ButtonBuilder[] = [];

  if (!travelState.isTraveling && travelState.destination !== 'Home') {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('travel_return_home')
        .setLabel('Regresar a Sinford (Home)')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Primary)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId('nav_back_hub')
      .setLabel('Volver al Hub')
      .setEmoji('🏙️')
      .setStyle(ButtonStyle.Secondary)
  );

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];
}

// 24. Vista de Carreras Clandestinas
export function createRacingViewEmbed(player: any) {
  const speed = player.stats?.speed || 1.0;
  const cash = player.wallet?.cash || 0n;

  const trackList = TRACKS.map(
    (t) => `• 🏁 **${t.name}**: ${t.distanceKm} km • Inscripción: **$${t.entryFee.toLocaleString()}**`
  ).join('\n');

  return new EmbedBuilder()
    .setColor(0xd84315)
    .setTitle('🏎️ PISTAS DE CARRERAS CLANDESTINAS DE SINFORD')
    .setDescription(
      `El asfalto está caliente y el olor a neumático quemado inunda las calles.\n\n` +
      `📊 **Tu Velocidad (Speed):** ${speed.toFixed(2)} pts *(a mayor velocidad, menor tiempo de vuelta)*\n` +
      `💵 **Efectivo disponible:** $${cash.toLocaleString()}\n\n` +
      `🏁 **Pistas Oficiales Disponibles:**\n${trackList}\n\n` +
      `*Selecciona una pista en el menú de abajo para pagar la inscripción y correr de inmediato.*`
    )
    .setFooter({ text: 'Carreras Clandestinas • Conduce rápido o termina en el desguace' });
}

export function createRacingTrackSelect() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_racing_track')
    .setPlaceholder('🏎️ Selecciona una pista para competir...');

  const options = TRACKS.map((t) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(t.name)
      .setValue(t.id)
      .setDescription(`Distancia: ${t.distanceKm} km • Inscripción: $${t.entryFee.toLocaleString()}`)
      .setEmoji('🏁')
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createRacingResultEmbed(player: any, result: { trackName: string; timeSeconds: number }) {
  const timeFormatted = result.timeSeconds.toFixed(2);
  let commentary = '';

  if (result.timeSeconds < 40) {
    commentary = '🔥 ¡Volaste sobre el asfalto! Casi dejas el motor en la última curva, pero marcaste un tiempazo.';
  } else if (result.timeSeconds < 80) {
    commentary = '💨 Vuelta respetable. Los mecánicos dicen que el auto huele a embrague quemado, pero cruzaste la meta entero.';
  } else {
    commentary = '🐢 Tardaste tanto que los espectadores pensaron que te habías parado a comprar empanadas, pero completaste la pista.';
  }

  return new EmbedBuilder()
    .setColor(0xff6f00)
    .setTitle('🏁 RESULTADO DE CARRERA — Cronometraje Oficial')
    .setDescription(
      `📍 **Pista:** ${result.trackName}\n` +
      `⏱️ **Tiempo Registrado:** **${timeFormatted} segundos**\n\n` +
      `${commentary}\n\n` +
      `*El resultado ha sido registrado en los archivos del circuito clandestino.*`
    )
    .setFooter({ text: 'Cronometraje Oficial • Speedway Sinford' });
}

export function createRacingButtons() {
  const retryBtn = new ButtonBuilder()
    .setCustomId('act_racing')
    .setLabel('Correr de Nuevo')
    .setEmoji('🏁')
    .setStyle(ButtonStyle.Success);

  const backBtn = new ButtonBuilder()
    .setCustomId('nav_back_hub')
    .setLabel('Volver al Hub')
    .setEmoji('🏙️')
    .setStyle(ButtonStyle.Secondary);

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(retryBtn, backBtn)];
}

// 25. Vista de Empresas Privadas
export function createCompanyViewEmbed(player: any, company: any) {
  const embed = new EmbedBuilder()
    .setColor(0x1b5e20)
    .setTitle('🏢 REGISTRO DE EMPRESAS PRIVADAS DE SINFORD');

  if (company) {
    const def = COMPANY_TYPES.find((c) => c.type === company.type);
    const empCount = company.employees?.length || 0;
    const dailyRev = def ? def.dailyRevenue : 0;

    embed.setDescription(
      `**Nombre Comercial:** 🏢 **${company.name}**\n` +
      `**Giro de Negocio:** ${company.type}\n` +
      `**Ingresos Base:** $${dailyRev.toLocaleString()} / día *(acumula $${Math.floor(dailyRev / 24).toLocaleString()} cada hora)*\n\n` +
      `💰 **Ganancias Acumuladas Pendientes:** **$${company.revenue.toLocaleString()}**\n` +
      `👥 **Plantilla de Empleados:** ${empCount} empleado(s)\n\n` +
      `*Puedes cobrar las ganancias acumuladas con el botón de abajo o contratar empleados con el comando \`/empresa contratar\`.*`
    );
    embed.setFooter({ text: 'Gestión Corporativa • Sinford Commerce & Mafia' });
    return embed;
  }

  const typeList = COMPANY_TYPES.map(
    (c) => `• 🏢 **${c.name}** (${c.type}):\n  💵 Precio: **$${c.price.toLocaleString()}** • 📈 Ingresos: **$${c.dailyRevenue.toLocaleString()}/día**`
  ).join('\n\n');

  embed.setDescription(
    `Bienvenido a la Cámara de Comercio Clandestina de Sinford.\n` +
    `Funda tu propia empresa para generar ingresos pasivos recurrentes cada hora.\n\n` +
    `💵 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n\n` +
    `🏢 **Empresas Disponibles para Adquisición:**\n${typeList}\n\n` +
    `*Selecciona un rubro en el menú desplegable para comprar tu empresa.*`
  );
  embed.setFooter({ text: 'Inversión Empresarial • Los negocios legales son la mejor tapadera' });
  return embed;
}

export function createCompanyBuySelect() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_company_buy')
    .setPlaceholder('🏢 Selecciona un tipo de empresa para fundar...');

  const options = COMPANY_TYPES.map((c) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(c.name)
      .setValue(c.type)
      .setDescription(`Precio: $${c.price.toLocaleString()} • Ingreso: $${c.dailyRevenue.toLocaleString()}/día`)
      .setEmoji('🏢')
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createCompanyButtons(hasCompany: boolean) {
  const buttons: ButtonBuilder[] = [];

  if (hasCompany) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('company_collect_revenue')
        .setLabel('Cobrar Ganancias')
        .setEmoji('💰')
        .setStyle(ButtonStyle.Success)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId('nav_back_hub')
      .setLabel('Volver al Hub')
      .setEmoji('🏙️')
      .setStyle(ButtonStyle.Secondary)
  );

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];
}

// ==========================================
// 17. CASINO DE SINFORD (Slots & Blackjack)
// ==========================================
export function createCasinoViewEmbed(player: any) {
  const quote = NPCService.getRandomQuote('corleone', player?.level || 5);
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🎰 CASINO CLANDESTINO "EL SAPO DORADO"')
    .setDescription(
      `${quote}\n\n` +
      `Bienvenido a la sala de juegos clandestina de Sinford.\n` +
      `Aquí el dinero cambia de manos rápido. Recuerda: la casa siempre tiene ventaja.\n\n` +
      `💰 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n` +
      `🏦 **Tu Saldo Bancario:** $${player.wallet.bank.toLocaleString()}\n\n` +
      `**Juegos Disponibles:**\n` +
      `• 🎰 **Tragamonedas Clásica ($500 / $2,500 / $10,000):** Gira los 3 rodillos y busca el Jackpot 💎💎💎 (x50).\n` +
      `• 🃏 **Blackjack / 21 ($1,000 / $5,000):** Enfréntate mano a mano a la casa sin pasarte de 21.\n`
    )
    .setFooter({ text: 'Casino Clandestino • Juega con cabeza' });
}

export function createCasinoButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('casino_slots_500').setLabel('Slots ($500)').setEmoji('🎰').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('casino_slots_2500').setLabel('Slots ($2,500)').setEmoji('🎰').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('casino_slots_10000').setLabel('Slots ($10,000)').setEmoji('💎').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('casino_bj_1000').setLabel('Blackjack ($1,000)').setEmoji('🃏').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('casino_bj_5000').setLabel('Blackjack ($5,000)').setEmoji('🃏').setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🏙️').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

// ==========================================
// 18. INMOBILIARIA & PROPIEDADES (Real Estate)
// ==========================================
export function createPropertyViewEmbed(prop: any, player: any) {
  const currentPropDef = PROPERTIES.find((p) => p.type === prop.propertyType) || PROPERTIES[0];

  const propList = PROPERTIES.map((p) => {
    const isCurrent = p.type === prop.propertyType;
    return `• **${p.name}** (${p.type}):\n  💵 Precio: **$${p.price.toLocaleString()}** • 😊 Max Happy: **${p.maxHappy.toLocaleString()}** ${isCurrent ? '✅ *(Tu propiedad actual)*' : ''}`;
  }).join('\n\n');

  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('🏠 INMOBILIARIA DE SINFORD — Propiedades & Viviendas')
    .setDescription(
      `Tener una mejor propiedad incrementa tu **Felicidad Máxima (Happy)**, lo que potencia exponencialmente tus ganancias en el Gimnasio.\n\n` +
      `🏡 **Tu Propiedad Actual:** ${currentPropDef.name} (${prop.propertyType})\n` +
      `😊 **Capacidad Máxima de Felicidad:** ${player.stats.maxHappy} Happy\n` +
      `🤵 **Personal Contratado:** ${prop.hasStaff ? `Sí (${prop.staffType})` : 'Ninguno'}\n` +
      `💰 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n\n` +
      `**Catálogo de Propiedades:**\n${propList}`
    )
    .setFooter({ text: 'Inmobiliaria Sinford • El estatus lo es todo' });
}

export function createPropertySelect() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_property_buy')
    .setPlaceholder('🏠 Selecciona una propiedad para comprar...');

  const options = PROPERTIES.map((p) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(p.name)
      .setValue(p.type)
      .setDescription(`$${p.price.toLocaleString()} • Max Happy: ${p.maxHappy}`)
      .setEmoji('🏠')
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createPropertyButtons() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('prop_hire_maid').setLabel('Mucama ($500)').setEmoji('🧹').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('prop_hire_butler').setLabel('Mayordomo ($1,500)').setEmoji('🤵').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('prop_hire_guard').setLabel('Guardia ($2,500)').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🏙️').setStyle(ButtonStyle.Secondary)
    ),
  ];
}

// ==========================================
// 19. BOLSA DE VALORES (Stock Market)
// ==========================================
export function createStockMarketEmbed(playerStocks: any[], player: any) {
  const stockList = INITIAL_STOCKS.map((s) => {
    const owned = playerStocks.find((ps) => ps.symbol === s.symbol)?.shares || 0;
    return `• **[${s.symbol}] ${s.name}:**\n  💵 Precio por acción: **$${s.price.toLocaleString()}** • 📦 En posesión: **${owned.toLocaleString()} acciones**`;
  }).join('\n\n');

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📈 BOLSA DE VALORES DE SINFORD (Stock Market)')
    .setDescription(
      `Invierte en las corporaciones de Sinford. Acumular un bloque de **10,000 acciones** de una empresa te otorga dividendos pasivos semanales.\n\n` +
      `💰 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n\n` +
      `**Cotizaciones de Mercado:**\n${stockList}\n\n` +
      `**Beneficios de Dividendos Semanales (10,000+ Acciones):**\n` +
      `• **TNC (Banco):** +$50,000 en efectivo directo.\n` +
      `• **SYS (Sistemas):** +$25,000 bono de transporte.\n` +
      `• **MED (Farma):** +5x Botiquines de Primeros Auxilios.\n` +
      `• **OIL (Energía):** +100⚡ de Energía extra inmediata.\n`
    )
    .setFooter({ text: 'Bolsa de Valores • Pulsa los botones para operar' });
}

export function createStockBuySelect() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_stock_buy')
    .setPlaceholder('📈 Comprar paquete de 1,000 acciones...');

  const options = INITIAL_STOCKS.map((s) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${s.symbol} — 1,000 Acciones ($${(s.price * 1000).toLocaleString()})`)
      .setValue(s.symbol)
      .setDescription(s.name)
      .setEmoji('📈')
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createStockButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('stock_claim_TNC').setLabel('Dividendo TNC').setEmoji('🏦').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('stock_claim_MED').setLabel('Dividendo MED').setEmoji('📦').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('stock_claim_OIL').setLabel('Dividendo OIL').setEmoji('⚡').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('stock_claim_SYS').setLabel('Dividendo SYS').setEmoji('✈️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver').setEmoji('🏙️').setStyle(ButtonStyle.Secondary)
  );

  return [row1];
}

// ==========================================
// 20. MERCADO ABIERTO ENTRE JUGADORES (Player Market)
// ==========================================
export function createPlayerMarketEmbed(items: any[], player: any) {
  const list = items.length === 0
    ? '*No hay ofertas de ítems listadas en el mercado en este momento.*'
    : items.map((it, idx) => `**${idx + 1}.** ${it.item?.name || 'Ítem'} — Cantidad: x${it.quantity} • Precio: **$${it.price.toLocaleString()}** (Vendedor: <@${it.sellerId}>)`).join('\n');

  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('📦 MERCADO ABIERTO ENTRE JUGADORES')
    .setDescription(
      `Compra objetos publicados por otros ciudadanos de Sinford o adquiere excedentes de contrabando.\n\n` +
      `💰 **Tu Efectivo disponible:** $${player.wallet.cash.toLocaleString()}\n\n` +
      `**Ofertas Disponibles en Mercado:**\n${list}`
    )
    .setFooter({ text: 'Mercado Libre • Comercio P2P sin intermediarios' });
}

export function createPlayerMarketSelect(items: any[]) {
  if (items.length === 0) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_market_buy')
    .setPlaceholder('🛒 Selecciona un ítem para comprar del mercado...');

  const options = items.slice(0, 10).map((it) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${it.item?.name || 'Ítem'} (x${it.quantity})`)
      .setValue(it.id)
      .setDescription(`Precio: $${it.price.toLocaleString()}`)
      .setEmoji('📦')
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// ==========================================
// 21. ÁRBOL DE MAESTRÍAS & PERKS (Player Mastery)
// ==========================================
export function createMasteryViewEmbed(mastery: any, player: any) {
  const levels = MasteryService.calculateMasteryLevels(mastery);
  const perksList = PERKS.map((p) => `• ${p.emoji} **${p.name}** (${p.cost} Pt): ${p.description}`).join('\n');

  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🌟 ÁRBOL DE MAESTRÍAS — ${player.username}`)
    .setDescription(
      `Gana experiencia de maestría al combatir, cometer crímenes, trabajar y participar en guerras. Cada 500 EXP acumulados obtienes **1 Punto de Perk** para mejorar tus atributos de forma permanente.\n\n` +
      `✨ **Puntos de Perk Disponibles:** **${levels.perkPoints} Pts**\n\n` +
      `**Niveles de Especialización:**\n` +
      `• ⚔️ **Combate:** Nivel ${levels.combatLevel} (${mastery?.combatExp || 0} EXP)\n` +
      `• 🕵️ **Crimen:** Nivel ${levels.crimeLevel} (${mastery?.crimeExp || 0} EXP)\n` +
      `• 💼 **Negocios:** Nivel ${levels.businessLevel} (${mastery?.businessExp || 0} EXP)\n` +
      `• 🏴 **Facción:** Nivel ${levels.factionLevel} (${mastery?.factionExp || 0} EXP)\n\n` +
      `**Mejoras Permanentes Disponibles (Perks):**\n${perksList}`
    )
    .setFooter({ text: 'Maestrías de Sinford • Elige tu camino de especialización' });
}

export function createMasteryPerkSelect(perkPoints: number) {
  if (perkPoints <= 0) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_mastery_perk')
    .setPlaceholder('🌟 Selecciona una mejora permanente para canjear (1 Pt)...');

  const options = PERKS.map((p) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(p.name)
      .setValue(p.id)
      .setDescription(p.description)
      .setEmoji(p.emoji)
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function createMasteryButtons() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🏙️').setStyle(ButtonStyle.Secondary)
    ),
  ];
}
