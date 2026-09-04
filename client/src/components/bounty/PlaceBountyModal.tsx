import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';

interface TargetPlayer {
  id: string;
  username: string;
  level: number;
  profession?: string;
}

interface PlaceBountyModalProps {
  sessionJwt: string | null;
  userCash?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [5000, 10000, 25000, 100000, 250000];

export const PlaceBountyModal: React.FC<PlaceBountyModalProps> = ({
  sessionJwt,
  userCash = 0,
  onClose,
  onSuccess,
}) => {
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<TargetPlayer | null>(null);
  const [searchResults, setSearchResults] = useState<TargetPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [rewardAmount, setRewardAmount] = useState<number>(10000);
  const [reason, setReason] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search for players
  useEffect(() => {
    if (!targetUsername.trim() || selectedTarget?.username === targetUsername) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/bounty/search-targets?q=${encodeURIComponent(targetUsername)}`, {
          headers: {
            Authorization: `Bearer ${sessionJwt}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.targets || []);
        }
      } catch (err) {
        console.error('Error buscando objetivos:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [targetUsername, sessionJwt, selectedTarget]);

  // Fee calculation: 10% normal, 20% anonymous
  const feePercent = isAnonymous ? 20 : 10;
  const feeAmount = Math.floor((rewardAmount * feePercent) / 100);
  const totalCost = rewardAmount + feeAmount;
  const canAfford = userCash >= totalCost;

  const handleSelectTarget = (target: TargetPlayer) => {
    setSelectedTarget(target);
    setTargetUsername(target.username);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetUsername.trim()) {
      setError('Debes especificar un objetivo.');
      return;
    }

    if (rewardAmount < 1000) {
      setError('La recompensa mínima es de $1,000.');
      return;
    }

    if (!canAfford) {
      setError(`No tienes suficiente efectivo ($${totalCost.toLocaleString()} requeridos).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bounty/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({
          targetPlayerId: selectedTarget?.id,
          targetUsername: targetUsername.trim(),
          rewardCash: rewardAmount,
          reason: reason.trim() || undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al publicar recompensa.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al publicar recompensa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#121726] border border-rose-500/30 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden font-sans">
        {/* Glow Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Icon name="crosshair" size={24} />
            </div>
            <div>
              <h2 className="font-headline-lg text-xl font-bold text-slate-100 uppercase tracking-tight">
                Publicar Contrato
              </h2>
              <p className="font-caption text-xs text-slate-400">Pon precio a la cabeza de tus enemigos.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 hover:border-rose-500/50 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
              <Icon name="crisis_alert" size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Selection */}
          <div className="space-y-1.5 relative">
            <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold flex justify-between">
              <span>Objetivo de Caza</span>
              {selectedTarget && (
                <span className="text-cyan-400 lowercase font-normal">Nivel {selectedTarget.level} seleccionado</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => {
                  setTargetUsername(e.target.value);
                  setSelectedTarget(null);
                }}
                placeholder="Escribe el nombre del jugador..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500/60 transition-all placeholder:text-slate-600"
                required
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 animate-spin">
                  <Icon name="loader" size={18} />
                </div>
              )}
            </div>

            {/* Target Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-900 border border-rose-500/30 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTarget(t)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-rose-500/10 hover:text-rose-300 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <span className="font-headline-lg text-sm font-bold text-slate-200">{t.username}</span>
                    <span className="font-mono text-xs text-cyan-400">NVL {t.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reward Amount Input */}
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold flex justify-between">
              <span>Monto de la Recompensa ($)</span>
              <span className="text-slate-400">Min. $1,000</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-rose-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min={1000}
                step={500}
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-slate-100 font-mono text-lg font-bold focus:outline-none focus:border-rose-500/60 transition-all"
                required
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRewardAmount(amt)}
                  className={`px-3 py-1 rounded-lg font-mono text-xs transition-all border ${
                    rewardAmount === amt
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border-white/5 hover:border-slate-600'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Field */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
              Motivo del Contrato (Opcional)
            </label>
            <input
              type="text"
              maxLength={120}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Robo de cargamento, venganza personal..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-caption text-xs focus:outline-none focus:border-rose-500/60 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Anonymous Toggle Option */}
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isAnonymous
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isAnonymous ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                <Icon name={isAnonymous ? 'lock' : 'visibility'} size={18} />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
                  Publicar de forma Anónima
                </h4>
                <p className="font-caption text-[11px] opacity-80">
                  Oculta tu nombre en la terminal (+10% extra de tarifa).
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isAnonymous ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900'}`}>
              {isAnonymous && <Icon name="check" size={14} />}
            </div>
          </div>

          {/* Fee & Cost Summary Breakdown */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Recompensa Limpia:</span>
              <span className="text-slate-200 font-bold">${rewardAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tarifa del Sindicato ({feePercent}%):</span>
              <span className="text-amber-400">+${feeAmount.toLocaleString()}</span>
            </div>
            <div className="h-[1px] bg-white/5 my-1"></div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-300">Costo Total Requerido:</span>
              <span className={canAfford ? 'text-rose-400' : 'text-red-500'}>
                ${totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canAfford}
              className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                canAfford && !isSubmitting
                  ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" size={16} className="animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Icon name="crosshair" size={16} />
                  <span>Publicar Bounty</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
