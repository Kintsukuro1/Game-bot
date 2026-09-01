import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../common/Icon';

interface EducationPanelProps {
  sessionJwt: string | null;
  onEnrollSuccess?: () => void;
}

export const EducationPanel: React.FC<EducationPanelProps> = ({ sessionJwt, onEnrollSuccess }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEducation = async () => {
    if (!sessionJwt) return;
    try {
      setLoading(true);
      const res = await api.get('/education/courses', {
        headers: { Authorization: `Bearer ${sessionJwt}` },
      });
      if (res.data?.courses) setCourses(res.data.courses);
      if (res.data?.activeCourse) setActiveCourse(res.data.activeCourse);
    } catch (err) {
      console.error('❌ Error al obtener cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [sessionJwt]);

  const handleEnroll = async (courseId: string, courseName: string) => {
    setMessage(null);
    try {
      await api.post(
        '/education/enroll',
        { courseId },
        { headers: { Authorization: `Bearer ${sessionJwt}` } }
      );
      setMessage(`🎓 ¡Te has matriculado con éxito en **${courseName}**! El curso está en progreso.`);
      if (onEnrollSuccess) onEnrollSuccess();
      fetchEducation();
    } catch (err: any) {
      setMessage(err.response?.data?.error || `❌ Error al matricularse en ${courseName}.`);
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-700/50">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-4xl uppercase tracking-tight text-slate-100 font-extrabold drop-shadow-md flex items-center gap-3">
            <Icon name="school" size={36} className="text-cyan-400" />
            <span>Universidad Central de Sinford</span>
          </h1>
          <p className="font-caption text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-widest">
            Desarrolla conocimiento académico y desbloquea bonificaciones pasivas permanentes.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs font-bold border shadow-md ${
          message.includes('éxito')
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message}
        </div>
      )}

      {/* Active Course Banner */}
      {activeCourse && (
        <div className="bg-[#131826]/80 backdrop-blur-md border border-cyan-500/40 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Icon name="hourglass_top" size={24} className="animate-spin" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                Curso Activo en Progreso
              </span>
              <h3 className="font-headline-lg text-base font-bold text-slate-100 uppercase">
                {courses.find((c) => c.id === activeCourse.courseId)?.name || activeCourse.courseId}
              </h3>
            </div>
          </div>

          <span className="font-mono text-xs text-slate-400 uppercase">
            Finaliza: {new Date(activeCourse.completesAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="py-16 text-center font-mono text-sm text-slate-400 animate-pulse">
          ⏳ Cargando ofertas académicas...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-[#191f31]/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/30 p-6 rounded-xl shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {course.category} • {course.durationHours}h Duración
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    ${course.cost.toLocaleString()}
                  </span>
                </div>

                <h3 className="font-headline-lg text-lg font-bold text-slate-100 uppercase mt-1 mb-2">
                  {course.name}
                </h3>
                <p className="font-caption text-xs text-slate-300 leading-relaxed mb-6">
                  ✨ {course.bonusDescription}
                </p>
              </div>

              <button
                disabled={!!activeCourse}
                onClick={() => handleEnroll(course.id, course.name)}
                className="w-full bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg border border-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {activeCourse?.courseId === course.id ? 'Curso en Curso' : `Matricularse ($${course.cost.toLocaleString()})`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
