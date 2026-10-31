import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext, type ToastItem, type ToastVariant } from './toastContextDef';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-200',
          icon: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#F5F0E6] text-[#101E2B] border-[#E5DFD3]',
          icon: <Info className="h-4 w-4 text-[#2B4257] shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Notification Container */}
      <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const { bg, icon } = getVariantStyles(toast.variant);
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${bg}`}
            >
              <div className="flex items-start gap-2.5 pt-0.5">
                {icon}
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-[#889AA9] hover:text-[#101E2B] p-0.5 rounded transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};