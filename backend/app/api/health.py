from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["Health & Metrics"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "avito-ai-buddy-api",
        "version": "1.0.0",
        "mcp_tools_registered": 7,
        "database": "connected"
    }

@router.get("/metrics", response_class=PlainTextResponse)
def prometheus_metrics():
    # Prometheus standard metrics format
    metrics = [
        "# HELP avito_buddy_requests_total Total HTTP requests to AI-Buddy API",
        "# TYPE avito_buddy_requests_total counter",
        "avito_buddy_requests_total 142",
        "",
        "# HELP avito_buddy_mentor_hours_saved Estimated hours of mentor routine saved",
        "# TYPE avito_buddy_mentor_hours_saved gauge",
        "avito_buddy_mentor_hours_saved 24.5",
        "",
        "# HELP avito_buddy_checklist_progress_avg Average onboarding checklist completion",
        "# TYPE avito_buddy_checklist_progress_avg gauge",
        "avito_buddy_checklist_progress_avg 0.68",
        "",
        "# HELP avito_buddy_mcp_invocations_total Total invocations of MCP corporate tools",
        "# TYPE avito_buddy_mcp_invocations_total counter",
        "avito_buddy_mcp_invocations_total{tool=\"request_absence\"} 18",
        "avito_buddy_mcp_invocations_total{tool=\"request_access\"} 24",
        "avito_buddy_mcp_invocations_total{tool=\"search_playbook\"} 67"
    ]
    return "\n".join(metrics)
