from app.models.schemas import GlossaryTerm

class GlossaryService:
    """Avito Engineering & Culture Jargon Buster."""

    def __init__(self):
        self._terms = [
            GlossaryTerm(
                id="term_spt",
                term="SPT (Service Provider Testing)",
                category="Инфраструктура & Стенды",
                definition="Изолированные тестовые стенды Авито для развёртывания фиче-веток и сквозной проверки взаимодействия микросервисов.",
                internal_context="Каждый бэкендер поднимает свой SPT-стенд перед открытием PR, чтобы протестировать миграции БД и контракты gRPC.",
                example_phrase="«Арсений, задеплой сначала свою ветку в SPT-24, проверим ручки в Bruno, а потом зови на ревью».",
                tags=["spt", "стенд", "тестирование", "деплой"]
            ),
            GlossaryTerm(
                id="term_zbp",
                term="Zero Bug Policy (ZBP)",
                category="Стандарты разработки",
                definition="Регламент Авито по приоритетному устранению багов: дефекты в проде чинятся раньше разработки новых продуктовых фичей.",
                internal_context="Если после релиза метрика ошибок в Sentry подскакивает, релиз откатывается, а команда садится за багфикс.",
                example_phrase="«По ZBP у нас в master не должно быть ни одного незакрытого блокера к концу спринта».",
                tags=["zbp", "качество", "баги", "sentry"]
            ),
            GlossaryTerm(
                id="term_paas",
                term="PaaS (Platform as a Service)",
                category="Инфраструктура & Стенды",
                definition="Внутренняя облачная платформа Авито для автоматического оркестрирования контейнеров, канареечных релизов и балансировки нагрузки.",
                internal_context="Разработчик не пишет вручную сложные манифесты k8s: PaaS берёт конфигурацию из `app.yaml` сервиса.",
                example_phrase="«В PaaS настроен канареечный деплой: сначала 5% трафика, если алерты чистые — катим на весь кластер».",
                tags=["paas", "k8s", "kubernetes", "релиз"]
            ),
            GlossaryTerm(
                id="term_lens",
                term="Lens (Kubernetes IDE)",
                category="Инфраструктура & Стенды",
                definition="Графический интерфейс для визуализации кластеров Kubernetes, просмотра состояния подов, метрик потребления CPU/RAM и потока логов.",
                internal_context="Используется стажёрами для отладки падений сервиса и проверки перезапусков (CrashLoopBackOff).",
                example_phrase="«Открой Lens, выбери namespace delivery-core и посмотри логи упавшего воркера».",
                tags=["lens", "k8s", "логи", "поды"]
            ),
            GlossaryTerm(
                id="term_stash",
                term="Stash / GitLab",
                category="Инфраструктура & Стенды",
                definition="Внутренняя система контроля версий и CI/CD пайплайнов Авито.",
                internal_context="Все коммиты должны следовать Conventional Commits, а PR требует минимум 2 подтверждения (аппрува) от коллег.",
                example_phrase="«Залил правки в Stash, линтеры прошли, жду твой аппрув».",
                tags=["stash", "gitlab", "git", "ci"]
            ),
            GlossaryTerm(
                id="term_equator",
                term="Экватор (3 месяца)",
                category="Культура & Адаптация",
                definition="Главная контрольная точка стажировки Avito Start ровно на середине пути (через 3 месяца после выхода).",
                internal_context="Стажёр и ментор готовят презентацию результатов, калибруют компетенции по матрице грейда Junior и намечают цели к офферу.",
                example_phrase="«К экватору у тебя должен быть закрыт чек-лист первой недели и выкачена самостоятельная фича».",
                tags=["экватор", "оценка", "грейд", "оффер"]
            ),
            GlossaryTerm(
                id="term_buffer",
                term="Буфер емкости (Capacity Buffer)",
                category="Культура & Адаптация",
                definition="Зарезервированная часть рабочего времени команды (10–15%) на менторинг новичков, дежурства и непредвиденные инциденты.",
                internal_context="Благодаря буферу наставник Алексей имеет официальные 4.5 часа в неделю на созвоны со стажёром без ущерба деливери.",
                example_phrase="«У нас заложен буфер на менторинг, поэтому не бойся звать меня в звонок — время предусмотрено».",
                tags=["буфер", "спринт", "нагрузка", "ментор"]
            ),
            GlossaryTerm(
                id="term_release_train",
                term="Поезд релизов (Release Train)",
                category="Стандарты разработки",
                definition="Регулярное расписание выкатки микросервисов в прод-окружение (например, дважды в день по вторникам и четвергам).",
                internal_context="Если фича не успела пройти регресс-тестирование до отхода поезда, она уезжает со следующим составом.",
                example_phrase="«Успей до 15:00 смерджить ветку, чтобы сесть в дневной релизный поезд».",
                tags=["релиз", "поезд", "прод", "деплой"]
            ),
            GlossaryTerm(
                id="term_1on1",
                term="1:1 (One-on-One)",
                category="Культура & Адаптация",
                definition="Регулярная персональная встреча стажёра с наставником или тимлидом (обычно раз в неделю на 45 минут).",
                internal_context="Здесь обсуждаются не статусы тикетов (для этого есть дейли), а развитие, комфорт, блокеры и обратная связь.",
                example_phrase="«Давай на сегодняшнем 1:1 разберём архитектуру базы и обсудим твои впечатления от спринта».",
                tags=["1:1", "созвон", "фидбек", "наставник"]
            ),
            GlossaryTerm(
                id="term_dayoff",
                term="Day-off (Отгул)",
                category="Кадровые процессы",
                definition="Оплачиваемый выходной день, предоставляемый стажёру Авито (лимит: 2 дня в календарный месяц).",
                internal_context="Оформляется через корпоративный сервис или AI-buddy без бумажной бюрократии с согласованием наставника.",
                example_phrase="«Беру day-off в пятницу для сдачи курсовой, задачи спринта перекрыл».",
                tags=["отгул", "dayoff", "отпуск", "кадры"]
            ),
            GlossaryTerm(
                id="term_bruno",
                term="Bruno",
                category="Инфраструктура & Стенды",
                definition="Быстрый open-source Git-friendly API-клиент, принятый в Авито на замену Postman.",
                internal_context="Коллекции запросов хранятся прямо в репозитории сервиса в текстовом формате `.bru`.",
                example_phrase="«Склонируй папку `/tests/bruno`, там готовые сценарии создания заказа для проверки стенда».",
                tags=["bruno", "api", "http", "тесты"]
            ),
            GlossaryTerm(
                id="term_p0",
                term="P0 / P1 (Приоритеты инцидентов)",
                category="Стандарты разработки",
                definition="Наивысшие уровни критичности сбоев в работе сервисов Авито. P0 — полный отказ ключевого флоу (покупка/доставка).",
                internal_context="При P0 собирается аварийный штаб инженеров, а время локализации регламентировано минутами.",
                example_phrase="«Вчера подняли P1 по нотификациям, но быстро откатили канарейку — база выдержала».",
                tags=["p0", "p1", "инцидент", "sre"]
            )
        ]

    def get_all_terms(self, category: str = None, search: str = None) -> list[GlossaryTerm]:
        results = self._terms
        if category and category != "Все":
            results = [t for t in results if t.category == category]
        if search:
            q = search.lower().strip()
            results = [
                t for t in results
                if q in t.term.lower() or q in t.definition.lower() or any(q in tag for tag in t.tags)
            ]
        return results

    def get_categories(self) -> list[str]:
        return ["Все", "Инфраструктура & Стенды", "Стандарты разработки", "Культура & Адаптация", "Кадровые процессы"]

glossary_service = GlossaryService()
