import React, { useState, useEffect } from 'react';
import type { UserGamificationProfile } from '../types';
import { getGamificationProfile } from '../api/client';
import {
  ShieldCheck,
  Key,
  GitPullRequest,
  CalendarCheck,
  Eye,
  Users,
  Trophy,
  Crown,
  Award,
  Star,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AchievementsViewProps {
  userId?: string;
  onAskAI?: (prompt: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'xp' | 'info' | 'warning') => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  userId = 'intern_1',
  onAskAI,
  onShowToast,
}) => {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getGamificationProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load gamification profile:', err);
        setError('Не удалось загрузить систему достижений.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const triggerCelebrate = () => {
    setCelebrate(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onShowToast) {
      onShowToast('Поздравляем с отличным прогрессом онбординга! 🎉', 'xp');
    }
    setTimeout(() => setCelebrate(false), 2500);
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-[#04E061]" />;
      case 'Key':
        return <Key className="w-5 h-5 text-[#00AAFF]" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-5 h-5 text-[#965EEB]" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-5 h-5 text-[#04E061]" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-[#00AAFF]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[#965EEB]" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
      default:
        return <Award className="w-5 h-5 text-[#00AAFF]" />;
    }
  };

  const formatBadgeDate = (dateStr?: string) => {
    if (!dateStr) return 'в онбординге';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr.split('T')[0];
    }
  };

  const filteredBadges = (profile?.badges || []).filter((badge) => {
    if (filter === 'unlocked') return badge.unlocked;
    if (filter === 'locked') return !badge.unlocked;
    return true;
  });

  const progressPercent = profile
    ? Math.min(100, Math.max(0, Math.round((profile.current_xp / (profile.next_level_xp || 1000)) * 100)))
    : 0;

  return (
    <div className="space-y-3 sm:space-y-3.5 w-full min-w-0" data-testid="achievements-view">
      {/* Unified Level, Neon XP Bar & 5-Level Career Roadmap Header Panel */}
      <div className="glass-panel specular-inset p-4 sm:p-5 rounded-3xl border border-white/10 relative overflow-hidden space-y-3.5">
        <div className="laser-line-spectrum absolute top-0 inset-x-0 opacity-70 pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-gradient-to-br from-[#04E061]/15 via-[#00AAFF]/15 to-[#965EEB]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Row: Level Avatar + Title + Inline Stats Pills + Celebrate Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#04E061] via-[#00AAFF] to-[#965EEB] p-0.5 shadow-lg glow-green">
                <div className="w-full h-full rounded-[14px] flex items-center justify-center font-black text-xl sm:text-2xl bg-[#080C14] text-white">
                  {profile?.level || 1}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#04E061] text-slate-950 shadow-md">
                <Star className="w-3 h-3 fill-current" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-glass-pure tracking-tight truncate">
                  {profile?.level_name || 'Стажёр-исследователь'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#04E061]/20 text-brand-green border border-[#04E061]/40 specular-inset shrink-0">
                  Уровень {profile?.level || 1}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-glass-secondary mt-0.5 leading-snug line-clamp-1 sm:line-clamp-none">
                Инженерный трек онбординга Avito Start: выполнение задач чек-листа и соблюдение ZBP приближают к офферу в штат.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Compact Stat Pills */}
            <div className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <Flame className="w-4 h-4 text-brand-green shrink-0" />
              <div>
                <span className="font-black text-glass-pure">{profile?.current_xp || 0} XP</span>
                <span className="text-[10px] text-glass-muted ml-1 hidden sm:inline">опыта</span>
              </div>
            </div>

            <div className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <Trophy className="w-4 h-4 text-brand-blue shrink-0" />
              <div>
                <span className="font-black text-glass-pure">
                  {profile?.unlocked_badges_count || 0}/{profile?.total_badges_count || 8}
                </span>
                <span className="text-[10px] text-glass-muted ml-1 hidden sm:inline">бейджей</span>
              </div>
            </div>

            <button
              type="button"
              data-testid="celebrate-btn"
              onClick={triggerCelebrate}
              className={`min-h-[40px] sm:min-h-[38px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-md cursor-pointer active:scale-95 ${
                celebrate
                  ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 glow-green scale-105'
                  : 'glass-pill hover:border-[#04E061]/50 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{celebrate ? '🎉 Отличная работа!' : 'Отпраздновать успехи 🎉'}</span>
            </button>
          </div>
        </div>

        {/* Neon XP Progress Bar */}
        <div className="pt-2.5 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium mb-1.5">
            <span className="text-glass-secondary">
              Текущий опыт: <strong className="text-glass-pure font-bold">{profile?.current_xp || 0} XP</strong>
            </span>
            <span className="text-glass-secondary">
              Следующий уровень: <strong className="text-brand-blue font-bold">{profile?.next_level_xp || 1000} XP</strong> ({progressPercent}%)
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full overflow-hidden p-0.5 bg-black/60 border border-white/10 specular-inset">
            <div
              data-testid="xp-progress-bar"
              className="h-full rounded-full bg-gradient-to-r from-[#04E061] via-[#00AAFF] to-[#965EEB] transition-all duration-700 glow-green"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Compact 5-Level Career Roadmap Stepper (Horizontal Scroll on Mobile, 5-Col on sm+) */}
        <div className="pt-2.5 border-t border-white/10 relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-glass-secondary flex items-center gap-1.5">
              <Trophy size={13} className="text-brand-green" />
              Карьерный трек: Стажёр → Pre-Junior → Junior → Middle → Tech Lead
            </h3>
            <span className="text-[11px] font-semibold text-glass-muted">
              Текущий этап: <strong className="text-brand-green">Ур. {profile?.level || 1} ({profile?.level_name || 'Стажёр'})</strong>
            </span>
          </div>

          <div
            data-testid="career-roadmap-stepper"
            className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1"
          >
            {[
              { lvl: 1, xp: 0, grade: 'Стажёр', title: 'Новобранец', sub: 'Вход в команду', reached: (profile?.level || 1) >= 1 },
              { lvl: 2, xp: 300, grade: 'Pre-Junior', title: 'Быстрый старт', sub: 'Первый PR в прод', reached: (profile?.level || 1) >= 2 },
              { lvl: 3, xp: 600, grade: 'Junior', title: 'Уверенный джун', sub: 'Автономия в спринте', reached: (profile?.level || 1) >= 3 },
              { lvl: 4, xp: 1200, grade: 'Middle', title: 'Гроза прод-багов', sub: 'Защита ZBP & экватор', reached: (profile?.level || 1) >= 4 },
              { lvl: 5, xp: 2000, grade: 'Tech Lead', title: 'Оффер в штат', sub: 'Backend AvitoTech', reached: (profile?.level || 1) >= 5 },
            ].map((step) => {
              const isCurrent = (profile?.level || 1) === step.lvl;
              return (
                <div
                  key={step.lvl}
                  className={`min-w-[140px] sm:min-w-0 p-2.5 rounded-2xl border text-left sm:text-center transition-all shrink-0 specular-inset ${
                    isCurrent
                      ? 'bg-emerald-500/15 border-[#04E061]/60 text-white glow-green'
                      : step.reached
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-white/[0.03] border-white/10 text-glass-muted'
                  }`}
                >
                  <div className="flex items-center sm:justify-center gap-1 text-[10px] font-black mb-0.5">
                    <span className={step.reached ? 'text-brand-green' : 'text-glass-muted'}>
                      Ур. {step.lvl} ({step.grade})
                    </span>
                    <span className="text-glass-muted">•</span>
                    <span className="text-glass-secondary font-normal">{step.xp} XP</span>
                  </div>
                  <p className={`text-xs font-bold leading-tight truncate ${step.reached ? 'text-glass-pure' : 'text-glass-secondary'}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-glass-muted mt-0.5 truncate">
                    {step.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs + AI Sprint Advice Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm sm:text-base font-black text-glass-pure tracking-tight">
            Бейджи и вехи стажировки
          </h2>
          {onAskAI && (
            <button
              type="button"
              data-testid="ask-ai-career-plan-btn"
              onClick={() =>
                onAskAI(
                  'Как мне быстрее выполнить требования для получения следующего уровня и бейджа «Самостоятельный фичер-инженер»?'
                )
              }
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold glass-pill text-brand-blue hover:border-[#00AAFF]/50 hover:text-white transition-all cursor-pointer"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Персональный план спринта от AI-buddy</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl border bg-black/50 border-white/10 overflow-x-auto no-scrollbar max-w-full shrink-0">
          <button
            type="button"
            data-testid="badge-filter-all"
            onClick={() => setFilter('all')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow glow-purple'
                : 'text-glass-muted hover:text-white'
            }`}
          >
            Все ({profile?.total_badges_count || 0})
          </button>
          <button
            type="button"
            data-testid="badge-filter-unlocked"
            onClick={() => setFilter('unlocked')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'unlocked'
                ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 shadow glow-green'
                : 'text-glass-muted hover:text-white'
            }`}
          >
            Открытые ({profile?.unlocked_badges_count || 0})
          </button>
          <button
            type="button"
            data-testid="badge-filter-locked"
            onClick={() => setFilter('locked')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'locked'
                ? 'bg-white/20 text-white shadow specular-inset'
                : 'text-glass-muted hover:text-white'
            }`}
          >
            В процессе ({(profile?.total_badges_count || 0) - (profile?.unlocked_badges_count || 0)})
          </button>
        </div>
      </div>

      {/* 8 Badges Grid: Crisp 4-Column on Desktop (xl:grid-cols-4 lg:grid-cols-4 sm:grid-cols-2 grid-cols-1) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 glass-panel rounded-3xl">
          <div className="w-8 h-8 rounded-full border-2 border-[#04E061] border-t-transparent animate-spin" />
          <p className="text-xs text-glass-secondary">Загрузка достижений...</p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-3.5">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.unlocked;

            return (
              <div
                key={badge.id}
                data-testid={`badge-card-${badge.id}`}
                onClick={() => setSelectedBadge(badge)}
                className={`glass-panel glass-card specular-inset relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                  isUnlocked
                    ? 'border-emerald-500/35 bg-emerald-500/[0.06] hover:border-[#04E061]/70 shadow-md'
                    : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/25'
                }`}
              >
                <div>
                  {/* Top row: Icon & XP chip */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                        isUnlocked
                          ? 'bg-white/10 border border-white/20 specular-inset'
                          : 'bg-black/40 border border-white/10 grayscale'
                      }`}
                    >
                      {renderBadgeIcon(badge.icon)}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black specular-inset ${
                        isUnlocked
                          ? 'bg-[#04E061]/20 text-brand-green border border-[#04E061]/40'
                          : 'bg-slate-800/80 text-glass-muted border border-white/10'
                      }`}
                    >
                      +{badge.xp} XP
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-brand-blue block">
                      {badge.category}
                    </span>
                    <h3 className="text-xs sm:text-[13px] font-bold text-glass-pure leading-snug line-clamp-1">
                      {badge.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-glass-secondary mt-1 leading-snug line-clamp-2">
                    {badge.description}
                  </p>
                </div>

                {/* Footer status */}
                <div className="mt-2.5 pt-2 border-t border-white/10">
                  {isUnlocked ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-green">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Получено {formatBadgeDate(badge.unlocked_at)}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1 text-glass-muted">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> В процессе
                        </span>
                        <span className="font-bold text-glass-secondary">{badge.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/50 border border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00AAFF] to-[#965EEB]"
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile-only AI Advice Button */}
      {onAskAI && (
        <div className="md:hidden glass-panel specular-inset p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 shrink-0">
              <Star className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-glass-pure truncate">
                План быстрого роста до оффера
              </h4>
              <p className="text-[11px] text-glass-secondary truncate">
                Спросите у AI-buddy персональные советы по бейджам
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskAI(
                'Как мне быстрее выполнить требования для получения следующего уровня и бейджа «Самостоятельный фичер-инженер»?'
              )
            }
            className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow cursor-pointer shrink-0"
          >
            Спросить AI
          </button>
        </div>
      )}

      {/* Selected Badge Inspection Modal (Liquid Glass High-Elevation Tier 6) */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            data-testid="badge-detail-modal"
            onClick={(e) => e.stopPropagation()}
            className="glass-modal glass-panel specular-inset-strong relative w-[94vw] max-w-lg max-h-[88dvh] flex flex-col rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl space-y-4 overflow-y-auto glass-scrollbar"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg shrink-0 specular-inset">
                  {renderBadgeIcon(selectedBadge.icon)}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-blue block">
                    {selectedBadge.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-glass-pure leading-snug">
                    {selectedBadge.title}
                  </h3>
                  <span className="inline-block mt-0.5 text-xs font-extrabold text-brand-green">
                    +{selectedBadge.xp} XP
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-testid="close-badge-modal-btn"
                onClick={() => setSelectedBadge(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl glass-pill text-glass-secondary hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/45 border border-white/10 text-xs text-glass-primary leading-relaxed space-y-2.5">
              <p className="font-semibold text-glass-pure">{selectedBadge.description}</p>
              <div className="pt-2.5 border-t border-white/10 text-[11px] text-glass-secondary space-y-1.5">
                <p>
                  <strong className="text-glass-pure">Статус:</strong>{' '}
                  {selectedBadge.unlocked ? (
                    <span className="text-brand-green font-bold">
                      ✓ Получено ({formatBadgeDate(selectedBadge.unlocked_at)})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">
                      В процессе выполнения ({selectedBadge.progress}%)
                    </span>
                  )}
                </p>
                <p>
                  <strong className="text-glass-pure">Ценность для AvitoTech:</strong> Закрепление стандартов надёжности, снижение Time-to-First-PR и самостоятельность в фичах сервиса.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {onAskAI && (
                <button
                  type="button"
                  onClick={() => {
                    onAskAI(
                      `Как быстрее получить бейдж «${selectedBadge.title}» в Авито и что для этого нужно сделать?`
                    );
                    setSelectedBadge(null);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[#00AAFF]/20 border border-[#00AAFF]/40 text-brand-blue hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={14} />
                  <span>Спросить совет у AI</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold glass-pill text-white cursor-pointer ml-auto"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
