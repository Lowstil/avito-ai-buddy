from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.rbac import get_current_user
from app.models.schemas import GlossaryTerm, UserProfile
from app.services.glossary_service import glossary_service

router = APIRouter(prefix="/api/glossary", tags=["Avito Jargon Buster"])

@router.get("", response_model=list[GlossaryTerm])
def get_terms(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    search: Optional[str] = Query(None, description="Текстовый поиск"),
    user: UserProfile = Depends(get_current_user)
):
    return glossary_service.get_all_terms(category=category, search=search)

@router.get("/categories", response_model=list[str])
def get_categories(user: UserProfile = Depends(get_current_user)):
    return glossary_service.get_categories()
