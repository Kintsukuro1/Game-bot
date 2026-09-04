import { useEffect, useState } from 'react';
import { api } from './lib/api';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useSocket } from './hooks/useSocket';
import { AnatomicalBody } from './components/health/AnatomicalBody';
import { CityHub } from './components/hub/CityHub';
import type { ActivityFeedItem } from './types/activity';
import { useToast } from './context/ToastContext';
import { GymPanel } from './components/gym/GymPanel';
import { InventoryGrid } from './components/inventory/InventoryGrid';
import { CrimesPanel } from './components/crimes/CrimesPanel';
import { BlackMarketPanel } from './components/market/BlackMarketPanel';
import { FactionPanel } from './components/faction/FactionPanel';
import { BountyTerminal } from './components/bounty/BountyTerminal';
import { CasinoPanel } from './components/casino/CasinoPanel';
import { ShopPanel } from './components/shop/ShopPanel';
import { BankPanel } from './components/bank/BankPanel';
import { JailPanel } from './components/jail/JailPanel';
import { BossPanel } from './components/boss/BossPanel';
import { EducationPanel } from './components/education/EducationPanel';
import { PropertyPanel } from './components/property/PropertyPanel';
import { ProfessionPanel } from './components/profession/ProfessionPanel';
import { MissionPanel } from './components/missions/MissionPanel';
import { TravelPanel } from './components/travel/TravelPanel';
import { RacingPanel } from './components/racing/RacingPanel';
import { MasteryPanel } from './components/mastery/MasteryPanel';
import { CompanyPanel } from './components/company/CompanyPanel';
import { DuelPanel } from './components/duels/DuelPanel';
import { AdminPanel } from './components/admin/AdminPanel';
import { CurtainsTransition } from './components/common/CurtainsTransition';
import { MultiStepLoader } from './components/ui/multi-step-loader';
import { MultiStepLoaderDemo } from './components/ui/MultiStepLoaderDemo';
import { Icon } from './components/common/Icon';
import { useEnergyRegen } from './hooks/useEnergyRegen';
import { useLanguage } from './context/LanguageContext';

const appLoadingStates = [
  { text: "Conectando SDK con Discord Client..." },
  { text: "Solicitando autorización de usuario..." },
  { text: "Autenticando con el servidor..." },
  { text: "Finalizando handshake..." },
  { text: "Sincronizando perfil del jugador..." },
];

const getStepIndex = (debugStep: string) => {
  if (!debugStep || debugStep.includes('Paso 1') || debugStep.includes('Iniciando')) return 0;
  if (debugStep.includes('Paso 2')) return 1;
  if (debugStep.includes('Paso 3')) return 2;
  if (debugStep.includes('Paso 4')) return 3;
  return 4;
};

export const MODULE_REQUIRED_LEVELS: Record<string, number> = {
  hub: 1,
  profile: 1,
  gym: 1,
  crimes: 1,
  shop: 1,
  inventory: 1,
  education: 1,
  missions: 1,
  bounties: 3,
  boss: 3,
  jail: 3,
  duels: 3,
  market: 5,
  faction: 5,
  profession: 5,
  property: 5,
  jobs: 5,
  company: 5,
  travel: 8,
  racing: 8,
  bank: 10,
  stocks: 10,
  casino: 10,
  mastery: 10,
  admin: 1,
};

export function App() {
  const {
    user,
    sessionToken,
    instanceId,
    isAuthenticated,
    isLoading,
    debugStep = '',
    error,
    diagnostics,
  } = useDiscordSdk();
  const { t, language, setLanguage } = useLanguage();
  const { socket } = useSocket(sessionToken, instanceId);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('hub');
  const [playerData, setPlayerData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);

  const playerLevel = playerData?.level ?? 1;

  // Compute total HP from bodyParts (each limb is 0-100, 6 parts = 600 max)
  const bodyParts = playerData?.bodyParts;
  const currentHp = bodyParts
    ? (bodyParts.headHp ?? 0) + (bodyParts.torsoHp ?? 0) + (bodyParts.leftArmHp ?? 0) + (bodyParts.rightArmHp ?? 0) + (bodyParts.leftLegHp ?? 0) + (bodyParts.rightLegHp ?? 0)
    : 600;
  const maxHp = 600;

  const handleTabClick = (tabId: string) => {
    const reqLevel = MODULE_REQUIRED_LEVELS[tabId] || 1;
    if (playerLevel < reqLevel) {
      showToast({
        type: 'warning',
        title: '🔒 Módulo Bloqueado',
        message: `${t(tabId as any) || tabId} requiere **Nivel ${reqLevel}** (Tu nivel actual: Nivel ${playerLevel}).`,
      });
      return;
    }
    setActiveTab(tabId);
  };

  const renderNavItem = (tabId: string, iconName: string, colorClass: string, extraContent?: React.ReactNode) => {
    const reqLevel = MODULE_REQUIRED_LEVELS[tabId] || 1;
    const isLocked = playerLevel < reqLevel;
    const isActive = activeTab === tabId;

    return (
      <button
        key={tabId}
        onClick={() => handleTabClick(tabId)}
        className={`group flex items-center gap-3 py-2 px-2.5 rounded-lg transition-all text-left cursor-pointer ${
          isActive
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : isLocked
            ? 'text-slate-500 hover:bg-slate-900/50 opacity-75 hover:opacity-100 border border-slate-800/40'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <Icon
          name={isLocked ? 'lock' : iconName}
          size={18}
          className={isActive ? 'text-slate-950' : isLocked ? 'text-slate-500' : colorClass}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`font-bebas text-sm tracking-wider truncate ${isLocked ? 'text-slate-400' : ''}`}>
            {t(tabId as any) || tabId}
          </span>
        </div>
        {isLocked ? (
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-900 text-amber-400 border border-amber-500/20 shrink-0">
            🔒 NVL {reqLevel}
          </span>
        ) : (
          extraContent
        )}
      </button>
    );
  };

  const energyRegen = useEnergyRegen(
    playerData?.stats?.energy ?? 100,
    playerData?.stats?.maxEnergy ?? 100
  );

  const fetchProfile = async () => {
    if (!sessionToken) return;
    try {
      const res = await api.get('/player/profile', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setPlayerData(res.data?.player);
    } catch (err) {
      console.error('❌ Error fetching player profile:', err);
    }
  };

  const fetchInventory = async () => {
    if (!sessionToken) return;
    try {
      const res = await api.get('/inventory', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setInventoryData(res.data?.inventory || []);
    } catch (err) {
      console.error('❌ Error fetching inventory:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activity/recent');
      if (res.data?.activities) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      console.error('❌ Error fetching activities:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      fetchProfile();
      fetchInventory();
      fetchActivities();
    }
  }, [isAuthenticated, sessionToken]);

  useEffect(() => {
    if (!socket) return;
    const handleStatsUpdated = () => {
      fetchProfile();
    };
    const handleGlobalActivity = (activity: ActivityFeedItem) => {
      setActivities((prev) => [activity, ...prev].slice(0, 30));
    };

    socket.on('player_stats_updated', handleStatsUpdated);
    socket.on('global_activity', handleGlobalActivity);

    return () => {
      socket.off('player_stats_updated', handleStatsUpdated);
      socket.off('global_activity', handleGlobalActivity);
    };
  }, [socket]);

  if (isLoading) {
    return (
      <MultiStepLoader
        loading={true}
        loadingStates={appLoadingStates}
        value={getStepIndex(debugStep)}
      />
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-red-800 rounded-xl p-6 text-center shadow-2xl">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h2 className="text-lg font-bold text-red-400 mb-2">Error de Autenticación</h2>
          <p className="text-xs text-slate-300 mb-4">{error}</p>

          {/* Panel de diagnóstico — muestra info para debug sin necesitar DevTools */}
          {diagnostics && diagnostics.length > 0 && (
            <div className="mt-4 text-left bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Diagnóstico</p>
              {diagnostics.map((d, i) => (
                <p key={i} className="text-[10px] text-slate-400 font-mono leading-relaxed break-all">
                  {d}
                </p>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-500 mt-4">
            Cierra esta Activity y ábrela de nuevo desde Discord.
            No uses "Reintentar" porque Discord no re-envía el handshake tras un reload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] font-sans text-[#dce1fb] flex flex-col antialiased">
      {/* Manual Demo Multi-Step Loader on demand */}
      <MultiStepLoader
        loading={manualLoading}
        loadingStates={appLoadingStates}
        duration={1200}
        onComplete={() => setManualLoading(false)}
      />

      {/* Fixed Header with HUD Stats */}
      <header className="sticky top-0 w-full z-50 glass-panel border-b border-white/5 bg-[#090a0f]/90 backdrop-blur-md">
        <div className="py-2.5 px-4 sm:px-6 w-full flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Icon name="apartment" size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-lg text-base sm:text-lg font-bold tracking-tighter uppercase text-cyan-400 leading-none">
                  Sinford Underworld
                </span>
                <button
                  onClick={() => setManualLoading(true)}
                  title="Simular pantalla de carga Multi-Step Loader"
                  className="text-[10px] font-mono bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <Icon name="refresh" size={12} />
                  <span className="hidden sm:inline">Probar Loader</span>
                </button>
              </div>
              <span className="font-mono text-[9px] text-slate-400 tracking-widest opacity-70 mt-0.5">
                v1.0.4-BETA
              </span>
            </div>
          </div>

          {/* Player Stats Quick HUD (Center) */}
          {playerData && (
            <div className="flex items-center justify-center flex-1 min-w-[280px] max-w-2xl px-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {/* Health */}
                <div className="group relative flex flex-col gap-0.5 cursor-pointer">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase">
                      <Icon name="favorite" size={13} />
                      <span className="hidden sm:inline font-semibold">{t('health')}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      {currentHp}/{maxHp}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 relative overflow-hidden rounded-full border border-white/5">
                    <div
                      className="absolute inset-0 bg-emerald-500 meter-glow"
                      style={{
                        width: `${Math.min(100, (currentHp / maxHp) * 100)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Hover Tooltip Health */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 p-3 rounded-xl shadow-2xl z-50 min-w-[220px] pointer-events-none transition-all">
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-emerald-400 font-mono text-xs font-bold uppercase">
                      <Icon name="favorite" size={14} />
                      <span>{t('health_info_title')}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 opacity-90 leading-relaxed">
                      {t('health_info_desc')}
                    </p>
                  </div>
                </div>

                {/* Energy */}
                <div className="group relative flex flex-col gap-0.5 cursor-pointer">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-amber-400 font-bold uppercase">
                      <Icon name="bolt" size={13} />
                      <span className="hidden sm:inline font-semibold">{t('energy')}</span>
                    </div>
                    <span className="text-amber-400 font-bold">
                      {playerData.stats?.energy ?? 100}/{playerData.stats?.maxEnergy ?? 100}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 relative overflow-hidden rounded-full border border-white/5">
                    <div
                      className="absolute inset-0 bg-amber-500 meter-glow"
                      style={{
                        width: `${Math.min(
                          100,
                          ((playerData.stats?.energy ?? 100) / (playerData.stats?.maxEnergy ?? 100)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>

                  {/* Hover Tooltip Countdown */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl shadow-2xl z-50 min-w-[220px] pointer-events-none transition-all">
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-amber-400 font-mono text-xs font-bold uppercase">
                      <Icon name="bolt" size={14} />
                      <span>{t('energy_regen')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                      <span>{t('next_tick')}:</span>
                      <span className="text-cyan-400 font-bold">{energyRegen.isFull ? t('full') : energyRegen.nextTickFormatted}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                      <span>{t('full_regen')}:</span>
                      <span className="text-emerald-400 font-bold">{energyRegen.fullRegenFormatted}</span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 opacity-80 border-t border-white/5 pt-1">
                      {t('energy_note')}
                    </p>
                  </div>
                </div>

                {/* Nerve */}
                <div className="group relative flex flex-col gap-0.5 cursor-pointer">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-cyan-400 font-bold uppercase">
                      <Icon name="psychology" size={13} />
                      <span className="hidden sm:inline font-semibold">{t('nerve')}</span>
                    </div>
                    <span className="text-cyan-400 font-bold">
                      {playerData.stats?.nerve ?? 10}/{playerData.stats?.maxNerve ?? 10}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 relative overflow-hidden rounded-full border border-white/5">
                    <div
                      className="absolute inset-0 bg-cyan-500 meter-glow"
                      style={{
                        width: `${Math.min(
                          100,
                          ((playerData.stats?.nerve ?? 10) / (playerData.stats?.maxNerve ?? 10)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>

                  {/* Hover Tooltip Nerve */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-xl shadow-2xl z-50 min-w-[220px] pointer-events-none transition-all">
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-cyan-400 font-mono text-xs font-bold uppercase">
                      <Icon name="psychology" size={14} />
                      <span>{t('nerve_info_title')}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 opacity-90 leading-relaxed">
                      {t('nerve_info_desc')}
                    </p>
                  </div>
                </div>

                {/* Heat */}
                <div className="group relative flex flex-col gap-0.5 cursor-pointer">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-rose-400 font-bold uppercase">
                      <Icon name="local_fire_department" size={13} />
                      <span className="hidden sm:inline font-semibold">{t('heat')}</span>
                    </div>
                    <span className="text-rose-400 font-bold">
                      {playerData.stats?.heat ?? playerData.heat ?? 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 relative overflow-hidden rounded-full border border-white/5">
                    <div
                      className="absolute inset-0 bg-rose-500 meter-glow"
                      style={{
                        width: `${Math.min(100, playerData.stats?.heat ?? playerData.heat ?? 0)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Hover Tooltip Heat */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md border border-rose-500/40 p-3 rounded-xl shadow-2xl z-50 min-w-[220px] pointer-events-none transition-all">
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-rose-400 font-mono text-xs font-bold uppercase">
                      <Icon name="local_fire_department" size={14} />
                      <span>{t('heat_info_title')}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 opacity-90 leading-relaxed">
                      {t('heat_info_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Wallet & User Info */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 bg-[#131826]/80 px-3 py-1.5 rounded-lg border border-white/10">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-white/10 font-mono text-[10px] mr-2">
                {(['es', 'en', 'pt', 'fr', 'de'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer transition ${
                      language === lang
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={t('select_language')}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {(() => {
                const level = playerData?.level || 1;
                const currentXp = playerData?.xp || 0;
                const prevLevelReq = level > 1 ? 100 * ((level - 1) ** 2) : 0;
                const nextLevelReq = 100 * (level ** 2);
                const xpInLevel = Math.max(0, currentXp - prevLevelReq);
                const xpNeededInLevel = Math.max(1, nextLevelReq - prevLevelReq);
                const xpPercent = Math.min(100, Math.max(0, (xpInLevel / xpNeededInLevel) * 100));
                return (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xs font-bold text-slate-100">
                      {user?.username || 'Cargando...'}
                    </span>
                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                      {t('level')} {level} • ${Number(playerData?.wallet?.cash ?? 0).toLocaleString()}
                    </span>
                    <div className="w-28 sm:w-36 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-white/10 relative" title={`Nivel ${level} Progreso: ${xpInLevel}/${xpNeededInLevel} XP (${xpPercent.toFixed(0)}%) | Total acumulado: ${currentXp} XP`}>
                      <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full transition-all" style={{ width: `${xpPercent}%` }}></div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-semibold mt-0.5">
                      ⭐ {xpInLevel.toLocaleString()} / {xpNeededInLevel.toLocaleString()} XP ({xpPercent.toFixed(0)}%)
                    </span>
                  </div>
                );
              })()}
              {user?.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                  alt={user.username}
                  className="w-8 h-8 rounded-lg border border-amber-500/50 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg border border-amber-500/50 bg-slate-900 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                  {(user?.username || 'P')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 pt-3 pb-12 w-full px-3 sm:px-6 max-w-[1920px] mx-auto">
        <div className="flex flex-col lg:flex-row w-full gap-4 min-h-[calc(100vh-140px)]">
          {/* Persistent Sticky Terminal Sidebar */}
          <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] self-start flex flex-col gap-4 bg-[#191f31]/60 backdrop-blur-md border border-white/10 rounded-xl p-3 overflow-y-auto custom-scrollbar relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] z-30">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20"></div>

            <div className="relative z-10 flex flex-col gap-5">
              {/* Category 1: Información */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_district')}
                </h3>
                {renderNavItem('hub', 'apartment', 'text-cyan-400')}
                {renderNavItem(
                  'profile',
                  'badge',
                  'text-cyan-400',
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      activeTab === 'profile' ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {playerData?.stats?.heat ?? playerData?.heat ?? 0}% {t('heat')}
                  </span>
                )}
              </div>

              {/* Category 2: Actividades */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_activities')}
                </h3>
                {renderNavItem('gym', 'fitness_center', 'text-amber-400')}
                {renderNavItem('crimes', 'explore', 'text-emerald-400')}
                {renderNavItem('bounties', 'crosshair', 'text-rose-400')}
                {renderNavItem(
                  'boss',
                  'coronavirus',
                  'text-rose-500',
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      activeTab === 'boss' ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {t('boss_badge')}
                  </span>
                )}
                {renderNavItem('jail', 'lock', 'text-rose-300')}
                {renderNavItem('travel', 'flight_takeoff', 'text-sky-400')}
                {renderNavItem('racing', 'speed', 'text-red-400')}
                {renderNavItem('duels', 'swords', 'text-rose-400')}
              </div>

              {/* Category 3: Economía & Comercio */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_commerce')}
                </h3>
                {renderNavItem('inventory', 'backpack', 'text-cyan-400')}
                {renderNavItem('market', 'storefront', 'text-amber-400')}
                {renderNavItem('bank', 'account_balance', 'text-emerald-400')}
                {renderNavItem('shop', 'shopping_bag', 'text-cyan-300')}
                {renderNavItem('company', 'domain', 'text-emerald-400')}
              </div>

              {/* Category 4: Educación & Estilo de Vida */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_career')}
                </h3>
                {renderNavItem('education', 'school', 'text-cyan-400')}
                {renderNavItem('property', 'home', 'text-emerald-400')}
                {renderNavItem('profession', 'work', 'text-purple-400')}
                {renderNavItem('mastery', 'psychology', 'text-purple-400')}
                {renderNavItem('missions', 'assignment', 'text-amber-400')}
              </div>

              {/* Category 5: Sindicato & Ocio */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_syndicate')}
                </h3>
                {renderNavItem('faction', 'shield_moon', 'text-purple-400')}
                {renderNavItem('casino', 'casino', 'text-cyan-400')}
              </div>

              {/* Category 6: Sistema */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 pb-1 font-bold">
                  {t('cat_system')}
                </h3>
                {renderNavItem('loader-demo', 'hourglass_top', 'text-slate-400')}
                {user?.id === '287396390747766795' && renderNavItem('admin', 'terminal', 'text-amber-400')}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full min-w-0">
            <CurtainsTransition
              tabKey={activeTab}
              tabTitle={
                {
                  hub: 'Central District',
                  profile: 'Operations Center',
                  gym: 'Sinford Iron Gym',
                  crimes: 'Criminal Backalleys',
                  market: 'Black Market',
                  faction: 'Syndicate HQ',
                  bounties: 'Bounty Terminal',
                  casino: 'Underground Casino',
                  inventory: 'Armory & Inventory',
                  'loader-demo': 'Multi-Step Loader Demo',
                }[activeTab] || 'Accediendo a Sector'
              }
              tabIcon={
                {
                  hub: 'apartment',
                  profile: 'badge',
                  gym: 'fitness_center',
                  crimes: 'explore',
                  market: 'storefront',
                  faction: 'shield_moon',
                  bounties: 'crosshair',
                  casino: 'casino',
                  inventory: 'backpack',
                  'loader-demo': 'hourglass_top',
                }[activeTab] || 'apartment'
              }
            >
              {activeTab === 'hub' && (
                <CityHub
                  onSelectTab={(tab) => handleTabClick(tab)}
                  playerLevel={playerLevel}
                  MODULE_REQUIRED_LEVELS={MODULE_REQUIRED_LEVELS}
                  activities={activities}
                />
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <AnatomicalBody
                    username={user?.username || playerData?.username}
                    bodyParts={playerData?.bodyParts}
                    hospitalUntil={playerData?.hospitalUntil}
                    jailUntil={playerData?.jailUntil}
                    sessionJwt={sessionToken}
                    onHealSuccess={() => fetchProfile()}
                  />
                </div>
              )}

              {activeTab === 'gym' && (
                <GymPanel
                  stats={playerData?.stats}
                  gymTier={playerData?.gymTier ?? 1}
                  gymExp={playerData?.gymExp ?? 0}
                  cash={Number(playerData?.wallet?.cash ?? 0)}
                  sessionJwt={sessionToken}
                  onTrainSuccess={(trainResult) => {
                    if (trainResult && trainResult.energyRemaining !== undefined) {
                      setPlayerData((prev: any) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          gymExp: trainResult.gymExp ?? prev.gymExp,
                          gymTier: trainResult.gymTier ?? prev.gymTier,
                          stats: {
                            ...prev.stats,
                            energy: trainResult.energyRemaining,
                            happy: trainResult.happyRemaining,
                            [trainResult.statName]: trainResult.newStatValue,
                          },
                        };
                      });
                    }
                    fetchProfile();
                  }}
                />
              )}

              {activeTab === 'crimes' && (
                <CrimesPanel
                  nerve={playerData?.stats?.nerve}
                  maxNerve={playerData?.stats?.maxNerve}
                  playerLevel={playerData?.level}
                  playerHeat={playerData?.stats?.heat ?? playerData?.heat ?? 0}
                  sessionJwt={sessionToken}
                  onCrimeSuccess={(crimeResult) => {
                    if (crimeResult && crimeResult.nerveRemaining !== undefined) {
                      setPlayerData((prev: any) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            nerve: crimeResult.nerveRemaining,
                          },
                        };
                      });
                    }
                    fetchProfile();
                  }}
                />
              )}

              {activeTab === 'bounties' && (
                <BountyTerminal
                  playerLevel={playerData?.level}
                  userCash={Number(playerData?.wallet?.cash ?? playerData?.cash ?? 0)}
                  sessionJwt={sessionToken}
                  onClaimSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'boss' && (
                <BossPanel
                  sessionJwt={sessionToken}
                  socket={socket}
                  onAttackSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'jail' && (
                <JailPanel
                  sessionJwt={sessionToken}
                  onActionSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'casino' && (
                <CasinoPanel
                  sessionJwt={sessionToken}
                  cash={Number(playerData?.wallet?.cash ?? 0)}
                  onBetSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryGrid
                  inventory={inventoryData}
                  sessionJwt={sessionToken}
                  onActionSuccess={() => {
                    fetchProfile();
                    fetchInventory();
                  }}
                />
              )}

              {activeTab === 'market' && (
                <BlackMarketPanel
                  sessionJwt={sessionToken}
                  onBuySuccess={(buyResult) => {
                    if (buyResult && buyResult.player) {
                      setPlayerData(buyResult.player);
                    }
                    fetchProfile();
                    fetchInventory();
                  }}
                />
              )}

              {activeTab === 'bank' && (
                <BankPanel
                  sessionJwt={sessionToken}
                  onActionSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'shop' && (
                <ShopPanel
                  sessionJwt={sessionToken}
                  onBuySuccess={() => {
                    fetchProfile();
                    fetchInventory();
                  }}
                />
              )}

              {activeTab === 'education' && (
                <EducationPanel
                  sessionJwt={sessionToken}
                  onEnrollSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'property' && (
                <PropertyPanel
                  sessionJwt={sessionToken}
                  onBuySuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'profession' && (
                <ProfessionPanel
                  sessionJwt={sessionToken}
                  playerLevel={playerData?.level}
                  currentProfession={playerData?.profession}
                  onChooseSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'missions' && (
                <MissionPanel
                  sessionJwt={sessionToken}
                  onClaimSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'faction' && (
                <FactionPanel
                  sessionJwt={sessionToken}
                  onActionSuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'casino' && (
                <CasinoPanel
                  cashBalance={Number(playerData?.wallet?.cash ?? playerData?.cash ?? 0)}
                  sessionJwt={sessionToken}
                  onPlaySuccess={() => fetchProfile()}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryGrid items={inventoryData} />
              )}

              {activeTab === 'loader-demo' && (
                <MultiStepLoaderDemo />
              )}

              {activeTab === 'travel' && (
                <TravelPanel
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}

              {activeTab === 'racing' && (
                <RacingPanel
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}

              {activeTab === 'mastery' && (
                <MasteryPanel
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}

              {activeTab === 'company' && (
                <CompanyPanel
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}

              {activeTab === 'duels' && (
                <DuelPanel
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPanel
                  userDiscordId={user?.id}
                  sessionToken={sessionToken}
                  onStatsUpdate={() => fetchProfile()}
                />
              )}
            </CurtainsTransition>
          </div>
        </div>
      </main>

      {/* Footer Ticker Marquee */}
      <footer className="fixed bottom-0 w-full z-50 glass-panel h-8 border-t border-white/5 flex items-center px-4 overflow-hidden bg-[#090a0f]/90">
        <div className="flex items-center gap-4 w-full">
          <span className="font-mono text-cyan-400 uppercase text-[10px] shrink-0 font-bold tracking-wider">
            Global Activity Feed:
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap relative">
            <div className="inline-block animate-marquee font-mono text-slate-400 text-[11px] uppercase tracking-wider">
              {Array.isArray(activities) && activities.length > 0 ? (
                activities.map((act, idx) => (
                  <span key={act?.id || idx} className={`mx-6 ${act?.color || 'text-slate-300'}`}>
                    <span className="opacity-70 font-bold">{act?.tag || '[INFO]'}</span> {act?.message || ''}
                  </span>
                ))
              ) : (
                <>
                  <span className="mx-8 text-cyan-400">[SISTEMA] RED SINFORD UNDERWORLD CONECTADA</span>
                  <span className="mx-8 text-amber-400">[ALERTA] PATRULLAJES POLICIALES ACTIVOS EN SECTOR CENTRAL</span>
                  <span className="mx-8 text-emerald-400">[MERCADO] OPERACIONES DE CONTRABANDO ACTIVAS</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

