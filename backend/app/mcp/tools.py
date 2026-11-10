from typing import Any
from app.services.absence_service import absence_service
from app.services.access_service import access_service
from app.services.checklist_service import checklist_service
from app.services.playbook_rag import playbook_rag
from app.models.schemas import AbsenceRequestCreate, AccessRequestCreate

class MCPToolRegistry:
    """Implements Model Context Protocol (MCP) Tool execution for Avito Corporate Services."""

    def __init__(self):
        self.tools = {
            "request_absence": self.tool_request_absence,
            "query_absence_status": self.tool_query_absence_status,
            "request_access": self.tool_request_access,
            "get_checklist_status": self.tool_get_checklist_status,
            "update_checklist_task": self.tool_update_checklist_task,
            "search_playbook": self.tool_search_playbook,
            "generate_1on1_summary": self.tool_generate_1on1_summary,
        }

    def execute(self, tool_name: str, **kwargs) -> dict[str, Any]:
        if tool_name not in self.tools:
            return {"error": f"Tool '{tool_name}' not found in MCP registry."}
        try:
            return self.tools[tool_name](**kwargs)
        except Exception as e:
            return {"error": f"Execution error in {tool_name}: {str(e)}"}

    def tool_request_absence(self, user_id: str, user_name: str, start_date: str, reason: str, absence_type: str = "day_off", end_date: str = None) -> dict[str, Any]:
        payload = AbsenceRequestCreate(
            start_date=start_date,
            end_date=end_date or start_date,
            absence_type=absence_type,
            reason=reason
        )
        req = absence_service.create_absence(user_id=user_id, user_name=user_name, payload=payload)
        return {
            "status": "success",
            "message": f"Заявка на отсутствие #{req.id} успешно оформлена в сервисе 'Отсутствия Авито'.",
            "request": req.model_dump()
        }

    def tool_query_absence_status(self, user_id: str) -> dict[str, Any]:
        reqs = absence_service.get_user_absences(user_id)
        return {
            "status": "success",
            "count": len(reqs),
            "requests": [r.model_dump() for r in reqs]
        }

    def tool_request_access(self, user_id: str, system_key: str, justification: str = "Необходимо для задач стажировки") -> dict[str, Any]:
        payload = AccessRequestCreate(system_key=system_key, justification=justification)
        item = access_service.request_access(user_id, payload)
        return {
            "status": "success",
            "message": f"Заявка на доступ к {item.system_name} зарегистрирована в ServiceDesk.",
            "access_item": item.model_dump()
        }

    def tool_get_checklist_status(self, user_id: str, period: str = "all") -> dict[str, Any]:
        summary = checklist_service.get_summary(user_id)
        tasks = checklist_service.get_tasks(user_id, period=period)
        return {
            "status": "success",
            "summary": summary.model_dump(),
            "tasks_count": len(tasks),
            "tasks": [t.model_dump() for t in tasks[:5]]
        }

    def tool_update_checklist_task(self, user_id: str, task_id: str, status: str) -> dict[str, Any]:
        task = checklist_service.update_task_status(user_id, task_id, status)
        if not task:
            return {"status": "error", "message": f"Task {task_id} not found"}
        return {
            "status": "success",
            "message": f"Задача '{task.title}' переведена в статус '{task.status}'",
            "task": task.model_dump()
        }

    def tool_search_playbook(self, query: str) -> dict[str, Any]:
        results = playbook_rag.search(query, top_k=2)
        return {
            "status": "success",
            "results": results
        }

    def tool_generate_1on1_summary(self, user_id: str) -> dict[str, Any]:
        summary = checklist_service.get_summary(user_id)
        tasks = checklist_service.get_tasks(user_id)
        
        completed_tasks = [t for t in tasks if t.status == "completed"]
        in_progress_tasks = [t for t in tasks if t.status == "in_progress"]
        todo_tasks = [t for t in tasks if t.status == "todo" and t.priority == "high"]
        
        # Deep task-by-task synthesis
        completed_points = [f"• **{t.title}**: успешно освоено (период: {t.period_title})" for t in completed_tasks[:4]]
        
        progress_analysis = []
        for t in in_progress_tasks[:3]:
            if "Zero Bug" in t.title:
                progress_analysis.append(f"• **{t.title}**: в процессе изучения. *Вопрос ментору:* как классифицируются дефекты в нашем сервисе и где смотреть алерты в Grafana?")
            elif "SPT" in t.title or "стенд" in t.title.lower():
                progress_analysis.append(f"• **{t.title}**: настройка тестовых контуров. *Вопрос ментору:* как развернуть feature-ветку на стенде SPT для сквозного тестирования?")
            elif "Lens" in t.title or "k8s" in t.title.lower():
                progress_analysis.append(f"• **{t.title}**: мониторинг подов. *Вопрос ментору:* как получить доступ к логам стейджа в Lens?")
            else:
                progress_analysis.append(f"• **{t.title}**: в активной работе. *Пункт обсуждения:* критерии завершения и блокеры.")
                
        next_steps = [f"• **{t.title}** ({t.period_title})" for t in todo_tasks[:2]]

        agenda = [
            f"📊 **Анализ прогресса онбординга:** закрыто {summary.completed_tasks} из {summary.total_tasks} задач ({summary.progress_percentage}% выполнения).",
            "\n✅ **Что уже сделано и закрыто:**",
            *(completed_points if completed_points else ["• Базовое знакомство с процессами"]),
            "\n⏳ **Текущие задачи в работе и вопросы для обсуждения с наставником:**",
            *(progress_analysis if progress_analysis else ["• Выбор приоритетных задач спринта"]),
            "\n🎯 **Ближайшие цели на следующий спринт:**",
            *(next_steps if next_steps else ["• Переход к самостоятельным бизнес-задачам"]),
            "\n💡 **Темы для обратной связи (Feedback 360):**",
            "• Насколько темп адаптации комфортен?",
            "• Каковы ожидания по первому продуктовому коммиту и ревью в GitLab?"
        ]
        return {
            "status": "success",
            "summary_points": agenda
        }

mcp_tool_registry = MCPToolRegistry()
