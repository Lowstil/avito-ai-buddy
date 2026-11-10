import React, { useState } from 'react';
import type { CodeReviewResponse } from '../types';
import { api } from '../api/client';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Code,
  Play,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodeReviewPlaygroundProps {
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
  const [copiedDiffId, setCopiedDiffId] = useState<string | null>(null);
  const [copiedFullCode, setCopiedFullCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'fixed_code'>('issues');

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await api.analyzeCode(activeUserId, code, language);
      setResult(res);
      if (res.issues.length === 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      console.error('Failed to analyze code:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDiff = (diffText: string, id: string) => {
    navigator.clipboard.writeText(diffText);
    setCopiedDiffId(id);
    setTimeout(() => setCopiedDiffId(null), 2000);
  };

  const handleCopyFullRefactored = (fullText: string) => {
    navigator.clipboard.writeText(fullText);
    setCopiedFullCode(true);
    setTimeout(() => setCopiedFullCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#04E061] to-[#00AAFF] text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Terminal size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Pre-flight Code Review Playground
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-[#04E061]/20 text-[#04E061] font-bold text-[10px] border border-[#04E061]/40">
                  AI-ANALYZER
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Интеллектуальный статический аудит кода перед отправкой в ревью наставнику. Проверяет 10 золотых правил инженерии Авито и Zero Bug Policy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCode(SAMPLE_BAD_GO);
                setLanguage('go');
                setResult(null);
              }}
              className="px-3 py-1.5 rounded-xl glass-card text-xs text-rose-300 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer font-medium"
            >
              Код с ошибками (Демо)
            </button>
            <button
              onClick={() => {
                setCode(SAMPLE_CLEAN_GO);
                setLanguage('go');
                setResult(null);
              }}
              className="px-3 py-1.5 rounded-xl glass-card text-xs text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer font-medium"
            >
              Идеальный код по ZBP
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Editor (7 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-[#04E061]" />
                <span className="text-xs font-bold text-white">Редактор кода (Go / Python):</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setLanguage('go')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'go' ? 'bg-[#00AAFF] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Go (Golang)
                </button>
                <button
                  onClick={() => setLanguage('python')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'python' ? 'bg-[#965EEB] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Вставьте код микросервиса для анализа на соответствие стандартам Авито..."
              className="w-full h-[480px] bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-200 outline-none focus:border-[#04E061] transition-all resize-none leading-relaxed"
              spellCheck={false}
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Строк: {code.split('\n').length} • Проверка: Context, Panics, Limits, Rollbacks, %w
              </p>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !code.trim()}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-[#04E061] to-[#00AAFF] hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>AI-Анализ...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Запустить AI-Анализ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Multi-Issue Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {!result && !isLoading && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                <Code size={32} />
              </div>
              <h3 className="text-sm font-bold text-white">Код ещё не проанализирован</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Нажмите кнопку «Запустить AI-Анализ», чтобы проверить все замечания по Zero Bug Policy, получить оценку чистоты кода и сгенерировать исправленный вариант.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#04E061]/20 border border-[#04E061]/40 flex items-center justify-center text-[#04E061]">
                <Sparkles size={32} className="animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-white">Глубокий анализ кода по 10 правилам инженерии Авито...</h3>
              <p className="text-xs text-slate-400">
                ИИ проверяет проброс контекстов, таймауты сокетов, N+1 выборки, паники и соответствие Zero Bug Policy.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Score & Verdict Card */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Оценка надёжности и ZBP
                  </span>
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
                  <div className="text-xs text-slate-200 leading-snug">
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

              {/* View Switcher Tabs: All Issues vs Full AI Fixed Code */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'issues'
                      ? 'bg-gradient-to-r from-white/15 to-white/10 text-white shadow border border-white/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle size={14} className={result.issues.length > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                  <span>Все замечания ({result.issues.length})</span>
                </button>

                {result.full_refactored_code && (
                  <button
                    onClick={() => setActiveTab('fixed_code')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === 'fixed_code'
                        ? 'bg-gradient-to-r from-[#04E061]/20 to-[#00AAFF]/20 text-[#04E061] shadow border border-[#04E061]/30 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCheck2 size={14} className="text-[#04E061]" />
                    <span>Исправленный код от AI</span>
                  </button>
                )}
              </div>

              {/* TAB 1: ALL DETECTED ISSUES SIMULTANEOUSLY */}
              {activeTab === 'issues' && (
                <div className="space-y-3">
                  {result.issues.length === 0 ? (
                    <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 text-center space-y-2">
                      <ShieldCheck size={36} className="text-[#04E061] mx-auto" />
                      <h4 className="text-sm font-bold text-white">Критичных замечаний не обнаружено!</h4>
                      <p className="text-xs text-slate-300">
                        Код написан аккуратно и следует всем правилам Zero Bug Policy. Можно смело открывать Pull Request!
                      </p>
                    </div>
                  ) : (
                    result.issues.map((iss, index) => {
                      const isBlocker = iss.severity === 'blocker';
                      return (
                        <div
                          key={iss.id}
                          className={`glass-panel p-5 rounded-3xl border transition-all space-y-3 ${
                            isBlocker
                              ? 'border-rose-500/30 bg-rose-500/5'
                              : 'border-amber-500/30 bg-amber-500/5'
                          }`}
                        >
                          {/* Issue Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${isBlocker ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {isBlocker ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-xs flex items-center gap-2">
                                  <span>{index + 1}. {iss.rule_name}</span>
                                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                                    isBlocker ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                                  }`}>
                                    {isBlocker ? 'Блокер ZBP' : 'Замечание'}
                                  </span>
                                </h5>
                                {iss.line_number && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Строка в файле: #{iss.line_number}
                                  </span>
                                )}
                              </div>
                            </div>

                            {iss.suggested_diff && (
                              <button
                                onClick={() => handleCopyDiff(iss.suggested_diff!, iss.id)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 px-2.5 py-1 rounded-lg border border-white/10"
                              >
                                {copiedDiffId === iss.id ? (
                                  <>
                                    <Check size={12} className="text-[#04E061]" />
                                    <span className="text-[#04E061] font-bold">Скопировано!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Копировать Diff</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Problem Message */}
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {iss.message}
                          </p>

                          {/* Avito Scale Impact */}
                          {iss.impact && (
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-0.5">
                              <strong className="text-rose-400 block font-semibold flex items-center gap-1">
                                💥 Чем грозит на продакшене Авито:
                              </strong>
                              <p className="leading-relaxed">{iss.impact}</p>
                            </div>
                          )}

                          {/* Suggested Diff */}
                          {iss.suggested_diff && (
                            <div className="p-3 rounded-2xl bg-black/70 border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre">
                              {iss.suggested_diff}
                            </div>
                          )}

                          {/* Ask AI consultation */}
                          {askFn && (
                            <button
                              onClick={() => askFn(`Объясни подробнее правило "${iss.rule_name}" в Авито и как правильно его соблюдать.`)}
                              className="w-full py-1.5 rounded-xl glass-card hover:border-[#00AAFF]/50 text-xs text-[#00AAFF] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <HelpCircle size={13} />
                              <span>Спросить у AI-buddy полное объяснение этого правила</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: COMPLETE REFACTORED CODE */}
              {activeTab === 'fixed_code' && result.full_refactored_code && (
                <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <FileCheck2 size={16} className="text-[#04E061]" />
                        <span>Полный исправленный код (Ready for PR)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Все замечания исправлены в едином модуле согласно регламенту надежности Авито.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyFullRefactored(result.full_refactored_code!)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#04E061] text-slate-950 hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {copiedFullCode ? (
                        <>
                          <Check size={14} />
                          <span>Скопировано в буфер!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Скопировать весь код</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed">
                    {result.full_refactored_code}
                  </pre>
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
