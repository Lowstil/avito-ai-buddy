import React from 'react';
import type { AccessItem, UserProfile } from '../types';
import { Shield, CheckCircle2, Clock, Plus, Sparkles, Terminal, Database, Server, GitBranch } from 'lucide-react';

interface AccessViewProps {
  accessList: AccessItem[];
  currentUser: UserProfile;
  onRequestAccess: (systemKey: string, justification: string) => void;
  onGrantAccess: (systemKey: string) => void;
  onAskBuddy: (question: string) => void;
}

export const AccessView: React.FC<AccessViewProps> = ({
  accessList,
  currentUser: _currentUser,
  onRequestAccess,
  onGrantAccess,
  onAskBuddy
}) => {
  const getIcon = (key: string) => {
    switch (key) {
      case 'vpn_corp': return Shield;
      case 'gitlab_avito': return GitBranch;
      case 'lens_k8s': return Server;
      case 'spt_cluster': return Database;
      case 'grafana_metrics': return Terminal;
      default: return Shield;
    }
  };

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
            В Авито выдача доступов автоматизирована через ServiceDesk. Стажёру необходимо подключить базовый набор: VPN, репозитории микросервисов, тестовые стенды SPT и Lens для k8s.
          </p>
        </div>

        <button
          onClick={() => onAskBuddy('Какие доступы мне нужны в первую неделю стажировки?')}
          className="px-4 py-2.5 rounded-2xl glass-pill text-white font-bold text-xs hover:border-[#965EEB]/50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles size={14} className="text-[#965EEB]" />
          Подобрать доступы с AI-buddy
        </button>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessList.map((item) => {
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

              {/* Action Button */}
              <div className="pt-2 border-t border-white/10">
                {item.status === 'not_requested' && (
                  <button
                    onClick={() => onRequestAccess(item.system_key, "Необходимо для задач стажировки")}
                    className="w-full py-2 rounded-xl bg-[#00AAFF] text-white font-bold text-xs hover:bg-[#0090dd] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus size={14} /> Запросить доступ в 1 клик
                  </button>
                )}
                {item.status === 'requested' && (
                  <button
                    onClick={() => onGrantAccess(item.system_key)}
                    className="w-full py-2 rounded-xl bg-[#04E061] text-slate-950 font-bold text-xs hover:bg-[#03c754] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 size={14} /> Подтвердить выдачу
                  </button>
                )}
                {item.status === 'active' && (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-center py-1">
                    <CheckCircle2 size={13} /> Доступ готов к работе
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
