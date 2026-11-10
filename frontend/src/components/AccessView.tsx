import React, { useState } from 'react';
import type { AccessItem, UserProfile } from '../types';
import { Shield, CheckCircle2, Clock, Plus, Sparkles, Terminal, Database, Server, GitBranch, Lock, Key } from 'lucide-react';

interface AccessViewProps {
  accessList: AccessItem[];
  currentUser: UserProfile;
  onRequestAccess: (systemKey: string, justification: string) => void;
  onGrantAccess: (systemKey: string) => void;
  onAskBuddy: (question: string) => void;
}

export const AccessView: React.FC<AccessViewProps> = ({
  accessList,
  currentUser,
  onRequestAccess,
  onGrantAccess,
  onAskBuddy
}) => {
  const [filter, setFilter] = useState<string>('all');
  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  const getIcon = (key: string) => {
    switch (key) {
      case 'vpn_corp': return Shield;
      case 'gitlab_avito': return GitBranch;
      case 'lens_k8s': return Server;
      case 'spt_cluster': return Database;
      case 'grafana_metrics': return Terminal;
      default: return Key;
    }
  };

  const filteredList = accessList.filter(item => {
    if (filter === 'active') return item.status === 'active';
    if (filter === 'requested') return item.status === 'requested';
    if (filter === 'not_requested') return item.status === 'not_requested';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#965EEB]"></span>
            <h2 className="text-xl font-black text-white">Доступы и рабочие инструменты</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            В Авито действует строгая политика безопасности (Zero Trust & Least Privilege). Стажёр отправляет запрос в ServiceDesk, а выдачу подтверждает наставник или тимлид.
          </p>
        </div>

        <button
          onClick={() => onAskBuddy('Какие доступы мне нужны в первую неделю стажировки и как их заказать?')}
          className="px-4 py-2.5 rounded-2xl glass-pill text-white font-bold text-xs hover:border-[#965EEB]/50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles size={14} className="text-[#965EEB]" />
          Подобрать доступы с AI-buddy
        </button>
      </div>

      {/* RBAC Notice Banner */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Lock size={16} className={isMentorOrLead ? "text-[#04E061]" : "text-[#00AAFF]"} />
          <span>
            {isMentorOrLead ? (
              <span>
                Режим администратора: Вы вошли как <strong>{currentUser.name}</strong> ({currentUser.role === 'mentor' ? 'Наставник' : 'Тимлид'}). У вас есть право <strong>подтверждать выдачу доступов</strong> стажёрам.
              </span>
            ) : (
              <span>
                Режим стажёра: Вы вошли как <strong>{currentUser.name}</strong>. Вы можете только <strong>запрашивать доступы</strong>. Подтверждение выдачи доступно исключительно наставнику и тимлиду.
              </span>
            )}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl shrink-0 border border-white/5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
              filter === 'all' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Все ({accessList.length})
          </button>
          <button
            onClick={() => setFilter('requested')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
              filter === 'requested' ? 'bg-purple-500/30 text-purple-200' : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Запрошены ({accessList.filter(i => i.status === 'requested').length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
              filter === 'active' ? 'bg-emerald-500/30 text-emerald-200' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Активны ({accessList.filter(i => i.status === 'active').length})
          </button>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => {
          const Icon = getIcon(item.system_key);
          return (
            <div
              key={item.id}
              className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                item.status === 'active'
                  ? 'border-emerald-500/30 bg-emerald-950/15'
                  : item.status === 'requested'
                  ? 'border-purple-500/30 bg-purple-950/15'
                  : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#965EEB]">
                    <Icon size={20} />
                  </div>
                  {item.status === 'active' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Активен
                    </span>
                  )}
                  {item.status === 'requested' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center gap-1 border border-purple-500/30">
                      <Clock size={12} /> Запрошен
                    </span>
                  )}
                  {item.status === 'not_requested' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[11px] font-semibold">
                      Не подключен
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-white mb-1.5">{item.system_name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{item.description}</p>
              </div>

              {/* Action Button strictly respecting RBAC */}
              <div className="pt-3 border-t border-white/10">
                {/* 1. Item is active */}
                {item.status === 'active' && (
                  <div className="flex items-center justify-center gap-1.5 py-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={14} />
                    <span>Доступ готов к работе</span>
                  </div>
                )}

                {/* 2. Item is requested: ONLY mentor or lead can approve! Intern CANNOT grant! */}
                {item.status === 'requested' && (
                  isMentorOrLead ? (
                    <button
                      onClick={() => onGrantAccess(item.system_key)}
                      className="w-full py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 size={14} /> Подтвердить выдачу (Наставник)
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                      <Clock size={13} className="text-purple-400 shrink-0" />
                      <span>Ожидает одобрения наставником</span>
                    </div>
                  )
                )}

                {/* 3. Item is not requested */}
                {item.status === 'not_requested' && (
                  isMentorOrLead ? (
                    <button
                      onClick={() => onGrantAccess(item.system_key)}
                      className="w-full py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <Plus size={14} /> Выдать превентивно
                    </button>
                  ) : (
                    <button
                      onClick={() => onRequestAccess(item.system_key, "Необходимо для задач стажировки")}
                      className="w-full py-2 rounded-xl bg-[#00AAFF] text-white font-bold text-xs hover:bg-[#0090dd] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus size={14} /> Запросить доступ в 1 клик
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
