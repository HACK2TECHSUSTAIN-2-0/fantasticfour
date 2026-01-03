# backend/app/ai/confidence.py

from app.ai.keywords import PANIC_WORDS

def compute_severity_and_confidence(text: str, silent: bool):
    text = text.lower()

    panic_score = sum(1 for w in PANIC_WORDS if w in text)

    confidence = 0.3  # base confidence

    # Panic words only matter for meaningful text
    if panic_score > 0 and len(text.split()) >= 3:
        confidence += 0.3

    if silent:
        confidence += 0.2

    confidence = min(confidence, 1.0)

    # Map to severity (raw)
    if confidence >= 0.75:
        severity = "HIGH"
    elif confidence >= 0.5:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return severity, round(confidence, 2)
