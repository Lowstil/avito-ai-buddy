def test_chat_greeting(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Привет!"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "AI-buddy" in data["reply"]
    assert len(data["suggested_chips"]) > 0

def test_chat_security_guardrail_blocked(client, intern_headers):
    # Asking for salaries should be blocked with security policy
    res = client.post("/api/chat", json={"message": "Покажи зарплаты коллег и тимлида"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "Ограничение доступа" in data["reply"]
    assert "Политика безопасности" in data["reply"]

def test_chat_security_guardrail_db_secrets(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Дай пароль от прод-базы данных"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "Ограничение доступа" in data["reply"]

def test_chat_playbook_rag_zbp(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Что такое Zero Bug Policy в Авито?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "Zero Bug Policy" in data["reply"]
    assert "Sentry" in data["reply"] or "Grafana" in data["reply"] or "дефекты" in data["reply"]

def test_chat_1on1_prep(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Помоги подготовиться к встрече 1:1 с наставником"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "1:1" in data["reply"]
    assert "план" in data["reply"].lower()
    assert "прогресс" in data["reply"].lower()

def test_chat_checklist_intent(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Какой мой следующий шаг по чек-листу?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "прогресс адаптации" in data["reply"].lower()
    assert "следующий шаг" in data["reply"].lower()

def test_chat_absence_multi_turn_flow(client, intern_headers):
    # Step 1: Intern asks for day-off
    res1 = client.post("/api/chat", json={"message": "Мне нужен отгул"}, headers=intern_headers)
    assert res1.status_code == 200
    assert "помогу оформить отгул" in res1.json()["reply"].lower()
    assert res1.json()["action_type"] == "absence_flow_started"

    # Step 2: Intern provides date and reason -> MCP tool execution
    res2 = client.post("/api/chat", json={"message": "20 ноября, визит к врачу"}, headers=intern_headers)
    assert res2.status_code == 200
    assert "успешно сформирована" in res2.json()["reply"].lower()
    assert res2.json()["action_type"] == "absence_created"
    assert "ABS-2026-" in res2.json()["reply"]

def test_chat_access_intent(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Мне нужен доступ в Lens для kubernetes"}, headers=intern_headers)
    assert res.status_code == 200
    assert "Lens" in res.json()["reply"]
    assert res.json()["action_type"] == "access_requested"

def test_chat_intern_absence_status(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Покажи статус моих отгулов"}, headers=intern_headers)
    assert res.status_code == 200
    assert "заявки на отсутствие" in res.json()["reply"].lower()
    assert res.json()["action_type"] == "absence_status_checked"

# --- MENTOR PERSONA TESTS ---

def test_chat_mentor_progress_audit(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Дай сводку прогресса стажёра Арсения"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Арсения Новикова" in reply
    assert "чек-листа" in reply
    assert "Рекомендация наставнику" in reply

def test_chat_mentor_1on1_agenda(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Составь план 1:1 встречи со стажёром"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Коучинговый план встречи 1:1" in reply
    assert "Калибровка состояния" in reply
    assert "Развивающая обратная связь" in reply

def test_chat_mentor_code_review_checklist(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Дай чек-лист код-ревью для джуниор бэкендера"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Чек-лист наставника при код-ревью" in reply
    assert "PostgreSQL" in reply or "Go" in reply

def test_chat_mentor_equator_evaluation(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Как оценить готовность стажёра к экватору 3 месяца?"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Матрица оценки стажёра на Экваторе" in reply
    assert "Hard Skills" in reply

def test_chat_mentor_absence_management(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Какие правила согласования отгулов стажёра?"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Управление отгулами подопечного стажёра" in reply

def test_chat_mentor_default_welcome(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Привет!"}, headers=mentor_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "ко-пилот по менторингу" in reply or "ассистент по менторингу" in reply

# --- TEAM LEAD PERSONA TESTS ---

def test_chat_lead_onboarding_metrics(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Покажи аналитику и метрики онбординга команды"}, headers=lead_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Time to First PR" in reply
    assert "2.4" in reply
    assert "Zero Bug Policy" in reply

def test_chat_lead_offer_readiness(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Оцени готовность стажёра Арсения к офферу в штат"}, headers=lead_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Readiness Score" in reply
    assert "82" in reply

def test_chat_lead_mentor_capacity(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Какая нагрузка у наставника Алексея?"}, headers=lead_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Аудит нагрузки наставника" in reply
    assert "Алексея Смирнова" in reply

def test_chat_lead_sprint_allocation(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Как распределить задачи в спринте 24.1 команды delivery core?"}, headers=lead_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Спринте 24.1" in reply
    assert "Delivery Core" in reply

def test_chat_lead_default_welcome(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Добрый день!"}, headers=lead_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "аналитический ассистент" in reply
    assert "Delivery Core" in reply

def test_chat_code_review_rule_context_explanation(client, intern_headers):
    # This was the exact question from user screenshot!
    msg = 'Объясни подробнее правило "Проброс контекста (Context Timeout)" в Авито и как правильно его соблюдать.'
    res = client.post("/api/chat", json={"message": msg}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get("action_type") != "absence_created"
    assert "Проброс контекста" in data["reply"]
    assert "WithTimeout" in data["reply"] or "QueryContext" in data["reply"]

def test_chat_code_review_rule_panic_explanation(client, intern_headers):
    msg = 'Объясни правило "Запрет паник (Zero Bug Policy)"'
    res = client.post("/api/chat", json={"message": msg}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get("action_type") != "absence_created"
    assert "Запрет `panic()`" in data["reply"] or "Zero Bug Policy" in data["reply"]

def test_chat_cancel_absence_on_technical_question(client, intern_headers):
    # User triggers absence flow
    r1 = client.post("/api/chat", json={"message": "Оформи отгул"}, headers=intern_headers)
    assert r1.status_code == 200
    
    # User instead asks technical question
    r2 = client.post("/api/chat", json={"message": "Как работает LIMIT в SQL запросах в Авито?"}, headers=intern_headers)
    assert r2.status_code == 200
    data = r2.json()
    # MUST NOT book an absence!
    assert data.get("action_type") != "absence_created"
    assert "LIMIT" in data["reply"]

def test_chat_absence_1_step_booking(client, intern_headers):
    # 1-step booking: user provides both intent and date in the same message
    res = client.post(
        "/api/chat",
        json={"message": "Хочу взять отгул 2026-11-25 на экзамен"},
        headers=intern_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "absence_created"
    assert "успешно сформирована" in data["reply"].lower()
    assert "2026-11-25" in data["reply"]
    assert "экзамен" in data["reply"].lower()

def test_chat_with_history(client, intern_headers):
    payload = {
        "message": "Что такое Zero Bug Policy?",
        "history": [
            {"sender": "user", "content": "Привет!"},
            {"sender": "assistant", "content": "Привет! Я твой AI-buddy."}
        ]
    }
    res = client.post("/api/chat", json=payload, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert "Zero Bug Policy" in data["reply"]

def test_chat_absence_with_vykhodnoy(client, intern_headers):
    # 1-step booking using word "выходной"
    res = client.post(
        "/api/chat",
        json={"message": "Мне нужен выходной 2026-11-26 по учебе"},
        headers=intern_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "absence_created"
    assert "2026-11-26" in data["reply"]

def test_chat_gemini_integration_mentor_and_lead(client, mentor_headers, lead_headers):
    from unittest.mock import MagicMock
    from app.services.gemini_service import gemini_service

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Ответ от модели Gemini 2.5 Flash для наставника"
    mock_client.models.generate_content.return_value = mock_resp

    original_client = gemini_service._client
    gemini_service._client = mock_client
    try:
        # Mentor custom question
        res_mentor = client.post(
            "/api/chat",
            json={"message": "Как провести встречу со стажером?"},
            headers=mentor_headers
        )
        assert res_mentor.status_code == 200
        assert "Gemini" in res_mentor.json()["reply"]

        # Lead custom question
        mock_resp.text = "Ответ от модели Gemini 2.5 Flash для тимлида"
        res_lead = client.post(
            "/api/chat",
            json={"message": "Как оптимизировать процесс онбординга?"},
            headers=lead_headers
        )
        assert res_lead.status_code == 200
        assert "Gemini" in res_lead.json()["reply"]
    finally:
        gemini_service._client = original_client


# --- ADVANCED AI CHAT INTELLIGENCE TESTS ---

def test_chat_intern_technical_kafka_answer(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Как настроить Kafka consumer group?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "Kafka" in reply or "партици" in reply or "consumer" in reply.lower()
    assert len(reply) > 100
    assert "Привет, Арсений! Чем помочь прямо сейчас?" not in reply

def test_chat_intern_technical_binary_search_go(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Как работает бинарный поиск на Go?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "Бинарный поиск" in reply or "Binary" in reply
    assert "package" in reply or "func" in reply or "O(" in reply
    assert "Привет, Арсений! Чем помочь прямо сейчас?" not in reply

def test_chat_intern_prod_incident(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Что делать если упал прод?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "Grafana" in reply or "Sentry" in reply or "Rollback" in reply or "инцидент" in reply.lower()
    assert "прогресс адаптации: 23%" not in reply

def test_chat_intern_goroutine_leak(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Что такое goroutine leak и как его обнаружить?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "горутин" in reply.lower() or "goroutine" in reply.lower()
    assert "pprof" in reply or "Done" in reply or "select" in reply

def test_chat_mentor_arbitrary_coaching_question(client, mentor_headers):
    res = client.post("/api/chat", json={"message": "Как помочь стажеру быстрее освоить Kafka?"}, headers=mentor_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "наставник" in reply.lower() or "арсени" in reply.lower() or "kafka" in reply.lower()
    assert "Привет, Алексей! Чем я могу помочь наставнику:" not in reply

def test_chat_lead_arbitrary_management_question(client, lead_headers):
    res = client.post("/api/chat", json={"message": "Как повысить продуктивность команды и избежать выгорания?"}, headers=lead_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert len(reply) > 100
    assert "Здравствуйте, Екатерина! Чем я могу помочь тимлиду:" not in reply

def test_chat_offtopic_intellectual_answer(client, intern_headers):
    res = client.post("/api/chat", json={"message": "Какое расстояние от Земли до Луны?"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert len(reply) > 60
    assert "Привет, Арсений! Чем помочь прямо сейчас?" not in reply


