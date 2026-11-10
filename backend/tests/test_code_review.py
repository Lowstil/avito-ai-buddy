def test_code_review_clean_go_code(client, intern_headers):
    clean_code = """
package main

import (
    "context"
    "fmt"
    "time"
)

func FetchOrder(ctx context.Context, id string) error {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()
    if id == "" {
        return fmt.Errorf("invalid order id: %w", ErrNotFound)
    }
    return nil
}
"""
    res = client.post("/api/code-review/analyze", json={"code": clean_code, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "passed"
    assert data["score"] == 100
    assert data["zbp_compliant"] is True

def test_code_review_detects_blockers(client, intern_headers):
    bad_code = """
package main

import "fmt"

func ProcessData() {
    // Missing ctx, has panic, unbounded select
    db.Query("SELECT * FROM orders")
    panic("something bad happened")
}
"""
    res = client.post("/api/code-review/analyze", json={"code": bad_code, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["zbp_compliant"] is False
    assert len(data["issues"]) >= 2
    rule_ids = [i["rule_id"] for i in data["issues"]]
    assert "AVITO-GO-001" in rule_ids  # Missing context
    assert "AVITO-ZBP-001" in rule_ids # Panic
    assert "AVITO-SQL-001" in rule_ids # SELECT without LIMIT

def test_code_review_warning_logging(client, intern_headers):
    warning_code = """
package main

import "fmt"

func LogSomething() {
    fmt.Println("Debug message")
}
"""
    res = client.post("/api/code-review/analyze", json={"code": warning_code, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "changes_requested"
    assert any(i["rule_id"] == "AVITO-LOG-001" for i in data["issues"])
