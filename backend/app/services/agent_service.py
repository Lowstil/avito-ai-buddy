import re
from typing import Any
from app.models.schemas import ChatResponse, UserProfile
from app.mcp.tools import mcp_tool_registry

class AgentService:
    """Intelligent Assistant (AI-buddy) for Avito Interns with MCP Orchestration and Guardrails."""

    def __init__(self):
        # Conversation state per user: e.g. for multi-turn slot filling
        self._states: dict[str, dict[str, Any]] = {}

    def process_message(self, user: UserProfile, message: str) -> ChatResponse:
        user_id = user.user_id
        text = message.strip()
        lower_text = text.lower()
        state = self._states.get(user_id, {})

        # 1. SECURITY & GUARDRAILS (Prompt Injection & RBAC checks)
        restricted_keywords = ["зарплат", "сколько платят", "пароль от прод", "прод-баз", "дамп бд", "секреты прод", "токен админ"]
        if any(kw in lower_text for kw in restricted_keywords):
            return ChatResponse(
                reply=(
                    "🔒 **Ограничение доступа (Политика безопасности Авито)**\n\n"
                    "Запрашиваемая информация относится к коммерческой тайне (КИ) или закрытым персональным данным. "
                    "В соответствии с регламентом безопасности Авито и памяткой по раскрытию информации, доступ к этим сведениям закрыт для вашей роли.\n\n"
                    "Если вам необходимы рабочие доступы к стендам разработки (Dev/Stage SPT, Lens), воспользуйтесь разделом «Запрос доступов»."
                ),
                suggested_chips=["Запросить доступы", "Мой прогресс", "Регламент защиты данных"],
                sources=["Политика защиты КИ Авито"]
            )

        # 2. MULTI-TURN SLOT FILLING: Absence Request
        # If user is in the middle of absence creation
        if state.get("step") == "awaiting_absence_details":
            # Extract date and reason
            # Simple slot parser: e.g. "на пятницу", "15 ноября", "визит к врачу"
            date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[а-яА-Я]+|\d{1,2}\.\d{1,2})", text)
            date_val = date_match.group(1) if date_match else "2026-11-20"
            reason_val = text if len(text) > 5 else "По личным обстоятельствам"
            
            # Execute MCP Tool
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
                    f"• **Статус:** ⏳ *На согласовании у наставника ({user.mentor_name or 'Алексей Смирнов'})*\n\n"
                    f"Уведомление отправлено в корпоративный сервис. Твой наставник уже получил запрос на подтверждение."
                ),
                action_type="absence_created",
                action_payload=req,
                suggested_chips=["Проверить статус отгулов", "Что сделать на этой неделе?", "Стандарты Code Review"],
                sources=["Корпоративный сервис 'Отсутствия' Авито"]
            )

        # 3. INTENT: Absence Request trigger
        if any(kw in lower_text for kw in ["отгул", "day off", "дей-офф", "дейофф", "взять выходной", "отлучиться"]):
            self._states[user_id] = {"step": "awaiting_absence_details"}
            return ChatResponse(
                reply=(
                    f"Привет, {user.name.split()[0]}! Без проблем, я помогу оформить отгул (day-off).\n\n"
                    f"📋 **Условия для стажёра:**\n"
                    f"• Доступный баланс: **2 дня** в текущем месяце.\n"
                    f"• Заявка согласовывается с твоим наставником ({user.mentor_name or 'Алексеем Смирновым'}).\n\n"
                    f"На какую дату планируешь отсутствие и какую причину указать (например: *20 ноября, визит к врачу* или *учебные дела*)?"
                ),
                action_type="absence_flow_started",
                suggested_chips=["20 ноября, визит к врачу", "25 ноября, сессия в университете", "Отмена"],
                sources=["Регламент отпусков и отсутствий Авито"]
            )

        # 4. INTENT: Check Absence Status
        if any(kw in lower_text for kw in ["статус отгул", "мои заявки", "одобрили", "что с отгул"]):
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

        # 5. INTENT: Access Request
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
                    f"🔑 **Заявка на доступ к {sys_name} создана в ServiceDesk Авито!**\n\n"
                    f"• **Система:** {sys_name}\n"
                    f"• **Роль:** `intern_developer`\n"
                    f"• **Статус:** 🚀 *Запрос отправлен на авто-выдачу*\n\n"
                    f"Обычно доступ подключается в течение 10–15 минут. Я пришлю уведомление, когда права станут активны."
                ),
                action_type="access_requested",
                action_payload=result.get("access_item"),
                suggested_chips=["Посмотреть все доступы", "Открыть чек-лист", "Что такое ZBP?"],
                sources=["Авито IAM & ServiceDesk"]
            )

        # 6. INTENT: Checklist Query & Next Step
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
                    f"Ты можешь отметить эту задачу выполненной прямо в интерактивном чек-листе слева."
                ),
                action_type="checklist_queried",
                action_payload=summary,
                suggested_chips=["Отметить выполненной", "Подготовка к 1:1", "Стандарты Go"],
                sources=["Чек-лист стажёра Авито (Backend трек)"]
            )

        # 6. INTENT: 1:1 Meeting Preparation (Deep task-by-task synthesis)
        if any(kw in lower_text for kw in ["1:1", "один на один", "встреча с наставником", "экватор", "подготов"]):
            res = mcp_tool_registry.execute("generate_1on1_summary", user_id=user.user_id)
            agenda = "\n".join(res.get("summary_points", []))
            return ChatResponse(
                reply=(
                    f"🤝 **Персональный план для встречи 1:1 с твоим наставником ({user.mentor_name or 'Алексеем'}):**\n\n"
                    f"{agenda}\n\n"
                    f"💬 *Рекомендация по встрече:* 1:1 — это твоё личное время с ментором. Открыто говори о блокерах и о том, где не хватает вводных. Наставник здесь, чтобы помочь расти, а не экзаменовать!"
                ),
                action_type="1on1_agenda_generated",
                suggested_chips=["Как устроен Code Review?", "Как оформить отгул?", "Что такое Zero Bug Policy?"],
                sources=["AvitoTech Playbook: 1:1 Engineering Culture", "Чек-лист стажёра Авито"]
            )

        # 7. INTENT: Code Review in Avito (Deep engineering standard)
        if any(kw in lower_text for kw in ["code review", "код ревью", "код-ревью", "ревью кода", "мерж реквест", "pull request", "pr"]):
            return ChatResponse(
                reply=(
                    "🔍 **Как устроен Code Review в инженерных командах Авито:**\n\n"
                    "1. **Правило двух аппрувов (Two Approvals):**\n"
                    "   • Для мержа PR в master требуется минимум 2 аппрува: один от твоего наставника (или Senior-инженера команды), второй от коллеги по кластеру.\n\n"
                    "2. **Критерии готовности PR (Definition of Done):**\n"
                    "   • **Тесты:** обязательное покрытие прикладной бизнес-логики юнит-тестами (> 80%).\n"
                    "   • **Линтеры:** чистый прогон `golangci-lint` в CI без варнингов.\n"
                    "   • **Описание:** ссылка на задачу в Jira, скриншот или curl-примеры проверки ручки, обоснование архитектурного выбора.\n\n"
                    "3. **Регламент SLA на ревью:**\n"
                    "   • В Авито принято смотреть PR коллег в течение **4 рабочих часов** (в крайнем случае до конца рабочего дня).\n\n"
                    "4. **Культура общения на ревью:**\n"
                    "   • Комментарии пишутся доброжелательно. Если с чем-то не согласен — созвонитесь на 5 минут в Zoom/Slack, чтобы не устраивать долгие треды в GitLab.\n\n"
                    "💡 *Совет стажёру:* Первый PR сделай небольшим (до 150-200 строк), чтобы наставник быстрее дал первую обратную связь!"
                ),
                suggested_chips=["Подготовка к 1:1", "Что такое ZBP?", "Как оформить отгул?"],
                sources=["AvitoTech Playbook: Engineering Guidelines", "Effective Go Standards"]
            )

        # 8. INTENT: PaaS, Deployment, Canary & Feature Flags
        if any(kw in lower_text for kw in ["paas", "деплой", "deploy", "канарейк", "canary", "feature flag", "фича-флаг", "фича флаг"]):
            return ChatResponse(
                reply=(
                    "🚀 **Деплой и PaaS в Авито: как безопасно доставлять код:**\n\n"
                    "• **PaaS Авито:** внутренняя облачная платформа на базе Kubernetes, которая автоматически собирает контейнеры, настраивает ingress, проксирует метрики в Prometheus и логи в ELK.\n"
                    "• **Канареечные релизы (Canary):** новая версия пода сначала получает 5% реального трафика. Система мониторит 5xx ошибки и задержку. Если всё чисто — трафик плавно повышается до 100%.\n"
                    "• **Feature Flags:**\n"
                    "  - *Runtime флаги:* переключаются на лету через веб-интерфейс без перезапуска подов.\n"
                    "  - *Compile-time флаги:* для мажорных изменений архитектуры.\n"
                    "• **Откат (Rollback):** если канарейка детектирует всплеск ошибок, PaaS автоматически откатывает трафик на стабильную версию за секунды."
                ),
                suggested_chips=["Стандарты Code Review", "Тестовые стенды SPT", "Мой чек-лист"],
                sources=["Avito PaaS Documentation", "Avito Architecture Standards"]
            )

        # 9. INTENT: Playbook FAQ Search (RAG)
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

        # 10. GENERAL TECHNICAL / DOMAIN SMART FALLBACK
        # If user asks about architecture, databases, kafka, tests, etc.
        if any(kw in lower_text for kw in ["баз", "postgres", "redis", "бд", "sql"]):
            return ChatResponse(
                reply=(
                    "🗄️ **Работа с базами данных в бэкенде Авито:**\n\n"
                    "• **PostgreSQL:** основная реляционная СУБД для надежного хранения данных заказов и объявлений. Используется шардирование, пулеры соединений (PgBouncer) и строгие миграции (Goose).\n"
                    "• **Redis:** высокоскоростной In-Memory кэш для сессий, лимитов RPS и частых горячих запросов.\n"
                    "• **Правило:** никогда не делай `SELECT *` без лимитов и индексов, чтобы не нагружать реплики в часы пик!"
                ),
                suggested_chips=["Что такое ZBP?", "Стандарты Code Review", "Тестовые стенды SPT"],
                sources=["Avito Data Platform Guidelines"]
            )

        if any(kw in lower_text for kw in ["kafka", "очеред", "сообщени", "событи", "broker"]):
            return ChatResponse(
                reply=(
                    "📨 **Событийная архитектура и Apache Kafka в Авито:**\n\n"
                    "• **Apache Kafka** — центральная шина асинхронного взаимодействия сотен микросервисов Авито.\n"
                    "• **Паттерны:** At-least-once доставка, строгая идемпотентность консьюмеров (обработка дубликатов), Schema Registry (Protobuf/Avro).\n"
                    "• Для локальной разработки схемы контрактов поднимаются в SPT-окружении через `avito-cli`."
                ),
                suggested_chips=["Деплой в PaaS", "Доступы SPT", "План 1:1"],
                sources=["Avito Event-Driven Architecture"]
            )

        # 11. GENERAL / WELCOME FALLBACK
        return ChatResponse(
            reply=(
                f"Привет, {user.name.split()[0]}! Я твой цифровой наставник **AI-buddy в Авито** 🚀\n\n"
                f"Я здесь, чтобы помогать тебе на каждом шаге стажировки:\n"
                f"• 📅 **Оформить отгул или дей-офф** без лишней бюрократии\n"
                f"• 🔑 **Получить доступы** к стендам SPT, Lens/k8s, GitLab и Grafana\n"
                f"• 📋 **Вести онбординг-чек-лист** и подсказывать следующие шаги\n"
                f"• 📖 **Отвечать на вопросы** по стандартам (Effective Go, Zero Bug Policy, Agile, code review)\n"
                f"• 🤝 **Готовиться к 1:1 и экваторной встрече**\n\n"
                f"Чем могу помочь прямо сейчас?"
            ),
            suggested_chips=["Как оформить отгул?", "Какой мой следующий шаг?", "Что такое ZBP?", "Мне нужны доступы"],
            sources=["Avito Start Onboarding Hub"]
        )

agent_service = AgentService()
