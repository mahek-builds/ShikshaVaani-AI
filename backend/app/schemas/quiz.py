from pydantic import BaseModel
from typing import Optional

class QuizRequest(BaseModel):
    topic: str
    grade: str
    language: str
    num_questions: Optional[int] = 5