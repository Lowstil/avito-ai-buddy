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
  onShowToast?: (msg: string, type: 'success' | 'xp' | 'info' | 'warning') => void;
}

const SAMPLE_BAD_PY = `# ❌ Нарушения стандартов надежности Python в Авито
import requests

def fetch_delivery_batch(user_id):
    # ❌ BUG 1: HTTP-запрос без таймаута блокирует поток в проде
    resp = requests.get(f"http://delivery-api.internal/batch?user={user_id}")
    
    # ❌ BUG 2: Опасный bare except скрывает критические системные сбои
    try:
        data = resp.json()
        return data["items"]
    except:
        return []
`;

const SAMPLE_CLEAN_PY = `"""Модуль доставки заказов по стандартам надежности AvitoTech"""
import logging
import requests

logger = logging.getLogger(__name__)

def fetch_delivery_batch(user_id: int) -> list:
    """Безопасный запрос с явным таймаутом сокета и типизированной обработкой"""
    try:
        # ✅ Обязательный таймаут (connect: 1s, read: 3s)
        resp = requests.get(
            f"http://delivery-api.internal/batch?user={user_id}",
            timeout=(1.0, 3.0)
        )
        resp.raise_for_status()
        return resp.json().get("items", [])
    except (requests.RequestException, ValueError) as err:
        logger.error("Ошибка при получении пачки доставки для user %s: %s", user_id, err)
        return []
`;

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
  onShowToast,
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
      if (res.status === 'passed' && res.score >= 90 && res.issues.length === 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
      if (!res.full_refactored_code && activeTab === 'fixed_code') {
        setActiveTab('issues');
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
    <div className="space-y-3 sm:space-y-4 w-full min-w-0" data-testid="code-review-playground">
      {/* Top Liquid Glass Header Banner */}
      <div className="glass-panel specular-inset p-4 sm:p-5 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="laser-line-spectrum absolute top-0 inset-x-0 opacity-70 pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 relative z-10">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-[#04E061] to-[#00AAFF] text-slate-950 font-black shadow-lg glow-green shrink-0">
              <Terminal size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-glass-pure tracking-tight">
                  Pre-flight Code Review Playground
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#04E061]/20 text-brand-green font-bold text-[10px] border border-[#04E061]/40 specular-inset shrink-0">
                  AI-ANALYZER
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-glass-secondary mt-0.5 leading-snug">
                Интеллектуальный статический аудит кода перед отправкой в ревью наставнику. Проверяет 10 золотых правил инженерии Авито и Zero Bug Policy.
              </p>
            </div>
          </div>

          {/* Preset Selector Pills (Horizontal Scroll on Mobile, Clean Wrap on Desktop) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 xl:pb-0 max-w-full shrink-0">
            <span className="text-[11px] text-glass-muted font-semibold mr-1 shrink-0">Пресеты:</span>
            <button
              type="button"
              data-testid="preset-bad-go"
              onClick={() => {
                setCode(SAMPLE_BAD_GO);
                setLanguage('go');
                setResult(null);
                if (onShowToast) onShowToast('Загружен демо-код на Go с ошибками ZBP', 'info');
              }}
              className="px-3 py-1.5 min-h-[34px] rounded-xl glass-pill text-xs text-rose-300 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer font-medium whitespace-nowrap shrink-0"
            >
              Go: Ошибки ZBP
            </button>
            <button
              type="button"
              data-testid="preset-clean-go"
              onClick={() => {
                setCode(SAMPLE_CLEAN_GO);
                setLanguage('go');
                setResult(null);
                if (onShowToast) onShowToast('Загружен чистый эталонный код на Go', 'success');
              }}
              className="px-3 py-1.5 min-h-[34px] rounded-xl glass-pill text-xs text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer font-medium whitespace-nowrap shrink-0"
            >
              Go: Чистый ZBP
            </button>
            <button
              type="button"
              data-testid="preset-bad-py"
              onClick={() => {
                setCode(SAMPLE_BAD_PY);
                setLanguage('python');
                setResult(null);
                if (onShowToast) onShowToast('Загружен код на Python с нарушениями таймаутов', 'info');
              }}
              className="px-3 py-1.5 min-h-[34px] rounded-xl glass-pill text-xs text-purple-300 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer font-medium whitespace-nowrap shrink-0"
            >
              Python: Без таймаута
            </button>
            <button
              type="button"
              data-testid="preset-clean-py"
              onClick={() => {
                setCode(SAMPLE_CLEAN_PY);
                setLanguage('python');
                setResult(null);
                if (onShowToast) onShowToast('Загружен чистый код на Python по стандартам Авито', 'success');
              }}
              className="px-3 py-1.5 min-h-[34px] rounded-xl glass-pill text-xs text-teal-300 border border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer font-medium whitespace-nowrap shrink-0"
            >
              Python: Чистый ZBP
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Balanced Split Grid (1920x1080 side-by-side, Mobile stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Column: Glassy Code Editor (6 cols on lg+) */}
        <div className="lg:col-span-6 flex flex-col min-w-0">
          <div className="glass-panel specular-inset p-3.5 sm:p-4 rounded-3xl border border-white/10 flex flex-col justify-between h-full space-y-3">
            {/* macOS Window Dots + Language Switcher Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5252] shadow-[0_0_6px_rgba(255,82,82,0.7)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] shadow-[0_0_6px_rgba(4,224,97,0.7)]" />
                </div>
                <div className="h-3.5 w-[1px] bg-white/10 shrink-0" />
                <div className="flex items-center gap-1.5 truncate">
                  <Code size={15} className="text-brand-green shrink-0" />
                  <span className="text-xs font-bold text-glass-pure truncate">
                    Редактор кода ({language === 'go' ? 'delivery.go' : 'delivery.py'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 specular-inset shrink-0">
                <button
                  type="button"
                  data-testid="lang-switch-go"
                  onClick={() => setLanguage('go')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'go'
                      ? 'bg-[#00AAFF] text-slate-950 shadow glow-blue'
                      : 'text-glass-muted hover:text-white'
                  }`}
                >
                  Go (Golang)
                </button>
                <button
                  type="button"
                  data-testid="lang-switch-python"
                  onClick={() => setLanguage('python')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'python'
                      ? 'bg-[#965EEB] text-white shadow glow-purple'
                      : 'text-glass-muted hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* IDE Line Numbers Gutter + Bounded Scrollable Code Editor */}
            <div className="relative flex rounded-2xl bg-[#060911]/90 border border-white/10 overflow-hidden focus-within:border-[#04E061]/70 focus-within:shadow-[0_0_20px_rgba(4,224,97,0.15)] transition-all">
              <div className="py-3.5 pl-2.5 pr-2 bg-black/50 border-r border-white/5 select-none text-right font-mono text-[11px] text-slate-500 leading-relaxed shrink-0">
                {code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                data-testid="code-review-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Вставьте код микросервиса для анализа на соответствие стандартам Авито..."
                className="w-full h-[280px] sm:h-[360px] lg:h-[400px] max-h-[460px] bg-transparent p-3.5 font-mono text-xs text-slate-100 outline-none resize-none leading-relaxed glass-scrollbar overflow-y-auto"
                spellCheck={false}
              />
            </div>

            {/* Bottom Action Bar with >= 44px Touch-Friendly Run Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <p className="text-[11px] text-glass-muted truncate">
                Строк: <strong className="text-glass-secondary">{code.split('\n').length}</strong> • Проверка: Context, Panics, Limits, Rollbacks, %w
              </p>

              <button
                type="button"
                data-testid="run-code-review-btn"
                onClick={handleAnalyze}
                disabled={isLoading || !code.trim()}
                className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-[#04E061] to-[#00AAFF] hover:brightness-110 active:scale-95 transition-all shadow-lg glow-green flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>AI-Анализ...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>Запустить AI-Анализ (Code Review)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Review Verdict & Scrollable Multi-Issue Breakdown (6 cols on lg+) */}
        <div className="lg:col-span-6 flex flex-col min-w-0">
          {!result && !isLoading && (
            <div className="glass-panel specular-inset p-6 sm:p-8 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center h-full min-h-[300px] lg:min-h-[490px] space-y-3.5">
              <div className="w-16 h-16 mx-auto rounded-2xl glass-pill flex items-center justify-center text-brand-blue glow-blue">
                <Code size={30} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-glass-pure">
                Код ещё не проанализирован
              </h3>
              <p className="text-xs text-glass-secondary max-w-md mx-auto leading-relaxed">
                Нажмите кнопку «Запустить AI-Анализ», чтобы проверить все замечания по Zero Bug Policy, получить оценку чистоты кода и сгенерировать исправленный вариант.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-full glass-pill text-[10px] font-semibold text-glass-muted">
                  🛡️ Zero Bug Policy
                </span>
                <span className="px-2.5 py-1 rounded-full glass-pill text-[10px] font-semibold text-glass-muted">
                  ⚡ Context & Timeouts
                </span>
                <span className="px-2.5 py-1 rounded-full glass-pill text-[10px] font-semibold text-glass-muted">
                  🔍 SQL Limit & Error %w
                </span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="glass-panel specular-inset p-6 sm:p-8 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center h-full min-h-[300px] lg:min-h-[490px] space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#04E061]/20 border border-[#04E061]/40 flex items-center justify-center text-brand-green glow-green">
                <Sparkles size={30} className="animate-spin" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-glass-pure">
                Глубокий анализ кода по 10 правилам инженерии Авито...
              </h3>
              <p className="text-xs text-glass-secondary max-w-sm mx-auto">
                ИИ проверяет проброс контекстов, таймауты сокетов, N+1 выборки, паники и соответствие Zero Bug Policy.
              </p>
            </div>
          )}

          {result && (
            <div className="glass-panel specular-inset p-3.5 sm:p-4 rounded-3xl border border-white/10 flex flex-col space-y-3 lg:max-h-[515px] overflow-y-auto glass-scrollbar">
              {/* Prominent Red Compiler / Syntax Error Banner */}
              {(result.status === 'blocked' &&
                (result.score === 0 ||
                  result.issues.some(
                    (i) =>
                      i.rule_id.includes('SYNTAX') ||
                      i.rule_id.includes('COMPILER') ||
                      i.rule_id.includes('SEMANTICS')
                  ))) && (
                <div
                  data-testid="compiler-error-banner"
                  className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/70 text-rose-200 space-y-2.5 shadow-lg glow-coral"
                >
                  <div className="flex items-center gap-2 text-rose-400 font-black text-xs sm:text-sm">
                    <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                      <Terminal size={16} />
                    </span>
                    <span className="tracking-tight">🚫 Ошибка компиляции / синтаксиса</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-medium">
                    Код не прошёл базовую проверку компилятором или содержит грубые ошибки синтаксиса / семантики. Слияние в ветку и открытие PR заблокированы.
                  </p>
                  <div className="p-3 rounded-xl bg-black/85 font-mono text-[11px] text-rose-400 border border-rose-500/40 overflow-x-auto whitespace-pre leading-relaxed glass-scrollbar">
                    {result.issues
                      .filter(
                        (i) =>
                          i.rule_id.includes('SYNTAX') ||
                          i.rule_id.includes('COMPILER') ||
                          i.rule_id.includes('SEMANTICS') ||
                          result.score === 0
                      )
                      .map((i) => `[COMPILER ERROR] Строка #${i.line_number || 1}: ${i.message}`)
                      .join('\n') || '[COMPILER ERROR] Синтаксическая ошибка в кодовой базе'}
                  </div>
                </div>
              )}

              {/* Score & Verdict Card */}
              <div
                data-testid="code-review-verdict-card"
                className="glass-card specular-inset p-4 rounded-2xl border border-white/10 space-y-2.5 shrink-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-glass-muted">
                    Оценка надёжности и ZBP
                  </span>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full border specular-inset ${
                      result.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : result.status === 'blocked'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {result.status === 'passed'
                      ? '✅ Одобрено к PR'
                      : result.status === 'blocked'
                      ? '🚫 Блокеры ZBP'
                      : '⚠️ Требует правок'}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div
                    className={`text-3xl sm:text-4xl font-black shrink-0 ${
                      result.score >= 80
                        ? 'text-brand-green text-glow-green'
                        : result.score >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400 text-glow-coral'
                    }`}
                  >
                    {result.score}
                    <span className="text-sm text-glass-muted font-normal">/100</span>
                  </div>
                  <div className="text-xs text-glass-primary leading-snug">
                    {result.summary}
                  </div>
                </div>

                {/* Mentor note */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-glass-secondary space-y-1">
                  <span className="text-[11px] font-bold text-brand-blue flex items-center gap-1">
                    <Sparkles size={12} /> Совет наставника Алексея:
                  </span>
                  <p className="leading-relaxed">{result.mentor_notes}</p>
                </div>
              </div>

              {/* View Switcher Tabs: All Issues vs Full AI Fixed Code */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10 shrink-0">
                <button
                  type="button"
                  data-testid="tab-review-issues"
                  onClick={() => setActiveTab('issues')}
                  className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'issues'
                      ? 'bg-gradient-to-r from-white/15 to-white/10 text-white shadow border border-white/20 specular-inset'
                      : 'text-glass-muted hover:text-white'
                  }`}
                >
                  <AlertTriangle
                    size={14}
                    className={result.issues.length > 0 ? 'text-rose-400 shrink-0' : 'text-emerald-400 shrink-0'}
                  />
                  <span className="truncate">Все замечания ({result.issues.length})</span>
                </button>

                {result.full_refactored_code && (
                  <button
                    type="button"
                    data-testid="tab-review-fixed-code"
                    onClick={() => setActiveTab('fixed_code')}
                    className={`flex-1 min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'fixed_code'
                        ? 'bg-gradient-to-r from-[#04E061]/20 to-[#00AAFF]/20 text-brand-green shadow border border-[#04E061]/40 font-black specular-inset'
                        : 'text-glass-muted hover:text-white'
                    }`}
                  >
                    <FileCheck2 size={14} className="text-brand-green shrink-0" />
                    <span className="truncate">Исправленный код от AI</span>
                  </button>
                )}
              </div>

              {/* TAB 1: ALL DETECTED ISSUES SIMULTANEOUSLY */}
              {activeTab === 'issues' && (
                <div className="space-y-2.5">
                  {result.issues.length === 0 ? (
                    <div className="glass-card specular-inset p-5 rounded-2xl border border-emerald-500/30 text-center space-y-2">
                      <ShieldCheck size={32} className="text-brand-green mx-auto" />
                      <h4 className="text-sm font-bold text-glass-pure">
                        Критичных замечаний не обнаружено!
                      </h4>
                      <p className="text-xs text-glass-secondary">
                        Код написан аккуратно и следует всем правилам Zero Bug Policy. Можно смело открывать Pull Request!
                      </p>
                    </div>
                  ) : (
                    result.issues.map((iss, index) => {
                      const isBlocker = iss.severity === 'blocker';
                      return (
                        <div
                          key={iss.id}
                          data-testid={`review-issue-${index}`}
                          className={`glass-card specular-inset p-4 rounded-2xl border transition-all space-y-2.5 ${
                            isBlocker
                              ? 'border-rose-500/35 bg-rose-500/[0.06]'
                              : 'border-amber-500/35 bg-amber-500/[0.06]'
                          }`}
                        >
                          {/* Issue Header */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span
                                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                  isBlocker
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {isBlocker ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-bold text-glass-pure text-xs flex flex-wrap items-center gap-1.5">
                                  <span>
                                    {index + 1}. {iss.rule_name}
                                  </span>
                                  <span
                                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                                      isBlocker
                                        ? 'bg-rose-500/30 text-rose-300'
                                        : 'bg-amber-500/30 text-amber-300'
                                    }`}
                                  >
                                    {isBlocker ? 'Блокер ZBP' : 'Замечание'}
                                  </span>
                                </h5>
                                {iss.line_number && (
                                  <span className="text-[10px] font-mono text-glass-muted">
                                    Строка в файле: #{iss.line_number}
                                  </span>
                                )}
                              </div>
                            </div>

                            {iss.suggested_diff && (
                              <button
                                type="button"
                                onClick={() => handleCopyDiff(iss.suggested_diff!, iss.id)}
                                className="text-[11px] text-glass-secondary hover:text-white flex items-center gap-1 cursor-pointer glass-pill px-2.5 py-1 rounded-lg shrink-0"
                              >
                                {copiedDiffId === iss.id ? (
                                  <>
                                    <Check size={12} className="text-brand-green" />
                                    <span className="text-brand-green font-bold">Скопировано!</span>
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
                          <p className="text-xs text-glass-primary leading-relaxed font-medium">
                            {iss.message}
                          </p>

                          {/* Avito Scale Impact */}
                          {iss.impact && (
                            <div className="p-2.5 rounded-xl bg-black/45 border border-white/5 text-[11px] text-glass-secondary space-y-0.5">
                              <strong className="text-rose-400 font-semibold flex items-center gap-1">
                                💥 Чем грозит на продакшене Авито:
                              </strong>
                              <p className="leading-relaxed">{iss.impact}</p>
                            </div>
                          )}

                          {/* Suggested Diff */}
                          {iss.suggested_diff && (
                            <div className="p-3 rounded-xl bg-[#060911]/90 border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre glass-scrollbar">
                              {iss.suggested_diff}
                            </div>
                          )}

                          {/* Ask AI consultation */}
                          {askFn && (
                            <button
                              type="button"
                              onClick={() =>
                                askFn(
                                  `Объясни подробнее правило "${iss.rule_name}" в Авито и как правильно его соблюдать.`
                                )
                              }
                              className="w-full min-h-[38px] py-1.5 px-3 rounded-xl glass-pill hover:border-[#00AAFF]/50 text-xs text-brand-blue font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <HelpCircle size={13} className="shrink-0" />
                              <span className="truncate">Спросить у AI-buddy полное объяснение этого правила</span>
                              <ArrowRight size={13} className="shrink-0" />
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
                <div className="glass-card specular-inset p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-glass-pure flex items-center gap-1.5">
                        <FileCheck2 size={16} className="text-brand-green shrink-0" />
                        <span>Полный исправленный код (Ready for PR)</span>
                      </h4>
                      <p className="text-[11px] text-glass-muted">
                        Все замечания исправлены в едином модуле согласно регламенту надежности Авито.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid="insert-refactored-code-btn"
                        onClick={() => {
                          if (result.full_refactored_code) {
                            setCode(result.full_refactored_code);
                            setActiveTab('issues');
                            if (onShowToast) {
                              onShowToast(
                                'Отрефакторенный код перенесён в редактор! Нажмите «Запустить AI-Анализ» для повторной проверки.',
                                'success'
                              );
                            }
                          }
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs glass-pill text-white hover:border-[#04E061]/50 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Check size={14} className="text-brand-green" />
                        <span>Вставить в редактор</span>
                      </button>

                      <button
                        type="button"
                        data-testid="copy-refactored-code-btn"
                        onClick={() => {
                          handleCopyFullRefactored(result.full_refactored_code!);
                          if (onShowToast)
                            onShowToast('Полный отрефакторенный код скопирован в буфер обмена', 'info');
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs bg-[#04E061] text-slate-950 hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        {copiedFullCode ? (
                          <>
                            <Check size={14} />
                            <span>Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Скопировать</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-[#060911]/90 border border-white/10 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[320px] leading-relaxed glass-scrollbar">
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
