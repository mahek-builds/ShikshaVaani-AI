from pydantic import BaseModel


class CommandRequest(BaseModel):
    text: str


class CommandResponse(BaseModel):
    intent: str
    topic: str
    grade: str
    language: str
