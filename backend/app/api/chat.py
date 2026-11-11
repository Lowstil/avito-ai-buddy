from fastapi import APIRouter, Depends
from app.core.rbac import get_current_user
from app.models.schemas import ChatRequest, ChatResponse, UserProfile
from app.services.agent_service import agent_service

router = APIRouter(prefix="/api/chat", tags=["AI Buddy Chat"])

@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    user: UserProfile = Depends(get_current_user)
):
    return agent_service.process_message(user, payload.message, history=payload.history)
