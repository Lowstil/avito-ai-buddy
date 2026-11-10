import re
from typing import Any
from app.models.schemas import ChatResponse, UserProfile, UserRole
from app.mcp.tools import mcp_tool_registry

class AgentService:
    """Intelligent Role-Aware Assistant (AI-buddy) for Avito: Intern, Mentor, and Team Lead."""

    def __init__(self):
        # Conversation state per user: e.g. for multi-turn slot filling
        self._states: dict[str, dict[str, Any]] = {}

    def process_message(self, user: UserProfile, message: str) -> ChatResponse:
        user_id = user.user_id
        text = message.strip()
        lower_text = text.lower()
        state = self._states.get(user_id, {})

        # 1. SECURITY & GUARDRAILS (Strict RBAC & Data Protection for all roles)
        restricted_keywords = ["зарплат", "сколько платят", "пароль от прод", "прод-баз", "дамп бд", "секреты прод", "токен админ"]
        if any(kw in lower_text for kw in restricted_keywords):
            return ChatResponse(
                reply=(
                    "🔒 **Ограничение доступа (Политика безопасности Авито)**\n\n"
                    "Запрашиваемая информация относится к коммерческой тайне (КИ) или закрытым персональным данным. "
                    "В соответствии с регламентом безопасности Авито и памяткой по раскрытию информации, доступ к этим сведениям закрыт.\n\n"
                    "Для безопасной разработки используйте изолированные стенды Dev/Stage SPT и Lens."
                ),
                suggested_chips=["Запросить доступы", "Мой прогресс", "Регламент защиты данных"],
                sources=["Политика защиты коммерческой тайны (КИ) Авито"]
            )

        # -------------------------------------------------------------
        # ROLE 1: MENTOR / BUDDY PERSPECTIVE (Алексей Смирнов)
        # -------------------------------------------------------------
        if user.role == UserRole.MENTOR:
            # A. 1:1 Meeting Agenda from Mentor's coaching perspective
            if any(kw in lower_text for kw in ["1:1", "один на один", "план встречи", "адженда", "план для ментора"]):
                return ChatResponse(
                    reply=(
                        "🤝 **Коучинговый план встречи 1:1 для наставника (с Арсением Новиковым):**\n\n"
                        "1. **Калибровка состояния и самочувствия (5 мин):**\n"
                        "   • «Как прошла первая неделя? Какой темп нагрузки, успеваешь ли переваривать стек?»\n\n"
                        "2. **Разбор технических блокеров (15 мин):**\n"
                        "   • Проверь, как Арсений настроил стенд SPT и линтеры в GitLab CI.\n"
                        "   • Уточни, есть ли вопросы по архитектуре сервиса заказов и Kafka-сообщениям.\n\n"
                        "3. **Развивающая обратная связь (15 мин):**\n"
                        "   • 🌟 **Похвалить:** за быстрый сетап доступов и аккуратные вопросы в Slack.\n"
                        "   • 🎯 **Зона роста:** напомнить о важности покрытия тестами (>80%) перед открытием PR.\n\n"
                        "4. **Цели на ближайший спринт (10 мин):**\n"
                        "   • Зафиксировать первую прикладную задачу: реализация worker'а в сервисе доставки."
                    ),
                    suggested_chips=["Чек-лист код-ревью для джуна", "Сводка по Арсению", "Оценка к Экватору (3 мес)"],
                    sources=["Avito Mentorship Playbook: 1:1 Framework", "Engineering Culture"]
                )

            # B. Junior Code Review Checklist for Mentor
            if any(kw in lower_text for kw in ["code review", "код ревью", "код-ревью", "ревью", "как проверять", "ошибки джуна"]):
                return ChatResponse(
                    reply=(
                        "🔍 **Чек-лист наставника при код-ревью работ стажёра (Go / Python в Авито):**\n\n"
                        "1. **Обработка ошибок и надёжность:**\n"
                        "   • Проверь отсутствие скрытых паник (`panic`) и `recover` без надобности.\n"
                        "   • Оборачивание ошибок в Go через `fmt.Errorf(\"...: %w\", err)` для сохранения стека.\n\n"
                        "2. **Контексты и таймауты:**\n"
                        "   • Обязательный проброс `ctx context.Context` во все вызовы БД и сетевые клиенты.\n"
                        "   • Проверка на утечки горутин (селекты с `ctx.Done()`).\n\n"
                        "3. **Работа с хранилищами (PostgreSQL / Redis):**\n"
                        "   • Отсутствие N+1 запросов в цикле; наличие индексов под фильтры.\n"
                        "   • Явные лимиты (`LIMIT / OFFSET`) при выборках.\n\n"
                        "4. **Тесты и ZBP:**\n"
                        "   • Проверка негативных сценариев и таймаутов, а не только happy-path.\n\n"
                        "💡 *Совет ментору:* Оставляй не просто замечания, а объясняй влияние на прод: *«Если не поставить таймаут, при деградации базы поды исчерпают лимит коннектов»*."
                    ),
                    suggested_chips=["План встречи 1:1 для ментора", "Сводка по Арсению", "Стандарты ZBP"],
                    sources=["AvitoTech: Effective Code Review for Mentors"]
                )

            # C. Equator (3 months) Evaluation
            if any(kw in lower_text for kw in ["экватор", "3 месяца", "грейд", "матрица"]):
                return ChatResponse(
                    reply=(
                        "🎯 **Матрица оценки стажёра на Экваторе (3 месяца стажировки):**\n\n"
                        "По регламенту Авито, на экваторе наставник заполняет отчёт по 4 ключевым осям:\n\n"
                        "1. **Hard Skills & Качество кода (35%):**\n"
                        "   • Уверенное владение стеком микросервиса (Go/Python, SQL, Kafka, Docker).\n"
                        "   • Следование стандарту Zero Bug Policy (отсутствие блокеров в релизах).\n\n"
                        "2. **Автономность и скорость (30%):**\n"
                        "   • Способность самостоятельно закрывать задачи из Jira без микроменеджмента.\n"
                        "   • Умение находить ответы в Playbook и технической документации.\n\n"
                        "3. **Командное взаимодействие (20%):**\n"
                        "   • Качество коммуникации на дейли, конструктивность на код-ревью.\n\n"
                        "4. **Продуктовое мышление (15%):**\n"
                        "   • Понимание бизнес-ценности фичи для покупателей и продавцов Авито.\n\n"
                        "👉 Арсений сейчас на 1-й неделе. Текущий промежуточный прогноз: **траектория успешного закрытия экватора**."
                    ),
                    suggested_chips=["Сводка по Арсению", "План встречи 1:1 для ментора", "Чек-лист код-ревью"],
                    sources=["Avito Start Competency Matrix (Backend Track)"]
                )

            # D. Day-offs & Absences for Mentor
            if any(kw in lower_text for kw in ["отгул", "day off", "заявк", "отпуск"]):
                return ChatResponse(
                    reply=(
                        "🏖️ **Управление отгулами подопечного стажёра:**\n\n"
                        "• По регламенту Авито, стажёру доступно **2 оплачиваемых отгула в месяц**.\n"
                        "• Решение о согласовании принимает наставник, ориентируясь на загрузку спринта.\n"
                        "• Во вкладке «Отгулы (Day-off)» вы можете посмотреть заявку с наглядной подсветкой дня в календаре месяца и согласовать её либо отклонить с обязательным указанием причины."
                    ),
                    suggested_chips=["Сводка по Арсению", "План встречи 1:1 для ментора", "Чек-лист код-ревью"],
                    sources=["Регламент отпусков и отсутствий Авито"]
                )

            # E. Intern Progress Audit
            if any(kw in lower_text for kw in ["прогресс", "стажёр", "арсений", "как дела", "сводка", "статус стаж"]):
                guide = mcp_tool_registry.execute("generate_mentor_guide", user_id="intern_1")
                return ChatResponse(
                    reply=(
                        f"👨‍💻 **Сводка по адаптации стажёра Арсения Новикова (Backend Delivery Core):**\n\n"
                        f"• **Общий прогресс чек-листа:** **{guide.get('progress_percentage', 25)}%** "
                        f"({guide.get('completed_count', 4)} из {guide.get('total_count', 16)} задач закрыто).\n"
                        f"• **Текущий этап:** 1-я неделя (Знакомство, Agile, доступы, архитектура).\n\n"
                        f"✅ **Что Арсений успешно освоил:**\n"
                        f"• Корпоративный VPN и двухфакторная аутентификация.\n"
                        f"• GitLab CI/CD, правила веток и конвенция коммитов.\n"
                        f"• Базовая архитектура кластера доставки (Delivery Core).\n\n"
                        f"⏳ **Задачи в активной работе стажёра:**\n"
                        f"• Подключение тестовых стендов SPT и развёртывание сервиса.\n"
                        f"• Изучение логов и метрик через Lens (k8s) и Grafana.\n"
                        f"• Погружение в регламент Zero Bug Policy.\n\n"
                        f"💡 **Рекомендация наставнику:** Арсений показывает высокую скорость. "
                        f"На сегодняшнем созвоне помоги ему с деплоем первой ветки в SPT-окружение."
                    ),
                    suggested_chips=["План встречи 1:1 для ментора", "Чек-лист код-ревью для джуна", "Оценка к Экватору (3 мес)"],
                    sources=["Чек-лист стажёра Авито", "Сервис адаптации Avito Start"]
                )

            # F. Default Welcome for Mentor
            return ChatResponse(
                reply=(
                    f"Привет, {user.name.split()[0]}! Я твой цифровой ассистент по менторингу стажёра **Арсения Новикова** 👨‍💻\n\n"
                    f"Чем я могу помочь наставнику:\n"
                    f"• 📊 **Сводка по стажёру:** статус задач чек-листа, блокеры и доступы\n"
                    f"• 🤝 **План встречи 1:1:** темы, развивающие вопросы и пункты похвалы\n"
                    f"• 🔍 **Чек-лист код-ревью:** ключевые паттерны и антипаттерны джуниор-кода\n"
                    f"• 🎯 **Подготовка к Экватору:** критерии оценки и матрица компетенций\n"
                    f"• 🏖️ **Кадровые согласования:** статус отгулов с подсветкой в календаре\n\n"
                    f"О чём рассказать подробнее?"
                ),
                suggested_chips=["Сводка прогресса стажёра", "План встречи 1:1 для ментора", "Чек-лист код-ревью для джуна", "Оценка к Экватору (3 мес)"],
                sources=["Avito Start Mentorship Portal"]
            )

        # -------------------------------------------------------------
        # ROLE 2: TEAM LEAD PERSPECTIVE (Екатерина Соколова)
        # -------------------------------------------------------------
        if user.role == UserRole.LEAD:
            # A. Team Onboarding Metrics & DORA / Velocity
            if any(kw in lower_text for kw in ["метрик", "time to pr", "аналитик", "динамик", "kpi", "скорост"]):
                analytics = mcp_tool_registry.execute("get_team_lead_analytics")
                return ChatResponse(
                    reply=(
                        f"📈 **Аналитика онбординга и эффективности команды {analytics.get('team_name')}:**\n\n"
                        f"• ⏱️ **Time to First PR:** **{analytics.get('time_to_first_pr_days')} дня** "
                        f"(целевой норматив Авито: < 5 дней — *опережение графика*).\n"
                        f"• 📊 **Checklist Velocity:** **{analytics.get('checklist_progress_pct')}%** за 1-ю неделю адаптации.\n"
                        f"• 🛡️ **Zero Bug Policy Compliance:** **{analytics.get('zero_bug_compliance_pct')}%** (0 регрессионных дефектов в master).\n"
                        f"• 👨‍🏫 **Нагрузка ментора (Алексей Смирнов):** **{analytics.get('mentor_weekly_hours')} ч/неделю** "
                        f"(~12% рабочего времени — *в пределах рекомендуемого коридора 10–15%*).\n\n"
                        f"🏆 **Вывод тимлида:** процесс адаптации в спринте {analytics.get('sprint_name')} протекает стабильно, рисков срыва деливери нет."
                    ),
                    suggested_chips=["Готовность стажёра к офферу", "Нагрузка наставника Алексея", "Задачи в Спринте 24.1"],
                    sources=["Avito Engineering Management Metrics", "DORA Metrics Delivery Core"]
                )

            # B. Offer Readiness Assessment
            if any(kw in lower_text for kw in ["оффер", "штат", "перевод", "готовност", "оценка стажера", "найм"]):
                return ChatResponse(
                    reply=(
                        "🏆 **Оценка готовности стажёра Арсения Новикова к офферу в штат (Junior Backend):**\n\n"
                        "• **Текущий Readiness Score:** **82 / 100** (Уверенная траектория оффера).\n\n"
                        "📊 **Разбивка по компетенциям:**\n"
                        "1. **Hard Skills & Архитектура:** **80%** — успешно освоил стенды SPT, основы PaaS и работу с PostgreSQL/Kafka.\n"
                        "2. **Качество кода и ZBP:** **85%** — чисто проходит линтеры `golangci-lint`, покрывает код тестами.\n"
                        "3. **Командная культура и Agile:** **85%** — активен на дейли, вовремя сигнализирует о блокерах.\n"
                        "4. **Автономность в задачах:** **78%** — пока требуется поддержка ментора при работе с k8s/Lens.\n\n"
                        "💡 **Рекомендация тимлиду:** На 2-м месяце закрепить за Арсением самостоятельный эпик (разработка worker'а нотификаций) для финальной валидации грейда Junior."
                    ),
                    suggested_chips=["Метрики онбординга команды", "Нагрузка наставника Алексея", "Задачи в Спринте 24.1"],
                    sources=["Avito Engineering Career Framework (Junior Backend)"]
                )

            # C. Mentor Capacity Audit
            if any(kw in lower_text for kw in ["нагрузка", "алексей", "ментор", "наставник", "capacity"]):
                return ChatResponse(
                    reply=(
                        "⏱️ **Аудит нагрузки наставника Алексея Смирнова (Senior Backend):**\n\n"
                        "• **Основная разработка (Delivery Core):** 35.5 ч/неделю (88% времени).\n"
                        "• **Менторинг и код-ревью Арсения:** 4.5 ч/неделю (12% времени).\n"
                        "• **Динамика:** на 1-й неделе нагрузка максимальная (сетап доступов и стендов), со 2-й недели прогнозируется снижение до 3 ч/нед.\n\n"
                        "✅ **Статус:** Зелёная зона. Риска выгорания наставника или срыва задач кластера нет."
                    ),
                    suggested_chips=["Метрики онбординга команды", "Готовность стажёра к офферу", "Задачи в Спринте 24.1"],
                    sources=["Team Capacity & Engineering Allocation Dashboard"]
                )

            # D. Sprint Task Allocation
            if any(kw in lower_text for kw in ["спринт", "задач", "delivery core", "распределен"]):
                return ChatResponse(
                    reply=(
                        "🚀 **Рекомендации по распределению задач в Спринте 24.1 (Delivery Core):**\n\n"
                        "1. **Для стажёра Арсения (Low-to-Medium Risk):**\n"
                        "   • Разработка worker'а отправки статусов доставки покупателям.\n"
                        "   • Написание интеграционных тестов с моками внешних служб доставки.\n\n"
                        "2. **Для сеньоров и Алексея (High Risk / Core Architecture):**\n"
                        "   • Шардирование базы заказов PostgreSQL и оптимизация PgBouncer.\n"
                        "   • Переработка пайплайна канареечных выкаток в PaaS.\n\n"
                        "💡 **Совет по деливери:** держите ветки стажёра изолированными, чтобы задержки ревью не блокировали релизный поезд команды."
                    ),
                    suggested_chips=["Метрики онбординга команды", "Готовность стажёра к офферу", "Нагрузка Алексея"],
                    sources=["Sprint 24.1 Delivery Backlog Planning"]
                )

            # E. Default Welcome for Team Lead
            return ChatResponse(
                reply=(
                    f"Здравствуйте, {user.name.split()[0]}! Я аналитический ассистент по онбордингу и эффективности инженерной команды **Order Management & Delivery Core** 👩‍💼\n\n"
                    f"Чем я могу помочь тимлиду:\n"
                    f"• 📈 **Метрики онбординга:** отслеживание Time to First PR и темпа чек-листа\n"
                    f"• 🏆 **Готовность к офферу:** оценка стажёра по шкале грейда Junior Backend\n"
                    f"• ⏱️ **Аудит нагрузки ментора:** контроль баланса времени Алексея Смирнова\n"
                    f"• 🚀 **Планирование спринта:** рекомендации по безопасному распределению задач\n"
                    f"• 🛡️ **Контроль ZBP:** мониторинг надежности сервисов доставки\n\n"
                    f"Какой управленческий срез подготовить?"
                ),
                suggested_chips=["Метрики онбординга команды", "Готовность стажёра к офферу", "Нагрузка наставника Алексея", "Задачи в Спринте 24.1"],
                sources=["Avito Engineering Management Hub"]
            )

        # -------------------------------------------------------------
        # ROLE 3: INTERN PERSPECTIVE (Арсений Новиков)
        # -------------------------------------------------------------

        # Check for Engineering / Code Review / Technical questions FIRST
        # If user asks an engineering question, cancel any lingering absence state!
        is_tech_question = any(kw in lower_text for kw in [
            "правило", "контекст", "context", "timeout", "таймаут", "panic", "паник",
            "zbp", "zero bug policy", "limit", "лимит", "n+1", "%w", "wrap", "оборачиван",
            "лог", "zap", "slog", "транзакц", "rollback", "горутин", "code review", "код-ревью"
        ])

        if is_tech_question:
            self._states[user_id] = {}  # Clear any active absence flow

            # 1. Rule: Context Timeout
            if any(kw in lower_text for kw in ["контекст", "context", "timeout", "таймаут", "проброс контекста"]):
                return ChatResponse(
                    reply=(
                        "🛡️ **Инженерный стандарт Авито: Проброс контекста (Context Timeout)**\n\n"
                        "В микросервисной архитектуре Авито (миллионы RPS) этот стандарт является **критическим блокером** на код-ревью:\n\n"
                        "### 💥 Почему это критично на масштабах Авито:\n"
                        "• Любой сетевой I/O (SQL-запрос, gRPC-вызов, HTTP-клиент, чтение из Redis/Kafka) без контекста использует бесконечный дедлайн.\n"
                        "• При деградации внешней базы данных все горутины зависают в ожидании ответа. Пул в 500–1000 горутин мгновенно исчерпывает RAM пода, вызывая **OOMKilled** и каскадную аварию всего кластера доставки.\n\n"
                        "### 🛠️ Как правильно писать по стандартам Авито:\n"
                        "```go\n"
                        "// 1. Создаём дочерний контекст с явным таймаутом операции\n"
                        "ctx, cancel := context.WithTimeout(ctx, 3*time.Second)\n"
                        "defer cancel() // защита от утечки ресурсов контекста\n\n"
                        "// 2. Всегда вызываем Context-aware методы базы данных\n"
                        "rows, err := db.QueryContext(ctx, query, args...)\n"
                        "if err != nil {\n"
                        "    return fmt.Errorf(\"query delivery orders failed: %w\", err)\n"
                        "}\n"
                        "```\n\n"
                        "💡 *Совет ментора Алексея:* В HTTP-хэндлерах всегда бери `r.Context()`, никогда не создавай `context.Background()` внутри бизнес-логики!"
                    ),
                    suggested_chips=["Запрет паник (ZBP)", "Оборачивание ошибок %w", "Лимиты в SQL"],
                    sources=["AvitoTech: Effective Go & Distributed Systems", "Zero Bug Policy Manual"]
                )

            # 2. Rule: Panic Prohibition (Zero Bug Policy)
            if any(kw in lower_text for kw in ["panic", "паник", "запрет паник"]):
                return ChatResponse(
                    reply=(
                        "🚫 **Инженерный стандарт Авито: Запрет `panic()` (Zero Bug Policy)**\n\n"
                        "По регламенту надежности Авито использование `panic()` в прикладном runtime-коде — **строжайшее нарушение (P0 блокер)**.\n\n"
                        "### 💥 Почему паники запрещены:\n"
                        "• Необработанная паника завершает процесс операционной системы. Падает весь инстанс пода в Kubernetes, обрывая сотни параллельных клиентских сессий покупателей и курьеров.\n\n"
                        "### 🛠️ Как правильно обрабатывать ошибки:\n"
                        "```go\n"
                        "// ❌ ПЛОХО: обрушивает под\n"
                        "if err != nil {\n"
                        "    panic(err)\n"
                        "}\n\n"
                        "// ✅ ХОРОШО: возврат типизированной ошибки наверх по стеку\n"
                        "if err != nil {\n"
                        "    return nil, fmt.Errorf(\"calculate order price failed: %w\", err)\n"
                        "}\n"
                        "```\n"
                        "💡 Паника допускается исключительно в `init()` на старте сервиса, если не удалось распарсить обязательный конфиг или подгрузить TLS-сертификат."
                    ),
                    suggested_chips=["Проброс контекста", "Оборачивание ошибок %w", "Стандарты Code Review"],
                    sources=["Zero Bug Policy: Reliability Standards", "Avito Backend Core Guidelines"]
                )

            # 3. Rule: Error wrapping %w
            if any(kw in lower_text for kw in ["%w", "оборачиван", "fmt.errorf", "errors.is", "wrap"]):
                return ChatResponse(
                    reply=(
                        "🔗 **Инженерный стандарт Авито: Оборачивание ошибок через `%w`**\n\n"
                        "В Go 1.13+ директива `%w` в `fmt.Errorf` сохраняет цепочку вложенных ошибок для дерева трассировки.\n\n"
                        "### 💥 Что происходит при `%v` или `%s`:\n"
                        "• Ошибка преобразуется в простую строку. Вышестоящий слой не может сделать `errors.Is(err, sql.ErrNoRows)` или `errors.As(err, &customErr)`.\n"
                        "• Sentry не может сгруппировать инциденты по первопричине, загрязняя дашборды дежурных инженеров.\n\n"
                        "### 🛠️ Как правильно:\n"
                        "```go\n"
                        "// ✅ Сохраняем стек и интерфейс Unwrap()\n"
                        "return fmt.Errorf(\"fetch courier status: %w\", err)\n"
                        "```"
                    ),
                    suggested_chips=["Запрет паник", "Проброс контекста", "Структурированное логирование"],
                    sources=["Effective Go: Error Handling", "Avito Sentry Integration Best Practices"]
                )

            # 4. Rule: SQL LIMIT & N+1 Protection
            if any(kw in lower_text for kw in ["limit", "лимит", "n+1", "выборк", "sql"]):
                return ChatResponse(
                    reply=(
                        "⚡ **Инженерный стандарт Авито: Ограничение выборки (LIMIT & N+1)**\n\n"
                        "Таблицы Авито содержат десятки миллионов объявлений и заказов. Запрос без `LIMIT` — прямой путь к падению базы данных.\n\n"
                        "### 💥 Последствия неограниченного SELECT:\n"
                        "• Запрос без `LIMIT` пытается передать по сети терабайты данных, вызывая блокировку буферного пула PostgreSQL и мгновенный OOM пода.\n"
                        "• Паттерн N+1 (запрос в цикле для каждого элемента) умножает нагрузку на базу в тысячи раз.\n\n"
                        "### 🛠️ Как правильно:\n"
                        "```sql\n"
                        "-- ✅ Всегда задавайте явный LIMIT и используйте Keyset пагинацию\n"
                        "SELECT id, user_id, status FROM delivery_orders \n"
                        "WHERE status = 'pending' AND id > $1 \n"
                        "ORDER BY id ASC LIMIT $2;\n"
                        "```"
                    ),
                    suggested_chips=["Проброс контекста", "Безопасность транзакций", "Тестовые стенды SPT"],
                    sources=["Avito Database Guidelines (PostgreSQL at High Scale)"]
                )

        # Multi-turn Slot Filling: Day-off booking
        if state.get("step") == "awaiting_absence_details":
            has_date_or_reason = bool(re.search(r"(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[а-яА-Я]+|\d{1,2}\.\d{1,2})", text)) or any(kw in lower_text for kw in ["врач", "сессия", "экзамен", "дела", "заболел", "отгул", "выходной", "личное", "универ"])
            
            if not has_date_or_reason:
                self._states[user_id] = {}  # User changed topic, cancel flow!
            else:
                date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[а-яА-Я]+|\d{1,2}\.\d{1,2})", text)
                date_val = date_match.group(1) if date_match else "2026-11-20"
                reason_val = text if len(text) > 5 else "По личным обстоятельствам"
                
                result = mcp_tool_registry.execute(
                    "request_absence",
                    user_id=user.user_id,
                    user_name=user.name,
                    start_date="2026-11-20",
                    reason=reason_val,
                    absence_type="day_off"
                )
                self._states[user_id] = {}  # Clear state
                req = result.get("request", {})
                return ChatResponse(
                    reply=(
                        f"🎉 **Заявка на отгул успешно сформирована и зарегистрирована!**\n\n"
                        f"• **Номер заявки:** #{req.get('id', 'ABS-2026-NEW')}\n"
                        f"• **Сотрудник:** {user.name} ({user.track} стажёр)\n"
                        f"• **Дата:** {req.get('start_date', '2026-11-20')}\n"
                        f"• **Причина:** {req.get('reason', reason_val)}\n"
                        f"• **Статус:** ⏳ *На согласовании у наставника ({user.mentor_name or 'Алексея Смирнова'})*\n\n"
                        f"Заявка уже появилась в разделе «Отгулы (Day-off)» с подсветкой дня в календаре."
                    ),
                    action_type="absence_created",
                    action_payload=req,
                    suggested_chips=["Проверить статус отгулов", "Что сделать на этой неделе?", "Стандарты Code Review"],
                    sources=["Корпоративный сервис 'Отсутствия' Авито"]
                )

        # B. Check Absence Status (Must precede new absence trigger)
        if any(kw in lower_text for kw in ["статус отгул", "мои заявки", "одобрили", "что с отгул"]) or ("статус" in lower_text and ("отгул" in lower_text or "заяв" in lower_text)):
            result = mcp_tool_registry.execute("query_absence_status", user_id=user.user_id)
            reqs = result.get("requests", [])
            if not reqs:
                reply_txt = "У тебя пока нет активных заявок на отсутствие."
            else:
                lines = [f"• #{r['id']} на {r['start_date']}: **{r['status'].upper()}** ({r['reason']})" for r in reqs]
                reply_txt = "📋 **Твои заявки на отсутствие в корпоративном сервисе:**\n\n" + "\n".join(lines)
            return ChatResponse(
                reply=reply_txt,
                action_type="absence_status_checked",
                action_payload={"requests": reqs},
                suggested_chips=["Оформить новый отгул", "Мой чек-лист", "Нужны доступы"]
            )

        # C. Absence Trigger (Start new absence request)
        if any(kw in lower_text for kw in ["отгул", "day off", "дей-офф", "дейофф", "взять выходной", "отлучиться"]):
            self._states[user_id] = {"step": "awaiting_absence_details"}
            return ChatResponse(
                reply=(
                    f"Привет, {user.name.split()[0]}! Без проблем, я помогу оформить отгул (day-off).\n\n"
                    f"📋 **Условия для стажёра:**\n"
                    f"• Доступный баланс: **2 дня** в текущем месяце.\n"
                    f"• Заявка согласуется с твоим наставником ({user.mentor_name or 'Алексеем Смирновым'}).\n\n"
                    f"На какую дату планируешь отсутствие и какую причину указать (например: *20 ноября, визит к врачу* или *учебные дела*)?"
                ),
                action_type="absence_flow_started",
                suggested_chips=["20 ноября, визит к врачу", "25 ноября, сессия в университете", "Отмена"],
                sources=["Регламент отпусков и отсутствий Авито"]
            )

        # D. Access Request Trigger
        if any(kw in lower_text for kw in ["доступ", "lens", "spt", "стенд", "vpn", "sentry"]):
            if "lens" in lower_text:
                sys_key = "lens_k8s"
                sys_name = "Lens (Kubernetes Dev/Stage)"
            elif "spt" in lower_text:
                sys_key = "spt_cluster"
                sys_name = "SPT тестовые стенды"
            elif "sentry" in lower_text:
                sys_key = "sentry_errors"
                sys_name = "Sentry Error Tracking"
            elif "grafana" in lower_text:
                sys_key = "grafana_metrics"
                sys_name = "Grafana Dashboards"
            else:
                sys_key = "spt_cluster"
                sys_name = "SPT тестовые стенды"

            result = mcp_tool_registry.execute("request_access", user_id=user.user_id, system_key=sys_key)
            return ChatResponse(
                reply=(
                    f"🔑 **Запрос на доступ к {sys_name} зарегистрирован в ServiceDesk!**\n\n"
                    f"• **Система:** {sys_name}\n"
                    f"• **Статус:** ⏳ *Ожидает подтверждения наставником ({user.mentor_name or 'Алексеем'})*\n\n"
                    f"По регламенту Авито, выдача прав стажёрам подтверждается наставником в разделе «Доступы и стенды»."
                ),
                action_type="access_requested",
                action_payload=result.get("access_item"),
                suggested_chips=["Посмотреть все доступы", "Открыть чек-лист", "Что такое ZBP?"],
                sources=["Авито IAM & ServiceDesk"]
            )

        # E. Checklist Status & Next Step
        if any(kw in lower_text for kw in ["чек-лист", "чеклист", "следующий шаг", "что делать", "задач", "план"]):
            summary = mcp_tool_registry.execute("get_checklist_status", user_id=user.user_id).get("summary", {})
            next_t = summary.get("next_recommended_task")
            next_title = next_t.get("title") if next_t else "Все текущие задачи закрыты!"
            next_desc = next_t.get("description") if next_t else ""
            
            return ChatResponse(
                reply=(
                    f"📊 **Твой прогресс адаптации: {summary.get('progress_percentage', 0)}%**\n\n"
                    f"• Выполнено задач: **{summary.get('completed_tasks', 0)} из {summary.get('total_tasks', 0)}**\n"
                    f"• Текущий этап: **{summary.get('current_period', '1 неделя')}**\n\n"
                    f"🎯 **Рекомендуемый следующий шаг:**\n"
                    f"👉 **{next_title}**\n"
                    f"{next_desc}\n\n"
                    f"Нажми на задачу в чек-листе, чтобы открыть подробное описание и добавить свои личные заметки."
                ),
                action_type="checklist_queried",
                action_payload=summary,
                suggested_chips=["Отметить выполненной", "Подготовка к 1:1", "Стандарты Code Review"],
                sources=["Чек-лист стажёра Авито (Backend трек)"]
            )

        # F. 1:1 Prep for Intern
        if any(kw in lower_text for kw in ["1:1", "один на один", "встреча с наставником", "экватор", "подготов"]):
            res = mcp_tool_registry.execute("generate_1on1_summary", user_id=user.user_id)
            agenda = "\n".join(res.get("summary_points", []))
            return ChatResponse(
                reply=(
                    f"🤝 **Персональный план для встречи 1:1 с твоим наставником ({user.mentor_name or 'Алексеем'}):**\n\n"
                    f"{agenda}\n\n"
                    f"💬 *Рекомендация стажёру:* 1:1 — это твоё личное время с наставником. Открыто говори о блокерах и задавай вопросы!"
                ),
                action_type="1on1_agenda_generated",
                suggested_chips=["Как устроен Code Review?", "Как оформить отгул?", "Что такое Zero Bug Policy?"],
                sources=["AvitoTech Playbook: 1:1 Engineering Culture", "Чек-лист стажёра Авито"]
            )

        # G. Code Review standards
        if any(kw in lower_text for kw in ["code review", "код ревью", "код-ревью", "ревью кода", "мерж реквест", "pull request", "pr"]):
            return ChatResponse(
                reply=(
                    "🔍 **Как устроен Code Review в инженерных командах Авито:**\n\n"
                    "1. **Правило двух аппрувов (Two Approvals):**\n"
                    "   • Для мержа PR в master требуется минимум 2 аппрува: один от наставника, второй от коллеги по кластеру.\n\n"
                    "2. **Критерии готовности PR (Definition of Done):**\n"
                    "   • **Тесты:** обязательное покрытие юнит-тестами (> 80%).\n"
                    "   • **Линтеры:** чистый прогон `golangci-lint` в CI без варнингов.\n"
                    "   • **Описание:** ссылка на задачу в Jira, пример curl-запроса, архитектурное обоснование.\n\n"
                    "3. **Регламент SLA на ревью:**\n"
                    "   • В Авито принято смотреть PR коллег в течение **4 рабочих часов**.\n\n"
                    "💡 *Совет стажёру:* Первый PR сделай небольшим (до 150-200 строк), чтобы наставник быстрее дал первую обратную связь!"
                ),
                suggested_chips=["Подготовка к 1:1", "Что такое ZBP?", "Как оформить отгул?"],
                sources=["AvitoTech Playbook: Engineering Guidelines", "Effective Go Standards"]
            )

        # H. PaaS, Deployment, Canary & Feature Flags
        if any(kw in lower_text for kw in ["paas", "деплой", "deploy", "канарейк", "canary", "feature flag", "фича-флаг"]):
            return ChatResponse(
                reply=(
                    "🚀 **Деплой и PaaS в Авито: как безопасно доставлять код:**\n\n"
                    "• **PaaS Авито:** внутренняя облачная платформа на базе Kubernetes, которая автоматически собирает контейнеры, настраивает ingress, проксирует метрики в Prometheus и логи в ELK.\n"
                    "• **Канареечные релизы (Canary):** новая версия пода сначала получает 5% реального трафика. Система мониторит 5xx ошибки и задержку. Если всё чисто — трафик плавно повышается до 100%.\n"
                    "• **Feature Flags:** runtime-флаги переключаются на лету через веб-интерфейс без перезапуска подов.\n"
                    "• **Откат (Rollback):** при всплеске ошибок PaaS автоматически откатывает трафик на стабильную версию за секунды."
                ),
                suggested_chips=["Стандарты Code Review", "Тестовые стенды SPT", "Мой чек-лист"],
                sources=["Avito PaaS Documentation", "Avito Architecture Standards"]
            )

        # I. Playbook RAG
        rag_res = mcp_tool_registry.execute("search_playbook", query=text).get("results", [])
        if rag_res:
            top_article = rag_res[0]
            return ChatResponse(
                reply=(
                    f"📖 **{top_article['title']}**\n\n"
                    f"{top_article['content']}\n\n"
                    f"*(Раздел: {top_article['category']})*"
                ),
                suggested_chips=["Запросить доступы", "Мой чек-лист", "План 1:1"],
                sources=[f"AvitoTech Playbook: {top_article['title']}"]
            )

        # J. Default Intern Welcome
        return ChatResponse(
            reply=(
                f"Привет, {user.name.split()[0]}! Я твой цифровой наставник **AI-buddy в Авито** 🚀\n\n"
                f"Я здесь, чтобы помогать тебе на каждом шаге стажировки:\n"
                f"• 📅 **Оформить отгул или дей-офф** в интерактивном календаре\n"
                f"• 🔑 **Получить доступы** к стендам SPT, Lens/k8s, GitLab и Grafana\n"
                f"• 📋 **Вести онбординг-чек-лист** и добавлять личные заметки\n"
                f"• 📖 **Отвечать на вопросы** по стандартам (Effective Go, Zero Bug Policy, PaaS, code review)\n"
                f"• 🤝 **Готовиться к 1:1 с наставником Алексеем**\n\n"
                f"Чем помочь прямо сейчас?"
            ),
            suggested_chips=["Как оформить отгул?", "Какой мой следующий шаг?", "Что такое Zero Bug Policy?", "Стандарты Code Review"],
            sources=["Avito Start Onboarding Hub"]
        )

agent_service = AgentService()
