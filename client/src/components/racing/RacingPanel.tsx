import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface RaceTrack {
  id: string;
  name: string;
  distanceKm: number;
  entryFee: number;
}

interface RacingPanelProps {
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function RacingPanel({ sessionToken, onStatsUpdate }: RacingPanelProps) {
  const [tracks, setTracks] = useState<RaceTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<{ trackName: string; timeSeconds: number } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRacingInfo = async () => {
    if (!sessionToken) return;
    try {
      setLoading(true);
      const res = await api.get('/racing/info', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setTracks(res.data?.tracks || []);
    } catch (err: any) {
      console.error('Error fetching racing info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRacingInfo();
  }, [sessionToken]);

  const handleRace = async (trackId: string) => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/racing/race',
        { trackId },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const result = res.data?.result;
      setLastResult(result);
      setActionMsg({
        type: 'success',
        text: `🏎️ ¡Carrera completada en pista "${result?.trackName}"! Tiempo registrado: ${result?.timeSeconds?.toFixed(2)}s.`,
      });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-8 text-center font-mono text-slate-400">
        🏎️ Cargando autódromo de carreras clandestinas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="speed" size={16} /> Circuitos Clandestinos Sinford
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Drag Racing & Desafíos de Velocidad
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Compite en carreras de aceleración callejeras. La velocidad y agilidad de tu personaje determinan el tiempo de llegada a la meta.
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

      {/* Last Race Telemetry Card */}
      {lastResult && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold">Telemetría de la Última Carrera</span>
            <h4 className="font-bold text-slate-100 text-sm mt-0.5">{lastResult.trackName}</h4>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 font-bold text-base">
            ⏱️ {lastResult.timeSeconds.toFixed(2)}s
          </div>
        </div>
      )}

      {/* Race Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-[#121624] border border-white/10 hover:border-red-500/40 rounded-2xl p-6 flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-100 text-lg">{track.name}</h3>
                <span className="text-[10px] font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold">
                  {track.distanceKm} KM
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-400 font-bold mb-4">
                Inscripción: ${track.entryFee.toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => handleRace(track.id)}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-red-600/20"
            >
              🏎️ Iniciar Carrera Drag
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
