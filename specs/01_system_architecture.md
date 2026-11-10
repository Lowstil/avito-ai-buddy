# SDD-01: System Architecture Specification
## Avito AI-Buddy (Hack&Change 2026)

### 1. Vision & Executive Summary
AI-buddy — это интеллектуальный ассистент-наставник для стажёров Авито, снижающий нагрузку на менторов (с 40–65 часов до 20–25 часов рутины за программу) и ускоряющий выход стажёра на продуктивность. Система сочетает интерактивный дашборд онбординга, чат-ассистента и оркестратор корпоративных действий через Model Context Protocol (MCP).

### 2. Alignment with Avito Tech Stack
| Компонент | Стек Авито | Реализация прототипа | Обоснование совместимости |
| :--- | :--- | :--- | :--- |
| **Frontend** | React, TypeScript, TanStack, Zustand, Zod | React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion | 100% совпадение по библиотекам состояния (Zustand), типизации (Zod/TS) и компонентному подходу. Поддержка Glassy Liquid стиля. |
| **Backend** | Go (Python с Flask/FastAPI в спец-сервисах) | Python 3.14 + FastAPI (Async/Pydantic v2) | Чистая слоистая архитектура (Clean Architecture), легко переносимая на Go gRPC микросервисы. Высокая скорость разработки AI/MCP модулей. |
| **AI Protocol** | MCP (Model Context Protocol), продвинутые промпты | Внутренний MCP Server со стандартным JSON-RPC/In-Process вызовом инструментов | Стандарт взаимодействия агентов с внешними сервисами, нативно принятый в индустрии и поддерживаемый инфраструктурой Авито. |
| **Storage & State** | PostgreSQL, Redis | In-Memory / SQLite (персистентный) + Redis Mock Adapter | Нулевая задержка старта для жюри, мгновенное развертывание в Docker и локально. |
| **Телеметрия** | Grafana, Clickstream, Prometheus | Clickstream Event Logger + Prometheus-совместимый `/metrics` endpoint | Фиксация всех действий стажёра и метрик работы AI для последующего анализа в Grafana. |

### 3. C4 System Context & Component Diagram

```mermaid
flowchart TB
    subgraph Client [Клиентский слой]
        UI[Frontend Web App / React + Vite]
        Store[Zustand Store + Zod Schema Validation]
        Motion[Glassy Liquid UI Engine / Framer Motion]
    end

    subgraph BackendAPI [Бэкенд-сервис / FastAPI]
        Router[API Gateway / Router]
        AuthRBAC[Auth & RBAC Middleware]
        EventBus[Clickstream Analytics Bus]
    end

    subgraph AICore [AI Orchestration Layer]
        Agent[Agent Orchestrator / Hybrid Engine]
        OfflineLLM[Deterministic Smart Mock LLM]
        ExternalLLM[OpenAI / Gemini / GigaChat API Client]
        RAG[Playbook & Checklist RAG Engine]
    end

    subgraph MCPServer [Model Context Protocol Server]
        MCPRegistry[MCP Tool Registry]
        AbsenceTool[Tool: request_absence / query_status]
        AccessTool[Tool: request_access / list_permissions]
        ChecklistTool[Tool: update_checklist / get_summary]
    end

    subgraph CorpMocks [Имитации сервисов Авито]
        AbsenceSvc[Corporate Absence & Vacation System]
        AccessSvc[ServiceDesk & IAM System (SPT/Lens/GitLab)]
        ChecklistSvc[Intern Onboarding Checklist Data]
    end

    UI --> Router
    Router --> AuthRBAC
    AuthRBAC --> Agent
    Router --> EventBus
    Agent --> RAG
    Agent --> OfflineLLM
    Agent --> ExternalLLM
    Agent --> MCPRegistry
    MCPRegistry --> AbsenceTool
    MCPRegistry --> AccessTool
    MCPRegistry --> ChecklistTool
    AbsenceTool --> AbsenceSvc
    AccessTool --> AccessSvc
    ChecklistTool --> ChecklistSvc
```

### 4. Non-Functional Requirements (SLAs & Performance)
1. **Latency:** Локальные операции (просмотр чек-листа, переключение фильтров, локальная валидация) — **< 200 ms** (норматив кейса < 1 с).
2. **AI Response:** Потоковый ответ (Streaming) или статус ожидания с обратной связью (typing indicators, optimistic updates).
3. **Availability & Resilience:** Graceful degradation. При отсутствии интернета или внешнего API-ключа система плавно переключается на Smart Offline Mock без падения.
4. **Testability:** Не менее 80% покрытия прикладного кода тестами (pytest/coverage).
