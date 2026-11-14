import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onCreateAbsence(startDate, reason);
    setReason('');
  };

  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  return createPortal(
    <div
      data-testid="absence-modal"
      onClick={onClose}
      className="fixed inset-0 z-[120] glass-backdrop bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel glass-modal specular-inset-strong w-full max-w-2xl max-h-[86dvh] flex flex-col rounded-2xl border border-white/20 overflow-hidden shadow-2xl my-auto relative"
      >
        <div className="laser-line-blue absolute top-0 inset-x-0 opacity-70 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00AAFF]/20 border border-[#00AAFF]/40 flex items-center justify-center text-[#00AAFF] glow-blue shrink-0">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-glass-pure truncate">
                Корпоративный сервис: Отсутствия (Day-off)
              </h3>
              <p className="text-[11px] sm:text-xs text-glass-secondary truncate">
                Имитация HR-сервиса Авито для стажёров и наставников
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-glass-muted hover:text-white rounded-xl hover:bg-white/10 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-5 flex-1 min-h-0 overflow-y-auto overscroll-contain glass-scrollbar">
          {/* Form to Create New Absence */}
          <form
            onSubmit={handleSubmit}
            className="glass-card specular-inset p-4 rounded-2xl border border-white/12 space-y-3.5"
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-glass-pure flex items-center gap-1.5">
              <PlusCircle size={14} className="text-[#04E061]" />
              Оформить новое заявление
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-glass-secondary block mb-1">
                  Дата отсутствия
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[42px] sm:min-h-[38px] bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-glass-secondary block mb-1">
                  Причина (визит к врачу, вуз и др.)
                </label>
                <input
                  type="text"
                  placeholder="Например: Сдача зачета в университете"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-[42px] sm:min-h-[38px] bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#04E061]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="w-full min-h-[42px] sm:min-h-[38px] py-2.5 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all disabled:opacity-40 cursor-pointer glow-green"
            >
              Подать заявку на согласование
            </button>
          </form>

          {/* List of Absences */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-glass-secondary">
              История заявок ({absences.length}):
            </h4>
            <div className="space-y-2.5">
              {absences.map((req) => (
                <div
                  key={req.id}
                  className="glass-card specular-inset p-3.5 rounded-2xl border border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-glass-pure flex flex-wrap items-center gap-1.5">
                      <span>#{req.id} • {req.start_date}</span>
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#04E061] border border-emerald-500/40 text-[10px] font-extrabold flex items-center gap-1">
                          <Check size={11} /> Одобрено
                        </span>
                      )}
                      {req.status === 'pending_approval' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold flex items-center gap-1">
                          <Clock size={11} /> На согласовании
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-[#ff6b6b] border border-rose-500/40 text-[10px] font-extrabold flex items-center gap-1">
                          <Ban size={11} /> Отклонено
                        </span>
                      )}
                    </p>
                    <p className="text-glass-secondary text-[11px] break-words">
                      Сотрудник: <strong className="text-white">{req.user_name}</strong> • Причина: {req.reason}
                    </p>
                    {req.approved_by && (
                      <p className="text-[10px] text-glass-muted">
                        Утвердил: <span className="text-[#04E061] font-semibold">{req.approved_by}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions for Mentor / Lead */}
                  {isMentorOrLead && req.status === 'pending_approval' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onApproveAbsence(req.id)}
                        className="min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-[11px] hover:bg-[#03c754] cursor-pointer glow-green"
                      >
                        Согласовать
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectAbsence(req.id)}
                        className="min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl bg-rose-500/20 text-[#ff6b6b] border border-rose-500/40 font-extrabold text-[11px] hover:bg-rose-500/30 cursor-pointer"
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
