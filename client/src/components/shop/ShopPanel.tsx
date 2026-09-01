import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface ShopPanelProps {
  sessionJwt: string | null;
  onBuySuccess?: () => void;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({ sessionJwt, onBuySuccess }) => {
  const [catIndex, setCatIndex] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);
  const [subFilter, setSubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchShopCatalog = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get(`/shop/catalog?catIndex=${catIndex}`, {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.items) setItems(res.data.items);
    } catch (err) {
      console.error('❌ Error al obtener catálogo de la tienda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopCatalog();
  }, [sessionJwt, catIndex]);

  const handleBuy = async (itemId: string, itemName: string, price: number) => {
    setMessage(null);
    setBuyingId(itemId);

    try {
      await api.post(
        '/shop/buy',
        { itemId, quantity: 1 },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      setMessage(`🛍️ ¡Compraste **${itemName}** por **$${price.toLocaleString()}**! Objeto añadido a tu inventario.`);
      if (onBuySuccess) onBuySuccess();
      fetchShopCatalog();
    } catch (err: any) {
      setMessage(err.response?.data?.error || `❌ Error al comprar ${itemName}.`);
    } finally {
      setBuyingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }

    // 2. Sub-Filter
    if (subFilter === 'ALL') return true;
    if (subFilter === 'MEDICAL') return item.type === 'MEDICAL' || item.weaponType === 'Medical';
    if (subFilter === 'DRUGS') return item.weaponType === 'Drug';
    if (subFilter === 'ENERGY') return item.weaponType === 'EnergyDrink';
    if (subFilter === 'ALCOHOL') return item.weaponType === 'Alcohol';
    if (subFilter === 'CANDY') return item.weaponType === 'Candy' || item.weaponType === 'Food';

    return true;
  });

  const getItemBadge = (item: any) => {
    const wt = item.weaponType;
    if (item.type === 'MEDICAL') return { label: '🏥 Médico', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (wt === 'Drug') return { label: '💊 Droga', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    if (wt === 'EnergyDrink') return { label: '⚡ Energética', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (wt === 'Alcohol') return { label: '🍺 Licor', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    if (wt === 'Candy' || wt === 'Food') return { label: '🍬 Comida/Dulce', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
    if (item.type === 'WEAPON') return { label: '⚔️ Balístico', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };

    return { label: `📦 ${item.type}`, color: 'bg-slate-800 text-slate-300 border-white/10' };
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="shopping_bag" size={36} className="text-cyan-400" />
            <span>Tienda General, Farmacia & Mercado</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Insumos médicos profesionales, botiquines, fármacos, bebidas energéticas, licores y contrabando.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <Icon name="search" size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o efecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-mono text-slate-100 placeholder-slate-500 outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200 text-xs font-bold">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#191f31]/60 p-2 rounded-xl border border-white/10">
        {[
          { idx: 0, name: 'Tienda de Conveniencia', emoji: '🛒' },
          { idx: 1, name: 'Farmacia & Insumos Médicos', emoji: '🏥' },
          { idx: 2, name: 'Drogas, Alcohol & Energéticas', emoji: '💊' },
          { idx: 3, name: 'Armería Balística', emoji: '⚔️' },
        ].map((cat) => (
          <button
            key={cat.idx}
            onClick={() => {
              setCatIndex(cat.idx);
              setSubFilter('ALL');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
              catIndex === cat.idx
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Sub-Filter Pills for Drugs, Alcohol, Medical */}
      {catIndex === 2 && (
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'DRUGS', label: '💊 Drogas de Combate' },
            { id: 'ENERGY', label: '⚡ Energéticas' },
            { id: 'ALCOHOL', label: '🍺 Licores & Alcohol' },
            { id: 'CANDY', label: '🍬 Dulces' },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSubFilter(sub.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition cursor-pointer border ${
                subFilter === sub.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md ${
          message.includes('Compraste')
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
          ⏳ Cargando productos del catálogo...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center font-mono text-sm text-slate-500 bg-[#191f31]/20 rounded-xl border border-white/5">
          Sin objetos disponibles para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isBuying = buyingId === item.id;
            const badge = getItemBadge(item);

            return (
              <div
                key={item.id}
                className="bg-[#191f31]/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border rounded font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="font-mono text-base font-extrabold text-emerald-400">
                      ${item.price.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase mb-1">
                    {item.name}
                  </h3>
                  <p className="font-caption text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <button
                  disabled={isBuying}
                  onClick={() => handleBuy(item.id, item.name, item.price)}
                  className="w-full bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border border-white/10 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isBuying ? 'Comprando...' : `Comprar ($${item.price.toLocaleString()})`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
