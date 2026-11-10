import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types';
import { MessageSquare, CheckSquare, Calendar, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchUser: (userId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  activeTab,
  onTabChange,
  onSwitchUser
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
    { id: 'checklist', label: 'Чек-лист стажёра', icon: CheckSquare },
    { id: 'absences', label: 'Отгулы (Day-off)', icon: Calendar },
    { id: 'access', label: 'Доступы и стенды', icon: Shield },
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-3 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
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
                <span className="text-xl font-black tracking-tight text-white">Avito</span>
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40">
                  AI-BUDDY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hack&Change 2026 • Адаптация стажёров</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-white/15 to-white/10 text-white border border-white/20 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[#04E061]' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#04E061] animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Switcher Dropdown (Click-based, no disappearing on mouse move!) */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2.5 border border-white/15 hover:border-white/30 transition-all cursor-pointer"
            >
              <img
                src={getAvatarSrc(currentUser.role, currentUser.avatar_url)}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#04E061]/50 bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarSrc(currentUser.role);
                }}
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  {currentUser.name}
                  {currentUser.role === 'intern' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Стажёр
                    </span>
                  )}
                  {currentUser.role === 'mentor' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                      Наставник
                    </span>
                  )}
                  {currentUser.role === 'lead' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      Тимлид
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">Нажмите, чтобы сменить роль</p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl p-2.5 shadow-2xl border border-white/20 z-50 backdrop-blur-3xl space-y-1">
                <div className="px-3 py-1.5 border-b border-white/10 mb-1.5">
                  <p className="text-xs font-black text-white">Ролевая модель Авито (RBAC):</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Выберите персонажа для проверки прав доступа:</p>
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
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20 bg-slate-800"
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAvatarSrc(u.role);
                        }}
                      />
                      <div>
                        <p className="font-bold leading-tight text-white">{u.name}</p>
                        <span className="text-[10px] text-slate-400">
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
