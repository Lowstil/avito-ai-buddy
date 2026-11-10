def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to Avito AI-Buddy API" in data["message"]

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["mcp_tools_registered"] == 7

def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "avito_buddy_requests_total" in response.text
    assert "avito_buddy_mentor_hours_saved" in response.text
