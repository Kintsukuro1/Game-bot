import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface Company {
  id: string;
  name: string;
  type: string;
  revenue: string;
}

interface CompanyType {
  type: string;
  name: string;
  price: number;
  dailyRevenue: number;
}

interface CompanyPanelProps {
  sessionToken: string | null;
  onStatsUpdate: () => void;
}

export function CompanyPanel({ sessionToken, onStatsUpdate }: CompanyPanelProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [types, setTypes] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCompanyInfo = async () => {
    if (!sessionToken) return;
    try {
      setLoading(true);
      const res = await api.get('/company/info', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setCompany(res.data?.company || null);
      setTypes(res.data?.companyTypes || []);
    } catch (err: any) {
      console.error('Error fetching company info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, [sessionToken]);

  const handleBuyCompany = async (type: string) => {
    if (!sessionToken) return;
    if (!newCompanyName.trim()) {
      setActionMsg({ type: 'error', text: 'Ingresa un nombre para tu empresa antes de adquirirla.' });
      return;
    }
    setActionMsg(null);
    try {
      const res = await api.post(
        '/company/buy',
        { type, name: newCompanyName.trim() },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setCompany(res.data?.company);
      setActionMsg({ type: 'success', text: `🏢 ¡Felicidades! Has fundado la empresa "${newCompanyName}".` });
      setNewCompanyName('');
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  const handleCollectRevenue = async () => {
    if (!sessionToken) return;
    setActionMsg(null);
    try {
      const res = await api.post(
        '/company/collect',
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setActionMsg({
        type: 'success',
        text: `💰 ¡Ganancias retiradas! Se han transferido $${BigInt(res.data?.revenueCollected || 0).toLocaleString()} a tu efectivo.`,
      });
      fetchCompanyInfo();
      onStatsUpdate();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || err.message });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121624] border border-white/10 rounded-2xl p-8 text-center font-mono text-slate-400">
        🏢 Cargando directorio comercial de empresas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <Icon name="domain" size={16} /> Registro Mercantil de Sinford
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-headline-lg tracking-wide">
              Empresas de Jugadores & Negocios
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Adquiere comercios y empresas para generar ingresos pasivos diarios y contratar empleados para expandir las ganancias.
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

      {/* Owner Company Info */}
      {company ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Tu Empresa Activa</span>
              <h3 className="text-xl font-bold text-slate-100">{company.name}</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">Tipo: {company.type}</p>
            </div>

            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col items-end font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancias Acumuladas</span>
              <span className="text-xl font-extrabold text-emerald-400">
                ${BigInt(company.revenue || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleCollectRevenue}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            💰 Retirar Ganancias a Efectivo
          </button>
        </div>
      ) : (
        /* Purchase Company Market */
        <div className="space-y-4">
          <div className="bg-[#121624] border border-white/10 rounded-2xl p-5">
            <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-2">
              Nombre de tu Nueva Empresa
            </label>
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Ej: Dulcería Sinford Corp"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {types.map((type) => (
              <div
                key={type.type}
                className="bg-[#121624] border border-white/10 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition"
              >
                <div>
                  <h4 className="font-bold text-slate-100 text-lg mb-1">{type.name}</h4>
                  <p className="text-xs font-mono text-emerald-400 font-bold mb-1">
                    Costo: ${type.price.toLocaleString()}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mb-4">
                    Ingreso estimado: ${type.dailyRevenue.toLocaleString()}/día
                  </p>
                </div>

                <button
                  onClick={() => handleBuyCompany(type.type)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  🏢 Fundar Empresa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
