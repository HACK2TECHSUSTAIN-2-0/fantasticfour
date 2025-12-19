import os
from typing import Optional

import requests

SARVAM_SPEECH_URL = os.getenv("SARVAM_SPEECH_URL", "https://api.sarvam.ai/speech-to-text")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")


def transcribe_to_english(
  file_bytes: bytes,
  filename: str,
  content_type: Optional[str] = None,
  source_lang: str = "auto"
) -> tuple[Optional[str], Optional[str]]:
  """
  Send audio to Sarvam for STT and translate to English.
  Returns (text, error_message) where text is None on failure.
  """
  if not SARVAM_API_KEY:
    return None, "SARVAM_API_KEY missing"

  try:
    files = {
      "file": (
        filename,
        file_bytes,
        content_type or "audio/m4a",
      )
    }
    data = {
      "source_language": source_lang or "auto",
      "target_language": "en",
    }
    headers = {
      "Authorization": f"Bearer {SARVAM_API_KEY}",
    }
    resp = requests.post(SARVAM_SPEECH_URL, files=files, data=data, headers=headers, timeout=20)
    resp.raise_for_status()
    payload = resp.json()
    text = payload.get("translated_text") or payload.get("text") or payload.get("transcript")
    if not text:
      return None, f"Unexpected response: {payload}"
    return text, None
  except Exception as e:
    return None, str(e)
