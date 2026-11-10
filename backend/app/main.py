from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.checklist import router as checklist_router
from app.api.absence import router as absence_router
from app.api.access import router as access_router
from app.api.analytics import router as analytics_router
from app.api.health import router as health_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API and MCP Server for Avito AI-Buddy (Hack&Change 2026)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(checklist_router)
app.include_router(absence_router)
app.include_router(access_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Avito AI-Buddy API",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
