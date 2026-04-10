from __future__ import annotations

from typing import Any, Dict

import requests

from app.config import settings


def post_json(endpoint: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    url = f"{settings.ollama_url}{endpoint}"
    try:
        response = requests.post(url, json=payload, timeout=timeout)
        response.raise_for_status()
    except requests.exceptions.ConnectionError as exc:
        raise RuntimeError(
            "Не удалось подключиться к Ollama. Убедитесь, что Ollama установлен и запущен "
            f"по адресу {settings.ollama_url}. Для проверки используйте: "
            "curl http://localhost:11434/api/tags"
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "Превышен таймаут обращения к Ollama. Попробуйте увеличить ASK_TIMEOUT_SECONDS "
            "или INGEST_TIMEOUT_SECONDS."
        ) from exc
    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "unknown"
        body = exc.response.text[:400] if exc.response is not None else ""
        raise RuntimeError(f"Ollama вернул ошибку HTTP {status}: {body}") from exc

    return response.json()
