import pytest
from fastapi import HTTPException
from app.core.rbac import require_role, USERS_DATABASE, get_current_user
from app.models.schemas import UserRole

def test_rbac_require_role_success():
    checker = require_role([UserRole.LEAD])
    lead_user = USERS_DATABASE["lead_1"]
    res = checker(lead_user)
    assert res.user_id == "lead_1"

def test_rbac_require_role_forbidden():
    checker = require_role([UserRole.LEAD])
    intern_user = USERS_DATABASE["intern_1"]
    with pytest.raises(HTTPException) as exc_info:
        checker(intern_user)
    assert exc_info.value.status_code == 403

def test_get_current_user_fallback():
    # If invalid or missing user_id provided
    u = get_current_user("unknown_user_999")
    assert u.user_id == "intern_1"
