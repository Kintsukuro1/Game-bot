import { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface DuelPanelProps {
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function DuelPanel({ sessionToken, onStatsUpdate }: DuelPanelProps) {
  const [targetDiscordId, setTargetDiscordId] = useState('');
  const [wagerCash, setWagerCash] = useState('1000');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [duelLog, setDuelLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChallenge = async () => {
    if (!sessionToken) return;
    if (!targetDiscordId.trim()) {
      setActionMsg({ type: 'error', text: 'Ingresa el Discord ID del oponente para desafiarlo.' });
      return;
    }

    setActionMsg(null);
    setLoading(true);
    setDuelLog(null);
    try {
      const res = await api.post(
        '/combat/attack-player',
        { targetDiscordId: targetDiscordId.trim() },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setDuelLog(res.data?.combatLog);
      setActionMsg({
        type: 'success',
        text: `⚔️ ¡Duelo concluido! Ganador: ${res.data?.combatLog?.winnerUsername}`,
      });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="swords" size={16} /> Arena de Duelos PvP & Retos Directos
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Desafíos de Honor & Apuestas
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Desafía a cualquier rival de la ciudad a un duelo en vivo. El ganador se lleva el botín y la reputación de combate.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
            actionMsg.type === 'error'
              ? 'bg-rose-950/80 border-rose-600/50 text-rose-300'
              : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Challenge Form */}
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 font-mono">Lanzar Desafío PvP</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase font-bold mb-2">
              Discord ID del Oponente
            </label>
            <input
              type="text"
              value={targetDiscordId}
              onChange={(e) => setTargetDiscordId(e.target.value)}
              placeholder="Ej: 287396390747766795"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase font-bold mb-2">
              Apuesta en Efectivo ($)
            </label>
            <input
              type="number"
              value={wagerCash}
              onChange={(e) => setWagerCash(e.target.value)}
              placeholder="1000"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-xs font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleChallenge}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20"
        >
          {loading ? '⚔️ Entrando a la Arena...' : '⚔️ Entrar a Duelo en Vivo (Consume 25⚡)'}
        </button>
      </div>

      {/* Duel Turn Log */}
      {duelLog && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-3 font-mono">
          <h4 className="font-bold text-slate-100 text-sm">Resumen del Duelo</h4>
          <div className="text-xs text-emerald-400 font-bold">
            🏆 Ganador: {duelLog.winnerUsername} | Daño Total: {duelLog.totalDamageDealt} HP
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            {duelLog.turns?.map((turn: any, index: number) => (
              <div key={index} className="text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                Turno {turn.turnNumber}: <span className="text-slate-200">{turn.attackerName}</span> atacó a{' '}
                <span className="text-slate-200">{turn.defenderName}</span> infligiendo{' '}
                <span className="text-rose-400 font-bold">{turn.damageDealt} HP</span>.
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
