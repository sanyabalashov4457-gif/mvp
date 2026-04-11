from __future__ import annotations

from typing import Any, Dict, List

import requests

from app.config import settings


class OllamaConnectionError(RuntimeError):
    @classmethod
    def from_exception(cls, base_url: str, exc: requests.RequestException) -> "OllamaConnectionError":
        if isinstance(exc, requests.exceptions.ConnectionError):
            return cls(
                "Не удалось подключиться к Ollama. Убедитесь, что Ollama установлен и запущен "
                f"по адресу {base_url}. Для проверки используйте: curl {base_url}/api/tags"
            )
        if isinstance(exc, requests.exceptions.Timeout):
            return cls(
                "Превышен таймаут обращения к Ollama. "
                "Попробуйте увеличить ASK_TIMEOUT_SECONDS или INGEST_TIMEOUT_SECONDS."
            )
        if isinstance(exc, requests.exceptions.HTTPError):
            status = exc.response.status_code if exc.response is not None else "unknown"
            body = exc.response.text[:400] if exc.response is not None else ""
            return cls(f"Ollama вернул ошибку HTTP {status}: {body}")
        return cls(f"Ошибка обращения к Ollama: {exc}")


def post_json(endpoint: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    url = f"{settings.ollama_url}{endpoint}"
    try:
        response = requests.post(url, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise OllamaConnectionError.from_exception(settings.ollama_url, exc) from exc


def embed_text(text: str, timeout: int) -> List[float]:
    payload = post_json(
        endpoint="/api/embeddings",
        payload={"model": settings.embed_model, "prompt": text},
        timeout=timeout,
    )
    return payload["embedding"]


def generate_text(prompt: str, timeout: int) -> str:
    payload = post_json(
        endpoint="/api/generate",
        payload={
            "model": settings.model_name,
            "prompt": prompt,
            "stream": False,
        },
        timeout=timeout,
    )
    return payload.get("response", "").strip()
