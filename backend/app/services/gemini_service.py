import os
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

    class _FallbackTypes:
        @staticmethod
        def GenerateContentConfig(**kwargs):
            return kwargs

    types = _FallbackTypes()

class GeminiService:
    """Real AI Integration with Google Gemini (gemini-2.5-flash via google-genai SDK 2.34.0).
    Provides deep code refactoring, review, and role-specific conversational intelligence.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        self._client = None
        self._init_client()

    def _init_client(self):
        api_key = self.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
        if HAS_GENAI and api_key and self._client is None:
            try:
                self.api_key = api_key
                self._client = genai.Client(api_key=api_key)
                logger.info(f"GeminiService initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}")
                self._client = None

    def is_available(self) -> bool:
        if self._client is None:
            self._init_client()
        return self._client is not None

    def refactor_code(self, code: str, language: str, issues: list[Any]) -> Optional[str]:
        """Call Gemini 2.5 Flash to generate production-ready refactoring of the user's specific code."""
        if not self.is_available():
            return None

        issues_summary = "\n".join([
            f"- [{getattr(iss, 'rule_id', 'ISSUE')}] {getattr(iss, 'rule_name', '')}: {getattr(iss, 'message', '')}"
            for iss in issues
        ])

        system_instruction = (
            "Вы — ведущий Staff/Principal инженер и ревьюер в AvitoTech.\n"
            "Ваша задача — отрефакторить присланный пользователем код в соответствии с 10 золотыми правилами инженерии Авито и Zero Bug Policy:\n"
            "1. Защита от OOM и зависания горутин: обязательный `context.Context` с таймаутом во всех операциях I/O, SQL и HTTP.\n"
            "2. HTTP-клиенты: строго с явным `Timeout` (2-3 сек).\n"
            "3. База данных: обязательный `LIMIT` во всех SELECT запросах; транзакции с `defer tx.Rollback()`; безопасное сканирование.\n"
            "4. Ошибки: категорический запрет `panic()` в прикладном коде; оборачивание ошибок через `%w` в Go; типизированные исключения в Python.\n"
            "5. Логирование: структурированный логгер вместо `fmt.Println` или `print`.\n"
            "Верните ТОЛЬКО валидный исправленный исходный код на том же языке. Сохраните структуру и сигнатуры пользовательских функций. "
            "Не используйте Markdown тройные обратные кавычки (```) и не добавляйте сопроводительный текст."
        )

        prompt = (
            f"Язык программирования: {language}\n\n"
            f"Исходный код пользователя:\n{code}\n\n"
            f"Замечания статического анализатора ZBP, которые необходимо устранить:\n{issues_summary}\n\n"
            f"Пожалуйста, выдай полный исправленный продакшен-код."
        )

        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2
                )
            )
            text = (response.text or "").strip()
            # Strip markdown fences if Gemini added them despite prompt
            if text.startswith("```"):
                lines = text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
            return text if text else None
        except Exception as e:
            logger.error(f"Gemini code refactoring call failed: {e}")
            return None

    def generate_chat_reply(
        self,
        user_role: str,
        user_name: str,
        message: str,
        context_info: str = "",
        history: Optional[list[dict[str, Any]]] = None
    ) -> Optional[str]:
        """Generate role-aware conversational reply using Gemini 2.5 Flash."""
        if not self.is_available():
            return None

        # Select specialized role-specific system prompt
        if user_role == "mentor":
            role_prompt = (
                f"Вы — специализированный коучинговый AI-ассистент для наставника в Авито ({user_name}, Senior Backend Engineer).\n"
                "Вы помогаете проводить эффективные 1:1 встречи со стажёром Арсением Новиковым, формулировать развивающую обратную связь, "
                "составлять чек-листы код-ревью и готовить оценку к Экватору (3 мес) и защите в штат.\n"
                "Стиль общения: профессиональный, конструктивный, партнёрский."
            )
        elif user_role in ["lead", "hr_bp"]:
            role_prompt = (
                f"Вы — аналитический стратегический AI-ассистент для тимлида / руководителя в Авито ({user_name}).\n"
                "Вы фокусируетесь на метриках адаптации команды, скорости онбординга, контроле Zero Bug Policy, "
                "прохождении испытательного срока стажёрами и подготовке офферов в штат.\n"
                "Стиль общения: лаконичный, с опорой на цифры, риски и выводы."
            )
        else:
            role_prompt = (
                f"Вы — AI-buddy, персональный интеллектуальный напарник стажёра Авито ({user_name}, Backend Track, Order Management & Delivery Core).\n"
                "Наставник стажёра — Алексей Смирнов, тимлид — Дмитрий Козлов.\n"
                "Вы помогаете стажёру быстро влиться в процессы Авито: Agile/Scrum, Jira, Confluence, тестовые стенды SPT, Kubernetes через Lens, "
                "метрики Grafana/VictoriaMetrics, трекинг ошибок Sentry, 10 правил инженерии Авито и регламент Zero Bug Policy (ZBP).\n"
                "Стиль общения: тёплый, поддерживающий, вдохновляющий, технически точный, с реальными примерами из жизни Авито."
            )

        system_instruction = (
            f"{role_prompt}\n\n"
            "Важные правила ответов:\n"
            "- Отвечайте на русском языке.\n"
            "- Используйте красивый Markdown (списки, жирный шрифт, подсветку кода).\n"
            "- Приводите конкретные примеры стандартов Авито (PostgreSQL, Go, Kafka, Lens, ZBP).\n"
            "- Если пользователь спрашивает о зарплатах коллег или секретах прод-баз — вежливо напомните о политике конфиденциальности (КИ).\n"
        )

        history_context = ""
        if history:
            recent_turns = history[-6:]
            history_lines = []
            for item in recent_turns:
                sender = item.get("sender") or item.get("role", "user")
                text = item.get("content") or item.get("text", "")
                history_lines.append(f"{sender.capitalize()}: {text}")
            if history_lines:
                history_context = "Контекст предыдущего диалога:\n" + "\n".join(history_lines) + "\n\n"

        prompt = ""
        if history_context:
            prompt += history_context
        if context_info:
            prompt += f"Дополнительный контекст из внутренней базы знаний Авито:\n{context_info}\n\n"
        prompt += f"Вопрос/сообщение от {user_name}:\n{message}"

        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3
                )
            )
            return (response.text or "").strip()
        except Exception as e:
            logger.error(f"Gemini chat generation failed: {e}")
            return None

gemini_service = GeminiService()
