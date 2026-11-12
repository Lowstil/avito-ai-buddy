from unittest.mock import MagicMock
from app.services.gemini_service import gemini_service

def test_gemini_chat_intern_role(client, intern_headers):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Развёрнутый ответ Gemini 2.5 Flash для стажёра Арсения о горутинах и каналах."
    mock_client.models.generate_content.return_value = mock_resp

    orig = gemini_service._client
    gemini_service._client = mock_client
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Как работают каналы и горутины в Go?"},
            headers=intern_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "Gemini 2.5 Flash" in data["reply"] or "Gemini" in str(data["sources"])
        assert "Google Gemini 2.5 Flash" in data["sources"]
        assert len(data["suggested_chips"]) > 0
    finally:
        gemini_service._client = orig

def test_gemini_chat_mentor_role(client, mentor_headers):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Коучинговый ответ Gemini 2.5 Flash для наставника Алексея по проведению код-ревью."
    mock_client.models.generate_content.return_value = mock_resp

    orig = gemini_service._client
    gemini_service._client = mock_client
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Как научить стажёра писать безопасный SQL без N+1?"},
            headers=mentor_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "Gemini 2.5 Flash" in data["reply"] or "Gemini" in str(data["sources"])
        assert "Google Gemini 2.5 Flash" in data["sources"]
        assert "План встречи 1:1 для ментора" in data["suggested_chips"]
    finally:
        gemini_service._client = orig

def test_gemini_chat_lead_role(client, lead_headers):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Стратегический ответ Gemini 2.5 Flash для тимлида о DORA-метриках."
    mock_client.models.generate_content.return_value = mock_resp

    orig = gemini_service._client
    gemini_service._client = mock_client
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Как улучшить MTTR и снизить риски инцидентов в Delivery Core?"},
            headers=lead_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "Gemini 2.5 Flash" in data["reply"] or "Gemini" in str(data["sources"])
        assert "Google Gemini 2.5 Flash" in data["sources"]
    finally:
        gemini_service._client = orig

def test_gemini_chat_with_history_and_rag(client, intern_headers):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Ответ Gemini с учётом истории и базы знаний."
    mock_client.models.generate_content.return_value = mock_resp

    orig = gemini_service._client
    gemini_service._client = mock_client
    try:
        payload = {
            "message": "А приведи пример кода для этого",
            "history": [
                {"sender": "user", "content": "Как настроить Kafka consumer group?"},
                {"sender": "assistant", "content": "В Kafka консьюмеры объединяются в группы..."}
            ]
        }
        res = client.post("/api/chat", json=payload, headers=intern_headers)
        assert res.status_code == 200
        assert res.json()["reply"] == "Ответ Gemini с учётом истории и базы знаний."

        # Verify call arguments to generate_content
        call_args = mock_client.models.generate_content.call_args
        assert call_args is not None
        called_contents = call_args.kwargs.get("contents", "")
        assert "Kafka" in called_contents
    finally:
        gemini_service._client = orig

def test_fallback_on_gemini_exception(client, intern_headers):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("Gemini API Rate Limit or Network Error")

    orig = gemini_service._client
    gemini_service._client = mock_client
    try:
        # Service should catch exception and smoothly activate fallback engine
        res = client.post(
            "/api/chat",
            json={"message": "Как работают каналы и горутины в Go?"},
            headers=intern_headers
        )
        assert res.status_code == 200
        reply = res.json()["reply"]
        assert "горутин" in reply.lower() or "каналы" in reply.lower()
        # Must NOT be a greeting
        assert "Чем помочь прямо сейчас?" not in reply
    finally:
        gemini_service._client = orig

# --- FALLBACK ENGINE TESTS ACROSS ROLES ---

def test_fallback_concurrency_intern(client, intern_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Как искать утечки горутин (goroutine leaks) в сервисе?"},
            headers=intern_headers
        )
        assert res.status_code == 200
        reply = res.json()["reply"]
        assert "горутин" in reply.lower() or "select" in reply.lower()
        assert "Чем помочь прямо сейчас?" not in reply
    finally:
        gemini_service._client = orig

def test_fallback_concurrency_mentor(client, mentor_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Как объяснить стажёру разницу между sync.Mutex и каналами?"},
            headers=mentor_headers
        )
        assert res.status_code == 200
        reply = res.json()["reply"]
        assert "наставник" in reply.lower() or "коучинг" in reply.lower() or "горутин" in reply.lower()
        assert "О чём рассказать подробнее?" not in reply
    finally:
        gemini_service._client = orig

def test_fallback_concurrency_lead(client, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        res = client.post(
            "/api/chat",
            json={"message": "Какие риски вызывают гонки данных (data race) в сервисах доставки?"},
            headers=lead_headers
        )
        assert res.status_code == 200
        reply = res.json()["reply"]
        assert "lead" in reply.lower() or "тимлид" in reply.lower() or "метрики" in reply.lower() or "race" in reply.lower()
        assert "Какой управленческий срез подготовить?" not in reply
    finally:
        gemini_service._client = orig

def test_fallback_algorithms_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern asks about algorithms
        r_int = client.post("/api/chat", json={"message": "Как устроен LRU кэш и какова его сложность?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "lru" in r_int.json()["reply"].lower() or "кэш" in r_int.json()["reply"].lower()
        assert "Чем помочь прямо сейчас?" not in r_int.json()["reply"]

        # Mentor asks about algorithms
        r_men = client.post("/api/chat", json={"message": "Как научить джуна оценивать сложность O(n)?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "наставник" in r_men.json()["reply"].lower() or "сложность" in r_men.json()["reply"].lower()

        # Lead asks about algorithms
        r_lead = client.post("/api/chat", json={"message": "Как алгоритмы влияют на latency budget и DORA метрики?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "тимлид" in r_lead.json()["reply"].lower() or "latency" in r_lead.json()["reply"].lower() or "lead" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_architecture_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern
        r_int = client.post("/api/chat", json={"message": "Как устроен Transactional Outbox в Delivery Core?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "outbox" in r_int.json()["reply"].lower() or "kafka" in r_int.json()["reply"].lower()

        # Mentor
        r_men = client.post("/api/chat", json={"message": "Как проверить понимание архитектуры Kafka у подопечного?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "наставник" in r_men.json()["reply"].lower() or "архитектур" in r_men.json()["reply"].lower()

        # Lead
        r_lead = client.post("/api/chat", json={"message": "Какие архитектурные риски при шардировании базы заказов?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "тимлид" in r_lead.json()["reply"].lower() or "архитектур" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_database_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern
        r_int = client.post("/api/chat", json={"message": "Как правильно настраивать индексы в PostgreSQL?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "индекс" in r_int.json()["reply"].lower() or "postgres" in r_int.json()["reply"].lower()

        # Mentor
        r_men = client.post("/api/chat", json={"message": "На что смотреть при ревью SQL запросов стажера?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "наставник" in r_men.json()["reply"].lower() or "sql" in r_men.json()["reply"].lower()

        # Lead
        r_lead = client.post("/api/chat", json={"message": "Какой статус нагрузки на PgBouncer в кластере?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "pgbouncer" in r_lead.json()["reply"].lower() or "тимлид" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_sre_debugging_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern
        r_int = client.post("/api/chat", json={"message": "Упал под с ошибкой OOMKilled, как дебажить?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "oom" in r_int.json()["reply"].lower() or "pprof" in r_int.json()["reply"].lower() or "lens" in r_int.json()["reply"].lower()

        # Mentor
        r_men = client.post("/api/chat", json={"message": "Как научить стажёра действовать при аварии на проде?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "наставник" in r_men.json()["reply"].lower() or "авари" in r_men.json()["reply"].lower() or "инцидент" in r_men.json()["reply"].lower()

        # Lead
        r_lead = client.post("/api/chat", json={"message": "Какой у нас MTTR при сбоях продакшена?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "инцидент" in r_lead.json()["reply"].lower() or "mttr" in r_lead.json()["reply"].lower() or "тимлид" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_career_and_equator_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern
        r_int = client.post("/api/chat", json={"message": "Как подготовить презентацию к защите на экваторе?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "экватор" in r_int.json()["reply"].lower() or "оффер" in r_int.json()["reply"].lower()

        # Mentor
        r_men = client.post("/api/chat", json={"message": "По каким осям оценивать стажера при подготовке к офферу?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "экватор" in r_men.json()["reply"].lower() or "оценк" in r_men.json()["reply"].lower() or "hard skills" in r_men.json()["reply"].lower()

        # Lead
        r_lead = client.post("/api/chat", json={"message": "Когда планировать ставку под оффер для джуниора?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "оффер" in r_lead.json()["reply"].lower() or "readiness" in r_lead.json()["reply"].lower() or "тимлид" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_multi_turn_history_continuity(client, intern_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        payload = {
            "message": "А расскажи подробнее про партиции и консьюмер группы",
            "history": [
                {"sender": "user", "content": "Что такое Apache Kafka?"},
                {"sender": "assistant", "content": "Apache Kafka используется для потоковой обработки событий в Delivery Core."}
            ]
        }
        res = client.post("/api/chat", json=payload, headers=intern_headers)
        assert res.status_code == 200
        reply = res.json()["reply"]
        assert "партици" in reply.lower() or "kafka" in reply.lower() or "обсуждение" in reply.lower()
        assert "Чем помочь прямо сейчас?" not in reply
    finally:
        gemini_service._client = orig

def test_fallback_open_arbitrary_question_all_roles(client, intern_headers, mentor_headers, lead_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Intern arbitrary question
        r_int = client.post("/api/chat", json={"message": "Посоветуй как лучше распределить рабочее время стажёра?"}, headers=intern_headers)
        assert r_int.status_code == 200
        assert "Чем помочь прямо сейчас?" not in r_int.json()["reply"]
        assert "AI-buddy" in r_int.json()["reply"] or "стажёр" in r_int.json()["reply"].lower()

        # Mentor arbitrary question
        r_men = client.post("/api/chat", json={"message": "Как поддерживать мотивацию стажёра при сложных задачах?"}, headers=mentor_headers)
        assert r_men.status_code == 200
        assert "О чём рассказать подробнее?" not in r_men.json()["reply"]
        assert "наставник" in r_men.json()["reply"].lower() or "менторинг" in r_men.json()["reply"].lower()

        # Lead arbitrary question
        r_lead = client.post("/api/chat", json={"message": "Как повысить прозрачность статусов в команде?"}, headers=lead_headers)
        assert r_lead.status_code == 200
        assert "Какой управленческий срез подготовить?" not in r_lead.json()["reply"]
        assert "тимлид" in r_lead.json()["reply"].lower() or "команд" in r_lead.json()["reply"].lower()
    finally:
        gemini_service._client = orig

def test_fallback_edge_cases(client, intern_headers):
    orig = gemini_service._client
    gemini_service._client = None
    try:
        # Empty / whitespace message
        res1 = client.post("/api/chat", json={"message": "   "}, headers=intern_headers)
        assert res1.status_code == 200
        assert len(res1.json()["reply"]) > 0

        # Message with empty history
        res2 = client.post("/api/chat", json={"message": "Что такое goroutine leak?", "history": []}, headers=intern_headers)
        assert res2.status_code == 200
        assert "горутин" in res2.json()["reply"].lower()

        # Message with non-standard history dict keys (e.g. 'role' and 'text')
        res3 = client.post(
            "/api/chat",
            json={
                "message": "А как с этим бороться?",
                "history": [
                    {"role": "user", "text": "У нас утечка памяти в pod"},
                    {"role": "assistant", "text": "Проверьте pprof и незакрытые каналы"}
                ]
            },
            headers=intern_headers
        )
        assert res3.status_code == 200
        assert len(res3.json()["reply"]) > 0
    finally:
        gemini_service._client = orig
