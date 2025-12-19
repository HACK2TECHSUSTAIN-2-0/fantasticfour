NEGATION_PHRASES = [
    "i dont need help",
    "i do not need help",
    "no help needed",
    "everything is fine",
    "false alarm",
    "nothing is wrong",
    "ignore this",
    "dont worry im fine",
    "don't worry im fine",
    "cancel",
    "cancel emergency",
    "just testing",
    "test only"
]
def is_explicit_negation(text: str) -> bool:
    text = text.lower()
    return any(phrase in text for phrase in NEGATION_PHRASES)