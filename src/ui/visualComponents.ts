import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// 1. Renderizador de Barras de Progreso ASCII/Emoji
export function renderProgressBar(
  current: number,
  max: number,
  length: number = 10,
  filledChar: string = '█',
  emptyChar: string = '░'
): string {
  if (max <= 0) return `[${emptyChar.repeat(length)}] 0%`;
  const percentage = Math.min(1.0, Math.max(0, current / max));
  const filledLength = Math.round(percentage * length);
  const emptyLength = length - filledLength;
  const bar = filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength);
  const percentText = Math.floor(percentage * 100);
  return `[\`${bar}\`] **${percentText}%**`;
}

// 2. Renderizador de Barra de Salud por Colores (6 Partes Corporales)
export function renderHealthBar(currentHp: number, maxHp: number = 100): string {
  const percentage = currentHp / maxHp;
  let char = '🟩';
  if (percentage < 0.3) {
    char = '🟥';
  } else if (percentage < 0.6) {
    char = '🟨';
  }
  const filled = Math.max(0, Math.min(5, Math.round(percentage * 5)));
  const empty = 5 - filled;
  return `${char.repeat(filled)}${'⬛'.repeat(empty)} **${currentHp}/${maxHp} HP**`;
}

// 3. Generador de Paginación Interactiva con Botones
export function createPaginationRow(currentPage: number, totalPages: number, actionPrefix: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${actionPrefix}_page_${currentPage - 1}`)
      .setLabel('Anterior')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId('page_indicator')
      .setLabel(`Página ${currentPage} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`${actionPrefix}_page_${currentPage + 1}`)
      .setLabel('Siguiente')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages)
  );

  return row;
}

// 4. Modal Helper para Formularios de Entrada de Datos
export function createConfirmationRow(actionId: string, confirmLabel: string = 'Confirmar Operación') {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_${actionId}`)
      .setLabel(confirmLabel)
      .setEmoji('✅')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('cancel_action')
      .setLabel('Cancelar')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );
}
