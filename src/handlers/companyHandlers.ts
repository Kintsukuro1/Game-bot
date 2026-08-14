import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { PlayerService } from '../services/playerService.js';
import { CompanyService, COMPANY_TYPES } from '../services/companyService.js';
import {
  createCompanyViewEmbed,
  createCompanyBuySelect,
  createCompanyButtons,
} from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handleActCompany(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { ownerId: player.id },
    include: { employees: true },
  });
  const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
  const embed = createCompanyViewEmbed(freshPlayer, company);
  const selectRow = !company ? createCompanyBuySelect() : null;
  const btnRow = createCompanyButtons(!!company);

  const components = selectRow ? [selectRow as any, ...btnRow as any] : (btnRow as any);

  await interaction.update({
    content: null,
    embeds: [embed],
    components,
  });
}

export async function handleSelectCompanyBuy(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;
  const companyType = interaction.values[0];
  const compDef = COMPANY_TYPES.find((c) => c.type === companyType);
  const compName = `${player.username}'s ${compDef?.name || 'Empresa'}`;

  try {
    await CompanyService.buyCompany(player.id, companyType, compName, guildId);
    const company = await prisma.company.findUnique({
      where: { ownerId: player.id },
      include: { employees: true },
    });
    const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
    const embed = createCompanyViewEmbed(freshPlayer, company);
    const btnRow = createCompanyButtons(true);

    const msg = `🏢 **¡Empresa Fundada!** Has adquirido **${compName}** con éxito.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btnRow as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}

export async function handleCompanyCollectRevenue(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  guildId: string
): Promise<void> {
  try {
    const result = await CompanyService.collectCompanyRevenue(player.id);
    const company = await prisma.company.findUnique({
      where: { ownerId: player.id },
      include: { employees: true },
    });
    const freshPlayer = (await PlayerService.getPlayerByDiscordId(player.discordId, guildId)) || player;
    const embed = createCompanyViewEmbed(freshPlayer, company);
    const btnRow = createCompanyButtons(true);

    const msg = `💰 **¡Ganancias Cobradas!** Retiraste **+$${result.revenueCollected.toLocaleString()}** de las arcas de **${result.companyName}**.`;
    const newContent = appendActionLog(interaction.message?.content, [msg], 5);

    await interaction.update({
      content: newContent,
      embeds: [embed],
      components: btnRow as any,
    });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
