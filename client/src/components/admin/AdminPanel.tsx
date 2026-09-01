import { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface AdminPanelProps {
  userDiscordId?: string;
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function AdminPanel({ userDiscordId, sessionToken, onStatsUpdate }: AdminPanelProps) {
  const [targetDiscordId, setTargetDiscordId] = useState('');
  const [cashAmount, setCashAmount] = useState('1000000');
  const [levelAmount, setLevelAmount] = useState('10');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const AUTHORIZED_ADMIN_ID = '287396390747766795';

  if (userDiscordId !== AUTHORIZED_ADMIN_ID) {
    return (
      <div className="bg-rose-950/30 border border-rose-600/40 rounded-2xl p-8 text-center font-mono text-rose-300">
        🔒 Acceso Denegado: Esta consola de administración está reservada exclusivamente para el Desarrollador Principal.
      </div>
    );
  }

  const handleGiveCash = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/admin/give-cash',
        { targetDiscordId: targetDiscordId.trim() || userDiscordId, amount: cashAmount },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({ type: 'success', text: `🛠️ ${res.data?.message || 'Efectivo otorgado con éxito.'}` });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  const handleResetEnergy = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/admin/reset-energy',
        { targetDiscordId: targetDiscordId.trim() || userDiscordId },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({ type: 'success', text: `⚡ ${res.data?.message || 'Energía restaurada al 100%.'}` });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  const handleSetLevel = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/admin/set-level',
        { targetDiscordId: targetDiscordId.trim() || userDiscordId, level: parseInt(levelAmount) },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({ type: 'success', text: `📈 ${res.data?.message || 'Nivel actualizado.'}` });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="terminal" size={16} /> Consola Developer Principal (Exclusivo)
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Panel de Administración Dev
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Bienvenido Administrador (ID: {AUTHORIZED_ADMIN_ID}). Herramientas de depuración y gestión de estados de juego.
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

      {/* Target Selection */}
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-5 font-mono">
        <label className="block text-xs text-slate-300 font-bold uppercase mb-2">
          Discord ID del Jugador Objetivo (Dejar vacío para aplicarlo a ti mismo)
        </label>
        <input
          type="text"
          value={targetDiscordId}
          onChange={(e) => setTargetDiscordId(e.target.value)}
          placeholder={`Ej: ${userDiscordId}`}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        {/* Give Cash */}
        <div className="bg-[#121624] border border-white/10 rounded-2xl p-5 space-y-3">
          <h4 className="font-bold text-amber-300 text-sm">💰 Otorgar Efectivo</h4>
          <input
            type="number"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="1000000"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleGiveCash}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Añadir Cash
          </button>
        </div>

        {/* Reset Energy */}
        <div className="bg-[#121624] border border-white/10 rounded-2xl p-5 space-y-3">
          <h4 className="font-bold text-sky-300 text-sm">⚡ Restaurar Energía</h4>
          <p className="text-[11px] text-slate-400">Restablece la energía al 100% de inmediato.</p>
          <button
            onClick={handleResetEnergy}
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition cursor-pointer mt-4"
          >
            Restaurar 100% ⚡
          </button>
        </div>

        {/* Set Level */}
        <div className="bg-[#121624] border border-white/10 rounded-2xl p-5 space-y-3">
          <h4 className="font-bold text-purple-300 text-sm">📈 Cambiar Nivel</h4>
          <input
            type="number"
            value={levelAmount}
            onChange={(e) => setLevelAmount(e.target.value)}
            placeholder="10"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleSetLevel}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fijar Nivel
          </button>
        </div>
      </div>
    </div>
  );
}
