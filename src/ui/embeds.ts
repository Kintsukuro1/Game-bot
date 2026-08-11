import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { GYMS, GymService } from '../services/gymService.js';
import { CombatResult } from '../services/combatService.js';
import { CRIMES } from '../services/crimeService.js';
import { JOBS } from '../services/jobService.js';
import { COURSES } from '../services/educationService.js';
import { renderProgressBar, renderHealthBar, createV2Container, createV2TextDisplay, createV2Separator } from './visualComponents.js';

// 1. Hub Principal de la Ciudad (Components V2 Container)
export function createGameHubEmbed(player: any, interactiveRows: any[] = []) {
  const stats = player.stats;
  const wallet = player.wallet;

  const energyBar = renderProgressBar(stats.energy, stats.maxEnergy, 8, '⚡', '░');
  const nerveBar = renderProgressBar(stats.nerve, stats.maxNerve, 8, '🧠', '░');
  const happyBar = renderProgressBar(stats.happy, stats.maxHappy, 8, '😊', '░');

  return createV2Container(0x2f3136, [
    createV2TextDisplay(
      `## 🏙️ LA CIUDAD DE SINFORD\n` +
      `Bienvenido a la central de la ciudad, **${player.username}**.\n` +
      `Todo tu progreso e interacciones ocurren desde este Hub interactivo sin saturar el chat.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### ⚡ Estado Rápido & Vitalidad\n` +
      `⚡ **Energía:** ${energyBar} (**${stats.energy}/${stats.maxEnergy}**)\n` +
      `🧠 **Nerve:** ${nerveBar} (**${stats.nerve}/${stats.maxNerve}**)\n` +
      `😊 **Happy:** ${happyBar} (**${stats.happy}/${stats.maxHappy}**)\n\n` +
      `💰 **Efectivo:** $${wallet.cash.toLocaleString()} | 🏦 **Banco:** $${wallet.bank.toLocaleString()}`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### 📌 Desarrollo & Actividades\n` +
      `• **👤 Perfil & 📊 Stats:** Tu información general, nivel y estadísticas.\n` +
      `• **💼 Trabajos & 🎓 Universidad:** Salarios diarios, Working Stats y cursos pasivos.\n` +
      `• **🏋️ Gimnasio & 🕵️ Crímenes:** Entrena Battle Stats y comete delitos para ganar XP.\n` +
      `• **⚔️ Guerra & 🏴 Facción:** Guerras entre facciones, tesorería y crímenes organizados.`
    ),
    createV2TextDisplay(
      `### 🎒 Economía & Servicios\n` +
      `• **🎯 Bounties & 📋 Misiones:** Cazarecompensas PvP y objetivos diarios.\n` +
      `• **🎒 Inventario & 🛒 Tienda:** Armas equipables, consumibles y armería.\n` +
      `• **🏦 Banco & Finanzas:** Depósitos, retiros y registro atómico auditado.\n` +
      `• **🚨 Prisión:** Fugas propias y rescate de compañeros encarcelados.`
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Sinford Underworld • Components V2 Navigation`),
    ...interactiveRows,
  ]);
}

// Organización armónica de los botones del Hub agrupados por categorías temáticas y colores
export function createGameHubButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('hub_profile').setLabel('Perfil').setEmoji('👤').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('hub_stats').setLabel('Stats').setEmoji('📊').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_jobs').setLabel('Trabajos').setEmoji('💼').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_edu').setLabel('Educación').setEmoji('🎓').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_missions').setLabel('Misiones').setEmoji('📋').setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('act_gym').setLabel('Gimnasio').setEmoji('🏋️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_crime').setLabel('Crímenes').setEmoji('🕵️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_bounties').setLabel('Bounties').setEmoji('🎯').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_faction').setLabel('Facción').setEmoji('🏴').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_war').setLabel('Guerras').setEmoji('⚔️').setStyle(ButtonStyle.Danger)
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('hub_inventory').setLabel('Inventario').setEmoji('🎒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('act_bank').setLabel('Banco').setEmoji('🏦').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_shop').setLabel('Tienda').setEmoji('🛒').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_jail').setLabel('Prisión').setEmoji('🚨').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('act_tx_history').setLabel('Historial').setEmoji('📜').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

// 2. Vista de Perfil General (Components V2 Container)
export function createProfileViewEmbed(player: any, interactiveRows: any[] = []) {
  const wallet = player.wallet;
  const stats = player.stats;
  const body = player.bodyParts;
  const createdDate = new Date(player.createdAt).toLocaleDateString('es-ES');

  return createV2Container(0x8b0000, [
    createV2TextDisplay(
      `## 👤 Perfil de Jugador — ${player.username}\n` +
      `**ID de Discord:** \`${player.discordId}\` | **Miembro desde:** ${createdDate}`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### ⭐ Progresión Base & Finanzas\n` +
      `• Nivel: **${player.level}** | Experiencia (XP): **${player.xp.toLocaleString()}**\n` +
      `• Efectivo en Mano: **$${wallet.cash.toLocaleString()}** | Banco: **$${wallet.bank.toLocaleString()}**`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### ⚡ Vitalidad y Recursos\n` +
      `⚡ Energía: **${stats.energy}/${stats.maxEnergy}** | 🧠 Nerve: **${stats.nerve}/${stats.maxNerve}** | 😊 Felicidad: **${stats.happy}/${stats.maxHappy}**`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### 🏥 Salud de Extremidades Corporales (6 Partes)\n` +
      `🧠 **Cabeza:** ${renderHealthBar(body.headHp, 100)}\n` +
      `🫀 **Torso:** ${renderHealthBar(body.torsoHp, 100)}\n` +
      `💪 **Brazo Izquierdo:** ${renderHealthBar(body.leftArmHp, 100)}\n` +
      `💪 **Brazo Derecho:** ${renderHealthBar(body.rightArmHp, 100)}\n` +
      `🦵 **Pierna Izquierda:** ${renderHealthBar(body.leftLegHp, 100)}\n` +
      `🦵 **Pierna Derecha:** ${renderHealthBar(body.rightLegHp, 100)}`
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Pantalla de Perfil General • Components V2`),
    ...interactiveRows,
  ]);
}

// 3. Vista de Guerras y Rankings de Facciones (Components V2 Container)
export function createWarfareViewEmbed(rankings: any[], interactiveRows: any[] = []) {
  let listStr = 'Aún no se han fundado facciones en este servidor.';
  if (rankings.length > 0) {
    listStr = rankings.map((f, i) =>
      `\`#${i + 1}\` **${f.name}** — ⭐ **${f.respect.toLocaleString()} Respeto** | 👥 **${f.members?.length || 1} Miembros** | 🏦 **$${BigInt(f.treasury).toLocaleString()}**`
    ).join('\n');
  }

  return createV2Container(0x8b0000, [
    createV2TextDisplay(
      `## ⚔️ GUERRAS Y RANKING DE FACCIONES\n` +
      `Compite contra otras facciones por la supremacía de la ciudad y el control del respeto.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 🏆 Top Facciones de la Ciudad\n${listStr}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Los duelos de combate durante la guerra aportan +10 pts de guerra y +15 Respeto`),
    ...interactiveRows,
  ]);
}

// 4. Vista de Trabajos (Jobs)
export function createJobsViewEmbed(playerJob: any, interactiveRows: any[] = []) {
  let jobText = 'No tienes un trabajo activo. Elige uno del catálogo abajo.';
  if (playerJob) {
    const jobDef = JOBS.find((j) => j.id === playerJob.jobId);
    jobText = `• Trabajo: **${jobDef?.name || playerJob.jobId}**\n• Rango: **Rango ${playerJob.rank}**\n• Salario Diario: **$${((jobDef?.baseSalary || 100) * playerJob.rank).toLocaleString()}**\n• Job Points: **${playerJob.jobPoints} Puntos**`;
  }

  const jobList = JOBS.map((j) =>
    `• **${j.name}** — Salario Base: **$${j.baseSalary.toLocaleString()}** (Req: Labor ${j.reqLabor}, Intel ${j.reqIntel}, End ${j.reqEndurance})`
  ).join('\n');

  return createV2Container(0x1e90ff, [
    createV2TextDisplay(
      `## 💼 EMPLEOS Y CENTRO LABORAL DE SINFORD\n` +
      `Trabaja diariamente para ganar salarios en efectivo, Job Points y aumentar tus Working Stats.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 👔 Empleo Actual\n${jobText}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📋 Trabajos Disponibles\n${jobList}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Selecciona una acción laboral abajo`),
    ...interactiveRows,
  ]);
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
export function createEducationViewEmbed(activeCourse: any, interactiveRows: any[] = []) {
  let courseText = 'No estás inscrito en ningún curso actualmente.';
  if (activeCourse) {
    const courseDef = COURSES.find((c) => c.id === activeCourse.courseId);
    const dateStr = new Date(activeCourse.completesAt).toLocaleTimeString('es-ES');
    courseText = `• Curso: **${courseDef?.name || activeCourse.courseId}**\n• Finaliza a las: **${dateStr}** ${activeCourse.isCompleted ? '`[¡COMPLETADO!]`' : '`[EN PROGRESO]`'}`;
  }

  const courseList = COURSES.map((c) =>
    `• **${c.name}** — Costo: **$${c.cost.toLocaleString()}** (${c.durationHours}h) ➔ ${c.bonusDescription}`
  ).join('\n');

  return createV2Container(0x9370db, [
    createV2TextDisplay(
      `## 🎓 UNIVERSIDAD DE SINFORD — CURSOS Y EDUCACIÓN\n` +
      `Inscríbete en cursos para obtener habilidades pasivas permanentes y bonificaciones.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📖 Curso Activo\n${courseText}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📚 Catálogo de Cursos\n${courseList}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Inscríbete seleccionando un curso abajo`),
    ...interactiveRows,
  ]);
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
export function createFactionViewEmbed(faction: any, interactiveRows: any[] = []) {
  let factionText = 'No perteneces a ninguna facción actualmente. Crea una por **$50,000** o únete a una existente.';
  if (faction) {
    factionText =
      `**Descripción:** ${faction.description || 'Sin descripción'}\n\n` +
      `👑 Líder ID: \`${faction.leaderId}\` | 👥 Miembros: **${faction.members?.length || 1}/20**\n` +
      `⭐ Respeto: **${faction.respect.toLocaleString()} Puntos** | 🏦 Tesorería: **$${BigInt(faction.treasury).toLocaleString()}**`;
  }

  return createV2Container(0x800080, [
    createV2TextDisplay(`## 🏴 FACCIÓN — ${faction ? faction.name : 'Sin Facción'}\n${factionText}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Juego en equipo y Crímenes Organizados`),
    ...interactiveRows,
  ]);
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
export function createBountiesViewEmbed(bounties: any[], interactiveRows: any[] = []) {
  let listStr = 'No hay recompensas activas en este momento.';
  if (bounties.length > 0) {
    listStr = bounties.map((b) =>
      `• **Recompensa:** **$${b.reward.toLocaleString()}** (ID Objetivo: \`${b.targetPlayerId}\`) — Expira en 7 días`
    ).join('\n');
  }

  return createV2Container(0xb22222, [
    createV2TextDisplay(
      `## 🎯 RECOMPENSAS PvP — BOUNTIES\n` +
      `Derrota en combate a un jugador objetivo para reclamar la recompensa en efectivo.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📋 Bounties Activos\n${listStr}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Recompensas PvP con 10% de comisión`),
    ...interactiveRows,
  ]);
}

// 8. Vista de Misiones
export function createMissionsViewEmbed(missions: any[], interactiveRows: any[] = []) {
  let listStr = '¡Has completado todas tus misiones diarias!';
  if (missions.length > 0) {
    listStr = missions.map((m) =>
      `• **${m.title}**: ${m.description} (${m.progress}/${m.requirement}) — Recompensa: **+$${m.rewardCash.toLocaleString()}** | **+${m.rewardXp} XP** ${m.isCompleted ? '`[COMPLETADA]`' : ''}`
    ).join('\n');
  }

  return createV2Container(0x4682b4, [
    createV2TextDisplay(
      `## 📋 MISIONES DIARIAS\n` +
      `Completa objetivos diarios para ganar efectivo y experiencia extra.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 🎯 Misiones Activas\n${listStr}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Se reinician cada 24 horas`),
    ...interactiveRows,
  ]);
}

// 9. Vista de Crímenes
export function createCrimesViewEmbed(player: any, interactiveRows: any[] = []) {
  const stats = player.stats;

  const crimeList = CRIMES.map(
    (c) => `• **${c.name}** — Costo: **${c.nerveCost}🧠** | Requisito: **Nivel ${c.minLevel}** | Botín: **$${c.minReward.toLocaleString()} - $${c.maxReward.toLocaleString()}**`
  ).join('\n');

  return createV2Container(0x800000, [
    createV2TextDisplay(
      `## 🕵️ ACTIVIDADES ILÍCITAS Y CRÍMENES\n` +
      `Comete crímenes para obtener dinero rápido y aumentar tu **Crime Skill**.\n\n` +
      `🧠 Nerve Disponible: **${stats.nerve}/${stats.maxNerve}** | 📈 Crime Skill: **${stats.crimeSkill.toFixed(2)}** | ⭐ Crime XP: **${stats.crimeExp.toLocaleString()}**`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📋 Lista de Crímenes\n${crimeList}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Selecciona un crimen abajo para cometerlo`),
    ...interactiveRows,
  ]);
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
export function createJailViewEmbed(jailedPlayers: any[], interactiveRows: any[] = []) {
  let listStr = 'No hay prisioneros actualmente encarcelados.';
  if (jailedPlayers.length > 0) {
    const now = new Date();
    listStr = jailedPlayers.map((p) => {
      const remainingMin = Math.ceil((new Date(p.jailUntil).getTime() - now.getTime()) / 60000);
      const bailCost = 100 * remainingMin * p.level;
      return `• **${p.username}** (Nivel ${p.level}) — Restante: **${remainingMin} min** | Fianza: **$${bailCost.toLocaleString()}**`;
    }).join('\n');
  }

  return createV2Container(0x4b0082, [
    createV2TextDisplay(
      `## 🚨 PRISIÓN DE LA CIUDAD DE SINFORD\n` +
      `Revisa la lista de prisioneros encarcelados. Puedes sacarlos mediante rescate o fianza.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 🔒 Prisioneros Encarcelados\n${listStr}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Pulsa los botones para interactuar con la prisión`),
    ...interactiveRows,
  ]);
}

export function createJailActionButtons() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('jail_self_bust').setLabel('Fuga Propia (50% Nerve)').setEmoji('🔓').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

// 11. Vista de Estadísticas (Battle Stats & Working Stats)
export function createStatsViewEmbed(player: any, interactiveRows: any[] = []) {
  const stats = player.stats;

  return createV2Container(0x1e90ff, [
    createV2TextDisplay(`## 📊 Estadísticas de ${player.username}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### ⚔️ Battle Stats (Estadísticas de Combate)\n` +
      `💪 **Fuerza (Strength):** ${stats.strength.toFixed(2)}\n` +
      `🛡️ **Defensa (Defense):** ${stats.defense.toFixed(2)}\n` +
      `⚡ **Velocidad (Speed):** ${stats.speed.toFixed(2)}\n` +
      `🎯 **Destreza (Dexterity):** ${stats.dexterity.toFixed(2)}`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### 💼 Working Stats (Estadísticas Laborales)\n` +
      `🔨 **Fuerza Manual (Manual Labor):** ${stats.manualLabor.toFixed(2)}\n` +
      `🧠 **Inteligencia (Intelligence):** ${stats.intelligence.toFixed(2)}\n` +
      `🏋️ **Resistencia (Endurance):** ${stats.endurance.toFixed(2)}`
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Utiliza el Gimnasio y Trabajos para aumentar tus stats`),
    ...interactiveRows,
  ]);
}

// 12. Vista de Gimnasio
export function createGymViewEmbed(player: any, interactiveRows: any[] = []) {
  const stats = player.stats;
  const currentGym = GymService.getGymByTier(player.gymTier);
  const nextGym = GYMS.find((g) => g.tier === player.gymTier + 1);

  return createV2Container(0x32cd32, [
    createV2TextDisplay(
      `## 🏋️ GIMNASIO — ${currentGym.name}\n` +
      `Entrena tus **Battle Stats** para dominar en combate. Cada sesión consume **${currentGym.energyPerTrain}⚡ de Energía**.\n\n` +
      `⚡ Energía: **${stats.energy}/${stats.maxEnergy}** | 😊 Happy: **${stats.happy}/${stats.maxHappy}** | ⭐ Gym Exp: **${player.gymExp.toLocaleString()} Exp**`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### ⚔️ Battle Stats Actuales\n` +
      `💪 Fuerza: **${stats.strength.toFixed(2)}** | 🛡️ Defensa: **${stats.defense.toFixed(2)}**\n` +
      `⚡ Velocidad: **${stats.speed.toFixed(2)}** | 🎯 Destreza: **${stats.dexterity.toFixed(2)}**`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `### 🏆 Membresía de Gimnasio\n` +
      `Nivel de Gimnasio: **Tier ${currentGym.tier}** (${currentGym.multiplier}x multiplicador)\n` +
      (nextGym
        ? `Siguiente Gimnasio: **${nextGym.name}**\nCosto: **$${nextGym.cost.toLocaleString()}** | Requisito: **${nextGym.requiredExp} Exp**`
        : '¡Has alcanzado el gimnasio de máximo nivel!')
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Fórmula de ganancia inspirada en Torn Wiki`),
    ...interactiveRows,
  ]);
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
export function createCombatResultEmbed(result: CombatResult, interactiveRows: any[] = []) {
  const turnLog = result.turns.map((t) => {
    if (!t.isHit) {
      return `\`[Turno ${t.turnNumber}]\` **${t.attackerName}** usó **${t.weaponName}** y ❌ **FALLÓ** el disparo.`;
    }
    const critTag = t.isCritical ? ' 💥 **¡IMPACTO CRÍTICO!**' : '';
    return `\`[Turno ${t.turnNumber}]\` **${t.attackerName}** atacó con **${t.weaponName}** en la zona **${t.bodyPart}** causando **-${t.damage} HP**${critTag}.`;
  }).join('\n');

  return createV2Container(0xdc143c, [
    createV2TextDisplay(
      `## ⚔️ COMBATE PvP — GANADOR: ${result.winnerUsername}\n` +
      `**Daño total infligido:** ${result.totalDamageDealt} HP`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📜 Registro de Ataques por Turnos\n${turnLog.substring(0, 1024)}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Selecciona la acción posterior a la victoria abajo`),
    ...interactiveRows,
  ]);
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
export function createInventoryViewEmbed(player: any, interactiveRows: any[] = []) {
  const items = player.inventory || [];
  let itemStr = 'Tu inventario está vacío. Compra objetos en la **🛒 Tienda** o completa crímenes.';

  if (items.length > 0) {
    itemStr = items
      .map((inv: any) => `• **${inv.item.name}** x${inv.quantity} (${inv.item.type}) ${inv.isEquipped ? '`[EQUIPADO]`' : ''}`)
      .join('\n');
  }

  return createV2Container(0xd2691e, [
    createV2TextDisplay(`## 🎒 Inventario de ${player.username}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(itemStr),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Capacidad: ${items.length}/100 objetos`),
    ...interactiveRows,
  ]);
}

export function createInventoryItemSelectRow(inventory: any[]) {
  if (!inventory || inventory.length === 0) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_inv_item')
    .setPlaceholder('Selecciona un objeto del inventario para interactuar...');

  const options = inventory.slice(0, 25).map((inv: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${inv.item.name} (x${inv.quantity})`)
      .setValue(inv.id)
      .setDescription(`${inv.item.type} — ${inv.isEquipped ? 'Equipado' : 'Sin equipar'}`)
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 15. Vista de Equipamiento
export function createEquipmentViewEmbed(player: any, interactiveRows: any[] = []) {
  const inventory = player.inventory || [];
  const primary = inventory.find((i: any) => i.isEquipped && i.slot === 'PRIMARY')?.item?.name || 'Ninguna (Puños)';
  const secondary = inventory.find((i: any) => i.isEquipped && i.slot === 'SECONDARY')?.item?.name || 'Ninguna';
  const melee = inventory.find((i: any) => i.isEquipped && i.slot === 'MELEE')?.item?.name || 'Ninguna';
  const temporary = inventory.find((i: any) => i.isEquipped && i.slot === 'TEMPORARY')?.item?.name || 'Ninguna';

  return createV2Container(0x4b0082, [
    createV2TextDisplay(`## ⚔️ Equipamiento de Combate — ${player.username}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(
      `• 🔫 **Arma Principal:** ${primary}\n` +
      `• 🔫 **Arma Secundaria:** ${secondary}\n` +
      `• 🔪 **Arma Cuerpo a Cuerpo:** ${melee}\n` +
      `• 💣 **Arma Temporal:** ${temporary}`
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Equipa armas desde tu inventario`),
    ...interactiveRows,
  ]);
}

// 16. Vista de Banco y Finanzas
export function createBankViewEmbed(player: any, interactiveRows: any[] = []) {
  const wallet = player.wallet;

  return createV2Container(0x2e8b57, [
    createV2TextDisplay(
      `## 🏦 Banco Central de Sinford — ${player.username}\n` +
      `Gestiona tus fondos de manera segura sin riesgos de robo.\n\n` +
      `💰 **Efectivo en Mano:** $${wallet.cash.toLocaleString()}\n` +
      `🏦 **Saldo en Banco:** $${wallet.bank.toLocaleString()}`
    ),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Selecciona una acción bancaria abajo`),
    ...interactiveRows,
  ]);
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

// 17. Vista de Tienda de la Ciudad
export function createShopCatalogEmbed(catalog: any[], interactiveRows: any[] = []) {
  const itemList = catalog.slice(0, 15).map((item: any) =>
    `• **${item.name}** — **$${item.price.toLocaleString()}** (${item.type})`
  ).join('\n');

  return createV2Container(0xff8c00, [
    createV2TextDisplay(
      `## 🛒 ARMERÍA Y MERCADO DE SINFORD\n` +
      `Selecciona un objeto del catálogo para comprarlo con tu efectivo.`
    ),
    createV2Separator(true, 'small'),
    createV2TextDisplay(`### 📦 Catálogo Disponible\n${itemList}`),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Sinford Supermarket & Armory`),
    ...interactiveRows,
  ]);
}

export function createShopSelectRow(catalog: any[]) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_shop_item')
    .setPlaceholder('Selecciona un objeto para comprar...');

  const options = catalog.slice(0, 25).map((item: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${item.name} ($${item.price.toLocaleString()})`)
      .setValue(item.id)
      .setDescription(item.description.substring(0, 50))
  );

  select.addOptions(options);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

// 18. Vista de Historial de Transacciones
export function createTxHistoryEmbed(player: any, txs: any[], interactiveRows: any[] = []) {
  let listStr = 'Aún no tienes registro de transacciones monetarias.';
  if (txs.length > 0) {
    listStr = txs.map((tx: any) => {
      const dateStr = new Date(tx.timestamp).toLocaleTimeString('es-ES');
      const sign = tx.amount >= 0n ? '+' : '';
      return `\`[${dateStr}]\` **${tx.type}**: ${sign}$${tx.amount.toLocaleString()} (Antes: $${tx.balanceBefore.toLocaleString()} ➔ Después: $${tx.balanceAfter.toLocaleString()})`;
    }).join('\n');
  }

  return createV2Container(0x708090, [
    createV2TextDisplay(`## 📜 Historial de Transacciones de ${player.username}`),
    createV2Separator(true, 'small'),
    createV2TextDisplay(listStr),
    createV2Separator(false, 'small'),
    createV2TextDisplay(`-# Registro auditable atómico`),
    ...interactiveRows,
  ]);
}

// Botón universal de navegación para regresar al Hub
export function createBackButtonRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('nav_back_hub').setLabel('Volver al Hub').setEmoji('🔙').setStyle(ButtonStyle.Secondary)
  );
}
