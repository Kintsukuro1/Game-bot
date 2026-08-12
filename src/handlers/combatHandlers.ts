import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { CombatService } from '../services/combatService.js';
import { WarfareService } from '../services/warfareService.js';
import { BountyService } from '../services/bountyService.js';
import { MissionService } from '../services/missionService.js';
import { createBackButtonRow } from '../ui/embeds.js';
import { appendActionLog } from '../ui/visualComponents.js';
import { PlayerWithRelations } from './registry.js';

export async function handlePostCombatAction(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  player: PlayerWithRelations,
  _guildId: string
): Promise<void> {
  const backRow = createBackButtonRow();
  const [_, actionType, winnerId, loserId] = interaction.customId.split('_');

  if (player.id !== winnerId) {
    await interaction.reply({
      content: '❌ Solo el ganador del combate puede elegir la acción posterior.',
      ephemeral: true,
    });
    return;
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

  await interaction.update({
    content: newContent,
    components: [backRow as any],
  });
}
