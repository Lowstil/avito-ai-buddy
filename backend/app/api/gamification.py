from fastapi import APIRouter, Depends
from app.core.rbac import get_current_user
from app.models.schemas import UserGamificationProfile, UserProfile
from app.services.gamification_service import gamification_service

router = APIRouter(prefix="/api/gamification", tags=["Avito Start Gamification & Badges"])

@router.get("/profile", response_model=UserGamificationProfile)
def get_gamification_profile(user: UserProfile = Depends(get_current_user)):
    return gamification_service.get_user_profile(user.user_id)
