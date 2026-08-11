import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { GYMS, GymService } from '../services/gymService.js';
import { CombatResult } from '../services/combatService.js';
import { CRIMES } from '../services/crimeService.js';
import { JOBS } from '../services/jobService.js';
import { COURSES } from '../services/educationService.js';

// 1. Hub Principal de la Ciudad
export function createGameHubEmbed(player: any) {
  const stats = player.stats;
  const wallet = player.wallet;

  return new EmbedBuilder()
    .setColor(0x2f3136)
    .setTitle('🏙️ LA CIUDAD DE SINFORD')
    .setDescription(
      `Bienvenido a la central de la ciudad, **${player.username}**.\n` +
      `Todo tu progreso e interacciones ocurren desde este Hub interactivo sin saturar el chat.\n\n` +
      `**Estado Rápido:**\n` +
      `⚡ Energía: **${stats.energy}/${stats.maxEnergy}** | 🧠 Nerve: **${stats.nerve}/${stats.maxNerve}** | 😊 Happy: **${stats.happy}/${stats.maxHappy}**\n` +
      `💰 Efectivo: **$${wallet.cash.toLocaleString()}** | 🏦 Banco: **$${wallet.bank.toLocaleString()}**`
    )
    .addFields(
      {
        name: '📌 Desarrollo & Actividades',
        value:
          `• **👤 Perfil & 📊 Stats:** Tu información general, nivel y estadísticas.\n` +
          `• **⚔️ Guerra & 🏴 Facción:** Guerras entre facciones, tesorería y crímenes organizados.\n` +
          `• **💼 Trabajos & 🎓 Universidad:** Salarios diarios, Working Stats y cursos pasivos.\n` +
          `• **🏋️ Gimnasio & 🕵️ Crímenes:** Entrena Battle Stats y comete delitos para ganar XP.`,
        inline: false,
      },
      {
        name: '🎒 Economía & Servicios',
        value:
          `• **🎯 Bounties & 📋 Misiones:** Cazarecompensas PvP y objetivos diarios.\n` +
          `• **🎒 Inventario & 🛒 Tienda:** Armas equipables, consumibles y armería.\n` +
          `• **🏦 Banco & Finanzas:** Depósitos, retiros y registro atómico auditado.\n` +
          `• **🚨 Prisión:** Fugas propias y rescate de compañeros encarcelados.`,
        inline: false,
      }
    )
    .setFooter({ text: 'Sinford Underworld • Pulsa los botones para navegar' })
    .setTimestamp();
}

export function createGameHubButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('hub_profile').setLabel('Perfil').setEmoji('👤').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('hub_stats').setLabel('Stats').setEmoji('📊').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_war').setLabel('Guerra & Ranking').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_jobs').setLabel('Trabajos').setEmoji('💼').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_edu').setLabel('Educación').setEmoji('🎓').setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('act_faction').setLabel('Facción').setEmoji('🏴').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('act_gym').setLabel('Gimnasio').setEmoji('🏋️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_crime').setLabel('Crímenes').setEmoji('🕵️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_bounties').setLabel('Bounties').setEmoji('🎯').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('act_missions').setLabel('Misiones').setEmoji('📋').setStyle(ButtonStyle.Primary)
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('act_jail').setLabel('Prisión').setEmoji('🚨').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('hub_inventory').setLabel('Inventario').setEmoji('🎒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('act_bank').setLabel('Banco').setEmoji('🏦').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_shop').setLabel('Tienda').setEmoji('🛒').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('act_tx_history').setLabel('Historial').setEmoji('📜').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

// 2. Vista de Guerras y Rankings de Facciones
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

// 3. Vista de Trabajos (Jobs)
export function createJobsViewEmbed(playerJob: any) {
  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle('💼 EMPLEOS Y CENTRO LABORAL DE SINFORD')
    .setDescription('Trabaja diariamente para ganar salarios en efectivo, Job Points y aumentar tus Working Stats.');

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

// 4. Vista de Educación (Courses)
export function createEducationViewEmbed(activeCourse: any) {
  const embed = new EmbedBuilder()
    .setColor(0x9370db)
    .setTitle('🎓 UNIVERSIDAD DE SINFORD — CURSOS Y EDUCACIÓN')
    .setDescription('Inscríbete en cursos para obtener habilidades pasivas permanentes y bonificaciones.');

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

// 5. Vista de Facción
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

// 6. Vista de Bounties
export function createBountiesViewEmbed(bounties: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0xb22222)
    .setTitle('🎯 RECOMPENSAS PvP — BOUNTIES')
    .setDescription('Derrota en combate a un jugador objetivo para reclamar la recompensa en efectivo.');

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

// 7. Vista de Misiones
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

// 8. Vista de Crímenes
export function createCrimesViewEmbed(player: any) {
  const stats = player.stats;

  const embed = new EmbedBuilder()
    .setColor(0x800000)
    .setTitle(`🕵️ ACTIVIDADES ILÍCITAS Y CRÍMENES`)
    .setDescription(
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

// 9. Vista de Prisión (Jail)
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

// 10. Vista de Perfil General
export function createProfileViewEmbed(player: any) {
  const wallet = player.wallet;
  const stats = player.stats;
  const body = player.bodyParts;
  const createdDate = new Date(player.createdAt).toLocaleDateString('es-ES');

  return new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle(`👤 Perfil de Jugador — ${player.username}`)
    .setDescription(`**ID de Discord:** \`${player.discordId}\` | **Miembro desde:** ${createdDate}`)
    .addFields(
      {
        name: '⭐ Progresión Base',
        value: `Nivel: **${player.level}**\nExperiencia (XP): **${player.xp.toLocaleString()}**`,
        inline: true,
      },
      {
        name: '💰 Finanzas',
        value: `Efectivo en Mano: **$${wallet.cash.toLocaleString()}**\nDepositado en Banco: **$${wallet.bank.toLocaleString()}**`,
        inline: true,
      },
      {
        name: '⚡ Vitalidad y Recursos',
        value: `Energía: **${stats.energy}/${stats.maxEnergy}** ⚡\nNerve: **${stats.nerve}/${stats.maxNerve}** 🧠\nFelicidad: **${stats.happy}/${stats.maxHappy}** 😊`,
        inline: true,
      },
      {
        name: '🏥 Salud de Extremidades Corporales (6 Partes)',
        value:
          `🧠 Cabeza: **${body.headHp}/100** | 🫀 Torso: **${body.torsoHp}/100**\n` +
          `💪 Brazo Izquierdo: **${body.leftArmHp}/100** | 💪 Brazo Derecho: **${body.rightArmHp}/100**\n` +
          `🦵 Pierna Izquierda: **${body.leftLegHp}/100** | 🦵 Pierna Derecha: **${body.rightLegHp}/100**`,
        inline: false,
      }
    )
    .setFooter({ text: 'Pantalla de Perfil General' });
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

  return new EmbedBuilder()
    .setColor(0x32cd32)
    .setTitle(`🏋️ GIMNASIO — ${currentGym.name}`)
    .setDescription(
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
      .map((inv: any) => `• **${inv.item.name}** x${inv.quantity} (${inv.item.type}) ${inv.isEquipped ? '`[EQUIPADO]`' : ''}`)
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
      { name: '🔫 Arma Principal (Primary)', value: `**${primary}**`, inline: true },
      { name: '🔫 Arma Secundaria (Secondary)', value: `**${secondary}**`, inline: true },
      { name: '🔪 Arma Cuerpo a Cuerpo (Melee)', value: `**${melee}**`, inline: true },
      { name: '💣 Arma Temporal (Temporary)', value: `**${temporary}**`, inline: true }
    )
    .setFooter({ text: 'Equipa armas desde tu inventario' });
}

// 16. Vista de Banco y Finanzas
export function createBankViewEmbed(player: any) {
  const wallet = player.wallet;

  return new EmbedBuilder()
    .setColor(0x2e8b57)
    .setTitle(`🏦 Banco Central de Sinford — ${player.username}`)
    .setDescription(
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

// 17. Vista de Tienda de la Ciudad
export function createShopCatalogEmbed(catalog: any[]) {
  const embed = new EmbedBuilder()
    .setColor(0xff8c00)
    .setTitle('🛒 ARMERÍA Y MERCADO DE SINFORD')
    .setDescription('Selecciona un objeto del catálogo para comprarlo con tu efectivo.');

  const itemList = catalog.slice(0, 15).map((item: any) =>
    `• **${item.name}** — **$${item.price.toLocaleString()}** (${item.type})`
  ).join('\n');

  embed.addFields({ name: '📦 Catálogo Disponible', value: itemList });
  embed.setFooter({ text: 'Sinford Supermarket & Armory' });

  return embed;
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
      return `\`[${dateStr}]\` **${tx.type}**: ${sign}$${tx.amount.toLocaleString()} (Antes: $${tx.balanceBefore.toLocaleString()} ➔ Después: $${tx.balanceAfter.toLocaleString()})`;
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
