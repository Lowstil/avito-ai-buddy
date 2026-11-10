import React from 'react';
import type { UserProfile } from '../types';
import { Shield, ChevronDown, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onOpenAbsenceModal: () => void;
  onOpenAccessModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenAbsenceModal,
  onOpenAccessModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 py-3.5 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logo */}
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
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40">
                AI-BUDDY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Hack&Change 2026 • Адаптация стажёров</p>
          </div>
        </div>

        {/* Quick Service Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenAbsenceModal}
            className="glass-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#00AAFF]"></span>
            Кадры: Отгулы (Day-off)
          </button>

          <button
            onClick={onOpenAccessModal}
            className="glass-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Shield size={14} className="text-[#965EEB]" />
            Доступы (ServiceDesk)
          </button>
        </div>

        {/* User Profile & Role Switcher for RBAC Testing */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2.5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#04E061]/40"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.role === 'intern' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      Стажёр
                    </span>
                  )}
                  {currentUser.role === 'mentor' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
                      Наставник
                    </span>
                  )}
                  {currentUser.role === 'lead' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">
                      Тимлид
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">{currentUser.track} • {currentUser.team}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-white/15 hidden group-hover:block z-50 backdrop-blur-3xl">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ролевая модель (RBAC):</p>
                <p className="text-xs text-slate-300 mt-0.5">Переключите пользователя для проверки прав доступа</p>
              </div>
              {users.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => onSwitchUser(u.user_id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    u.user_id === currentUser.user_id
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div>
                      <p className="font-semibold leading-none">{u.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{u.role}</span>
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
