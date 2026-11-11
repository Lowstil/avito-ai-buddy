def test_list_absences_intern(client, intern_headers):
    res = client.get("/api/absences", headers=intern_headers)
    assert res.status_code == 200
    absences = res.json()
    assert len(absences) >= 1
    assert absences[0]["user_id"] == "intern_1"

def test_create_absence_request(client, intern_headers):
    payload = {
        "start_date": "2026-11-25",
        "end_date": "2026-11-25",
        "absence_type": "day_off",
        "reason": "Сдача экзамена в университете"
    }
    res = client.post("/api/absences", json=payload, headers=intern_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["id"].startswith("ABS-2026-")
    assert data["status"] == "pending_approval"
    assert data["reason"] == "Сдача экзамена в университете"

def test_approve_absence_rbac(client, intern_headers, mentor_headers):
    # Intern creates request
    payload = {
        "start_date": "2026-11-28",
        "end_date": "2026-11-28",
        "absence_type": "day_off",
        "reason": "Визит к врачу"
    }
    res = client.post("/api/absences", json=payload, headers=intern_headers)
    req_id = res.json()["id"]

    # Intern tries to self-approve -> 403 Forbidden!
    forbidden_res = client.post(f"/api/absences/{req_id}/approve", headers=intern_headers)
    assert forbidden_res.status_code == 403

    # Mentor approves -> 200 OK!
    approved_res = client.post(f"/api/absences/{req_id}/approve", headers=mentor_headers)
    assert approved_res.status_code == 200
    assert approved_res.json()["status"] == "approved"
    assert approved_res.json()["approved_by"] == "Алексей Смирнов"

def test_reject_absence(client, mentor_headers):
    # Create and reject
    payload = {
        "start_date": "2026-12-01",
        "end_date": "2026-12-01",
        "absence_type": "day_off",
        "reason": "Отдых"
    }
    res = client.post("/api/absences", json=payload, headers=mentor_headers)
    req_id = res.json()["id"]

    reject_res = client.post(f"/api/absences/{req_id}/reject", headers=mentor_headers)
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

def test_absence_limit_exceeded(client, intern_headers):
    # Request 2 days in November (allowed)
    r1 = client.post("/api/absences", json={
        "start_date": "2026-11-05",
        "end_date": "2026-11-06",
        "absence_type": "day_off",
        "reason": "Дела в вузе"
    }, headers=intern_headers)
    assert r1.status_code == 201

    # Attempt 3rd day in November -> 400 Bad Request
    r2 = client.post("/api/absences", json={
        "start_date": "2026-11-07",
        "end_date": "2026-11-07",
        "absence_type": "day_off",
        "reason": "Ещё один день"
    }, headers=intern_headers)
    assert r2.status_code == 400
    assert "Превышен лимит" in r2.json()["detail"]

def test_absence_invalid_date_format(client, intern_headers):
    r = client.post("/api/absences", json={
        "start_date": "not-a-date",
        "end_date": "2026-11-20",
        "reason": "Тест"
    }, headers=intern_headers)
    assert r.status_code == 400
    assert "Неверный формат" in r.json()["detail"]

def test_absence_start_after_end(client, intern_headers):
    r = client.post("/api/absences", json={
        "start_date": "2026-11-25",
        "end_date": "2026-11-20",
        "reason": "Тест"
    }, headers=intern_headers)
    assert r.status_code == 400
    assert "не может быть позже" in r.json()["detail"]

def test_absence_multi_month_limit(client, intern_headers):
    # Request spanning across month boundaries (1 day in Nov, 1 day in Dec = 2 days total)
    r1 = client.post("/api/absences", json={
        "start_date": "2026-11-30",
        "end_date": "2026-12-01",
        "absence_type": "day_off",
        "reason": "Переход месяца"
    }, headers=intern_headers)
    assert r1.status_code == 201

    # Now request 2 more days in December (1 day already used in Dec + 2 = 3 > 2) -> 400
    r2 = client.post("/api/absences", json={
        "start_date": "2026-12-05",
        "end_date": "2026-12-06",
        "absence_type": "day_off",
        "reason": "Еще отгул в декабре"
    }, headers=intern_headers)
    assert r2.status_code == 400
    assert "Превышен лимит" in r2.json()["detail"]
