import re
from typing import Any, Optional
from app.models.schemas import ChatResponse, UserProfile, UserRole
from app.services.playbook_rag import playbook_rag

class FallbackService:
    """Robust, Context-Aware Fallback Engine for Avito AI-Buddy.
    Activates when Google Gemini 2.5 Flash is unavailable, unkeyed, or throws an error.
    Maintains dialogue history continuity, role-specific perspective (Intern, Mentor, Team Lead),
    and synthesizes deep domain knowledge grounded in AvitoTech Playbook.
    """

    def generate_fallback(
        self,
        user: UserProfile,
        message: str,
        context_info: str = "",
        history: Optional[list[dict[str, Any]]] = None
    ) -> ChatResponse:
        user_role = user.role
        user_name = user.name
        first_name = user_name.split()[0] if user_name else "Коллега"
        text = message.strip()
        lower = text.lower()

        # 1. Dialogue History Analysis & Multi-Turn Continuity
        history_context_prefix, continuity_topic = self._analyze_history_continuity(history, lower)

        # 2. Enrich search query if continuity topic was extracted
        search_query = f"{text} {continuity_topic}".strip() if continuity_topic else text
        rag_results = playbook_rag.search(search_query, top_k=2)

        # Build context info if not passed
        if not context_info and rag_results:
            context_info = "\n\n".join([f"Статья: {a['title']}\n{a['content']}" for a in rag_results])

        # 3. Domain Knowledge Synthesis
        # Check domain modules based on keywords in query + continuity topic
        combined_text = f"{lower} {continuity_topic.lower()}".strip()

        # Domain A: Concurrency, Goroutine Leaks, Channels, Mutexes
        if any(kw in combined_text for kw in ["горутин", "goroutine", "канал", "channel", "мьютекс", "mutex", "утечк", "deadlock", "race condition", "гонк"]):
            reply, chips, sources = self._handle_concurrency(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain B: Algorithms, Data Structures & Coding Queries
        if any(kw in combined_text for kw in ["алгоритм", "бинарн", "двоичн", "binary search", "lru", "кэш", "cache", "хеш", "дерев", "сложност", "o(n)", "big-o", "сортировк"]):
            reply, chips, sources = self._handle_algorithms(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain C: Architecture, Microservices & Highload (Kafka, gRPC, Outbox, Sharding)
        if any(kw in combined_text for kw in ["архитектур", "микросервис", "kafka", "кафк", "grpc", "outbox", "шардирован", "highload", "паттерн", "партици", "consumer group"]):
            reply, chips, sources = self._handle_architecture(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain D: Databases & PostgreSQL Highload
        if any(kw in combined_text for kw in ["postgres", "sql", "баз", "бд", "индекс", "pgbouncer", "explain", "n+1", "транзакц"]):
            reply, chips, sources = self._handle_database(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain E: SRE, Incident Management & Debugging ("Упал прод", pprof, OOM)
        if any(kw in combined_text for kw in ["инцидент", "упал", "авари", "500", "5xx", "pprof", "oom", "oomkilled", "дебаг", "отладк", "сбой", "rollback", "откат"]):
            reply, chips, sources = self._handle_sre_debugging(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain F: Engineering Standards & Code Review (ZBP, Context Timeout, %w, Panics)
        if any(kw in combined_text for kw in ["zero bug policy", "zbp", "линтер", "тест", "покрыти", "контекст", "timeout", "таймаут", "паник", "panic", "%w", "ошибк"]):
            reply, chips, sources = self._handle_engineering_standards(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain G: Career, Equator & Transition to Staff
        if any(kw in combined_text for kw in ["экватор", "оффер", "штат", "карьер", "грейд", "junior", "рост", "собеседован"]):
            reply, chips, sources = self._handle_career_growth(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain H: Mentoring & 1:1 Methodology
        if any(kw in combined_text for kw in ["наставник", "ментор", "коучинг", "обратн", "связ", "фидбек", "grow", "sbi"]):
            reply, chips, sources = self._handle_mentoring_framework(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain I: Engineering Leadership & DORA Metrics
        if any(kw in combined_text for kw in ["dora", "time to pr", "метрик", "руковод", "менеджмент", "деливери", "капасити", "нагрузк"]):
            reply, chips, sources = self._handle_management_metrics(user_role, first_name, text, combined_text)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain J: Playbook RAG synthesis if articles found
        if rag_results:
            reply, chips, sources = self._handle_rag_synthesis(user_role, first_name, text, rag_results)
            return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

        # Domain K: Universal Intelligent Role Fallback (Arbitrary Questions)
        reply, chips, sources = self._handle_open_question(user_role, first_name, text, continuity_topic)
        return self._build_response(reply, history_context_prefix, chips, sources, rag_results)

    # -------------------------------------------------------------------------
    # Helper: History Continuity Extraction
    # -------------------------------------------------------------------------
    def _analyze_history_continuity(
        self,
        history: Optional[list[dict[str, Any]]],
        current_lower: str
    ) -> tuple[str, str]:
        """Examines conversation history to extract topic continuity and follow-up context."""
        if not history:
            return "", ""

        followup_cues = [
            "подробнее", "детальнее", "пример", "код", "а как", "почему", "а если",
            "еще", "дальше", "поясни", "расскажи про", "что дальше", "первый пункт",
            "второй пункт", "третий пункт", "а во второй", "а в первой"
        ]
        is_followup = any(cue in current_lower for cue in followup_cues) or len(current_lower.split()) <= 4

        last_user_text = ""
        last_assistant_text = ""
        for item in reversed(history):
            sender = item.get("sender") or item.get("role", "")
            content = item.get("content") or item.get("text", "")
            if not last_user_text and sender in ["user"]:
                last_user_text = content
            elif not last_assistant_text and sender in ["assistant", "model", "bot"]:
                last_assistant_text = content
            if last_user_text and last_assistant_text:
                break

        continuity_topic = ""
        # Look for domain keywords in prior user text
        topic_keywords = [
            "kafka", "кафк", "postgres", "горутин", "утечк", "lru", "кэш", "бинарн",
            "zbp", "zero bug policy", "инцидент", "контекст", "таймаут", "dora", "экватор",
            "оффер", "микросервис", "архитектур", "1:1", "код-ревью"
        ]
        for kw in topic_keywords:
            if kw in last_user_text.lower() or kw in last_assistant_text.lower():
                continuity_topic = kw
                break

        if is_followup and continuity_topic:
            prefix = f"💬 *Продолжая обсуждение темы ({continuity_topic}):*\n\n"
        elif is_followup and last_user_text:
            prefix = f"💬 *В развитие предыдущего вопроса («{last_user_text[:50]}...»):*\n\n"
        else:
            prefix = ""

        return prefix, continuity_topic

    def _build_response(
        self,
        body: str,
        prefix: str,
        chips: list[str],
        sources: list[str],
        rag_results: list[dict[str, Any]]
    ) -> ChatResponse:
        full_reply = f"{prefix}{body}" if prefix else body
        rag_sources = [f"AvitoTech Playbook: {r['title']}" for r in rag_results[:1]]
        all_sources = list(dict.fromkeys(sources + rag_sources))
        return ChatResponse(
            reply=full_reply,
            suggested_chips=chips,
            sources=all_sources
        )

    # -------------------------------------------------------------------------
    # Domain Handlers Tailored by Role
    # -------------------------------------------------------------------------
    def _handle_concurrency(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: Конкурентность в Go и предотвращение утечек горутин**\n\n"
                f"Тема конкурентности — одна из главных точек роста для стажёров в Highload-системах Авито.\n\n"
                f"### На что обратить внимание подопечного:\n"
                f"1. **Правило владения горутиной:** Тот, кто запускает горутину (`go func()`), обязан знать, когда и как она завершится. "
                f"Запрещайте стажёрам фоновые горутины без проброса `ctx context.Context` и проверки `<-ctx.Done()`.\n"
                f"2. **Блокировки каналов:** Небуферизованный канал без читателя навечно блокирует пишущую горутину. Проверяйте такие места на код-ревью.\n"
                f"3. **sync.Mutex vs sync.RWMutex:** Объясните стажёру, когда RWMutex оправдан (редкая запись, частое чтение) и почему критическую секцию надо минимизировать.\n\n"
                f"💡 *Совет ментору для 1:1:* Попросите Арсения показать вывод команды `go tool pprof` с дампом горутин на SPT-стенде и объяснить каждую активную горутину."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook: Engineering Standards", "Effective Go Concurrency"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📊 **Анализ надёжности: Конкурентность и риски стабильности кластера (Team Lead Hub)**\n\n"
                f"Некорректная работа с горутинами — причина №1 скрытой деградации памяти и OOMKilled в микросервисах доставки.\n\n"
                f"### Управленческий фокус и метрики:\n"
                f"• **Мониторинг метрики:** На дашбордах Grafana настроен алерт `go_goroutines > 1500`. Рост метрики сигнализирует об утечке.\n"
                f"• **CI/CD Quality Gates:** Все PR стажёров и разработчиков проходят обязательный запуск тестов с флагом `-race` (`go test -race ./...`). "
                f"При обнаружении data race пайплайн блокируется.\n"
                f"• **ZBP-контроль:** Зависание горутин классифицируется как дефект надёжности P1 и устраняется вне очереди.\n\n"
                f"💡 *Вывод тимлида:* Системная культура ревью конкурентного кода снижает Change Failure Rate команды до целевых < 1%."
            )
            chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Контроль ZBP"]
            sources = ["Avito Engineering Management Hub", "Reliability & Quality Standards"]
        else:
            reply = (
                f"⚙️ **Инженерный стандарт Авито: Конкурентность в Go и защита от утечек**\n\n"
                f"В Авито сервисы обрабатывают десятки тысяч RPS, поэтому утечка даже 1 горутины на запрос приводит к падению пода по OOM.\n\n"
                f"### Золотые правила конкурентности:\n"
                f"1. **Всегда слушайте отмену контекста:**\n"
                f"```go\n"
                f"select {{\n"
                f"case <-ctx.Done():\n"
                f"    return ctx.Err()\n"
                f"case ch <- data:\n"
                f"}}\n"
                f"```\n"
                f"2. **Ограничивайте параллелизм (Worker Pool):** Никогда не запускайте `go process(item)` в бесконечном цикле по списку. "
                f"Используйте пул фиксированного размера (например, 10-20 воркеров).\n"
                f"3. **Race Detector:** Всегда локально проверяйте код тестами `go test -race ./...`.\n\n"
                f"💡 *Совет стажёру:* Если горутина читает из канала, канал должен закрываться писателем, а не читателем!"
            )
            chips = ["Проброс контекста", "Запрет паник (ZBP)", "Стандарты Code Review"]
            sources = ["AvitoTech Playbook: Effective Go", "Go Concurrency Guidelines"]
        return reply, chips, sources

    def _handle_algorithms(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: Алгоритмическая культура и оптимизация в Highload**\n\n"
                f"В продакшене Авито важна не академическая сложность сама по себе, а влияние алгоритма на latency и ресурсы под нагрузкой.\n\n"
                f"### Как развивать алгоритмическое мышление стажёра:\n"
                f"1. **Оценка Big-O на реальных данных:** Учите Арсения оценивать сложность в худшем случае (Worst Case) при миллионах объявлений.\n"
                f"2. **Кэширование и LRU:** Разберите устройство связки Hash Map + Doubly Linked List для LRU кэша за O(1), "
                f"а также защиту от Cache Stampede и правильный выбор TTL.\n"
                f"3. **Предварительное выделение памяти:** Покажите на бенчмарках, почему `make([]T, 0, cap)` и `make(map[K]V, size)` "
                f"экономят аллокации и разгружают GC.\n\n"
                f"💡 *Совет ментору:* На код-ревью обращайте внимание на скрытые квадратичные циклы O(N^2) при сопоставлении списков."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook", "Highload Architecture & Algorithms"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📊 **Анализ эффективности: Алгоритмические стандарты и производительность (Team Lead Hub)**\n\n"
                f"Эффективность алгоритмов в Delivery Core напрямую влияет на SLA времени ответа API (p99 latency < 50ms) и утилизацию серверных мощностей PaaS.\n\n"
                f"### Ключевые показатели:\n"
                f"• **Latency Budgets:** Критические ручки создания и трекинга заказов обязаны укладываться в заданный latency budget.\n"
                f"• **Оптимизация аллокаций:** Сокращение бесполезных аллокаций снижает нагрузку на CPU от Go Garbage Collector (GC pause time).\n"
                f"• **Оценка готовности к грейду Junior:** Умение стажёра обосновать выбор структуры данных — один из критериев на защите Экватора.\n\n"
                f"💡 *Вывод тимлида:* Внедрение бенчмарков в CI страхует команду от деградации производительности при масштабировании фичей."
            )
            chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Задачи в Спринте 24.1"]
            sources = ["Avito Engineering Management Hub", "Highload Performance Metrics"]
        else:
            reply = (
                f"🧠 **Алгоритмы и структуры данных в Highload-бэкенде Авито**\n\n"
                f"При миллионах пользователей каждый лишний цикл O(N^2) или лишняя аллокация памяти замедляет ответ сервиса.\n\n"
                f"### Ключевые паттерны и структуры:\n"
                f"1. **Бинарный поиск (Binary Search) — O(log N):**\n"
                f"```go\n"
                f"// Использование стандартного пакета slices в Go 1.21+\n"
                f"idx, found := slices.BinarySearch(sortedIDs, targetID)\n"
                f"```\n"
                f"2. **LRU Cache — O(1) чтение и запись:**\n"
                f"• Хеш-таблица (`map`) обеспечивает мгновенный доступ к узлу за O(1).\n"
                f"• Двусвязный список хранит порядок использования и вытесняет самый старый элемент из хвоста.\n"
                f"3. **Pre-allocation памяти:**\n"
                f"```go\n"
                f"// ✅ Всегда задавайте capacity, если размер известен:\n"
                f"items := make([]Order, 0, len(rawOrders))\n"
                f"```\n\n"
                f"💡 *Совет стажёру:* Избегайте линейного поиска `for _, x := range slice` внутри другого цикла — индексируйте данные в `map`!"
            )
            chips = ["Стандарты Code Review", "Проброс контекста", "Мой чек-лист"]
            sources = ["AvitoTech Playbook: Algorithms & Highload", "Effective Go Guidelines"]
        return reply, chips, sources

    def _handle_architecture(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: Архитектура микросервисов, Kafka и надёжность**\n\n"
                f"Архитектурное погружение стажёра в кластер Delivery Core требует понимания распределённых транзакций и устойчивости к сбоям.\n\n"
                f"### Ключевые темы для проработки со стажёром:\n"
                f"1. **Transactional Outbox:** Объясните Арсению, почему нельзя делать `db.Save(order)` и следом `kafka.Send(event)` (если Kafka недоступна, данные разойдутся). "
                f"Покажите, как outbox-воркер читает события из базы и гарантирует At-Least-Once отправку.\n"
                f"2. **Идемпотентность обработчиков:** Сеть ненадежна, сообщения в Kafka могут дублироваться. Воркер обязан проверять уникальность `event_id`.\n"
                f"3. **Деление на партиции:** Напомните, что ключ партиционирования должен быть сбалансированным (например, `order_id` или `user_id`), чтобы не создавать hotspot-партиций.\n\n"
                f"💡 *Совет ментору:* На 1:1 разберите архитектурную схему взаимодействия сервисов оформления и доставки заказов."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook: Distributed Architecture", "Delivery Core Architecture"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📈 **Архитектурный срез: Сервисы Delivery Core и отказоустойчивость (Team Lead Hub)**\n\n"
                f"В спринте 24.1 архитектура сервисов доставки спроектирована под пиковые нагрузки с изоляцией критических путей.\n\n"
                f"### Архитектурные принципы и статус:\n"
                f"• **Асинхронность:** Все сайд-эффекты (нотификации, аналитика, обновление статусов трекинга) вынесены в Kafka-топики с DLQ.\n"
                f"• **Circuit Breaker:** Интеграции с внешними курьерскими службами закрыты Circuit Breaker с быстрым фолбэком.\n"
                f"• **Изоляция стажёрских задач:** Новые фичи стажёра Арсения изолированы в отдельном worker-сервисе, "
                f"что гарантирует отсутствие рисков для основного пайплайна заказов.\n\n"
                f"💡 *Вывод тимлида:* Текущая архитектура выдерживает плановый запас 3x по RPS без деградации времени ответа."
            )
            chips = ["Метрики онбординга команды", "Задачи в Спринте 24.1", "Готовность стажёра к офферу"]
            sources = ["Avito Engineering Management Hub", "Architecture & Resiliency Framework"]
        else:
            reply = (
                f"🏗️ **Архитектура микросервисов и событийной модели в Авито (Delivery Core)**\n\n"
                f"Сервисы доставки обрабатывают миллионы событий через связку PostgreSQL, gRPC и Apache Kafka.\n\n"
                f"### Основные архитектурные паттерны:\n"
                f"1. **gRPC для синхронных вызовов:** Строгие контракты Protobuf, низкие накладные расходы и поддержка мультиплексирования HTTP/2.\n"
                f"2. **Transactional Outbox:** Гарантия консистентности — событие пишется в таблицу `outbox_events` в той же транзакции БД, что и заказ, "
                f"а фоновый процесс надёжно передаёт его в Kafka.\n"
                f"3. **Идемпотентность:** Каждый консьюмер сохраняет обработанный `event_id` в таблице с `UNIQUE` ограничением, "
                f"предотвращая повторное выполнение действий при ребалансировке партиций.\n"
                f"4. **Dead Letter Queue (DLQ):** «Бракованные» сообщения после 3 ретраев отправляются в изолированный топик `.dead-letter` для ручного разбора.\n\n"
                f"💡 *Совет стажёру:* Никогда не сохраняйте состояние внутри памяти пода — поды в Kubernetes эфемерны и могут перезапуститься в любой момент!"
            )
            chips = ["Стандарты Code Review", "Тестовые стенды SPT", "Мой чек-лист"]
            sources = ["AvitoTech Playbook: Microservices & Kafka", "Delivery Core Architecture"]
        return reply, chips, sources

    def _handle_database(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: Базы данных, PostgreSQL и Highload-культура**\n\n"
                f"Ошибки в работе с БД — главный источник инцидентов в продакшене. Обучение джуна безопасным запросам критично для ZBP.\n\n"
                f"### Что проверить у стажёра на код-ревью:\n"
                f"1. **Запрет N+1:** Убедитесь, что Арсений не делает запросы к БД в цикле `for _, id := range ids`. Требуйте батчинг через `WHERE id = ANY($1)`.\n"
                f"2. **Обязательные LIMIT:** Каждый `SELECT` должен содержать явный лимит и пагинацию по ключу (Keyset pagination).\n"
                f"3. **Длина транзакций:** Никаких долгих сетевых вызовов внутри `db.BeginTx()`. Строго `defer tx.Rollback()`.\n"
                f"4. **Планы запросов:** Научите стажёра запускать `EXPLAIN (ANALYZE, BUFFERS)` на тестовом стенде SPT.\n\n"
                f"💡 *Совет ментору:* Разберите со стажёром реальный инцидент с блокировками в PostgreSQL, чтобы показать цену долгой транзакции."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook: Database Best Practices", "PostgreSQL Highload Standards"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📊 **Аудит базы данных и ресурсов: Order Management Cluster (Team Lead Hub)**\n\n"
                f"Контроль нагрузки на PostgreSQL и PgBouncer — ключевой фактор обеспечения непрерывности бизнес-процессов заказов.\n\n"
                f"### Управленческие показатели:\n"
                f"• **Пул коннектов PgBouncer:** Утилизация пула стабильна (< 65% пиковой ёмкости).\n"
                f"• **Pre-flight анализ:** Все PR блокируются при отсутствии LIMIT или обнаружении паттерна N+1.\n"
                f"• **Индексы и репликация:** Нагрузка на чтение распределяется между аналитическими репликами, мастер принимает только транзакционные записи.\n\n"
                f"💡 *Вывод тимлида:* Рисков деградации хранилища в текущем спринте нет."
            )
            chips = ["Метрики онбординга команды", "Задачи в Спринте 24.1", "Готовность стажёра к офферу"]
            sources = ["Avito Engineering Management Hub", "Database Observability"]
        else:
            reply = (
                f"🐘 **Инженерный стандарт Авито: PostgreSQL в Highload-системах**\n\n"
                f"Таблицы Авито хранят сотни миллионов записей. Неоптимальный запрос может парализовать работу сервиса.\n\n"
                f"### Правила безопасной работы с БД:\n"
                f"1. **Защита от N+1:** Выбирайте данные пачками через массив идентификаторов: `WHERE id = ANY($1)`.\n"
                f"2. **Обязательный LIMIT:** Запросы без `LIMIT` запрещены анализатором Pre-flight Review.\n"
                f"3. **Индексы:** Проверяйте, что фильтры `WHERE` используют B-tree индексы, а порядок колонок в составном индексе соответствует правилу селективности.\n"
                f"4. **Безопасные транзакции:**\n"
                f"```go\n"
                f"tx, err := db.BeginTx(ctx, nil)\n"
                f"if err != nil {{\n"
                f"    return fmt.Errorf(\"begin tx: %w\", err)\n"
                f"}}\n"
                f"defer tx.Rollback() // Безопасный откат при любой ошибке\n\n"
                f"// ... бизнес-логика ...\n"
                f"return tx.Commit()\n"
                f"```\n\n"
                f"💡 *Совет стажёру:* Никогда не делайте сетевые HTTP-запросы внутри транзакции базы данных!"
            )
            chips = ["Лимиты в SQL", "Проброс контекста", "Стандарты Code Review"]
            sources = ["AvitoTech Playbook: PostgreSQL Highload", "Zero Bug Policy Manual"]
        return reply, chips, sources

    def _handle_sre_debugging(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: Обучение стажёра действиям при авариях и дебагу (SRE & Blameless)**\n\n"
                f"Первый инцидент на проде — сильный стресс для джуна. Наставник помогает сформировать хладнокровие и системный подход.\n\n"
                f"### Алгоритм наставника при инциденте:\n"
                f"1. **Принцип Blameless Post-Mortem:** В Авито никогда не ищут виноватых. Ошибка системы — повод улучшить мониторинг, тесты и пайплайны.\n"
                f"2. **Сначала стабилизация (Mitigation):** Научите стажёра, что при аварии после релиза первое действие — быстрый откат (Rollback) в PaaS, "
                f"а не попытка писать хотфикс на лету.\n"
                f"3. **Инструменты диагностики:** Покажите, как смотреть логи подов в Lens, трейсы в Jaeger по `x-trace-id` и профили CPU/Heap в `pprof`.\n\n"
                f"💡 *Совет ментору:* Проведите со стажёром тренировочный «GameDay» на SPT-стенде с имитацией аварии."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook: Incident Response", "Blameless Engineering Culture"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"🚨 **Управление инцидентами и MTTR кластера (Team Lead Incident Hub)**\n\n"
                f"Регламент реагирования на сбои в Order Management & Delivery Core:\n\n"
                f"### Процесс управления инцидентом:\n"
                f"• **Детекция и SLA реакции:** P0/P1 инциденты вызывают дежурного инженера по PagerDuty/Slack в течение 5 минут.\n"
                f"• **One-Click Rollback:** Время отката канареечного релиза в PaaS — менее 60 секунд (DORA MTTR < 15 мин).\n"
                f"• **Коммуникация со стейкхолдерами:** Тимлид берёт на себя координацию Incident Channel, освобождая инженеров для локализации сбоя.\n"
                f"• **Post-Mortem & ZBP:** В течение 3 рабочих дней формируются экшн-айтемы в бэклог по закрытию системных уязвимостей.\n\n"
                f"💡 *Вывод тимлида:* Процессы автоматического отката и канареечных выкаток обеспечивают доступность сервисов 99.98%."
            )
            chips = ["Метрики онбординга команды", "Контроль ZBP", "Задачи в Спринте 24.1"]
            sources = ["Avito Engineering Management Hub", "Incident Management Framework"]
        else:
            reply = (
                f"🚨 **Инженерный регламент действий при сбоях и отладке (SRE Action Plan)**\n\n"
                f"Главное правило инженера Авито при аварии — спокойствие, системность и следование регламенту:\n\n"
                f"### Пошаговый алгоритм:\n"
                f"1. **Оценка масштаба в Grafana:** Проверьте график RPS, долю 5xx ошибок и 99-й перцентиль задержки.\n"
                f"2. **Быстрый откат (Rollback):** Если сбой начался сразу после выкатки — немедленно откатите релиз в PaaS на предыдущую сборку!\n"
                f"3. **Анализ в Sentry и Lens:** Посмотрите стектрейс ошибки в Sentry и статус подов в Lens (нет ли OOMKilled или CrashLoopBackOff).\n"
                f"4. **Профилирование через pprof:**\n"
                f"```bash\n"
                f"# Сбор профиля кучи памяти:\n"
                f"go tool pprof http://localhost:6060/debug/pprof/heap\n"
                f"```\n"
                f"5. **Оповещение:** Сообщите наставнику ({name if role == 'mentor' else 'Алексею Смирнову'}) в рабочий канал.\n\n"
                f"💡 *Совет стажёру:* В Авито действует культура Blameless Post-Mortem — мы ищем причину в процессах и коде, а не наказываем людей!"
            )
            chips = ["Тестовые стенды SPT", "Запрет паник (ZBP)", "Мой чек-лист"]
            sources = ["AvitoTech Playbook: Incident Response", "SRE Best Practices"]
        return reply, chips, sources

    def _handle_engineering_standards(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинг наставника: 10 золотых правил инженерии Авито и Zero Bug Policy**\n\n"
                f"Обучение стажёра стандартам надежности — основа успешного прохождения испытательного срока.\n\n"
                f"### Ключевые точки контроля ZBP для наставника:\n"
                f"1. **Категорический запрет `panic()`:** Проверяйте, чтобы в runtime-коде не было скрытых паник. Ошибки должны оборачиваться через `%w`.\n"
                f"2. **Обязательный таймаут:** Все операции с БД, Redis и HTTP обязаны использовать контекст с явным таймаутом (2-3 сек).\n"
                f"3. **Покрытие тестами (> 80%):** Требуйте покрытия не только happy-path, но и сценариев сбоя сети и деградации базы.\n"
                f"4. **Линтеры в CI:** Ни один PR не мержится при наличии варнингов от `golangci-lint`.\n\n"
                f"💡 *Совет ментору:* На 1:1 разберите с Арсением замечания Pre-flight анализатора, объясняя физический смысл каждого правила."
            )
            chips = ["Чек-лист код-ревью для джуна", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook: Engineering Guidelines", "Zero Bug Policy Manual"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"🛡️ **Контроль стандартов ZBP и качества кода (Team Lead Hub)**\n\n"
                f"Zero Bug Policy (ZBP) — базовый гигиенический стандарт команд кластера Order Management & Delivery Core.\n\n"
                f"### Статус соблюдения стандартов в спринте:\n"
                f"• **ZBP Compliance команды:** 100% (0 критических багов в проде, все релизы прошли автоматический аудит).\n"
                f"• **Test Coverage Gate:** Минимальный порог покрытия для новых микросервисов — 80%.\n"
                f"• **SLA устранения дефектов:** Блокеры — реакция до 30 мин, фикс в течение 24 часов.\n\n"
                f"💡 *Вывод тимлида:* Стажёр Арсений Новиков уверенно освоил регламент ZBP и закрывает задачи без регрессионных дефектов."
            )
            chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Задачи в Спринте 24.1"]
            sources = ["Avito Engineering Management Hub", "Zero Bug Policy Manual"]
        else:
            reply = (
                f"🛡️ **Инженерные стандарты Авито и регламент Zero Bug Policy (ZBP)**\n\n"
                f"В Авито действуют 10 золотых правил инженерии, обеспечивающие стабильность сервисов под нагрузкой:\n\n"
                f"1. **Проброс контекста с таймаутом:** Обязательный `ctx context.Context` во всех I/O операциях для защиты от OOM и зависания горутин.\n"
                f"2. **Запрет `panic()`:** В прикладном коде паники строго запрещены — они обрушивают pod в Kubernetes.\n"
                f"3. **Оборачивание ошибок через `%w`:** Сохраняет дерево стека для `errors.Is` и группировки в Sentry.\n"
                f"4. **Ограничение выборок (LIMIT):** Защита от N+1 и исчерпания буферного пула PostgreSQL.\n"
                f"5. **Покрытие тестами > 80%:** Обязательная проверка негативных сценариев и таймаутов.\n\n"
                f"💡 *Совет стажёру:* Используйте линтеры `golangci-lint` локально перед открытием PR, чтобы ревью проходило быстрее!"
            )
            chips = ["Проброс контекста", "Запрет паник (ZBP)", "Оборачивание ошибок %w"]
            sources = ["Zero Bug Policy: Reliability Standards", "Avito Backend Core Guidelines"]
        return reply, chips, sources

    def _handle_career_growth(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🎯 **Коучинг наставника: Подготовка стажёра к Экватору (3 мес) и офферу в штат**\n\n"
                f"Экватор стажировки — ключевая контрольная точка. Наставник помогает стажёру упаковать результаты и подготовить презентацию.\n\n"
                f"### Матрица оценки подопечного:\n"
                f"1. **Hard Skills & Качество кода (35%):** Уверенная работа с Go, SQL, Kafka, следование Zero Bug Policy.\n"
                f"2. **Автономность (30%):** Способность брать тикет из Jira, декомпозировать и доводить до релиза без микроменеджмента.\n"
                f"3. **Командная культура (20%):** Активность на дейли, конструктивность на код-ревью и ретроспективах.\n"
                f"4. **Продуктовое мышление (15%):** Понимание бизнес-ценности задач для пользователей доставки.\n\n"
                f"💡 *Совет ментору:* Проведите репетицию презентации к экватору за неделю до защиты перед руководителем кластера."
            )
            chips = ["Матрица оценки на Экваторе", "План встречи 1:1 для ментора", "Сводка по Арсению"]
            sources = ["Avito Start Competency Matrix", "Mentorship Career Guide"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"🏆 **Оценка готовности стажёра к офферу в штат (Junior Backend) — Team Lead Hub**\n\n"
                f"Критерии перевода стажёра в постоянный штат команды Delivery Core:\n\n"
                f"• **Текущий Readiness Score:** 82 / 100 (Уверенная траектория оффера).\n"
                f"• **Динамика онбординга:** Чек-лист закрывается с опережением графика, Time to First PR — 2.4 дня.\n"
                f"• **Рекомендация тимлиду:** На 2-м месяце стажировки доверить Арсению самостоятельный эпик "
                f"(разработка worker'а нотификаций) для подтверждения грейда Junior Backend.\n\n"
                f"💡 *Вывод тимлида:* Рисков срыва адаптации нет, ставка под оффер зарезервирована в штатном расписании."
            )
            chips = ["Метрики онбординга команды", "Нагрузка наставника Алексея", "Задачи в Спринте 24.1"]
            sources = ["Avito Engineering Career Framework", "Team Lead Evaluation Portal"]
        else:
            reply = (
                f"🚀 **Траектория перехода из стажёра в штат (Junior Backend) и получение оффера**\n\n"
                f"В программе Avito Start твоя цель — успешно защитить результаты на Экваторе (3 мес) и получить оффер в штат!\n\n"
                f"### Что нужно для оффера:\n"
                f"1. **Автономность:** Уверенно закрывать прикладные задачи бэклога из Jira без постоянной опеки наставника.\n"
                f"2. **Инженерная надёжность:** Следовать Zero Bug Policy, писать тесты (> 80%), аккуратно деплоить код через PaaS.\n"
                f"3. **Презентация на Экваторе:** Подготовить 5-7 слайдов о решённых задачах, архитектурных вызовах и влиянии на сервис доставки.\n"
                f"4. **Обратная связь:** Получить положительные отзывы наставника Алексея Смирнова и коллег по кластеру.\n\n"
                f"💡 *Совет стажёру:* Фиксируй все решённые задачи и выкаченные фичи в заметках онбординг-чек-листа — это основа твоей презентации!"
            )
            chips = ["Мой чек-лист", "Подготовка к 1:1", "Стандарты Code Review"]
            sources = ["Avito Start Career Path", "Avito Engineering Competency Matrix"]
        return reply, chips, sources

    def _handle_mentoring_framework(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        reply = (
            f"🤝 **Методология наставничества и развивающего коучинга в Авито (GROW & SBI)**\n\n"
            f"Наставничество в Авито строится на партнерстве, психологической безопасности и регулярной развивающей обратной связи.\n\n"
            f"### Фреймворк развивающего диалога:\n"
            f"1. **Модель GROW на встречах 1:1:**\n"
            f"   • **Goal:** Какую цель ставим на встречу или спринт?\n"
            f"   • **Reality:** Где мы сейчас? Какие блокеры с доступами или кодом?\n"
            f"   • **Options:** Какие пути решения видит стажёр?\n"
            f"   • **Way Forward:** Фиксация конкретных шагов и дедлайнов.\n\n"
            f"2. **Конструктивная обратная связь по модели SBI:**\n"
            f"   • **Situation (Ситуация):** «Вчера на код-ревью PR #142...»\n"
            f"   • **Behavior (Поведение):** «...ты не указал таймаут в `context.WithTimeout`...»\n"
            f"   • **Impact (Влияние):** «...это могло подвесить пулы соединений PgBouncer на проде.»\n\n"
            f"💡 *Совет:* Оценивайте код и факты, а не личные качества. Поддерживайте инициативу подопечного!"
        )
        chips = ["План встречи 1:1 для ментора", "Чек-лист код-ревью для джуна", "Сводка по Арсению"]
        sources = ["Avito Mentorship Playbook: Coaching Framework", "Engineering Culture"]
        return reply, chips, sources

    def _handle_management_metrics(self, role: str, name: str, text: str, lower: str) -> tuple[str, list[str], list[str]]:
        reply = (
            f"📊 **Инженерный менеджмент и DORA-метрики в Авито (Team Lead Hub)**\n\n"
            f"Команды Авито управляют эффективностью разработки на основе объективных инженерных метрик:\n\n"
            f"### 4 ключевые DORA-метрики кластера Delivery Core:\n"
            f"1. **Deployment Frequency (Частота релизов):** Несколько релизов в день благодаря канареечным выкаткам в PaaS.\n"
            f"2. **Lead Time for Changes (Время доставки изменений):** От первого коммита до продакшена — менее 4 рабочих часов.\n"
            f"3. **Time to Restore Service (MTTR):** Время ликвидации аварии — менее 15 минут за счет автоматического Rollback.\n"
            f"4. **Change Failure Rate (Доля неудачных изменений):** Менее 1% благодаря автотестам и Zero Bug Policy.\n\n"
            f"### Метрика Time to First PR:\n"
            f"• Целевой норматив онбординга стажёров — до 5 рабочих дней (Арсений показал 2.4 дня).\n\n"
            f"💡 *Вывод тимлида:* Системная поддержка онбординга сокращает время выхода новичков на автономность в 2 раза."
        )
        chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Нагрузка наставника Алексея"]
        sources = ["Avito Engineering Management Hub", "DORA Metrics Delivery Core"]
        return reply, chips, sources

    def _handle_rag_synthesis(
        self,
        role: str,
        name: str,
        text: str,
        rag_results: list[dict[str, Any]]
    ) -> tuple[str, list[str], list[str]]:
        top_art = rag_results[0]
        title = top_art["title"]
        category = top_art.get("category", "База знаний")
        content = top_art["content"]

        if role == UserRole.MENTOR:
            reply = (
                f"📖 **{title} (Контекст для наставника)**\n\n"
                f"{content}\n\n"
                f"### Методический комментарий для наставника:\n"
                f"По запросу *«{text}»* рекомендую проверить, насколько уверенно Арсений применяет эти стандарты на практике. "
                f"На ближайшей встрече 1:1 задайте контрольный вопрос по материалу этой статьи."
            )
            chips = ["План встречи 1:1 для ментора", "Чек-лист код-ревью для джуна", "Сводка по Арсению"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📖 **{title} (Управленческий контекст тимлида)**\n\n"
                f"{content}\n\n"
                f"### Аналитический комментарий:\n"
                f"Этот регламент является обязательным стандартом команды. В спринте 24.1 отклонений от стандарта не зафиксировано, "
                f"процессы протекают в штатном режиме."
            )
            chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Задачи в Спринте 24.1"]
        else:
            reply = (
                f"📖 **{title}**\n\n"
                f"{content}\n\n"
                f"*(Раздел Playbook: {category})*\n\n"
                f"💡 *Совет стажёру:* Этот стандарт обязателен для всех сервисов Авито. Если есть вопросы по реализации — обсуди их с наставником Алексеем Смирновым."
            )
            chips = ["Мой чек-лист", "Стандарты Code Review", "Подготовка к 1:1"]

        sources = [f"AvitoTech Playbook: {title}"]
        return reply, chips, sources

    def _handle_open_question(
        self,
        role: str,
        name: str,
        text: str,
        continuity_topic: str
    ) -> tuple[str, list[str], list[str]]:
        if role == UserRole.MENTOR:
            reply = (
                f"🤝 **Коучинговый ассистент наставника (Алексей Смирнов)**\n\n"
                f"По вашему вопросу: *«{text}»*\n\n"
                f"### Рекомендации по менторингу стажёра Арсения:\n"
                f"1. **Развивающий диалог:** Помогите подопечному самостоятельно прийти к ответу через наводящие вопросы и анализ системных требований.\n"
                f"2. **Практика на стендах SPT:** Закрепите этот аспект на реальном изолированном стенде кластера доставки.\n"
                f"3. **Связь с регламентом ZBP:** Напомните о влиянии данного решения на надежность сервисов под нагрузкой.\n\n"
                f"💡 Арсений демонстрирует отличный темп адаптации. Балансируйте между направляющими советами и самостоятельностью."
            )
            chips = ["План встречи 1:1 для ментора", "Чек-лист код-ревью для джуна", "Сводка по Арсению"]
            sources = ["Avito Mentorship Playbook", "Engineering Culture"]
        elif role in [UserRole.LEAD, UserRole.HR_BP]:
            reply = (
                f"📊 **Аналитический ассистент тимлида (Екатерина Соколова / Order Management Core)**\n\n"
                f"Касательно вопроса: *«{text}»*\n\n"
                f"### Управленческий срез по команде:\n"
                f"1. **Надёжность процессов:** Все изменения в рамках Delivery Core соответствуют стандарту Zero Bug Policy.\n"
                f"2. **Капасити и темп:** Нагрузка наставника Алексея Смирнова находится в балансе (~12%), рисков срыва спринта нет.\n"
                f"3. **Онбординг:** Стажёр Арсений закрывает чек-лист с опережением норматива (Time to First PR — 2.4 дня).\n\n"
                f"💡 *Рекомендация:* Сохранять текущий ритм спринта 24.1 и запланировать первый самостоятельный эпик стажёра."
            )
            chips = ["Метрики онбординга команды", "Готовность стажёра к офферу", "Нагрузка наставника Алексея"]
            sources = ["Avito Engineering Management Hub", "DORA Delivery Metrics"]
        else:
            reply = (
                f"💡 **AI-buddy: Инженерный напарник стажёра в Авито**\n\n"
                f"Отвечаю на твой вопрос:\n"
                f"> *«{text}»*\n\n"
                f"В инженерной культуре Авито решения по подобным задачам строятся на следующих принципах:\n"
                f"1. **Надёжность и отказоустойчивость:** Архитектура должна быть устойчива к сбоям сети, деградации зависимостей и росту RPS.\n"
                f"2. **Прозрачность и наблюдаемость:** Любая операция покрывается метриками Prometheus в Grafana и логированием с `x-trace-id`.\n"
                f"3. **Тестирование и валидация:** Новые фичи обязательно проверяются на тестовых стендах SPT перед созданием PR.\n\n"
                f"💡 *Совет стажёру:* Если хочешь разобрать конкретный пример кода или архитектурную схему — напиши, и мы детально всё разберём!"
            )
            chips = ["Мой чек-лист", "Стандарты Code Review", "Подготовка к 1:1"]
            sources = ["Avito Start Onboarding Hub", "AvitoTech Engineering Guidelines"]

        return reply, chips, sources

fallback_service = FallbackService()
