from datetime import datetime
from app.models.schemas import AchievementBadge, UserGamificationProfile

class GamificationService:
    """Gamification, Badges and XP Engine for Avito Start Interns."""

    def __init__(self):
        self._user_badges = [
            AchievementBadge(
                id="badge_zbp_champion",
                title="🛡️ Защитник Zero Bug Policy",
                description="Изучил правила ZBP и сдал входной тест по надежности без единой ошибки.",
                icon="ShieldCheck",
                category="Качество",
                xp=100,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 4, 11, 30),
                progress=100
            ),
            AchievementBadge(
                id="badge_access_master",
                title="🔑 Мастер доступов",
                description="Успешно настроил корпоративный VPN, стенды SPT и получил доступ к Lens k8s.",
                icon="Key",
                category="Инфраструктура",
                xp=120,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 5, 15, 0),
                progress=100
            ),
            AchievementBadge(
                id="badge_first_pr",
                title="🚀 Первый Pull Request",
                description="Открыл и успешно смерджил свой первый рабочий PR в репозиторий Delivery Core.",
                icon="GitPullRequest",
                category="Разработка",
                xp=150,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 7, 18, 20),
                progress=100
            ),
            AchievementBadge(
                id="badge_smart_absence",
                title="🏖️ Свободный график",
                description="Оформил первый день отсутствия (Day-off) через диалог с AI-buddy без бумажной рутины.",
                icon="CalendarCheck",
                category="Кадры",
                xp=80,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 9, 14, 10),
                progress=100
            ),
            AchievementBadge(
                id="badge_code_guardian",
                title="🔍 Зоркий глаз (Pre-flight Pro)",
                description="Проверил код через Pre-flight Playground и устранил все блокеры до код-ревью ментора.",
                icon="Eye",
                category="Качество",
                xp=120,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 10, 10, 0),
                progress=100
            ),
            AchievementBadge(
                id="badge_1on1_harmony",
                title="🤝 На одной волне",
                description="Провёл встречу 1:1 с наставником Алексеем по подготовленной ИИ адженде.",
                icon="Users",
                category="Культура",
                xp=90,
                unlocked=True,
                unlocked_at=datetime(2026, 11, 8, 16, 0),
                progress=100
            ),
            AchievementBadge(
                id="badge_equator_hero",
                title="🎯 Покоритель Экватора",
                description="Успешно завершил 3 месяца стажировки и защитил презентацию результатов перед тимлидом.",
                icon="Trophy",
                category="Финал",
                xp=250,
                unlocked=False,
                progress=50
            ),
            AchievementBadge(
                id="badge_junior_offer",
                title="👑 Оффер в штат (Junior Backend)",
                description="Получил и принял официальный оффер в штат инженерной команды Авито.",
                icon="Crown",
                category="Финал",
                xp=500,
                unlocked=False,
                progress=15
            )
        ]

    def get_user_profile(self, user_id: str) -> UserGamificationProfile:
        unlocked = [b for b in self._user_badges if b.unlocked]
        total_xp = sum(b.xp for b in unlocked)
        
        # Level thresholds
        # Level 1: 0 - 250 XP (Новичок)
        # Level 2: 251 - 650 XP (Продвинутый стажёр)
        # Level 3: 651 - 1000 XP (Уверенный джуниор)
        # Level 4: 1000+ XP (Готов к найму в штат)
        if total_xp >= 1000:
            level = 4
            level_name = "Готов к найму в штат (Junior Ready)"
            next_xp = 1500
        elif total_xp >= 650:
            level = 3
            level_name = "Уверенный джуниор (Active Contributor)"
            next_xp = 1000
        elif total_xp >= 250:
            level = 2
            level_name = "Продвинутый стажёр (Onboarding Explorer)"
            next_xp = 650
        else:
            level = 1
            level_name = "Новичок (Newbie)"
            next_xp = 250

        return UserGamificationProfile(
            user_id=user_id,
            level=level,
            level_name=level_name,
            current_xp=total_xp,
            next_level_xp=next_xp,
            total_badges_count=len(self._user_badges),
            unlocked_badges_count=len(unlocked),
            badges=self._user_badges
        )

gamification_service = GamificationService()
