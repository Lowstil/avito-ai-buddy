import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AccessItem } from '../types';
import { X, Shield, Check, Clock, Plus } from 'lucide-react';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessList: AccessItem[];
  onRequestAccess: (systemKey: string, justification: string) => void;
  onGrantAccess: (systemKey: string) => void;
}

export const AccessModal: React.FC<AccessModalProps> = ({
  isOpen,
  onClose,
  accessList,
  onRequestAccess,
  onGrantAccess
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        data-testid="access-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-modal glass-panel specular-inset w-[94vw] max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative"
        >
          <div className="laser-line-spectrum absolute top-0 inset-x-0 opacity-70 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#965EEB]/20 border border-[#965EEB]/40 flex items-center justify-center text-[#b085f5] glow-purple shrink-0">
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-glass-pure truncate">
                  Доступы и ServiceDesk Авито
                </h3>
                <p className="text-[11px] sm:text-xs text-glass-secondary truncate">
                  Управление учетными записями сред разработки и кластеров
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть окно"
              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-glass-muted hover:text-white rounded-xl hover:bg-white/10 cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Access Items List */}
          <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto glass-scrollbar flex-1">
            {accessList.map((item) => (
              <div
                key={item.id}
                className="glass-card glass-specular specular-inset p-4 rounded-2xl border border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-glass-pure text-sm">{item.system_name}</p>
                    {item.status === 'active' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#04E061] border border-emerald-500/40 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(4,224,97,0.2)]">
                        <Check size={11} /> Активен
                      </span>
                    )}
                    {item.status === 'requested' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#b085f5] border border-purple-500/40 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(150,94,235,0.2)]">
                        <Clock size={11} /> Запрошен
                      </span>
                    )}
                    {item.status === 'not_requested' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-glass-secondary border border-white/15 text-[10px] font-bold">
                        Не запрошен
                      </span>
                    )}
                  </div>
                  <p className="text-glass-secondary text-xs leading-relaxed break-words">
                    {item.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  {item.status === 'not_requested' && (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestAccess(item.system_key, 'Доступ необходим для стажировки')
                      }
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-3.5 py-2 rounded-xl bg-[#00AAFF] text-white font-extrabold text-xs hover:bg-[#0090dd] transition-all flex items-center justify-center gap-1.5 cursor-pointer glow-blue"
                    >
                      <Plus size={14} /> Запросить
                    </button>
                  )}
                  {item.status === 'requested' && (
                    <button
                      type="button"
                      onClick={() => onGrantAccess(item.system_key)}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-3.5 py-2 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all flex items-center justify-center gap-1.5 cursor-pointer glow-green"
                    >
                      <Check size={14} /> Выдать доступ
                    </button>
                  )}
                  {item.status === 'active' && (
                    <span className="inline-flex min-h-[44px] sm:min-h-[36px] items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#04E061] font-extrabold text-xs">
                      Готов к работе
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/50 text-[11px] text-glass-muted text-center shrink-0">
            Все доступы логируются в соответствии с политикой аудита безопасности Авито (Zero Trust).
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
