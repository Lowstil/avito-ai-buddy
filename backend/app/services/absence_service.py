import uuid
from datetime import datetime
from typing import Optional
from app.models.schemas import AbsenceRequest, AbsenceRequestCreate

class AbsenceService:
    def __init__(self):
        self.reset()

    def reset(self):
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
        # 1. Validate date format YYYY-MM-DD
        try:
            start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise ValueError(f"Неверный формат start_date: '{payload.start_date}'. Требуется формат YYYY-MM-DD.")

        end_date_str = payload.end_date if payload.end_date else payload.start_date
        try:
            end_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise ValueError(f"Неверный формат end_date: '{end_date_str}'. Требуется формат YYYY-MM-DD.")

        # 2. Validate start_date <= end_date
        if start_dt > end_dt:
            raise ValueError(f"Дата начала ({payload.start_date}) не может быть позже даты окончания ({end_date_str}).")

        # 3. Calculate requested days per calendar month
        from collections import defaultdict
        from datetime import timedelta

        requested_per_month: dict[tuple[int, int], int] = defaultdict(int)
        curr = start_dt
        while curr <= end_dt:
            requested_per_month[(curr.year, curr.month)] += 1
            curr += timedelta(days=1)

        # 4. Enforce 2 days per calendar month limit for each month in the range
        for (year, month), req_days in requested_per_month.items():
            used_days = 0
            for r in self._requests.values():
                if r.user_id == user_id and r.status != "rejected":
                    try:
                        r_start = datetime.strptime(r.start_date, "%Y-%m-%d").date()
                        r_end = datetime.strptime(r.end_date, "%Y-%m-%d").date()
                        r_curr = r_start
                        while r_curr <= r_end:
                            if (r_curr.year, r_curr.month) == (year, month):
                                used_days += 1
                            r_curr += timedelta(days=1)
                    except Exception:
                        pass

            if used_days + req_days > 2:
                raise ValueError(
                    f"Превышен лимит отсутствий: максимум 2 дня в месяц по регламенту Авито. "
                    f"В месяце {month:02d}.{year} уже использовано/запрошено {used_days} дн., "
                    f"запрашивается ещё {req_days} дн."
                )

        new_id = f"ABS-2026-{len(self._requests) + 1:03d}"
        req = AbsenceRequest(
            id=new_id,
            user_id=user_id,
            user_name=user_name,
            absence_type=payload.absence_type,
            start_date=payload.start_date,
            end_date=end_date_str,
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
