import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface WinnerEntry {
  id: string;
  username: string;
  game: string;
  winAmount: string;
}

interface CasinoPanelProps {
  cashBalance?: number;
  cash?: number;
  sessionJwt: string | null;
  onPlaySuccess?: () => void;
  onBetSuccess?: () => void;
}

export const CasinoPanel: React.FC<CasinoPanelProps> = ({
  cashBalance = 0,
  cash,
  sessionJwt,
  onPlaySuccess,
  onBetSuccess,
}) => {
  const actualCash = cash ?? cashBalance;
  const [activeGame, setActiveGame] = useState<'NONE' | 'BLACKJACK' | 'SLOTS'>('NONE');
  const [betAmount, setBetAmount] = useState<number>(10000);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [recentWinners, setRecentWinners] = useState<WinnerEntry[]>([
    { id: '1', username: 'Ghost_Ryder', game: 'Blackjack', winAmount: '+$45,000' },
    { id: '2', username: 'Viper99', game: 'Ruleta', winAmount: '+$120,000' },
  ]);

  const handlePlaySlots = async () => {
    setIsPlaying(true);
    setGameResult(null);

    try {
      const response = await api.post(
        '/casino/slots',
        { betAmount },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const data = response.data;
      const gain = Number(data.netGain);

      if (data.isWin) {
        setGameResult(`🎉 ¡Felicidades! Rodillos: [${data.reels}]. Ganaste +$${gain.toLocaleString()}`);
        setRecentWinners((prev) => [
          { id: Date.now().toString(), username: 'TÚ', game: 'Tragamonedas', winAmount: `+$${gain.toLocaleString()}` },
          ...prev.slice(0, 4),
        ]);
      } else {
        setGameResult(`❌ Rodillos: [${data.reels}]. Perdiste $${betAmount.toLocaleString()}`);
      }

      if (onPlaySuccess) onPlaySuccess();
      if (onBetSuccess) onBetSuccess();
    } catch (err: any) {
      setGameResult(err.response?.data?.error || '❌ Error al jugar tragamonedas.');
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayBlackjack = async () => {
    setIsPlaying(true);
    setGameResult(null);

    try {
      const response = await api.post(
        '/casino/blackjack',
        { betAmount },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );

      const data = response.data;
      const gain = Number(data.netGain);

      if (data.isWin) {
        setGameResult(`🃏 ¡Ganaste el Blackjack! Tu mano: ${data.playerHand} | Casa: ${data.dealerHand}. Ganaste +$${gain.toLocaleString()}`);
        setRecentWinners((prev) => [
          { id: Date.now().toString(), username: 'TÚ', game: 'Blackjack', winAmount: `+$${gain.toLocaleString()}` },
          ...prev.slice(0, 4),
        ]);
      } else {
        setGameResult(`❌ Perdiste el duelo de 21. Tu mano: ${data.playerHand} | Casa: ${data.dealerHand}. Perdiste $${betAmount.toLocaleString()}`);
      }

      if (onPlaySuccess) onPlaySuccess();
      if (onBetSuccess) onBetSuccess();
    } catch (err: any) {
      setGameResult(err.response?.data?.error || '❌ Error al jugar Blackjack.');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative space-y-8 font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 p-6 bg-[#191f31]/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 relative z-10">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">
            Apuestas y Operaciones Clandestinas
          </span>
          <h1 className="font-headline-lg text-2xl sm:text-4xl font-extrabold text-cyan-400 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-3">
            <Icon name="casino" size={36} className="text-cyan-400" />
            <span>Casino Clandestino</span>
          </h1>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <span className="font-mono text-[10px] text-slate-400 uppercase mb-1">Efectivo Disponible</span>
          <div className="flex items-center gap-2">
            <Icon name="monetization_on" size={24} className="text-emerald-400" />
            <span className="font-mono text-2xl font-extrabold text-emerald-400 tracking-tight">
              ${actualCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Game Modal / Active Board */}
      {activeGame !== 'NONE' && (
        <div className="p-6 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl space-y-4 font-mono text-xs relative z-20">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-amber-400 uppercase">
              Mesa de {activeGame === 'BLACKJACK' ? 'Blackjack (21)' : 'Tragamonedas Cyber Slots'}
            </h3>
            <button
              onClick={() => {
                setActiveGame('NONE');
                setGameResult(null);
              }}
              className="text-slate-400 hover:text-slate-100 cursor-pointer font-bold"
            >
              ✖ Cerrar Mesa
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="text-slate-300">Apuesta ($):</label>
            <input
              type="number"
              min={1000}
              max={1000000}
              step={5000}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="bg-slate-950 border border-white/10 px-4 py-2 rounded-lg text-amber-400 font-bold text-sm outline-none w-48"
            />
            <div className="flex gap-2">
              {[5000, 25000, 100000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBetAmount(preset)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold cursor-pointer"
                >
                  ${(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isPlaying}
            onClick={activeGame === 'BLACKJACK' ? handlePlayBlackjack : handlePlaySlots}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            {isPlaying ? 'Apostando...' : `Confirmar Apuesta de $${betAmount.toLocaleString()}`}
          </button>

          {gameResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-white/10 font-bold text-sm text-center">
              {gameResult}
            </div>
          )}
        </div>
      )}

      {/* Main Games Grid + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 relative z-10">
        {/* Games Grid (Left Column) */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Game Card 1: Ruleta / Slots */}
          <div className="group bg-[#191f31]/40 rounded-xl overflow-hidden relative shadow-md transition-all hover:shadow-xl border border-white/5 hover:border-cyan-500/30 flex flex-col justify-between p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Icon name="casino" size={36} className="text-cyan-400" />
              <div>
                <h3 className="font-headline-lg text-xl font-bold text-slate-100 uppercase">Tragamonedas</h3>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Cyber Slots High Roller</span>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 uppercase">Min Bet</span>
                <span className="text-slate-100 font-bold">$1,000</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 uppercase">Max Bet</span>
                <span className="text-emerald-400 font-bold">$500,000</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveGame('SLOTS');
                setBetAmount(5000);
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-sm font-extrabold uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Jugar Tragamonedas</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>

          {/* Game Card 2: Blackjack */}
          <div className="group bg-[#191f31]/40 rounded-xl overflow-hidden relative shadow-md transition-all hover:shadow-xl border border-white/5 hover:border-cyan-500/30 flex flex-col justify-between p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Icon name="playing_cards" size={36} className="text-cyan-400" />
              <div>
                <h3 className="font-headline-lg text-xl font-bold text-slate-100 uppercase">Blackjack</h3>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Duelo de 21 contra la casa</span>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 uppercase">Min Bet</span>
                <span className="text-slate-100 font-bold">$5,000</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 uppercase">Max Bet</span>
                <span className="text-emerald-400 font-bold">$1,000,000</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveGame('BLACKJACK');
                setBetAmount(10000);
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-sm font-extrabold uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Jugar Blackjack</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar: Ganadores Recientes (Right Column) */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col">
          <div className="bg-[#191f31]/60 p-5 rounded-xl shadow-lg border border-white/5 flex-1 flex flex-col space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Icon name="sensors" size={20} className="text-emerald-400 animate-pulse" />
              <h2 className="font-headline-lg text-base font-bold text-slate-100 uppercase tracking-wider">
                Ganadores Recientes
              </h2>
            </div>

            <div className="flex flex-col gap-3 font-mono">
              {recentWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-100 font-bold uppercase">{winner.username}</span>
                    <span className="text-[10px] text-slate-400">{winner.game}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-extrabold">{winner.winAmount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
