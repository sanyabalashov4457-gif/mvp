import json
import logging
from typing import Any, Dict, List

from app.knowledge.knowledge_loader import find_relevant_knowledge
from app.rag.generator import generate_answer
from app.rag.retriever import retrieve


logger = logging.getLogger(__name__)


def _build_hybrid_context(knowledge: Dict[str, Any], chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    structured_data = {
        "auth": knowledge.get("auth", []),
        "headers": knowledge.get("headers", {}),
        "endpoints": knowledge.get("endpoints", []),
        "flows": knowledge.get("flows", []),
        "entities": knowledge.get("entities", []),
        "statuses": knowledge.get("statuses", []),
        "reference": knowledge.get("reference", []),
        "notes": knowledge.get("notes", []),
        "matched_domains": knowledge.get("matched_domains", []),
        "matched_operations": knowledge.get("matched_operations", []),
    }

    context: List[Dict[str, Any]] = [
        {
            "type": "knowledge",
            "text": json.dumps(structured_data, ensure_ascii=False, indent=2),
            "page": -1,
        }
    ]

    for chunk in chunks:
        context.append(
            {
                "type": "document",
                "text": chunk.get("text", ""),
                "page": chunk.get("page", -1),
            }
        )
    return context


def answer_question(question: str) -> dict:
    knowledge = find_relevant_knowledge(question)
    knowledge_used = bool(knowledge.get("knowledge_used"))
    context_chunks = retrieve(question)
    hybrid_context = _build_hybrid_context(knowledge=knowledge, chunks=context_chunks)

    logger.info(
        "Knowledge matched | used=%s | endpoints=%s | auth=%s | flows=%s | notes=%s",
        knowledge_used,
        len(knowledge.get("endpoints", [])),
        len(knowledge.get("auth", [])),
        len(knowledge.get("flows", [])),
        len(knowledge.get("notes", [])),
    )
    logger.info(
        "Hybrid context built | documents=%s | context_items=%s | context_chars=%s",
        len(context_chunks),
        len(hybrid_context),
        sum(len(item.get("text", "")) for item in hybrid_context),
    )

    generation_result = generate_answer(question, hybrid_context)
    return {
        "answer": generation_result["answer"],
        "sources": context_chunks,
        "knowledge_used": knowledge_used,
    }
