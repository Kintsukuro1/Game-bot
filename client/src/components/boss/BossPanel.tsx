import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';
import { useToast } from '../../context/ToastContext';

export type BossTargetPart = 'HEAD' | 'TORSO' | 'LEFT_ARM' | 'RIGHT_ARM' | 'LEFT_LEG' | 'RIGHT_LEG';

interface BossPanelProps {
  sessionJwt: string | null;
  socket?: any;
  onAttackSuccess?: () => void;
}

export interface BossBodyParts {
  headHp: number;
  maxHeadHp: number;
  torsoHp: number;
  maxTorsoHp: number;
  leftArmHp: number;
  maxLeftArmHp: number;
  rightArmHp: number;
  maxRightArmHp: number;
  leftLegHp: number;
  maxLeftLegHp: number;
  rightLegHp: number;
  maxRightLegHp: number;
}

export interface BossWeakSpot {
  partKey: BossTargetPart;
  partName: string;
  expiresAt: number;
  multiplier: number;
}

function getBossPartStatus(hp: number, maxHp: number) {
  const pct = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  if (pct <= 20) {
    return {
      statusLabel: 'FRACTURADO',
      colorClass: 'text-rose-400',
      bgTagClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
      barBgClass: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
      svgClass: 'text-rose-500 animate-pulse',
    };
  }
  if (pct < 60) {
    return {
      statusLabel: 'HERIDO GRAVE',
      colorClass: 'text-amber-400',
      bgTagClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      barBgClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      svgClass: 'text-amber-400',
    };
  }
  return {
    statusLabel: 'INTACTO',
    colorClass: 'text-emerald-400',
    bgTagClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    barBgClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    svgClass: 'text-rose-400',
  };
}

export const BossPanel: React.FC<BossPanelProps> = ({ sessionJwt, socket, onAttackSuccess }) => {
  const { showToast } = useToast();
  const [boss, setBoss] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [attacking, setAttacking] = useState<boolean>(false);
  const [usingConsumable, setUsingConsumable] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selectedTargetPart, setSelectedTargetPart] = useState<BossTargetPart>('HEAD');
  const [selectedActionType, setSelectedActionType] = useState<string>('ATK_PRIMARY');
  const [weakSpotSecondsLeft, setWeakSpotSecondsLeft] = useState<number>(0);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);

  const fetchActiveBoss = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/boss/active', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.boss) setBoss(res.data.boss);
    } catch (err) {
      console.error('❌ Error al obtener World Boss activo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBoss();
  }, [sessionJwt]);

  // Temporizador en vivo del Punto Débil Expuesto
  useEffect(() => {
    if (!boss?.activeWeakSpot?.expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((boss.activeWeakSpot.expiresAt - Date.now()) / 1000));
      setWeakSpotSecondsLeft(remaining);
      if (remaining === 0) {
        fetchActiveBoss();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [boss?.activeWeakSpot]);

  // Escuchador Socket.IO para el feed de combate en tiempo real de la ciudad
  useEffect(() => {
    if (!socket) return;

    const handleBossAttackEvent = (event: any) => {
      setLiveFeed((prev) => [event, ...prev.slice(0, 7)]);
      if (boss && event.remainingBossHp !== undefined) {
        setBoss((prevBoss: any) =>
          prevBoss ? { ...prevBoss, currentHp: event.remainingBossHp } : prevBoss
        );
      }
    };

    socket.on('world_boss_attack_event', handleBossAttackEvent);
    return () => {
      socket.off('world_boss_attack_event', handleBossAttackEvent);
    };
  }, [socket, boss]);

  const handleAttack = async () => {
    if (!boss) return;
    setAttacking(true);

    try {
      const res = await api.post(
        '/boss/attack',
        { bossId: boss.id, actionType: selectedActionType, targetPart: selectedTargetPart },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const result = res.data?.result;
      setLastResult(result);

      if (result) {
        if (result.isHit) {
          showToast({
            type: 'success',
            title: result.isWeakSpotHit ? '🎯 ¡PUNTO DÉBIL IMPACTADO! (x2.5)' : '💥 ¡Impacto Exitoso!',
            message: `Asestaste un golpe con **${result.weaponName}** en **${result.bossPartStruck}** por **-${result.damageDealt?.toLocaleString()} HP**.`,
          });
        } else {
          showToast({
            type: 'error',
            title: '❌ Ataque Fallido',
            message: `El Jefe esquivó tu ataque táctico de **${result.weaponName}**.`,
          });
        }
      }

      if (onAttackSuccess) onAttackSuccess();
      fetchActiveBoss();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error de Incursión',
        message: err.response?.data?.error || 'Error al intentar atacar al Jefe de Ciudad.',
      });
    } finally {
      setAttacking(false);
    }
  };

  const handleQuickHeal = async () => {
    setUsingConsumable(true);
    try {
      const res = await api.post('/boss/quick-heal', {}, { headers: { Authorization: `Bearer ${sessionJwt}` } });
      showToast({
        type: 'success',
        title: '💊 Curación Rápida Completada',
        message: `Usaste un **${res.data?.result?.itemName || 'Botiquín'}** y estabilizaste tu salud corporal.`,
      });
      if (onAttackSuccess) onAttackSuccess();
      fetchActiveBoss();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error al Usar Botiquín',
        message: err.response?.data?.error || 'No tienes botiquines disponibles.',
      });
    } finally {
      setUsingConsumable(false);
    }
  };

  const handleQuickEnergy = async () => {
    setUsingConsumable(true);
    try {
      const res = await api.post('/boss/quick-energy', {}, { headers: { Authorization: `Bearer ${sessionJwt}` } });
      showToast({
        type: 'success',
        title: '🧪 Energizante Consumido',
        message: `Recargaste **+25⚡ de Energía** para continuar la incursión.`,
      });
      if (onAttackSuccess) onAttackSuccess();
      fetchActiveBoss();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error al Recargar',
        message: err.response?.data?.error || 'No tienes bebidas energéticas en tu inventario.',
      });
    } finally {
      setUsingConsumable(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-20 text-center font-mono text-sm text-slate-400 animate-pulse">
        ⏳ Sincronizando consola táctica de incursión...
      </div>
    );
  }

  const hpPercent = boss ? Math.min(100, Math.max(0, (boss.currentHp / boss.maxHp) * 100)) : 100;
  const activeWeakKey = boss?.activeWeakSpot?.partKey;

  // Calculo de partes corporales del Jefe (15% cabeza, 35% torso, 12.5% extremidades)
  const body: BossBodyParts = boss?.bodyParts || {
    headHp: Math.floor((boss?.currentHp ?? 250000) * 0.15),
    maxHeadHp: Math.floor((boss?.maxHp ?? 250000) * 0.15),
    torsoHp: Math.floor((boss?.currentHp ?? 250000) * 0.35),
    maxTorsoHp: Math.floor((boss?.maxHp ?? 250000) * 0.35),
    leftArmHp: Math.floor((boss?.currentHp ?? 250000) * 0.125),
    maxLeftArmHp: Math.floor((boss?.maxHp ?? 250000) * 0.125),
    rightArmHp: Math.floor((boss?.currentHp ?? 250000) * 0.125),
    maxRightArmHp: Math.floor((boss?.maxHp ?? 250000) * 0.125),
    leftLegHp: Math.floor((boss?.currentHp ?? 250000) * 0.125),
    maxLeftLegHp: Math.floor((boss?.maxHp ?? 250000) * 0.125),
    rightLegHp: Math.floor((boss?.currentHp ?? 250000) * 0.125),
    maxRightLegHp: Math.floor((boss?.maxHp ?? 250000) * 0.125),
  };

  const headInfo = getBossPartStatus(body.headHp, body.maxHeadHp);
  const torsoInfo = getBossPartStatus(body.torsoHp, body.maxTorsoHp);
  const leftArmInfo = getBossPartStatus(body.leftArmHp, body.maxLeftArmHp);
  const rightArmInfo = getBossPartStatus(body.rightArmHp, body.maxRightArmHp);
  const leftLegInfo = getBossPartStatus(body.leftLegHp, body.maxLeftLegHp);
  const rightLegInfo = getBossPartStatus(body.rightLegHp, body.maxRightLegHp);

  const getTargetPartName = (part: BossTargetPart) => {
    switch (part) {
      case 'HEAD':
        return '🧠 Cabeza del Jefe';
      case 'TORSO':
        return '🫀 Torso del Jefe';
      case 'LEFT_ARM':
        return '💪 Brazo Izquierdo del Jefe';
      case 'RIGHT_ARM':
        return '💪 Brazo Derecho del Jefe';
      case 'LEFT_LEG':
        return '🦵 Pierna Izquierda del Jefe';
      case 'RIGHT_LEG':
        return '🦵 Pierna Derecha del Jefe';
      default:
        return '🫀 Torso del Jefe';
    }
  };

  const getActionEnergyCost = (action: string) => {
    if (action === 'ATK_PRIMARY') return 25;
    if (action === 'ATK_SECONDARY' || action === 'ATK_MELEE') return 15;
    if (action === 'TACTICAL_COVER') return 10;
    return 25;
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="coronavirus" size={36} className="text-rose-500" />
            <span>Consola Táctica de Incursión (World Boss Raid)</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Apuntado directo en modelo holográfico y ejecución táctica de armamento en tiempo real.
          </p>
        </div>
      </div>

      {/* Live Exposed Weak Spot Banner */}
      {boss?.activeWeakSpot && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
              🎯
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-amber-400 uppercase font-bold tracking-widest">
                // PUNTO DÉBIL EXPUESTO EN TIEMPO REAL (x2.5 DAÑO CRÍTICO)
              </span>
              <span className="font-headline-lg text-base sm:text-lg font-extrabold text-amber-200">
                {boss.activeWeakSpot.partName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-amber-950/60 px-4 py-2 rounded-xl border border-amber-500/40 shrink-0">
            <Icon name="timer" size={20} className="text-amber-400 animate-spin" />
            <div className="flex flex-col items-end">
              <span className="font-mono text-[9px] text-amber-300 uppercase">Tiempo Restante:</span>
              <span className="font-mono text-base font-extrabold text-amber-300">
                {weakSpotSecondsLeft}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Boss Hero Banner & Total Health Bar */}
      {boss && (
        <div className="bg-[#191f31]/80 backdrop-blur-lg border border-rose-500/30 p-6 rounded-2xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <Icon name="dangerous" size={40} />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs text-rose-400 uppercase font-bold tracking-widest">
                  Jefe de Ciudad Activo • Categoría {boss.category}
                </span>
                <h2 className="font-headline-lg text-xl sm:text-2xl font-extrabold text-slate-100 uppercase">
                  {boss.name}
                </h2>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-slate-400 uppercase">Salud Vital Total:</span>
              <span className="font-mono text-xl font-extrabold text-rose-400">
                {boss.currentHp.toLocaleString()} / {boss.maxHp.toLocaleString()} HP ({hpPercent.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-400 transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* MAIN COMBAT WARFARE CONSOLE (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERACTIVE HOLO-BODY SCANNER */}
        <div className="lg:col-span-5 bg-[#191f31]/60 backdrop-blur-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden min-h-[500px]">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(244,63,94,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="w-full flex justify-between items-center border-b border-rose-500/30 pb-2 relative z-10">
            <span className="font-mono text-[10px] text-rose-400 uppercase tracking-widest font-bold">
              // ESCÁNER HOLO-ANATÓMICO (HAZ CLIC EN UNA ZONA PARA APUNTAR)
            </span>
            {activeWeakKey === selectedTargetPart && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                🎯 BLANCO EXPUESTO (x2.5)
              </span>
            )}
          </div>

          <svg className="w-full max-w-[280px] h-auto relative z-10 my-4 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" viewBox="0 0 100 250">
            {/* Head */}
            <g
              onClick={() => setSelectedTargetPart('HEAD')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'HEAD' ? 'text-amber-400 animate-pulse' : headInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'HEAD' ? 0.75 : 0.3}
                points="50,10 65,15 65,30 55,40 45,40 35,30 35,15"
                stroke={selectedTargetPart === 'HEAD' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'HEAD' ? '3' : '1.5'}
              ></polygon>
              {selectedTargetPart === 'HEAD' && (
                <circle cx="50" cy="25" r="8" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="animate-ping" />
              )}
            </g>

            {/* Torso */}
            <g
              onClick={() => setSelectedTargetPart('TORSO')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'TORSO' ? 'text-amber-400 animate-pulse' : torsoInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'TORSO' ? 0.75 : 0.35}
                points="40,45 60,45 70,60 65,120 35,120 30,60"
                stroke={selectedTargetPart === 'TORSO' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'TORSO' ? '3' : '1.5'}
              ></polygon>
              {selectedTargetPart === 'TORSO' && (
                <circle cx="50" cy="80" r="10" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="animate-ping" />
              )}
            </g>

            {/* Left Arm */}
            <g
              onClick={() => setSelectedTargetPart('LEFT_ARM')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'LEFT_ARM' ? 'text-amber-400 animate-pulse' : leftArmInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'LEFT_ARM' ? 0.75 : 0.4}
                points="25,60 15,100 10,130 20,130 30,100 30,65"
                stroke={selectedTargetPart === 'LEFT_ARM' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'LEFT_ARM' ? '3' : '1.5'}
              ></polygon>
            </g>

            {/* Right Arm */}
            <g
              onClick={() => setSelectedTargetPart('RIGHT_ARM')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'RIGHT_ARM' ? 'text-amber-400 animate-pulse' : rightArmInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'RIGHT_ARM' ? 0.75 : 0.4}
                points="75,60 85,100 90,130 80,130 70,100 70,65"
                stroke={selectedTargetPart === 'RIGHT_ARM' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'RIGHT_ARM' ? '3' : '1.5'}
              ></polygon>
            </g>

            {/* Left Leg */}
            <g
              onClick={() => setSelectedTargetPart('LEFT_LEG')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'LEFT_LEG' ? 'text-amber-400 animate-pulse' : leftLegInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'LEFT_LEG' ? 0.75 : 0.3}
                points="35,125 45,125 40,190 35,240 25,240 30,190"
                stroke={selectedTargetPart === 'LEFT_LEG' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'LEFT_LEG' ? '3' : '1.5'}
              ></polygon>
            </g>

            {/* Right Leg */}
            <g
              onClick={() => setSelectedTargetPart('RIGHT_LEG')}
              className={`transition-all duration-300 hover:brightness-150 cursor-pointer ${
                activeWeakKey === 'RIGHT_LEG' ? 'text-amber-400 animate-pulse' : rightLegInfo.svgClass
              }`}
            >
              <polygon
                fill="currentColor"
                fillOpacity={selectedTargetPart === 'RIGHT_LEG' ? 0.75 : 0.3}
                points="55,125 65,125 70,190 75,240 65,240 60,190"
                stroke={selectedTargetPart === 'RIGHT_LEG' ? '#06b6d4' : 'currentColor'}
                strokeWidth={selectedTargetPart === 'RIGHT_LEG' ? '3' : '1.5'}
              ></polygon>
            </g>
          </svg>

          {/* TARGET LOCK SPECIFICATION CARD */}
          <div className="w-full bg-slate-900/90 border border-cyan-500/40 p-3 rounded-xl flex items-center justify-between relative z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Icon name="my_location" size={20} className="animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-cyan-400 uppercase font-bold">Blanco Fijado Actual:</span>
                <span className="font-mono text-xs font-extrabold text-slate-100 uppercase">
                  {getTargetPartName(selectedTargetPart)}
                </span>
              </div>
            </div>

            <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
              {selectedTargetPart === 'HEAD'
                ? 'x1.75 Daño'
                : selectedTargetPart === 'TORSO'
                ? '+10% Acierto'
                : 'Desarme / Derribo'}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: ARSENAL SELECTOR & MASTER STRIKE BUTTON */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* ARSENAL WEAPON ACTION CARDS GRID */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
              <Icon name="swords" size={14} className="text-rose-400" />
              <span>1. Selecciona el Modo de Armamento Táctico:</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Primary Weapon Card */}
              <div
                onClick={() => setSelectedActionType('ATK_PRIMARY')}
                className={`p-3.5 rounded-xl border font-mono transition-all cursor-pointer flex items-center gap-3 ${
                  selectedActionType === 'ATK_PRIMARY'
                    ? 'bg-rose-500/20 border-rose-500 text-slate-100 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-400'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedActionType === 'ATK_PRIMARY' ? 'bg-rose-500 text-slate-950 font-bold' : 'bg-slate-800 text-rose-400'
                }`}>
                  <Icon name="crosshair" size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold uppercase truncate">Ataque Principal</span>
                  <span className="text-[10px] opacity-75">Arma Pesada (25⚡)</span>
                </div>
              </div>

              {/* Secondary Weapon Card */}
              <div
                onClick={() => setSelectedActionType('ATK_SECONDARY')}
                className={`p-3.5 rounded-xl border font-mono transition-all cursor-pointer flex items-center gap-3 ${
                  selectedActionType === 'ATK_SECONDARY'
                    ? 'bg-cyan-500/20 border-cyan-500 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedActionType === 'ATK_SECONDARY' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
                }`}>
                  <Icon name="speed" size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold uppercase truncate">Ataque Secundario</span>
                  <span className="text-[10px] opacity-75">Arma Corta (15⚡)</span>
                </div>
              </div>

              {/* Melee Weapon Card */}
              <div
                onClick={() => setSelectedActionType('ATK_MELEE')}
                className={`p-3.5 rounded-xl border font-mono transition-all cursor-pointer flex items-center gap-3 ${
                  selectedActionType === 'ATK_MELEE'
                    ? 'bg-amber-500/20 border-amber-500 text-slate-100 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedActionType === 'ATK_MELEE' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                }`}>
                  <Icon name="sports_mma" size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold uppercase truncate">Ataque Melee</span>
                  <span className="text-[10px] opacity-75">Cuerpo a Cuerpo (15⚡)</span>
                </div>
              </div>

              {/* Tactical Cover Card */}
              <div
                onClick={() => setSelectedActionType('TACTICAL_COVER')}
                className={`p-3.5 rounded-xl border font-mono transition-all cursor-pointer flex items-center gap-3 ${
                  selectedActionType === 'TACTICAL_COVER'
                    ? 'bg-slate-700/60 border-slate-400 text-slate-100 shadow-[0_0_20px_rgba(148,163,184,0.3)] ring-1 ring-slate-300'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedActionType === 'TACTICAL_COVER' ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}>
                  <Icon name="shield" size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold uppercase truncate">Cobertura Táctica</span>
                  <span className="text-[10px] opacity-75">Guardia (-60% Daño) (10⚡)</span>
                </div>
              </div>
            </div>
          </div>

          {/* MASTER TACTICAL STRIKE TRIGGER BUTTON */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
              <Icon name="bolt" size={14} className="text-amber-400" />
              <span>2. Ejecutar Ataque Táctico sobre el Blanco:</span>
            </span>

            <button
              disabled={attacking}
              onClick={handleAttack}
              className={`w-full py-5 px-6 rounded-2xl font-mono text-sm font-extrabold uppercase tracking-widest transition-all duration-300 shadow-2xl cursor-pointer disabled:opacity-50 flex flex-col items-center justify-center gap-2 relative overflow-hidden group ${
                selectedActionType === 'TACTICAL_COVER'
                  ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 hover:brightness-125 text-slate-100 border border-slate-500/50'
                  : activeWeakKey === selectedTargetPart
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-125 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.7)] animate-bounce'
                  : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-125 text-slate-950 shadow-[0_0_30px_rgba(244,63,94,0.6)]'
              }`}
            >
              <div className="flex items-center gap-3 relative z-10 text-base sm:text-lg">
                <Icon name="crosshair" size={24} className="animate-spin" />
                <span>
                  {attacking ? 'EJECUTANDO FUEGO TÁCTICO...' : 'EJECUTAR FUEGO // DISPARAR'}
                </span>
                <span className="bg-slate-950/40 px-3 py-1 rounded-lg text-xs font-bold border border-white/20">
                  {getActionEnergyCost(selectedActionType)}⚡
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] opacity-90 relative z-10 tracking-normal font-semibold">
                <span>🎯 Blanco: {getTargetPartName(selectedTargetPart)}</span>
                {activeWeakKey === selectedTargetPart && (
                  <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-extrabold border border-amber-400">
                    🎯 PUNTO DÉBIL (x2.5)
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* QUICK TACTICAL CONSUMABLES DECK */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 shrink-0">
              <Icon name="medical_services" size={14} className="text-emerald-400" />
              Consumibles Rápidos de Combate:
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                disabled={usingConsumable}
                onClick={handleQuickHeal}
                className="flex-1 sm:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-xl font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>💊 Botiquín Rápido</span>
              </button>

              <button
                disabled={usingConsumable}
                onClick={handleQuickEnergy}
                className="flex-1 sm:flex-none bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-2 rounded-xl font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>🧪 Energizante (+25⚡)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE COMBAT STREAM TICKER & TURN LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Turn Log */}
        {lastResult && (
          <div className="lg:col-span-7 bg-[#191f31]/60 p-5 rounded-xl border border-white/10 flex flex-col gap-3 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400 uppercase font-bold">Reporte de Turno Táctico</span>
              <span className="text-rose-400 font-bold">{lastResult.phaseTitle}</span>
            </div>

            <p className="text-slate-200 italic leading-relaxed">
              "{lastResult.quote}"
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div className="flex flex-col">
                <span className="text-slate-500">Daño Infligido</span>
                <span className="text-emerald-400 font-bold">+{lastResult.damageDealt?.toLocaleString()} HP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">Zona Asestada</span>
                <span className="text-rose-400 font-bold">{lastResult.bossPartStruck}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">Contraataque Recibido</span>
                <span className="text-amber-400 font-bold">-{lastResult.counterDamage} HP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">Energía Restante</span>
                <span className="text-cyan-400 font-bold">{lastResult.remainingEnergy}⚡</span>
              </div>
            </div>
          </div>
        )}

        {/* Live City Stream Ticker */}
        <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-xl border border-white/10 flex flex-col gap-2 font-mono text-[11px] h-[180px] overflow-y-auto shadow-inner">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 shrink-0">
            <span className="text-cyan-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Transmisión Táctica en Vivo (Sockets)
            </span>
            <span className="text-[9px] text-slate-500 uppercase">Sinford Feed</span>
          </div>

          {liveFeed.length === 0 ? (
            <div className="text-slate-500 italic py-6 text-center text-[10px]">
              📡 Esperando impacto táctico de otros ciudadanos...
            </div>
          ) : (
            liveFeed.map((evt, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 text-[10px]">
                <span className="text-slate-300 font-bold">
                  💥 <span className="text-cyan-300">{evt.playerName}</span> asestó en <span className="text-amber-300">{evt.bossPartStruck}</span>
                </span>
                <span className="text-emerald-400 font-extrabold shrink-0">
                  +{evt.damageDealt?.toLocaleString()} HP {evt.isWeakSpotHit ? '🎯 (P. DÉBIL)' : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
