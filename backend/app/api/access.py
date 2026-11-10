from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.rbac import get_current_user, UserRole
from app.models.schemas import AccessItem, AccessRequestCreate, UserProfile
from app.services.access_service import access_service

router = APIRouter(prefix="/api/access", tags=["ServiceDesk Access"])

@router.get("", response_model=list[AccessItem])
def list_user_access(
    target_user_id: Optional[str] = None,
    user: UserProfile = Depends(get_current_user)
):
    # In intern onboarding, mentors and leads view & approve the intern's accesses (intern_1)
    if user.role in [UserRole.MENTOR, UserRole.LEAD]:
        target = target_user_id or "intern_1"
        return access_service.get_access_list(target)
    return access_service.get_access_list(user.user_id)

@router.post("", response_model=AccessItem)
def request_system_access(
    payload: AccessRequestCreate,
    user: UserProfile = Depends(get_current_user)
):
    return access_service.request_access(user.user_id, payload)

@router.post("/{system_key}/grant", response_model=AccessItem)
def grant_system_access(
    system_key: str,
    target_user_id: Optional[str] = "intern_1",
    user: UserProfile = Depends(get_current_user)
):
    if user.role not in [UserRole.MENTOR, UserRole.LEAD]:
        raise HTTPException(
            status_code=403,
            detail="Стажёр не может сам себе подтверждать выдачу доступов. Требуется подтверждение наставника или тимлида."
        )
    target = target_user_id or "intern_1"
    item = access_service.grant_access(target, system_key)
    if not item:
        raise HTTPException(status_code=404, detail="Система не найдена")
    return item
