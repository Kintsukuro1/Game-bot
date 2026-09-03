import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';
import { useToast } from '../../context/ToastContext';

interface ProfessionPanelProps {
  sessionJwt: string | null;
  playerLevel?: number;
  currentProfession?: string | null;
  onChooseSuccess?: () => void;
}

export const ProfessionPanel: React.FC<ProfessionPanelProps> = ({
  sessionJwt,
  playerLevel = 1,
  currentProfession,
  onChooseSuccess,
}) => {
  const { showToast } = useToast();
  const [professions, setProfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [choosingId, setChoosingId] = useState<string | null>(null);

  const fetchProfessions = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/profession/list', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.professions) setProfessions(res.data.professions);
    } catch (err) {
      console.error('❌ Error al obtener profesiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, [sessionJwt]);

  const handleChoose = async (professionId: string, profName: string) => {
    if (playerLevel < 10) {
      showToast({
        type: 'warning',
        title: '🔒 Nivel Insuficiente',
        message: 'Requieres **Nivel 10** para desbloquear la selección de carrera profesional.',
      });
      return;
    }

    setChoosingId(professionId);

    try {
      await api.post(
        '/profession/choose',
        { profession: professionId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      showToast({
        type: 'success',
        title: '🎭 ¡Especialización Profesional!',
        message: `¡Felicidades! Has asumido la profesión de **${profName}**.`,
      });
      if (onChooseSuccess) onChooseSuccess();
      fetchProfessions();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: '❌ Error de Selección',
        message: err.response?.data?.error || `Error al seleccionar la profesión de **${profName}**.`,
      });
    } finally {
      setChoosingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="work" size={36} className="text-purple-400" />
            <span>Especialización & Carrera Profesional (Nivel 10+)</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Selecciona tu especialidad criminal o empresarial para desbloquear habilidades únicas.
          </p>
        </div>

        {currentProfession && (
          <span className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl font-mono text-xs font-bold uppercase tracking-wider">
            Especialidad Activa: {currentProfession}
          </span>
        )}
      </div>

      {/* Professions List */}
      {loading ? (
        <div className="py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
          ⏳ Cargando especialidades del sindicato...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {professions.map((prof) => {
            const isActive = currentProfession === prof.id;
            const isChoosing = choosingId === prof.id;

            return (
              <div
                key={prof.id}
                className={`bg-[#191f31]/40 backdrop-blur-md border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                  isActive ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5 hover:border-purple-500/30'
                }`}
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl mb-4 shadow-inner">
                    {prof.emoji}
                  </div>

                  <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase mb-2">
                    {prof.name}
                  </h3>
                  <p className="font-caption text-xs text-slate-300 mb-4 leading-relaxed">
                    {prof.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <span className="font-mono text-[10px] text-purple-400 uppercase font-bold tracking-widest block">
                      Ventajas & Habilidades Perks:
                    </span>
                    {prof.perks.map((perk: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isActive || playerLevel < 10 || isChoosing}
                  onClick={() => handleChoose(prof.id, prof.name)}
                  className={`w-full font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 cursor-default'
                      : 'bg-slate-900 hover:bg-purple-500 hover:text-slate-950 text-slate-200 border-white/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isActive ? 'Especialidad Activa' : playerLevel < 10 ? 'Requiere Nivel 10' : isChoosing ? 'Asumiendo...' : 'Seleccionar Carrera'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
