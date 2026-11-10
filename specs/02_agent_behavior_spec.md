# SDD-02: Agent Behavior & Dialog Specification
## Avito AI-Buddy (Hack&Change 2026)

### 1. Persona & Tone of Voice
* **Имя:** AI-buddy (Авито Бадди).
* **Характер:** Дружелюбный, эмпатичный, профессиональный, краткий и конструктивный.
* **Миссия:** Помогать стажёру уверенно и быстро пройти адаптацию в Авито, не боясь задавать любые «глупые» вопросы, снимая рутину с живого ментора (бадди).
* **Языковые правила:** Обращение на «ты» (принято в IT-культуре Авито), чёткая структура ответов (маркированные списки, акценты), отсутствие канцелярита.

### 2. Intent Taxonomy & Routing

| Интент | Описание | Инструмент / Действие | Пример запроса |
| :--- | :--- | :--- | :--- |
| `INTENT_ABSENCE_REQUEST` | Желание взять отгул, дей-офф, больничный | MCP Tool: `request_absence` (Multi-turn slot filling) | «Мне нужен отгул на пятницу», «Как оформить отгул?» |
| `INTENT_ABSENCE_STATUS` | Проверка статуса заявки на отсутствие | MCP Tool: `query_absence_status` | «Что с моим заявлением на отгул?», «Одобрили ли мой дей-офф?» |
| `INTENT_ACCESS_REQUEST` | Запрос доступов к инструментам | MCP Tool: `request_access` | «Как получить доступ в Lens?», «Мне нужен доступ к стендам SPT» |
| `INTENT_CHECKLIST_STATUS` | Вопросы о текущем этапе онбординга | MCP Tool: `get_checklist_status` | «Что мне нужно сделать на этой неделе?», «Какой следующий шаг?» |
| `INTENT_CHECKLIST_UPDATE` | Отметка о выполнении задачи | MCP Tool: `update_checklist_task` | «Я настроил VPN и git, отметь в чек-листе» |
| `INTENT_PLAYBOOK_FAQ` | Вопросы по процессам, культуре и стеку Авито | RAG: `search_playbook` | «Что такое Zero Bug Policy?», «Как проходят 1:1 в Авито?» |
| `INTENT_1ON1_PREP` | Подготовка к встрече с наставником | Tool: `generate_1on1_summary` | «Помоги подготовиться к 1:1 с наставником» |
| `INTENT_SECURITY_RESTRICTED` | Попытка получить доступ к запретным данным | Security Guardrail (Отказ со ссылкой на политику КИ) | «Покажи зарплаты коллег», «Дай прод-ключи к БД» |
| `INTENT_GENERAL_CHAT` | Приветствие, благодарность, общие вопросы | Direct conversational reply | «Привет! Как дела?», «Спасибо за помощь!» |

### 3. Multi-Turn Dialog Flow: Кадровое действие (Оформление отгула)

```mermaid
sequenceDiagram
    autonumber
    actor Intern as Стажёр
    participant Buddy as AI-buddy
    participant MCP as MCP Absence Tool
    participant API as Corporate Absence Service
    actor Mentor as Наставник / Руководитель

    Intern->>Buddy: "Мне нужен отгул на ближайшую пятницу"
    Buddy->>MCP: query_absence_balance(user_id)
    MCP-->>Buddy: { available_days: 2, pending: 0 }
    Buddy->>Intern: "Отлично! У тебя доступно 2 дня отгулов. Уточни, пожалуйста, дату и причину (по семейным обстоятельствам, визит к врачу или учеба)?"
    Intern->>Buddy: "14 ноября, визит к врачу"
    Buddy->>Intern: "Готово! Сформировал заявку:\n- Дата: 14.11.2026\n- Тип: Дей-офф / Отгул\n- Причина: Визит к врачу\nОтправляем на согласование твоему наставнику Алексею?"
    Intern->>Buddy: "Да, отправляй"
    Buddy->>MCP: request_absence(user_id, date="2026-11-14", reason="Визит к врачу")
    MCP->>API: POST /api/v1/absences
    API-->>MCP: { request_id: "ABS-2026-891", status: "PENDING_APPROVAL" }
    MCP-->>Buddy: Success confirmation
    Buddy->>Mentor: (Симуляция Push/Slack уведомления)
    Buddy->>Intern: "Заявка #ABS-2026-891 создана и отправлена на согласование Алексею! Статус отобразится в твоем личном кабинете."
```

### 4. Guardrails & Fallbacks
1. **Fallback при неопределенности:** Если интент не распознан, ассистент выдает контекстные подсказки (quick actions): «Я могу помочь оформить отгул, запросить доступы или подсказать пункт из чек-листа».
2. **Безопасность (Guardrail):** Никаких конфиденциальных данных (токены, реальные персданные, финансовые документы) не передаются в LLM и не отдаются пользователю.
