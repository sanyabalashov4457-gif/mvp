import logging
from typing import List

import chromadb
import requests

from app.config import settings
from app.utils.pdf_loader import load_pdf_documents
from app.utils.text_splitter import split_text


logger = logging.getLogger(__name__)


def _embedding_from_ollama(text: str) -> List[float]:
    response = requests.post(
        f"{settings.ollama_url}/api/embeddings",
        json={"model": settings.embed_model, "prompt": text},
        timeout=settings.ingest_timeout_seconds,
    )
    response.raise_for_status()
    data = response.json()
    return data["embedding"]


def ingest_documents() -> int:
    settings.docs_dir.mkdir(parents=True, exist_ok=True)
    settings.db_dir.mkdir(parents=True, exist_ok=True)

    pages = load_pdf_documents(settings.docs_dir)
    if not pages:
        logger.warning("No PDF pages found for ingest in %s", settings.docs_dir)
        return 0

    client = chromadb.PersistentClient(path=str(settings.db_dir))
    collection = client.get_or_create_collection(name=settings.chroma_collection)

    existing = collection.count()
    if existing:
        logger.info("Clearing existing collection items: %s", existing)
        client.delete_collection(settings.chroma_collection)
        collection = client.get_or_create_collection(name=settings.chroma_collection)

    ids = []
    documents = []
    metadatas = []
    embeddings = []

    chunk_idx = 0
    for page in pages:
        page_number = page["page"]
        for chunk in split_text(page["text"], chunk_size=800, overlap=100):
            chunk_idx += 1
            chunk_id = f"chunk-{chunk_idx}"

            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append({"page": page_number})
            embeddings.append(_embedding_from_ollama(chunk))

    if ids:
        collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    logger.info("Ingest completed. Indexed chunks: %s", len(ids))
    return len(ids)
