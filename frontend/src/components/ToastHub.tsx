import React from 'react';
import { CheckCircle2, Flame, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'xp' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastHubProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastHub: React.FC<ToastHubProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isXp = toast.type === 'xp';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all duration-300 animate-slide-in-right ${
              isXp
                ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900/90 border-[#04E061]/50 shadow-[0_0_25px_rgba(4,224,97,0.25)]'
                : isSuccess
                ? 'bg-slate-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : isWarning
                ? 'bg-slate-900/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/90 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isXp && <Flame size={18} className="text-[#04E061] animate-pulse" />}
              {isSuccess && <CheckCircle2 size={18} className="text-[#04E061]" />}
              {isWarning && <AlertTriangle size={18} className="text-amber-400" />}
              {!isXp && !isSuccess && !isWarning && <Info size={18} className="text-[#00AAFF]" />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className={`text-xs font-black uppercase tracking-wider mb-0.5 ${
                  isXp ? 'text-[#04E061]' : 'text-white'
                }`}>
                  {toast.title}
                </p>
              )}
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastHub;
