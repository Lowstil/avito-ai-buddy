from fastapi import APIRouter, Depends
from app.core.rbac import get_current_user, USERS_DATABASE
from app.models.schemas import UserProfile

router = APIRouter(prefix="/api/auth", tags=["Auth & RBAC"])

@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(get_current_user)):
    return user

@router.get("/users", response_model=list[UserProfile])
def list_available_users():
    return list(USERS_DATABASE.values())
