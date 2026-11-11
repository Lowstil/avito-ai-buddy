def test_get_checklist_tasks(client, intern_headers):
    res = client.get("/api/checklist", headers=intern_headers)
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) > 5
    # Check week 1 and backend tasks
    assert any("Agile" in t["title"] for t in tasks)
    assert any("Zero Bug Policy" in t["title"] for t in tasks)

def test_get_checklist_summary(client, intern_headers):
    res = client.get("/api/checklist/summary", headers=intern_headers)
    assert res.status_code == 200
    summary = res.json()
    assert "total_tasks" in summary
    assert "completed_tasks" in summary
    assert "progress_percentage" in summary
    assert summary["total_tasks"] > 0

def test_update_task_status(client, intern_headers):
    # Update task status to completed
    res = client.patch("/api/checklist/task_be_4/status?status=completed", headers=intern_headers)
    assert res.status_code == 200
    task = res.json()
    assert task["id"] == "task_be_4"
    assert task["status"] == "completed"
    assert task["completed_at"] is not None

def test_update_nonexistent_task(client, intern_headers):
    res = client.patch("/api/checklist/non_existent_123/status?status=completed", headers=intern_headers)
    assert res.status_code == 404

def test_update_task_note_json(client, intern_headers):
    res = client.patch(
        "/api/checklist/task_be_1/note",
        json={"notes": "Обсудили с наставником на 1:1"},
        headers=intern_headers
    )
    assert res.status_code == 200
    task = res.json()
    assert task["id"] == "task_be_1"
    assert task["notes"] == "Обсудили с наставником на 1:1"

def test_update_task_note_query(client, intern_headers):
    res = client.patch(
        "/api/checklist/task_be_2/note?note=Стенд+настроен",
        headers=intern_headers
    )
    assert res.status_code == 200
    task = res.json()
    assert task["id"] == "task_be_2"
    assert "Стенд настроен" in task["notes"]

def test_update_note_nonexistent_task(client, intern_headers):
    res = client.patch(
        "/api/checklist/non_existent_404/note",
        json={"notes": "Не должно найтись"},
        headers=intern_headers
    )
    assert res.status_code == 404
