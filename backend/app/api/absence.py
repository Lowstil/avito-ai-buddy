from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.rbac import get_current_user, UserRole
from app.models.schemas import AbsenceRequest, AbsenceRequestCreate, AbsenceRejectPayload, UserProfile
from app.services.absence_service import absence_service

router = APIRouter(prefix="/api/absences", tags=["Corporate Absence Service"])

@router.get("", response_model=list[AbsenceRequest])
def list_absences(user: UserProfile = Depends(get_current_user)):
    # Interns see their own; Mentors and Leads see all
    if user.role == UserRole.INTERN:
        return absence_service.get_user_absences(user.user_id)
    return absence_service.get_all_absences()

@router.post("", response_model=AbsenceRequest, status_code=status.HTTP_201_CREATED)
def create_absence(
    payload: AbsenceRequestCreate,
    user: UserProfile = Depends(get_current_user)
):
    try:
        return absence_service.create_absence(
            user_id=user.user_id,
            user_name=user.name,
            payload=payload
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{absence_id}/approve", response_model=AbsenceRequest)
def approve_absence(
    absence_id: str,
    user: UserProfile = Depends(get_current_user)
):
    if user.role not in [UserRole.MENTOR, UserRole.LEAD]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только наставник или руководитель может утверждать заявки на отсутствие."
        )
    req = absence_service.update_status(absence_id, "approved", approver_name=user.name)
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return req

@router.post("/{absence_id}/reject", response_model=AbsenceRequest)
def reject_absence(
    absence_id: str,
    payload: Optional[AbsenceRejectPayload] = None,
    user: UserProfile = Depends(get_current_user)
):
    if user.role not in [UserRole.MENTOR, UserRole.LEAD]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только наставник или руководитель может отклонять заявки на отсутствие."
        )
    reason_text = payload.reason if payload else "Отклонено наставником"
    req = absence_service.update_status(absence_id, "rejected", approver_name=user.name, rejection_reason=reason_text)
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return req
