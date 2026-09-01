import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';
import { useEnergyRegen } from '../../hooks/useEnergyRegen';

export interface GymInfo {
  tier: number;
  name: string;
  cost: number;
  energyPerTrain: number;
  multiplier: number;
  requiredExp: number;
}

export const GYMS: GymInfo[] = [
  { tier: 1, name: 'Premier Fitness', cost: 0, energyPerTrain: 5, multiplier: 2.0, requiredExp: 0 },
  { tier: 2, name: "Average Joe's", cost: 1000, energyPerTrain: 5, multiplier: 2.4, requiredExp: 200 },
  { tier: 3, name: "Woody's Workout", cost: 5000, energyPerTrain: 5, multiplier: 2.8, requiredExp: 500 },
  { tier: 4, name: 'Global Gym', cost: 15000, energyPerTrain: 5, multiplier: 3.2, requiredExp: 1000 },
  { tier: 5, name: "Gold's Gym", cost: 50000, energyPerTrain: 10, multiplier: 4.5, requiredExp: 2500 },
  { tier: 6, name: 'Anarchy Fitness', cost: 250000, energyPerTrain: 10, multiplier: 6.0, requiredExp: 6000 },
  { tier: 7, name: 'The Asylum Heavy Weight', cost: 1000000, energyPerTrain: 10, multiplier: 8.5, requiredExp: 15000 },
];

interface StatsData {
  energy: number;
  maxEnergy: number;
  happy: number;
  maxHappy: number;
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
}

interface GymPanelProps {
  stats?: StatsData | null;
  gymTier?: number;
  gymExp?: number;
  cash?: number;
  sessionJwt: string | null;
  onTrainSuccess?: (data?: any) => void;
}

export const GymPanel: React.FC<GymPanelProps> = ({
  stats,
  gymTier = 1,
  gymExp = 0,
  cash = 0,
  sessionJwt,
  onTrainSuccess,
}) => {
  const [energyToUse, setEnergyToUse] = useState<number>(25);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  const currentGym = GYMS.find((g) => g.tier === gymTier) || GYMS[0];
  const nextGym = GYMS.find((g) => g.tier === gymTier + 1) || null;

  const currentEnergy = stats?.energy ?? 100;
  const maxEnergy = stats?.maxEnergy ?? 100;
  const currentHappy = stats?.happy ?? 100;
  const maxHappy = stats?.maxHappy ?? 100;

  const energyPercent = Math.min(100, Math.max(0, (currentEnergy / maxEnergy) * 100));
  const happyPercent = Math.min(100, Math.max(0, (currentHappy / maxHappy) * 100));

  // Gym Exp Progress % toward next tier
  const gymExpProgress = nextGym
    ? Math.min(100, Math.max(0, (gymExp / nextGym.requiredExp) * 100))
    : 100;

  // Dynamic estimated gain calculation using official formula & gym multiplier
  const estimatedGainForStat = (currentStatVal: number = 1.0) => {
    const energyFactor = energyToUse / 5;
    const happyFactor = (currentHappy / 250) + 0.05;
    const statFactor = Math.sqrt(1 + (currentStatVal / 1000));
    const baseGain = happyFactor * statFactor;
    const gain = (currentGym.multiplier / 2.0) * energyFactor * baseGain;
    return Math.max(gain, 0.05).toFixed(2);
  };

  const handleTrain = async (stat: 'strength' | 'defense' | 'speed' | 'dexterity') => {
    if (currentEnergy < energyToUse) {
      setTrainMessage(`⚠️ No tienes suficiente Energía disponible (${currentEnergy}⚡ / ${energyToUse}⚡ requeridos).`);
      return;
    }

    setIsTraining(true);
    setTrainMessage(null);

    try {
      const response = await api.post(
        '/gym/train',
        { stat, energyAmount: energyToUse },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const gain = response.data?.gains;
      const statDisplay = stat.toUpperCase();
      setTrainMessage(`⚡ ¡Entrenamiento completado en ${currentGym.name}! Aumentaste +${gain ? Number(gain).toFixed(3) : estimatedGainForStat()} de ${statDisplay}`);
      
      if (onTrainSuccess) {
        onTrainSuccess(response.data);
      }
    } catch (err: any) {
      setTrainMessage(err.response?.data?.error || '❌ Error al intentar entrenar en el gimnasio.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleUpgradeGym = async () => {
    if (!nextGym) return;
    if (gymExp < nextGym.requiredExp) {
      setTrainMessage(`⚠️ Requiere ${nextGym.requiredExp} Exp de Gimnasio (tienes ${gymExp} Exp).`);
      return;
    }
    if (cash < nextGym.cost) {
      setTrainMessage(`⚠️ Efectivo insuficiente ($${cash.toLocaleString()} / $${nextGym.cost.toLocaleString()}).`);
      return;
    }

    setIsUpgrading(true);
    setTrainMessage(null);

    try {
      const response = await api.post(
        '/gym/upgrade',
        {},
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      setTrainMessage(`🎉 ¡Membresía Mejorada con éxito! Bienvenido a ${response.data?.newGym?.name || nextGym.name} (Tier ${response.data?.newGym?.tier || nextGym.tier}).`);

      if (onTrainSuccess) {
        onTrainSuccess();
      }
    } catch (err: any) {
      setTrainMessage(err.response?.data?.error || '❌ Error al intentar mejorar la membresía.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const sliderPercent = ((energyToUse - 5) / (100 - 5)) * 100;

  const energyRegen = useEnergyRegen(currentEnergy, maxEnergy);

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Gym Header */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-4 border-b border-slate-700/50">
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-bold uppercase">
              Tier {currentGym.tier} • Multiplicador x{currentGym.multiplier.toFixed(1)}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full font-bold uppercase">
              Coste: {currentGym.energyPerTrain}⚡ / ent.
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl text-slate-100 uppercase tracking-tighter drop-shadow-lg font-bold flex items-center gap-3">
            <Icon name="fitness_center" size={36} className="text-amber-400" />
            <span>Gimnasio <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">{currentGym.name}</span></span>
          </h1>
          <p className="font-mono text-xs text-slate-400 tracking-widest uppercase">
            // Acondicionamiento Físico y Biométrico Avanzado
          </p>
        </div>

        <div className="flex gap-6 items-center z-10 flex-wrap">
          {/* Energy Meter with Hover Countdown Tooltip */}
          <div className="group relative flex flex-col items-start md:items-end gap-1 cursor-pointer">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Icon name="bolt" size={12} className="text-cyan-400" />
              <span>Energía</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                {currentEnergy}<span className="text-slate-500 text-xs">/{maxEnergy}</span>
              </span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4]" style={{ width: `${energyPercent}%` }}></div>
              </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-xl shadow-2xl z-50 min-w-[220px] pointer-events-none transition-all">
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Icon name="bolt" size={14} />
                <span>Recarga de Energía</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                <span>Próximo tick (+5⚡):</span>
                <span className="text-amber-400 font-bold">{energyRegen.isFull ? 'Máximo' : energyRegen.nextTickFormatted}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                <span>Recarga 100%:</span>
                <span className="text-emerald-400 font-bold">{energyRegen.fullRegenFormatted}</span>
              </div>
              <p className="text-[9px] font-mono text-slate-400 mt-1 opacity-80 border-t border-white/5 pt-1">
                ⚡ Se regeneran +5⚡ cada 5 minutos automáticamente.
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>

          {/* Happy Meter */}
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Icon name="favorite" size={12} className="text-amber-400" />
              <span>Ánimo (Happy)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                {currentHappy}<span className="text-slate-500 text-xs">/{maxHappy}</span>
              </span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full shadow-[0_0_10px_#f59e0b]" style={{ width: `${happyPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Membership & Progress Banner */}
      <div className="w-full bg-[#131826]/80 backdrop-blur-md rounded-xl p-5 border border-amber-500/20 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Icon name="workspace_premium" size={32} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-tight">
                Membresía Actual: <span className="text-amber-400">{currentGym.name}</span>
              </h3>
              <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-white/10">
                Tier {currentGym.tier} / {GYMS.length}
              </span>
            </div>

            {nextGym ? (
              <div className="flex flex-col gap-1 mt-1">
                <p className="font-mono text-xs text-slate-400">
                  Siguiente Gimnasio: <span className="text-slate-200 font-bold">{nextGym.name}</span> (Tier {nextGym.tier}) • Costo: <span className="text-emerald-400 font-bold">${nextGym.cost.toLocaleString()}</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-48 sm:w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all" style={{ width: `${gymExpProgress}%` }}></div>
                  </div>
                  <span className="font-mono text-[10px] text-amber-400 font-bold">
                    {gymExp} / {nextGym.requiredExp} Exp ({gymExpProgress.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-emerald-400 font-bold mt-1">
                🏆 ¡Has alcanzado el gimnasio de máximo nivel en Sinford!
              </p>
            )}
          </div>
        </div>

        {nextGym && (
          <button
            disabled={isUpgrading || gymExp < nextGym.requiredExp || cash < nextGym.cost}
            onClick={handleUpgradeGym}
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shrink-0 z-10 cursor-pointer shadow-lg ${
              gymExp >= nextGym.requiredExp && cash >= nextGym.cost
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Icon name="upgrade" size={18} />
            <span>
              {isUpgrading
                ? 'Mejorando...'
                : gymExp < nextGym.requiredExp
                ? `Exp Insuficiente (${gymExp}/${nextGym.requiredExp})`
                : cash < nextGym.cost
                ? `Falta Dinero ($${nextGym.cost.toLocaleString()})`
                : `Mejorar a ${nextGym.name} ($${nextGym.cost.toLocaleString()})`}
            </span>
          </button>
        )}
      </div>

      {/* Energy Expenditure Slider Card */}
      <div className="w-full bg-[#191f31]/60 backdrop-blur-md rounded-xl p-6 relative overflow-hidden shadow-lg border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon name="bolt" size={24} className="text-cyan-400 drop-shadow-[0_0_5px_currentColor]" />
            <h2 className="font-mono text-base font-bold text-slate-100 uppercase tracking-tight">Gasto Energético por Sesión</h2>
          </div>
          <div className="bg-slate-950 px-4 py-1.5 rounded-lg border border-white/10 shadow-inner">
            <span className="font-mono text-base font-bold text-cyan-400 drop-shadow-[0_0_5px_currentColor]">
              {energyToUse}⚡
            </span>
          </div>
        </div>

        <div className="relative pt-2 pb-8 px-2 w-full max-w-4xl mx-auto">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={energyToUse}
            onChange={(e) => setEnergyToUse(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #06b6d4 ${sliderPercent}%, #2e3447 ${sliderPercent}%)`,
            }}
            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none relative z-10 accent-cyan-400"
          />

          {/* Slider Presets */}
          <div className="absolute w-full flex justify-between px-2 mt-4 text-slate-400 font-mono text-xs">
            {[5, 25, 50, 75, 100].map((preset) => (
              <span
                key={preset}
                onClick={() => setEnergyToUse(preset)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  energyToUse === preset ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <span className="w-px h-2 bg-slate-700"></span> {preset}⚡
              </span>
            ))}
          </div>
        </div>
      </div>

      {trainMessage && (
        <div className={`p-4 rounded-xl text-xs font-mono font-bold shadow-md ${
          trainMessage.startsWith('⚡') || trainMessage.startsWith('🎉')
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
        }`}>
          {trainMessage}
        </div>
      )}

      {/* 4 Attribute Training Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Fuerza */}
        <div className="group relative bg-[#191f31]/40 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl border border-white/5 hover:border-amber-500/30 overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none transition-all group-hover:bg-amber-500/30 group-hover:scale-150"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-inner group-hover:border-amber-500/60 transition-colors">
                <Icon name="sports_mma" size={28} className="text-amber-400 drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">Fuerza</h3>
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Stat Principal</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-bold text-slate-100 drop-shadow-md block">
                {stats?.strength ? Number(stats.strength).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.00'}
              </span>
              <span className="font-mono text-[10px] text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                +${estimatedGainForStat(stats?.strength)} Est. Gain
              </span>
            </div>
          </div>

          <p className="font-caption text-xs text-slate-300 mb-6 h-10 relative z-10 leading-relaxed">
            Aumenta tu potencia de daño cuerpo a cuerpo y la capacidad de carga en operaciones tácticas.
          </p>

          <button
            disabled={isTraining || currentEnergy < energyToUse}
            onClick={() => handleTrain('strength')}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
            <div className="absolute left-0 bottom-0 w-full h-[2px] bg-amber-400 opacity-50 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_#f59e0b] transition-all"></div>
            <span className="font-mono text-xs uppercase text-slate-100 tracking-widest font-bold relative z-10 group-hover/btn:text-amber-400 transition-colors">
              {isTraining ? 'Entrenando...' : `Entrenar Fuerza (-${energyToUse}⚡)`}
            </span>
            <Icon name="arrow_forward" size={14} className="text-slate-400 group-hover/btn:text-amber-400 group-hover/btn:translate-x-1 transition-all relative z-10" />
          </button>
        </div>

        {/* Defensa */}
        <div className="group relative bg-[#191f31]/40 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl border border-white/5 hover:border-cyan-500/30 overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none transition-all group-hover:bg-cyan-500/30 group-hover:scale-150"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-inner group-hover:border-cyan-500/60 transition-colors">
                <Icon name="security" size={28} className="text-cyan-400 drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">Defensa</h3>
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Stat Táctico</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-bold text-slate-100 drop-shadow-md block">
                {stats?.defense ? Number(stats.defense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.00'}
              </span>
              <span className="font-mono text-[10px] text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                +${estimatedGainForStat(stats?.defense)} Est. Gain
              </span>
            </div>
          </div>

          <p className="font-caption text-xs text-slate-300 mb-6 h-10 relative z-10 leading-relaxed">
            Reduce el daño recibido de ataques enemigos e incrementa tu umbral de dolor.
          </p>

          <button
            disabled={isTraining || currentEnergy < energyToUse}
            onClick={() => handleTrain('defense')}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
            <div className="absolute left-0 bottom-0 w-full h-[2px] bg-cyan-400 opacity-50 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_#06b6d4] transition-all"></div>
            <span className="font-mono text-xs uppercase text-slate-100 tracking-widest font-bold relative z-10 group-hover/btn:text-cyan-400 transition-colors">
              {isTraining ? 'Entrenando...' : `Entrenar Defensa (-${energyToUse}⚡)`}
            </span>
            <Icon name="arrow_forward" size={14} className="text-slate-400 group-hover/btn:text-cyan-400 group-hover/btn:translate-x-1 transition-all relative z-10" />
          </button>
        </div>

        {/* Velocidad */}
        <div className="group relative bg-[#191f31]/40 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl border border-white/5 hover:border-emerald-500/30 overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none transition-all group-hover:bg-emerald-500/30 group-hover:scale-150"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-inner group-hover:border-emerald-500/60 transition-colors">
                <Icon name="speed" size={28} className="text-emerald-400 drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">Velocidad</h3>
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Stat Ágil</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-bold text-slate-100 drop-shadow-md block">
                {stats?.speed ? Number(stats.speed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.00'}
              </span>
              <span className="font-mono text-[10px] text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                +${estimatedGainForStat(stats?.speed)} Est. Gain
              </span>
            </div>
          </div>

          <p className="font-caption text-xs text-slate-300 mb-6 h-10 relative z-10 leading-relaxed">
            Mejora tu capacidad de evasión, frecuencia de golpe y tiempos de escape.
          </p>

          <button
            disabled={isTraining || currentEnergy < energyToUse}
            onClick={() => handleTrain('speed')}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
            <div className="absolute left-0 bottom-0 w-full h-[2px] bg-emerald-400 opacity-50 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_#10b981] transition-all"></div>
            <span className="font-mono text-xs uppercase text-slate-100 tracking-widest font-bold relative z-10 group-hover/btn:text-emerald-400 transition-colors">
              {isTraining ? 'Entrenando...' : `Entrenar Velocidad (-${energyToUse}⚡)`}
            </span>
            <Icon name="arrow_forward" size={14} className="text-slate-400 group-hover/btn:text-emerald-400 group-hover/btn:translate-x-1 transition-all relative z-10" />
          </button>
        </div>

        {/* Destreza */}
        <div className="group relative bg-[#191f31]/40 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl border border-white/5 hover:border-purple-500/30 overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none transition-all group-hover:bg-purple-500/30 group-hover:scale-150"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-purple-500/30 flex items-center justify-center shadow-inner group-hover:border-purple-500/60 transition-colors">
                <Icon name="my_location" size={28} className="text-purple-400 drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">Destreza</h3>
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Stat Precisión</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-bold text-slate-100 drop-shadow-md block">
                {stats?.dexterity ? Number(stats.dexterity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.00'}
              </span>
              <span className="font-mono text-[10px] text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                +${estimatedGainForStat(stats?.dexterity)} Est. Gain
              </span>
            </div>
          </div>

          <p className="font-caption text-xs text-slate-300 mb-6 h-10 relative z-10 leading-relaxed">
            Incrementa la precisión de tus ataques tácticos y manejo de armas avanzadas.
          </p>

          <button
            disabled={isTraining || currentEnergy < energyToUse}
            onClick={() => handleTrain('dexterity')}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
            <div className="absolute left-0 bottom-0 w-full h-[2px] bg-purple-400 opacity-50 group-hover/btn:opacity-100 group-hover/btn:shadow-[0_0_10px_#a855f7] transition-all"></div>
            <span className="font-mono text-xs uppercase text-slate-100 tracking-widest font-bold relative z-10 group-hover/btn:text-purple-400 transition-colors">
              {isTraining ? 'Entrenando...' : `Entrenar Destreza (-${energyToUse}⚡)`}
            </span>
            <Icon name="arrow_forward" size={14} className="text-slate-400 group-hover/btn:text-purple-400 group-hover/btn:translate-x-1 transition-all relative z-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
