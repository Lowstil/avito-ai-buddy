from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.rbac import get_current_user
from app.models.schemas import ChecklistTask, ChecklistSummary, ChecklistNotePayload, UserProfile
from app.services.checklist_service import checklist_service

router = APIRouter(prefix="/api/checklist", tags=["Checklist"])

@router.get("", response_model=list[ChecklistTask])
def get_user_checklist(
    period: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    user: UserProfile = Depends(get_current_user)
):
    return checklist_service.get_tasks(user.user_id, period=period, category=category)

@router.get("/summary", response_model=ChecklistSummary)
def get_checklist_summary(user: UserProfile = Depends(get_current_user)):
    return checklist_service.get_summary(user.user_id)

@router.patch("/{task_id}/status", response_model=ChecklistTask)
def update_task_status(
    task_id: str,
    status: str = Query(..., pattern="^(todo|in_progress|completed)$"),
    user: UserProfile = Depends(get_current_user)
):
    task = checklist_service.update_task_status(user.user_id, task_id, status)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}/note", response_model=ChecklistTask)
def update_task_note(
    task_id: str,
    payload: Optional[ChecklistNotePayload] = None,
    note: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    user: UserProfile = Depends(get_current_user)
):
    note_val = ""
    if payload:
        note_val = payload.notes if payload.notes is not None else (payload.note or "")
    elif notes is not None:
        note_val = notes
    elif note is not None:
        note_val = note

    task = checklist_service.update_task_note(user.user_id, task_id, note_val)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
