import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface JailPanelProps {
  sessionJwt: string | null;
  onActionSuccess?: () => void;
}

export const JailPanel: React.FC<JailPanelProps> = ({ sessionJwt, onActionSuccess }) => {
  const [prisoners, setPrisoners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchJailList = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/jail/list', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.prisoners) setPrisoners(res.data.prisoners);
    } catch (err) {
      console.error('❌ Error al obtener prisioneros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJailList();
  }, [sessionJwt]);

  const handleBail = async (jailedPlayerId: string, username: string) => {
    setMessage(null);
    try {
      await api.post(
        '/jail/bail',
        { jailedPlayerId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(`🔓 ¡Fianza pagada! Liberaste a **${username}** de prisión.`);
      if (onActionSuccess) onActionSuccess();
      fetchJailList();
    } catch (err: any) {
      setMessage(err.response?.data?.error || `❌ Error al pagar la fianza de ${username}.`);
    }
  };

  const handleBust = async (jailedPlayerId: string, username: string) => {
    setMessage(null);
    try {
      const res = await api.post(
        '/jail/bust',
        { jailedPlayerId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(res.data?.message || `🔓 Rescate intentado a ${username}.`);
      if (onActionSuccess) onActionSuccess();
      fetchJailList();
    } catch (err: any) {
      setMessage(err.response?.data?.error || `❌ Error al intentar rescatar a ${username}.`);
    }
  };

  const handleSelfBust = async () => {
    setMessage(null);
    try {
      const res = await api.post(
        '/jail/self-bust',
        {},
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(res.data?.message || '🔓 Intento de fuga ejecutado.');
      if (onActionSuccess) onActionSuccess();
      fetchJailList();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al intentar fuga.');
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="lock" size={36} className="text-rose-400" />
            <span>Prisión del Condado de Sinford</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Revisa a los reclusos encarcelados, paga fianzas o intenta rescates de alto riesgo (Busts).
          </p>
        </div>

        <button
          onClick={handleSelfBust}
          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-5 py-2.5 rounded-xl font-mono text-xs uppercase font-bold tracking-wider cursor-pointer shadow-md"
        >
          🚨 Intentar Fuga Propia (50% Nerve)
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md ${
          message.includes('éxito') || message.includes('Liberaste') || message.includes('Fuga espectacular')
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* Prisoner List */}
      <div className="bg-[#191f31]/60 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col gap-4">
        <h2 className="font-headline-lg text-lg text-slate-100 font-bold uppercase tracking-tight flex items-center gap-2">
          <Icon name="gavel" size={20} className="text-rose-400" />
          <span>Reclusos Activos en Celdas ({prisoners.length})</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-slate-400 animate-pulse">
            ⏳ Registrando celdas del penal...
          </div>
        ) : prisoners.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-slate-500 bg-slate-900/40 rounded-xl">
            La prisión está limpia. Sin reclusos encarcelados en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prisoners.map((p) => {
              const jailEnd = new Date(p.jailUntil);
              const now = new Date();
              const remainingMin = Math.max(0, Math.ceil((jailEnd.getTime() - now.getTime()) / 60000));
              const bailCost = 100 * remainingMin * p.level;

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/80 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-headline-lg text-base font-bold text-slate-100 uppercase">
                        {p.username}
                      </span>
                      <span className="font-mono text-xs text-rose-400 font-bold mt-0.5">
                        ⏱️ Condena restante: {remainingMin}m
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold uppercase rounded">
                      Nivel {p.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 gap-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      Fianza: ${bailCost.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBail(p.id, p.username)}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded font-mono text-xs uppercase font-bold cursor-pointer transition"
                      >
                        Pagar Fianza
                      </button>
                      <button
                        onClick={() => handleBust(p.id, p.username)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded font-mono text-xs uppercase font-bold cursor-pointer transition"
                      >
                        Rescatar (5🧠)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
