from __future__ import annotations

import logging
from typing import Any, Dict, List

import requests

from app.config import settings


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

    response = requests.post(
        f"{settings.ollama_url}/api/generate",
        json={
            "model": settings.model_name,
            "prompt": prompt,
            "stream": False,
        },
        timeout=settings.ask_timeout_seconds,
    )
    response.raise_for_status()
    payload = response.json()
    answer = payload.get("response", "").strip()
    logger.info("Model answer generated: %s", answer[:500])

    return {
        "answer": answer or "Информация не найдена в документации",
        "sources": context,
    }
