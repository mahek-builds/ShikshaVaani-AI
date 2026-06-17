from pydantic import BaseModel
from typing import Optional

class QuizRequest(BaseModel):
    topic: str
    grade: Optional[str] = None
    num_questions: Optional[int] = 5