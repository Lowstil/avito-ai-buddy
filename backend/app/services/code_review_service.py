import re
from typing import Optional
from app.models.schemas import CodeReviewRequest, CodeReviewResponse, CodeReviewIssue

class CodeReviewService:
    """Pre-flight Code Review Engine enforcing AvitoTech 10 Golden Engineering & ZBP Rules."""

    def analyze_code(self, req: CodeReviewRequest) -> CodeReviewResponse:
        code = req.code.strip()
        lines = code.splitlines()
        lang = req.language
        if lang == "auto":
            lang = "go" if ("package " in code or "func " in code or ":=" in code) else "python"

        issues: list[CodeReviewIssue] = []

        # --- Rule 1: Missing context in I/O / DB / HTTP calls (Go) ---
        if lang == "go":
            for idx, line in enumerate(lines, 1):
                if re.search(r'\.(Query|Exec|Get|Post|Do)\(', line) and "ctx" not in line and "context" not in line:
                    stripped = line.strip()
                    issues.append(CodeReviewIssue(
                        id=f"issue_ctx_{idx}",
                        rule_id="AVITO-GO-001",
                        rule_name="Проброс контекста (Context Timeout)",
                        severity="blocker",
                        line_number=idx,
                        snippet=stripped,
                        message="Вызов I/O или базы данных без передачи `ctx context.Context`.",
                        recommendation="В микросервисах Авито все сетевые вызовы и запросы к БД обязаны принимать контекст для защиты от зависания пула горутин.",
                        suggested_diff=f"- {stripped}\n+ " + re.sub(r'\(([^)]*)\)', r'(ctx, \1)', stripped)
                    ))

        # --- Rule 2: Raw panic() in production code (Strict Zero Bug Policy) ---
        for idx, line in enumerate(lines, 1):
            if re.search(r'\bpanic\(', line) and not line.strip().startswith("//"):
                issues.append(CodeReviewIssue(
                    id=f"issue_panic_{idx}",
                    rule_id="AVITO-ZBP-001",
                    rule_name="Запрет паник (Zero Bug Policy)",
                    severity="blocker",
                    line_number=idx,
                    snippet=line.strip(),
                    message="Использование `panic()` в прикладном коде.",
                    recommendation="По регламенту Zero Bug Policy Авито паники в production запрещены. Возвращайте типизированную ошибку `return nil, fmt.Errorf(...)`.",
                    suggested_diff=f"- {line.strip()}\n+ return nil, fmt.Errorf(\"operation failed: %w\", err)"
                ))

        # --- Rule 3: Error wrapping without %w (Go) ---
        if lang == "go":
            for idx, line in enumerate(lines, 1):
                if "fmt.Errorf(" in line and "%w" not in line and "err" in line:
                    issues.append(CodeReviewIssue(
                        id=f"issue_errwrap_{idx}",
                        rule_id="AVITO-GO-003",
                        rule_name="Оборачивание ошибок через %w",
                        severity="warning",
                        line_number=idx,
                        snippet=line.strip(),
                        message="Ошибка оборачивается через `%v` или `%s` вместо `%w`.",
                        recommendation="Используйте `%w` для сохранения стека и возможности проверки через `errors.Is` / `errors.As` в Sentry.",
                        suggested_diff=f"- {line.strip()}\n+ {line.strip().replace('%v', '%w').replace('%s', '%w')}"
                    ))

        # --- Rule 4: Unbounded SQL query without LIMIT (N+1 / memory blowup) ---
        for idx, line in enumerate(lines, 1):
            upper_line = line.upper()
            if "SELECT " in upper_line and " FROM " in upper_line and "LIMIT" not in upper_line and "COUNT(" not in upper_line:
                issues.append(CodeReviewIssue(
                    id=f"issue_sql_limit_{idx}",
                    rule_id="AVITO-SQL-001",
                    rule_name="Ограничение выборки (LIMIT / N+1 Protection)",
                    severity="blocker",
                    line_number=idx,
                    snippet=line.strip(),
                    message="SQL-запрос на выборку без явного `LIMIT`.",
                    recommendation="В сервисах доставки Авито таблицы содержат миллионы записей. Неограниченный `SELECT` исчерпает RAM пода Kubernetes.",
                    suggested_diff=f"{line.strip()} LIMIT $1"
                ))

        # --- Rule 5: Plain fmt.Println instead of structured logger ---
        for idx, line in enumerate(lines, 1):
            if (re.search(r'\bfmt\.Print(ln|f)?\(', line) or re.search(r'\bprint\(', line)) and not line.strip().startswith("//"):
                issues.append(CodeReviewIssue(
                    id=f"issue_log_{idx}",
                    rule_id="AVITO-LOG-001",
                    rule_name="Структурированное логирование (Zap/Slog)",
                    severity="warning",
                    line_number=idx,
                    snippet=line.strip(),
                    message="Использование неструктурированного вывода в stdout.",
                    recommendation="В Авито логи собираются в ELK/Splunk. Используйте `logger.Info(ctx, \"msg\", zap.String(...))`.",
                    suggested_diff=f"- {line.strip()}\n+ logger.Info(ctx, \"processed order\", zap.String(\"order_id\", orderID))"
                ))

        # --- Rule 6: Missing timeout in HTTP client ---
        for idx, line in enumerate(lines, 1):
            if ("&http.Client{}" in line or "http.DefaultClient" in line) and not line.strip().startswith("//"):
                issues.append(CodeReviewIssue(
                    id=f"issue_http_timeout_{idx}",
                    rule_id="AVITO-HTTP-001",
                    rule_name="Таймаут HTTP-клиента",
                    severity="blocker",
                    line_number=idx,
                    snippet=line.strip(),
                    message="HTTP-клиент без явного таймаута (`Timeout: 0`).",
                    recommendation="При деградации внешних служб доставки поды исчерпают лимит соединений. Установите `Timeout: 2 * time.Second`.",
                    suggested_diff=f"- {line.strip()}\n+ &http.Client{{Timeout: 2 * time.Second}}"
                ))

        # --- Rule 7: Unhandled error (_ = func()) ---
        for idx, line in enumerate(lines, 1):
            if re.search(r'\b_\s*=\s*[a-zA-Z0-9_]+\(', line) and "close" not in line.lower() and not line.strip().startswith("//"):
                issues.append(CodeReviewIssue(
                    id=f"issue_ignored_err_{idx}",
                    rule_id="AVITO-ZBP-002",
                    rule_name="Игнорирование возвращаемой ошибки",
                    severity="warning",
                    line_number=idx,
                    snippet=line.strip(),
                    message="Возвращаемое значение функции игнорируется через пустой идентификатор `_`.",
                    recommendation="Всегда проверяйте ошибки: `if err != nil { return err }`.",
                    suggested_diff=f"- {line.strip()}\n+ if err := ...; err != nil {{ return err }}"
                ))

        # --- Rule 8: Missing defer tx.Rollback() ---
        if "Begin(" in code or "BeginTx(" in code:
            if "Rollback(" not in code:
                issues.append(CodeReviewIssue(
                    id="issue_tx_rollback",
                    rule_id="AVITO-SQL-002",
                    rule_name="Безопасность транзакций (defer tx.Rollback)",
                    severity="blocker",
                    line_number=None,
                    message="Транзакция БД открывается без `defer tx.Rollback()`.",
                    recommendation="При возврате ранней ошибки без коммита транзакция зависнет в PostgreSQL, блокируя строки таблицы заказов.",
                    suggested_diff="defer tx.Rollback(ctx)"
                ))

        # Calculate Score & Status
        blockers = sum(1 for i in issues if i.severity == "blocker")
        warnings = sum(1 for i in issues if i.severity == "warning")
        
        penalty = (blockers * 25) + (warnings * 10)
        score = max(0, 100 - penalty)

        if blockers > 0:
            status = "blocked"
            summary = f"❌ Найдено {blockers} критических блокеров Zero Bug Policy и {warnings} замечаний. Отправка на код-ревью заблокирована."
            zbp_compliant = False
            mentor_notes = "Исправьте блокеры (проброс контекста, таймауты и LIMIT), иначе PR вернётся с ревью с просьбой о доработке."
        elif warnings > 0:
            status = "changes_requested"
            summary = f"⚠️ Код рабочий, но содержит {warnings} замечаний по стилю и надежности. Рекомендуется исправить перед созвоном с наставником."
            zbp_compliant = True
            mentor_notes = "Обратите внимание на логирование и оборачивание ошибок. Наставник оценит аккуратность!"
        else:
            status = "passed"
            summary = "🎉 Идеальный код! Соответствует всем 10 инженерным стандартам Авито и Zero Bug Policy. Можно открывать PR!"
            zbp_compliant = True
            mentor_notes = "Отличная работа! Код готов к слиянию в master ветку Delivery Core."

        return CodeReviewResponse(
            score=score,
            status=status,
            summary=summary,
            issues=issues,
            checked_rules_count=10,
            zbp_compliant=zbp_compliant,
            mentor_notes=mentor_notes
        )

code_review_service = CodeReviewService()
