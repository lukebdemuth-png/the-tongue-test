from src.pattern_app_symptom_normalizer import (
    canonical_for_phrase,
    normalize_intake_symptoms,
    symptom_alias_terms,
)


def test_canonical_for_phrase_corrects_common_typos() -> None:
    assert canonical_for_phrase("consitation") == "constipation"
    assert canonical_for_phrase("headace") == "headache"
    assert canonical_for_phrase("lowenergy") == "fatigue"


def test_symptom_alias_terms_expand_single_word_inputs() -> None:
    terms = symptom_alias_terms("low energy")

    assert "fatigue" in terms
    assert "weakness" in terms
    assert "energy" in terms


def test_normalize_intake_symptoms_preserves_original_phrase() -> None:
    intake = {
        "symptoms": {
            "chief_complaint": "headace",
            "primary_symptoms": ["headace"],
        }
    }

    normalized = normalize_intake_symptoms(intake)

    assert normalized[0]["canonical"] == "headache"
    assert normalized[0]["original"] == "headace"
    assert normalized[0]["dimension"] == "pain"
