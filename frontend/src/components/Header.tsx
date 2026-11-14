import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types';
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Shield,
  ChevronDown,
  CheckCircle2,
  Code2,
  Trophy,
  Flame,
  Search,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchUser: (userId: string) => void;
  onOpenCommandPalette?: () => void;
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
  onOpenCommandPalette,
  gamification,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel backdrop-blur-2xl">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 h-[52px] md:h-[56px] flex items-center justify-between gap-1.5 lg:gap-2 2xl:gap-3 min-w-0">
        
        {/* Left Section: Brand Logo & Title (Compact & shrink-0 so it never steals width) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] shadow-[0_0_8px_#04E061]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00AAFF] shadow-[0_0_8px_#00AAFF]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#965EEB] shadow-[0_0_8px_#965EEB]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5252] shadow-[0_0_8px_#FF5252]"></span>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                Avito
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40 leading-none">
                AI-BUDDY
              </span>
            </div>
            <span className="hidden sm:block text-[9px] font-medium text-slate-400 leading-none mt-1 whitespace-nowrap">
              Hack&Change 2026
            </span>
          </div>
        </div>

        {/* Center Section: Desktop Single-Tier Navigation Pills (Fits 1024px–1920px+ with zero clipping) */}
        <nav
          className="hidden xl:flex items-center gap-0.5 2xl:gap-1 p-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl min-w-0 overflow-x-auto no-scrollbar"
          role="navigation"
          aria-label="Основная навигация"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1 2xl:gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-[11px] 2xl:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/20 shadow-md ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} className={`shrink-0 ${isActive ? 'text-[#04E061]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden 2xl:inline-flex px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                      tab.badge === 'Live'
                        ? 'bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/30'
                        : 'bg-[#965EEB]/20 text-[#965EEB] border border-[#965EEB]/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Command Palette + XP/Level Pill + Role Switcher (Always 100% visible, shrink-0) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Spotlight Search Button (Desktop) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Открыть командную строку и быстрый поиск (Ctrl+K)"
              className="hidden lg:flex items-center gap-1.5 px-2 2xl:px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs cursor-pointer shadow-sm group shrink-0"
            >
              <Search size={13} className="text-[#04E061] group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden 2xl:inline text-[11px] font-medium whitespace-nowrap">Поиск...</span>
              <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono text-slate-300 border border-white/10 whitespace-nowrap">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* XP / Level Pill: Compact & always unclipped */}
          <button
            onClick={() => onTabChange('achievements')}
            title="Перейти к бейджам и уровням онбординга"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-all shadow-sm shrink-0"
          >
            <Flame size={13} className="text-[#04E061] shrink-0" />
            <span className="text-[#04E061] font-extrabold whitespace-nowrap text-[11px] sm:text-xs">
              Ур. {gamification?.level || 1}
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="hidden sm:inline text-slate-300 font-medium text-[10px] sm:text-[11px] whitespace-nowrap">
              {gamification?.current_xp || 0} XP
            </span>
          </button>

          {/* User Switcher Dropdown (Always 100% visible inside viewport) */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-1.5 sm:px-2.5 py-1 rounded-xl flex items-center gap-1.5 sm:gap-2 border border-white/15 hover:border-white/30 glass-panel transition-all cursor-pointer shrink-0"
            >
              <img
                src={getAvatarSrc(currentUser.role, currentUser.avatar_url)}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-[#04E061]/50 bg-slate-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarSrc(currentUser.role);
                }}
              />
              <div className="text-left hidden sm:block">
                <p className="text-[11px] sm:text-xs font-bold leading-tight flex items-center gap-1 text-white whitespace-nowrap">
                  <span>{currentUser.name.split(' ')[0]}</span>
                  {currentUser.role === 'intern' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Стажёр
                    </span>
                  )}
                  {currentUser.role === 'mentor' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      Наставник
                    </span>
                  )}
                  {currentUser.role === 'lead' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
                      Тимлид
                    </span>
                  )}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight whitespace-nowrap">
                  Сменить роль (RBAC)
                </p>
              </div>
              <ChevronDown
                size={13}
                className={`text-slate-400 transition-transform shrink-0 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-72 rounded-2xl p-2.5 shadow-2xl border border-white/20 z-50 backdrop-blur-3xl glass-panel space-y-1"
              >
                <div className="px-3 py-1.5 border-b border-white/10 mb-1.5">
                  <p className="text-xs font-black text-white">Ролевая модель Авито (RBAC):</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Выберите персонажа для проверки прав:</p>
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
                        ? 'bg-white/15 text-white font-bold border border-white/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getAvatarSrc(u.role, u.avatar_url)}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20 bg-slate-800 shrink-0"
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAvatarSrc(u.role);
                        }}
                      />
                      <div>
                        <p className="font-bold leading-tight text-white">{u.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {u.role === 'intern'
                            ? '🎓 Стажёр Backend'
                            : u.role === 'mentor'
                            ? '👨‍💻 Наставник (Buddy)'
                            : '👩‍💼 Тимлид команды'}
                        </span>
                      </div>
                    </div>
                    {u.user_id === currentUser.user_id && (
                      <CheckCircle2 size={16} className="text-[#04E061] shrink-0" />
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

export default Header;
