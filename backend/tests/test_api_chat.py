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
