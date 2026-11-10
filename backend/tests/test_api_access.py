def test_list_accesses(client, intern_headers):
    res = client.get("/api/access", headers=intern_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 4
    system_keys = [it["system_key"] for it in items]
    assert "vpn_corp" in system_keys
    assert "gitlab_avito" in system_keys

def test_request_access(client, intern_headers):
    payload = {
        "system_key": "spt_cluster",
        "justification": "Тестирование микросервиса доставки"
    }
    res = client.post("/api/access", json=payload, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["system_key"] == "spt_cluster"
    assert data["status"] == "requested"

def test_grant_access(client, intern_headers):
    res = client.post("/api/access/spt_cluster/grant", headers=intern_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "active"
