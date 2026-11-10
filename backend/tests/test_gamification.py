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
