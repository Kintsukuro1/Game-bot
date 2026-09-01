import React from 'react';
import { Icon } from '../common/Icon';

interface CityHubProps {
  onSelectTab: (tab: string) => void;
}

export const CityHub: React.FC<CityHubProps> = ({ onSelectTab }) => {
  return (
    <div className="flex flex-col w-full gap-6">
      {/* Hero Section Banner */}
      <section
        className="relative w-full overflow-hidden rounded-xl bg-slate-900/80 p-6 flex flex-col justify-end min-h-[220px] sm:min-h-[260px] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-cyan-400 uppercase tracking-tighter">
                Sinford Central District
              </h1>
            </div>
            <p className="font-caption text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Selecciona un sector o actividad para iniciar operaciones en la ciudad.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_currentColor]"></span>
              Syndicate Free-Zone
            </div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Seguridad del Sector: <span className="text-emerald-400 font-bold">Baja</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Grid: Common Operations */}
      <section className="w-full">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-headline-lg text-lg text-slate-100 tracking-tight font-bold">
            Operaciones Rápidas
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onSelectTab('profile')}
            className="group bg-[#191f31]/60 hover:bg-[#191f31] border border-white/5 hover:border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Icon name="local_hospital" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm text-slate-100 group-hover:text-emerald-400 transition-colors font-bold">
                Clínica Médica
              </span>
              <span className="font-mono text-[11px] text-slate-400">Recuperación</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('crimes')}
            className="group bg-[#191f31]/60 hover:bg-[#191f31] border border-white/5 hover:border-amber-500/40 p-4 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Icon name="local_shipping" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm text-slate-100 group-hover:text-amber-400 transition-colors font-bold">
                Contrabando
              </span>
              <span className="font-mono text-[11px] text-slate-400">Crimen Urbano</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('casino')}
            className="group bg-[#191f31]/60 hover:bg-[#191f31] border border-white/5 hover:border-cyan-500/40 p-4 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Icon name="casino" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm text-slate-100 group-hover:text-cyan-400 transition-colors font-bold">
                Casino Subterráneo
              </span>
              <span className="font-mono text-[11px] text-slate-400">Apuestas Altas</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('bounties')}
            className="group bg-[#191f31]/60 hover:bg-[#191f31] border border-white/5 hover:border-rose-500/40 p-4 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
              <Icon name="crisis_alert" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm text-slate-100 group-hover:text-rose-400 transition-colors font-bold">
                Tablón de Recompensas
              </span>
              <span className="font-mono text-[11px] text-slate-400">Caza de Objetivos</span>
            </div>
          </button>
        </div>
      </section>

      {/* Live Activity Feed Panel */}
      <section className="mt-auto">
        <div className="w-full bg-[#191f31]/60 backdrop-blur-sm rounded-xl border border-white/5 p-4 flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_currentColor]"></span>
            <h3 className="font-mono text-xs text-rose-400 uppercase tracking-widest font-bold">
              Comunicaciones del Distrito en Vivo
            </h3>
          </div>
          <div className="h-32 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            <div className="flex items-start gap-3 py-1 border-b border-slate-800/80 last:border-0">
              <span className="font-mono text-xs text-slate-500 shrink-0">[SISTEMA]</span>
              <span className="font-caption text-xs text-slate-300">
                Bienvenido al sector central de Sinford. Conexión segura lista.
              </span>
            </div>
            <div className="flex items-start gap-3 py-1 border-b border-slate-800/80 last:border-0">
              <span className="font-mono text-xs text-slate-500 shrink-0">[ALERTA]</span>
              <span className="font-caption text-xs text-slate-300">
                Operación de contrabando activa en los muelles de la ciudad.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
