from typing import Optional
from fastapi import Header, HTTPException, status
from app.models.schemas import UserProfile, UserRole

# Synthetic Predefined Users with guaranteed local high-res avatars
USERS_DATABASE: dict[str, UserProfile] = {
    "intern_1": UserProfile(
        user_id="intern_1",
        name="Арсений Новиков",
        email="a.novikov@avito.ru.synthetic",
        role=UserRole.INTERN,
        track="Backend",
        team="Order Management & Delivery Core",
        mentor_id="mentor_1",
        mentor_name="Алексей Смирнов",
        avatar_url="/avatars/arseniy.svg"
    ),
    "mentor_1": UserProfile(
        user_id="mentor_1",
        name="Алексей Смирнов",
        email="a.smirnov@avito.ru.synthetic",
        role=UserRole.MENTOR,
        track="Backend",
        team="Order Management & Delivery Core",
        mentor_id=None,
        mentor_name=None,
        avatar_url="/avatars/alexey.svg"
    ),
    "lead_1": UserProfile(
        user_id="lead_1",
        name="Екатерина Соколова",
        email="e.sokolova@avito.ru.synthetic",
        role=UserRole.LEAD,
        track="Backend",
        team="Order Management & Delivery Core",
        mentor_id=None,
        mentor_name=None,
        avatar_url="/avatars/ekaterina.svg"
    )
}

def get_current_user(x_user_id: Optional[str] = Header(default="intern_1")) -> UserProfile:
    """Dependency to retrieve the active user from header, defaulting to intern_1."""
    if not x_user_id or x_user_id not in USERS_DATABASE:
        x_user_id = "intern_1"
    return USERS_DATABASE[x_user_id]

def require_role(allowed_roles: list[str]):
    """Decorator / dependency check for specific role access."""
    def role_checker(user: UserProfile = get_current_user):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Доступ запрещен для роли {user.role}. Требуется одна из: {allowed_roles}"
            )
        return user
    return role_checker
