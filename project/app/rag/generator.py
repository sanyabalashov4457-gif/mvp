from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import settings
from app.rag.ollama_client import OllamaConnectionError, generate_text


logger = logging.getLogger(__name__)


FALLBACK_ANSWER = "Недостаточно данных для точного ответа. Уточни вопрос."

SYSTEM_PROMPT_TEMPLATE = """Ты — технический консультант по API Multitransfer.

Твоя задача — отвечать как инженер интеграции, а не как AI.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НЕ придумывай endpoint, URL и параметры.
2. НЕ заменяй реальные пути на упрощенные:
   - нельзя: /auth/token
   - нельзя: /payments
   - нельзя: /transfer
3. Используй только значения, которые явно присутствуют в данных для ответа.
4. Если точного значения (endpoint, путь, параметр) нет:
   - не указывай его
   - не угадывай
   - не подставляй похожий путь
   - опиши процесс и укажи, что endpoint зависит от конфигурации или нужно уточнение
5. НЕ упоминай:
   - документ
   - контекст
   - structured data
   - sources
   - based on
6. НЕ объясняй, откуда взята информация, и не пиши вводные фразы.
7. Если информации недостаточно, ответь строго:
   "Недостаточно данных для точного ответа. Уточни вопрос."

Формат ответа:
- Сразу по сути.
- Если endpoint точно найден:
  1) Метод + путь
  2) Что нужно передать
  3) Важные нюансы
- Если endpoint не найден:
  - опиши процесс без выдумывания пути

Данные для ответа:
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

    # Guardrail: drop lines with forbidden meta-phrases.
    forbidden_markers = [
        "based on",
        "according to",
        "sources",
        "документ",
        "контекст",
        "structured data",
    ]
    filtered_lines = []
    for line in answer.splitlines():
        lower_line = line.lower()
        if any(marker in lower_line for marker in forbidden_markers):
            continue
        filtered_lines.append(line)
    answer = "\n".join(filtered_lines).strip()

    logger.info(
        "Model answer generated | chars=%s | preview=%s",
        len(answer),
        answer[:500],
    )

    return {
        "answer": answer or FALLBACK_ANSWER,
        "sources": context,
    }


def clean_answer(text: str) -> str:
    banned_phrases = [
        "Based on",
        "according to",
        "document",
        "context",
        "sources",
    ]
    cleaned = text
    for phrase in banned_phrases:
        cleaned = cleaned.replace(phrase, "")
    return cleaned.strip()
