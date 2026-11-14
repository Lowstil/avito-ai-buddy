import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AbsenceRequest, UserProfile } from '../types';
import { GlassyCalendar, formatRussianDate } from './GlassyCalendar';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
  PlusCircle,
  Sparkles,
  X,
  AlertTriangle,
  FileText,
  Send
} from 'lucide-react';

interface AbsenceViewProps {
  absences: AbsenceRequest[];
  currentUser: UserProfile;
  onCreateAbsence: (startDate: string, reason: string) => void;
  onApproveAbsence: (id: string) => void;
  onRejectAbsence: (id: string, reason?: string) => void;
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');

  // Rejection Modal State
  const [rejectingAbsence, setRejectingAbsence] = useState<AbsenceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Detailed View Modal State
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceRequest | null>(null);

  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  const filteredAbsences = absences.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onCreateAbsence(startDate, reason);
    setReason('');
    setIsFormVisible(false);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAbsence) return;
    const finalReason = rejectionReason.trim() || 'Отклонено наставником в соответствии с графиком спринта';
    onRejectAbsence(rejectingAbsence.id, finalReason);
    setRejectingAbsence(null);
    setRejectionReason('');
  };

  const quickReasonChips = [
    '🎓 Сдача зачёта / экзамена в вузе',
    '🏥 Визит к врачу по записи',
    '🏠 Семейные обстоятельства',
    '🚗 Оформление документов'
  ];

  const quickRejectionReasons = [
    'Высокая нагрузка в спринте',
    'Пересечение с релизом сервиса',
    'Недостаточно отработанных дней',
    'Требуется перенос на следующую неделю'
  ];

  return (
    <div data-testid="absence-view" className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Compact Liquid Glass Header Banner */}
      <div className="glass-panel specular-inset rounded-3xl p-4 sm:p-5 border border-white/15 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="laser-line-green absolute top-0 inset-x-0 opacity-70 pointer-events-none" />

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] glow-green shrink-0"></span>
            <h2 className="text-base sm:text-lg font-black text-glass-pure truncate">
              Кадровый сервис: Отгулы и Day-off
            </h2>
          </div>
          <p className="text-xs text-glass-secondary max-w-3xl leading-relaxed">
            По регламенту Авито каждый стажёр имеет право на <strong className="text-white">2 дня оплачиваемого отгула в месяц</strong> по согласованию с наставником. Выберите дату в интерактивном календаре — наставник получит заявку с подсветкой дня.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="glass-card px-3.5 py-2 rounded-2xl border border-emerald-500/30 flex items-center gap-2.5">
            <Calendar size={16} className="text-[#04E061] shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-glass-muted leading-none">Доступно дней</p>
              <p className="text-sm sm:text-base font-black text-[#04E061] leading-tight mt-0.5">2 дня</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAskBuddy('Как правильно оформить отгул в Авито и сколько дней положено?')}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-2xl glass-pill text-xs font-bold text-[#04E061] hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} className="text-[#04E061] shrink-0" />
            <span>Правила AI-buddy</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormVisible((prev) => !prev)}
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-2xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all flex items-center gap-1.5 glow-green cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Оформить отгул в календаре</span>
          </button>
        </div>
      </div>

      {/* Main Side-by-Side Ergonomic Grid for 1920x1080 Desktop & Responsive Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Column (5 cols on lg): Interactive Calendar + Quick Filing Form */}
        <div className="lg:col-span-5 space-y-3.5 w-full min-w-0">
          <div
            className={`glass-panel specular-inset rounded-3xl p-4 sm:p-5 border transition-all space-y-3.5 ${
              isFormVisible ? 'border-neon-green' : 'border-white/12'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
              <h3 className="text-xs sm:text-sm font-black text-glass-pure flex items-center gap-2">
                <Calendar size={16} className="text-[#04E061] shrink-0" />
                <span>Интерактивный календарь и оформление</span>
              </h3>
              {isFormVisible && (
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="text-[11px] text-glass-muted hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  Скрыть
                </button>
              )}
            </div>

            <GlassyCalendar
              selectedDate={startDate}
              onSelectDate={(newDate) => setStartDate(newDate)}
              existingAbsences={absences}
              interactive={true}
            />

            {/* Selected Date Glowing Summary + Reason Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 specular-inset flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#04E061] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Выбранная дата отгула
                  </span>
                  <p className="text-xs sm:text-sm font-black text-glass-pure truncate mt-0.5">
                    {formatRussianDate(startDate)}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-xl bg-[#04E061]/20 border border-[#04E061]/40 text-[#04E061] text-[10px] font-black shrink-0">
                  -1 день
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] text-glass-secondary font-bold">
                  Причина отсутствия (для согласования с наставником):
                </label>
                <input
                  type="text"
                  placeholder="Например: Сдача зачёта в университете"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-[38px] bg-slate-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#04E061] transition-colors"
                />

                {/* Quick reason chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickReasonChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReason(chip.replace(/^[^\s]+\s*/, ''))}
                      className="min-h-[32px] px-2.5 py-1 rounded-xl glass-pill text-[10px] sm:text-[11px] text-glass-secondary hover:text-white transition-all cursor-pointer text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!reason.trim()}
                className="w-full min-h-[44px] sm:min-h-[40px] py-2.5 px-4 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all disabled:opacity-40 cursor-pointer glow-green flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>Отправить заявку на {startDate}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols on lg): Status Filter Bar & Absence Requests List */}
        <div className="lg:col-span-7 space-y-3.5 w-full min-w-0">
          {/* Status Filter Pills with Mobile Horizontal Scroll Containment */}
          <div className="glass-panel specular-inset rounded-2xl p-2 border border-white/12 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-white/20 text-white border border-white/30 shadow-md'
                    : 'text-glass-muted hover:text-white hover:bg-white/5'
                }`}
              >
                Все ({absences.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending_approval')}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'pending_approval'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'text-glass-muted hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                <Clock size={12} className="shrink-0" />
                <span>На рассмотрении ({absences.filter(a => a.status === 'pending_approval').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-500/25 text-[#04E061] border border-emerald-400/50 glow-green'
                    : 'text-glass-muted hover:text-[#04E061] hover:bg-white/5'
                }`}
              >
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Одобрено ({absences.filter(a => a.status === 'approved').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-500/25 text-[#ff6b6b] border border-rose-400/50 glow-coral'
                    : 'text-glass-muted hover:text-[#ff6b6b] hover:bg-white/5'
                }`}
              >
                <Ban size={12} className="shrink-0" />
                <span>Отклонено ({absences.filter(a => a.status === 'rejected').length})</span>
              </button>
            </div>
          </div>

          {/* Absence Request Cards */}
          <div className="space-y-3 lg:max-h-[calc(100vh-310px)] lg:overflow-y-auto glass-scrollbar pr-0.5">
            {filteredAbsences.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center border border-white/10 text-glass-muted text-xs">
                Нет заявок с выбранным статусом.
              </div>
            ) : (
              filteredAbsences.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedAbsence(req)}
                  className={`glass-card specular-inset rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all cursor-pointer relative overflow-hidden ${
                    req.status === 'approved'
                      ? 'border-emerald-500/35 bg-emerald-950/20 hover:border-[#04E061]/60'
                      : req.status === 'pending_approval'
                      ? 'border-amber-500/35 bg-amber-950/20 hover:border-amber-400/60'
                      : 'border-rose-500/35 bg-rose-950/20 hover:border-[#FF5252]/60'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-xs sm:text-sm text-glass-pure">#{req.id}</span>

                      {/* High-Contrast Status Badges */}
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#04E061] text-[11px] font-extrabold flex items-center gap-1 border border-emerald-500/40 shadow-[0_0_10px_rgba(4,224,97,0.2)]">
                          <CheckCircle2 size={12} /> Одобрено
                        </span>
                      )}
                      {req.status === 'pending_approval' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[11px] font-extrabold flex items-center gap-1 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                          <Clock size={12} /> На рассмотрении
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-[#ff6b6b] text-[11px] font-extrabold flex items-center gap-1 border border-rose-500/40 shadow-[0_0_10px_rgba(255,82,82,0.2)]">
                          <Ban size={12} /> Отклонено
                        </span>
                      )}

                      <span className="text-glass-muted text-xs">
                        Сотрудник: <strong className="text-glass-pure">{req.user_name}</strong>
                      </span>
                    </div>

                    {/* Prominently Formatted Russian Date */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="p-1.5 rounded-lg bg-white/10 text-[#04E061] shrink-0">
                        <Calendar size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-glass-pure block sm:inline">
                          {formatRussianDate(req.start_date)}
                        </span>
                        <span className="text-[11px] text-glass-muted sm:ml-2 block sm:inline">
                          (Day-off • {req.start_date})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-glass-secondary break-words">
                      Причина: <span className="text-glass-pure font-semibold">{req.reason}</span>
                    </p>

                    {/* Rejection Reason display if rejected */}
                    {req.status === 'rejected' && (
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-[#ff6b6b] mt-0.5 shrink-0" />
                        <span>
                          <strong>Причина отказа наставника:</strong> {req.rejection_reason || 'Не указана наставником'}
                        </span>
                      </div>
                    )}

                    {req.approved_by && (
                      <p className="text-[11px] text-glass-muted">
                        Согласовал: <span className="text-[#04E061] font-bold">{req.approved_by}</span>
                      </p>
                    )}
                  </div>

                  {/* Touch-Friendly Action Buttons for Mentor/Lead & Calendar Preview */}
                  <div
                    className="flex flex-wrap sm:flex-col xl:flex-row items-stretch sm:items-end xl:items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isMentorOrLead && req.status === 'pending_approval' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApproveAbsence(req.id)}
                          className="min-h-[44px] sm:min-h-[36px] px-3.5 py-2 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all cursor-pointer glow-green flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Одобрить отгул
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingAbsence(req);
                            setRejectionReason('');
                          }}
                          className="min-h-[44px] sm:min-h-[36px] px-3.5 py-2 rounded-xl bg-rose-500/20 text-[#ff6b6b] border border-rose-500/40 font-extrabold text-xs hover:bg-rose-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Ban size={14} /> Отклонить...
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedAbsence(req)}
                      className="min-h-[44px] sm:min-h-[36px] px-3 py-2 rounded-xl glass-pill text-xs text-glass-secondary hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar size={13} className="text-[#00AAFF] shrink-0" />
                      <span>В календаре →</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* REJECTION REASON MODAL DIALOG (Safe Mobile Viewport max-h-[88dvh]) */}
      <AnimatePresence>
        {rejectingAbsence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-modal glass-panel w-[94vw] max-w-lg max-h-[88dvh] flex flex-col rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
                <h3 className="text-sm sm:text-base font-black text-glass-pure flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#ff6b6b] shrink-0" />
                  <span>Причина отклонения заявки #{rejectingAbsence.id}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectingAbsence(null)}
                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl text-glass-muted hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto glass-scrollbar flex-1">
                {/* Date highlight reminder */}
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
                  <p className="font-bold text-white">
                    🗓️ Заявка на: {formatRussianDate(rejectingAbsence.start_date)}
                  </p>
                  <p className="text-[11px] text-glass-secondary mt-1">
                    Сотрудник: <strong>{rejectingAbsence.user_name}</strong> • Причина: {rejectingAbsence.reason}
                  </p>
                </div>

                <p className="text-xs text-glass-secondary leading-relaxed">
                  Укажите понятную причину отказа для стажёра, чтобы он мог перенести дату:
                </p>

                {/* Quick Reason Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickRejectionReasons.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(chip)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl glass-pill text-[11px] text-glass-secondary hover:text-white transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form id="reject-absence-form" onSubmit={handleConfirmReject} className="space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Опишите причину отказа (например, дежурство или релизный день)..."
                    rows={3}
                    required
                    className="w-full bg-slate-950/90 border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF5252]"
                  />
                </form>
              </div>

              <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setRejectingAbsence(null)}
                  className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold text-glass-muted hover:text-white cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  form="reject-absence-form"
                  disabled={!rejectionReason.trim()}
                  className="min-h-[44px] sm:min-h-[38px] px-5 py-2 rounded-xl bg-[#FF5252] text-white font-extrabold text-xs hover:bg-rose-600 transition-colors disabled:opacity-40 cursor-pointer glow-coral"
                >
                  Отклонить заявку
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL REQUEST DETAIL & CALENDAR HIGHLIGHT MODAL (Safe Mobile Viewport max-h-[88dvh]) */}
      <AnimatePresence>
        {selectedAbsence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-modal glass-panel w-[94vw] max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-[#04E061] shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-glass-pure truncate">
                    Карточка заявки #{selectedAbsence.id} в календаре
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAbsence(null)}
                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl text-glass-muted hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto glass-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Calendar with Highlighted Day */}
                  <div className="md:col-span-6 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-glass-muted block">
                      Подсветка дня в календаре месяца:
                    </span>
                    <GlassyCalendar
                      highlightDate={selectedAbsence.start_date}
                      highlightStatus={selectedAbsence.status}
                      interactive={false}
                    />
                  </div>

                  {/* Right Column: Detailed Textual Information */}
                  <div className="md:col-span-6 space-y-3 text-xs">
                    <div
                      className={`p-4 rounded-2xl border ${
                        selectedAbsence.status === 'approved'
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : selectedAbsence.status === 'pending_approval'
                          ? 'bg-amber-950/40 border-amber-500/40'
                          : 'bg-rose-950/40 border-rose-500/40'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-black text-glass-muted block mb-1">
                        Запрошенный день:
                      </span>
                      <p className="text-sm font-black text-glass-pure flex items-center gap-1.5">
                        <Calendar size={16} className="text-[#04E061] shrink-0" />
                        <span>{formatRussianDate(selectedAbsence.start_date)}</span>
                      </p>
                      <p className="text-[11px] text-glass-secondary mt-1">
                        Статус:{' '}
                        <strong className="text-white">
                          {selectedAbsence.status === 'approved' && '✅ Одобрено наставником'}
                          {selectedAbsence.status === 'pending_approval' && '⏳ Ожидает решения'}
                          {selectedAbsence.status === 'rejected' && '❌ Заявка отклонена'}
                        </strong>
                      </p>
                    </div>

                    <div className="glass-card p-3.5 rounded-2xl border border-white/10 space-y-2">
                      <div>
                        <span className="text-glass-muted block text-[10px] uppercase font-semibold">Сотрудник:</span>
                        <span className="font-bold text-glass-pure text-xs">{selectedAbsence.user_name}</span>
                      </div>
                      <div>
                        <span className="text-glass-muted block text-[10px] uppercase font-semibold">Причина стажёра:</span>
                        <span className="text-glass-primary text-xs font-medium">{selectedAbsence.reason}</span>
                      </div>
                      {selectedAbsence.approved_by && (
                        <div>
                          <span className="text-glass-muted block text-[10px] uppercase font-semibold">Согласующий:</span>
                          <span className="text-[#04E061] text-xs font-bold">{selectedAbsence.approved_by}</span>
                        </div>
                      )}
                    </div>

                    {selectedAbsence.status === 'rejected' && (
                      <div className="bg-rose-950/40 p-3.5 rounded-2xl border border-rose-500/40 space-y-1">
                        <span className="text-[#ff6b6b] block text-[10px] uppercase font-bold">Причина отклонения:</span>
                        <p className="text-rose-100 text-xs font-medium leading-relaxed">
                          {selectedAbsence.rejection_reason || 'Причина не указана'}
                        </p>
                      </div>
                    )}

                    {/* Mentor Action directly from modal if pending */}
                    {isMentorOrLead && selectedAbsence.status === 'pending_approval' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onApproveAbsence(selectedAbsence.id);
                            setSelectedAbsence(null);
                          }}
                          className="flex-1 min-h-[44px] sm:min-h-[38px] py-2 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-colors cursor-pointer flex items-center justify-center gap-1.5 glow-green"
                        >
                          <CheckCircle2 size={14} /> Одобрить
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const target = selectedAbsence;
                            setSelectedAbsence(null);
                            setRejectingAbsence(target);
                            setRejectionReason('');
                          }}
                          className="flex-1 min-h-[44px] sm:min-h-[38px] py-2 rounded-xl bg-rose-500/20 text-[#ff6b6b] border border-rose-500/40 font-extrabold text-xs hover:bg-rose-500/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Ban size={14} /> Отклонить...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onAskBuddy('Какие правила отгулов действуют в Авито для стажёров?');
                    setSelectedAbsence(null);
                  }}
                  className="min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl text-xs text-[#04E061] font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} /> Спросить совет у AI-buddy
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAbsence(null)}
                  className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl glass-pill text-white font-bold text-xs hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Закрыть окно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
