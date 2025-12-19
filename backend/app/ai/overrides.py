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
    medical_triggers = [
        "heart attack",
        "cardiac arrest",
        "not breathing",
        "stopped breathing",
        "unconscious",
        "passed out",
        "collapsed",
        "fell down",
        "not responding",
        "unresponsive",
        "seizure",
        "stroke",
        "bleeding heavily"
    ]
    # Strong medical override
    if any(k in text for k in medical_triggers):
        return {
            "category": "medical",
            "force_severity": "HIGH",
            "force_confidence": 0.9,
            "source": "critical_override"
        }
    # 🚨 SECURITY OVERRIDE (WEAPON / VIOLENCE)
    security_triggers = [
        "weapon", "knife", "gun", "firearm",
        "blade", "machete", "pistol", "rifle",
        "attack", "attacking", "threatening"
    ]

    if any(k in text for k in security_triggers):
        return {
            "category": "security",
            "force_severity": "HIGH",
            "force_confidence": 0.9,
            "source": "critical_override_security"
        }

    for term in CRITICAL_MEDICAL_TERMS:
        if term in text:
            return {
                "category": "medical",
                "force_severity": "HIGH",
                "force_confidence": 0.9,
                "source": "critical_override"
            }
    return None
