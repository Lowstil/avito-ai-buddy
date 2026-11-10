import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AbsenceRequest, UserProfile } from '../types';
import { X, Calendar, Check, Ban, Clock, PlusCircle } from 'lucide-react';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  absences: AbsenceRequest[];
  currentUser: UserProfile;
  onCreateAbsence: (startDate: string, reason: string) => void;
  onApproveAbsence: (id: string) => void;
  onRejectAbsence: (id: string) => void;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({
  isOpen,
  onClose,
  absences,
  currentUser,
  onCreateAbsence,
  onApproveAbsence,
  onRejectAbsence
}) => {
  const [startDate, setStartDate] = useState('2026-11-20');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onCreateAbsence(startDate, reason);
    setReason('');
  };

  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00AAFF]/20 flex items-center justify-center text-[#00AAFF]">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Корпоративный сервис: Отсутствия (Day-off)</h3>
                <p className="text-xs text-slate-400">Имитация HR-сервиса Авито для стажёров и наставников</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form to Create New Absence */}
          <form onSubmit={handleSubmit} className="glass-card p-4 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PlusCircle size={14} className="text-[#04E061]" />
              Оформить новое заявление
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Дата отсутствия</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Причина (визит к врачу, вуз и др.)</label>
                <input
                  type="text"
                  placeholder="Например: Сдача зачета в университете"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="w-full py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors disabled:opacity-40 cursor-pointer"
            >
              Подать заявку на согласование
            </button>
          </form>

          {/* List of Absences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              История заявок ({absences.length}):
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {absences.map((req) => (
                <div
                  key={req.id}
                  className="glass-card p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      #{req.id} • {req.start_date}
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-0.5">
                          <Check size={11} /> Одобрено
                        </span>
                      )}
                      {req.status === 'pending_approval' && (
                        <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-0.5">
                          <Clock size={11} /> На согласовании
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-semibold flex items-center gap-0.5">
                          <Ban size={11} /> Отклонено
                        </span>
                      )}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Сотрудник: {req.user_name} • Причина: {req.reason}
                    </p>
                    {req.approved_by && (
                      <p className="text-[10px] text-slate-500">Утвердил: {req.approved_by}</p>
                    )}
                  </div>

                  {/* Actions for Mentor / Lead */}
                  {isMentorOrLead && req.status === 'pending_approval' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onApproveAbsence(req.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#04E061] text-slate-950 font-bold text-[11px] hover:bg-[#03c754] cursor-pointer"
                      >
                        Согласовать
                      </button>
                      <button
                        onClick={() => onRejectAbsence(req.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-[11px] hover:bg-rose-500/30 cursor-pointer"
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
