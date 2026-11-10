from fastapi import APIRouter, Depends
from app.core.rbac import get_current_user
from app.models.schemas import CodeReviewRequest, CodeReviewResponse, UserProfile
from app.services.code_review_service import code_review_service

router = APIRouter(prefix="/api/code-review", tags=["Pre-flight Code Review Playground"])

@router.post("/analyze", response_model=CodeReviewResponse)
def analyze_code_snippet(
    req: CodeReviewRequest,
    user: UserProfile = Depends(get_current_user)
):
    """Analyze code snippet against Avito's 10 Golden Engineering & ZBP Rules."""
    return code_review_service.analyze_code(req)
