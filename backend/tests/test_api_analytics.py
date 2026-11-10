def test_track_event(client, intern_headers):
    payload = {
        "event_name": "task_checked",
        "user_id": "intern_1",
        "properties": {"task_id": "task_be_1"}
    }
    res = client.post("/api/analytics/event", json=payload, headers=intern_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "recorded"

def test_get_analytics_summary(client):
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "mentor_hours_saved_estimated" in data
    assert "queries_resolved_by_ai_pct" in data
