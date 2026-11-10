import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChecklistTask, ChecklistSummary } from '../types';
import { CheckCircle2, Circle, Clock, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistViewProps {
  tasks: ChecklistTask[];
  summary: ChecklistSummary | null;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onAskBuddyAboutTask: (taskTitle: string) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  tasks,
  summary,
  onToggleTask,
  onAskBuddyAboutTask
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const handleCheck = (task: ChecklistTask) => {
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
              Официальный маршрут онбординга Авито (Backend трек)
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
              className={`glass-card p-4 rounded-2xl flex items-start gap-3.5 transition-all ${
                task.status === 'completed'
                  ? 'bg-emerald-950/15 border-emerald-500/20'
                  : task.status === 'in_progress'
                  ? 'bg-blue-950/15 border-blue-500/25'
                  : ''
              }`}
            >
              {/* Checkbox Button */}
              <button
                onClick={() => handleCheck(task)}
                className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 size={20} className="text-[#04E061] fill-[#04E061]/20" />
                ) : task.status === 'in_progress' ? (
                  <Clock size={20} className="text-[#00AAFF]" />
                ) : (
                  <Circle size={20} className="hover:text-slate-200" />
                )}
              </button>

              {/* Task Details */}
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

                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  {task.description}
                </p>

                {/* Action Buttons for Task */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onAskBuddyAboutTask(task.title)}
                    className="text-[11px] font-semibold text-[#00AAFF] hover:text-[#38bdf8] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    Спросить AI-buddy как выполнить
                  </button>

                  {task.resource_link && (
                    <a
                      href={task.resource_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 ml-2 cursor-pointer"
                    >
                      <ExternalLink size={11} />
                      Материалы
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};
