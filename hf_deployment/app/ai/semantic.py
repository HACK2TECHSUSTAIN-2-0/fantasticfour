from sentence_transformers import util
from app.ai.model import load_model
from app.ai.semantic_refs import SEMANTIC_REFERENCES

_model = None
_reference_embeddings = {}

def _init():
    global _model, _reference_embeddings
    if _model is None:
        _model = load_model()
        for category, sentences in SEMANTIC_REFERENCES.items():
            _reference_embeddings[category] = _model.encode(
                sentences,
                convert_to_tensor=True,
                normalize_embeddings=True
            )

_init()

def semantic_classify(text: str, threshold: float = 0.62):
    text_embedding = _model.encode(
        text,
        convert_to_tensor=True,
        normalize_embeddings=True
    )

    best_category = None
    best_score = 0.0

    for category, ref_emb in _reference_embeddings.items():
        scores = util.cos_sim(text_embedding, ref_emb)
        max_score = scores.max().item()

        if max_score > best_score:
            best_score = max_score
            best_category = category

    if best_score >= threshold:
        return best_category, round(best_score, 3)

    return None, round(best_score, 3)
