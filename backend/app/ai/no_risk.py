import re

NO_RISK_TEXTS = {
    "ok", "okay", "okey", "k", "kk",
    "yes", "yeah", "yep",
    "no", "nah",
    "fine", "cool", "fun", "nice", "great", "good", "done",
    "alright", "all right", "all good",
    "sounds good", "perfect", "awesome", "amazing",
    "sure", "sure thing",
    "got it", "noted", "understood",
    "thanks", "thank you", "thank u", "thx", "ty",
    "much appreciated", "cool thanks", "ok thanks", "thanks ok", "thanks 👍",
    "welcome",
    "hmm", "hmmm", "hm", "uh", "uhh", "uh huh",
    "lol", "lmao", "haha", "hehe", "rofl",
    "yo", "sup", "hey", "hi", "hello", "hola",
    "bye", "bye bye", "goodbye", "see you", "see ya", "later",
    "brb", "afk",
    "idk", "dont know", "don't know",
    "whatever", "nothing",
    "nvm", "never mind",
    "ignore", "cancel", "stop",
    "test", "testing", "just testing", "ping", "pong", "check", "checking",
    "👍", "👌", "✅", "🙂", "😊", "😄", "😂", "😅", "😆", "😉", "😎", "🤝", "🙏"
}

def normalize_text(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^\w\s]", "", t)   # remove emojis & symbols
    t = re.sub(r"\s+", " ", t)
    return t


def is_no_risk(text: str) -> bool:
    t = normalize_text(text)

    if t == "":
        return True  # ".", "...", emojis only

    if len(t.split()) <= 3:
        return t in NO_RISK_TEXTS or any(t.startswith(x) for x in NO_RISK_TEXTS)