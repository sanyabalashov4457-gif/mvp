from typing import List

from pydantic import BaseModel


class SourceItem(BaseModel):
    text: str
    page: int
    similarity: float | None = None


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    knowledge_used: bool
