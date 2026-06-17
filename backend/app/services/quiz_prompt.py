from app.core.cohere_client import co
from app.prompts.quiz_prompt import QUIZ_PROMPT
import json 

def generate_quiz(topic):

    prompt = QUIZ_PROMPT.format(topic=topic)

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
                return {"questions": []}

    return {"questions": []}