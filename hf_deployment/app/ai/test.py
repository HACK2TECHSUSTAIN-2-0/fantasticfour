from app.ai.triage import run_ai_triage

tests = [
    "person has heart attack",
    "someone is coming behind me",
    "I feel unsafe someone is near",
    "man collapsed and not breathing",
    "there is a fight with weapons",
    "help please",
    "I dont need help",
    "fun"
]

extreme_tests = [

    # --------------------------------------------------
    # 1. NO_RISK / TRIVIAL (must NEVER escalate)
    # --------------------------------------------------
    "ok",
    "ok!!!",
    "OK???",
    "thanks 👍",
    "lol 😂😂😂",
    "test",
    "testing testing",
    "ping",
    "pong",
    "hmm",
    "uh",
    ".",
    "...",
    "??",
    "👍",

    # --------------------------------------------------
    # 2. EXPLICIT NEGATION (must suppress intent)
    # --------------------------------------------------
    "I dont need help",
    "I do not need help",
    "no help needed",
    "everything is fine",
    "false alarm",
    "nothing is wrong",
    "cancel emergency",
    "ignore this",
    "dont worry im fine",

    # --------------------------------------------------
    # 3. CRITICAL MEDICAL (must FORCE HIGH)
    # --------------------------------------------------
    "heart attack",
    "cardiac arrest",
    "not breathing",
    "unconscious",
    "seizure",
    "stroke",
    "bleeding heavily",
    "cant breathe",

    # --------------------------------------------------
    # 4. BROKEN / PANIC MEDICAL LANGUAGE
    # --------------------------------------------------
    "person has heart attack",
    "man collapsed breathing stopped",
    "blood everywhere help",
    "pain chest severe",
    "fell down not moving",

    # --------------------------------------------------
    # 5. IMPLICIT THREAT (semantic-only detection)
    # --------------------------------------------------
    "someone is coming behind me",
    "person walking very close following",
    "I think someone watching me",
    "feel unsafe right now",
    "something bad about to happen",

    # --------------------------------------------------
    # 6. PANIC WORD ABUSE (should NOT auto-HIGH)
    # --------------------------------------------------
    "help",
    "help please",
    "please help",
    "urgent",
    "asap",

    # --------------------------------------------------
    # 7. MIXED SIGNALS (order of rules matters)
    # --------------------------------------------------
    "help but im fine",
    "dont need help just testing",
    "ok but someone is near me",
    "urgent but false alarm",

    # --------------------------------------------------
    # 8. ADVERSARIAL / NONSENSE INPUT
    # --------------------------------------------------
    "asdfghjkl",
    "qwerty",
    "123456",
    "@@@@@",
    "🔥🔥🔥",
    "random text nothing",

    # --------------------------------------------------
    # 9. LONG RAMBLING REAL-WORLD TEXT
    # --------------------------------------------------
    "so basically i was walking home and everything was fine "
    "and then suddenly i noticed someone behind me and it felt weird",

    # --------------------------------------------------
    # 10. MULTI-INTENT COLLISION (highest priority wins)
    # --------------------------------------------------
    "someone is following me and i cant breathe",
    "person attacking and bleeding heavily",

    # --------------------------------------------------
    # 11. MALICIOUS / SARCASM ATTEMPTS (ignore sarcasm)
    # --------------------------------------------------
    "heart attack lol",
    "just kidding heart attack",
    "bleeding heavily haha",

    # --------------------------------------------------
    # 12. SHORT + SILENT EDGE CASES
    # --------------------------------------------------
    "someone near me",
    "person close"
]

for t in extreme_tests:
    print(t, "->", run_ai_triage(t, True))
