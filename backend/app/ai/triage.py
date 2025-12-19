from app.ai.keywords import INCIDENT_KEYWORDS
from app.ai.confidence import compute_severity_and_confidence
from app.ai.semantic import semantic_classify
from app.ai.overrides import critical_override
from app.ai.negation import is_explicit_negation
from app.ai.no_risk import is_no_risk


def classify_incident(text: str):
    text_l = text.lower()

    # Semantic Analysis (Always run for logging)
    semantic_category, similarity = semantic_classify(text_l)
    print(f"\n[Sentence Transformer] Input: '{text}'")
    print(f"[Sentence Transformer] Output: Category='{semantic_category}', Score={similarity}\n")

    # Keyword classification
    scores = {
        cat: sum(1 for w in words if w in text_l)
        for cat, words in INCIDENT_KEYWORDS.items()
    }

    keyword_category = max(scores, key=scores.get)
    if scores[keyword_category] > 0:
        return keyword_category, "keyword"

    # Semantic fallback usage
    if semantic_category:
        if len(text_l.split()) >= 6 and similarity >= 0.55:
            return semantic_category, f"semantic ({similarity})"
        if similarity >= 0.65:
            return semantic_category, f"semantic ({similarity})"

    if "medical" in scores and scores.get("medical", 0) > 0:
        return "medical", "keyword_priority"
    return "general", "fallback"


def run_ai_triage(text: str, silent: bool):
    raw = text.strip()
    # 0. NO_RISK must be first
    if is_no_risk(text):
        return {
            "user_message": raw,
            "category": "no_risk",
            "severity": "NONE",
            "confidence": 0.05,
            "classification_source": "no_risk"
        }

    # 1. Explicit negation
    if is_explicit_negation(text):
        return {
            "user_message": raw,
            "category": "general",
            "severity": "LOW",
            "confidence": 0.2,
            "classification_source": "explicit_negation"
        }

    # 2. Critical override
    override = critical_override(text)
    if override:
        return {
            "user_message": raw,
            "category": override["category"],
            "severity": override["force_severity"],
            "confidence": override["force_confidence"],
            "classification_source": override["source"]
        }
    if text.strip().isalnum() and len(text.split()) == 1:
        return {
            "user_message": raw,
            "category": "no_signal",
            "severity": "LOW",
            "confidence": 0.1,
            "classification_source": "no_signal"
        }
    # 3. Normal pipeline
    category, source = classify_incident(raw)
    severity, confidence = compute_severity_and_confidence(raw, silent)

    # Cap GENERAL category escalation
    if category == "general":
        confidence = min(confidence, 0.6)
        if confidence < 0.5:
            severity = "LOW"
        else:
            severity = "MEDIUM"

    return {
        "user_message": raw,
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "classification_source": source
    }