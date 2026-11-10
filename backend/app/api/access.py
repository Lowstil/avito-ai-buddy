from fastapi import APIRouter, Depends, HTTPException
from app.core.rbac import get_current_user, UserRole
from app.models.schemas import AccessItem, AccessRequestCreate, UserProfile
from app.services.access_service import access_service

router = APIRouter(prefix="/api/access", tags=["ServiceDesk Access"])

@router.get("", response_model=list[AccessItem])
def list_user_access(user: UserProfile = Depends(get_current_user)):
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
    user: UserProfile = Depends(get_current_user)
):
    # Any mentor/lead or automated system can grant
    item = access_service.grant_access(user.user_id, system_key)
    if not item:
        raise HTTPException(status_code=404, detail="Система не найдена")
    return item
