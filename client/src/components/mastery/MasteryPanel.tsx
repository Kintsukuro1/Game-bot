import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface Perk {
  id: string;
  name: string;
  branch: string;
  cost: number;
  description: string;
  emoji: string;
}

interface MasteryInfo {
  level: number;
  perkPoints: number;
  activePerks: string[];
}

interface MasteryPanelProps {
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function MasteryPanel({ sessionToken, onStatsUpdate }: MasteryPanelProps) {
  const [mastery, setMastery] = useState<MasteryInfo | null>(null);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMasteryInfo = async () => {
    if (!sessionToken) return;
    try {
      setLoading(true);
      const res = await api.get('/mastery/info', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setMastery(res.data?.mastery || null);
      setPerks(res.data?.perks || []);
    } catch (err: any) {
      console.error('Error fetching mastery info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasteryInfo();
  }, [sessionToken]);

  const handleRedeemPerk = async (perkId: string) => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/mastery/redeem',
        { perkId },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({
        type: 'success',
        text: `🔮 ¡Ventaja activada con éxito! Perk "${res.data?.perkId}" desbloqueado.`,
      });
      fetchMasteryInfo();
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-8 text-center font-mono text-slate-400">
        🔮 Cargando santuario de maestrías del personaje...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="psychology" size={16} /> Árbol de Maestrías & Especialización
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Especializaciones Permanentes
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Canjea tus Puntos de Perk para activar mejoras permanentes de energía, nerve, atributos de combate e inteligencia laboral.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl p-4 flex flex-col items-end shrink-0 font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Puntos de Perk Disponibles</span>
            <span className="text-2xl font-extrabold text-purple-400">
              {mastery?.perkPoints || 0} 🔮
            </span>
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

      {/* Perk List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {perks.map((perk) => {
          const isUnlocked = mastery?.activePerks?.includes(perk.id);

          return (
            <div
              key={perk.id}
              className={`bg-[#121624] border rounded-2xl p-5 flex flex-col justify-between transition ${
                isUnlocked
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-white/10 hover:border-purple-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{perk.emoji}</span>
                  <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-bold uppercase">
                    {perk.branch}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-base mb-1">{perk.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{perk.description}</p>
              </div>

              <button
                disabled={isUnlocked || (mastery?.perkPoints || 0) < perk.cost}
                onClick={() => handleRedeemPerk(perk.id)}
                className={`w-full py-2 px-3 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                  isUnlocked
                    ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400 cursor-default'
                    : (mastery?.perkPoints || 0) >= perk.cost
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isUnlocked ? '✅ Desbloqueado' : `🔮 Canjear (${perk.cost} Puntos)`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
