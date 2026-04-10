from typing import List

from pydantic import BaseModel


class SourceItem(BaseModel):
    text: str
    page: int


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
