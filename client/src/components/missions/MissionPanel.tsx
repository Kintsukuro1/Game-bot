import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface MissionPanelProps {
  sessionJwt: string | null;
  onClaimSuccess?: () => void;
}

type Periodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const CATEGORY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  CRIMES: { icon: 'explore', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Crimen Urbano' },
  TRAINING: { icon: 'fitness_center', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Gimnasio' },
  ATTACKS: { icon: 'swords', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'Duelo PvP' },
  ITEMS: { icon: 'backpack', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', label: 'Consumibles' },
  BANK: { icon: 'account_balance', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Banca' },
  STOCKS: { icon: 'monetization_on', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Bolsa' },
  BOUNTY: { icon: 'crosshair', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', label: 'Bounty' },
  RACING: { icon: 'speed', color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Carreras' },
  TRAVEL: { icon: 'flight_takeoff', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', label: 'Viaje' },
  EDUCATION: { icon: 'school', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30', label: 'Universidad' },
  BOSS: { icon: 'explosion', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'World Boss' },
  MARKET: { icon: 'shopping_bag', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', label: 'Mercado Negro' },
};

const CHEST_META: Record<Periodicity, { title: string; chestName: string; countNeeded: number; rewardsStr: string; color: string }> = {
  DAILY: {
    title: 'Gran Cofre Diario del Sindicato',
    chestName: 'Cofre Diario del Sindicato',
    countNeeded: 5,
    rewardsStr: 'Contenido al abrirlo: +$50,000 Cash • +1,000 XP • 1x First Aid Kit',
    color: 'from-amber-500/20 via-[#191f31] to-slate-950 border-amber-500/40 text-amber-400',
  },
  WEEKLY: {
    title: 'Cofre Semanal de la Sombra',
    chestName: 'Cofre Semanal de la Sombra',
    countNeeded: 3,
    rewardsStr: 'Contenido al abrirlo: +$250,000 Cash • +5,000 XP • +5 Puntos Maestría • 1x Xanax',
    color: 'from-purple-500/20 via-[#191f31] to-slate-950 border-purple-500/40 text-purple-400',
  },
  MONTHLY: {
    title: 'Cofre Mensual del Padrino',
    chestName: 'Cofre Mensual del Padrino',
    countNeeded: 2,
    rewardsStr: 'Contenido al abrirlo: +$1,000,000 Cash • +20,000 XP • +15 Puntos Maestría • 1x Feathery Hotel Coupon',
    color: 'from-rose-500/20 via-[#191f31] to-slate-950 border-rose-500/40 text-rose-400',
  },
};

export const MissionPanel: React.FC<MissionPanelProps> = ({ sessionJwt, onClaimSuccess }) => {
  const [activeTab, setActiveTab] = useState<Periodicity>('DAILY');

  const [sections, setSections] = useState<Record<Periodicity, { missions: any[]; canClaimChest: boolean; isChestClaimed: boolean; nextResetAt: string | null }>>({
    DAILY: { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
    WEEKLY: { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
    MONTHLY: { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingChest, setClaimingChest] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const fetchMissions = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/missions/my?all=true', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });

      if (res.data) {
        setSections({
          DAILY: res.data.daily || { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
          WEEKLY: res.data.weekly || { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
          MONTHLY: res.data.monthly || { missions: [], canClaimChest: false, isChestClaimed: false, nextResetAt: null },
        });
      }
    } catch (err) {
      console.error('❌ Error al obtener misiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [sessionJwt]);

  const currentSection = sections[activeTab];
  const nextResetAt = currentSection?.nextResetAt;

  // Live countdown timer to nextResetAt
  useEffect(() => {
    if (!nextResetAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const resetTime = new Date(nextResetAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, resetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');
        setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
      }

      if (diff <= 0) {
        fetchMissions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextResetAt]);

  const handleClaimMission = async (missionId: string) => {
    setMessage(null);
    setClaimingId(missionId);
    try {
      const res = await api.post(
        '/missions/claim',
        { missionId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const rewardCash = Number(res.data?.rewardCash || 0);
      const rewardXp = res.data?.rewardXp || 0;
      setMessage(`🎉 ¡Recompensa reclamada con éxito! +$${rewardCash.toLocaleString()} y +${rewardXp} XP.`);

      if (onClaimSuccess) onClaimSuccess();
      fetchMissions();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al reclamar recompensa.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimChestToInventory = async () => {
    setMessage(null);
    setClaimingChest(true);
    try {
      const res = await api.post(
        '/missions/claim-chest',
        { periodicity: activeTab },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const chestName = res.data?.chestItemName || CHEST_META[activeTab].chestName;

      setMessage(`🎁 **¡${chestName.toUpperCase()} ENVIADO AL INVENTARIO!** Revisa tu inventario para abrirlo cuando desees.`);

      if (onClaimSuccess) onClaimSuccess();
      fetchMissions();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al reclamar el Cofre al inventario.');
    } finally {
      setClaimingChest(false);
    }
  };

  const missions = currentSection?.missions || [];
  const completedCount = missions.filter((m) => m.isCompleted || (m.progress >= m.requirement)).length;
  const chestMeta = CHEST_META[activeTab];

  return (
    <div className="flex flex-col w-full h-full space-y-8 font-sans">
      {/* Header & Reset Countdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-mono text-xs text-amber-400 uppercase tracking-widest font-bold">
              Contratos & Operaciones del Inframundo
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-3">
            <Icon name="assignment" size={36} className="text-amber-400" />
            <span>Sistema de <span className="text-amber-400">Misiones</span></span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Completa contratos diarios, semanales y mensuales ajustados a tu nivel para obtener botines y Cofres Recompensables en tu inventario.
          </p>
        </div>

        {/* Reset Countdown Timer Badge */}
        <div className="flex items-center gap-4 bg-[#191f31]/80 backdrop-blur-md px-5 py-3 rounded-xl border border-amber-500/30 shadow-lg shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
            <Icon name="timer" size={22} className="animate-pulse" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
              Próximo Reinicio ({activeTab})
            </span>
            <span className="text-lg text-slate-100 font-extrabold tracking-wider">{timeLeft || 'Calculando...'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Diarias / Semanales / Mensuales) */}
      <div className="flex items-center gap-3 bg-[#191f31]/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as Periodicity[]).map((tab) => {
          const sec = sections[tab];
          const count = sec?.missions?.filter((m: any) => m.isCompleted || m.progress >= m.requirement).length || 0;
          const total = tab === 'DAILY' ? 5 : tab === 'WEEKLY' ? 3 : 2;
          const isActive = activeTab === tab;

          const labels: Record<Periodicity, { label: string; icon: string }> = {
            DAILY: { label: 'Diarias', icon: 'schedule' },
            WEEKLY: { label: 'Semanales', icon: 'date_range' },
            MONTHLY: { label: 'Mensuales', icon: 'event' },
          };

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon name={labels[tab].icon} size={16} />
              <span>{labels[tab].label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isActive ? 'bg-slate-950/40 text-amber-300' : 'bg-white/10 text-slate-400'}`}>
                {count}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md flex items-center justify-between ${
            message.includes('éxito') || message.includes('ENVIADO')
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Periodicity Chest Banner */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${chestMeta.color} p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border`}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Icon name="backpack" size={36} className={currentSection?.canClaimChest ? 'animate-bounce text-amber-300' : 'opacity-75'} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                Recompensa Especial de Sección ({activeTab})
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 font-bold border border-white/10">
                {completedCount} / {chestMeta.countNeeded} Misiones
              </span>
            </div>
            <h3 className="font-headline-lg text-xl font-bold text-slate-100 uppercase">
              {chestMeta.title}
            </h3>
            <p className="font-caption text-xs text-slate-300">
              {chestMeta.rewardsStr}
            </p>
          </div>
        </div>

        {/* Claim Chest Action Button */}
        <div className="shrink-0 w-full md:w-auto">
          {currentSection?.isChestClaimed ? (
            <div className="px-6 py-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <Icon name="check" size={18} />
              <span>Cofre Reclamado</span>
            </div>
          ) : currentSection?.canClaimChest ? (
            <button
              onClick={handleClaimChestToInventory}
              disabled={claimingChest}
              className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-mono text-xs font-extrabold uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
            >
              {claimingChest ? (
                <>
                  <Icon name="loader" size={18} className="animate-spin" />
                  <span>Enviando al Inventario...</span>
                </>
              ) : (
                <>
                  <Icon name="backpack" size={18} />
                  <span>Enviar Cofre al Inventario</span>
                </>
              )}
            </button>
          ) : (
            <div className="px-6 py-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-500 font-mono text-xs font-bold uppercase tracking-wider text-center">
              Completa {chestMeta.countNeeded - completedCount} misiones más
            </div>
          )}
        </div>
      </div>

      {/* Missions Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-mono text-xs space-y-3">
          <Icon name="loader" size={32} className="animate-spin text-amber-400" />
          <span>Consultando contratos asignados por el Sindicato...</span>
        </div>
      ) : missions.length === 0 ? (
        <div className="py-16 text-center font-mono text-sm text-slate-500 bg-[#191f31]/20 rounded-xl border border-white/5">
          Sin misiones activas en esta categoría por el momento. ¡Vuelve pronto!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((m: any) => {
            const cur = m.progress ?? 0;
            const req = m.requirement ?? 1;
            const progressPct = Math.min(100, (cur / req) * 100);
            const isCompleted = m.isCompleted || cur >= req;
            const isClaimed = m.isClaimed;
            const categoryMeta = CATEGORY_ICONS[m.type] || { icon: 'assignment', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: m.type };

            return (
              <div
                key={m.id}
                className={`backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all border ${
                  isClaimed
                    ? 'bg-slate-950/40 border-white/5 opacity-70'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-[#191f31]/50 border-white/10 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider rounded-lg font-bold border flex items-center gap-1.5 ${categoryMeta.color}`}>
                      <Icon name={categoryMeta.icon} size={14} />
                      <span>{categoryMeta.label}</span>
                    </span>

                    <span className={`font-mono text-xs font-bold ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {cur} / {req}
                    </span>
                  </div>

                  <h3 className={`font-headline-lg text-lg font-bold uppercase tracking-tight mb-2 ${isCompleted ? 'text-emerald-300' : 'text-slate-100'}`}>
                    {m.title || 'Misión Urbana'}
                  </h3>

                  <p className="font-caption text-xs text-slate-300 mb-4 min-h-[32px]">
                    {m.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-4 border border-white/5 shadow-inner">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                          : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer Action & Reward */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-slate-400">Recompensa</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-extrabold">${Number(m.rewardCash).toLocaleString()}</span>
                      <span className="text-cyan-400 font-bold">+{m.rewardXp} XP</span>
                    </div>
                  </div>

                  {isClaimed ? (
                    <div className="w-full py-3 bg-slate-900 border border-white/5 text-slate-500 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                      <Icon name="check" size={16} />
                      <span>Recompensa Cobrada</span>
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaimMission(m.id)}
                      disabled={claimingId === m.id}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {claimingId === m.id ? (
                        <>
                          <Icon name="loader" size={16} className="animate-spin" />
                          <span>Reclamando...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="monetization_on" size={16} />
                          <span>Reclamar Recompensa</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-slate-900/60 border border-white/5 text-slate-400 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-center">
                      En Progreso ({progressPct.toFixed(0)}%)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
