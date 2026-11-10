def test_get_me_intern(client, intern_headers):
    res = client.get("/api/auth/me", headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "intern_1"
    assert data["role"] == "intern"
    assert data["name"] == "Арсений Новиков"

def test_get_me_mentor(client, mentor_headers):
    res = client.get("/api/auth/me", headers=mentor_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mentor_1"
    assert data["role"] == "mentor"

def test_list_users(client):
    res = client.get("/api/auth/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 3
    user_ids = [u["user_id"] for u in users]
    assert "intern_1" in user_ids
    assert "mentor_1" in user_ids
    assert "lead_1" in user_ids
