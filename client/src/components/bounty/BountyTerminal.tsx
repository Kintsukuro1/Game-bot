import React, { useState } from 'react';
import { Icon } from '../common/Icon';

interface BountyTarget {
  id: string;
  name: string;
  level: number;
  reward: string;
  isHighValue?: boolean;
  statusTag: string;
  reason: string;
  publishedBy: string;
  avatarUrl?: string;
}

const DEFAULT_TARGETS: BountyTarget[] = [
  {
    id: 'target-1',
    name: 'X_GHOST_X',
    level: 64,
    reward: '$250,000',
    isHighValue: true,
    statusTag: 'Buscado Vivo o Muerto',
    reason: 'Traicionó al Sindicato Night-Stalkers en el sector 7.',
    publishedBy: 'Ghost Master',
  },
  {
    id: 'target-2',
    name: 'Viper_99',
    level: 42,
    reward: '$85,000',
    isHighValue: false,
    statusTag: 'Buscado por Asalto',
    reason: 'Robo de cargamento de armas corporativas.',
    publishedBy: 'Syndicate_Op',
  },
  {
    id: 'target-3',
    name: 'Null_Pointer',
    level: 38,
    reward: '$60,000',
    isHighValue: false,
    statusTag: 'Buscado por Hackeo',
    reason: 'Infiltración en servidores del banco central.',
    publishedBy: 'Iron_Bank_Sec',
  },
];

interface BountyTerminalProps {
  sessionJwt: string | null;
  playerLevel?: number;
  onClaimSuccess?: () => void;
  onAttackTarget?: (targetName: string) => void;
}

export const BountyTerminal: React.FC<BountyTerminalProps> = ({ onAttackTarget }) => {
  const [message, setMessage] = useState<string | null>(null);

  const handleHunt = (targetName: string) => {
    setMessage(`🎯 Iniciando rastreo y combate contra el objetivo: ${targetName}...`);
    if (onAttackTarget) onAttackTarget(targetName);
  };

  return (
    <div className="flex flex-col w-full h-full relative space-y-8 font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="w-[700px] h-[700px] rounded-full bg-rose-500/10 blur-[120px] absolute -top-40 opacity-30 animate-pulse"></div>
        <div className="w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px] absolute -bottom-20 right-0 opacity-20"></div>
      </div>

      {/* Header Section */}
      <section className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-4 border-b border-white/5">
        <div className="flex flex-col gap-2 relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-rose-500"></div>
          <span className="font-mono text-xs text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            Sistema de Búsqueda Activo
          </span>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase font-extrabold text-slate-100 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-3">
            <Icon name="crosshair" size={36} className="text-rose-500" />
            <span>Tablón de <span className="text-rose-400">Recompensas</span></span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 max-w-md">
            Objetivos prioritarios marcados para eliminación. El Sindicato paga al contado. No se hacen preguntas.
          </p>
        </div>

        {/* Active Count Widget */}
        <div className="flex items-center gap-4 bg-[#191f31]/80 backdrop-blur-md p-4 rounded-xl relative overflow-hidden shadow-lg border border-white/10">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              Contratos Activos
            </span>
            <span className="font-mono text-2xl font-bold text-slate-100">{DEFAULT_TARGETS.length}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center relative border border-rose-500/30">
            <Icon name="radar" size={24} className="text-rose-400 animate-pulse" />
          </div>
        </div>
      </section>

      {message && (
        <div className="p-4 rounded-xl font-mono text-xs font-bold bg-slate-900 border border-rose-500/30 text-rose-300 shadow-md">
          {message}
        </div>
      )}

      {/* Main Content Layout */}
      <section className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Bounty Feed (Left Column - 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {DEFAULT_TARGETS.map((target) => {
            if (target.isHighValue) {
              return (
                <article
                  key={target.id}
                  className="group relative w-full bg-[#191f31]/60 backdrop-blur-lg rounded-xl overflow-hidden border border-rose-500/30 shadow-xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-rose-500/60"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Avatar Box */}
                    <div className="relative w-32 h-32 shrink-0">
                      <div className="w-full h-full rounded-xl bg-slate-950 border border-rose-500/40 flex items-center justify-center shadow-inner overflow-hidden">
                        <Icon name="person_search" size={56} className="text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                      </div>
                      <div className="absolute -top-3 -right-3 bg-rose-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider rotate-12">
                        Alto Valor
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-3 py-0.5 rounded text-cyan-400 font-mono text-[10px] font-bold tracking-widest whitespace-nowrap shadow-md">
                        NIVEL {target.level}
                      </div>
                    </div>

                    {/* Target Details */}
                    <div className="flex-1 flex flex-col w-full space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-headline-lg text-xl font-bold text-slate-100 uppercase tracking-tight">
                            {target.name}
                          </h3>
                          <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider inline-block mt-1 border border-rose-500/20 font-bold">
                            {target.statusTag}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-slate-400 uppercase block">Recompensa</span>
                          <span className="font-mono text-2xl font-extrabold text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                            {target.reward}
                          </span>
                        </div>
                      </div>

                      <div className="h-[1px] w-full bg-white/5"></div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-slate-400 uppercase">Motivo</span>
                          <span className="font-caption text-xs text-slate-300">{target.reason}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-slate-400 uppercase">Publicado Por</span>
                          <span className="font-caption text-xs text-cyan-400 font-bold">{target.publishedBy}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleHunt(target.name)}
                        className="w-full mt-2 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Icon name="crosshair" size={16} />
                        <span>Atacar Objetivo</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={target.id}
                className="group relative w-full bg-[#191f31]/40 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-slate-600 transition-all flex flex-col sm:flex-row gap-4 items-center justify-between shadow-md"
              >
                <div className="flex gap-4 items-center flex-1">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center shadow-inner">
                    <Icon name="user" size={28} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-cyan-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                      NVL {target.level}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase tracking-tight">
                      {target.name}
                    </h3>
                    <p className="font-caption text-xs text-slate-400 truncate mt-0.5">{target.reason}</p>
                    <span className="font-mono text-[10px] text-slate-500 mt-1">Por: {target.publishedBy}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                  <span className="font-mono text-lg font-bold text-rose-400">{target.reward}</span>
                  <button
                    onClick={() => handleHunt(target.name)}
                    className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto font-bold"
                  >
                    Cazar
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Sidebar (Right Column - 4/12) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* User Status Panel */}
          <div className="bg-[#191f31]/50 backdrop-blur-md rounded-xl p-5 border border-white/10 relative overflow-hidden shadow-lg space-y-4">
            <h4 className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-bold">
              Tu Estatus de Caza
            </h4>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center font-mono text-xl font-extrabold text-cyan-400 shadow-inner">
                <Icon name="crosshair" size={28} />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase">Rango Actual</span>
                <span className="font-headline-lg text-base font-bold text-slate-100">Cazador Activo</span>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-white/5">
                <span className="text-slate-400">Contratos Disponibles</span>
                <span className="text-emerald-400 font-bold">{DEFAULT_TARGETS.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-white/5">
                <span className="text-slate-400">Penalización Fracaso</span>
                <span className="text-rose-400 font-bold">-15% EXP</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between font-mono text-[10px] text-slate-400 uppercase mb-1">
                <span>Progreso de Rango</span>
                <span className="text-cyan-400 font-bold">65%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400 rounded-full w-[65%] shadow-[0_0_8px_#06b6d4]"></div>
              </div>
            </div>
          </div>

          {/* Live Radar Widget */}
          <div className="bg-slate-950 rounded-xl p-5 border border-white/10 shadow-inner flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between">
              <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2">
                <Icon name="radar" size={14} className="text-rose-400 animate-pulse" />
                <span>Radar de Actividad</span>
              </h4>
            </div>

            {/* Radar Circle Sweep Animation */}
            <div className="w-48 h-48 rounded-full border border-cyan-500/20 relative overflow-hidden flex items-center justify-center bg-slate-900/50">
              <div className="w-32 h-32 rounded-full border border-cyan-500/10 absolute"></div>
              <div className="w-16 h-16 rounded-full border border-cyan-500/10 absolute"></div>
              <div className="w-full h-full absolute animate-spin origin-center">
                <div className="w-1/2 h-1/2 bg-gradient-to-tr from-transparent to-cyan-500/30 absolute top-0 right-0 origin-bottom-left blur-sm"></div>
                <div className="w-[1px] h-1/2 bg-cyan-400/60 absolute top-0 left-1/2"></div>
              </div>
              {/* Blips */}
              <div className="w-2 h-2 bg-rose-500 rounded-full absolute top-8 left-12 animate-ping"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full absolute bottom-10 right-14 animate-pulse"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full absolute top-20 right-10 opacity-70"></div>
            </div>

            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider text-center">
              <span>Escaneando sectores... </span>
              <span className="text-cyan-400 font-bold animate-pulse">{DEFAULT_TARGETS.length} objetivos detectados</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
