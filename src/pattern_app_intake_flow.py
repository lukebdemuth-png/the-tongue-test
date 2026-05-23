"""Progressive intake state for the Pattern App."""

from __future__ import annotations

from typing import Any


MINIMUM_FIELDS = {
    "chief_complaint": ("symptoms", "chief_complaint"),
    "primary_symptoms": ("symptoms", "primary_symptoms"),
    "duration": ("symptoms", "duration"),
    "severity": ("symptoms", "severity"),
    "current_medications": ("patient_context", "current_medications"),
    "pregnancy_status": ("patient_context", "pregnancy_status"),
}

DEEPENING_FIELDS = {
    "modalities": ("symptoms", "better_from", "worse_from"),
    "digestion": ("symptoms", "digestion"),
    "sleep": ("symptoms", "sleep"),
    "energy": ("symptoms", "energy"),
    "mood": ("symptoms", "mood"),
    "temperature_patterns": ("symptoms", "temperature_patterns"),
    "tradition_observations": ("tradition_specific_inputs",),
}


def _value_at(intake: dict[str, Any], path: tuple[str, ...]) -> Any:
    value: Any = intake
    for key in path:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def _has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return bool(value)
    if isinstance(value, dict):
        return any(_has_value(item) for item in value.values())
    return bool(value)


def _field_present(intake: dict[str, Any], paths: tuple[str, ...]) -> bool:
    if len(paths) <= 2:
        return _has_value(_value_at(intake, paths))
    return any(_has_value(_value_at(intake, (paths[0], key))) for key in paths[1:])


def build_progressive_intake_state(
    intake: dict[str, Any],
    safety: dict[str, Any],
    next_question: str,
) -> dict[str, Any]:
    minimum_missing = [name for name, path in MINIMUM_FIELDS.items() if not _field_present(intake, path)]
    deepening_missing = [name for name, path in DEEPENING_FIELDS.items() if not _field_present(intake, path)]

    if safety["status"] == "suppress":
        stage = "safety_referral_first"
    elif minimum_missing:
        stage = "minimum_intake_incomplete"
    elif deepening_missing:
        stage = "first_pass_ready_needs_depth"
    else:
        stage = "detailed_pass_ready"

    return {
        "stage": stage,
        "minimum_complete": not minimum_missing,
        "minimum_missing": minimum_missing,
        "deepening_missing": deepening_missing,
        "next_question": next_question,
        "can_generate_first_pass": safety["status"] != "suppress" and not minimum_missing,
        "can_generate_treatment_categories": safety["status"] != "suppress",
    }
