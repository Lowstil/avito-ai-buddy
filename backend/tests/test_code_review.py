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

def test_code_review_ddd_blocked(client, intern_headers):
    # ddd must be BLOCKED with score 0 in auto, go, and python
    for lang in ["auto", "go", "python"]:
        res = client.post("/api/code-review/analyze", json={"code": "ddd", "language": lang}, headers=intern_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "blocked"
        assert data["score"] == 0
        assert data["zbp_compliant"] is False
        assert len(data["issues"]) > 0

def test_code_review_empty_code(client, intern_headers):
    res = client.post("/api/code-review/analyze", json={"code": "   ", "language": "auto"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0

def test_code_review_python_syntax_error(client, intern_headers):
    res = client.post("/api/code-review/analyze", json={"code": "def broken(:", "language": "python"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0
    assert any("SYNTAX" in i["rule_id"] for i in data["issues"])

def test_code_review_go_unbalanced_braces(client, intern_headers):
    unbalanced = """
package main

func Unclosed() {
    if true {
        return
}
"""
    res = client.post("/api/code-review/analyze", json={"code": unbalanced, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0

def test_code_review_python_zbp_rules(client, intern_headers):
    py_code = """
import requests
import time

async def worker():
    try:
        resp = requests.get("https://example.com/api")
        time.sleep(2)
        print("Done:", resp.text)
        query = "SELECT id, name FROM users"
    except:
        pass
"""
    res = client.post("/api/code-review/analyze", json={"code": py_code, "language": "python"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    rule_ids = [i["rule_id"] for i in data["issues"]]
    assert "AVITO-PY-001" in rule_ids
    assert "AVITO-HTTP-001" in rule_ids
    assert "AVITO-PY-ASYNC-001" in rule_ids
    assert "AVITO-SQL-001" in rule_ids
    assert "AVITO-LOG-001" in rule_ids
    assert data["full_refactored_code"] is not None

def test_code_review_go_advanced_rules(client, intern_headers):
    adv_go = """
package main

import (
    "database/sql"
    "net/http"
)

func DoAdvanced(db *sql.DB) error {
    tx, _ := db.Begin()
    client := &http.Client{}
    _ = client.Get("http://example.com")
    var id int
    _ = db.QueryRow("SELECT id FROM orders").Scan(&id)
    return nil
}
"""
    res = client.post("/api/code-review/analyze", json={"code": adv_go, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    rule_ids = [i["rule_id"] for i in data["issues"]]
    assert "AVITO-SQL-002" in rule_ids  # Missing Rollback
    assert "AVITO-HTTP-001" in rule_ids # Client timeout
    assert data["full_refactored_code"] is not None

def test_code_review_go_bare_statement_in_function_blocked(client, intern_headers):
    # Go code with bare token inside function must fail compilation
    code = """
package main

func main() {
    ddd
}
"""
    res = client.post("/api/code-review/analyze", json={"code": code, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0
    assert any("COMPILER" in i["rule_id"] for i in data["issues"])

def test_code_review_go_non_declaration_top_level_blocked(client, intern_headers):
    # Go code with top-level bare token outside function
    code = """
package main

ddd
"""
    res = client.post("/api/code-review/analyze", json={"code": code, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0
    assert any("COMPILER" in i["rule_id"] for i in data["issues"])

def test_code_review_python_bare_statement_in_function_blocked(client, intern_headers):
    # Python code with uninitialized bare token inside function
    code = "def foo():\n    ddd"
    res = client.post("/api/code-review/analyze", json={"code": code, "language": "python"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0
    assert any("SEMANTICS" in i["rule_id"] or "SYNTAX" in i["rule_id"] for i in data["issues"])

def test_code_review_python_top_level_bare_identifier_blocked(client, intern_headers):
    # Python code with assignment followed by bare undefined identifier
    code = "x = 1\nddd"
    res = client.post("/api/code-review/analyze", json={"code": code, "language": "python"}, headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["score"] == 0
    assert any("SEMANTICS" in i["rule_id"] for i in data["issues"])
