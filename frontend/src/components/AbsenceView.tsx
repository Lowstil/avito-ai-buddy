import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { AbsenceRequest, UserProfile } from '../types';
import { GlassyCalendar, formatRussianDate } from './GlassyCalendar';
import { Calendar, CheckCircle2, Clock, Ban, PlusCircle, Sparkles, X, AlertTriangle, FileText } from 'lucide-react';

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
    <div className="space-y-6">
      
      {/* Top Banner: Rules & Balance */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04E061]"></span>
            <h2 className="text-xl font-black text-white">Кадровый сервис: Отгулы и Day-off</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            По регламенту Авито, каждый стажёр имеет право на <strong>2 дня оплачиваемого отгула в месяц</strong> по согласованию с наставником. Выберите желаемую дату в интерактивном календаре — наставник получит заявку с наглядной подсветкой дня.
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
              Оформить отгул в календаре
            </button>
          )}
        </div>
      </div>

      {/* FORM: Interactive Calendar Selection for Intern */}
      {isFormVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 border border-[#04E061]/30 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Calendar size={18} className="text-[#04E061]" />
              Выбор даты отгула в календаре
            </h3>
            <button
              onClick={() => setIsFormVisible(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Отмена
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Month Calendar */}
            <div className="md:col-span-6 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                1. Нажмите на желаемый день в календаре:
              </label>
              <GlassyCalendar
                selectedDate={startDate}
                onSelectDate={(newDate) => setStartDate(newDate)}
                existingAbsences={absences}
                interactive={true}
              />
            </div>

            {/* Right: Selected Date Summary & Reason Input */}
            <div className="md:col-span-6 space-y-4">
              <label className="block text-xs font-bold text-slate-300">
                2. Подтверждение и причина отсутствия:
              </label>

              {/* Glowing Date Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-lg space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Выбранная дата
                </span>
                <p className="text-sm font-black text-white">
                  {formatRussianDate(startDate)}
                </p>
                <p className="text-[11px] text-slate-300">
                  Будет списан 1 день из вашего ежемесячного лимита отгулов (баланс: 2 дня).
                </p>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <label className="block text-[11px] text-slate-400 font-semibold">
                  Укажите причину отсутствия:
                </label>
                <input
                  type="text"
                  placeholder="Например: Сдача зачёта в университете"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#04E061]"
                />

                {/* Quick reason chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickReasonChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReason(chip.replace(/^[^\s]+\s*/, ''))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-slate-300 border border-white/10 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reason.trim()}
                  className="px-5 py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors disabled:opacity-40 cursor-pointer shadow-lg shadow-[#04E061]/20 flex items-center gap-1.5"
                >
                  <Calendar size={14} />
                  Отправить заявку на {startDate}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Role Notice & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Все ({absences.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending_approval'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Clock size={12} />
            На рассмотрении ({absences.filter(a => a.status === 'pending_approval').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 size={12} />
            Одобрено ({absences.filter(a => a.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Ban size={12} />
            Отклонено ({absences.filter(a => a.status === 'rejected').length})
          </button>
        </div>

        {/* Ask Buddy Pill */}
        <button
          onClick={() => onAskBuddy('Как правильно оформить отгул в Авито и сколько дней положено?')}
          className="text-xs text-[#04E061] font-bold hover:underline flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles size={14} /> Спросить правила у AI-buddy
        </button>
      </div>

      {/* List of Absences with Calendar Highlights and Repeated Date */}
      <div className="space-y-3">
        {filteredAbsences.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 text-slate-400 text-xs">
            Нет заявок с выбранным статусом.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAbsences.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedAbsence(req)}
                className={`glass-card rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer hover:border-white/30 ${
                  req.status === 'approved'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : req.status === 'pending_approval'
                    ? 'border-amber-500/30 bg-amber-950/20'
                    : 'border-rose-500/30 bg-rose-950/20'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-sm text-white">#{req.id}</span>
                    
                    {/* Clear Status Badges */}
                    {req.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> Одобрено
                      </span>
                    )}
                    {req.status === 'pending_approval' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30">
                        <Clock size={12} /> На рассмотрении
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30">
                        <Ban size={12} /> Отклонено
                      </span>
                    )}

                    <span className="text-slate-400 text-xs">
                      Сотрудник: <strong className="text-white">{req.user_name}</strong>
                    </span>
                  </div>

                  {/* PROMINENTLY REPEATED FORMATTED DATE IN WORDS */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="p-1.5 rounded-lg bg-white/10 text-[#04E061] shrink-0">
                      <Calendar size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white">
                        {formatRussianDate(req.start_date)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        (Оплачиваемый день отдыха)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Причина: <span className="text-white font-medium">{req.reason}</span>
                  </p>

                  {/* Rejection Reason display if rejected */}
                  {req.status === 'rejected' && (
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-[11px] text-rose-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                      <span>
                        <strong>Причина отказа наставника:</strong> {req.rejection_reason || 'Не указана наставником'}
                      </span>
                    </div>
                  )}

                  {req.approved_by && (
                    <p className="text-[11px] text-slate-400">
                      Согласовал: <span className="text-white font-semibold">{req.approved_by}</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons for Mentor/Lead */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isMentorOrLead && req.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => onApproveAbsence(req.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Одобрить отгул
                      </button>
                      <button
                        onClick={() => {
                          setRejectingAbsence(req);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Ban size={14} /> Отклонить...
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedAbsence(req)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Calendar size={13} className="text-[#00AAFF]" />
                    Показать в календаре →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL DIALOG */}
      {rejectingAbsence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-rose-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                Причина отклонения заявки #{rejectingAbsence.id}
              </h3>
              <button
                onClick={() => setRejectingAbsence(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Date highlight reminder */}
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              <p className="font-bold">
                🗓️ Заявка на: {formatRussianDate(rejectingAbsence.start_date)}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Сотрудник: <strong>{rejectingAbsence.user_name}</strong> • Причина: {rejectingAbsence.reason}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Укажите понятную причину отказа для стажёра, чтобы он мог перенести дату:
            </p>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickRejectionReasons.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectionReason(chip)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 border border-white/10 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Опишите причину отказа (например, дежурство или релизный день)..."
                rows={3}
                required
                className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-400"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingAbsence(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors disabled:opacity-40 cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  Отклонить заявку с указанием причины
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* FULL REQUEST DETAIL & CALENDAR HIGHLIGHT MODAL */}
      {selectedAbsence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#04E061]" />
                <h3 className="text-base font-black text-white">
                  Карточка заявки #{selectedAbsence.id} с подсветкой в календаре
                </h3>
              </div>
              <button
                onClick={() => setSelectedAbsence(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Calendar with Highlighted Day */}
              <div className="md:col-span-6 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Подсветка дня в календаре месяца:
                </span>
                <GlassyCalendar
                  highlightDate={selectedAbsence.start_date}
                  highlightStatus={selectedAbsence.status}
                  interactive={false}
                />
              </div>

              {/* Right Column: Detailed Repeated Textual Information */}
              <div className="md:col-span-6 space-y-3 text-xs">
                
                {/* Highlighted Banner with Date */}
                <div className={`p-4 rounded-2xl border ${
                  selectedAbsence.status === 'approved'
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : selectedAbsence.status === 'pending_approval'
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-rose-950/40 border-rose-500/40'
                }`}>
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                    Запрошенный день:
                  </span>
                  <p className="text-sm font-black text-white flex items-center gap-1.5">
                    <Calendar size={16} className="text-[#04E061]" />
                    {formatRussianDate(selectedAbsence.start_date)}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Статус: <strong>
                      {selectedAbsence.status === 'approved' && '✅ Одобрено наставником'}
                      {selectedAbsence.status === 'pending_approval' && '⏳ Ожидает решения'}
                      {selectedAbsence.status === 'rejected' && '❌ Заявка отклонена'}
                    </strong>
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Сотрудник:</span>
                    <span className="font-bold text-white text-xs">{selectedAbsence.user_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Причина стажёра:</span>
                    <span className="text-slate-200 text-xs font-medium">{selectedAbsence.reason}</span>
                  </div>
                  {selectedAbsence.approved_by && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Согласующий:</span>
                      <span className="text-emerald-400 text-xs font-semibold">{selectedAbsence.approved_by}</span>
                    </div>
                  )}
                </div>

                {selectedAbsence.status === 'rejected' && (
                  <div className="bg-rose-950/30 p-3.5 rounded-2xl border border-rose-500/30 space-y-1">
                    <span className="text-rose-300 block text-[10px] uppercase font-bold">Причина отклонения:</span>
                    <p className="text-rose-100 text-xs font-medium leading-relaxed">
                      {selectedAbsence.rejection_reason || 'Причина не указана'}
                    </p>
                  </div>
                )}

                {/* Mentor Action directly from modal if pending */}
                {isMentorOrLead && selectedAbsence.status === 'pending_approval' && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onApproveAbsence(selectedAbsence.id);
                        setSelectedAbsence(null);
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-md"
                    >
                      <CheckCircle2 size={13} /> Одобрить
                    </button>
                    <button
                      onClick={() => {
                        const target = selectedAbsence;
                        setSelectedAbsence(null);
                        setRejectingAbsence(target);
                        setRejectionReason('');
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-500/30 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Ban size={13} /> Отклонить...
                    </button>
                  </div>
                )}

              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  onAskBuddy(`Какие правила отгулов действуют в Авито для стажёров?`);
                  setSelectedAbsence(null);
                }}
                className="text-xs text-[#04E061] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={13} /> Спросить совет у AI-buddy
              </button>

              <button
                onClick={() => setSelectedAbsence(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors cursor-pointer"
              >
                Закрыть окно
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
