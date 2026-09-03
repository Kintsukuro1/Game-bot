import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';
import { useToast } from '../../context/ToastContext';

interface CrimeLogEntry {
  id: string;
  time: string;
  success: boolean;
  message: string;
  rewardText: string;
}

interface CrimesPanelProps {
  nerve?: number;
  maxNerve?: number;
  playerLevel?: number;
  playerHeat?: number;
  sessionJwt: string | null;
  onCrimeSuccess?: (data?: any) => void;
}

interface CrimeItem {
  id: string;
  name: string;
  icon: string;
  difficulty: string;
  stars: number;
  nerveCost: number;
  rewardRange: string;
  minLevel: number;
}

const CRIME_ITEMS: CrimeItem[] = [
  {
    id: 'search_cash',
    name: 'Buscar Dinero Tirado',
    icon: 'back_hand',
    difficulty: 'Baja',
    stars: 1,
    nerveCost: 2,
    rewardRange: '$5 - $40',
    minLevel: 1,
  },
  {
    id: 'shoplifting',
    name: 'Hurto en Tiendas',
    icon: 'shopping_bag',
    difficulty: 'Baja',
    stars: 2,
    nerveCost: 3,
    rewardRange: '$25 - $150',
    minLevel: 1,
  },
  {
    id: 'pickpocketing',
    name: 'Robo de Carteras',
    icon: 'wallet',
    difficulty: 'Media',
    stars: 3,
    nerveCost: 4,
    rewardRange: '$80 - $350',
    minLevel: 2,
  },
  {
    id: 'larceny',
    name: 'Robo a Propiedad',
    icon: 'directions_car',
    difficulty: 'Alta',
    stars: 4,
    nerveCost: 6,
    rewardRange: '$250 - $1.2k',
    minLevel: 3,
  },
  {
    id: 'armed_robbery',
    name: 'Asalto a Mano Armada',
    icon: 'storefront',
    difficulty: 'Muy Alta',
    stars: 5,
    nerveCost: 10,
    rewardRange: '$1k - $4.5k',
    minLevel: 5,
  },
  {
    id: 'bank_heist',
    name: 'Asalto a Banco Central',
    icon: 'account_balance',
    difficulty: 'Extrema',
    stars: 5,
    nerveCost: 30,
    rewardRange: '$20,000+',
    minLevel: 15,
  },
];

export const CrimesPanel: React.FC<CrimesPanelProps> = ({
  nerve = 10,
  maxNerve = 10,
  playerLevel = 1,
  playerHeat = 0,
  sessionJwt,
  onCrimeSuccess,
}) => {
  const { showToast } = useToast();
  const [isCommitting, setIsCommitting] = useState<string | null>(null);
  const [logs, setLogs] = useState<CrimeLogEntry[]>([]);

  const handleCommitCrime = async (crime: CrimeItem) => {
    if (nerve < crime.nerveCost) {
      showToast({
        type: 'warning',
        title: '⚠️ Nerve Insuficiente',
        message: `Necesitas al menos **${crime.nerveCost}⚡** de Nerve para cometer este crimen.`,
      });
      return;
    }

    setIsCommitting(crime.id);

    try {
      const response = await api.post(
        '/crimes/commit',
        { crimeId: crime.id },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const data = response.data;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (data.success) {
        showToast({
          type: 'success',
          title: '🎉 ¡Crimen Exitoso!',
          message: data.message || `Completaste **${crime.name}** y obtuviste **+$${data.rewardAmount?.toLocaleString()}** y **+10 Crime XP**.`,
        });
      } else {
        showToast({
          type: 'error',
          title: '❌ Crimen Fallido',
          message: data.message || `Fallaste al intentar **${crime.name}**.`,
        });
      }

      const newLog: CrimeLogEntry = {
        id: Date.now().toString(),
        time: nowStr,
        success: data.success,
        message: data.message?.replace(/\*\*|\*/g, '') || crime.name,
        rewardText: data.success ? `+ $${data.rewardAmount?.toLocaleString()}` : '0$',
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);

      if (onCrimeSuccess) {
        onCrimeSuccess(data);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error de Operación',
        message: err.response?.data?.error || 'Error al intentar ejecutar el crimen.',
      });
    } finally {
      setIsCommitting(null);
    }
  };

  const currentHeat = Math.min(100, Math.max(0, playerHeat));

  return (
    <div className="flex flex-col w-full h-full relative space-y-6 font-sans">
      {/* Header Section & Nerve Counter */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="explore" size={36} className="text-emerald-400" />
            <span>Callejones Criminales</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest max-w-xl">
            El inframundo de Sinford. El riesgo es alto, pero la recompensa lo vale.
          </p>
        </div>

        {/* Nerve Counter Badge */}
        <div className="flex items-center gap-3 bg-[#191f31]/60 backdrop-blur-md px-5 py-2.5 rounded-xl border border-cyan-500/30 shadow-lg group">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
            <Icon name="bolt" size={20} className="text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Nerve Disponible
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl text-slate-100 font-extrabold">{nerve}</span>
              <span className="font-mono text-xs text-slate-400">/{maxNerve}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Crime Cards List (Left Column) */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase text-slate-400 tracking-wider font-bold">
              Oportunidades Activas
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent ml-4"></div>
          </div>

          {CRIME_ITEMS.map((crime) => {
            const isLocked = playerLevel < crime.minLevel;
            const isPending = isCommitting === crime.id;

            return (
              <div
                key={crime.id}
                className={`group relative backdrop-blur-md rounded-xl p-5 transition-all border ${
                  isLocked
                    ? 'bg-slate-950/40 border-white/5 opacity-60'
                    : 'bg-[#191f31]/40 border-white/5 hover:border-cyan-500/30 hover:-translate-y-0.5 shadow-md hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between relative z-10">
                  {/* Icon & Title */}
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-14 h-14 shrink-0 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                      <Icon name={crime.icon} size={28} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-lg text-base sm:text-lg uppercase tracking-tight text-slate-100 font-bold">
                          {crime.name}
                        </h3>
                        {isLocked && (
                          <span className="bg-slate-800 text-rose-400 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                            <Icon name="lock" size={11} /> Nivel {crime.minLevel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                          {Array.from({ length: crime.stars }).map((_, idx) => (
                            <Icon key={idx} name="star" size={12} className="text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                          • Dificultad {crime.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost & Action Button */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6 min-w-[280px] justify-end w-full sm:w-auto">
                    <div className="flex flex-col gap-0.5 items-end sm:items-start text-right sm:text-left">
                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                        Costo / Recompensa
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-slate-300 font-mono text-xs font-bold">
                          <Icon name="bolt" size={12} className="text-cyan-400" />
                          {crime.nerveCost}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold">
                          <span>💵</span> {crime.rewardRange}
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isLocked || isPending || nerve < crime.nerveCost}
                      onClick={() => handleCommitCrime(crime)}
                      className="bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40 hover:border-rose-500/60 transition-all px-6 py-2.5 rounded-lg uppercase font-mono text-xs font-bold tracking-wider w-full sm:w-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    >
                      {isPending ? 'Ejecutando...' : 'Intentar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar (Right Column) */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase text-slate-400 tracking-wider font-bold">
              Historial de Intentos
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent ml-4"></div>
          </div>

          {/* Activity Log Panel */}
          <div className="bg-[#191f31]/40 backdrop-blur-md rounded-xl p-5 border border-white/10 flex flex-col gap-3 shadow-inner min-h-[160px]">
            {logs.length === 0 ? (
              <div className="text-xs font-mono text-slate-500 text-center py-6">
                Sin actividad criminal reciente en esta sesión.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 py-2 border-b border-slate-800/80 last:border-0 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">[{log.time}]</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-widest ${
                        log.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.success ? 'Éxito' : 'Fallido'}
                    </span>
                  </div>
                  <p className={`text-xs font-mono mt-1 ${log.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {log.message}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">{log.rewardText}</span>
                </div>
              ))
            )}
          </div>

          {/* Search Heat Widget */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-mono text-[10px] uppercase text-slate-400 tracking-widest font-bold flex items-center gap-1.5">
                <Icon name="local_fire_department" size={14} className="text-rose-400" />
                <span>Nivel de Búsqueda (Heat)</span>
              </h4>
              <span className="font-mono text-xs text-rose-400 font-bold">{currentHeat}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ width: `${currentHeat}%` }}
              ></div>
            </div>
            <div className="flex justify-between font-mono text-[9px] text-slate-500 uppercase">
              <span>Desapercibido</span>
              <span>Buscado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
