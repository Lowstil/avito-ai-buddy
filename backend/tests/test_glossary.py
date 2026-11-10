def test_glossary_get_terms(client, intern_headers):
    res = client.get("/api/glossary", headers=intern_headers)
    assert res.status_code == 200
    terms = res.json()
    assert len(terms) >= 10
    assert any(t["term"].startswith("SPT") for t in terms)
    assert any("ZBP" in t["term"] for t in terms)

def test_glossary_filter_by_category(client, intern_headers):
    res = client.get("/api/glossary?category=Инфраструктура %26 Стенды", headers=intern_headers)
    assert res.status_code == 200
    terms = res.json()
    assert len(terms) > 0
    assert all(t["category"] == "Инфраструктура & Стенды" for t in terms)

def test_glossary_search(client, intern_headers):
    res = client.get("/api/glossary?search=отгул", headers=intern_headers)
    assert res.status_code == 200
    terms = res.json()
    assert any("Day-off" in t["term"] for t in terms)

def test_glossary_categories_list(client, intern_headers):
    res = client.get("/api/glossary/categories", headers=intern_headers)
    assert res.status_code == 200
    cats = res.json()
    assert "Все" in cats
    assert "Стандарты разработки" in cats
