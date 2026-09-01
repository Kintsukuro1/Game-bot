import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { api } from '../../lib/api';

export interface BodyPartsHp {
  headHp: number;
  torsoHp: number;
  leftArmHp: number;
  rightArmHp: number;
  leftLegHp: number;
  rightLegHp: number;
}

interface AnatomicalBodyProps {
  username?: string;
  bodyParts?: BodyPartsHp | null;
  hospitalUntil?: string | null;
  jailUntil?: string | null;
  sessionJwt?: string | null;
  onHealSuccess?: () => void;
}

function getPartStatusInfo(hp: number) {
  if (hp <= 20) {
    return {
      statusLabel: 'Fracturado',
      colorClass: 'text-rose-400',
      bgTagClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[inset_0_0_8px_rgba(244,63,94,0.4)] animate-pulse',
      barBgClass: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
      svgClass: 'text-rose-500 animate-pulse',
    };
  }
  if (hp < 60) {
    return {
      statusLabel: 'Herido Grave',
      colorClass: 'text-amber-400',
      bgTagClass: 'bg-amber-500/10 text-amber-300 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]',
      barBgClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      svgClass: 'text-amber-400',
    };
  }
  if (hp < 80) {
    return {
      statusLabel: 'Contusión',
      colorClass: 'text-yellow-400',
      bgTagClass: 'bg-yellow-500/10 text-yellow-300 shadow-[inset_0_0_8px_rgba(234,179,8,0.2)]',
      barBgClass: 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
      svgClass: 'text-yellow-400',
    };
  }
  return {
    statusLabel: 'Intacto',
    colorClass: 'text-emerald-400',
    bgTagClass: 'bg-emerald-500/10 text-emerald-300 shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]',
    barBgClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    svgClass: 'text-emerald-400',
  };
}

export const AnatomicalBody: React.FC<AnatomicalBodyProps> = ({
  username = 'Jugador',
  bodyParts,
  hospitalUntil,
  jailUntil,
  sessionJwt,
  onHealSuccess,
}) => {
  const [isHealing, setIsHealing] = useState(false);
  const [healMessage, setHealMessage] = useState<string | null>(null);

  const parts = bodyParts || {
    headHp: 100,
    torsoHp: 100,
    leftArmHp: 100,
    rightArmHp: 100,
    leftLegHp: 100,
    rightLegHp: 100,
  };

  const isHospitalized = hospitalUntil && new Date(hospitalUntil) > new Date();
  const isInJail = jailUntil && new Date(jailUntil) > new Date();

  const totalHp = parts.headHp + parts.torsoHp + parts.leftArmHp + parts.rightArmHp + parts.leftLegHp + parts.rightLegHp;
  const maxTotalHp = 600;
  const overallPercentage = Math.round((totalHp / maxTotalHp) * 100);

  const totalDamage = (100 - parts.headHp) + (100 - parts.torsoHp) + (100 - parts.leftArmHp) + (100 - parts.rightArmHp) + (100 - parts.leftLegHp) + (100 - parts.rightLegHp);
  const medicalFee = Math.max(500, totalDamage * 25);

  const headInfo = getPartStatusInfo(parts.headHp);
  const torsoInfo = getPartStatusInfo(parts.torsoHp);
  const leftArmInfo = getPartStatusInfo(parts.leftArmHp);
  const rightArmInfo = getPartStatusInfo(parts.rightArmHp);
  const leftLegInfo = getPartStatusInfo(parts.leftLegHp);
  const rightLegInfo = getPartStatusInfo(parts.rightLegHp);

  const handleMedicalHeal = async () => {
    if (!sessionJwt || totalDamage === 0) return;
    try {
      setIsHealing(true);
      setHealMessage(null);
      const res = await api.post('/player/heal', {}, {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      setHealMessage(res.data?.message || 'Tratamiento médico aplicado con éxito.');
      if (onHealSuccess) onHealSuccess();
    } catch (err: any) {
      setHealMessage(err.response?.data?.error || 'No se pudo completar el tratamiento médico.');
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 font-sans">
      {/* Header / Badges Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#191f31]/60 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
        {/* Background Tech Texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 50%, rgba(6,182,212,0.3) 0%, transparent 40%)',
          }}
        ></div>

        <div className="flex flex-col relative z-10">
          <h1 className="font-headline-lg text-2xl sm:text-3xl uppercase text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] font-bold flex items-center gap-3">
            <Icon name="body_system" size={32} className="text-cyan-400 animate-pulse" />
            <span>Estado Anatómico Corporal</span>
          </h1>
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest mt-1">
            Sujeto: <span className="text-cyan-300 font-bold">{username}</span> // Salud General: <span className={overallPercentage < 50 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{overallPercentage}%</span>
          </span>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          {isHospitalized && (
            <div className="flex items-center gap-2 bg-rose-500 text-slate-950 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse font-semibold">
              <Icon name="local_hospital" size={18} />
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Hospitalizado</span>
            </div>
          )}
          {isInJail && (
            <div className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)] font-semibold">
              <Icon name="lock" size={18} />
              <span className="font-mono text-xs uppercase font-bold tracking-wider">En Prisión</span>
            </div>
          )}
          {!isHospitalized && !isInJail && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Icon name="check_circle" size={18} />
              <span className="font-mono text-xs uppercase font-bold tracking-wider">Libre de Detención</span>
            </div>
          )}
        </div>
      </div>

      {/* Main HUD Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SVG SILHOUETTE */}
        <div className="lg:col-span-5 bg-[#191f31]/60 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[480px]">
          {/* Decorative Background Grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(134,147,151,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(134,147,151,0.5) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <svg className="w-full max-w-[280px] h-auto relative z-10 filter drop-shadow-lg" viewBox="0 0 100 250">
            {/* Head */}
            <g className={`${headInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.25"
                points="50,10 65,15 65,30 55,40 45,40 35,30 35,15"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
              <line stroke="currentColor" strokeWidth="1" x1="45" x2="55" y1="22" y2="22"></line>
            </g>

            {/* Torso */}
            <g className={`${torsoInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.3"
                points="40,45 60,45 70,60 65,120 35,120 30,60"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
              <circle cx="50" cy="80" fill="none" r="5" stroke="currentColor" strokeWidth="1"></circle>
              <line stroke="currentColor" strokeWidth="0.5" x1="40" x2="60" y1="80" y2="80"></line>
            </g>

            {/* Left Arm */}
            <g className={`${leftArmInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.4"
                points="25,60 15,100 10,130 20,130 30,100 30,65"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
            </g>

            {/* Right Arm */}
            <g className={`${rightArmInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.4"
                points="75,60 85,100 90,130 80,130 70,100 70,65"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
              {parts.rightArmHp <= 20 && (
                <line stroke="currentColor" strokeWidth="2" x1="75" x2="85" y1="90" y2="105"></line>
              )}
            </g>

            {/* Left Leg */}
            <g className={`${leftLegInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.25"
                points="35,125 45,125 40,190 35,240 25,240 30,190"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
            </g>

            {/* Right Leg */}
            <g className={`${rightLegInfo.svgClass} transition-all duration-300 hover:brightness-150 cursor-crosshair`}>
              <polygon
                fill="currentColor"
                fillOpacity="0.4"
                points="55,125 65,125 70,190 75,240 65,240 60,190"
                stroke="currentColor"
                strokeWidth="1.5"
              ></polygon>
            </g>

            {/* Target Overlay Lines */}
            <line opacity="0.4" stroke="#06b6d4" strokeDasharray="2,2" strokeWidth="0.3" x1="0" x2="100" y1="120" y2="120"></line>
            <line opacity="0.4" stroke="#06b6d4" strokeDasharray="2,2" strokeWidth="0.3" x1="50" x2="50" y1="0" y2="250"></line>
          </svg>

          <div className="mt-6 flex justify-between w-full font-mono text-[11px] text-cyan-400/80 uppercase">
            <span>[ANÁLISIS BIOMÉTRICO]</span>
            <span>Escáner Termográfico Activo</span>
          </div>
        </div>

        {/* RIGHT COLUMN: BODY PARTS PROGRESS CARDS */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Head */}
          <div className="bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Icon name="face" size={18} className={headInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Cabeza</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${headInfo.bgTagClass}`}>
                  {headInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${headInfo.colorClass} w-16 text-right`}>
                  {parts.headHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ${headInfo.barBgClass}`}
                style={{ width: `${parts.headHp}%` }}
              ></div>
            </div>
          </div>

          {/* Torso */}
          <div className="bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Icon name="body_system" size={18} className={torsoInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Torso</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${torsoInfo.bgTagClass}`}>
                  {torsoInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${torsoInfo.colorClass} w-16 text-right`}>
                  {parts.torsoHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ${torsoInfo.barBgClass}`}
                style={{ width: `${parts.torsoHp}%` }}
              ></div>
            </div>
          </div>

          {/* Left Arm */}
          <div className="bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Icon name="front_hand" size={18} className={leftArmInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Brazo Izquierdo</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${leftArmInfo.bgTagClass}`}>
                  {leftArmInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${leftArmInfo.colorClass} w-16 text-right`}>
                  {parts.leftArmHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ${leftArmInfo.barBgClass}`}
                style={{ width: `${parts.leftArmHp}%` }}
              ></div>
            </div>
          </div>

          {/* Right Arm */}
          <div className={`bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors relative overflow-hidden ${parts.rightArmHp <= 20 ? 'border-rose-500/40 bg-rose-950/20' : ''}`}>
            {parts.rightArmHp <= 20 && <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none"></div>}
            <div className="flex justify-between items-center mb-2 relative z-10">
              <div className="flex items-center gap-3">
                <Icon name="back_hand" size={18} className={rightArmInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Brazo Derecho</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${rightArmInfo.bgTagClass}`}>
                  {rightArmInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${rightArmInfo.colorClass} w-16 text-right`}>
                  {parts.rightArmHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner relative z-10">
              <div
                className={`h-full transition-all duration-700 ${rightArmInfo.barBgClass}`}
                style={{ width: `${parts.rightArmHp}%` }}
              ></div>
            </div>
          </div>

          {/* Left Leg */}
          <div className="bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Icon name="directions_walk" size={18} className={leftLegInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Pierna Izquierda</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${leftLegInfo.bgTagClass}`}>
                  {leftLegInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${leftLegInfo.colorClass} w-16 text-right`}>
                  {parts.leftLegHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ${leftLegInfo.barBgClass}`}
                style={{ width: `${parts.leftLegHp}%` }}
              ></div>
            </div>
          </div>

          {/* Right Leg */}
          <div className={`bg-slate-900/70 border border-white/5 rounded-xl p-4 shadow-md hover:bg-slate-800/80 transition-colors relative overflow-hidden ${parts.rightLegHp <= 20 ? 'border-rose-500/40 bg-rose-950/20' : ''}`}>
            {parts.rightLegHp <= 20 && <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none"></div>}
            <div className="flex justify-between items-center mb-2 relative z-10">
              <div className="flex items-center gap-3">
                <Icon name="accessible_forward" size={18} className={rightLegInfo.colorClass} />
                <span className="font-mono text-xs text-slate-100 uppercase tracking-wider font-bold">Pierna Derecha</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${rightLegInfo.bgTagClass}`}>
                  {rightLegInfo.statusLabel}
                </span>
                <span className={`font-mono text-sm font-bold ${rightLegInfo.colorClass} w-16 text-right`}>
                  {parts.rightLegHp}/100
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner relative z-10">
              <div
                className={`h-full transition-all duration-700 ${rightLegInfo.barBgClass}`}
                style={{ width: `${parts.rightLegHp}%` }}
              ></div>
            </div>
          </div>

          {/* Action Message / Feedback */}
          {healMessage && (
            <div className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 p-2.5 rounded-lg text-center">
              {healMessage}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleMedicalHeal}
              disabled={isHealing || totalDamage === 0}
              className={`font-mono text-xs uppercase tracking-widest px-6 py-3.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer ${
                totalDamage === 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 opacity-80 cursor-default'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]'
              }`}
            >
              <Icon name="vaccines" size={18} className={isHealing ? 'animate-spin' : ''} />
              {totalDamage === 0
                ? 'Estructura Corporal en Salud Óptima (100%)'
                : isHealing
                ? 'Aplicando Tratamiento Médico...'
                : `Solicitar Intervención Médica ($${medicalFee.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
