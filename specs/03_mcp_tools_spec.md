# SDD-03: Model Context Protocol (MCP) Tools Specification
## Avito AI-Buddy (Hack&Change 2026)

### 1. Protocol Architecture
Все действия ассистента над корпоративными сервисами инкапсулируются в стандарт **Model Context Protocol (MCP)**.
Инструменты регистрируются в реестре `ToolRegistry` с декларативными JSON-схемами входных и выходных параметров.

---

### 2. Tool Definitions

#### Tool 1: `request_absence`
Создает заявку на отсутствие сотрудника (отгул, больничный, учебный отпуск).

```json
{
  "name": "request_absence",
  "description": "Оформляет заявку на отсутствие (отгул/day-off) через корпоративный сервис Авито",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string", "description": "ID стажёра" },
      "start_date": { "type": "string", "format": "date", "description": "Дата начала в формате YYYY-MM-DD" },
      "end_date": { "type": "string", "format": "date", "description": "Дата окончания в формате YYYY-MM-DD" },
      "absence_type": { "type": "string", "enum": ["day_off", "study_leave", "sick_leave"], "default": "day_off" },
      "reason": { "type": "string", "description": "Причина отсутствия" }
    },
    "required": ["user_id", "start_date", "reason"]
  }
}
```

#### Tool 2: `query_absence_status`
Возвращает список и статус оформленных отсутствий стажёра.

```json
{
  "name": "query_absence_status",
  "description": "Проверяет историю и текущий статус заявок на отгулы/отпуска стажёра",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string", "description": "ID стажёра" }
    },
    "required": ["user_id"]
  }
}
```

#### Tool 3: `request_access`
Формирует заявку на выдачу доступов в ServiceDesk / IAM Авито.

```json
{
  "name": "request_access",
  "description": "Создает заявку на получение доступа к инструментам разработки Авито (GitLab/Stash, Lens/k8s, SPT, Grafana, Sentry)",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string", "description": "ID стажёра" },
      "system_key": { "type": "string", "enum": ["lens_k8s", "spt_cluster", "grafana_metrics", "gitlab_avito", "sentry_errors", "vpn_corp"] },
      "justification": { "type": "string", "description": "Обоснование необходимости доступа" }
    },
    "required": ["user_id", "system_key"]
  }
}
```

#### Tool 4: `get_checklist_status`
Получает элементы онбординг-чек-листа стажёра с фильтрацией по периоду и статусу.

```json
{
  "name": "get_checklist_status",
  "description": "Возвращает прогресс стажёра по чек-листу онбординга Авито",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string" },
      "period": { "type": "string", "enum": ["week_1", "week_2", "month_1", "month_2", "equator", "all"] }
    },
    "required": ["user_id"]
  }
}
```

#### Tool 5: `update_checklist_task`
Обновляет статус задачи чек-листа стажёра.

```json
{
  "name": "update_checklist_task",
  "description": "Переводит задачу чек-листа в статус 'completed' или 'in_progress'",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string" },
      "task_id": { "type": "string" },
      "status": { "type": "string", "enum": ["todo", "in_progress", "completed"] }
    },
    "required": ["user_id", "task_id", "status"]
  }
}
```

#### Tool 6: `search_playbook`
Семантический поиск по базе знаний AvitoTech Playbook и регламентам.

```json
{
  "name": "search_playbook",
  "description": "Выполняет поиск проверенных регламентов, стандартов разработки (Go, ZBP, Agile, Git) и процессов Авито",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Поисковый запрос стажёра" }
    },
    "required": ["query"]
  }
}
```
