import React, { useState, useEffect } from 'react';
import type { UserGamificationProfile, ThemeMode } from '../types';
import { getGamificationProfile } from '../api/client';
import { Award, Trophy, Star, Sparkles, CheckCircle2, Lock, Flame } from 'lucide-react';

interface AchievementsViewProps {
  theme: ThemeMode;
  userId?: string;
  onAskAI?: (prompt: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  theme,
  userId = 'intern-alex',
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
    setTimeout(() => setCelebrate(false), 3000);
  };

  const isDark = theme === 'dark';

  const filteredBadges = (profile?.badges || []).filter((badge) => {
    if (filter === 'unlocked') return badge.unlocked;
    if (filter === 'locked') return !badge.unlocked;
    return true;
  });

  const progressPercent = profile
    ? Math.min(
        100,
        Math.round(
          ((profile.current_xp % 100) /
            (profile.next_level_xp - (profile.level - 1) * 100 || 100)) *
            100
        )
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Level & XP Overview Card */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
        isDark
          ? 'bg-slate-900/60 border-slate-800/80 shadow-2xl shadow-indigo-950/20'
          : 'bg-white/70 border-white/80 shadow-xl shadow-slate-200/50'
      }`}>
        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#04E061]/20 via-[#00AAFF]/20 to-[#965EEB]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#04E061] via-[#00AAFF] to-[#965EEB] p-0.5 shadow-lg shadow-emerald-500/20">
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center font-black text-2xl ${
                  isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
                }`}>
                  {profile?.level || 1}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#04E061] text-slate-950 shadow-md">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {profile?.level_name || 'Стажёр-исследователь'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#04E061]/15 text-[#04E061] border border-[#04E061]/30">
                  Уровень {profile?.level || 1}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Программа онбординга Avito Start: выполняя задачи и чек-листы, вы растете до самостоятельного инженера.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerCelebrate}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all duration-200 shadow-md active:scale-95 ${
                celebrate
                  ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 scale-105'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{celebrate ? 'Ура! 🎉 Отличная работа!' : 'Отпраздновать успехи 🎉'}</span>
            </button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/40 relative z-10">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Опыт онбординга: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{profile?.current_xp || 0} XP</strong>
            </span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              До следующего уровня: <strong className="text-[#00AAFF]">{profile?.next_level_xp || 200} XP</strong>
            </span>
          </div>

          <div className={`h-3.5 w-full rounded-full overflow-hidden p-0.5 border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-200/80 border-slate-300'
          }`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#04E061] via-[#00AAFF] to-[#965EEB] transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats 3-column pill strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'bg-slate-950/40 border-slate-800/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="p-2.5 rounded-xl bg-[#04E061]/15 text-[#04E061]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profile?.current_xp || 0} XP
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Накоплено очков
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'bg-slate-950/40 border-slate-800/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="p-2.5 rounded-xl bg-[#00AAFF]/15 text-[#00AAFF]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profile?.unlocked_badges_count || 0} из {profile?.total_badges_count || 8}
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Бейджей разблокировано
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'bg-slate-950/40 border-slate-800/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="p-2.5 rounded-xl bg-[#965EEB]/15 text-[#965EEB]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {Math.round(((profile?.unlocked_badges_count || 0) / (profile?.total_badges_count || 8)) * 100)}%
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Прогресс достижений
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Бейджи и вехи стажировки
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border bg-slate-900/40 border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Все ({profile?.total_badges_count || 0})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'unlocked'
                ? 'bg-gradient-to-r from-[#04E061] to-[#00AAFF] text-slate-950 shadow'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Открытые ({profile?.unlocked_badges_count || 0})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'locked'
                ? 'bg-slate-700 text-white shadow'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Закрытые ({(profile?.total_badges_count || 0) - (profile?.unlocked_badges_count || 0)})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#04E061] border-t-transparent animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Загрузка достижений...</p>
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
                className={`relative flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl ${
                  isUnlocked
                    ? isDark
                      ? 'bg-slate-900/70 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'bg-white/80 border-emerald-400/60 shadow-md shadow-emerald-100'
                    : isDark
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-70 hover:opacity-90'
                    : 'bg-slate-100/60 border-slate-200/80 opacity-70 hover:opacity-90'
                }`}
              >
                <div>
                  {/* Top row: Icon & XP chip */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-[#04E061]/20 via-[#00AAFF]/20 to-[#965EEB]/20 border border-emerald-500/30'
                        : isDark
                        ? 'bg-slate-900 border border-slate-800 grayscale'
                        : 'bg-slate-200 border border-slate-300 grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isUnlocked
                        ? 'bg-[#04E061]/20 text-[#04E061] border border-[#04E061]/40'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}>
                      +{badge.xp} XP
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div className="mb-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#00AAFF] block mb-0.5">
                      {badge.category}
                    </span>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {badge.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {badge.description}
                  </p>
                </div>

                {/* Footer status */}
                <div className="mt-4 pt-3 border-t border-slate-800/40">
                  {isUnlocked ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#04E061]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Получено {badge.unlocked_at || 'в онбординге'}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> В процессе
                        </span>
                        <span>{badge.progress}%</span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
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
        <div className={`p-5 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/60 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-400/15 text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Хотите быстрее прокачать уровень и закрыть испытательный срок?
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Спросите AI-buddy — он составит персональный план спринта на основе ваших открытых бейджей и задач.
              </p>
            </div>
          </div>
          <button
            onClick={() => onAskAI('Как мне быстрее выполнить требования для получения следующего уровня и бейджа «Самостоятельный фичер-инженер»?')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow hover:opacity-90 whitespace-nowrap"
          >
            Спросить AI-buddy
          </button>
        </div>
      )}
    </div>
  );
};
