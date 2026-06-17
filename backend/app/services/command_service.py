import json
from app.core.cohere_client import co

def detect_command(text):

    prompt = f"""
You are an AI assistant for teachers.

Analyze this voice command:

{text}

Extract:
1. intent (explain or quiz)
2. topic
3. grade
4. language

Rules:
- If a parameter (like grade or language) is not explicitly mentioned in the voice command, set its value to "Unknown" (do not guess).

Return ONLY valid JSON.

Example 1:
Voice command: "Explain photosynthesis class 6 in Hindi"
{{
    "intent": "explain",
    "topic": "photosynthesis",
    "grade": "6",
    "language": "Hindi"
}}

Example 2:
Voice command: "Quiz on water cycle"
{{
    "intent": "quiz",
    "topic": "water cycle",
    "grade": "Unknown",
    "language": "Unknown"
}}
"""

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
                    "intent": "explain",
                    "topic": text,
                    "grade": "Unknown",
                    "language": "Unknown"
                }

    return {
        "intent": "explain",
        "topic": text,
        "grade": "Unknown",
        "language": "Unknown"
    }