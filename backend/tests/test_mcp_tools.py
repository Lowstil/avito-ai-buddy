from app.mcp.tools import mcp_tool_registry

def test_mcp_absence_tool():
    res = mcp_tool_registry.execute(
        "request_absence",
        user_id="intern_1",
        user_name="Арсений Новиков",
        start_date="2026-11-22",
        reason="Учебная конференция"
    )
    assert res["status"] == "success"
    assert "request" in res
    assert res["request"]["status"] == "pending_approval"

def test_mcp_query_absence_status():
    res = mcp_tool_registry.execute("query_absence_status", user_id="intern_1")
    assert res["status"] == "success"
    assert res["count"] >= 1

def test_mcp_request_access():
    res = mcp_tool_registry.execute("request_access", user_id="intern_1", system_key="grafana_metrics")
    assert res["status"] == "success"
    assert res["access_item"]["status"] == "requested"

def test_mcp_checklist_tools():
    # Get status
    res = mcp_tool_registry.execute("get_checklist_status", user_id="intern_1")
    assert res["status"] == "success"
    assert "summary" in res

    # Update task
    update_res = mcp_tool_registry.execute(
        "update_checklist_task",
        user_id="intern_1",
        task_id="task_be_1",
        status="completed"
    )
    assert update_res["status"] == "success"
    assert update_res["task"]["status"] == "completed"

def test_mcp_playbook_search():
    res = mcp_tool_registry.execute("search_playbook", query="Code Review")
    assert res["status"] == "success"
    assert len(res["results"]) > 0
    assert "Code Review" in res["results"][0]["title"]

def test_mcp_1on1_summary():
    res = mcp_tool_registry.execute("generate_1on1_summary", user_id="intern_1")
    assert res["status"] == "success"
    assert len(res["summary_points"]) >= 3

def test_mcp_unknown_tool():
    res = mcp_tool_registry.execute("non_existent_tool_123")
    assert "error" in res
