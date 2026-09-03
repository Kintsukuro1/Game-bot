import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface MissionPanelProps {
  sessionJwt: string | null;
  onClaimSuccess?: () => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ sessionJwt }) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [nextResetAt, setNextResetAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const fetchMissions = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/missions/my', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.missions) setMissions(res.data.missions);
      if (res.data?.nextResetAt) setNextResetAt(res.data.nextResetAt);
    } catch (err) {
      console.error('❌ Error al obtener misiones diarias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [sessionJwt]);

  // Live countdown timer to nextResetAt
  useEffect(() => {
    if (!nextResetAt) return;

    const updateTimer = () => {
      const resetTime = new Date(nextResetAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, resetTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');

      setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);

      if (diff <= 0) {
        fetchMissions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextResetAt]);

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header & Reset Countdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="assignment" size={36} className="text-amber-400" />
            <span>Misiones Diarias & Asignaciones</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Completa contratos diarios en la ciudad para ganar recompensas de efectivo, XP y reputación.
          </p>
        </div>

        {/* Reset Countdown Timer Badge */}
        <div className="flex items-center gap-3 bg-[#191f31]/80 backdrop-blur-md px-5 py-2.5 rounded-xl border border-amber-500/30 shadow-lg shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
            <Icon name="schedule" size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
              Horario de Reinicio (00:00 UTC)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-lg text-slate-100 font-extrabold">{timeLeft || 'Cargando...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      {loading ? (
        <div className="py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
          ⏳ Cargando asignaciones activas...
        </div>
      ) : missions.length === 0 ? (
        <div className="py-16 text-center font-mono text-sm text-slate-500 bg-[#191f31]/20 rounded-xl border border-white/5">
          Sin misiones activas por el momento. ¡Vuelve pronto!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((m) => {
            const cur = m.progress ?? m.currentProgress ?? 0;
            const req = m.requirement ?? m.targetProgress ?? 1;
            const progressPct = Math.min(100, (cur / req) * 100);
            const isCompleted = m.isCompleted || cur >= req;

            return (
              <div
                key={m.id}
                className={`backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all border ${
                  isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                    : 'bg-[#191f31]/40 border-white/5 hover:border-cyan-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider rounded font-bold border ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {m.type || 'Contrato Diario'}
                    </span>

                    <span
                      className={`font-mono text-xs font-bold ${
                        isCompleted ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {cur} / {req}
                    </span>
                  </div>

                  <h3
                    className={`font-headline-lg text-base font-bold uppercase mt-1 mb-1 ${
                      isCompleted ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-100'
                    }`}
                  >
                    {m.description || m.title || 'Asignación Urbana'}
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden my-4 border border-white/5 shadow-inner">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                          : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      💵 ${m.rewardCash?.toLocaleString() || '1,000'}
                    </span>
                    {m.rewardXp > 0 && (
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        • +{m.rewardXp} XP
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-mono text-xs px-3.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Icon name="check_circle" size={14} />
                        <span>Completada</span>
                      </>
                    ) : (
                      'En Progreso'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
