from sqlalchemy.orm import Session
from app.models.explaination import Explaination

def get_explanation(db: Session, topic: str, grade: str, language: str):
    return db.query(Explaination).filter(
        Explaination.topic == topic,
        Explaination.grade == grade,
        Explaination.language == language
    ).first()

def create_explanation(db: Session, topic: str, grade: str, language: str, data: dict):
    db_obj = Explaination(
        topic=topic,
        grade=grade,
        language=language,
        title=data.get("title"),
        explaination=data.get("explanation"),
        analogy=data.get("analogy"),
        visual_points=data.get("visual_points"),
        key_terms=data.get("key_terms"),
        fun_fact=data.get("fun_fact")
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
