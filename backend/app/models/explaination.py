from sqlalchemy import Column, Integer, String, Text, JSON
from app.core.database import Base

class Explaination(Base):
    __tablename__ = "explainations"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True, nullable=False)
    grade = Column(String, index=True, nullable=False)
    language = Column(String, index=True, nullable=False)
    title = Column(String, nullable=True)
    explaination = Column(Text, nullable=True)
    analogy = Column(Text, nullable=True)
    visual_points = Column(JSON, nullable=True)
    key_terms = Column(JSON, nullable=True)
    fun_fact = Column(Text, nullable=True)
