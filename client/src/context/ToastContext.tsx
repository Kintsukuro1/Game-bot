import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '../components/common/Icon';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  icon?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastNotification, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastNotification = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      // Stack up to 4 active toast cards
      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Card Notifications Stack (Bottom-Right, above footer marquee) */}
      <div className="fixed bottom-12 right-4 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (toast) => console.log('Toast:', toast),
      removeToast: () => {},
    };
  }
  return context;
};

// Helper function to render bold markdown text (**text**) as styled JSX elements
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      let colorClass = 'text-amber-400 font-extrabold';
      if (inner.startsWith('+') || inner.includes('$') || inner.toLowerCase().includes('exitoso')) {
        colorClass = 'text-emerald-400 font-extrabold';
      } else if (
        inner.includes('XP') ||
        inner.includes('LEVEL') ||
        inner.includes('NVL') ||
        inner.includes('STRENGTH') ||
        inner.includes('DEFENSE') ||
        inner.includes('SPEED') ||
        inner.includes('DEXTERITY')
      ) {
        colorClass = 'text-cyan-400 font-extrabold';
      }
      return (
        <span key={idx} className={colorClass}>
          {inner}
        </span>
      );
    }
    return part;
  });
};

const ToastCard: React.FC<{ toast: ToastNotification; onClose: () => void }> = ({ toast, onClose }) => {
  const duration = toast.duration ?? 5000;

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.2)]',
          bg: 'bg-[#0b1713]/95 backdrop-blur-xl',
          headerBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          progressBg: 'bg-emerald-400',
          icon: toast.icon || 'check_circle',
          badgeText: toast.title || '¡OPERACIÓN EXITOSA!',
        };
      case 'error':
        return {
          border: 'border-rose-500/40 shadow-[0_8px_30px_rgba(244,63,94,0.2)]',
          bg: 'bg-[#1a0c12]/95 backdrop-blur-xl',
          headerBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          progressBg: 'bg-rose-400',
          icon: toast.icon || 'close',
          badgeText: toast.title || 'OPERACIÓN FALLIDA',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.2)]',
          bg: 'bg-[#18140c]/95 backdrop-blur-xl',
          headerBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          progressBg: 'bg-amber-400',
          icon: toast.icon || 'lock',
          badgeText: toast.title || 'ADVERTENCIA',
        };
      default:
        return {
          border: 'border-cyan-500/40 shadow-[0_8px_30px_rgba(6,182,212,0.2)]',
          bg: 'bg-[#0c1424]/95 backdrop-blur-xl',
          headerBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          progressBg: 'bg-cyan-400',
          icon: toast.icon || 'info',
          badgeText: toast.title || 'NOTIFICACIÓN',
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} p-4 backdrop-blur-xl flex flex-col gap-2.5 min-w-[280px]`}
    >
      {/* Card Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${theme.headerBg}`}
        >
          <Icon name={theme.icon} size={14} />
          <span>{theme.badgeText}</span>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          title="Cerrar notificación"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Card Body Message */}
      <div className="font-sans text-xs text-slate-200 leading-relaxed font-medium pr-2">
        {renderFormattedText(toast.message)}
      </div>

      {/* Animated Countdown Progress Bar */}
      {duration > 0 && (
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1 border border-white/5 relative">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`h-full ${theme.progressBg}`}
          />
        </div>
      )}
    </motion.div>
  );
};
