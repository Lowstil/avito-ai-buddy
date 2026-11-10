import uuid
from datetime import datetime
from typing import Optional
from app.models.schemas import AbsenceRequest, AbsenceRequestCreate

class AbsenceService:
    def __init__(self):
        # Store requests keyed by id
        self._requests: dict[str, AbsenceRequest] = {
            "ABS-2026-001": AbsenceRequest(
                id="ABS-2026-001",
                user_id="intern_1",
                user_name="Арсений Новиков",
                absence_type="day_off",
                start_date="2026-10-15",
                end_date="2026-10-15",
                reason="Оформление документов в вузе",
                status="approved",
                created_at=datetime(2026, 10, 10, 11, 0),
                approved_by="Алексей Смирнов",
                approved_at=datetime(2026, 10, 11, 9, 30)
            )
        }

    def get_user_absences(self, user_id: str) -> list[AbsenceRequest]:
        return [r for r in self._requests.values() if r.user_id == user_id]

    def get_all_absences(self) -> list[AbsenceRequest]:
        return list(self._requests.values())

    def get_absence_by_id(self, absence_id: str) -> Optional[AbsenceRequest]:
        return self._requests.get(absence_id)

    def create_absence(self, user_id: str, user_name: str, payload: AbsenceRequestCreate) -> AbsenceRequest:
        new_id = f"ABS-2026-{len(self._requests) + 1:03d}"
        end_date = payload.end_date if payload.end_date else payload.start_date
        
        req = AbsenceRequest(
            id=new_id,
            user_id=user_id,
            user_name=user_name,
            absence_type=payload.absence_type,
            start_date=payload.start_date,
            end_date=end_date,
            reason=payload.reason,
            status="pending_approval",
            created_at=datetime.now()
        )
        self._requests[new_id] = req
        return req

    def update_status(self, absence_id: str, status: str, approver_name: str, rejection_reason: Optional[str] = None) -> Optional[AbsenceRequest]:
        req = self._requests.get(absence_id)
        if req:
            req.status = status
            req.approved_by = approver_name
            req.approved_at = datetime.now()
            if status == "rejected" and rejection_reason:
                req.rejection_reason = rejection_reason
            return req
        return None

absence_service = AbsenceService()
