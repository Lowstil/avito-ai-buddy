from app.services.gamification_service import GamificationService
from app.models.schemas import AchievementBadge

def test_gamification_profile(client, intern_headers):
    res = client.get("/api/gamification/profile", headers=intern_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "intern_1"
    assert data["level"] >= 1
    assert data["current_xp"] > 0
    assert len(data["badges"]) >= 6
    unlocked = [b for b in data["badges"] if b["unlocked"]]
    assert len(unlocked) >= 3
    assert any("Zero Bug Policy" in b["title"] for b in unlocked)

def test_gamification_levels_calculation():
    service = GamificationService()
    
    # Test level calculation with mocked badges
    service._user_badges = [
        AchievementBadge(id="b1", title="B1", description="D1", icon="I1", category="C1", xp=100, unlocked=False, progress=0)
    ]
    p1 = service.get_user_profile("user_1")
    assert p1.level == 1
    assert p1.level_name == "Новичок (Newbie)"

    # Level 2
    service._user_badges = [
        AchievementBadge(id="b1", title="B1", description="D1", icon="I1", category="C1", xp=300, unlocked=True, progress=100)
    ]
    p2 = service.get_user_profile("user_2")
    assert p2.level == 2

    # Level 3
    service._user_badges = [
        AchievementBadge(id="b1", title="B1", description="D1", icon="I1", category="C1", xp=700, unlocked=True, progress=100)
    ]
    p3 = service.get_user_profile("user_3")
    assert p3.level == 3

    # Level 4
    service._user_badges = [
        AchievementBadge(id="b1", title="B1", description="D1", icon="I1", category="C1", xp=1200, unlocked=True, progress=100)
    ]
    p4 = service.get_user_profile("user_4")
    assert p4.level == 4
    assert "Junior Ready" in p4.level_name

def test_gamification_mentor_lead_access(client, mentor_headers, lead_headers):
    # Mentor can access profile
    r_m = client.get("/api/gamification/profile", headers=mentor_headers)
    assert r_m.status_code == 200
    assert r_m.json()["user_id"] == "mentor_1"

    # Lead can access profile
    r_l = client.get("/api/gamification/profile", headers=lead_headers)
    assert r_l.status_code == 200
    assert r_l.json()["user_id"] == "lead_1"

def test_award_xp_dynamic():
    service = GamificationService()
    p_before = service.get_user_profile("dynamic_intern")
    service.award_xp("dynamic_intern", 150, "Отличный спринт")
    p_after = service.get_user_profile("dynamic_intern")
    assert p_after.current_xp == p_before.current_xp + 150

def test_checklist_task_completion_awards_xp(client, intern_headers):
    prof_before = client.get("/api/gamification/profile", headers=intern_headers).json()["current_xp"]
    # Complete task
    res = client.patch("/api/checklist/task_be_3/status?status=completed", headers=intern_headers)
    assert res.status_code == 200
    prof_after = client.get("/api/gamification/profile", headers=intern_headers).json()["current_xp"]
    assert prof_after >= prof_before + 50

def test_code_review_passed_awards_xp(client, intern_headers):
    prof_before = client.get("/api/gamification/profile", headers=intern_headers).json()["current_xp"]
    clean_go = """
package main

import (
    "context"
    "fmt"
    "time"
)

func CleanRun(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()
    return fmt.Errorf("ok: %w", nil)
}
"""
    res = client.post("/api/code-review/analyze", json={"code": clean_go, "language": "go"}, headers=intern_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "passed"
    prof_after = client.get("/api/gamification/profile", headers=intern_headers).json()["current_xp"]
    assert prof_after >= prof_before + 100
