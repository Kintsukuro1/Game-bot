import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface Course {
  id: string;
  name: string;
  category: 'Biology' | 'Law' | 'Business' | 'Combat' | 'ComputerScience';
  prerequisiteId?: string;
  cost: number;
  durationHours: number;
  bonusDescription: string;
  statBonus?: {
    intelligence?: number;
    endurance?: number;
    manualLabor?: number;
    crimeSkill?: number;
    strength?: number;
  };
  passivePerk?: {
    type: string;
    value: number;
  };
}

interface EducationPanelProps {
  sessionJwt: string | null;
  onEnrollSuccess?: () => void;
}

const FACULTY_INFO: Record<
  string,
  { name: string; icon: string; color: string; bg: string; desc: string }
> = {
  ALL: {
    name: 'Todas las Facultades',
    icon: 'school',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    desc: 'Catálogo académico completo de la Universidad Central de Sinford.',
  },
  Biology: {
    name: 'Medicina & Bioquímica',
    icon: 'medication',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    desc: 'Investigación médica, botiquines, recuperación acelerada y genética.',
  },
  Law: {
    name: 'Derecho & Criminología',
    icon: 'security',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    desc: 'Estudio penal, reducción de fianzas y procedimientos de fianza en cárcel.',
  },
  Business: {
    name: 'Economía & Finanzas',
    icon: 'account_balance',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    desc: 'Gestión corporativa, dividendos bursátiles e intereses bancarios.',
  },
  Combat: {
    name: 'Ciencias Militares & Tácticas',
    icon: 'swords',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    desc: 'Estrategia bélica, precisión de asalto y combate contra World Bosses.',
  },
  ComputerScience: {
    name: 'Informática & Ciberseguridad',
    icon: 'memory',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    desc: 'Algoritmos, scripting cibernético e intrusión en servidores bancarios.',
  },
};

export const EducationPanel: React.FC<EducationPanelProps> = ({ sessionJwt, onEnrollSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [activeModifiers, setActiveModifiers] = useState<any>({});
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');

  const [loading, setLoading] = useState<boolean>(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');

  const fetchEducation = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/education/courses', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.courses) setCourses(res.data.courses);
      if (res.data?.activeCourse) setActiveCourse(res.data.activeCourse);
      if (res.data?.completedCourses) setCompletedCourses(res.data.completedCourses);
      if (res.data?.activeModifiers) setActiveModifiers(res.data.activeModifiers);
    } catch (err) {
      console.error('❌ Error al obtener cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [sessionJwt]);

  // Live timer for active course
  useEffect(() => {
    if (!activeCourse?.completesAt || activeCourse.isCompleted) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const target = new Date(activeCourse.completesAt).getTime();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setTimeRemainingStr('¡Completado! Actualizando...');
        clearInterval(interval);
        fetchEducation();
        if (onEnrollSuccess) onEnrollSuccess();
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemainingStr(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCourse]);

  const handleEnroll = async (courseId: string, courseName: string) => {
    setMessage(null);
    setEnrollingId(courseId);
    try {
      await api.post(
        '/education/enroll',
        { courseId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(`🎓 ¡Te has matriculado con éxito en **${courseName}**! Las clases han comenzado.`);
      if (onEnrollSuccess) onEnrollSuccess();
      fetchEducation();
    } catch (err: any) {
      setMessage(err.response?.data?.error || `❌ Error al matricularse en ${courseName}.`);
    } finally {
      setEnrollingId(null);
    }
  };

  const completedCourseIds = new Set(completedCourses.map((c) => c.id));
  const filteredCourses = selectedFaculty === 'ALL'
    ? courses
    : courses.filter((c) => c.category === selectedFaculty);

  return (
    <div className="flex flex-col w-full h-full space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-bold">
              Campus Universitario Sinford
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-3">
            <Icon name="school" size={36} className="text-cyan-400" />
            <span>Universidad Central de <span className="text-cyan-400">Sinford</span></span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Formación académica superior. Incrementa tus estadísticas base de forma permanente y desbloquea pasivas exclusivas.
          </p>
        </div>

        {/* Active Degrees Count */}
        <div className="bg-[#191f31]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-lg">
          <div className="flex flex-col items-end font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Títulos Obtenidos</span>
            <span className="text-2xl font-bold text-cyan-400">{completedCourses.length} / {courses.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Icon name="badge" size={22} />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md flex items-center justify-between ${
            message.includes('éxito')
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Active Course Banner */}
      {activeCourse && !activeCourse.isCompleted && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#191f31] via-[#121726] to-[#191f31] border border-cyan-500/40 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Icon name="hourglass_top" size={32} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                Curso en Progreso
              </span>
              <h3 className="font-headline-lg text-xl font-bold text-slate-100 uppercase">
                {courses.find((c) => c.id === activeCourse.courseId)?.name || activeCourse.courseId}
              </h3>
              <p className="font-caption text-xs text-slate-400">
                Asistiendo a clases en el campus. Recibirás tu título al finalizar el temporizador.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end shrink-0 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tiempo Restante</span>
            <span className="text-3xl font-extrabold text-cyan-300 tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              {timeRemainingStr || 'Calculando...'}
            </span>
          </div>
        </div>
      )}

      {/* Active Passive Modifiers Overview Box */}
      {completedCourses.length > 0 && (
        <div className="bg-[#131826]/90 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Icon name="star" size={16} />
              <span>Beneficios Pasivos Activos de Graduación</span>
            </h3>
            <span className="font-mono text-[10px] text-slate-400">{completedCourses.length} Cursos Completados</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            {activeModifiers.healingBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <Icon name="healing" size={16} />
                <span>+{(activeModifiers.healingBoost * 100).toFixed(0)}% Curación Médica</span>
              </div>
            )}
            {activeModifiers.hospitalReduction > 0 && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                <Icon name="local_hospital" size={16} />
                <span>-{(activeModifiers.hospitalReduction * 100).toFixed(0)}% Tiempo en Hospital</span>
              </div>
            )}
            {activeModifiers.bailDiscount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
                <Icon name="lock" size={16} />
                <span>-{(activeModifiers.bailDiscount * 100).toFixed(0)}% Descuento Fianza Cárcel</span>
              </div>
            )}
            {activeModifiers.bustSuccessBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
                <Icon name="front_hand" size={16} />
                <span>+{(activeModifiers.bustSuccessBoost * 100).toFixed(0)}% Éxito Rescate Prisión</span>
              </div>
            )}
            {activeModifiers.salaryBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <Icon name="monetization_on" size={16} />
                <span>+{(activeModifiers.salaryBoost * 100).toFixed(0)}% Salario Empleos</span>
              </div>
            )}
            {activeModifiers.stockDividendBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <Icon name="account_balance" size={16} />
                <span>+{(activeModifiers.stockDividendBoost * 100).toFixed(0)}% Dividendos Bolsa</span>
              </div>
            )}
            {activeModifiers.bankInterestBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <Icon name="wallet" size={16} />
                <span>+{(activeModifiers.bankInterestBoost * 100).toFixed(1)}% Tasa Interés Banco</span>
              </div>
            )}
            {activeModifiers.combatAccuracyBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-2">
                <Icon name="crosshair" size={16} />
                <span>+{(activeModifiers.combatAccuracyBoost * 100).toFixed(0)}% Precisión Combate</span>
              </div>
            )}
            {activeModifiers.combatCritBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-2">
                <Icon name="swords" size={16} />
                <span>+{(activeModifiers.combatCritBoost * 100).toFixed(0)}% Daño Crítico PvP</span>
              </div>
            )}
            {activeModifiers.bossDamageBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-2">
                <Icon name="explosion" size={16} />
                <span>+{(activeModifiers.bossDamageBoost * 100).toFixed(0)}% Daño World Bosses</span>
              </div>
            )}
            {activeModifiers.cyberExpBoost > 0 && (
              <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center gap-2">
                <Icon name="memory" size={16} />
                <span>+{(activeModifiers.cyberExpBoost * 100).toFixed(0)}% EXP Crímenes Cyber</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {Object.keys(FACULTY_INFO).map((facKey) => {
          const fac = FACULTY_INFO[facKey];
          const isActive = selectedFaculty === facKey;
          return (
            <button
              key={facKey}
              onClick={() => setSelectedFaculty(facKey)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon name={fac.icon} size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              <span>{fac.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Faculty Description Header */}
      <div className={`p-4 rounded-xl border ${FACULTY_INFO[selectedFaculty]?.bg || 'bg-slate-900/60 border-white/5'} font-sans flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Icon name={FACULTY_INFO[selectedFaculty]?.icon || 'school'} size={24} className={FACULTY_INFO[selectedFaculty]?.color} />
          <div>
            <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase">
              {FACULTY_INFO[selectedFaculty]?.name}
            </h3>
            <p className="font-caption text-xs text-slate-300">
              {FACULTY_INFO[selectedFaculty]?.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 font-mono text-xs space-y-3">
          <Icon name="loader" size={32} className="animate-spin text-cyan-400" />
          <span>Accediendo a los expedientes académicos del campus...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isCompleted = completedCourseIds.has(course.id);
            const isInProgress = activeCourse?.courseId === course.id && !activeCourse.isCompleted;

            // Check prerequisite status
            let isPrereqLocked = false;
            let prereqCourseName = '';
            if (course.prerequisiteId && !isCompleted) {
              const hasPrereq = completedCourseIds.has(course.prerequisiteId);
              if (!hasPrereq) {
                isPrereqLocked = true;
                prereqCourseName = courses.find((c) => c.id === course.prerequisiteId)?.name || course.prerequisiteId;
              }
            }

            return (
              <div
                key={course.id}
                className={`relative bg-[#191f31]/50 backdrop-blur-md rounded-2xl p-6 border flex flex-col justify-between transition-all shadow-lg ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : isInProgress
                    ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : isPrereqLocked
                    ? 'border-white/5 opacity-60'
                    : 'border-white/10 hover:border-cyan-500/40'
                }`}
              >
                {/* Course Status Top Badges */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="font-mono text-[9px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-950 text-cyan-400 border border-cyan-500/20">
                    {course.category} • {course.durationHours}h Clase
                  </span>

                  {isCompleted ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <Icon name="check" size={14} />
                      <span>Graduado</span>
                    </span>
                  ) : isInProgress ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1 animate-pulse">
                      <Icon name="hourglass_top" size={14} />
                      <span>En Curso</span>
                    </span>
                  ) : isPrereqLocked ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Icon name="lock" size={14} />
                      <span>Bloqueado</span>
                    </span>
                  ) : null}
                </div>

                {/* Course Details */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase tracking-tight">
                    {course.name}
                  </h3>

                  {/* Prerequisite warning banner */}
                  {isPrereqLocked && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] flex items-center gap-2">
                      <Icon name="lock" size={14} className="shrink-0 text-amber-400" />
                      <span>Requiere previo: <strong>{prereqCourseName}</strong></span>
                    </div>
                  )}

                  {/* Passive Perk description */}
                  <p className="font-caption text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                    ✨ <strong>Beneficio Pasivo:</strong> {course.bonusDescription}
                  </p>

                  {/* Stat bonus badges */}
                  {course.statBonus && (
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                      {course.statBonus.intelligence && (
                        <span className="px-2 py-1 rounded bg-slate-900 text-cyan-300 border border-white/5 font-bold">
                          🧠 +{course.statBonus.intelligence} Inteligencia
                        </span>
                      )}
                      {course.statBonus.endurance && (
                        <span className="px-2 py-1 rounded bg-slate-900 text-rose-300 border border-white/5 font-bold">
                          🛡️ +{course.statBonus.endurance} Resistencia
                        </span>
                      )}
                      {course.statBonus.strength && (
                        <span className="px-2 py-1 rounded bg-slate-900 text-purple-300 border border-white/5 font-bold">
                          💪 +{course.statBonus.strength} Fuerza
                        </span>
                      )}
                      {course.statBonus.crimeSkill && (
                        <span className="px-2 py-1 rounded bg-slate-900 text-amber-300 border border-white/5 font-bold">
                          🕵️ +{course.statBonus.crimeSkill} Habilidad Crimen
                        </span>
                      )}
                      {course.statBonus.manualLabor && (
                        <span className="px-2 py-1 rounded bg-slate-900 text-emerald-300 border border-white/5 font-bold">
                          💼 +{course.statBonus.manualLabor} Trabajo Manual
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action & Cost */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-slate-400">Matrícula Universitaria</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      ${course.cost.toLocaleString()}
                    </span>
                  </div>

                  <button
                    disabled={isCompleted || isInProgress || isPrereqLocked || !!activeCourse || enrollingId === course.id}
                    onClick={() => handleEnroll(course.id, course.name)}
                    className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : isInProgress
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-default'
                        : isPrereqLocked || !!activeCourse
                        ? 'bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer'
                    }`}
                  >
                    {enrollingId === course.id ? (
                      <>
                        <Icon name="loader" size={16} className="animate-spin" />
                        <span>Inscribiendo...</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <Icon name="check" size={16} />
                        <span>Título Obtenido</span>
                      </>
                    ) : isInProgress ? (
                      <>
                        <Icon name="hourglass_top" size={16} className="animate-spin" />
                        <span>En Curso</span>
                      </>
                    ) : isPrereqLocked ? (
                      <>
                        <Icon name="lock" size={16} />
                        <span>Prerrequisito Requerido</span>
                      </>
                    ) : (
                      <>
                        <Icon name="school" size={16} />
                        <span>Matricularse ($${course.cost.toLocaleString()})</span>
                      </>
                    )
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
