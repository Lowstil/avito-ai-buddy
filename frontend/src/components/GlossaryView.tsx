import React, { useState, useEffect, useMemo } from 'react';
import type { GlossaryTerm, ThemeMode } from '../types';
import { getGlossary, getGlossaryCategories } from '../api/client';
import { Search, BookOpen, MessageSquare, Sparkles, Filter, X } from 'lucide-react';

interface GlossaryViewProps {
  theme: ThemeMode;
  onAskAI?: (prompt: string) => void;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({ theme, onAskAI }) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [termsData, catsData] = await Promise.all([
          getGlossary(),
          getGlossaryCategories(),
        ]);
        setTerms(termsData);
        setCategories(['Все', ...catsData]);
      } catch (err) {
        console.error('Failed to load glossary:', err);
        setError('Не удалось загрузить термины. Проверьте подключение к серверу.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTerms = useMemo(() => {
    return terms.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Все' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.internal_context.toLowerCase().includes(q) ||
        item.example_phrase.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [terms, selectedCategory, searchQuery]);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl ${
        isDark
          ? 'bg-slate-900/60 border-slate-800/80 shadow-2xl shadow-indigo-950/20'
          : 'bg-white/70 border-white/80 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#965EEB] to-[#00AAFF] text-white shadow-lg shadow-purple-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Глоссарий сленга Авито (Jargon Buster)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#965EEB]/15 text-[#965EEB] border border-[#965EEB]/30">
                  {terms.length} терминов
                </span>
              </div>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Шпаргалка по внутренней терминологии, архитектуре и сленгу команд Авито. Поможет чувствовать себя уверенно на дейли и в PR!
              </p>
            </div>
          </div>

          {/* Quick info pill */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-medium ${
            isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Sparkles className="w-4 h-4 text-[#04E061]" />
            <span>AI-buddy знает контекст каждого термина</span>
          </div>
        </div>

        {/* Search bar & filter pills */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Поиск по термину, фразе, тегам (#zbp, #stash, регресс)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl border outline-none transition-all duration-200 ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-[#965EEB] focus:ring-1 focus:ring-[#965EEB]'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#965EEB] focus:ring-1 focus:ring-[#965EEB]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#965EEB] to-[#00AAFF] text-white shadow-md shadow-indigo-500/20'
                    : isDark
                    ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#965EEB] border-t-transparent animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Загрузка терминов Авито...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white/60 border-slate-200'
        }`}>
          <Filter className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <h3 className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Терминов не найдено
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Попробуйте изменить поисковый запрос или выбрать категорию «Все».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerms.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 shadow-lg shadow-black/20'
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300 shadow-md shadow-slate-100'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {item.term}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#00AAFF]/15 text-[#00AAFF] border border-[#00AAFF]/30 whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Definition */}
                <p className={`text-xs leading-relaxed font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {item.definition}
                </p>

                {/* Avito Context */}
                <div className={`p-3 rounded-2xl border text-xs leading-relaxed mb-3 ${
                  isDark ? 'bg-slate-950/50 border-slate-800/70 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
                }`}>
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] text-[#04E061] mb-1">
                    <span>🏢 Как устроено в Авито</span>
                  </div>
                  <p>{item.internal_context}</p>
                </div>

                {/* Example phrase */}
                <div className={`p-3 rounded-2xl border border-dashed text-xs italic ${
                  isDark ? 'bg-purple-950/15 border-purple-800/40 text-purple-200' : 'bg-purple-50/70 border-purple-200 text-purple-900'
                }`}>
                  <span className="font-semibold not-italic text-[10px] uppercase tracking-wider block text-[#965EEB] mb-0.5">
                    💬 Как услышишь на дейли:
                  </span>
                  «{item.example_phrase}»
                </div>
              </div>

              {/* Action: Ask AI */}
              {onAskAI && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-800/40">
                  <button
                    onClick={() => onAskAI(`Расскажи подробнее, как стажёру работать с «${item.term}» в Авито и какие есть типовые ошибки?`)}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#00AAFF]" />
                    <span>Спросить AI-buddy</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
