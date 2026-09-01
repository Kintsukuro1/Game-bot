import React, { useState } from 'react';
import { Icon } from '../common/Icon';

export interface InventoryItemData {
  id: string;
  quantity: number;
  isEquipped: boolean;
  slot?: string | null;
  item: {
    id: string;
    name: string;
    description: string;
    type: string;
    slot?: string | null;
    damage?: number;
    defense?: number;
    price?: number;
  };
}

interface InventoryGridProps {
  items?: InventoryItemData[];
  inventory?: InventoryItemData[];
  sessionJwt?: string | null;
  onUseItem?: (itemId: string) => void;
  onEquipItem?: (itemId: string) => void;
  onActionSuccess?: () => void;
}

function getItemIcon(type: string, name: string): string {
  const n = name.toLowerCase();
  if (n.includes('katana') || n.includes('espada') || n.includes('cuchillo')) return 'sports_mma';
  if (n.includes('pistola') || n.includes('9mm') || n.includes('arma') || n.includes('rifle')) return 'crosshair';
  if (n.includes('stimpack') || n.includes('med') || type === 'MEDICAL') return 'medication';
  if (n.includes('trauma') || n.includes('kit') || n.includes('venda')) return 'healing';
  if (n.includes('granada') || n.includes('molotov') || n.includes('fuego')) return 'local_fire_department';
  if (type === 'ARMOR' || n.includes('chaleco') || n.includes('escudo')) return 'shield';
  return 'backpack';
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items = [],
  inventory,
  onUseItem,
  onEquipItem,
}) => {
  const actualItems = inventory ?? items;
  const [selectedItem, setSelectedItem] = useState<InventoryItemData | null>(actualItems[0] || null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredItems = actualItems.filter((inv) => {
    if (filterType === 'ALL') return true;
    return inv.item.type === filterType;
  });

  const totalEmptySlots = Math.max(0, 32 - filteredItems.length);

  return (
    <div className="flex flex-col w-full h-full relative space-y-6 font-sans">
      {/* Header & Category Filters Bar */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-cyan-400 uppercase tracking-tighter drop-shadow-md flex items-center gap-3">
            <Icon name="backpack" size={36} className="text-cyan-400" />
            <span>Armería e Inventario</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
              Almacenamiento Táctico // Enlace V.9.2
            </span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-[#191f31]/60 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-inner">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'WEAPON', label: 'Armas' },
            { id: 'MEDICAL', label: 'Médico' },
            { id: 'CONSUMABLE', label: 'Consumibles' },
            { id: 'MISC', label: 'Misc' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                filterType === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid + Inspector Container */}
      <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[520px]">
        {/* LEFT COLUMN: ITEM GRID (70%) */}
        <div className="w-full lg:w-[68%] flex flex-col relative">
          <div className="absolute -top-4 -left-4 font-mono text-slate-700/20 text-[90px] leading-none [writing-mode:vertical-rl] opacity-10 pointer-events-none select-none">
            GRID_0X09A
          </div>

          <div className="flex-1 bg-[#151b2d]/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar shadow-2xl relative min-h-[460px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredItems.map((inv) => {
                const isSelected = selectedItem?.id === inv.id;
                const iconName = getItemIcon(inv.item.type, inv.item.name);

                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedItem(inv)}
                    className={`group relative aspect-square backdrop-blur-md rounded-lg transition-all flex flex-col items-center justify-center p-2 shadow-inner overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105'
                        : inv.isEquipped
                        ? 'bg-slate-900/80 border border-amber-500/60 hover:border-amber-400'
                        : 'bg-slate-900/60 border border-white/10 hover:border-slate-500 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {inv.isEquipped && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-mono font-bold px-1 rounded-sm uppercase tracking-tighter shadow-sm">
                        Eq
                      </span>
                    )}

                    <Icon
                      name={iconName}
                      size={28}
                      className={`group-hover:scale-110 duration-300 drop-shadow-md ${
                        isSelected
                          ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                          : inv.item.type === 'WEAPON'
                          ? 'text-amber-400'
                          : inv.item.type === 'MEDICAL'
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    />

                    <span className="font-mono text-[10px] text-slate-300 mt-2 truncate w-full text-center uppercase tracking-wider font-medium">
                      {inv.item.name}
                    </span>

                    <span className="absolute bottom-1 right-1 font-mono text-[10px] font-bold text-amber-400">
                      x{inv.quantity}
                    </span>
                  </button>
                );
              })}

              {/* Decorative Empty Slots */}
              {Array.from({ length: filteredItems.length === 0 ? 32 : totalEmptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square bg-slate-950/30 border border-white/5 rounded-lg flex items-center justify-center shadow-inner opacity-40 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:6px_6px]"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR DRAWER (32%) */}
        <div className="w-full lg:w-[32%] relative">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-xl h-full shadow-2xl flex flex-col justify-between overflow-hidden relative group p-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="pb-3 border-b border-white/5 flex justify-between items-center relative z-10">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-widest font-bold">
                Inspección_01
              </span>
              <Icon name="qr_code_scanner" size={16} className="text-slate-400" />
            </div>

            {selectedItem ? (
              <div className="flex-1 overflow-y-auto py-4 flex flex-col relative z-10 space-y-4">
                {/* Large Preview Box */}
                <div className="flex justify-center relative my-2">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full scale-125 animate-pulse"></div>
                  <div className="w-28 h-28 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden group">
                    <Icon
                      name={getItemIcon(selectedItem.item.type, selectedItem.item.name)}
                      size={48}
                      className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Title & Badge */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">
                      {selectedItem.item.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      {selectedItem.item.type}
                    </span>
                  </div>
                  <p className="font-caption text-xs text-slate-400 leading-relaxed">
                    {selectedItem.item.description || 'Objeto militar táctico registrado en la armería de Sinford.'}
                  </p>
                </div>

                {/* Stats Breakdown */}
                <div className="space-y-2 font-mono text-xs">
                  {selectedItem.item.damage ? (
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded border border-white/5">
                      <span className="text-slate-400 uppercase">Daño</span>
                      <span className="text-rose-400 font-bold">+{selectedItem.item.damage}</span>
                    </div>
                  ) : null}

                  {selectedItem.item.defense ? (
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded border border-white/5">
                      <span className="text-slate-400 uppercase">Defensa</span>
                      <span className="text-cyan-400 font-bold">+{selectedItem.item.defense}</span>
                    </div>
                  ) : null}

                  {selectedItem.item.slot ? (
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded border border-white/5">
                      <span className="text-slate-400 uppercase">Ranura</span>
                      <span className="text-amber-400 font-bold">{selectedItem.item.slot}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded border border-white/5">
                    <span className="text-slate-400 uppercase">Cantidad</span>
                    <span className="text-slate-200 font-bold">x{selectedItem.quantity}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  {selectedItem.item.type === 'WEAPON' && onEquipItem && (
                    <button
                      onClick={() => onEquipItem(selectedItem.item.id)}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Icon name="swap_horiz" size={16} />
                      <span>{selectedItem.isEquipped ? 'Desequipar Arma' : 'Equipar Arma'}</span>
                    </button>
                  )}

                  {selectedItem.item.type === 'MEDICAL' && onUseItem && (
                    <button
                      onClick={() => onUseItem(selectedItem.item.id)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider rounded shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 font-bold"
                    >
                      <Icon name="healing" size={16} />
                      <span>Usar Ítem Médico</span>
                    </button>
                  )}

                  <button className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-rose-400 font-mono text-xs uppercase tracking-wider rounded border border-rose-500/20 hover:border-rose-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold">
                    <Icon name="delete" size={16} />
                    <span>Descartar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500 text-xs font-mono">
                <Icon name="touch_app" size={32} className="text-slate-600 mb-2" />
                <span>Selecciona un objeto para abrir la inspección de atributos.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
