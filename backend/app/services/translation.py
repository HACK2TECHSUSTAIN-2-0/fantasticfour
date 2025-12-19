import os
from typing import Optional

import requests


SARVAM_TRANSLATE_URL = os.getenv("SARVAM_TRANSLATE_URL", "https://api.sarvam.ai/translate")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")


def translate_to_english(text: str, source_lang: Optional[str] = None) -> str:
  """
  Translate text to English using Sarvam. Returns original text on errors/missing key.
  """
  if not SARVAM_API_KEY:
    return text

  try:
    payload = {
      "text": text,
      "source_language": source_lang or "auto",
      "target_language": "en",
    }
    headers = {
      "Authorization": f"Bearer {SARVAM_API_KEY}",
      "Content-Type": "application/json",
    }
    resp = requests.post(SARVAM_TRANSLATE_URL, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("translated_text") or data.get("translation") or text
  except Exception:
    return text
