CRITICAL_MEDICAL_TERMS = [
    "heart attack",
    "cardiac arrest",
    "not breathing",
    "cant breathe",
    "can't breathe",
    "difficulty breathing",
    "unconscious",
    "seizure",
    "stroke",
    "bleeding heavily",
    "blood everywhere",
    "breathing stopped"
]

def critical_override(text: str):
    text = text.lower()
    for term in CRITICAL_MEDICAL_TERMS:
        if term in text:
            return {
                "category": "medical",
                "force_severity": "HIGH",
                "force_confidence": 0.9,
                "source": "critical_override"
            }
    return None
