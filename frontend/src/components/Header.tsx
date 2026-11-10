import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, ThemeMode } from '../types';
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Shield,
  ChevronDown,
  CheckCircle2,
  Code2,
  BookOpen,
  Trophy,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchUser: (userId: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  gamification?: {
    level: number;
    level_name: string;
    current_xp: number;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  activeTab,
  onTabChange,
  onSwitchUser,
  theme,
  onToggleTheme,
  gamification,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const getAvatarSrc = (role: string, avatarUrl?: string) => {
    if (avatarUrl && avatarUrl.startsWith('/avatars/')) return avatarUrl;
    if (role === 'intern') return '/avatars/arseniy.svg';
    if (role === 'mentor') return '/avatars/alexey.svg';
    if (role === 'lead') return '/avatars/ekaterina.svg';
    return '/avatars/arseniy.svg';
  };

  const tabs = [
    { id: 'chat', label: 'AI-Наставник', icon: MessageSquare, badge: 'Live' },
    { id: 'checklist', label: 'Чек-лист', icon: CheckSquare },
    { id: 'code-review', label: 'Pre-flight Review', icon: Code2, badge: 'Go/ZBP' },
    { id: 'glossary', label: 'Глоссарий сленга', icon: BookOpen },
    { id: 'achievements', label: 'Бейджи и XP', icon: Trophy },
    { id: 'absences', label: 'Отгулы', icon: Calendar },
    { id: 'access', label: 'Доступы', icon: Shield },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-all duration-300 backdrop-blur-2xl px-4 sm:px-6 py-2.5 ${
      isDark
        ? 'glass-panel border-white/10'
        : 'bg-white/80 border-slate-200/80 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#04E061] shadow-[0_0_10px_#04E061]"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#00AAFF] shadow-[0_0_10px_#00AAFF]"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#965EEB] shadow-[0_0_10px_#965EEB]"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF5252] shadow-[0_0_10px_#FF5252]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Avito
                </span>
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40">
                  AI-BUDDY
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hack&Change 2026 • Инженерная адаптация стажёров
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto scrollbar-none ${
          isDark ? 'bg-black/25 border-white/5' : 'bg-slate-100 border-slate-200'
        }`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/20 shadow-lg'
                      : 'bg-white text-slate-900 border border-slate-200 shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#04E061]' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                    tab.badge === 'Live'
                      ? 'bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/30'
                      : 'bg-[#965EEB]/20 text-[#965EEB] border border-[#965EEB]/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Gamification XP Pill + Theme Switcher + User Switcher */}
        <div className="flex items-center gap-2.5 self-end xl:self-auto">
          
          {/* XP / Level Pill (Clickable -> opens achievements) */}
          <button
            onClick={() => onTabChange('achievements')}
            title="Перейти к бейджам и уровням"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-gradient-to-r from-[#04E061]/15 to-[#00AAFF]/15 border-emerald-500/30 text-white'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-[#04E061] animate-pulse" />
              <span className="text-xs font-black">
                Ур. {gamification?.level || 1}
              </span>
            </div>
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-emerald-800'}`}>
              {gamification?.current_xp || 0} XP
            </span>
          </button>

          {/* Theme Toggle (Glassy Liquid Sun / Moon) */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className={`p-2 rounded-2xl border transition-all duration-300 cursor-pointer active:scale-90 ${
              isDark
                ? 'bg-slate-800/70 hover:bg-slate-800 border-white/10 text-amber-300 hover:text-amber-200'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-700 shadow-sm'
            }`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-3 py-1.5 rounded-2xl flex items-center gap-2.5 border transition-all cursor-pointer ${
                isDark
                  ? 'glass-panel border-white/15 hover:border-white/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <img
                src={getAvatarSrc(currentUser.role, currentUser.avatar_url)}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#04E061]/50 bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarSrc(currentUser.role);
                }}
              />
              <div className="text-left hidden sm:block">
                <p className={`text-xs font-bold leading-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser.name}
                  {currentUser.role === 'intern' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Стажёр
                    </span>
                  )}
                  {currentUser.role === 'mentor' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      Наставник
                    </span>
                  )}
                  {currentUser.role === 'lead' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
                      Тимлид
                    </span>
                  )}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Сменить роль (RBAC)
                </p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-2.5 shadow-2xl border z-50 backdrop-blur-3xl space-y-1 ${
                isDark
                  ? 'glass-panel border-white/20'
                  : 'bg-white/95 border-slate-200'
              }`}>
                <div className={`px-3 py-1.5 border-b mb-1.5 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Ролевая модель Авито (RBAC):</p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Выберите персонажа для проверки прав:</p>
                </div>
                {users.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => {
                      onSwitchUser(u.user_id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      u.user_id === currentUser.user_id
                        ? isDark
                          ? 'bg-white/15 text-white font-bold border border-white/20'
                          : 'bg-slate-100 text-slate-900 font-bold border border-slate-200'
                        : isDark
                        ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getAvatarSrc(u.role, u.avatar_url)}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20 bg-slate-800"
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAvatarSrc(u.role);
                        }}
                      />
                      <div>
                        <p className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {u.role === 'intern' ? '🎓 Стажёр Backend' : u.role === 'mentor' ? '👨‍💻 Наставник (Buddy)' : '👩‍💼 Тимлид команды'}
                        </span>
                      </div>
                    </div>
                    {u.user_id === currentUser.user_id && (
                      <CheckCircle2 size={16} className="text-[#04E061]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
