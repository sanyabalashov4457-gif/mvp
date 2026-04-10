import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from requests import exceptions as requests_exceptions

from app.schemas.request import AskRequest
from app.schemas.response import AskResponse
from app.services.qa_service import answer_question


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI API Documentation Consultant", version="1.0.0")


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    logger.info("Incoming question: %s", request.question)
    try:
        result = answer_question(request.question)
        logger.info("Answer preview: %s", result["answer"][:300])
        return result
    except requests_exceptions.ConnectionError as exc:
        logger.exception("Ollama connection error")
        raise HTTPException(
            status_code=503,
            detail=(
                "Не удалось подключиться к Ollama. "
                "Установите и запустите Ollama, затем убедитесь, что доступен "
                f"{request.url if False else 'http://localhost:11434'}"
            ),
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to process question")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
