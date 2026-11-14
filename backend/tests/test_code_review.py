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


def test_code_review_playground_clean_zbp_presets_score_100(client, intern_headers):
    sample_clean_go = """package delivery

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"
)

// ProcessDeliveryOrders processes pending orders following Avito standards
func ProcessDeliveryOrders(ctx context.Context, db *sql.DB, limit int) error {
	// ✅ Safe context timeout
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	// ✅ Safe query with explicit LIMIT
	rows, err := db.QueryContext(ctx, "SELECT id, user_id, status FROM delivery_orders WHERE status = 'pending' LIMIT $1", limit)
	if err != nil {
		// ✅ Proper error wrapping with %w for Sentry tracing
		return fmt.Errorf("failed to fetch delivery orders: %w", err)
	}
	defer rows.Close()

	// ✅ Explicit client timeout to prevent pod socket starvation
	client := &http.Client{Timeout: 2 * time.Second}

	for rows.Next() {
		var id, status string
		var userID int64
		if err := rows.Scan(&id, &userID, &status); err != nil {
			return fmt.Errorf("failed to scan order row: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://carrier-api.internal/notify?order="+id, nil)
		if err != nil {
			return fmt.Errorf("failed to build carrier request: %w", err)
		}

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("carrier notification error: %w", err)
		}
		resp.Body.Close()
	}

	return rows.Err()
}"""
    res_go = client.post(
        "/api/code-review/analyze",
        json={"code": sample_clean_go, "language": "go"},
        headers=intern_headers,
    )
    assert res_go.status_code == 200
    data_go = res_go.json()
    assert data_go["score"] == 100
    assert data_go["status"] == "passed"
    assert data_go["zbp_compliant"] is True
    assert len(data_go["issues"]) == 0

    sample_clean_py = '''"""Модуль доставки заказов по стандартам надежности AvitoTech"""
import logging
import requests

logger = logging.getLogger(__name__)

def fetch_delivery_batch(user_id: int) -> list:
    """Безопасный запрос с явным таймаутом сокета и типизированной обработкой"""
    try:
        # ✅ Обязательный таймаут (connect: 1s, read: 3s)
        resp = requests.get(
            f"http://delivery-api.internal/batch?user={user_id}",
            timeout=(1.0, 3.0)
        )
        resp.raise_for_status()
        return resp.json().get("items", [])
    except (requests.RequestException, ValueError) as err:
        logger.error("Ошибка при получении пачки доставки для user %s: %s", user_id, err)
        return []
'''
    res_py = client.post(
        "/api/code-review/analyze",
        json={"code": sample_clean_py, "language": "python"},
        headers=intern_headers,
    )
    assert res_py.status_code == 200
    data_py = res_py.json()
    assert data_py["score"] == 100
    assert data_py["status"] == "passed"
    assert data_py["zbp_compliant"] is True
    assert len(data_py["issues"]) == 0

