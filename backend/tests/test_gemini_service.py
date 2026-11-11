from unittest.mock import MagicMock
from app.services.gemini_service import GeminiService
from app.models.schemas import CodeReviewIssue

def test_gemini_service_unavailable_by_default():
    service = GeminiService()
    # When no key is set
    service.api_key = ""
    service._client = None
    assert service.is_available() is False
    assert service.refactor_code("code", "go", []) is None
    assert service.generate_chat_reply("intern", "Арсений", "message") is None

def test_gemini_service_refactor_with_client():
    service = GeminiService()
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "```go\npackage main\n\nfunc Clean() {}\n```"
    mock_client.models.generate_content.return_value = mock_response
    service._client = mock_client

    assert service.is_available() is True
    issues = [
        CodeReviewIssue(
            id="i1",
            rule_id="AVITO-GO-001",
            rule_name="Проброс контекста",
            severity="blocker",
            recommendation="Fix it",
            message="Missing ctx"
        )
    ]
    refactored = service.refactor_code("package main\nfunc Clean() {}", "go", issues)
    assert refactored == "package main\n\nfunc Clean() {}"

def test_gemini_service_chat_replies():
    service = GeminiService()
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Совет наставника: проверьте таймауты."
    mock_client.models.generate_content.return_value = mock_response
    service._client = mock_client

    # Test mentor role
    r1 = service.generate_chat_reply(
        user_role="mentor",
        user_name="Алексей",
        message="План 1:1",
        history=[{"sender": "user", "content": "Привет"}]
    )
    assert r1 == "Совет наставника: проверьте таймауты."

    # Test lead role
    r2 = service.generate_chat_reply(
        user_role="lead",
        user_name="Дмитрий",
        message="Метрики адаптации"
    )
    assert r2 == "Совет наставника: проверьте таймауты."

    # Test intern role
    r3 = service.generate_chat_reply(
        user_role="intern",
        user_name="Арсений",
        message="Что такое ZBP?"
    )
    assert r3 == "Совет наставника: проверьте таймауты."
