import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.absence_service import absence_service
from app.services.checklist_service import checklist_service
from app.services.gamification_service import gamification_service

@pytest.fixture(autouse=True)
def reset_service_state():
    absence_service.reset()
    checklist_service.reset()
    gamification_service.reset()
    yield
    absence_service.reset()
    checklist_service.reset()
    gamification_service.reset()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def intern_headers():
    return {"X-User-Id": "intern_1"}

@pytest.fixture
def mentor_headers():
    return {"X-User-Id": "mentor_1"}

@pytest.fixture
def lead_headers():
    return {"X-User-Id": "lead_1"}
