from app.core.cohere_client import co
import json
from app.prompts.explain_prompt import EXPLAIN_PROMPT

def explain_concept(topic, language, grade):

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
                    return json.loads(json_str)
                return json.loads(raw_text)
            except Exception:
                return {
                    "title": topic,
                    "explanation": raw_text,
                    "analogy": "",
                    "visual_points": [],
                    "key_terms": [],
                    "fun_fact": ""
                }

    return {
        "title": "Error",
        "explanation": "No response generated.",
        "analogy": "",
        "visual_points": [],
        "key_terms": [],
        "fun_fact": ""
    }