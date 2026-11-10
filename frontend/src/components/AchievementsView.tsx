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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AchievementsViewProps {
  userId?: string;
  onAskAI?: (prompt: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  userId = 'intern_1',
  onAskAI,
}) => {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [celebrate, setCelebrate] = useState<boolean>(false);

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
      origin: { y: 0.6 }
    });
    setTimeout(() => setCelebrate(false), 2500);
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-[#04E061]" />;
      case 'Key':
        return <Key className="w-6 h-6 text-[#00AAFF]" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-6 h-6 text-[#965EEB]" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-6 h-6 text-[#04E061]" />;
      case 'Eye':
        return <Eye className="w-6 h-6 text-[#00AAFF]" />;
      case 'Users':
        return <Users className="w-6 h-6 text-[#965EEB]" />;
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-amber-400" />;
      case 'Crown':
        return <Crown className="w-6 h-6 text-amber-400" />;
      default:
        return <Award className="w-6 h-6 text-[#00AAFF]" />;
    }
  };

  const formatBadgeDate = (dateStr?: string) => {
    if (!dateStr) return 'в онбординге';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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
    ? Math.min(100, Math.round((profile.current_xp / (profile.next_level_xp || 1000)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Level & XP Overview Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#04E061]/20 via-[#00AAFF]/20 to-[#965EEB]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#04E061] via-[#00AAFF] to-[#965EEB] p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full rounded-[14px] flex items-center justify-center font-black text-2xl bg-slate-950 text-white">
                  {profile?.level || 1}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#04E061] text-slate-950 shadow-md">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  {profile?.level_name || 'Стажёр-исследователь'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/30">
                  Уровень {profile?.level || 1}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Инженерный трек онбординга Avito Start: выполнение задач чек-листа и соблюдение ZBP приближают к офферу в штат.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerCelebrate}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md cursor-pointer active:scale-95 ${
                celebrate
                  ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 scale-105'
                  : 'glass-card hover:border-[#04E061]/50 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{celebrate ? '🎉 Отличная работа!' : 'Отпраздновать успехи 🎉'}</span>
            </button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-slate-300">
              Текущий опыт: <strong className="text-white font-bold">{profile?.current_xp || 0} XP</strong>
            </span>
            <span className="text-slate-300">
              Следующий уровень: <strong className="text-[#00AAFF] font-bold">{profile?.next_level_xp || 1000} XP</strong>
            </span>
          </div>

          <div className="h-3 w-full rounded-full overflow-hidden p-0.5 bg-black/50 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#04E061] via-[#00AAFF] to-[#965EEB] transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Stats Column */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-[#04E061]/20 text-[#04E061]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">
                {profile?.current_xp || 0} XP
              </div>
              <div className="text-[11px] text-slate-400">Накоплено опыта</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-[#00AAFF]/20 text-[#00AAFF]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">
                {profile?.unlocked_badges_count || 0} из {profile?.total_badges_count || 8}
              </div>
              <div className="text-[11px] text-slate-400">Бейджей разблокировано</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3 border border-white/10">
            <div className="p-2.5 rounded-xl bg-[#965EEB]/20 text-[#965EEB]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">
                {Math.round(((profile?.unlocked_badges_count || 0) / (profile?.total_badges_count || 8)) * 100)}%
              </div>
              <div className="text-[11px] text-slate-400">Прогресс онбординга</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-tight">
          Бейджи и вехи стажировки
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border bg-black/40 border-white/10">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Все ({profile?.total_badges_count || 0})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Открытые ({profile?.unlocked_badges_count || 0})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'locked'
                ? 'bg-white/20 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            В процессе ({(profile?.total_badges_count || 0) - (profile?.unlocked_badges_count || 0)})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#04E061] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Загрузка достижений...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.unlocked;

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                  isUnlocked
                    ? 'glass-panel border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-950/20'
                    : 'glass-panel border-white/5 opacity-60 hover:opacity-80'
                }`}
              >
                <div>
                  {/* Top row: Icon & XP chip */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
                      isUnlocked
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-black/40 border border-white/5 grayscale'
                    }`}>
                      {renderBadgeIcon(badge.icon)}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      isUnlocked
                        ? 'bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      +{badge.xp} XP
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div className="mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#00AAFF] block mb-0.5">
                      {badge.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {badge.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Footer status */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  {isUnlocked ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#04E061]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">Получено {formatBadgeDate(badge.unlocked_at)}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> В процессе
                        </span>
                        <span>{badge.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#00AAFF]"
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

      {/* Advice banner */}
      {onAskAI && (
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-400/20 text-amber-400">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Хотите быстрее повысить уровень и подойти к офферу?
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                AI-buddy может составить персональный план спринта на основе ваших открытых задач и бейджей.
              </p>
            </div>
          </div>
          <button
            onClick={() => onAskAI('Как мне быстрее выполнить требования для получения следующего уровня и бейджа «Самостоятельный фичер-инженер»?')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow hover:opacity-90 whitespace-nowrap cursor-pointer"
          >
            Спросить AI-buddy
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
