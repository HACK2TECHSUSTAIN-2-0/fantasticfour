import requests

LM_URL = "http://localhost:1234/v1/chat/completions"

def enrich_alert(payload: dict) -> dict:
    triage = payload["triage"]

    messages = [
        {
            "role": "system",
            "content": "You help emergency response officers. Be concise and alert authorities."
        },
        {
            "role": "user",
            "content": f"""
User message: "{triage['user_message']}"
Initial category: {triage['category']}
Initial severity: {triage['severity']}

Answer in one short paragraph:
Is this dangerous? What should the officer do?
"""
        }
    ]

    response = requests.post(
        LM_URL,
        json={
            "model": "local-model",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 150
        },
        timeout=10
    )

    response.raise_for_status()

    raw_text = response.json()["choices"][0]["message"]["content"]

    enriched = normalize_llm_output(raw_text, triage)

    return {
        "event_id": payload["event_id"],
        "llm_enrichment": enriched
    }

def normalize_llm_output(text: str, triage: dict) -> dict:
    text_l = text.lower()

    final_category = triage["category"]
    final_severity = triage["severity"]

    # Conservative severity upgrade
    if any(w in text_l for w in ["danger", "threat", "follow", "following", "chasing", "immediate"]):
        final_severity = "HIGH"

    officer_message = sanitize_officer_message(
        text=text,
        user_message=triage["user_message"]
    )

    return {
        "final_category": final_category,
        "final_severity": final_severity,
        "officer_message": officer_message,
        "reasoning": "LLM signal normalized with deterministic safety rules"
    }
    
def sanitize_officer_message(text: str, user_message: str) -> str:
    """
    Force the officer message to be factual, short, and non-creative.
    """
    text_l = text.lower()

    # If any narrative / emotional language is detected → hard fallback
    narrative_triggers = [
        "you notice", "you feel", "suspicious look",
        "watching", "uneasy", "uncomfortable",
        "as you walk", "your"
    ]

    if any(t in text_l for t in narrative_triggers):
        return (
            f"User reports being followed on campus. "
            f"Message: '{user_message}'. "
            f"Potential immediate threat. Officer should assess and contact user."
        )

    # Otherwise keep first sentence only
    sentence = text.replace("\n", " ").split(".")[0].strip()

    if len(sentence) < 20:
        return (
            f"User reports: '{user_message}'. "
            f"Immediate assessment recommended."
        )

    return sentence