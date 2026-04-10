from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import settings
from app.rag.ollama_client import OllamaConnectionError, post_json


logger = logging.getLogger(__name__)


SYSTEM_PROMPT_TEMPLATE = """Ты — технический консультант по API.

Правила:

* Отвечай ТОЛЬКО на основе переданного контекста
* Не придумывай данные
* Если информации нет — пиши: "Информация не найдена в документации"
* Отвечай четко и структурированно
* Если есть API — указывай:

  * endpoint
  * метод
  * параметры

Контекст:
{context}

Вопрос:
{question}
"""


def _build_prompt(question: str, context: List[dict]) -> str:
    context_text = "\n\n".join(
        [
            f"[Источник {idx}, страница {item.get('page', 'N/A')}]\n{item.get('text', '')}"
            for idx, item in enumerate(context, start=1)
        ]
    )
    return SYSTEM_PROMPT_TEMPLATE.format(context=context_text or "Контекст отсутствует", question=question)


def generate_answer(question: str, context: List[dict]) -> Dict[str, Any]:
    prompt = _build_prompt(question=question, context=context)
    try:
        answer_text = generate_text(prompt=prompt, timeout=settings.generate_timeout_seconds)
    except OllamaConnectionError:
        raise
    answer = answer_text.strip()
    logger.info("Model answer generated: %s", answer[:500])

    return {
        "answer": answer or "Информация не найдена в документации",
        "sources": context,
    }
