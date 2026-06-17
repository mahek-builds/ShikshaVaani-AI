from fastapi import APIRouter

from app.schemas.explain import ExplainRequest
from app.schemas.quiz import QuizRequest
from app.schemas.command import CommandRequest

from app.services.explain_service import explain_concept
from app.services.quiz_prompt import generate_quiz
from app.services.command_service import detect_command

router = APIRouter()

@router.post("/explain")
def explain(data: ExplainRequest):

    result = explain_concept(
        data.topic,
        data.language,
        data.grade
    )

    return {
        "success": True,
        "data": result
    }


@router.post("/quiz")
def quiz(data: QuizRequest):

    return {
        "success": True,
        "data": generate_quiz(
            data.topic
        )
    }


@router.post("/command")
def command(data: CommandRequest):

    result = detect_command(data.text)

    return {
        "success": True,
        "data": result
    }