from src.pattern_app_symptom_normalizer import (
    canonical_for_phrase,
    normalize_intake_symptoms,
    symptom_alias_terms,
)


def test_canonical_for_phrase_corrects_common_typos() -> None:
    assert canonical_for_phrase("consitation") == "constipation"
    assert canonical_for_phrase("headace") == "headache"
    assert canonical_for_phrase("lowenergy") == "fatigue"
    assert canonical_for_phrase("cant sleep") == "insomnia"
    assert canonical_for_phrase("stomache") == "stomach_pain"
    assert canonical_for_phrase("anxity") == "anxiety"


def test_symptom_alias_terms_expand_single_word_inputs() -> None:
    terms = symptom_alias_terms("low energy")

    assert "fatigue" in terms
    assert "weakness" in terms
    assert "energy" in terms


def test_symptom_alias_terms_cover_launch_symptoms() -> None:
    assert "sleep" in symptom_alias_terms("cant sleep")
    assert "bloating" in symptom_alias_terms("bloated")
    assert "nausea" in symptom_alias_terms("nausia")
    assert "rash" in symptom_alias_terms("itching")
    assert "palpitations" in symptom_alias_terms("palpitations")
    assert "congestion" in symptom_alias_terms("congestion")
    assert "menstrual" in symptom_alias_terms("menstrual cramps")
    assert "back" in symptom_alias_terms("back pain")


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
