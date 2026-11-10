import React from 'react';
import type { UserProfile } from '../types';
import { MessageSquare, CheckSquare, Calendar, Shield, ChevronDown, CheckCircle2, ArrowRightLeft } from 'lucide-react';

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
  const tabs = [
    { id: 'chat', label: 'AI-Наставник', icon: MessageSquare, badge: 'Live' },
    { id: 'checklist', label: 'Чек-лист стажёра', icon: CheckSquare },
    { id: 'absences', label: 'Отгулы (Day-off)', icon: Calendar },
    { id: 'access', label: 'Доступы и стенды', icon: Shield },
  ];

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

          {/* Mobile User Profile */}
          <div className="md:hidden">
            <button
              onClick={() => onSwitchUser(currentUser.role === 'intern' ? 'mentor_1' : 'intern_1')}
              className="text-xs px-2.5 py-1 rounded-xl bg-white/10 text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft size={12} />
              {currentUser.role === 'intern' ? 'Я Наставник' : 'Я Стажёр'}
            </button>
          </div>
        </div>

        {/* Clear Intuitive Navigation Tabs */}
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

        {/* User Switcher (Clear and human-friendly) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative group">
            <button className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#04E061]/50"
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
                <p className="text-[10px] text-slate-400">Нажмите для смены роли</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-white/15 hidden group-hover:block z-50 backdrop-blur-3xl">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-[11px] font-bold text-slate-300">Переключение ролей (RBAC):</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Выберите роль для проверки прав и согласования заявок</p>
              </div>
              {users.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => onSwitchUser(u.user_id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    u.user_id === currentUser.user_id
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div>
                      <p className="font-semibold leading-none">{u.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {u.role === 'intern' ? 'Стажёр Backend' : u.role === 'mentor' ? 'Наставник (Buddy)' : 'Тимлид команды'}
                      </span>
                    </div>
                  </div>
                  {u.user_id === currentUser.user_id && (
                    <CheckCircle2 size={14} className="text-[#04E061]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
