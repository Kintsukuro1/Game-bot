import { Icon } from '../common/Icon';
import type { ActivityFeedItem } from '../../types/activity';

interface CityHubProps {
  onSelectTab: (tab: string) => void;
  playerLevel?: number;
  MODULE_REQUIRED_LEVELS?: Record<string, number>;
  activities?: ActivityFeedItem[];
}

interface DistrictLocation {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  colorClass: string;
  borderHoverClass: string;
  minLevel: number;
}

const DISTRICT_LOCATIONS: DistrictLocation[] = [
  {
    id: 'profile',
    name: 'Clínica Médica',
    subtitle: 'Atención Médica & Hospital',
    icon: 'local_hospital',
    colorClass: 'text-emerald-400 bg-emerald-500/10',
    borderHoverClass: 'hover:border-emerald-500/40',
    minLevel: 1,
  },
  {
    id: 'gym',
    name: 'Gimnasio Iron Gym',
    subtitle: 'Entrenamiento de Stats',
    icon: 'fitness_center',
    colorClass: 'text-amber-400 bg-amber-500/10',
    borderHoverClass: 'hover:border-amber-500/40',
    minLevel: 1,
  },
  {
    id: 'crimes',
    name: 'Callejones Subterráneos',
    subtitle: 'Contrabando & Crímenes',
    icon: 'explore',
    colorClass: 'text-emerald-400 bg-emerald-500/10',
    borderHoverClass: 'hover:border-emerald-500/40',
    minLevel: 1,
  },
  {
    id: 'bounties',
    name: 'Tablón de Recompensas',
    subtitle: 'Caza de Objetivos & Recompensas',
    icon: 'crosshair',
    colorClass: 'text-rose-400 bg-rose-500/10',
    borderHoverClass: 'hover:border-rose-500/40',
    minLevel: 3,
  },
  {
    id: 'boss',
    name: 'Base de Capos (Boss)',
    subtitle: 'Incursión World Boss',
    icon: 'coronavirus',
    colorClass: 'text-rose-500 bg-rose-500/10',
    borderHoverClass: 'hover:border-rose-500/40',
    minLevel: 3,
  },
  {
    id: 'jail',
    name: 'Prisión de Máxima Seguridad',
    subtitle: 'Fianza & Fugas',
    icon: 'lock',
    colorClass: 'text-rose-300 bg-rose-500/10',
    borderHoverClass: 'hover:border-rose-400/40',
    minLevel: 3,
  },
  {
    id: 'duels',
    name: 'Arena de Duelos',
    subtitle: 'Combate PVP Apustado',
    icon: 'swords',
    colorClass: 'text-rose-400 bg-rose-500/10',
    borderHoverClass: 'hover:border-rose-500/40',
    minLevel: 3,
  },
  {
    id: 'market',
    name: 'Mercado Negro',
    subtitle: 'Armas Balísticas & Tráfico',
    icon: 'storefront',
    colorClass: 'text-amber-400 bg-amber-500/10',
    borderHoverClass: 'hover:border-amber-500/40',
    minLevel: 5,
  },
  {
    id: 'faction',
    name: 'Sindicato de Facción',
    subtitle: 'QG Criminal & Operaciones',
    icon: 'shield_moon',
    colorClass: 'text-purple-400 bg-purple-500/10',
    borderHoverClass: 'hover:border-purple-500/40',
    minLevel: 5,
  },
  {
    id: 'property',
    name: 'Bienes Raíces',
    subtitle: 'Mansiones & Propiedades',
    icon: 'home',
    colorClass: 'text-emerald-400 bg-emerald-500/10',
    borderHoverClass: 'hover:border-emerald-500/40',
    minLevel: 5,
  },
  {
    id: 'profession',
    name: 'Especializaciones',
    subtitle: 'Profesiones de la Ciudad',
    icon: 'work',
    colorClass: 'text-purple-400 bg-purple-500/10',
    borderHoverClass: 'hover:border-purple-500/40',
    minLevel: 5,
  },
  {
    id: 'company',
    name: 'Empresas & Negocios',
    subtitle: 'Corporaciones del Submundo',
    icon: 'domain',
    colorClass: 'text-emerald-400 bg-emerald-500/10',
    borderHoverClass: 'hover:border-emerald-500/40',
    minLevel: 5,
  },
  {
    id: 'travel',
    name: 'Aeropuerto Internacional',
    subtitle: 'Vuelos & Destinos Globales',
    icon: 'flight_takeoff',
    colorClass: 'text-sky-400 bg-sky-500/10',
    borderHoverClass: 'hover:border-sky-500/40',
    minLevel: 8,
  },
  {
    id: 'racing',
    name: 'Circuito de Carreras',
    subtitle: 'Pistas Ilegales & Tuning',
    icon: 'speed',
    colorClass: 'text-red-400 bg-red-500/10',
    borderHoverClass: 'hover:border-red-500/40',
    minLevel: 8,
  },
  {
    id: 'casino',
    name: 'Casino Subterráneo',
    subtitle: 'Apuestas & Tragamonedas',
    icon: 'casino',
    colorClass: 'text-cyan-400 bg-cyan-500/10',
    borderHoverClass: 'hover:border-cyan-500/40',
    minLevel: 10,
  },
  {
    id: 'bank',
    name: 'Banco Central de Sinford',
    subtitle: 'Inversiones & Acciones',
    icon: 'account_balance',
    colorClass: 'text-emerald-400 bg-emerald-500/10',
    borderHoverClass: 'hover:border-emerald-500/40',
    minLevel: 10,
  },
];

export const CityHub: React.FC<CityHubProps> = ({
  onSelectTab,
  playerLevel = 1,
  MODULE_REQUIRED_LEVELS = {},
  activities = [],
}) => {
  return (
    <div className="flex flex-col w-full gap-6">
      {/* Hero Section Banner */}
      <section
        className="relative w-full overflow-hidden rounded-xl bg-slate-900/80 p-6 flex flex-col justify-end min-h-[220px] sm:min-h-[260px] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-cyan-400 uppercase tracking-tighter">
                Sinford Central District
              </h1>
            </div>
            <p className="font-caption text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Selecciona un sector o actividad para iniciar operaciones en la ciudad. Los sectores avanzados requieren mayor reputación y nivel de jugador.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_currentColor]"></span>
              Syndicate Free-Zone
            </div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Tu Nivel Actual: <span className="text-amber-400 font-bold">Nivel {playerLevel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: District Locations */}
      <section className="w-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-lg text-lg text-slate-100 tracking-tight font-bold">
              Sectores & Operaciones Urbanas
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
              {DISTRICT_LOCATIONS.length} Sectores
            </span>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DISTRICT_LOCATIONS.map((location) => {
            const reqLevel = MODULE_REQUIRED_LEVELS[location.id] ?? location.minLevel;
            const isLocked = playerLevel < reqLevel;

            return (
              <button
                key={location.id}
                onClick={() => onSelectTab(location.id)}
                className={`group relative p-4 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer text-left border shadow-sm ${
                  isLocked
                    ? 'bg-slate-950/40 border-slate-800/80 hover:border-amber-500/30 opacity-70 hover:opacity-100'
                    : `bg-[#191f31]/60 hover:bg-[#191f31] border-white/5 ${location.borderHoverClass}`
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                      isLocked ? 'bg-slate-900 text-slate-500' : location.colorClass
                    }`}
                  >
                    <Icon name={isLocked ? 'lock' : location.icon} size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold truncate transition-colors ${
                        isLocked
                          ? 'text-slate-400 group-hover:text-amber-300'
                          : 'text-slate-100 group-hover:text-cyan-300'
                      }`}
                    >
                      {location.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      {location.subtitle}
                    </span>
                  </div>
                </div>

                {isLocked && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-slate-900 text-amber-400 border border-amber-500/30 shrink-0 shadow-sm">
                    🔒 NVL {reqLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Activity Feed Panel */}
      <section className="mt-auto">
        <div className="w-full bg-[#191f31]/60 backdrop-blur-sm rounded-xl border border-white/5 p-4 flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_currentColor]"></span>
              <h3 className="font-mono text-xs text-rose-400 uppercase tracking-widest font-bold">
                Comunicaciones del Distrito en Vivo
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              EN VIVO
            </span>
          </div>

          <div className="h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {Array.isArray(activities) && activities.length > 0 ? (
              activities.map((act, index) => {
                if (!act) return null;
                let formattedTime = '--:--';
                try {
                  if (act.timestamp) {
                    const d = new Date(act.timestamp);
                    if (!isNaN(d.getTime())) {
                      formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                  }
                } catch {
                  formattedTime = '--:--';
                }
                return (
                  <div
                    key={act.id || index}
                    className="flex items-start gap-3 py-1.5 border-b border-slate-800/60 last:border-0 hover:bg-white/[0.02] px-2 rounded transition"
                  >
                    <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                      [{formattedTime}]
                    </span>
                    <span className={`font-mono text-xs shrink-0 font-bold ${act.color || 'text-cyan-400'}`}>
                      {act.tag || '[INFO]'}
                    </span>
                    <span className="font-caption text-xs text-slate-200 break-words flex-1">
                      {act.message || ''}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs gap-2 py-4">
                <Icon name="radar" size={24} className="animate-spin text-slate-600" />
                <span>Sincronizando comunicaciones de la ciudad...</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
