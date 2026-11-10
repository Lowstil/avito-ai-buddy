import pytest
from fastapi.testclient import TestClient
from app.main import app

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
