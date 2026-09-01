import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface BankPanelProps {
  sessionJwt: string | null;
  onActionSuccess?: () => void;
}

export const BankPanel: React.FC<BankPanelProps> = ({ sessionJwt, onActionSuccess }) => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('5000');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBankData = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/bank/info', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.investments) setInvestments(res.data.investments);
    } catch (err) {
      console.error('❌ Error al cargar información bancaria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, [sessionJwt]);

  const handleInvest = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 1000) {
      setMessage('⚠️ La inversión mínima es de $1,000 en efectivo.');
      return;
    }

    setMessage(null);
    try {
      await api.post(
        '/bank/invest',
        { amount: numAmount, durationDays },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(`🏦 ¡Inversión registrada con éxito por $${numAmount.toLocaleString()} a ${durationDays} días!`);
      if (onActionSuccess) onActionSuccess();
      fetchBankData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al procesar la inversión bancaria.');
    }
  };

  const handleClaim = async (investmentId: string) => {
    setMessage(null);
    try {
      await api.post(
        '/bank/claim',
        { investmentId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(`💵 ¡Inversión madurada cobrada con éxito! Payout abonado a tu cuenta.`);
      if (onActionSuccess) onActionSuccess();
      fetchBankData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || '❌ Error al cobrar la inversión.');
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="account_balance" size={36} className="text-emerald-400" />
            <span>Banco Central de Sinford & Bóveda</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Invierte tus fondos a plazo fijo y genera interés garantizado para tu imperio.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md ${
          message.includes('éxito') || message.includes('cobrada')
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* Investment Form & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#191f31]/60 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col gap-4">
          <h2 className="font-headline-lg text-lg text-slate-100 font-bold uppercase tracking-tight flex items-center gap-2">
            <Icon name="savings" size={20} className="text-emerald-400" />
            <span>Nueva Inversión a Plazo</span>
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-slate-400 uppercase">Monto a Invertir ($):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg p-2.5 font-mono text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="1000"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-slate-400 uppercase">Duración del Plazo:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 7, label: '7 Días', rate: '1.5%' },
                { days: 14, label: '14 Días', rate: '3.5%' },
                { days: 28, label: '28 Días', rate: '6.0%' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setDurationDays(opt.days)}
                  className={`p-2 rounded-lg font-mono text-xs font-bold border flex flex-col items-center transition cursor-pointer ${
                    durationDays === opt.days
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-emerald-400">{opt.rate} Interest</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInvest}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg transition-all shadow-md cursor-pointer"
          >
            Confirmar Depósito a Plazo
          </button>
        </div>

        {/* Active Investments */}
        <div className="lg:col-span-2 bg-[#191f31]/60 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col gap-4">
          <h2 className="font-headline-lg text-lg text-slate-100 font-bold uppercase tracking-tight flex items-center gap-2">
            <Icon name="history" size={20} className="text-cyan-400" />
            <span>Tus Inversiones Bancarias ({investments.length})</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center font-mono text-xs text-slate-400">
              ⏳ Cargando historial bancario...
            </div>
          ) : investments.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-slate-500">
              No tienes inversiones activas actualmente en la bóveda.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {investments.map((inv) => {
                const isMatures = new Date(inv.maturesAt) <= new Date();
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/80 rounded-lg border border-white/5 gap-3"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-100">
                          Depósito: ${Number(inv.amount).toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          ➔ Retorno: ${Number(inv.payout).toLocaleString()}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Vence: {new Date(inv.maturesAt).toLocaleDateString()} • Interés: {(inv.interestRate * 100).toFixed(1)}%
                      </span>
                    </div>

                    {inv.isClaimed ? (
                      <span className="px-3 py-1 bg-slate-800 text-slate-400 font-mono text-xs rounded uppercase font-bold">
                        Cobrado
                      </span>
                    ) : (
                      <button
                        disabled={!isMatures}
                        onClick={() => handleClaim(inv.id)}
                        className={`px-4 py-2 rounded font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                          isMatures
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMatures ? 'Cobrar Intereses' : 'En Curso'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
