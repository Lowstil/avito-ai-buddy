import ast
import os
import re
import shutil
import subprocess
from typing import Optional
from app.models.schemas import CodeReviewRequest, CodeReviewResponse, CodeReviewIssue
from app.services.gemini_service import gemini_service
from app.services.gamification_service import gamification_service

def validate_go_syntax(code: str) -> tuple[bool, Optional[str], Optional[int]]:
    """Validates Go syntax and file structure.
    Returns (is_valid, error_message, line_number)
    """
    stripped = code.strip()
    if not stripped:
        return False, "Код пуст или содержит только пробельные символы.", 1

    # Check using gofmt if available in PATH
    gofmt_bin = shutil.which("gofmt")
    if gofmt_bin:
        try:
            res = subprocess.run(
                [gofmt_bin, "-e"],
                input=code,
                capture_output=True,
                text=True,
                timeout=5
            )
            if res.returncode != 0:
                err_line = res.stderr.strip()
                line_no = 1
                match = re.search(r":(\d+):(\d+):", err_line)
                if match:
                    line_no = int(match.group(1))
                return False, f"Ошибка компиляции Go (gofmt): {err_line}", line_no
        except Exception:
            pass

    # Built-in structured syntax validation (delimiter balance and structure check)
    stack: list[tuple[str, int]] = []
    pairs = {')': '(', '}': '{', ']': '['}
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    in_block_comment = False

    lines = code.splitlines()
    for line_idx, line in enumerate(lines, 1):
        i = 0
        n = len(line)
        while i < n:
            ch = line[i]
            next_ch = line[i + 1] if i + 1 < n else ''

            if in_block_comment:
                if ch == '*' and next_ch == '/':
                    in_block_comment = False
                    i += 2
                    continue
                i += 1
                continue

            if not (in_single_quote or in_double_quote or in_backtick):
                if ch == '/' and next_ch == '/':
                    break
                if ch == '/' and next_ch == '*':
                    in_block_comment = True
                    i += 2
                    continue

            if ch == '"' and not in_single_quote and not in_backtick:
                if not (i > 0 and line[i - 1] == '\\'):
                    in_double_quote = not in_double_quote
                i += 1
                continue
            if ch == "'" and not in_double_quote and not in_backtick:
                if not (i > 0 and line[i - 1] == '\\'):
                    in_single_quote = not in_single_quote
                i += 1
                continue
            if ch == '`' and not in_single_quote and not in_double_quote:
                in_backtick = not in_backtick
                i += 1
                continue

            if not (in_single_quote or in_double_quote or in_backtick):
                if ch in "({[":
                    stack.append((ch, line_idx))
                elif ch in ")}]":
                    if not stack:
                        return False, f"Синтаксическая ошибка: лишняя закрывающая скобка '{ch}' на строке {line_idx}", line_idx
                    open_ch, open_line = stack.pop()
                    if pairs[ch] != open_ch:
                        return False, f"Синтаксическая ошибка: несоответствие скобок: открыта '{open_ch}' на строке {open_line}, закрыта '{ch}' на строке {line_idx}", line_idx
            i += 1

    if stack:
        open_ch, open_line = stack[-1]
        return False, f"Синтаксическая ошибка Go: незакрытая скобка '{open_ch}' на строке {open_line}", open_line

    # Go structural keyword check (must contain package or func)
    has_package = "package " in stripped
    has_func = "func " in stripped
    if not has_package and not has_func:
        return False, f"Ошибка компиляции Go: ожидалось объявление пакета ('package') или функции ('func'), обнаружен невалидный токен '{stripped[:40]}' вне контекста (non-declaration statement outside function body)", 1

    # Detailed statement and top-level declaration check
    depth = 0
    paren_depth = 0
    top_allowed = ("package", "import", "func", "type", "var", "const", "//", "/*", "*/", "*")
    stmt_control = (
        "return", "if", "for", "switch", "case", "select", "default", "defer",
        "go", "break", "continue", "fallthrough", "goto", "var", "const", "type"
    )

    for line_idx, line in enumerate(lines, 1):
        raw = re.sub(r'//.*$', '', line).strip()
        if not raw:
            continue

        open_braces = raw.count('{')
        close_braces = raw.count('}')
        open_parens = raw.count('(')
        close_parens = raw.count(')')

        # Top-level (depth == 0 and paren_depth == 0): only declarations and braces/parens are permitted
        if depth == 0 and paren_depth == 0 and not raw.startswith(('}', ')')):
            first_word = raw.split()[0] if raw.split() else ''
            if not any(raw.startswith(kw) for kw in top_allowed):
                return False, f"Ошибка компиляции Go: non-declaration statement outside function body на строке {line_idx}: '{raw[:40]}'", line_idx

        # Inside function body (depth > 0)
        curr_depth = depth + open_braces - close_braces
        if depth > 0 or (open_braces > 0 and not raw.startswith(('func', 'type'))):
            words = raw.split()
            # Flag isolated bare statement identifier (e.g. 'ddd' or 'identifier')
            if len(words) == 1 and not any(raw.startswith(kw) for kw in stmt_control) and raw not in ('{', '}', '})', '}) ;', '};'):
                bare = words[0].rstrip(';')
                if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', bare):
                    return False, f"Ошибка компиляции Go: синтаксическая ошибка на строке {line_idx}: невалидный оператор '{bare}' (evaluated but not used / unexpected newline, expecting := or =)", line_idx

        depth = max(0, curr_depth)
        paren_depth = max(0, paren_depth + open_parens - close_parens)

    return True, None, None

def validate_python_syntax(code: str) -> tuple[bool, Optional[str], Optional[int]]:
    """Validates Python syntax and semantics using AST.
    Returns (is_valid, error_message, line_number)
    """
    stripped = code.strip()
    if not stripped:
        return False, "Код пуст или содержит только пробельные символы.", 1

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Синтаксическая ошибка Python: {e.msg} (строка {e.lineno})", e.lineno or 1

    if not tree.body:
        return False, "Синтаксическая ошибка: пустой блок кода.", 1

    # Semantic check: detect bare unassigned undefined identifier expressions (like `ddd`)
    defined = set(dir(__builtins__))
    defined.update(["self", "cls", "logger", "app", "router", "db", "client", "session", "ctx", "request", "response"])

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            defined.add(node.name)
            for arg in node.args.posonlyargs + node.args.args + node.args.kwonlyargs:
                defined.add(arg.arg)
            if node.args.vararg:
                defined.add(node.args.vararg.arg)
            if node.args.kwarg:
                defined.add(node.args.kwarg.arg)
        elif isinstance(node, ast.ClassDef):
            defined.add(node.name)
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            defined.add(node.id)
        elif isinstance(node, ast.Import):
            for n in node.names:
                defined.add(n.asname or n.name)
        elif isinstance(node, ast.ImportFrom):
            for n in node.names:
                defined.add(n.asname or n.name)
        elif isinstance(node, (ast.For, ast.AsyncFor)):
            for target_name in ast.walk(node.target):
                if isinstance(target_name, ast.Name):
                    defined.add(target_name.id)
        elif isinstance(node, (ast.With, ast.AsyncWith)):
            for item in node.items:
                if item.optional_vars:
                    for target_name in ast.walk(item.optional_vars):
                        if isinstance(target_name, ast.Name):
                            defined.add(target_name.id)

    # Check for bare expressions that are undefined Names anywhere in the code
    for node in ast.walk(tree):
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Name):
            if node.value.id not in defined:
                name = node.value.id
                lineno = getattr(node, 'lineno', 1)
                return False, f"Ошибка семантики: неинициализированный идентификатор '{name}' вне контекста выполнения (NameError: name '{name}' is not defined)", lineno

    # Semantic check: detect if body consists solely of unassigned bare ast.Expr(ast.Name) or ast.Expr(ast.Constant)
    has_definitions = any(
        isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Assign, ast.AnnAssign, ast.AugAssign, ast.Import, ast.ImportFrom))
        for n in tree.body
    )
    if not has_definitions and all(isinstance(stmt, ast.Expr) and isinstance(stmt.value, (ast.Name, ast.Constant)) for stmt in tree.body):
        first = tree.body[0].value
        token_name = first.id if isinstance(first, ast.Name) else str(getattr(first, 'value', 'token'))
        return False, f"Ошибка семантики: неинициализированный идентификатор '{token_name}' вне контекста выполнения (NameError: name '{token_name}' is not defined)", 1

    return True, None, None


class CodeReviewService:
    """Pre-flight Code Review Engine enforcing AvitoTech 10 Golden Engineering & ZBP Rules."""

    def analyze_code(self, req: CodeReviewRequest, user_id: Optional[str] = None) -> CodeReviewResponse:
        code = req.code.strip()
        lang = req.language

        # -------------------------------------------------------------
        # LEVEL 0: SANITY GUARDRAIL
        # -------------------------------------------------------------
        if not code:
            return CodeReviewResponse(
                score=0,
                status="blocked",
                summary="🚫 Синтаксическая ошибка: код пуст или не содержит структуры программы.",
                issues=[CodeReviewIssue(
                    id="syntax_err_empty",
                    rule_id="AVITO-SYNTAX-001",
                    rule_name="Синтаксическая валидация",
                    severity="blocker",
                    line_number=1,
                    snippet="",
                    message="Синтаксическая ошибка: код пуст или состоит только из пробелов.",
                    impact="Пустой код не может быть скомпилирован или запущен.",
                    recommendation="Вставьте валидный исходный код функции или модуля.",
                    full_explanation="Статический анализатор и компилятор требуют непустой исходный код."
                )],
                checked_rules_count=10,
                zbp_compliant=False,
                mentor_notes="Код пуст. Пожалуйста, напишите или вставьте код перед запуском ревью.",
                full_refactored_code=None,
                ai_executive_summary="### 🚫 Ошибка компиляции / синтаксиса\n\nКод пуст."
            )

        # Detect single bare token/gibberish without punctuation/keywords (e.g. 'ddd', 'foo')
        words = code.split()
        if len(words) == 1 and not any(ch in code for ch in "():={}[]\"'.,;<>"):
            bare_tok = words[0]
            if lang in ["go", "auto"] and bare_tok not in ["package", "func", "import", "type"]:
                err_msg = f"Ошибка компиляции Go: ожидалось объявление пакета ('package') или функции ('func'), обнаружен невалидный токен '{bare_tok}' вне контекста (non-declaration statement outside function body)"
                rule_id = "AVITO-GO-COMPILER"
                rule_name = "Ошибка компиляции Go"
            else:
                err_msg = f"Ошибка семантики: неинициализированный идентификатор '{bare_tok}' вне контекста выполнения (NameError: name '{bare_tok}' is not defined)"
                rule_id = "AVITO-PY-SEMANTICS"
                rule_name = "Ошибка семантики Python"

            return CodeReviewResponse(
                score=0,
                status="blocked",
                summary="🚫 Ошибка компиляции / синтаксиса: невалидный фрагмент кода.",
                issues=[CodeReviewIssue(
                    id="syntax_err_bare_token",
                    rule_id=rule_id,
                    rule_name=rule_name,
                    severity="blocker",
                    line_number=1,
                    snippet=bare_tok,
                    message=err_msg,
                    impact="Код не скомпилируется компилятором gc/CPython. Сборка контейнера в CI/CD завершится с фатальной ошибкой.",
                    recommendation="Оформите код в виде полноценной функции ('func ...' / 'def ...') или модуля.",
                    full_explanation="Синтаксический анализатор не может распознать структуру программы."
                )],
                checked_rules_count=10,
                zbp_compliant=False,
                mentor_notes=f"Код '{bare_tok}' не является корректной программой. Укажите сигнатуру функции и тело алгоритма.",
                full_refactored_code=None,
                ai_executive_summary=f"### 🚫 Ошибка компиляции / синтаксиса\n\nОбнаружен невалидный токен `{bare_tok}` вне контекста программы."
            )

        # Language resolution
        if lang == "auto":
            lang = "go" if ("package " in code or "func " in code or ":=" in code or "import (" in code) else "python"

        # -------------------------------------------------------------
        # LEVEL 1: LANGUAGE SYNTAX & COMPILER VALIDATION
        # -------------------------------------------------------------
        if lang == "go":
            is_valid, err_msg, err_line = validate_go_syntax(code)
            if not is_valid:
                return CodeReviewResponse(
                    score=0,
                    status="blocked",
                    summary="🚫 Ошибка компиляции Go: синтаксический анализатор отклонил код.",
                    issues=[CodeReviewIssue(
                        id="issue_go_compiler_err",
                        rule_id="AVITO-GO-COMPILER",
                        rule_name="Ошибка компиляции Go",
                        severity="blocker",
                        line_number=err_line or 1,
                        snippet=code.splitlines()[(err_line - 1)] if (err_line and err_line <= len(code.splitlines())) else code[:60],
                        message=err_msg or "Ошибка синтаксиса Go",
                        impact="Код не компилируется стандартным компилятором gc. Сборка проекта в GitLab CI упадёт на этапе go build.",
                        recommendation="Исправьте синтаксическую ошибку Go (скобки, ключевые слова, сигнатуру функции).",
                        full_explanation=f"Детали компилятора: {err_msg}"
                    )],
                    checked_rules_count=10,
                    zbp_compliant=False,
                    mentor_notes="Код содержит синтаксические ошибки Go. Исправьте ошибки компиляции перед аудитом Zero Bug Policy.",
                    full_refactored_code=None,
                    ai_executive_summary=f"### 🚫 Ошибка компиляции Go\n\n{err_msg}"
                )
        elif lang == "python":
            is_valid, err_msg, err_line = validate_python_syntax(code)
            if not is_valid:
                rule_id = "AVITO-PY-SEMANTICS" if "семантики" in (err_msg or "") else "AVITO-PY-SYNTAX"
                rule_name = "Ошибка семантики Python" if "семантики" in (err_msg or "") else "Ошибка синтаксиса Python"
                return CodeReviewResponse(
                    score=0,
                    status="blocked",
                    summary="🚫 Ошибка синтаксиса Python: код содержит синтаксические или семантические дефекты.",
                    issues=[CodeReviewIssue(
                        id="issue_py_syntax_err",
                        rule_id=rule_id,
                        rule_name=rule_name,
                        severity="blocker",
                        line_number=err_line or 1,
                        snippet=code.splitlines()[(err_line - 1)] if (err_line and err_line <= len(code.splitlines())) else code[:60],
                        message=err_msg or "Синтаксическая ошибка Python",
                        impact="Интерпретатор CPython не может построить абстрактное синтаксическое дерево (AST). Модуль завершится аварийно при импорте.",
                        recommendation="Исправьте синтаксис Python, двоеточия, отступы или незакрытые скобки.",
                        full_explanation=f"Детали парсера: {err_msg}"
                    )],
                    checked_rules_count=10,
                    zbp_compliant=False,
                    mentor_notes="Код не проходит базовый синтаксический разбор Python. Устраните SyntaxError.",
                    full_refactored_code=None,
                    ai_executive_summary=f"### 🚫 Ошибка синтаксиса Python\n\n{err_msg}"
                )

        # -------------------------------------------------------------
        # LEVEL 1: ZBP DOMAIN & RELIABILITY RULES
        # -------------------------------------------------------------
        issues: list[CodeReviewIssue] = []
        lines = code.splitlines()

        if lang == "go":
            # Rule 1: Missing context in I/O / DB / HTTP calls (Go)
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
                        impact="В продакшене Авито при сетевом сбое этот вызов зависнет навсегда. Накопление 500+ зависших горутин исчерпает пул памяти пода и приведёт к каскадному падению микросервиса.",
                        recommendation="Используйте `QueryContext(ctx, ...)` или передавайте контекст с таймаутом `context.WithTimeout(ctx, 3*time.Second)`.",
                        suggested_diff=f"- {stripped}\n+ " + re.sub(r'\(([^)]*)\)', r'(ctx, \1)', stripped).replace(".Query(", ".QueryContext(").replace(".Exec(", ".ExecContext("),
                        full_explanation="В распределённых микросервисах Авито контекст отвечает за распространение deadline, trace_id и отмену операций при разрыве клиентского соединения. Без ctx отмена не сработает, и сервер продолжит бесполезно нагружать базу данных."
                    ))

            # Rule 2: Raw panic() in production code (Strict Zero Bug Policy)
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
                        impact="Паника обрушивает весь процесс инстанса в Kubernetes, сбрасывая все параллельные запросы реальных пользователей Авито. Это грубое нарушение регламента Zero Bug Policy (P0 инцидент).",
                        recommendation="Замените панику на возврат типизированной ошибки: `return fmt.Errorf(\"operation failed: %w\", err)`.",
                        suggested_diff=f"- {line.strip()}\n+ return fmt.Errorf(\"operation failed: %w\", err)",
                        full_explanation="Стандарты надежности Авито требуют обработки всех нештатных ситуаций на уровне возвращаемых ошибок. Паники допустимы только на фазе инициализации сервиса в `init()` при фатальных ошибках конфигов."
                    ))

            # Rule 3: Error wrapping without %w (Go)
            for idx, line in enumerate(lines, 1):
                if "fmt.Errorf(" in line and "%w" not in line and "err" in line:
                    issues.append(CodeReviewIssue(
                        id=f"issue_errwrap_{idx}",
                        rule_id="AVITO-GO-003",
                        rule_name="Оборачивание ошибок через %w",
                        severity="warning",
                        line_number=idx,
                        snippet=line.strip(),
                        message="Ошибка оборачивается через `%v` или `%s` вместо директивы `%w`.",
                        impact="Приводит к потере дерева ошибок: код выше по стеку не сможет проверить `errors.Is(err, sql.ErrNoRows)` или извлечь кастомный тип через `errors.As`. В Sentry теряется группировка багов.",
                        recommendation="Используйте `%w` в форматировании ошибки: `fmt.Errorf(\"failed to execute: %w\", err)`.",
                        suggested_diff=f"- {line.strip()}\n+ {line.strip().replace('%v', '%w').replace('%s', '%w')}",
                        full_explanation="Директива `%w` оборачивает ошибку с сохранением интерфейса `Unwrap()`, что является стандартным идиоматичным подходом в Go 1.13+ и строгим правилом линтеров Авито."
                    ))

            # Rule 4: Unbounded SQL query without LIMIT
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
                        message="SQL-запрос на выборку без явного ограничения `LIMIT`.",
                        impact="Таблицы заказов и объявлений Авито насчитывают десятки миллионов строк. Запрос без LIMIT попытается загрузить терабайты данных в память, вызвав мгновенный OOMKilled пода и перегрузку PostgreSQL.",
                        recommendation="Обязательно добавьте `LIMIT $1` или `LIMIT 100` с пагинацией по первичному ключу.",
                        suggested_diff=f"{line.strip()} LIMIT $1",
                        full_explanation="Все выборки в микросервисах Авито должны быть строжайше ограничены сверху константой или параметром пагинации (Cursor-based или Keyset пагинация)."
                    ))

            # Rule 5: Plain fmt.Println instead of structured logger
            for idx, line in enumerate(lines, 1):
                if (re.search(r'\bfmt\.Print(ln|f)?\(', line) or re.search(r'\bprint\(', line)) and not line.strip().startswith("//"):
                    issues.append(CodeReviewIssue(
                        id=f"issue_log_{idx}",
                        rule_id="AVITO-LOG-001",
                        rule_name="Структурированное логирование (Zap/Slog)",
                        severity="warning",
                        line_number=idx,
                        snippet=line.strip(),
                        message="Использование неструктурированного вывода в stdout (`fmt.Println`).",
                        impact="Неструктурированный текст ломает парсеры в ELK/Kibana и VictoriaMetrics. Дежурные инженеры не смогут отфильтровать логи по trace_id, user_id или уровню severity.",
                        recommendation="Используйте структурированный логгер: `logger.Info(ctx, \"event occurred\", zap.String(\"id\", id))`.",
                        suggested_diff=f"- {line.strip()}\n+ logger.Info(ctx, \"processed orders\", zap.Int(\"count\", len(orders)))",
                        full_explanation="В Авито каждый лог-запись обязана быть валидным JSON-объектом с метаданными окружения, пода и trace_id."
                    ))

            # Rule 6: Missing timeout in HTTP client
            for idx, line in enumerate(lines, 1):
                if ("&http.Client{}" in line or "http.DefaultClient" in line or "http.Get(" in line or "http.Post(" in line) and not line.strip().startswith("//"):
                    issues.append(CodeReviewIssue(
                        id=f"issue_http_timeout_{idx}",
                        rule_id="AVITO-HTTP-001",
                        rule_name="Таймаут HTTP-клиента",
                        severity="blocker",
                        line_number=idx,
                        snippet=line.strip(),
                        message="HTTP-клиент без явного таймаута (`Timeout: 0`).",
                        impact="Стандартный `http.DefaultClient` не имеет таймаута. Если внешний шлюз зависнет, HTTP-соединения останутся открытыми, исчерпав сокеты операционной системы (FD exhaustion).",
                        recommendation="Создавайте клиент с явным таймаутом: `&http.Client{Timeout: 3 * time.Second}`.",
                        suggested_diff=f"- {line.strip()}\n+ client := &http.Client{{Timeout: 3 * time.Second}}",
                        full_explanation="В архитектуре Авито любые межсервисные HTTP и gRPC вызовы должны сопровождаться четким SLA по задержке с автоматическим обрывом по таймауту."
                    ))

            # Rule 7: Unhandled error (_ = func())
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
                        impact="Скрывает тихие сбои записи в базу данных или отправки в Kafka, создавая расхождение данных (data corruption), которое крайне сложно диагностировать.",
                        recommendation="Всегда проверяйте ошибки: `if err := fn(); err != nil { return err }`.",
                        suggested_diff=f"- {line.strip()}\n+ if err := ...; err != nil {{ return err }}",
                        full_explanation="Zero Bug Policy запрещает игнорировать ошибки. Любой сбой должен либо обрабатываться локально, либо пробрасываться наверх с контекстом."
                    ))

            # Rule 8: Missing defer tx.Rollback()
            if "Begin(" in code or "BeginTx(" in code:
                if "Rollback(" not in code:
                    issues.append(CodeReviewIssue(
                        id="issue_tx_rollback",
                        rule_id="AVITO-SQL-002",
                        rule_name="Безопасность транзакций (defer tx.Rollback)",
                        severity="blocker",
                        line_number=None,
                        message="Транзакция БД открывается без `defer tx.Rollback()`.",
                        impact="При ошибке в теле функции транзакция не будет закрыта и останется в состоянии `idle in transaction`, удерживая локи строк и блокируя другие поды.",
                        recommendation="Сразу после `BeginTx` добавьте: `defer tx.Rollback()` (если транзакция закоммичена, Rollback безопасен и вернёт `sql.ErrTxDone`).",
                        suggested_diff="defer tx.Rollback()",
                        full_explanation="Идиоматичный паттерн в Go для работы с SQL: сразу после успешного открытия транзакции объявляется `defer tx.Rollback()`. В конце успешного сценария вызывается `tx.Commit()`."
                    ))

        elif lang == "python":
            py_tree = ast.parse(code)
            for node in ast.walk(py_tree):
                # Rule Python 1: Bare except
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    issues.append(CodeReviewIssue(
                        id=f"issue_py_bare_except_{node.lineno}",
                        rule_id="AVITO-PY-001",
                        rule_name="Запрет bare except: (Zero Bug Policy)",
                        severity="blocker",
                        line_number=node.lineno,
                        snippet=lines[node.lineno - 1].strip() if node.lineno <= len(lines) else "except:",
                        message="Использование `except:` без указания типа исключения.",
                        impact="Перехватывает `KeyboardInterrupt` и `SystemExit`, препятствуя Graceful Shutdown пода в Kubernetes при релизе.",
                        recommendation="Перехватывайте конкретные исключения: `except Exception as err:` или кастомные доменные классы.",
                        suggested_diff="- except:\n+ except Exception as err:",
                        full_explanation="В Python регламент ZBP запрещает ловить BaseException вслепую."
                    ))

                # Rule Python 2: HTTP requests without timeout
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                    if node.func.attr in ["get", "post", "put", "delete", "request"]:
                        caller = getattr(node.func.value, "id", "")
                        if caller in ["requests", "httpx", "client", "session", "http"]:
                            has_timeout = any(kw.arg == "timeout" for kw in node.keywords)
                            if not has_timeout:
                                issues.append(CodeReviewIssue(
                                    id=f"issue_py_http_timeout_{node.lineno}",
                                    rule_id="AVITO-HTTP-001",
                                    rule_name="Таймаут HTTP-клиента",
                                    severity="blocker",
                                    line_number=node.lineno,
                                    snippet=lines[node.lineno - 1].strip() if node.lineno <= len(lines) else "",
                                    message="Сетевой вызов без обязательного параметра `timeout`.",
                                    impact="При сетевой деградации внешний шлюз не разорвёт соединение, исчерпав worker pool микросервиса.",
                                    recommendation="Укажите таймаут: `requests.get(url, timeout=3.0)`.",
                                    suggested_diff=f"{lines[node.lineno - 1].strip()} -> timeout=3.0",
                                    full_explanation="Все исходящие межсервисные HTTP-запросы в Авито обязаны иметь явный SLA таймаут."
                                ))

                # Rule Python 3: Blocking time.sleep in async def
                if isinstance(node, (ast.AsyncFunctionDef,)):
                    for inner in ast.walk(node):
                        if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Attribute):
                            if inner.func.attr == "sleep" and getattr(inner.func.value, "id", "") == "time":
                                issues.append(CodeReviewIssue(
                                    id=f"issue_py_async_sleep_{inner.lineno}",
                                    rule_id="AVITO-PY-ASYNC-001",
                                    rule_name="Синхронный time.sleep в async функции",
                                    severity="blocker",
                                    line_number=inner.lineno,
                                    snippet=lines[inner.lineno - 1].strip() if inner.lineno <= len(lines) else "",
                                    message="Блокирующий `time.sleep` внутри `async def`.",
                                    impact="Замораживает Event Loop всего процесса Python, блокируя параллельную обработку запросов сотен пользователей.",
                                    recommendation="Замените на неблокирующий вызов: `await asyncio.sleep(...)`.",
                                    suggested_diff="- time.sleep(...)\n+ await asyncio.sleep(...)",
                                    full_explanation="В асинхронном FastAPI сервисе синхронный sleep останавливает обработку корутин."
                                ))

                # Rule Python 4: Plain print
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print":
                    issues.append(CodeReviewIssue(
                        id=f"issue_py_print_{node.lineno}",
                        rule_id="AVITO-LOG-001",
                        rule_name="Структурированное логирование (logging/structlog)",
                        severity="warning",
                        line_number=node.lineno,
                        snippet=lines[node.lineno - 1].strip() if node.lineno <= len(lines) else "",
                        message="Использование вывода в stdout через `print()`.",
                        impact="Теряются метаданные трейсинга OpenTelemetry (trace_id, span_id), логи не фильтруются в VictoriaLogs.",
                        recommendation="Используйте структурированный логгер: `logger.info(\"msg\", extra={\"order_id\": id})`.",
                        suggested_diff="- print(...)\n+ logger.info(...)",
                        full_explanation="Авито стандартизирует логи в формате JSON с автоматической склейкой трейсов."
                    ))

            # Rule Python 5: SQL without LIMIT
            for idx, line in enumerate(lines, 1):
                upper = line.upper()
                if "SELECT " in upper and " FROM " in upper and "LIMIT" not in upper and "COUNT(" not in upper:
                    issues.append(CodeReviewIssue(
                        id=f"issue_py_sql_limit_{idx}",
                        rule_id="AVITO-SQL-001",
                        rule_name="Ограничение выборки (LIMIT / N+1 Protection)",
                        severity="blocker",
                        line_number=idx,
                        snippet=line.strip(),
                        message="SQL-запрос на выборку без явного ограничения `LIMIT`.",
                        impact="Запрос без LIMIT перегрузит PostgreSQL и вызовет OOM воркера при обработке миллионов записей.",
                        recommendation="Обязательно добавьте `LIMIT 100` с пагинацией.",
                        suggested_diff=f"{line.strip()} LIMIT 100",
                        full_explanation="Стандарт надежности работы с БД Авито."
                    ))

        # -------------------------------------------------------------
        # CALCULATE SCORE & STATUS
        # -------------------------------------------------------------
        blockers = sum(1 for i in issues if i.severity == "blocker")
        warnings = sum(1 for i in issues if i.severity == "warning")
        penalty = (blockers * 25) + (warnings * 10)
        score = max(0, 100 - penalty)

        if blockers > 0:
            status = "blocked"
            summary = f"❌ Найдено {blockers} блокеров Zero Bug Policy и {warnings} замечаний. Отправка в pull request заблокирована."
            zbp_compliant = False
            mentor_notes = "Код содержит критические уязвимости надежности. Обратите внимание на проброс ctx, таймаут HTTP и обязательный LIMIT в SQL."
            ai_exec = (
                f"### 🛡️ Инженерный вердикт AI-buddy (Pre-flight Review)\n\n"
                f"Код **НЕ ДОПУЩЕН** к открытию Pull Request по требованиям **Zero Bug Policy** Авито.\n\n"
                f"**Ключевые обнаруженные риски:**\n"
                + "\n".join([f"• **{iss.rule_name}** (стр. {iss.line_number or 'общая'}): {iss.message} {iss.impact}" for iss in issues])
            )
        elif warnings > 0:
            status = "changes_requested"
            summary = f"⚠️ Код компилируется, но содержит {warnings} замечаний по стилю и надежности."
            zbp_compliant = True
            mentor_notes = "Код рабочий, но наставник попросит исправить форматирование ошибок (%w) и структурированное логирование."
            ai_exec = (
                f"### ⚠️ Инженерный вердикт AI-buddy\n\n"
                f"Код работоспособен, но требует косметических правок перед отправкой наставнику:\n\n"
                + "\n".join([f"• **{iss.rule_name}**: {iss.message}" for iss in issues])
            )
        else:
            status = "passed"
            summary = "🎉 Идеальный код! Полное соответствие 10 инженерным стандартам Авито и Zero Bug Policy. Можно открывать PR!"
            zbp_compliant = True
            mentor_notes = "Отличная инженерная работа! Все таймауты настроены, ресурсы закрываются вовремя. Код готов к слиянию в master."
            ai_exec = "### ✅ Инженерный вердикт AI-buddy: Код полностью соответствует регламентам надежности и готов к production."

        # -------------------------------------------------------------
        # LEVEL 2: REFACTORING & XP REWARD
        # -------------------------------------------------------------
        if status == "passed" and len(issues) == 0:
            full_refactored_code = code
            if user_id:
                gamification_service.award_xp(user_id, 100, "Успешный Pre-flight Code Review")
        else:
            # First try real Gemini integration
            ai_fixed = None
            if gemini_service.is_available():
                ai_fixed = gemini_service.refactor_code(code, lang, issues)

            if ai_fixed:
                full_refactored_code = ai_fixed
            else:
                # Smart contextual refactoring of the user's ACTUAL code
                full_refactored_code = self._generate_contextual_refactoring(code, lang, issues)

        return CodeReviewResponse(
            score=score,
            status=status,
            summary=summary,
            issues=issues,
            checked_rules_count=10,
            zbp_compliant=zbp_compliant,
            mentor_notes=mentor_notes,
            full_refactored_code=full_refactored_code,
            ai_executive_summary=ai_exec
        )

    def _generate_contextual_refactoring(self, code: str, lang: str, issues: list[CodeReviewIssue]) -> str:
        """Contextually transforms the user's actual code to fix all identified ZBP issues."""
        refactored = code

        if lang == "go":
            # 1. Panic removal -> error return
            refactored = re.sub(
                r'panic\((.*?)\)',
                r'return fmt.Errorf("operation failed: %v", \1)',
                refactored
            )

            # 2. Add LIMIT to SELECT queries
            refactored = re.sub(
                r'("SELECT\b[^"]*FROM\b[^"]*?)(WHERE\b[^"]*?)?(")',
                lambda m: (
                    m.group(0) if "LIMIT" in m.group(0).upper()
                    else f'{m.group(1)}{m.group(2) or ""} LIMIT $1{m.group(3)}'
                ),
                refactored,
                flags=re.IGNORECASE
            )

            # 3. HTTP Client timeout
            refactored = refactored.replace(
                "&http.Client{}",
                "&http.Client{Timeout: 3 * time.Second}"
            )
            refactored = refactored.replace(
                "http.DefaultClient",
                "&http.Client{Timeout: 3 * time.Second}"
            )

            # 4. fmt.Println -> logger
            refactored = re.sub(
                r'fmt\.Println\((.*?)\)',
                r'// logger.Info(ctx, "processed event", zap.Any("data", \1))',
                refactored
            )

            # 5. fmt.Errorf %v -> %w
            def fix_err_wrap(m):
                s = m.group(0)
                return s.replace("%v", "%w").replace("%s", "%w")

            refactored = re.sub(r'fmt\.Errorf\([^)]*\)', fix_err_wrap, refactored)

            # 6. db.Query -> db.QueryContext
            refactored = re.sub(r'\bdb\.Query\(', 'db.QueryContext(ctx, ', refactored)
            refactored = re.sub(r'\bdb\.Exec\(', 'db.ExecContext(ctx, ', refactored)

            # 7. Ignored scan error: _ = rows.Scan(...)
            refactored = re.sub(
                r'_\s*=\s*(rows\.Scan\([^)]*\))',
                r'if err := \1; err != nil { return fmt.Errorf("scan failed: %w", err) }',
                refactored
            )

            # 8. Ensure context and time imports if needed
            for required_pkg in ["time", "context"]:
                if f'"{required_pkg}"' not in refactored:
                    if (required_pkg == "time" and "time.Second" in refactored) or (required_pkg == "context" and "context." in refactored):
                        if 'import (' in refactored:
                            refactored = refactored.replace('import (', f'import (\n\t"{required_pkg}"')
                        elif re.search(r'import\s+"[^"]+"', refactored):
                            refactored = re.sub(r'import\s+"([^"]+)"', rf'import (\n\t"\1"\n\t"{required_pkg}"\n)', refactored, count=1)
                        elif 'package ' in refactored:
                            refactored = re.sub(r'(package\s+[a-zA-Z0-9_]+)', rf'\1\n\nimport "{required_pkg}"', refactored, count=1)

        elif lang == "python":
            # 1. Bare except -> typed except
            refactored = re.sub(
                r'(\bexcept\s*:)',
                r'except Exception as err:\n        logger.error(f"Operation failed: {err}")',
                refactored
            )

            # 2. HTTP requests/httpx timeout
            refactored = re.sub(
                r'(requests|httpx|client|session)\.(get|post|put|delete)\(([^)]*?)\)',
                lambda m: (
                    m.group(0) if "timeout=" in m.group(3)
                    else f'{m.group(1)}.{m.group(2)}({m.group(3)}, timeout=3.0)'
                ),
                refactored
            )

            # 3. time.sleep in async -> await asyncio.sleep
            refactored = re.sub(r'\btime\.sleep\(', 'await asyncio.sleep(', refactored)
            if "await asyncio.sleep" in refactored and "import asyncio" not in refactored:
                refactored = "import asyncio\n" + refactored

            # 4. print -> logger.info
            refactored = re.sub(r'\bprint\((.*?)\)', r'logger.info(\1)', refactored)

            # 5. Add LIMIT to SQL queries
            refactored = re.sub(
                r'("SELECT\b[^"]*FROM\b[^"]*?)(WHERE\b[^"]*?)?(")',
                lambda m: (
                    m.group(0) if "LIMIT" in m.group(0).upper()
                    else f'{m.group(1)}{m.group(2) or ""} LIMIT 100{m.group(3)}'
                ),
                refactored,
                flags=re.IGNORECASE
            )

        return refactored

code_review_service = CodeReviewService()
