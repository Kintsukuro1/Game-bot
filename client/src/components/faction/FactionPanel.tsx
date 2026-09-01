import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface FactionPanelProps {
  sessionJwt: string | null;
  onActionSuccess?: () => void;
}

export const FactionPanel: React.FC<FactionPanelProps> = ({ sessionJwt, onActionSuccess }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);

  const handleJoinWar = () => {
    setMessage('⚔️ ¡Te has unido a la zona de conflicto! Has aportado +250 Puntos de Guerra para Night-Stalkers.');
  };

  const handleDeposit = async () => {
    setIsDepositing(true);
    setMessage(null);
    try {
      await api.post(
        '/faction/deposit',
        { amount: 10000 },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage('💵 Has depositado $10,000 en la tesorería del Sindicato.');
      if (onActionSuccess) onActionSuccess();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al depositar en la tesorería del Sindicato.');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Hero Header Card */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#191f31]/60 border border-white/10 shadow-xl p-6 flex flex-col md:flex-row gap-6 items-start justify-between min-h-[220px]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none mix-blend-overlay"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-3 md:w-2/3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              <Icon name="shield_moon" size={36} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </div>

            <div className="flex flex-col">
              <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-slate-100 uppercase tracking-tight">
                Night-Stalkers
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase font-bold">
                  Cuartel del Sindicato
                </span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                <span className="font-mono text-xs text-slate-400">
                  Nivel <span className="text-cyan-400 font-bold">15</span>
                </span>
              </div>
            </div>
          </div>

          <p className="font-caption text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Élites de las sombras. Operamos donde el neón de Sinford no alcanza. Nuestra influencia se expande de forma imprevista y letal.
          </p>

          <div className="flex flex-wrap gap-3 mt-2">
            <div className="px-4 py-2 bg-slate-900/80 border border-white/10 rounded-lg flex items-center gap-2">
              <Icon name="group" size={14} className="text-emerald-400" />
              <span className="font-mono text-xs text-slate-200 font-bold">42 Miembros Activos</span>
            </div>

            <div className="px-4 py-2 bg-slate-900/80 border border-white/10 rounded-lg flex items-center gap-2">
              <Icon name="location_on" size={14} className="text-amber-400" />
              <span className="font-mono text-xs text-slate-200 font-bold">6 Zonas Controladas</span>
            </div>

            <button
              disabled={isDepositing}
              onClick={handleDeposit}
              className="px-4 py-2 bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 border border-white/10 hover:border-cyan-400 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold"
            >
              <Icon name="account_balance" size={14} className="text-cyan-400" />
              <span className="font-mono text-xs font-bold">Bóveda (+Dep. $10k)</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-1/3 flex flex-col gap-3 items-start md:items-end mt-2 md:mt-0">
          <div className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 relative overflow-hidden group cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]"></span>
            <span className="font-mono text-xs text-rose-400 uppercase font-bold tracking-widest">
              Guerra Activa
            </span>
          </div>

          <div className="mt-auto flex flex-col items-start md:items-end gap-1 w-full max-w-[220px]">
            <div className="flex justify-between w-full font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              <span>Reputación</span>
              <span className="text-cyan-400 font-bold">85%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden relative border border-white/5">
              <div className="absolute inset-y-0 left-0 bg-cyan-400 shadow-[0_0_8px_#06b6d4] rounded-full w-[85%]"></div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl font-mono text-xs font-bold bg-slate-900 border border-cyan-500/30 text-cyan-300 shadow-md">
          {message}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Miembros & Territorio (68%) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Squad Roster Section */}
          <div className="bg-[#191f31]/40 rounded-xl border border-white/10 shadow-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="font-headline-lg text-lg font-bold text-slate-100 flex items-center gap-2">
                <Icon name="diversity_3" size={20} className="text-cyan-400" />
                <span>Lista del Escuadrón</span>
              </h2>
              <span className="font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-md border border-white/5">
                Orden: Rango
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {/* Member 1 */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-slate-700 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-bold text-amber-400 font-mono">
                      XG
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900 shadow-[0_0_4px_#10b981]"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-slate-100 font-bold">X_Ghost_X</span>
                    <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                      Líder del Sindicato
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400 font-bold">LVL 45</span>
              </div>

              {/* Member 2 */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-slate-700 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-400 font-mono">
                      IH
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900 shadow-[0_0_4px_#10b981]"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-slate-100 font-bold">Ironhide</span>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                      Ejecutor
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400 font-bold">LVL 38</span>
              </div>

              {/* Member 3 */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-slate-700 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-400 font-mono">
                      NB
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-slate-400">Null_Byte</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Netrunner
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500">LVL 29</span>
                  <span className="font-mono text-[10px] text-rose-400 uppercase">Desconectado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Territorio Section */}
          <div className="bg-[#191f31]/40 rounded-xl border border-white/10 shadow-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="font-headline-lg text-lg font-bold text-slate-100 flex items-center gap-2">
                <Icon name="map" size={20} className="text-emerald-400" />
                <span>Zonas Controladas</span>
              </h2>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md font-bold">
                Ingresos: $45k/hr
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zone 1 */}
              <div className="bg-slate-950 rounded-xl border border-white/10 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono text-sm text-slate-100 font-bold">Los Muelles</h3>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Sector Industrial</span>
                  </div>
                  <Icon name="precision_manufacturing" size={20} className="text-emerald-400" />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <span className="text-slate-400">Control</span>
                    <span className="text-emerald-400 font-bold">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[92%] shadow-[0_0_6px_#10b981]"></div>
                  </div>
                </div>
              </div>

              {/* Zone 2 */}
              <div className="bg-slate-950 rounded-xl border border-white/10 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono text-sm text-slate-100 font-bold">West End</h3>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Distrito Nocturno</span>
                  </div>
                  <Icon name="nightlife" size={20} className="text-emerald-400" />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <span className="text-slate-400">Control</span>
                    <span className="text-emerald-400 font-bold">64%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[64%] shadow-[0_0_6px_#10b981]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Guerra Activa (32%) */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-900/80 border border-rose-500/20 shadow-xl rounded-xl p-5 flex flex-col justify-between h-full relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl pointer-events-none rounded-full"></div>

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="font-headline-lg text-lg font-bold text-rose-400 flex items-center gap-2 uppercase tracking-tight">
                <Icon name="local_fire_department" size={20} className="text-rose-500 animate-pulse" />
                <span>Zona de Conflicto</span>
              </h2>
              <span className="px-2 py-0.5 bg-rose-500 text-slate-950 font-mono text-[9px] font-bold uppercase rounded-sm tracking-widest">
                En Vivo
              </span>
            </div>

            {/* Versus Header */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-white/5">
              <div className="flex flex-col items-center w-1/3">
                <span className="font-mono text-[10px] text-cyan-400 font-bold truncate w-full text-center">
                  Night-Stalkers
                </span>
                <span className="font-mono text-xs text-slate-300 font-bold">LV. 15</span>
              </div>
              <div className="w-1/3 flex justify-center">
                <span className="font-headline-lg text-sm text-slate-500 italic font-extrabold">VS</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <span className="font-mono text-[10px] text-amber-400 font-bold truncate w-full text-center">
                  Iron Brotherhood
                </span>
                <span className="font-mono text-xs text-slate-300 font-bold">LV. 18</span>
              </div>
            </div>

            {/* Dual War Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] text-slate-400 uppercase">Puntos Aliados</span>
                  <span className="font-mono text-sm text-cyan-400 font-bold">12,450</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-[9px] text-slate-400 uppercase">Puntos Enemigos</span>
                  <span className="font-mono text-sm text-amber-400 font-bold">14,200</span>
                </div>
              </div>

              <div className="w-full h-3 bg-slate-950 rounded-sm overflow-hidden flex relative border border-white/10">
                <div className="h-full bg-cyan-400 w-[46%]"></div>
                <div className="h-full bg-amber-400 w-[54%]"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2 z-10"></div>
              </div>

              <div className="flex justify-center mt-1">
                <span className="font-mono text-[10px] text-rose-400 font-bold animate-pulse">
                  Diferencia: -1,750 pts
                </span>
              </div>
            </div>

            {/* Casualties Log */}
            <div className="bg-slate-950/80 rounded-lg p-3 border border-white/5 flex flex-col space-y-2">
              <span className="font-mono text-[9px] text-slate-400 uppercase border-b border-white/5 pb-1 font-bold">
                Bajas Recientes en Guerra
              </span>
              <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                <div className="flex gap-1.5 items-start text-rose-400">
                  <span>[-150]</span>
                  <span className="text-slate-300">'Null_Byte' eliminado por 'Steel_Jaw' en Sector 4.</span>
                </div>
                <div className="flex gap-1.5 items-start text-emerald-400">
                  <span>[+300]</span>
                  <span className="text-slate-300">Infiltración a refugio exitosa. Recursos asegurados.</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleJoinWar}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono text-xs uppercase font-extrabold tracking-widest rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon name="swords" size={16} />
              <span>Unirse al Combate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
