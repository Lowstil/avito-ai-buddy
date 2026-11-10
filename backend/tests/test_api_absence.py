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
