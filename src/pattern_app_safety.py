"""Safety and contraindication helpers for Pattern App treatment drafts."""

from __future__ import annotations

from typing import Any


MEDICATION_KEYWORDS = {
    "blood_thinner": ["warfarin", "coumadin", "eliquis", "xarelto", "heparin", "aspirin", "clopidogrel"],
    "sedative_or_sleep_medication": ["benzodiazepine", "lorazepam", "alprazolam", "zolpidem", "ambien", "sedative"],
    "ssri_or_psychiatric_medication": ["ssri", "prozac", "sertraline", "zoloft", "lexapro", "psychiatric"],
    "diabetes_medication": ["insulin", "metformin", "glipizide", "diabetes medication"],
    "blood_pressure_medication": ["lisinopril", "amlodipine", "beta blocker", "blood pressure"],
}

CONDITION_KEYWORDS = {
    "pregnancy_or_postpartum": ["pregnant", "pregnancy", "postpartum", "breastfeeding", "nursing"],
    "liver_or_kidney_condition": ["liver", "kidney", "renal", "hepatic"],
    "autoimmune_or_immunosuppressed": ["autoimmune", "immunosuppressed", "transplant"],
    "serious_cardiovascular_history": ["heart attack", "arrhythmia", "heart disease", "stroke"],
}

TRADITION_CATEGORY_CAUTIONS = {
    "herbs": "Herb category requires herb-drug, pregnancy, allergy, and condition review.",
    "formulas": "Formula category requires practitioner review of ingredients, dose, duration, and contraindications.",
    "remedy_differential": "Homeopathic remedy differential requires full case review; do not treat as final remedy selection.",
    "rubric_cluster": "Repertory rubric is an indexing clue only; confirm against totality and source materia medica.",
    "yoga_breath": "Practice category requires tolerance review, especially with dizziness, pregnancy, pain, or respiratory symptoms.",
    "diet": "Diet category should account for allergies, medical restrictions, medications, and practitioner scope.",
    "lifestyle": "Lifestyle category should be individualized to capacity, safety, and clinical setting.",
}


def _flatten(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.lower()
    if isinstance(value, list):
        return " ".join(_flatten(item) for item in value)
    if isinstance(value, dict):
        return " ".join(_flatten(item) for item in value.values())
    return str(value).lower()


def detect_context_cautions(intake: dict[str, Any]) -> list[dict[str, str]]:
    """Return safety context cautions from medications, pregnancy, and known conditions."""
    context = intake.get("patient_context", {})
    text = _flatten(context)
    cautions: list[dict[str, str]] = []

    for caution_type, needles in MEDICATION_KEYWORDS.items():
        if any(needle in text for needle in needles):
            cautions.append(
                {
                    "type": caution_type,
                    "severity": "caution",
                    "note": "Medication context detected; review herb, formula, supplement, and practice interactions.",
                }
            )

    pregnancy_status = _flatten(context.get("pregnancy_status", ""))
    pregnancy_negative = any(
        phrase in pregnancy_status
        for phrase in ["not pregnant", "no pregnancy", "none", "n/a", "na", "not applicable"]
    )
    condition_text = " ".join([text, pregnancy_status])
    for caution_type, needles in CONDITION_KEYWORDS.items():
        if caution_type == "pregnancy_or_postpartum" and pregnancy_negative:
            continue
        if any(needle in condition_text for needle in needles):
            cautions.append(
                {
                    "type": caution_type,
                    "severity": "caution",
                    "note": "Condition context detected; practitioner must review contraindications before suggestions are used.",
                }
            )

    if not context.get("current_medications"):
        cautions.append(
            {
                "type": "medications_unknown",
                "severity": "missing_context",
                "note": "Medication list is missing; concrete herbs, formulas, supplements, and remedies need review.",
            }
        )
    if not context.get("pregnancy_status"):
        cautions.append(
            {
                "type": "pregnancy_status_unknown",
                "severity": "missing_context",
                "note": "Pregnancy/postpartum status is missing; lower confidence until clarified.",
            }
        )
    return cautions


def category_contraindications(category: str, context_cautions: list[dict[str, str]]) -> list[str]:
    notes = []
    if category in TRADITION_CATEGORY_CAUTIONS:
        notes.append(TRADITION_CATEGORY_CAUTIONS[category])
    for caution in context_cautions:
        if caution["type"] in {"medications_unknown", "pregnancy_status_unknown"}:
            notes.append(caution["note"])
        elif category in {"herbs", "formulas", "diet", "yoga_breath", "remedy_differential"}:
            notes.append(caution["note"])
    return sorted(set(notes))


def safety_completeness_score(context_cautions: list[dict[str, str]], red_flags: list[str]) -> float:
    if red_flags:
        return 0.0
    score = 100.0
    for caution in context_cautions:
        score -= 12 if caution["severity"] == "missing_context" else 8
    return max(20.0, score)
