import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  CheckSquare,
  Code2,
  Trophy,
  Calendar,
  Shield,
  User,
  Zap,
  BookOpen,
  ArrowRight,
  X,
  CornerDownLeft,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onSwitchUser: (userId: string) => void;
  onAskAI: (question: string) => void;
  users: UserProfile[];
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Разделы' | 'Ролевая модель (RBAC)' | 'Быстрые действия' | 'Стандарты инженерии AvitoTech';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSwitchUser,
  onAskAI,
  users,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build commands
  const allCommands: CommandItem[] = [
    // Tabs
    {
      id: 'tab-chat',
      title: 'AI-Наставник (Диалог)',
      subtitle: 'Задать вопрос ко-пилоту по онбордингу или процессам',
      category: 'Разделы',
      icon: MessageSquare,
      action: () => { onSelectTab('chat'); onClose(); },
    },
    {
      id: 'tab-checklist',
      title: 'Инженерный чек-лист',
      subtitle: 'Задачи стажировки, критерии приемки и заметки',
      category: 'Разделы',
      icon: CheckSquare,
      action: () => { onSelectTab('checklist'); onClose(); },
    },
    {
      id: 'tab-code-review',
      title: 'Pre-flight Code Review Playground',
      subtitle: 'Интеллектуальный анализатор кода Go / Python по стандартам ZBP',
      category: 'Разделы',
      icon: Code2,
      action: () => { onSelectTab('code-review'); onClose(); },
    },
    {
      id: 'tab-achievements',
      title: 'Бейджи и уровни онбординга (XP)',
      subtitle: 'Карьерный трек от стажёра до Junior Backend оффера',
      category: 'Разделы',
      icon: Trophy,
      action: () => { onSelectTab('achievements'); onClose(); },
    },
    {
      id: 'tab-absences',
      title: 'Отгулы и календарь отсутствий',
      subtitle: 'Оформление Day-off (до 2 дней в месяц) и согласование',
      category: 'Разделы',
      icon: Calendar,
      action: () => { onSelectTab('absences'); onClose(); },
    },
    {
      id: 'tab-access',
      title: 'Управление доступами (RBAC)',
      subtitle: 'Запрос прав к SPT, Kubernetes Lens, Kafka, GitLab',
      category: 'Разделы',
      icon: Shield,
      action: () => { onSelectTab('access'); onClose(); },
    },

    // Users
    ...users.map((u) => ({
      id: `user-${u.user_id}`,
      title: `Переключить роль: ${u.name}`,
      subtitle: u.role === 'intern' ? '🎓 Стажёр Backend' : u.role === 'mentor' ? '👨‍💻 Наставник (Buddy)' : '👩‍💼 Тимлид команды',
      category: 'Ролевая модель (RBAC)' as const,
      icon: User,
      action: () => { onSwitchUser(u.user_id); onClose(); },
    })),

    // Quick Actions
    {
      id: 'qa-dayoff',
      title: 'Оформить отгул через AI-Buddy',
      subtitle: 'Открыть диалог с быстрым запросом отгула',
      category: 'Быстрые действия',
      icon: Zap,
      action: () => {
        onSelectTab('chat');
        onAskAI('Мне нужен отгул на пятницу, помоги оформить заявку');
        onClose();
      },
    },
    {
      id: 'qa-review-help',
      title: 'Чек-лист подготовки к код-ревью ментора',
      subtitle: 'Как подготовить PR без блокеров по ZBP',
      category: 'Быстрые действия',
      icon: Zap,
      action: () => {
        onSelectTab('chat');
        onAskAI('Как подготовить Pull Request к ревью, чтобы ментор не нашел замечаний?');
        onClose();
      },
    },
    {
      id: 'qa-1on1',
      title: 'Подготовка к встрече 1:1 с наставником',
      subtitle: 'Сформировать темы для обсуждения успехов и блокеров',
      category: 'Быстрые действия',
      icon: Zap,
      action: () => {
        onSelectTab('chat');
        onAskAI('Помоги составить адженду для развивающей встречи 1:1 с наставником');
        onClose();
      },
    },

    // AvitoTech Standards
    {
      id: 'std-zbp',
      title: 'Что такое Zero Bug Policy в Авито?',
      subtitle: 'Стандарты надёжности и обязательные инженерные практики',
      category: 'Стандарты инженерии AvitoTech',
      icon: BookOpen,
      action: () => {
        onSelectTab('chat');
        onAskAI('Что такое Zero Bug Policy в Авито и почему нельзя допускать паники в продакшене?');
        onClose();
      },
    },
    {
      id: 'std-context',
      title: 'Правило: Проброс context.Context с таймаутом',
      subtitle: 'Защита от утечек горутин и зависания I/O',
      category: 'Стандарты инженерии AvitoTech',
      icon: BookOpen,
      action: () => {
        onSelectTab('chat');
        onAskAI('Объясни подробнее правило "Проброс контекста (Context Timeout)" в Авито');
        onClose();
      },
    },
    {
      id: 'std-limit',
      title: 'Правило: Обязательный LIMIT в SQL-запросах',
      subtitle: 'Предотвращение OOM и перегрузки Postgres',
      category: 'Стандарты инженерии AvitoTech',
      icon: BookOpen,
      action: () => {
        onSelectTab('chat');
        onAskAI('Почему в Авито обязателен LIMIT во всех SELECT-запросах?');
        onClose();
      },
    },
  ];

  // Filter commands
  const filtered = allCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle?.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <Search size={18} className="text-[#04E061] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск по разделам, ролям, стандартам ZBP и действиям... (или введите запрос)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2.5 space-y-1 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
          {filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-300">Ничего не найдено по запросу «{query}»</p>
              <p className="text-xs text-slate-400">
                Нажмите Enter, чтобы спросить об этом AI-Наставника
              </p>
              <button
                onClick={() => {
                  onSelectTab('chat');
                  onAskAI(query);
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#04E061]/20 hover:bg-[#04E061]/30 border border-[#04E061]/40 text-[#04E061] text-xs font-bold transition-all cursor-pointer"
              >
                <span>Спросить AI-Buddy: «{query}»</span>
                <CornerDownLeft size={14} />
              </button>
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border border-white/20 shadow-md translate-x-0.5'
                      : 'hover:bg-white/5 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isSelected
                        ? 'bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/30'
                        : 'bg-white/5 text-slate-400'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {cmd.title}
                      </p>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 font-medium">
                      {cmd.category}
                    </span>
                    {isSelected && (
                      <ArrowRight size={14} className="text-[#04E061] animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-2.5 border-t border-white/10 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">↓</kbd> Навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">Enter</kbd> Выбрать
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">ESC</kbd> Закрыть
            </span>
          </div>
          <span className="text-[#04E061] font-semibold">
            Spotlight 2.0 • Avito AI-Buddy
          </span>
        </div>

      </div>
    </div>
  );
};

export default CommandPalette;
