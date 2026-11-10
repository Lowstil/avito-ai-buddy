import React, { useState } from 'react';
import type { CodeReviewResponse, CodeReviewIssue, ThemeMode } from '../types';
import { api } from '../api/client';
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, Code, Play, ArrowRight, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodeReviewPlaygroundProps {
  theme?: ThemeMode;
  activeUserId?: string;
  onAskBuddy?: (question: string) => void;
  onAskAI?: (question: string) => void;
}

const SAMPLE_BAD_GO = `package delivery

import (
	"database/sql"
	"fmt"
	"net/http"
)

// ProcessDeliveryOrders processes pending orders without context or limit
func ProcessDeliveryOrders(db *sql.DB) error {
	// ❌ BUG 1: Unbounded query without LIMIT (memory blowup risk)
	rows, err := db.Query("SELECT id, user_id, status FROM delivery_orders WHERE status = 'pending'")
	if err != nil {
		// ❌ BUG 2: Error wrapping without %w
		return fmt.Errorf("db query error: %v", err)
	}
	defer rows.Close()

	// ❌ BUG 3: HTTP client without explicit timeout
	client := &http.Client{}

	for rows.Next() {
		var id, status string
		var userID int64
		_ = rows.Scan(&id, &userID, &status) // ❌ BUG 4: Ignored error

		// ❌ BUG 5: Plain fmt.Println instead of structured zap/slog
		fmt.Println("Processing order:", id)

		if userID <= 0 {
			// ❌ BUG 6: panic() strictly violates Zero Bug Policy in Avito!
			panic("critical: invalid user id received in production order")
		}

		resp, err := client.Get("http://carrier-api.internal/notify?order=" + id)
		if err != nil {
			return err
		}
		resp.Body.Close()
	}

	return nil
}`;

const SAMPLE_CLEAN_GO = `package delivery

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"
)

// ProcessDeliveryOrders processes pending orders following Avito standards
func ProcessDeliveryOrders(ctx context.Context, db *sql.DB, limit int) error {
	// ✅ Safe context timeout
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	// ✅ Safe query with explicit LIMIT
	rows, err := db.QueryContext(ctx, "SELECT id, user_id, status FROM delivery_orders WHERE status = 'pending' LIMIT $1", limit)
	if err != nil {
		// ✅ Proper error wrapping with %w for Sentry tracing
		return fmt.Errorf("failed to fetch delivery orders: %w", err)
	}
	defer rows.Close()

	// ✅ Explicit client timeout to prevent pod socket starvation
	client := &http.Client{Timeout: 2 * time.Second}

	for rows.Next() {
		var id, status string
		var userID int64
		if err := rows.Scan(&id, &userID, &status); err != nil {
			return fmt.Errorf("failed to scan order row: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://carrier-api.internal/notify?order="+id, nil)
		if err != nil {
			return fmt.Errorf("failed to build carrier request: %w", err)
		}

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("carrier notification error: %w", err)
		}
		resp.Body.Close()
	}

	return rows.Err()
}`;

export const CodeReviewPlayground: React.FC<CodeReviewPlaygroundProps> = ({
  activeUserId = 'intern_1',
  onAskBuddy,
  onAskAI,
}) => {
  const askFn = onAskAI || onAskBuddy;
  const [code, setCode] = useState<string>(SAMPLE_BAD_GO);
  const [language, setLanguage] = useState<'go' | 'python'>('go');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CodeReviewResponse | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CodeReviewIssue | null>(null);
  const [copiedDiff, setCopiedDiff] = useState<boolean>(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await api.analyzeCode(activeUserId, code, language);
      setResult(res);
      if (res.issues.length > 0) {
        setSelectedIssue(res.issues[0]);
      } else {
        setSelectedIssue(null);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      console.error('Failed to analyze code:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDiff = (diffText: string) => {
    navigator.clipboard.writeText(diffText);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-[#04E061]/20 to-[#00AAFF]/20 text-[#04E061] border border-[#04E061]/30">
                <Code size={20} />
              </span>
              <h2 className="text-xl font-black text-white">Pre-flight Code Review Playground</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#04E061]/10 text-[#04E061] border border-[#04E061]/30">
                Avito Standard
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Проверь код микросервиса по 10 золотым правилам инженерии Авито и регламенту Zero Bug Policy (ZBP) <strong>до</strong> отправки Pull Request наставнику. ИИ выявит утечки контекста, N+1 в базе и паники.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setCode(SAMPLE_BAD_GO); setLanguage('go'); setResult(null); }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium glass-card hover:border-rose-500/50 text-rose-300 cursor-pointer transition-all"
            >
              🚨 Пример Go с багами ZBP
            </button>
            <button
              onClick={() => { setCode(SAMPLE_CLEAN_GO); setLanguage('go'); setResult(null); }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium glass-card hover:border-[#04E061]/50 text-[#04E061] cursor-pointer transition-all"
            >
              ✨ Эталонный код Авито
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Editor on Left (7 cols), Analysis Dashboard on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Code Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Язык:</span>
                <button
                  onClick={() => setLanguage('go')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    language === 'go' ? 'bg-[#00AAFF] text-white shadow-md' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Go (Golang)
                </button>
                <button
                  onClick={() => setLanguage('python')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    language === 'python' ? 'bg-[#965EEB] text-white shadow-md' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {code.split('\n').length} строк • Delivery Core
              </span>
            </div>

            {/* Code Textarea with Monospace styling */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Вставьте сюда фрагмент Go или Python кода для предпроверки..."
                rows={18}
                className="w-full p-4 font-mono text-xs leading-relaxed text-slate-200 bg-transparent resize-y focus:outline-none selection:bg-[#04E061]/30"
                spellCheck={false}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Проверяется: <code>ctx timeouts</code>, <code>panic()</code>, <code>LIMIT $1</code>, <code>fmt.Errorf(%w)</code>, <code>zap logging</code>
              </p>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !code.trim()}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-[#04E061] to-[#00AAFF] hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Сканирование...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Запустить Pre-flight анализ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Feedback */}
        <div className="lg:col-span-5 space-y-4">
          {!result && !isLoading && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                <Code size={32} />
              </div>
              <h3 className="text-sm font-bold text-white">Код ещё не проанализирован</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Нажмите кнопку «Запустить Pre-flight анализ», чтобы проверить соответствие фрагмента стандартам Авито и получить оценку чистоты кода.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#04E061]/20 border border-[#04E061]/40 flex items-center justify-center text-[#04E061]">
                <Sparkles size={32} className="animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-white">Проверка по 10 правилам инженерии Авито...</h3>
              <p className="text-xs text-slate-400">
                Анализируем контексты, таймауты сокетов, N+1 выборки и соответствие Zero Bug Policy.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Score & Verdict Card */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Оценка надёжности</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                    result.status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : result.status === 'blocked'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {result.status === 'passed' ? '✅ Одобрено к PR' : result.status === 'blocked' ? '🚫 Блокеры ZBP' : '⚠️ Требует правок'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-black ${
                    result.score >= 80 ? 'text-[#04E061]' : result.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {result.score}<span className="text-base text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-snug">
                    {result.summary}
                  </div>
                </div>

                {/* Mentor note */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold text-[#00AAFF] flex items-center gap-1">
                    <Sparkles size={12} /> Совет наставника Алексея:
                  </span>
                  <p>{result.mentor_notes}</p>
                </div>
              </div>

              {/* Issues List */}
              {result.issues.length > 0 && (
                <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Замечания ({result.issues.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">кликните для просмотра решения</span>
                  </h4>

                  <div className="space-y-2">
                    {result.issues.map((iss) => {
                      const isSelected = selectedIssue?.id === iss.id;
                      const isBlocker = iss.severity === 'blocker';
                      return (
                        <div
                          key={iss.id}
                          onClick={() => setSelectedIssue(iss)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-1 ${
                            isSelected
                              ? 'bg-white/15 border-white/40 shadow-lg'
                              : isBlocker
                              ? 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'
                              : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 text-white">
                              {isBlocker ? <ShieldAlert size={14} className="text-rose-400" /> : <AlertTriangle size={14} className="text-amber-400" />}
                              {iss.rule_name}
                            </span>
                            {iss.line_number && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-400">
                                Стр. {iss.line_number}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{iss.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Issue Fix Diff & AI Helper */}
              {selectedIssue && (
                <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#04E061]" /> Рекомендуемое исправление:
                    </span>
                    {selectedIssue.suggested_diff && (
                      <button
                        onClick={() => handleCopyDiff(selectedIssue.suggested_diff!)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDiff ? <Check size={12} className="text-[#04E061]" /> : <Copy size={12} />}
                        {copiedDiff ? 'Скопировано!' : 'Копировать Diff'}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedIssue.recommendation}
                  </p>

                  {selectedIssue.suggested_diff && (
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre">
                      {selectedIssue.suggested_diff}
                    </div>
                  )}

                  {askFn && (
                    <button
                      onClick={() => askFn(`Объясни подробнее правило "${selectedIssue.rule_name}" в Авито и как правильно его соблюдать.`)}
                      className="w-full py-2 rounded-xl glass-card hover:border-[#00AAFF]/50 text-xs text-[#00AAFF] font-bold flex items-center justify-center gap-1.5 cursor-pointer pt-2"
                    >
                      <span>Спросить AI-buddy об этом правиле</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CodeReviewPlayground;
