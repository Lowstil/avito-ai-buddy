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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#965EEB]/20 flex items-center justify-center text-[#965EEB]">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Доступы и ServiceDesk Авито</h3>
                <p className="text-xs text-slate-400">Управление учетными записями сред разработки и кластеров</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Access Items List */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {accessList.map((item) => (
              <div
                key={item.id}
                className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm">{item.system_name}</p>
                    {item.status === 'active' && (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                        <Check size={11} /> Активен
                      </span>
                    )}
                    {item.status === 'requested' && (
                      <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <Clock size={11} /> Запрошен
                      </span>
                    )}
                    {item.status === 'not_requested' && (
                      <span className="px-2 py-0.2 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-semibold">
                        Не запрошен
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">{item.description}</p>
                </div>

                {/* Action Button */}
                <div>
                  {item.status === 'not_requested' && (
                    <button
                      onClick={() => onRequestAccess(item.system_key, "Доступ необходим для стажировки")}
                      className="px-3 py-1.5 rounded-xl bg-[#00AAFF] text-white font-bold text-xs hover:bg-[#0090dd] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Запросить
                    </button>
                  )}
                  {item.status === 'requested' && (
                    <button
                      onClick={() => onGrantAccess(item.system_key)}
                      className="px-3 py-1.5 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={13} /> Выдать доступ
                    </button>
                  )}
                  {item.status === 'active' && (
                    <span className="text-emerald-400 font-bold text-xs">Готов к работе</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 text-center">
            Все доступы логируются в соответствии с политикой аудита безопасности Авито.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
