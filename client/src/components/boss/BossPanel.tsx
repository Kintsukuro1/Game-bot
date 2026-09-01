import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface BossPanelProps {
  sessionJwt: string | null;
  onAttackSuccess?: () => void;
}

export const BossPanel: React.FC<BossPanelProps> = ({ sessionJwt, onAttackSuccess }) => {
  const [boss, setBoss] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [attacking, setAttacking] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const handleAttack = async (actionType: string) => {
    if (!boss) return;
    setMessage(null);
    setAttacking(true);

    try {
      const res = await api.post(
        '/boss/attack',
        { bossId: boss.id, actionType },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const result = res.data?.result;
      setLastResult(result);

      if (result) {
        setMessage(
          result.isHit
            ? `💥 **¡Impacto Exitoso con ${result.weaponName}!** Infringiste **${result.damageDealt} HP** de daño al Jefe.`
            : `❌ **¡Ataque Fallido!** El Jefe esquivó tu impacto de ${result.weaponName}.`
        );
      }

      if (onAttackSuccess) onAttackSuccess();
      fetchActiveBoss();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al intentar atacar al Jefe.');
    } finally {
      setAttacking(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-20 text-center font-mono text-sm text-slate-400 animate-pulse">
        ⏳ Sincronizando con el sensor táctico del Jefe de Ciudad...
      </div>
    );
  }

  const hpPercent = boss ? Math.min(100, Math.max(0, (boss.currentHp / boss.maxHp) * 100)) : 100;

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="coronavirus" size={36} className="text-rose-500" />
            <span>Incursión de Jefe de Ciudad (World Boss Raid)</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Combate cooperativo masivo. Une fuerzas con la ciudad para derrotar al Titán.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md ${
          message.includes('Exitoso')
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* Boss Hero Banner */}
      {boss && (
        <div className="bg-[#191f31]/80 backdrop-blur-lg border border-rose-500/30 p-6 rounded-2xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <Icon name="dangerous" size={40} />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs text-rose-400 uppercase font-bold tracking-widest">
                  Jefe de Ciudad Activo
                </span>
                <h2 className="font-headline-lg text-xl sm:text-2xl font-extrabold text-slate-100 uppercase">
                  {boss.name}
                </h2>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-slate-400 uppercase">Salud del Titán:</span>
              <span className="font-mono text-xl font-extrabold text-rose-400">
                {boss.currentHp.toLocaleString()} / {boss.maxHp.toLocaleString()} HP
              </span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>

          {/* Tactical Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            <button
              disabled={attacking}
              onClick={() => handleAttack('ATK_PRIMARY')}
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="crosshair" size={16} />
              <span>Ataque Principal (25⚡)</span>
            </button>

            <button
              disabled={attacking}
              onClick={() => handleAttack('ATK_SECONDARY')}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="speed" size={16} />
              <span>Ataque Secundario (15⚡)</span>
            </button>

            <button
              disabled={attacking}
              onClick={() => handleAttack('ATK_MELEE')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="sports_mma" size={16} />
              <span>Ataque Melee (15⚡)</span>
            </button>

            <button
              disabled={attacking}
              onClick={() => handleAttack('TACTICAL_COVER')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="shield" size={16} />
              <span>Cobertura Táctica (10⚡)</span>
            </button>
          </div>
        </div>
      )}

      {/* Combat Result Log Card */}
      {lastResult && (
        <div className="bg-[#191f31]/60 p-5 rounded-xl border border-white/10 flex flex-col gap-3 font-mono text-xs">
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
              <span className="text-emerald-400 font-bold">+{lastResult.damageDealt} HP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Contraataque Jefe</span>
              <span className="text-rose-400 font-bold">-{lastResult.counterDamage} HP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Zona Impactada</span>
              <span className="text-amber-400 font-bold">{lastResult.bodyPartStruck}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">Energía Restante</span>
              <span className="text-cyan-400 font-bold">{lastResult.remainingEnergy}⚡</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
