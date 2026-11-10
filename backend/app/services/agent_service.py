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

        # 7. INTENT: 1:1 Meeting Preparation
        if any(kw in lower_text for kw in ["1:1", "один на один", "встреча с наставником", "экватор", "подготов"]):
            res = mcp_tool_registry.execute("generate_1on1_summary", user_id=user.user_id)
            agenda = "\n".join(res.get("summary_points", []))
            return ChatResponse(
                reply=(
                    f"🤝 **План для встречи 1:1 с наставником ({user.mentor_name or 'Алексеем'}):**\n\n"
                    f"{agenda}\n\n"
                    f"💡 *Совет:* На 1:1 не бойся открыто обсуждать блокеры и непонятные места в архитектуре сервисов."
                ),
                action_type="1on1_agenda_generated",
                suggested_chips=["Как оформить отгул?", "Что такое Zero Bug Policy?", "Чек-лист задач"],
                sources=["AvitoTech Playbook: 1:1 Guide"]
            )

        # 8. INTENT: Playbook FAQ Search (RAG)
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

        # 9. GENERAL / WELCOME FALLBACK
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
