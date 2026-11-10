from app.models.schemas import ChecklistTask, AccessItem

# 1. Official Avito Intern Checklist Tasks (Extracted directly from Avito spreadsheet)
INITIAL_CHECKLIST_TASKS: list[ChecklistTask] = [
    # Неделя 1 - Общее и орг. моменты
    ChecklistTask(
        id="task_gen_1",
        title="Организационные моменты и регулярные 1:1",
        description="Попросить наставника добавить во все ключевые каналы и чаты (включая закрытые), запросить доступы (Jira, Confluence), назначить регулярные встречи 1:1 и обсудить цели адаптации (OKR).",
        period="week_1",
        period_title="1 неделя",
        category="General",
        status="completed",
        priority="high"
    ),
    ChecklistTask(
        id="task_gen_2",
        title="Запрос методички наставника и знакомство с командой",
        description="Запросить у куратора методичку, познакомиться с командой, с которой предстоит работать, и завести личный конспект для встреч 1:1.",
        period="week_1",
        period_title="1 неделя",
        category="General",
        status="completed",
        priority="high"
    ),
    ChecklistTask(
        id="task_gen_3",
        title="Доступ в пространство кластера и команды",
        description="Запросить доступ в пространство своего кластера и/или команды в Confluence и изучить вводные материалы.",
        period="week_1",
        period_title="1 неделя",
        category="General",
        status="in_progress",
        priority="medium"
    ),
    # Неделя 1 - Backend Трек Авито
    ChecklistTask(
        id="task_be_1",
        title="Погружение в Agile и Scrum в Авито",
        description="Изучить манифест Agile и принципы Scrum команд Авито: 2-недельные спринты, планирование, дейли, груминг, демо и ретроспектива.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="completed",
        priority="high",
        resource_link="https://github.com/avito-tech/playbook"
    ),
    ChecklistTask(
        id="task_be_2",
        title="Настройка окружения: VPN, прокси, Postman / Bruno, Lens для k8s",
        description="Установить корпоративный VPN, настроить сетевой прокси, клиенты тестирования API (Bruno/Charles), а также Lens для мониторинга Kubernetes-кластеров.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="completed",
        priority="high"
    ),
    ChecklistTask(
        id="task_be_3",
        title="Тестовые стенды SPT (Service Platform Team)",
        description="Запросить доступы и разобраться в работе со стендами SPT для тестирования микросервисов перед релизом.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="in_progress",
        priority="high"
    ),
    ChecklistTask(
        id="task_be_4",
        title="Изучение Zero Bug Policy (ZBP)",
        description="Освоить политику нулевой терпимости к багам в Авито: приоритет исправления дефектов перед новыми фичами, регламент разбора инцидентов.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="in_progress",
        priority="high",
        resource_link="https://habr.com/ru/companies/avito/articles/"
    ),
    ChecklistTask(
        id="task_be_5",
        title="Мониторинг Grafana и Sentry",
        description="Изучить базовые дашборды сервисов команды в Grafana (RPS, latency p95/p99, error rate 5xx) и правила трассировки ошибок в Sentry.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="todo",
        priority="medium"
    ),
    ChecklistTask(
        id="task_be_6",
        title="Effective Go и стандарты разработки Авито",
        description="Ознакомиться с внутренним код-стайлом Go, линтерами (golangci-lint), правилами обработки ошибок и соглашениями по архитектуре.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="todo",
        priority="medium"
    ),
    ChecklistTask(
        id="task_be_7",
        title="Установка avito-cli и работа со Stash/GitLab",
        description="Установить CLI-утилиту avito-cli для генерации boilerplate микросервисов, клонировать репозиторий команды из корпоративного Git.",
        period="week_1",
        period_title="1 неделя",
        category="Backend",
        status="todo",
        priority="medium"
    ),

    # Неделя 2
    ChecklistTask(
        id="task_gen_4",
        title="Инструмент отслеживания прогресса стажёра",
        description="Запросить у куратора инструмент для отслеживания прогресса. Внести в него согласованные цели, задачи и ожидания на 3 месяца.",
        period="week_2",
        period_title="2 неделя",
        category="General",
        status="todo",
        priority="high"
    ),
    ChecklistTask(
        id="task_be_8",
        title="Погружение в PaaS Авито: Deploy, Canary, Feature Flags",
        description="Понять процесс деплоя в PaaS Авито, канареечные релизы, runtime и compile-time feature flags и процедуру безопасного отката.",
        period="week_2",
        period_title="2 неделя",
        category="Backend",
        status="todo",
        priority="high"
    ),

    # 1 месяц
    ChecklistTask(
        id="task_gen_5",
        title="Основы защиты персональных данных и политика КИ",
        description="Ознакомиться с лендингом «Защита данных», памяткой по раскрытию информации и политикой по работе с коммерческой тайной (КИ).",
        period="month_1",
        period_title="1 месяц",
        category="General",
        status="todo",
        priority="high"
    ),

    # 2 месяц
    ChecklistTask(
        id="task_gen_6",
        title="Памятка по закрытию практики и учебных работ",
        description="Изучить порядок оформления учебных отчетов по практике в университете на базе стажировки в Авито.",
        period="month_2",
        period_title="2 месяц",
        category="General",
        status="todo",
        priority="low"
    ),

    # Экватор (После 3-х месяцев)
    ChecklistTask(
        id="task_gen_7",
        title="Подготовка и выступление на Экваторной встрече",
        description="Посетить мастер-классы, подготовить презентацию по заданной структуре, провести репетицию с наставником и представить результаты.",
        period="equator",
        period_title="Экватор (3 месяца)",
        category="General",
        status="todo",
        priority="high"
    ),
    ChecklistTask(
        id="task_gen_8",
        title="Встреча 1:1 по промежуточным итогам стажировки",
        description="Обсудить с наставником и руководителем обратную связь, результаты относительно целей и траекторию на оставшийся срок.",
        period="equator",
        period_title="Экватор (3 месяца)",
        category="General",
        status="todo",
        priority="high"
    ),
    ChecklistTask(
        id="task_gen_9",
        title="Выпускной и итоговый опрос",
        description="Пройти финальный опрос о прохождении стажировки и принять участие в выпускном вечере стажёров Авито.",
        period="final",
        period_title="Выпускной",
        category="General",
        status="todo",
        priority="medium"
    )
]

# 2. Access Management Initial State
INITIAL_ACCESS_ITEMS: list[AccessItem] = [
    AccessItem(
        id="acc_1",
        user_id="intern_1",
        system_key="vpn_corp",
        system_name="Корпоративный VPN",
        description="Доступ к внутренней сети и ресурсам Авито",
        status="active"
    ),
    AccessItem(
        id="acc_2",
        user_id="intern_1",
        system_key="gitlab_avito",
        system_name="GitLab / Stash Авито",
        description="Репозитории микросервисов команды Order Management",
        status="active"
    ),
    AccessItem(
        id="acc_3",
        user_id="intern_1",
        system_key="lens_k8s",
        system_name="Lens / Kubernetes Cluster (Dev/Stage)",
        description="Просмотр логов и подов в тестовых кластерах",
        status="requested"
    ),
    AccessItem(
        id="acc_4",
        user_id="intern_1",
        system_key="spt_cluster",
        system_name="SPT Стенды (Service Platform Team)",
        description="Интеграционные полигоны для тестирования взаимодействий",
        status="not_requested"
    ),
    AccessItem(
        id="acc_5",
        user_id="intern_1",
        system_key="grafana_metrics",
        system_name="Grafana & Prometheus Metrics",
        description="Метрики сервисов кластера и алерты",
        status="not_requested"
    ),
    AccessItem(
        id="acc_6",
        user_id="intern_1",
        system_key="sentry_errors",
        system_name="Sentry Error Tracking",
        description="Отслеживание необработанных исключений и крашей",
        status="not_requested"
    )
]
