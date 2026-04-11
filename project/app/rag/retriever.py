import logging
from typing import Dict, List

from chromadb import PersistentClient

from app.config import settings
from app.rag.ollama_client import embed_text


logger = logging.getLogger(__name__)


def _embed_query(query: str) -> List[float]:
    return embed_text(query, timeout=settings.query_timeout_seconds)


def _distance_to_similarity(distance: float) -> float:
    # For cosine space in Chroma, distance is in [0..2], lower is better.
    # Convert to [0..1] similarity, where 1 means identical.
    normalized = max(0.0, min(1.0, 1.0 - (float(distance) / 2.0)))
    return normalized


def retrieve(query: str, top_k: int = 3) -> List[Dict]:
    settings.db_dir.mkdir(parents=True, exist_ok=True)
    client = PersistentClient(path=str(settings.db_dir))
    try:
        collection = client.get_collection(settings.chroma_collection)
    except Exception:  # noqa: BLE001
        logger.warning("Collection '%s' not found. Run ingest first.", settings.chroma_collection)
        return []

    collection_count = collection.count()
    print(f"Collection count: {collection_count}")
    if collection_count == 0:
        raise Exception("Chroma collection is empty. Run ingest first.")

    query_embedding = _embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    chunks: List[Dict] = []
    for document, metadata, distance in zip(documents, metadatas, distances):
        similarity_score = _distance_to_similarity(distance)
        chunks.append(
            {
                "text": document,
                "page": int(metadata.get("page", -1)),
                "score": similarity_score,
                "similarity": similarity_score,
            }
        )

    print(f"Found {len(chunks)} chunks")
    logger.info("Retrieved %s chunks for query: %s", len(chunks), query)
    for idx, (chunk, distance) in enumerate(zip(chunks, distances), start=1):
        logger.info(
            "Chunk %s | distance=%.4f | score=%.3f | page=%s | text=%s",
            idx,
            distance,
            chunk["score"],
            chunk["page"],
            chunk["text"][:180],
        )
    return chunks
