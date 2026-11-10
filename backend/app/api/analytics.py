from datetime import datetime
from fastapi import APIRouter, Depends
from app.core.rbac import get_current_user
from app.models.schemas import AnalyticsEvent, UserProfile

router = APIRouter(prefix="/api/analytics", tags=["Clickstream & Telemetry"])

# In-memory event log
EVENT_STORE: list[AnalyticsEvent] = [
    AnalyticsEvent(
        event_name="onboarding_started",
        user_id="intern_1",
        properties={"track": "Backend", "team": "Order Management"},
        timestamp=datetime.now()
    )
]

@router.post("/event")
def track_event(
    event: AnalyticsEvent,
    user: UserProfile = Depends(get_current_user)
):
    event.user_id = user.user_id
    EVENT_STORE.append(event)
    return {"status": "recorded", "total_events": len(EVENT_STORE)}

@router.get("/summary")
def get_analytics_summary():
    return {
        "total_events": len(EVENT_STORE),
        "mentor_hours_saved_estimated": 22.5,
        "queries_resolved_by_ai_pct": 78.4,
        "checklist_completion_rate": "81%",
        "recent_events": [e.model_dump() for e in EVENT_STORE[-10:]]
    }
