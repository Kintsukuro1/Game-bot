import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface TravelState {
  destination: string;
  isTraveling: boolean;
  arrivesAt?: string;
}

interface Destination {
  id: string;
  name: string;
  cost: number;
  durationMinutes: number;
}

interface TravelPanelProps {
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function TravelPanel({ sessionToken, onStatsUpdate }: TravelPanelProps) {
  const [travelState, setTravelState] = useState<TravelState | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTravelState = async () => {
    if (!sessionToken) return;
    try {
      setLoading(true);
      const res = await api.get('/travel/state', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setTravelState(res.data?.travelState);
      setDestinations(res.data?.destinations || []);
    } catch (err: any) {
      console.error('Error fetching travel state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelState();
  }, [sessionToken]);

  const handleFly = async (destinationId: string) => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/travel/fly',
        { destinationId },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setTravelState(res.data?.travelState);
      setActionMsg({ type: 'success', text: `✈️ ¡Vuelo Despegado! Destino: ${destinationId}` });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  const handleReturn = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/travel/return',
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setTravelState(res.data?.travelState);
      setActionMsg({ type: 'success', text: '🏠 ¡Has regresado sano y salvo a Sinford!' });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  const handleSwissDetox = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/travel/detox',
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({ type: 'success', text: res.data?.message || '🏥 ¡Tratamiento médico completado! Adicción al 0%.' });
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-8 text-center font-mono text-slate-400">
        ✈️ Cargando terminal de vuelos internacionales...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="flight_takeoff" size={16} /> Aeropuerto Internacional Sinford
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Agencia de Viajes & Destinos Exóticos
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Viaja a otros países para adquirir armas exóticas, narcóticos de alta pureza o realizar tratamientos médicos en clínicas suizas.
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="bg-slate-950/80 border border-sky-500/40 rounded-xl p-3.5 flex flex-col items-end shrink-0 font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Ubicación Actual</span>
            <span className="text-sm font-bold text-sky-300">
              {travelState?.destination === 'Home' ? '🏙️ Sinford City (Home)' : `✈️ ${travelState?.destination}`}
            </span>
            {travelState?.isTraveling && (
              <span className="text-[10px] text-amber-400 animate-pulse font-bold mt-0.5">
                EN VUELO HASTA DESTINO
              </span>
            )}
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

      {/* Return Home Button (If abroad) */}
      {travelState?.destination !== 'Home' && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-amber-300 text-sm">Vuelo de Regreso a Sinford</h4>
            <p className="text-xs text-slate-400 mt-0.5">Retorna a tu ciudad natal para continuar entrenando y operando en tu sindicato.</p>
          </div>
          <button
            onClick={handleReturn}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer font-mono"
          >
            🏠 Retornar a Sinford
          </button>
        </div>
      )}

      {/* Swiss Medical Clinic Card */}
      {travelState?.destination === 'Switzerland' && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase mb-1">
              🏥 Clínica Médica Suiza (Swiss Rehabilitation)
            </div>
            <h4 className="font-bold text-slate-100 text-sm">Tratamiento de Desintoxicación Avanzada</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Limpia completamente el nivel de adicción del organismo a 0% para eliminar el riesgo de sobredosis.
            </p>
          </div>
          <button
            onClick={handleSwissDetox}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer font-mono shrink-0"
          >
            💉 Rehabilitación ($25,000)
          </button>
        </div>
      )}

      {/* Destination Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {destinations.map((dest) => {
          const isCurrent = travelState?.destination === dest.id;

          return (
            <div
              key={dest.id}
              className={`bg-[#121624] border rounded-2xl p-5 flex flex-col justify-between transition ${
                isCurrent
                  ? 'border-sky-500 shadow-lg shadow-sky-500/10'
                  : 'border-white/10 hover:border-sky-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-100 text-base">{dest.name}</span>
                  <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-bold">
                    ⏱️ {dest.durationMinutes} min
                  </span>
                </div>
                <p className="text-xs font-mono text-emerald-400 font-bold mb-4">
                  Boleto: ${dest.cost.toLocaleString()}
                </p>
              </div>

              <button
                disabled={isCurrent || travelState?.isTraveling}
                onClick={() => handleFly(dest.id)}
                className={`w-full py-2 px-3 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20'
                }`}
              >
                {isCurrent ? '📍 Ubicación Actual' : '✈️ Comprar Boleto'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
