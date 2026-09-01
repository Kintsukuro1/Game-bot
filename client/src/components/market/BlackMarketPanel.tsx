import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface BlackMarketPanelProps {
  sessionJwt: string | null;
  onBuySuccess?: (data?: any) => void;
}

export interface WeaponItem {
  id: string;
  name: string;
  description: string;
  type: string;
  slot: string | null;
  weaponType: string | null;
  damage: number;
  accuracy: number;
  stealth: number;
  price: number;
  maxStock?: number;
  stockRemaining?: number;
}

interface ToastNotification {
  id: number;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const BlackMarketPanel: React.FC<BlackMarketPanelProps> = ({ sessionJwt, onBuySuccess }) => {
  const [weapons, setWeapons] = useState<WeaponItem[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('PRICE_ASC');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const fetchCatalog = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/market/blackmarket', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.weapons) {
        setWeapons(res.data.weapons);
      }
      if (res.data?.event) {
        setActiveEvent(res.data.event);
      }
    } catch (err) {
      console.error('❌ Error al cargar el catálogo del Mercado Negro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [sessionJwt]);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleBuy = async (targetId: string, itemName: string) => {
    setBuyingId(targetId);

    try {
      const res = await api.post(
        '/market/buy',
        { itemId: targetId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const rawMsg = res.data?.msg || `⚔️ ¡Has adquirido ${itemName} con éxito! Guardado en tu Armería.`;
      
      setToast({
        id: Date.now(),
        type: 'success',
        title: '¡Compra Confirmada!',
        message: rawMsg.replace(/\*\*|\*/g, ''),
      });

      if (onBuySuccess) {
        onBuySuccess(res.data);
      }
      fetchCatalog();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || `❌ Error al intentar adquirir ${itemName}.`;
      setToast({
        id: Date.now(),
        type: 'error',
        title: 'Transacción Fallida',
        message: errorMsg.replace(/\*\*|\*/g, ''),
      });
    } finally {
      setBuyingId(null);
    }
  };

  const filteredWeapons = weapons
    .filter((w) => {
      // Category filter
      if (filterCategory === 'PRIMARY') return w.slot === 'PRIMARY';
      if (filterCategory === 'SECONDARY') return w.slot === 'SECONDARY';
      if (filterCategory === 'MELEE') return w.slot === 'MELEE';
      if (filterCategory === 'SPECIAL') return w.type === 'CONSUMABLE' || w.type === 'SPECIAL';
      return true;
    })
    .filter((w) => {
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return w.name.toLowerCase().includes(q) || (w.weaponType && w.weaponType.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortOption === 'PRICE_ASC') return a.price - b.price;
      if (sortOption === 'PRICE_DESC') return b.price - a.price;
      if (sortOption === 'DAMAGE_DESC') return b.damage - a.damage;
      if (sortOption === 'ACCURACY_DESC') return b.accuracy - a.accuracy;
      return 0;
    });

  return (
    <div className="flex flex-col w-full h-full relative space-y-8 font-sans">
      {/* Inline style for progress bar animation */}
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Floating Fixed Toast Notification Card Component */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full mx-4 sm:mx-0 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl border shadow-[0_10px_35px_rgba(0,0,0,0.85)] ${
              toast.type === 'success'
                ? 'bg-[#131826]/95 border-emerald-500/50 shadow-emerald-500/20'
                : 'bg-[#131826]/95 border-rose-500/50 shadow-rose-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <Icon name={toast.type === 'success' ? 'check_circle' : 'warning'} size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      toast.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {toast.type === 'success' ? 'Armería // Mercado Negro' : 'Alerta // Transacción'}
                  </span>
                  <button
                    onClick={() => setToast(null)}
                    className="text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>

                <h4 className="font-headline-lg text-sm font-bold text-slate-100 uppercase mt-1.5">
                  {toast.title}
                </h4>
                <p className="font-mono text-xs text-slate-300 mt-1 leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>
            </div>

            {/* Auto-dismiss shrinking progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
              <div
                className={`h-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{
                  animation: 'toastProgress 5s linear forwards',
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="flex flex-col gap-4 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-3">
              <Icon name="storefront" size={36} className="text-cyan-400" />
              <span>Mercado Negro de Armamento</span>
            </h1>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest mt-1 opacity-80 border-b border-white/5 pb-1 inline-block">
              // Conexión Encriptada Subterránea • Catálogo Militar Clandestino
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-[#191f31]/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-inner">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'PRIMARY', label: 'Principales' },
              { id: 'SECONDARY', label: 'Secundarias' },
              { id: 'MELEE', label: 'Cuerpo a Cuerpo' },
              { id: 'SPECIAL', label: 'Contrabando' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Urban Clue & Active Event Banner */}
        {activeEvent && (
          <div className="bg-[#131826]/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Icon name="visibility" size={22} />
              </div>
              <p className="font-mono text-xs text-slate-200 leading-relaxed">
                {activeEvent.clueMessage}
              </p>
            </div>
            <span className="font-mono text-[10px] bg-cyan-950 text-cyan-400 px-3 py-1 rounded border border-cyan-500/40 uppercase font-bold shrink-0">
              Vendedor Activo: {activeEvent.npcName}
            </span>
          </div>
        )}
      </section>

      {/* Special Contraband Section (Adrenalina & Suero) */}
      {(filterCategory === 'ALL' || filterCategory === 'SPECIAL') && (
        <section className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-2">
            <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
            <h2 className="font-headline-lg text-base font-bold text-slate-100 uppercase tracking-tight">
              Sustancias y Mejoras de Contrabando Especial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Adrenalina */}
            <div className="bg-[#191f31]/40 backdrop-blur-md border border-amber-500/20 rounded-xl p-5 shadow-xl flex flex-col justify-between group hover:border-amber-500/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                    <Icon name="bolt" size={32} />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
                      Experimento Biológico
                    </span>
                    <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase mt-1">
                      Inyección de Adrenalina Pura 💉
                    </h3>
                  </div>
                </div>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  $100,000
                </span>
              </div>

              <p className="font-caption text-xs text-slate-300 mb-4 leading-relaxed">
                Aumenta permanentemente tu **Energía Máxima (+5⚡)** por cada dosis consumida (Cap: 5/5 usos).
              </p>

              <button
                disabled={buyingId === 'ADRENALINA'}
                onClick={() => handleBuy('ADRENALINA', 'Inyección de Adrenalina Pura')}
                className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/40 text-amber-300 font-mono text-xs uppercase font-bold tracking-wider py-2.5 rounded-lg border border-amber-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {buyingId === 'ADRENALINA' ? 'Adquiriendo...' : 'Comprar Adrenalina Pura ($100,000)'}
              </button>
            </div>

            {/* Suero Muscular */}
            <div className="bg-[#191f31]/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                    <Icon name="science" size={32} />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">
                      Mejora Genética
                    </span>
                    <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase mt-1">
                      Suero Muscular Experimental 🧪
                    </h3>
                  </div>
                </div>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  $75,000
                </span>
              </div>

              <p className="font-caption text-xs text-slate-300 mb-4 leading-relaxed">
                Incrementa permanentemente tu **Fuerza (+1.0 STRENGTH)** sin necesidad de entrenar (Cap: 3/3 usos).
              </p>

              <button
                disabled={buyingId === 'SUERO'}
                onClick={() => handleBuy('SUERO', 'Suero Muscular Experimental')}
                className="w-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/40 hover:to-cyan-600/40 text-cyan-300 font-mono text-xs uppercase font-bold tracking-wider py-2.5 rounded-lg border border-cyan-500/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {buyingId === 'SUERO' ? 'Adquiriendo...' : 'Comprar Suero Muscular ($75,000)'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Weapons Catalog Section */}
      <section className="relative z-10 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></span>
            <h2 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">
              Catálogo de Armamento Balístico ({filteredWeapons.length} Armas)
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Buscar por nombre (AK-47, Katana, etc)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 pl-9 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 transition"
              />
              <Icon name="search" size={14} className="absolute left-3 top-2.5 text-slate-500" />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 uppercase">Ordenar:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 font-mono text-xs uppercase rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="PRICE_ASC">Precio: Menor a Mayor</option>
                <option value="PRICE_DESC">Precio: Mayor a Menor</option>
                <option value="DAMAGE_DESC">Daño: Mayor a Menor</option>
                <option value="ACCURACY_DESC">Precisión: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="w-full py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
            ⏳ Cargando catálogo de armamentos del Mercado Negro...
          </div>
        ) : filteredWeapons.length === 0 ? (
          <div className="w-full py-16 text-center font-mono text-sm text-slate-500 bg-[#191f31]/20 rounded-xl border border-white/5">
            Sin armas encontradas para el filtro o búsqueda actual.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWeapons.map((w) => {
              const isBuyingThis = buyingId === w.id;
              const slotLabel = w.slot === 'PRIMARY' ? 'Principal' : w.slot === 'SECONDARY' ? 'Secundaria' : 'Melee';
              const slotColor = w.slot === 'PRIMARY' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : w.slot === 'SECONDARY' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

              return (
                <div
                  key={w.id}
                  className="bg-[#191f31]/40 backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-lg hover:-translate-y-1 transition-all group relative flex flex-col justify-between hover:border-cyan-500/30"
                >
                  <div>
                    {/* Header Slot & Category Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest font-bold rounded border ${slotColor}`}>
                        {slotLabel} • {w.weaponType || 'Balístico'}
                      </span>
                      <span className="font-mono text-sm font-extrabold text-emerald-400 drop-shadow">
                        ${w.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Stock Pill Indicator */}
                    <div className="flex items-center justify-between mb-2">
                      {w.stockRemaining !== undefined ? (
                        w.stockRemaining > 0 ? (
                          <span className="px-2 py-0.5 font-mono text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded flex items-center gap-1">
                            <span>📦 Stock Cargamento:</span>
                            <span className="text-slate-100">{w.stockRemaining}/{w.maxStock} u.</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 font-mono text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded">
                            🚫 CARGAMENTO AGOTADO
                          </span>
                        )
                      ) : null}
                    </div>

                    {/* Weapon Title */}
                    <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase tracking-tight line-clamp-1 mb-1">
                      {w.name}
                    </h3>
                    <p className="font-caption text-[11px] text-slate-400 line-clamp-2 h-8 leading-relaxed mb-4">
                      {w.description}
                    </p>

                    {/* Weapon Attributes Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 mb-4">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[9px] text-slate-500 uppercase">Daño</span>
                        <span className="font-mono text-xs font-bold text-rose-400">💥 {w.damage}</span>
                      </div>
                      <div className="flex flex-col items-center border-x border-white/5">
                        <span className="font-mono text-[9px] text-slate-500 uppercase">Precisión</span>
                        <span className="font-mono text-xs font-bold text-cyan-400">🎯 {w.accuracy}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[9px] text-slate-500 uppercase">Sigilo</span>
                        <span className="font-mono text-xs font-bold text-emerald-400">🥷 {w.stealth}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isBuyingThis || (w.stockRemaining !== undefined && w.stockRemaining <= 0)}
                    onClick={() => handleBuy(w.id, w.name)}
                    className="w-full bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border border-white/10 hover:border-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="shopping_cart" size={14} />
                    <span>
                      {isBuyingThis
                        ? 'Comprando...'
                        : w.stockRemaining !== undefined && w.stockRemaining <= 0
                        ? 'Agotado en Embarque'
                        : `Comprar ($${w.price.toLocaleString()})`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
