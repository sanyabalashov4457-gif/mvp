import logging
from typing import Dict, List

import chromadb
import requests

from app.config import settings
from app.rag.ollama_client import OllamaConnectionError


logger = logging.getLogger(__name__)


def _embed_query(query: str) -> List[float]:
    try:
        response = requests.post(
            f"{settings.ollama_url}/api/embeddings",
            json={"model": settings.embed_model, "prompt": query},
            timeout=settings.ask_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise OllamaConnectionError.from_exception(settings.ollama_url, exc) from exc
    return payload["embedding"]


def retrieve(query: str, top_k: int = 5) -> List[Dict]:
    settings.db_dir.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(settings.db_dir))
    try:
        collection = client.get_collection(settings.chroma_collection)
    except Exception:  # noqa: BLE001
        logger.warning("Collection '%s' not found. Run ingest first.", settings.chroma_collection)
        return []

    query_embedding = _embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    chunks: List[Dict] = []
    for document, metadata in zip(documents, metadatas):
        chunks.append(
            {
                "text": document,
                "page": int(metadata.get("page", -1)),
            }
        )

    logger.info("Retrieved %s chunks for query: %s", len(chunks), query)
    for idx, chunk in enumerate(chunks, start=1):
        logger.info("Chunk %s | page=%s | text=%s", idx, chunk["page"], chunk["text"][:180])
    return chunks
