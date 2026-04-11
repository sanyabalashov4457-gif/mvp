import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List


logger = logging.getLogger(__name__)

KNOWLEDGE_PATH = Path(__file__).resolve().parent / "knowledge_store.json"
DEFAULT_KNOWLEDGE: Dict[str, Any] = {
    "auth": [],
    "headers": {},
    "endpoints": [],
    "flows": [],
    "entities": [],
    "statuses": [],
    "reference": [],
    "notes": [],
}


@lru_cache(maxsize=1)
def load_knowledge() -> Dict[str, Any]:
    if not KNOWLEDGE_PATH.exists():
        logger.warning("Knowledge store file not found: %s", KNOWLEDGE_PATH)
        return DEFAULT_KNOWLEDGE.copy()

    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as file:
        raw = json.load(file)

    merged = DEFAULT_KNOWLEDGE.copy()
    for key in DEFAULT_KNOWLEDGE:
        if key in raw:
            merged[key] = raw[key]
    logger.info(
        "Knowledge loaded: endpoints=%s, notes=%s, flows=%s",
        len(merged.get("endpoints", [])),
        len(merged.get("notes", [])),
        len(merged.get("flows", [])),
    )
    return merged


def _question_tokens(question: str) -> set[str]:
    normalized = question.lower().replace("/", " / ").replace("?", " ")
    return {token.strip() for token in normalized.split() if token.strip()}


def _contains_any(text: str, tokens: set[str]) -> bool:
    normalized = text.lower()
    return any(token in normalized for token in tokens if len(token) > 2)


def find_relevant_knowledge(question: str) -> Dict[str, Any]:
    knowledge = load_knowledge()
    tokens = _question_tokens(question)

    domain_tokens = {"payments", "payment", "transfers", "transfer", "qr", "registry", "auth"}
    operation_tokens = {"create", "confirm", "status", "commission", "token", "result", "check"}
    endpoint_tokens = {token for token in tokens if token.startswith("/")}

    matched_domains = sorted({token for token in tokens if token in domain_tokens})
    matched_operations = sorted({token for token in tokens if token in operation_tokens})

    relevant_endpoints: List[Dict[str, Any]] = []
    for endpoint in knowledge.get("endpoints", []):
        path = str(endpoint.get("path", "")).lower()
        domain = str(endpoint.get("domain", "")).lower()
        operation = str(endpoint.get("operation", "")).lower()
        description = str(endpoint.get("description", "")).lower()

        has_endpoint_match = any(token.lower() in path for token in endpoint_tokens) if endpoint_tokens else False
        has_domain_match = domain in matched_domains if matched_domains else False
        has_operation_match = operation in matched_operations if matched_operations else False
        has_keyword_match = _contains_any(f"{path} {description}", tokens)

        if has_endpoint_match or has_domain_match or has_operation_match or has_keyword_match:
            relevant_endpoints.append(endpoint)

    relevant_auth = [
        item
        for item in knowledge.get("auth", [])
        if _contains_any(json.dumps(item, ensure_ascii=False), tokens) or "token" in tokens or "auth" in tokens
    ]
    relevant_flows = [
        flow for flow in knowledge.get("flows", []) if _contains_any(json.dumps(flow, ensure_ascii=False), tokens)
    ]
    relevant_notes = [
        note for note in knowledge.get("notes", []) if _contains_any(json.dumps(note, ensure_ascii=False), tokens)
    ]
    relevant_headers = knowledge.get("headers", {}) if ("header" in tokens or "заголов" in question.lower()) else {}

    relevant_entities = [
        entity
        for entity in knowledge.get("entities", [])
        if _contains_any(json.dumps(entity, ensure_ascii=False), tokens)
    ]
    relevant_statuses = [
        status for status in knowledge.get("statuses", []) if _contains_any(json.dumps(status, ensure_ascii=False), tokens)
    ]

    result = {
        "auth": relevant_auth,
        "headers": relevant_headers,
        "endpoints": relevant_endpoints[:5],
        "flows": relevant_flows,
        "entities": relevant_entities,
        "statuses": relevant_statuses,
        "reference": knowledge.get("reference", []),
        "notes": relevant_notes,
        "matched_domains": matched_domains,
        "matched_operations": matched_operations,
    }

    knowledge_used = any(
        [
            result["auth"],
            result["headers"],
            result["endpoints"],
            result["flows"],
            result["entities"],
            result["statuses"],
            result["notes"],
        ]
    )
    result["knowledge_used"] = knowledge_used

    logger.info(
        "Knowledge matches: used=%s, endpoints=%s, auth=%s, notes=%s, flows=%s",
        knowledge_used,
        len(result["endpoints"]),
        len(result["auth"]),
        len(result["notes"]),
        len(result["flows"]),
    )
    return result
