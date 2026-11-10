from datetime import date, datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, Field

# User & Auth
class UserRole(str):
    INTERN = "intern"
    MENTOR = "mentor"
    LEAD = "lead"
    HR_BP = "hr_bp"

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    track: str = "Backend"
    team: str = "Order Management & Delivery Core"
    mentor_id: Optional[str] = None
    mentor_name: Optional[str] = None
    avatar_url: Optional[str] = None

# Checklist
class ChecklistTask(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    period: str  # "week_1", "week_2", "month_1", "month_2", "equator", "final"
    period_title: str
    category: str = "General"  # "General" or "Backend"
    status: Literal["todo", "in_progress", "completed"] = "todo"
    completed_at: Optional[datetime] = None
    priority: Literal["low", "medium", "high"] = "medium"
    resource_link: Optional[str] = None

class ChecklistSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    progress_percentage: int
    current_period: str
    next_recommended_task: Optional[ChecklistTask] = None

# Absence
class AbsenceRequestCreate(BaseModel):
    start_date: str
    end_date: Optional[str] = None
    absence_type: Literal["day_off", "study_leave", "sick_leave"] = "day_off"
    reason: str
    comment: Optional[str] = None

class AbsenceRequest(BaseModel):
    id: str
    user_id: str
    user_name: str
    absence_type: str
    start_date: str
    end_date: str
    reason: str
    status: Literal["pending_approval", "approved", "rejected"] = "pending_approval"
    created_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

class AbsenceRejectPayload(BaseModel):
    reason: str = Field(..., description="Причина отклонения заявки на отгул")

# Access Request
class AccessRequestCreate(BaseModel):
    system_key: str
    justification: str

class AccessItem(BaseModel):
    id: str
    user_id: str
    system_key: str
    system_name: str
    description: str
    status: Literal["active", "requested", "not_requested"] = "not_requested"
    requested_at: Optional[datetime] = None
    granted_at: Optional[datetime] = None

# Chat & Agent
class ChatMessage(BaseModel):
    id: str
    sender: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    action_type: Optional[str] = None  # e.g., "absence_created", "checklist_updated", "access_granted"
    action_data: Optional[dict[str, Any]] = None
    suggested_chips: Optional[list[str]] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    action_type: Optional[str] = None
    action_payload: Optional[dict[str, Any]] = None
    suggested_chips: list[str] = []
    sources: list[str] = []

# Analytics Event
class AnalyticsEvent(BaseModel):
    event_name: str
    user_id: str
    properties: dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.now)

# --- Feature 1: Pre-flight Code Review ---
class CodeReviewRequest(BaseModel):
    code: str
    language: Literal["go", "python", "sql", "auto"] = "go"
    service_context: Optional[str] = "Delivery Core"

class CodeReviewIssue(BaseModel):
    id: str
    rule_id: str
    rule_name: str
    severity: Literal["blocker", "warning", "info"]
    line_number: Optional[int] = None
    snippet: Optional[str] = None
    message: str
    impact: Optional[str] = None
    recommendation: str
    suggested_diff: Optional[str] = None
    full_explanation: Optional[str] = None

class CodeReviewResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    status: Literal["passed", "changes_requested", "blocked"]
    summary: str
    issues: list[CodeReviewIssue] = []
    checked_rules_count: int = 10
    zbp_compliant: bool = True
    mentor_notes: str = ""
    full_refactored_code: Optional[str] = None
    ai_executive_summary: Optional[str] = None

# --- Feature 12: Avito Jargon Buster (Glossary) ---
class GlossaryTerm(BaseModel):
    id: str
    term: str
    category: str
    definition: str
    internal_context: str
    example_phrase: str
    tags: list[str] = []

# --- Feature: Gamification & Badges ---
class AchievementBadge(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    category: str
    xp: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress: int = 0

class UserGamificationProfile(BaseModel):
    user_id: str
    level: int
    level_name: str
    current_xp: int
    next_level_xp: int
    total_badges_count: int
    unlocked_badges_count: int
    badges: list[AchievementBadge] = []
