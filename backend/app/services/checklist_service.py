from copy import deepcopy
from datetime import datetime
from typing import Optional
from app.models.schemas import ChecklistTask, ChecklistSummary
from app.core.seed_data import INITIAL_CHECKLIST_TASKS
from app.services.gamification_service import gamification_service

class ChecklistService:
    def __init__(self):
        self.reset()

    def reset(self):
        # In-memory storage keyed by user_id
        self._user_tasks: dict[str, list[ChecklistTask]] = {
            "intern_1": deepcopy(INITIAL_CHECKLIST_TASKS)
        }

    def get_tasks(self, user_id: str, period: Optional[str] = None, category: Optional[str] = None) -> list[ChecklistTask]:
        tasks = self._user_tasks.get(user_id)
        if not tasks:
            # Seed default tasks if new user
            tasks = deepcopy(INITIAL_CHECKLIST_TASKS)
            self._user_tasks[user_id] = tasks
        
        filtered = tasks
        if period and period != "all":
            filtered = [t for t in filtered if t.period == period]
        if category and category != "all":
            filtered = [t for t in filtered if t.category.lower() == category.lower()]
        return filtered

    def update_task_status(self, user_id: str, task_id: str, status: str) -> Optional[ChecklistTask]:
        tasks = self.get_tasks(user_id)
        for task in tasks:
            if task.id == task_id:
                prev_status = task.status
                task.status = status
                if status == "completed":
                    task.completed_at = datetime.now()
                    if prev_status != "completed":
                        gamification_service.award_xp(user_id, 50, f"Выполнение задачи чек-листа: {task.title}")
                else:
                    task.completed_at = None
                return task
        return None

    def update_task_note(self, user_id: str, task_id: str, notes: str) -> Optional[ChecklistTask]:
        tasks = self.get_tasks(user_id)
        for task in tasks:
            if task.id == task_id:
                task.notes = notes
                return task
        return None

    def get_summary(self, user_id: str) -> ChecklistSummary:
        tasks = self.get_tasks(user_id)
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "completed")
        in_progress = sum(1 for t in tasks if t.status == "in_progress")
        todo = total - completed - in_progress
        pct = int((completed / total) * 100) if total > 0 else 0
        
        # Next recommended: first in_progress or first high-priority todo
        next_task = next((t for t in tasks if t.status == "in_progress"), None)
        if not next_task:
            next_task = next((t for t in tasks if t.status == "todo"), None)
            
        current_period = next_task.period_title if next_task else "Все этапы завершены"

        return ChecklistSummary(
            total_tasks=total,
            completed_tasks=completed,
            in_progress_tasks=in_progress,
            todo_tasks=todo,
            progress_percentage=pct,
            current_period=current_period,
            next_recommended_task=next_task
        )

checklist_service = ChecklistService()
