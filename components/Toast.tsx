import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const enterTimer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss après 5 secondes
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Attendre la fin de l'animation CSS (300ms) avant de retirer du DOM
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  const icons = {
    success: <CheckCircle2 size={20} strokeWidth={2.5} />,
    error: <XCircle size={20} strokeWidth={2.5} />,
    info: <Info size={20} strokeWidth={2.5} />,
    warning: <AlertTriangle size={20} strokeWidth={2.5} />,
  };

  const styles = {
    success: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    error: {
      border: 'border-l-rose-500',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    info: {
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    warning: {
      border: 'border-l-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  };

  const currentStyle = styles[toast.type];

  return (
    <div 
      className={`
        group pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-100 
        w-full max-w-sm border-l-[6px]
        transition-all duration-300 ease-out transform
        ${currentStyle.border}
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}
      `}
      role="alert"
    >
      <div className={`p-2 rounded-full flex-shrink-0 ${currentStyle.iconBg} ${currentStyle.iconColor}`}>
        {icons[toast.type]}
      </div>
      
      <div className="flex-1 pt-0.5 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button 
        onClick={handleClose}
        className="p-1 -mr-2 -mt-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Fermer"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed z-[100] pointer-events-none flex flex-col gap-2 
      top-4 left-4 right-4 items-center 
      md:top-auto md:bottom-6 md:left-auto md:right-6 md:items-end"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;