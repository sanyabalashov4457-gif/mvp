import logging
from typing import List

from chromadb import PersistentClient

from app.config import settings
from app.rag.ollama_client import OllamaConnectionError, embed_text
from app.utils.pdf_loader import load_pdf_documents
from app.utils.text_splitter import split_text


logger = logging.getLogger(__name__)
COLLECTION_METADATA = {"hnsw:space": "cosine"}


def ingest_documents() -> int:
    settings.docs_dir.mkdir(parents=True, exist_ok=True)
    settings.db_dir.mkdir(parents=True, exist_ok=True)

    pages = load_pdf_documents(settings.docs_dir)
    if not pages:
        logger.warning("No PDF pages found for ingest in %s", settings.docs_dir)
        return 0

    client = PersistentClient(path=str(settings.db_dir))
    # Always recreate collection to guarantee expected distance metric.
    try:
        client.delete_collection(settings.chroma_collection)
    except Exception:  # noqa: BLE001
        pass
    collection = client.get_or_create_collection(
        name=settings.chroma_collection,
        metadata=COLLECTION_METADATA,
    )
    print(f"Collection name: {collection.name}")
    print(f"Collection metric: {collection.metadata.get('hnsw:space', 'unknown')}")
    print("Before insert: 0")

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
            try:
                embeddings.append(embed_text(chunk, timeout=settings.ingest_timeout_seconds))
            except OllamaConnectionError as exc:
                logger.error("%s", exc)
                raise RuntimeError(str(exc)) from exc

    if ids:
        collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    print(f"After insert: {collection.count()}")

    logger.info("Ingest completed. Indexed chunks: %s", len(ids))
    return len(ids)
