import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AccessItem, UserProfile } from '../types';
import {
  Shield,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Terminal,
  Database,
  Server,
  GitBranch,
  Lock,
  Key,
  Layers,
  X
} from 'lucide-react';

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
  const [selectedAccess, setSelectedAccess] = useState<AccessItem | null>(null);
  const [justification, setJustification] = useState<string>('Необходимо для выполнения задач стажировки в спринте');
  const isMentorOrLead = currentUser.role === 'mentor' || currentUser.role === 'lead';

  useEffect(() => {
    if (!selectedAccess) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAccess(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAccess]);

  const getIcon = (key: string) => {
    switch (key) {
      case 'vpn_corp':
        return Shield;
      case 'gitlab_avito':
        return GitBranch;
      case 'lens_k8s':
        return Server;
      case 'spt_cluster':
      case 'postgres_ro':
        return Database;
      case 'grafana_metrics':
        return Terminal;
      case 'kafka_topics':
        return Layers;
      default:
        return Key;
    }
  };

  const filteredList = accessList.filter((item) => {
    if (filter === 'active') return item.status === 'active';
    if (filter === 'requested') return item.status === 'requested';
    if (filter === 'not_requested') return item.status === 'not_requested';
    return true;
  });

  const activeCount = accessList.filter((i) => i.status === 'active').length;
  const requestedCount = accessList.filter((i) => i.status === 'requested').length;
  const availableCount = accessList.filter((i) => i.status === 'not_requested').length;

  return (
    <div data-testid="access-view" className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Compact Liquid Glass Header Banner */}
      <div className="glass-panel specular-inset rounded-3xl p-4 sm:p-5 border border-white/15 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="laser-line-spectrum absolute top-0 inset-x-0 opacity-70 pointer-events-none" />

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#965EEB] glow-purple shrink-0"></span>
            <h2 className="text-base sm:text-lg font-black text-glass-pure truncate">
              {isMentorOrLead
                ? 'Управление доступами стажёра: Арсений Новиков (Backend)'
                : 'Доступы и рабочие инструменты (RBAC Matrix)'}
            </h2>
          </div>
          <p className="text-xs text-glass-secondary max-w-3xl leading-relaxed">
            В Авито действует строгая политика безопасности (<strong className="text-white">Zero Trust & Least Privilege</strong>). Стажёр отправляет запрос в ServiceDesk в 1 клик, а выдачу подтверждает наставник или тимлид.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Quick Status Counters */}
          <div className="hidden sm:flex items-center gap-2 glass-card px-3 py-1.5 rounded-2xl border border-white/12 text-[11px]">
            <span className="flex items-center gap-1 text-[#04E061] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#04E061] shadow-[0_0_6px_#04E061]" />
              {activeCount} активны
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-[#b085f5] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#965EEB] shadow-[0_0_6px_#965EEB]" />
              {requestedCount} в очереди
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onAskBuddy('Какие доступы мне нужны в первую неделю стажировки и как их заказать?')
            }
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-2xl glass-pill text-white font-bold text-xs hover:border-[#965EEB]/60 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles size={14} className="text-[#b085f5] shrink-0" />
            <span>Подобрать доступы с AI-buddy</span>
          </button>
        </div>
      </div>

      {/* RBAC Notice & Filter Bar */}
      <div className="glass-panel specular-inset rounded-2xl p-3 sm:p-3.5 border border-white/12 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 text-glass-secondary min-w-0">
          <div
            className={`p-1.5 rounded-xl shrink-0 border ${
              isMentorOrLead
                ? 'bg-emerald-500/15 border-emerald-500/30 text-[#04E061]'
                : 'bg-blue-500/15 border-blue-500/30 text-[#00AAFF]'
            }`}
          >
            <Lock size={15} />
          </div>
          <span className="leading-relaxed">
            {isMentorOrLead ? (
              <span>
                Режим администратора: Вы вошли как <strong className="text-white">{currentUser.name}</strong> (
                {currentUser.role === 'mentor' ? 'Наставник' : 'Тимлид'}). Вы утверждаете выдачу доступов для стажёра{' '}
                <strong className="text-white">Арсения Новикова</strong>.
              </span>
            ) : (
              <span>
                Режим стажёра: Вы вошли как <strong className="text-white">{currentUser.name}</strong>. Вы можете только{' '}
                <strong className="text-[#00AAFF]">запрашивать доступы</strong>. Подтверждение выдачи доступно наставнику и тимлиду.
              </span>
            )}
          </span>
        </div>

        {/* Filter Pills with Mobile Overflow Containment */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[40px] sm:min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                : 'text-glass-muted hover:text-white hover:bg-white/5'
            }`}
          >
            Все ({accessList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('requested')}
            className={`min-h-[40px] sm:min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'requested'
                ? 'bg-purple-500/25 text-[#b085f5] border border-purple-400/50 glow-purple'
                : 'text-glass-muted hover:text-[#b085f5] hover:bg-white/5'
            }`}
          >
            <Clock size={11} />
            <span>Запрошены ({requestedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`min-h-[40px] sm:min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'active'
                ? 'bg-emerald-500/25 text-[#04E061] border border-emerald-400/50 glow-green'
                : 'text-glass-muted hover:text-[#04E061] hover:bg-white/5'
            }`}
          >
            <CheckCircle2 size={11} />
            <span>Активны ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('not_requested')}
            className={`min-h-[40px] sm:min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap ${
              filter === 'not_requested'
                ? 'bg-blue-500/25 text-[#00AAFF] border border-blue-400/50 glow-blue'
                : 'text-glass-muted hover:text-[#00AAFF] hover:bg-white/5'
            }`}
          >
            Доступны ({availableCount})
          </button>
        </div>
      </div>

      {/* Balanced 3x2 Multi-Column Grid on 1920x1080 Desktop & Responsive Mobile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredList.map((item) => {
          const Icon = getIcon(item.system_key);
          return (
            <div
              key={item.id}
              data-testid={`access-card-${item.system_key}`}
              onClick={() => setSelectedAccess(item)}
              className={`glass-card glass-card-interactive glass-specular specular-inset p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                item.status === 'active'
                  ? 'border-neon-green bg-emerald-950/15'
                  : item.status === 'requested'
                  ? 'border-neon-purple bg-purple-950/15'
                  : 'border-white/12 hover:border-[#00AAFF]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      item.status === 'active'
                        ? 'bg-[#04E061]/15 border-[#04E061]/40 text-[#04E061] shadow-[0_0_12px_rgba(4,224,97,0.2)]'
                        : item.status === 'requested'
                        ? 'bg-[#965EEB]/15 border-[#965EEB]/40 text-[#b085f5] shadow-[0_0_12px_rgba(150,94,235,0.2)]'
                        : 'bg-[#00AAFF]/15 border-[#00AAFF]/30 text-[#00AAFF]'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Neon Status Indicator Badges */}
                  {item.status === 'active' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#04E061] text-[11px] font-extrabold flex items-center gap-1 border border-emerald-500/40 shadow-[0_0_10px_rgba(4,224,97,0.2)]">
                      <CheckCircle2 size={12} /> Активен
                    </span>
                  )}
                  {item.status === 'requested' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#b085f5] text-[11px] font-extrabold flex items-center gap-1 border border-purple-500/40 shadow-[0_0_10px_rgba(150,94,235,0.2)]">
                      <Clock size={12} /> Запрошен
                    </span>
                  )}
                  {item.status === 'not_requested' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-glass-secondary border border-white/15 text-[11px] font-bold">
                      Не подключен
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-glass-pure mb-1">{item.system_name}</h4>
                <p className="text-xs text-glass-secondary leading-relaxed mb-3 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Action Button strictly respecting RBAC & Touch Targets (>= 44px on mobile) */}
              <div className="pt-2.5 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                {/* 1. Item is active */}
                {item.status === 'active' && (
                  <div className="min-h-[44px] sm:min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#04E061] text-xs font-extrabold">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Доступ готов к работе</span>
                  </div>
                )}

                {/* 2. Item is requested: ONLY mentor or lead can approve! Intern CANNOT grant! */}
                {item.status === 'requested' &&
                  (isMentorOrLead ? (
                    <button
                      type="button"
                      onClick={() => onGrantAccess(item.system_key)}
                      className="w-full min-h-[44px] sm:min-h-[36px] py-2 px-3 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] transition-all flex items-center justify-center gap-1.5 cursor-pointer glow-green"
                    >
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>Подтвердить выдачу (Наставник)</span>
                    </button>
                  ) : (
                    <div className="w-full min-h-[44px] sm:min-h-[36px] py-2 px-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#b085f5] text-xs text-center font-bold flex items-center justify-center gap-1.5">
                      <Clock size={13} className="text-[#b085f5] shrink-0 animate-pulse" />
                      <span>Ожидает одобрения наставником</span>
                    </div>
                  ))}

                {/* 3. Item is not requested */}
                {item.status === 'not_requested' &&
                  (isMentorOrLead ? (
                    <button
                      type="button"
                      onClick={() => onGrantAccess(item.system_key)}
                      className="w-full min-h-[44px] sm:min-h-[36px] py-2 px-3 rounded-xl glass-pill text-white font-extrabold text-xs hover:border-[#04E061]/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} className="text-[#04E061] shrink-0" />
                      <span>Выдать превентивно</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestAccess(item.system_key, 'Необходимо для задач стажировки')
                      }
                      className="w-full min-h-[44px] sm:min-h-[36px] py-2 px-3 rounded-xl bg-[#00AAFF] text-white font-extrabold text-xs hover:bg-[#0090dd] transition-all flex items-center justify-center gap-1.5 cursor-pointer glow-blue"
                    >
                      <Plus size={14} className="shrink-0" />
                      <span>Запросить доступ в 1 клик</span>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACCESS ITEM DETAIL & REQUEST MODAL — Portaled to document.body */}
      {selectedAccess &&
        createPortal(
          <div
            data-testid="access-detail-modal-backdrop"
            className="fixed inset-0 z-[120] glass-backdrop bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setSelectedAccess(null)}
          >
            <div
              data-testid="access-detail-modal"
              onClick={(e) => e.stopPropagation()}
              className="glass-panel glass-modal specular-inset-strong w-full max-w-lg max-h-[86dvh] flex flex-col rounded-2xl border border-white/20 overflow-hidden shadow-2xl my-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-white/10 shrink-0">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#b085f5] block">
                    ServiceDesk RBAC • {selectedAccess.system_key}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-glass-pure leading-snug">
                    {selectedAccess.system_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccess(null)}
                  aria-label="Закрыть модальное окно"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl glass-pill text-glass-secondary hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain glass-scrollbar p-4 sm:p-5 space-y-4">
                <div className="p-3.5 rounded-2xl bg-black/45 border border-white/10 text-xs text-glass-primary leading-relaxed space-y-2">
                  <p>{selectedAccess.description}</p>
                  <div className="pt-2 border-t border-white/10 text-[11px] text-glass-secondary">
                    Статус:{' '}
                    {selectedAccess.status === 'active' ? (
                      <strong className="text-[#04E061]">✓ Активен и готов к работе</strong>
                    ) : selectedAccess.status === 'requested' ? (
                      <strong className="text-[#b085f5]">⏳ Заявка отправлена на согласование наставнику</strong>
                    ) : (
                      <strong className="text-[#00AAFF]">Доступен для запроса</strong>
                    )}
                  </div>
                </div>

                {selectedAccess.status === 'not_requested' && !isMentorOrLead && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-glass-secondary">
                      Обоснование для ServiceDesk (Zero Trust):
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={2}
                      className="glass-input w-full bg-slate-950/90 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00AAFF]"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 sm:px-5 sm:py-3.5 border-t border-white/10 bg-slate-950/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onAskBuddy(`Зачем нужен доступ «${selectedAccess.system_name}» и как его настроить?`);
                    setSelectedAccess(null);
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold glass-pill text-[#b085f5] hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Спросить AI-buddy</span>
                </button>

                {selectedAccess.status === 'not_requested' && !isMentorOrLead && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestAccess(selectedAccess.system_key, justification.trim() || 'Необходимо для задач стажировки');
                      setSelectedAccess(null);
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#00AAFF] text-white font-extrabold text-xs hover:bg-[#0090dd] cursor-pointer glow-blue"
                  >
                    Отправить заявку
                  </button>
                )}

                {selectedAccess.status !== 'active' && isMentorOrLead && (
                  <button
                    type="button"
                    onClick={() => {
                      onGrantAccess(selectedAccess.system_key);
                      setSelectedAccess(null);
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#04E061] text-slate-950 font-extrabold text-xs hover:bg-[#03c754] cursor-pointer glow-green"
                  >
                    Подтвердить выдачу
                  </button>
                )}

                {selectedAccess.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAccess(null)}
                    className="min-h-[40px] px-4 py-2 rounded-xl glass-pill text-white font-bold text-xs cursor-pointer"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
