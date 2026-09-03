import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';
import { useToast } from '../../context/ToastContext';

interface PropertyPanelProps {
  sessionJwt: string | null;
  onBuySuccess?: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ sessionJwt, onBuySuccess }) => {
  const { showToast } = useToast();
  const [currentProperty, setCurrentProperty] = useState<any>(null);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buyingType, setBuyingType] = useState<string | null>(null);

  const fetchPropertyData = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/property/my', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.property) setCurrentProperty(res.data.property);
      if (res.data?.availableProperties) setAvailableProperties(res.data.availableProperties);
    } catch (err) {
      console.error('❌ Error al obtener propiedades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [sessionJwt]);

  const handleBuyProperty = async (propType: string, propName: string) => {
    setBuyingType(propType);
    try {
      await api.post(
        '/property/buy',
        { propertyType: propType },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      showToast({
        type: 'success',
        title: '🏡 ¡Propiedad Adquirida!',
        message: `¡Felicidades! Adquiriste **${propName}**. Tu Felicidad Máxima ha aumentado.`,
      });
      if (onBuySuccess) onBuySuccess();
      fetchPropertyData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error al Comprar',
        message: err.response?.data?.error || `Error al comprar **${propName}**.`,
      });
    } finally {
      setBuyingType(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="home" size={36} className="text-emerald-400" />
            <span>Bienes Raíces & Propiedades Privadas</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Adquiere residencias de lujo para aumentar tu Felicidad Máxima (Happy Max) y tasa de regeneración.
          </p>
        </div>
      </div>

      {/* Current Active Residence */}
      {currentProperty && (
        <div className="bg-[#191f31]/80 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Icon name="domain" size={32} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold tracking-widest">
                Residencia Principal Activa
              </span>
              <h2 className="font-headline-lg text-xl font-extrabold text-slate-100 uppercase mt-0.5">
                {availableProperties.find((p) => p.type === currentProperty.propertyType)?.name || currentProperty.propertyType}
              </h2>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-mono text-xs text-slate-400 uppercase">Bono de Felicidad:</span>
            <span className="font-mono text-xl font-extrabold text-emerald-400">
              😊 {currentProperty.maxHappy} Max Happy
            </span>
          </div>
        </div>
      )}

      {/* Properties Catalog */}
      {loading ? (
        <div className="py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
          ⏳ Cargando listado de propiedades de la ciudad...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableProperties.map((p) => {
            const isCurrent = currentProperty?.propertyType === p.type;
            const isBuying = buyingType === p.type;

            return (
              <div
                key={p.type}
                className={`bg-[#191f31]/40 backdrop-blur-md border rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-slate-800 text-slate-300 rounded font-bold">
                      {p.type}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-emerald-400">
                      {p.price === 0 ? 'GRATIS' : `$${p.price.toLocaleString()}`}
                    </span>
                  </div>

                  <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase mb-2">
                    {p.name}
                  </h3>
                  <p className="font-mono text-xs text-emerald-300 mb-6 font-bold">
                    😊 +{p.maxHappy} Max Happy Cap
                  </p>
                </div>

                <button
                  disabled={isCurrent || isBuying}
                  onClick={() => handleBuyProperty(p.type, p.name)}
                  className={`w-full font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default'
                      : 'bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border-white/10'
                  }`}
                >
                  {isCurrent ? 'Propiedad Actual' : isBuying ? 'Adquiriendo...' : 'Comprar Propiedad'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
