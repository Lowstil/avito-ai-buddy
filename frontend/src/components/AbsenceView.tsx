import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { AbsenceRequest, UserProfile } from '../types';
import { Calendar, CheckCircle2, Clock, Ban, PlusCircle, UserCheck, Sparkles } from 'lucide-react';

interface AbsenceViewProps {
  absences: AbsenceRequest[];
  currentUser: UserProfile;
  onCreateAbsence: (startDate: string, reason: string) => void;
  onApproveAbsence: (id: string) => void;
  onRejectAbsence: (id: string) => void;
  onAskBuddy: (question: string) => void;
}

export const AbsenceView: React.FC<AbsenceViewProps> = ({
  absences,
  currentUser,
  onCreateAbsence,
  onApproveAbsence,
  onRejectAbsence,
  onAskBuddy
}) => {
  const [startDate, setStartDate] = useState('2026-11-20');
  const [reason, setReason] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onCreateAbsence(startDate, reason);
    setReason('');
    setIsFormVisible(false);
  };

  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Rules & Balance in simple words */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04E061]"></span>
            <h2 className="text-xl font-black text-white">Кадровый сервис: Отгулы и Day-off</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            По регламенту Авито, каждый стажёр имеет право на <strong>2 дня оплачиваемого отгула в месяц</strong> по согласованию с наставником. Заявки отправляются в электронном виде без бумажных заявлений.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Доступно дней</p>
            <p className="text-xl font-black text-[#04E061]">2 дня</p>
          </div>
          {!isFormVisible && (
            <button
              onClick={() => setIsFormVisible(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all flex items-center gap-2 shadow-lg shadow-[#04E061]/20 cursor-pointer"
            >
              <PlusCircle size={16} />
              Оформить отгул
            </button>
          )}
        </div>
      </div>

      {/* Form (Collapsible, intuitive) */}
      {isFormVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 border border-[#04E061]/30 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-[#04E061]" />
              Новая заявка на отгул
            </h3>
            <button
              onClick={() => setIsFormVisible(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Отмена
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  1. Дата отсутствия:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  2. Причина (визит к врачу, экзамен в вузе, семейные дела):
                </label>
                <input
                  type="text"
                  placeholder="Например: Сдача зачета в университете"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!reason.trim()}
                className="px-5 py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors disabled:opacity-40 cursor-pointer shadow-lg shadow-[#04E061]/20"
              >
                Подать заявку на согласование
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Role Notice for Testing RBAC */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-[#00AAFF] shrink-0" />
          <span>
            {currentUser.role === 'intern'
              ? 'Вы зашли как стажёр. Вы можете создавать заявки. Чтобы согласовать заявку, переключитесь в правом верхнем углу на роль наставника.'
              : 'Вы зашли как наставник / тимлид. Вы можете подтверждать или отклонять заявки стажёров.'}
          </span>
        </div>
        <button
          onClick={() => onAskBuddy('Как правильно оформить отгул в Авито?')}
          className="text-[#04E061] font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Sparkles size={13} /> Спросить правила у AI
        </button>
      </div>

      {/* List of Absences */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          Все поданные заявки ({absences.length})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {absences.map((req) => (
            <div
              key={req.id}
              className={`glass-card rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                req.status === 'approved'
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : req.status === 'pending_approval'
                  ? 'border-amber-500/30 bg-amber-950/20'
                  : 'border-rose-500/30 bg-rose-950/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-sm text-white">#{req.id}</span>
                  <span className="text-xs text-slate-300">Дата: <strong>{req.start_date}</strong></span>
                  {req.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Согласовано
                    </span>
                  )}
                  {req.status === 'pending_approval' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30">
                      <Clock size={12} /> На согласовании
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30">
                      <Ban size={12} /> Отклонено
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">
                  Сотрудник: <strong>{req.user_name}</strong> • Причина: {req.reason}
                </p>
                {req.approved_by && (
                  <p className="text-[11px] text-slate-400">
                    Согласовал: <span className="text-slate-200 font-semibold">{req.approved_by}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons for Mentor/Lead */}
              {isMentorOrLead && req.status === 'pending_approval' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveAbsence(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors cursor-pointer shadow-md"
                  >
                    Согласовать отгул
                  </button>
                  <button
                    onClick={() => onRejectAbsence(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-500/30 transition-colors cursor-pointer"
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
  );
};
