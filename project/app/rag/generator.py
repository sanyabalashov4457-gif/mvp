from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import settings
from app.rag.ollama_client import OllamaConnectionError, generate_text


logger = logging.getLogger(__name__)


SYSTEM_PROMPT_TEMPLATE = """Ты — технический консультант по API.

Правила:

* Контекст состоит из двух частей:
  1) STRUCTURED DATA (надежный источник)
  2) DOCUMENT CONTEXT (вспомогательный источник)
* Приоритет всегда у STRUCTURED DATA
* Если есть конфликт между источниками — используй STRUCTURED DATA
* Отвечай ТОЛЬКО на основе переданного контекста
* Не придумывай данные
* Если информации нет — пиши: "Информация не найдена в документации"
* Отвечай четко и структурированно
* Если есть API — указывай:

  * endpoint
  * метод
  * параметры
  * примечания (если есть)

Контекст:
{context}

Вопрос:
{question}
"""


def _build_prompt(question: str, context: List[dict]) -> str:
    structured_items = [item for item in context if item.get("type") == "knowledge"]
    document_items = [item for item in context if item.get("type") != "knowledge"]

    structured_text = "\n\n".join(
        [f"[Structured {idx}]\n{item.get('text', '')}" for idx, item in enumerate(structured_items, start=1)]
    )
    document_text = "\n\n".join(
        [
            f"[Document {idx}, page {item.get('page', 'N/A')}]\n{item.get('text', '')}"
            for idx, item in enumerate(document_items, start=1)
        ]
    )
    context_text = (
        "STRUCTURED DATA:\n"
        f"{structured_text or 'Отсутствует'}\n\n"
        "DOCUMENT CONTEXT:\n"
        f"{document_text or 'Отсутствует'}"
    )
    return SYSTEM_PROMPT_TEMPLATE.format(context=context_text or "Контекст отсутствует", question=question)


def generate_answer(question: str, context: List[dict]) -> Dict[str, Any]:
    prompt = _build_prompt(question=question, context=context)
    answer_text = generate_text(prompt=prompt, timeout=settings.generate_timeout_seconds)
    answer = answer_text.strip()
    logger.info(
        "Model answer generated | chars=%s | preview=%s",
        len(answer),
        answer[:500],
    )

    return {
        "answer": answer or "Информация не найдена в документации",
        "sources": context,
    }
