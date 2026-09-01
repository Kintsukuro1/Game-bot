import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface MissionPanelProps {
  sessionJwt: string | null;
  onClaimSuccess?: () => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ sessionJwt }) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMissions = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/missions/my', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.missions) setMissions(res.data.missions);
    } catch (err) {
      console.error('❌ Error al obtener misiones diarias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [sessionJwt]);

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
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
                className="bg-[#191f31]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">
                      {m.type || 'Contrato Diario'}
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      {cur} / {req}
                    </span>
                  </div>

                  <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase mt-1 mb-1">
                    {m.description || m.title || 'Asignación Urbana'}
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden my-4 border border-white/5">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    Recompensa: ${m.rewardCash?.toLocaleString() || '10,000'}
                  </span>
                  <span
                    className={`font-mono text-xs px-3 py-1 rounded font-bold uppercase ${
                      isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? 'Completado' : 'En Progreso'}
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
