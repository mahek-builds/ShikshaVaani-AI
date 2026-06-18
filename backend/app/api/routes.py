from fastapi import APIRouter


from sqlalchemy.orm import Session
from app.core.database import get_db
from fastapi  import Depends


from app.schemas.explain import ExplainRequest
from app.schemas.quiz import QuizRequest
from app.schemas.command import CommandRequest

from app.services.explain_service import explain_concept
from app.services.quiz_prompt import generate_quiz
from app.services.command_service import detect_command

router = APIRouter()



@router.post("/explain")
def explain(data: ExplainRequest,db:Session=Depends(get_db)):


    result = explain_concept(db,
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
# top-level imports में Explaination model को भी import कर लें
from app.models.explaination import Explaination

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    # Database से सबसे नए 10 explanations निकालें
    history = db.query(Explaination).order_by(Explaination.id.desc()).limit(10).all()
    return {
        "success": True,
        "data": history
    }

