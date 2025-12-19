import os
import tempfile
from typing import Optional, Tuple

from faster_whisper import WhisperModel

# Configurable via env
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

_model: Optional[WhisperModel] = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe_to_english(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None,
    source_lang: str = "auto",
) -> Tuple[Optional[str], Optional[str]]:
    """
    Transcribe audio to English using local Whisper (translate task).
    Returns (text, error_message).
    """
    tmp_path = None
    try:
        suffix = os.path.splitext(filename)[1] or ".m4a"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        model = _get_model()
        language = None if source_lang in ("auto", "", None) else source_lang
        segments, _ = model.transcribe(tmp_path, task="translate", language=language, beam_size=1)
        text = " ".join([seg.text for seg in segments]).strip()

        if not text:
            return None, "Whisper returned empty transcript"
        return text, None
    except Exception as e:
        return None, str(e)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
