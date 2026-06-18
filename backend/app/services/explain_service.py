from app.core.cohere_client import co
import json
from app.prompts.explain_prompt import EXPLAIN_PROMPT
from app.crud.explanation import get_explanation, create_explanation
from sqlalchemy.orm import Session

def explain_concept(db: Session, topic, language, grade):

    # Check cache
    cached = get_explanation(db, topic, grade, language)
    if cached:
        return {
            "title": cached.title,
            "explanation": cached.explaination,
            "analogy": cached.analogy,
            "visual_points": cached.visual_points,
            "key_terms": cached.key_terms,
            "fun_fact": cached.fun_fact
        }

    prompt = EXPLAIN_PROMPT.format(topic=topic, grade=grade, language=language)

    response = co.chat(
        model="command-a-plus-05-2026",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    for item in response.message.content:
        if item.type == "text":
            try:
                raw_text = item.text
                start_idx = raw_text.find('{')
                end_idx = raw_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = raw_text[start_idx:end_idx+1]
                    data = json.loads(json_str)
                    create_explanation(db, topic, grade, language, data)
                    return data
                data = json.loads(raw_text)
                create_explanation(db, topic, grade, language, data)
                return data
            except Exception:
                fallback_data = {
                    "title": topic,
                    "explanation": raw_text,
                    "analogy": "",
                    "visual_points": [],
                    "key_terms": [],
                    "fun_fact": ""
                }
                create_explanation(db, topic, grade, language, fallback_data)
                return fallback_data

    return {
        "title": "Error",
        "explanation": "No response generated.",
        "analogy": "",
        "visual_points": [],
        "key_terms": [],
        "fun_fact": ""
    }