import { prisma } from '../db/prisma.js';
import { DESTINATIONS } from './travelService.js';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rewardCash: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'FIRST_STEPS', title: 'Primeros Pasos', description: 'Regístrate en la ciudad de Sinford', rewardCash: 500 },
  { id: 'MILLIONAIRE', title: 'Millonario del Inframundo', description: 'Acumula $1,000,000 en efectivo o banco', rewardCash: 50000 },
  { id: 'CRIME_BOSS', title: 'Jefe del Crimen', description: 'Alcanza un Crime Skill superior a 5.0', rewardCash: 25000 },
  { id: 'PVP_CHAMPION', title: 'Campeón de Combate', description: 'Entrena tus Battle Stats a nivel superior', rewardCash: 10000 },
  { id: 'FIRST_BLOOD', title: 'Primera Sangre', description: 'Gana tu primera pelea contra otro jugador', rewardCash: 750 },
  { id: 'VETERAN_BRAWLER', title: 'Peleador Veterano', description: 'Gana 25 peleas contra otros jugadores', rewardCash: 15000 },
  { id: 'HOSPITAL_REGULAR', title: 'Cliente Frecuente del Hospital', description: 'Sé hospitalizado 10 veces', rewardCash: 2000 },
  { id: 'BOSS_SLAYER', title: 'Cazador de Jefes', description: 'Participa en la derrota de un World Boss', rewardCash: 8000 },
  { id: 'BOSS_HUNTER', title: 'Exterminador de Sinford', description: 'Participa en la derrota de 10 World Bosses', rewardCash: 40000 },
  { id: 'GYM_RAT', title: 'Rata de Gimnasio', description: 'Alcanza nivel 10 de gimnasio en cualquier stat', rewardCash: 12000 },
  { id: 'FACTION_FOUNDER', title: 'Fundador de Facción', description: 'Crea tu propia facción', rewardCash: 5000 },
  { id: 'MISSION_STREAK', title: 'Cumplidor Serial', description: 'Completa 20 misiones diarias en total', rewardCash: 10000 },
  { id: 'BLACK_MARKET_REGULAR', title: 'Cliente VIP del Mercado Negro', description: 'Realiza 15 compras en el Mercado Negro', rewardCash: 6000 },
  { id: 'JAILBIRD', title: 'Ave de Jaula', description: 'Sé encarcelado 5 veces', rewardCash: 1000 },
  { id: 'ESCAPE_ARTIST', title: 'Artista de la Fuga', description: 'Escapa de la cárcel con éxito 3 veces', rewardCash: 3000 },
  { id: 'HIGH_ROLLER', title: 'Apostador de Alto Riesgo', description: 'Gana $50,000 o más en una sola apuesta de Casino', rewardCash: 5000 },
  { id: 'GLOBETROTTER', title: 'Trotamundos del Hampa', description: 'Viaja a los 8 destinos internacionales disponibles', rewardCash: 4000 },
  { id: 'LEVEL_20', title: 'Nombre Temido', description: 'Alcanza el nivel 20', rewardCash: 20000 },
];

export class AchievementService {
  static async unlockAchievement(playerId: string, achievementId: string) {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) throw new Error('Logro no encontrado.');

    return prisma.$transaction(async (tx) => {
      const existing = await tx.playerAchievement.findUnique({
        where: { playerId_achievementId: { playerId, achievementId } },
      });

      if (existing) return null; // Ya desbloqueado

      await tx.playerAchievement.create({
        data: { playerId, achievementId },
      });

      // Otorgar recompensa en efectivo
      const wallet = await tx.wallet.findUnique({ where: { playerId } });
      if (wallet) {
        await tx.wallet.update({
          where: { playerId },
          data: { cash: wallet.cash + BigInt(ach.rewardCash) },
        });
      }

      return { title: ach.title, description: ach.description, rewardCash: ach.rewardCash };
    });
  }

  // Evaluación y desbloqueo centralizado de logros
  static async checkAndUnlock(playerId: string): Promise<{ title: string; description: string; rewardCash: number }[]> {
    const newlyUnlocked: { title: string; description: string; rewardCash: number }[] = [];

    try {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
          wallet: true,
          stats: true,
          transactions: true,
          bossDamages: { include: { boss: true } },
        },
      });

      if (!player || !player.wallet || !player.stats) return newlyUnlocked;

      // Obtener logros que el jugador ya posee
      const existingAchievements = await prisma.playerAchievement.findMany({
        where: { playerId },
        select: { achievementId: true },
      });
      const existingSet = new Set(existingAchievements.map((a) => a.achievementId));

      const tryUnlock = async (id: string, condition: boolean) => {
        if (condition && !existingSet.has(id)) {
          const res = await AchievementService.unlockAchievement(playerId, id);
          if (res) {
            newlyUnlocked.push(res);
            existingSet.add(id);
          }
        }
      };

      // 1. FIRST_STEPS: Registro completado
      await tryUnlock('FIRST_STEPS', true);

      // 2. MILLIONAIRE: $1,000,000 en efectivo o banco
      const totalWealth = player.wallet.cash + player.wallet.bank;
      await tryUnlock('MILLIONAIRE', totalWealth >= 1000000n);

      // 3. CRIME_BOSS: Crime Skill >= 5.0
      await tryUnlock('CRIME_BOSS', player.stats.crimeSkill >= 5.0);

      // 4. PVP_CHAMPION: Battle stats combinadas >= 200 o gymTier >= 5
      const totalBattleStats = player.stats.strength + player.stats.defense + player.stats.speed + player.stats.dexterity;
      await tryUnlock('PVP_CHAMPION', totalBattleStats >= 200.0 || player.gymTier >= 5);

      // 5. FIRST_BLOOD: Al menos 1 asalto PvP exitoso
      const pvpMugs = player.transactions.filter((t) => t.type === 'MUG_REWARD');
      await tryUnlock('FIRST_BLOOD', pvpMugs.length >= 1);

      // 6. VETERAN_BRAWLER: 25 asaltos PvP exitosos
      await tryUnlock('VETERAN_BRAWLER', pvpMugs.length >= 25);

      // 7. BOSS_SLAYER: Participación en 1 World Boss derrotado
      const defeatedBosses = player.bossDamages.filter((d) => d.boss.status === 'DEFEATED');
      await tryUnlock('BOSS_SLAYER', defeatedBosses.length >= 1);

      // 8. BOSS_HUNTER: Participación en 10 World Bosses derrotados
      await tryUnlock('BOSS_HUNTER', defeatedBosses.length >= 10);

      // 9. GYM_RAT: Nivel 10 de gimnasio o stat individual >= 50
      const maxStat = Math.max(player.stats.strength, player.stats.defense, player.stats.speed, player.stats.dexterity);
      await tryUnlock('GYM_RAT', player.gymTier >= 10 || maxStat >= 50.0);

      // 10. FACTION_FOUNDER: Líder / creador de facción
      const createdFaction = await prisma.faction.findFirst({
        where: { leaderId: playerId },
      });
      await tryUnlock('FACTION_FOUNDER', createdFaction !== null);

      // 11. MISSION_STREAK: 20 misiones completadas
      const completedMissionsCount = await prisma.playerMission.count({
        where: { playerId, isCompleted: true },
      });
      await tryUnlock('MISSION_STREAK', completedMissionsCount >= 20);

      // 12. BLACK_MARKET_REGULAR: 15 compras en Mercado Negro (adrenalina + suero)
      const bmUses = (player.stats.adrenalinaUses || 0) + (player.stats.sueroUses || 0);
      await tryUnlock('BLACK_MARKET_REGULAR', bmUses >= 15);

      // 13. HIGH_ROLLER: Ganar $50,000 o más en apuesta de Casino
      const casinoWins = player.transactions.filter((t) => t.type === 'CASINO_WIN' && t.amount >= 50000n);
      await tryUnlock('HIGH_ROLLER', casinoWins.length >= 1);

      // 14. LEVEL_20: Nivel 20 o superior
      await tryUnlock('LEVEL_20', player.level >= 20);

      // 15. GLOBETROTTER: Viajó a todos los destinos internacionales disponibles
      const travelTxs = player.transactions.filter((t) => t.type === 'TRAVEL_TICKET');
      const visitedDestinations = new Set(
        travelTxs
          .map((t) => {
            try {
              return JSON.parse(t.metadata || '{}').destination;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      );
      await tryUnlock('GLOBETROTTER', visitedDestinations.size >= DESTINATIONS.length);

    } catch (err) {
      console.error('Error al evaluar logros en checkAndUnlock:', err);
    }

    return newlyUnlocked;
  }

  static async getLeaderboards(guildId: string = 'GLOBAL', category: 'level' | 'wealth' | 'stats') {
    if (category === 'level') {
      return prisma.player.findMany({
        where: { guildId },
        orderBy: { level: 'desc' },
        take: 10,
      });
    }

    if (category === 'wealth') {
      return prisma.player.findMany({
        where: { guildId },
        include: { wallet: true },
        take: 10,
      });
    }

    return prisma.player.findMany({
      where: { guildId },
      include: { stats: true },
      take: 10,
    });
  }
}
