import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "Avito AI-Buddy API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = ["*"]
    
    # LLM Settings (Hybrid: supports real API or smart mock)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    USE_MOCK_LLM_IF_NO_KEY: bool = True
    
    # Storage
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    
settings = Settings()
