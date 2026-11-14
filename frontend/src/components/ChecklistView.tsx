import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChecklistTask, ChecklistSummary } from '../types';
import { api } from '../api/client';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  X,
  BookOpen,
  Edit3,
  Check,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistViewProps {
  tasks: ChecklistTask[];
  summary: ChecklistSummary | null;
  activeUserId?: string;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onAskBuddyAboutTask: (taskTitle: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'xp' | 'info' | 'warning') => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  tasks,
  summary,
  activeUserId,
  onToggleTask,
  onAskBuddyAboutTask,
  onShowToast,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTask, setActiveModalTask] = useState<ChecklistTask | null>(null);
  const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({
    'task_be_4': 'Обсудил с наставником Алексеем, настроили алерты в Sentry для сервиса доставки.'
  });

  useEffect(() => {
    const loadedNotes: Record<string, string> = {};
    tasks.forEach((t) => {
      if (t.notes) {
        loadedNotes[t.id] = t.notes;
      }
    });
    setTaskNotes((prev) => ({ ...loadedNotes, ...prev }));
  }, [tasks]);

  // Close modal on Escape key & lock body scroll when modal is open
  useEffect(() => {
    if (!activeModalTask) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalTask]);

  const handleSaveNote = async (taskId: string, notes: string) => {
    try {
      await api.updateTaskNote(activeUserId || 'intern_1', taskId, notes);
      setIsSavedMap((prev) => ({ ...prev, [taskId]: true }));
      if (onShowToast) {
        onShowToast('Заметка успешно сохранена на сервере', 'success');
      }
      setTimeout(() => {
        setIsSavedMap((prev) => ({ ...prev, [taskId]: false }));
      }, 3000);
    } catch (e) {
      console.error('Failed to save task note:', e);
      if (onShowToast) {
        onShowToast('Не удалось сохранить заметку', 'warning');
      }
    }
  };

  const periods = [
    { key: 'all', label: 'Все этапы' },
    { key: 'week_1', label: '1 неделя' },
    { key: 'week_2', label: '2 неделя' },
    { key: 'month_1', label: '1 месяц' },
    { key: 'equator', label: 'Экватор (3 мес)' },
  ];

  const categories = [
    { key: 'all', label: 'Все категории' },
    { key: 'backend', label: 'Backend' },
    { key: 'general', label: 'Общее' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchPeriod = selectedPeriod === 'all' || t.period === selectedPeriod;
    const matchCategory =
      selectedCategory === 'all' ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.period_title.toLowerCase().includes(q);
    return matchPeriod && matchCategory && matchSearch;
  });

  const handleCheck = (e: React.MouseEvent, task: ChecklistTask) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    if (newStatus === 'completed') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#04E061', '#00AAFF', '#965EEB']
      });
      if (onShowToast) {
        onShowToast(`Задача "${task.title.slice(0, 30)}..." выполнена! +50 XP`, 'xp');
      }
    }
    onToggleTask(task.id, task.status);
  };

  const resetFilters = () => {
    setSelectedPeriod('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div
      data-testid="checklist-view"
      className="glass-panel glass-elev-2 glass-specular specular-inset rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl space-y-4 sm:space-y-5 relative overflow-hidden"
    >
      {/* Top Specular Edge Highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] laser-line-spectrum pointer-events-none" />

      {/* Header & Progress Banner */}
      <div className="glass-card glass-elev-1 rounded-2xl p-3.5 sm:p-4 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
              <span className="p-1.5 rounded-xl bg-[#04E061]/15 border border-[#04E061]/30 text-[#04E061] shadow-[0_0_12px_rgba(4,224,97,0.25)] shrink-0">
                <CheckCircle2 size={18} />
              </span>
              <span className="truncate">Чек-лист адаптации стажёра</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Нажмите на любую задачу, чтобы открыть подробное описание и добавить заметки
            </p>
          </div>

          {summary && (
            <div className="flex items-center justify-between sm:justify-end gap-2.5 glass-pill px-3.5 py-2 rounded-2xl border border-white/15 shrink-0">
              <span className="text-xs font-medium text-slate-300">Прогресс:</span>
              <span className="text-sm sm:text-base font-black text-[#04E061] text-glow-green">
                {summary.progress_percentage}%
              </span>
              <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                {summary.completed_tasks}/{summary.total_tasks}
              </span>
            </div>
          )}
        </div>

        {/* Liquid Progress Bar */}
        {summary && (
          <div className="w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, summary.progress_percentage))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#04E061] via-[#00AAFF] to-[#965EEB] shadow-[0_0_14px_rgba(4,224,97,0.65)]"
            />
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        {/* Stage Filter Pills (Horizontal scroll on mobile with no-scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
          {periods.map((p) => {
            const isActive = selectedPeriod === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPeriod(p.key)}
                className={`min-h-[40px] sm:min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'glass-pill glass-pill-active bg-gradient-to-r from-[#04E061]/25 to-[#00AAFF]/20 text-white border border-[#04E061]/50 shadow-[0_0_15px_rgba(4,224,97,0.25)]'
                    : 'glass-pill text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search Input & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Search Bar (glass-input) */}
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск задачи..."
              aria-label="Поиск задачи по чек-листу"
              className="glass-input w-full pl-8 pr-7 py-1.5 min-h-[40px] sm:min-h-[34px] rounded-xl bg-slate-900/70 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#04E061]/60 focus:shadow-[0_0_15px_rgba(4,224,97,0.2)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Очистить поиск"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Pill Filters */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar shrink-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`min-h-[36px] sm:min-h-[28px] px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? cat.key === 'all'
                        ? 'glass-pill-active bg-[#00AAFF] text-slate-950 shadow-[0_0_12px_rgba(0,170,255,0.4)]'
                        : cat.key === 'backend'
                        ? 'glass-pill-active bg-[#965EEB] text-white shadow-[0_0_12px_rgba(150,94,235,0.4)]'
                        : 'glass-pill-active bg-[#04E061] text-slate-950 shadow-[0_0_12px_rgba(4,224,97,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.key === 'all' ? 'Все' : cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks Grid / List — Balanced 2-col on Desktop Full HD to eliminate double-scroll traps, 1-col on mobile */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Filter size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Задачи по выбранным фильтрам не найдены</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Попробуйте изменить период адаптации, категорию или поисковый запрос.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="glass-pill px-4 py-2 rounded-xl text-xs font-bold text-[#04E061] hover:text-white border border-[#04E061]/30 cursor-pointer"
          >
            Сбросить все фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onClick={() => setActiveModalTask(task)}
                  data-testid={`checklist-task-${task.id}`}
                  className={`glass-card glass-card-interactive glass-specular p-3.5 sm:p-4 rounded-2xl flex items-start gap-3 transition-all cursor-pointer group relative overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/50'
                      : isInProgress
                      ? 'bg-sky-950/20 border-[#00AAFF]/35 hover:border-[#00AAFF]/60'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  {/* Checkbox Button (>= 44x44px touch target on mobile) */}
                  <button
                    type="button"
                    onClick={(e) => handleCheck(e, task)}
                    aria-label={isCompleted ? 'Вернуть задачу в работу' : 'Отметить задачу выполненной'}
                    className="w-11 h-11 sm:w-9 sm:h-9 -ml-1.5 -mt-1 sm:ml-0 sm:mt-0 rounded-xl flex items-center justify-center text-slate-300 hover:text-[#04E061] hover:bg-white/10 transition-all cursor-pointer shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={21} className="text-[#04E061] fill-[#04E061]/20 drop-shadow-[0_0_8px_rgba(4,224,97,0.4)]" />
                    ) : isInProgress ? (
                      <Clock size={21} className="text-[#00AAFF] drop-shadow-[0_0_8px_rgba(0,170,255,0.4)]" />
                    ) : (
                      <Circle size={21} className="text-slate-400 group-hover:text-white transition-colors" />
                    )}
                  </button>

                  {/* Task Details Preview */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-slate-200 font-semibold shrink-0">
                          {task.period_title}
                        </span>
                        {task.category === 'Backend' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#965EEB]/20 text-purple-200 font-bold border border-[#965EEB]/40 shrink-0">
                            Backend
                          </span>
                        )}
                        {task.priority === 'high' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FF5252]/20 text-rose-200 font-bold border border-[#FF5252]/40 shrink-0">
                            Важно
                          </span>
                        )}
                        {taskNotes[task.id] && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                            Есть заметка
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-bold leading-snug break-words ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mt-1 max-w-[68ch]">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskBuddyAboutTask(task.title);
                        }}
                        className="min-h-[36px] sm:min-h-[28px] px-2.5 py-1 rounded-lg bg-[#00AAFF]/10 hover:bg-[#00AAFF]/20 border border-[#00AAFF]/30 text-[11px] font-bold text-[#00AAFF] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sparkles size={12} className="shrink-0" />
                        <span>Спросить совет у AI-buddy</span>
                      </button>

                      <span className="text-[11px] text-slate-400 font-semibold group-hover:text-white flex items-center gap-0.5 transition-colors ml-auto">
                        <span>Подробнее</span>
                        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* DETAILED TASK MODAL / DRAWER (Safe Modal Contract: max-h-[88dvh], flex-col, scrollable body) */}
      {activeModalTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setActiveModalTask(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel glass-modal glass-elev-3 glass-specular w-[94vw] max-w-2xl max-h-[88dvh] mx-auto rounded-3xl border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3.5 border-b border-white/10 shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-slate-200">
                    {activeModalTask.period_title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#965EEB]/20 text-purple-200 text-[11px] font-bold border border-[#965EEB]/40">
                    {activeModalTask.category} трек
                  </span>
                  {activeModalTask.status === 'completed' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40 text-[11px] font-bold">
                      ✓ Выполнено
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug break-words">
                  {activeModalTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTask(null)}
                aria-label="Закрыть модальное окно"
                className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto glass-scrollbar p-4 sm:p-6 space-y-4">
              {/* Full Task Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#00AAFF]" />
                  Подробное описание задачи
                </h4>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed glass-card p-3.5 sm:p-4 rounded-2xl border border-white/10">
                  {activeModalTask.description}
                </p>
              </div>

              {/* Criteria for success */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Что ожидается от стажёра:
                </h4>
                <ul className="text-xs text-slate-200 space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-[#04E061] shrink-0 mt-0.5" />
                    <span>Изучить материалы регламента в AvitoTech Playbook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-[#04E061] shrink-0 mt-0.5" />
                    <span>Обсудить непонятные моменты на ближайшей встрече 1:1 с наставником</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-[#04E061] shrink-0 mt-0.5" />
                    <span>Применить стандарт в первом рабочем мерж-реквесте</span>
                  </li>
                </ul>
              </div>

              {/* Personal Notes (User editable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Edit3 size={14} className="text-[#965EEB]" />
                    Мои личные заметки по задаче:
                  </h4>
                  {isSavedMap[activeModalTask.id] && (
                    <span className="text-[11px] font-bold text-[#04E061] flex items-center gap-1">
                      <Check size={12} />
                      Сохранено на сервере
                    </span>
                  )}
                </div>
                <textarea
                  value={taskNotes[activeModalTask.id] || ''}
                  onChange={(e) => setTaskNotes({ ...taskNotes, [activeModalTask.id]: e.target.value })}
                  onBlur={(e) => handleSaveNote(activeModalTask.id, e.target.value)}
                  placeholder="Запишите сюда вопросы для 1:1, важные ссылки или договорённости с наставником..."
                  rows={3}
                  className="glass-input w-full bg-slate-900/90 border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#04E061] focus:shadow-[0_0_15px_rgba(4,224,97,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-4 sm:px-6 sm:py-4 border-t border-white/10 bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onAskBuddyAboutTask(activeModalTask.title);
                  setActiveModalTask(null);
                }}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl glass-pill text-xs font-bold text-[#00AAFF] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer border border-[#00AAFF]/30"
              >
                <Sparkles size={14} />
                <span>Спросить совет у AI-buddy</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  handleCheck(e, activeModalTask);
                  setActiveModalTask(null);
                }}
                className={`min-h-[44px] sm:min-h-[38px] px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center ${
                  activeModalTask.status === 'completed'
                    ? 'glass-pill bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'
                    : 'bg-[#04E061] text-slate-950 hover:bg-[#03c754] shadow-[0_0_20px_rgba(4,224,97,0.35)]'
                }`}
              >
                {activeModalTask.status === 'completed' ? 'Вернуть в работу' : 'Отметить выполненной'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
