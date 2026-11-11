import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChecklistTask, ChecklistSummary } from '../types';
import { api } from '../api/client';
import { CheckCircle2, Circle, Clock, Sparkles, X, BookOpen, Edit3, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistViewProps {
  tasks: ChecklistTask[];
  summary: ChecklistSummary | null;
  activeUserId?: string;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onAskBuddyAboutTask: (taskTitle: string) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  tasks,
  summary,
  activeUserId,
  onToggleTask,
  onAskBuddyAboutTask
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalTask, setActiveModalTask] = useState<ChecklistTask | null>(null);
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

  const handleSaveNote = async (taskId: string, notes: string) => {
    try {
      await api.updateTaskNote(activeUserId || 'intern_1', taskId, notes);
    } catch (e) {
      console.error('Failed to save task note:', e);
    }
  };

  const periods = [
    { key: 'all', label: 'Все этапы' },
    { key: 'week_1', label: '1 неделя' },
    { key: 'week_2', label: '2 неделя' },
    { key: 'month_1', label: '1 месяц' },
    { key: 'equator', label: 'Экватор (3 мес)' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchPeriod = selectedPeriod === 'all' || t.period === selectedPeriod;
    const matchCategory = selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchPeriod && matchCategory;
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
    }
    onToggleTask(task.id, task.status);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
      
      {/* Header & Progress Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 size={20} className="text-[#04E061]" />
              Чек-лист адаптации стажёра
            </h3>
            <p className="text-xs text-slate-400">
              Нажмите на любую задачу, чтобы открыть подробное описание и добавить заметки
            </p>
          </div>

          {summary && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl">
              <span className="text-xs text-slate-400">Прогресс:</span>
              <span className="text-sm font-black text-[#04E061]">{summary.progress_percentage}%</span>
              <span className="text-xs text-slate-500">
                ({summary.completed_tasks}/{summary.total_tasks})
              </span>
            </div>
          )}
        </div>

        {/* Liquid Progress Bar */}
        {summary && (
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.progress_percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#04E061] via-[#00AAFF] to-[#965EEB] shadow-[0_0_12px_#04E061]"
            />
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedPeriod(p.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === p.key
                  ? 'bg-white/15 text-white border border-white/20 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              selectedCategory === 'all' ? 'bg-[#00AAFF] text-white' : 'text-slate-400'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setSelectedCategory('backend')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              selectedCategory === 'backend' ? 'bg-[#965EEB] text-white' : 'text-slate-400'
            }`}
          >
            Backend
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              selectedCategory === 'general' ? 'bg-[#04E061] text-black font-bold' : 'text-slate-400'
            }`}
          >
            Общее
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setActiveModalTask(task)}
              className={`glass-card p-4 rounded-2xl flex items-start gap-3.5 transition-all cursor-pointer hover:border-white/25 ${
                task.status === 'completed'
                  ? 'bg-emerald-950/15 border-emerald-500/20'
                  : task.status === 'in_progress'
                  ? 'bg-blue-950/15 border-blue-500/25'
                  : ''
              }`}
            >
              {/* Checkbox Button */}
              <button
                onClick={(e) => handleCheck(e, task)}
                className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 size={20} className="text-[#04E061] fill-[#04E061]/20" />
                ) : task.status === 'in_progress' ? (
                  <Clock size={20} className="text-[#00AAFF]" />
                ) : (
                  <Circle size={20} className="hover:text-slate-200" />
                )}
              </button>

              {/* Task Details Preview */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4
                    className={`text-sm font-bold ${
                      task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-medium">
                    {task.period_title}
                  </span>
                  {task.category === 'Backend' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      Backend
                    </span>
                  )}
                  {task.priority === 'high' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                      Важно
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {task.description}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskBuddyAboutTask(task.title);
                    }}
                    className="text-[11px] font-semibold text-[#00AAFF] hover:text-[#38bdf8] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    Спросить совет у AI-buddy
                  </button>

                  <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-300">
                    Открыть подробнее →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DETAILED TASK MODAL / DRAWER */}
      {activeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-slate-300">
                    {activeModalTask.period_title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                    {activeModalTask.category} трек
                  </span>
                  {activeModalTask.status === 'completed' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      ✓ Выполнено
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-white">{activeModalTask.title}</h3>
              </div>
              <button
                onClick={() => setActiveModalTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Full Task Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#00AAFF]" />
                Подробное описание задачи
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                {activeModalTask.description}
              </p>
            </div>

            {/* Criteria for success */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Что ожидается от стажёра:
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#04E061]" />
                  <span>Изучить материалы регламента в AvitoTech Playbook</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#04E061]" />
                  <span>Обсудить непонятные моменты на ближайшей встрече 1:1 с наставником</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#04E061]" />
                  <span>Применить стандарт в первом рабочем мерж-реквесте</span>
                </li>
              </ul>
            </div>

            {/* Personal Notes (User editable) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Edit3 size={14} className="text-[#965EEB]" />
                Мои личные заметки по задаче:
              </h4>
              <textarea
                value={taskNotes[activeModalTask.id] || ''}
                onChange={(e) => setTaskNotes({ ...taskNotes, [activeModalTask.id]: e.target.value })}
                onBlur={(e) => handleSaveNote(activeModalTask.id, e.target.value)}
                placeholder="Запишите сюда вопросы для 1:1, важные ссылки или договорённости с наставником..."
                rows={3}
                className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#04E061]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  onAskBuddyAboutTask(activeModalTask.title);
                  setActiveModalTask(null);
                }}
                className="px-4 py-2 rounded-xl glass-pill text-xs font-bold text-[#00AAFF] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                Спросить совет у AI-buddy
              </button>

              <button
                onClick={(e) => {
                  handleCheck(e, activeModalTask);
                  setActiveModalTask(null);
                }}
                className={`px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-lg transition-colors ${
                  activeModalTask.status === 'completed'
                    ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                    : 'bg-[#04E061] text-slate-950 hover:bg-[#03c754]'
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
