from pydantic import BaseModel
from typing import List


class ExplainRequest(BaseModel):
    topic: str
    grade: str
    language: str


class KeyTerm(BaseModel):
    term: str
    meaning: str


class ExplainResponse(BaseModel):
    title: str
    explanation: str
    analogy: str
    visual_points: List[str]
    key_terms: List[KeyTerm]
    fun_fact: str

