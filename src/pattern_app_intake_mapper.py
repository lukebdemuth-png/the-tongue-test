"""Map one unified Pattern App intake into tradition-specific evaluation packets."""

from __future__ import annotations

from typing import Any


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.replace(";", ",").split(",") if item.strip()]
    if isinstance(value, list):
        items: list[str] = []
        for item in value:
            items.extend(_as_list(item))
        return items
    return [str(value).strip()] if str(value).strip() else []


def _join_fields(*values: Any) -> str:
    return " ".join(item.lower() for value in values for item in _as_list(value))


def _flags(text: str, terms: dict[str, list[str]]) -> list[str]:
    found = []
    for label, needles in terms.items():
        if any(needle in text for needle in needles):
            found.append(label)
    return found


def _missing(required: dict[str, Any]) -> list[str]:
    return [name for name, value in required.items() if not value]


def build_tradition_evaluation_packets(intake: dict[str, Any]) -> dict[str, Any]:
    """Derive hidden Ayurveda, TCM, and Homeopathy packets from one intake.

    These packets are not a diagnosis. They are structured evaluation hints so each
    tradition engine can score source-supported relevance from the same main form.
    """
    symptoms = intake.get("symptoms", {})
    context = intake.get("patient_context", {})
    tradition_inputs = intake.get("tradition_specific_inputs", {})
    ayurveda_notes = tradition_inputs.get("ayurveda", {})
    tcm_notes = tradition_inputs.get("tcm", {})
    homeopathy_notes = tradition_inputs.get("homeopathy", {})

    text = _join_fields(
        symptoms,
        context.get("known_conditions", []),
        context.get("current_medications", []),
        intake.get("practitioner_notes", ""),
    )
    modalities = _as_list(symptoms.get("better_from")) + _as_list(symptoms.get("worse_from"))

    digestion_text = _join_fields(symptoms.get("digestion"), symptoms.get("secondary_symptoms"), symptoms.get("primary_symptoms"))
    sleep_text = _join_fields(symptoms.get("sleep"), symptoms.get("primary_symptoms"), symptoms.get("secondary_symptoms"))
    temperature_text = _join_fields(symptoms.get("temperature_patterns"), tcm_notes.get("temperature"), homeopathy_notes.get("thermal_state"))

    ayurveda_packet = {
        "evaluation_focus": "Ayurveda pattern relevance from unified intake",
        "autofilled_from_main_intake": True,
        "possible_dosha_flags": _flags(
            text,
            {
                "vata": ["dry", "gas", "bloat", "constipation", "anxiety", "restless", "insomnia", "variable", "pain"],
                "pitta": ["heat", "hot", "burning", "acid", "irritable", "inflammation", "thirst"],
                "kapha": ["heavy", "mucus", "congestion", "sluggish", "low energy", "letharg", "swelling"],
            },
        ),
        "agni_flags": _flags(
            digestion_text,
            {
                "variable_or_weak_agni": ["variable", "bloat", "gas", "low appetite", "poor digestion", "indigestion"],
                "sharp_agni": ["acid", "burning", "hunger", "thirst"],
                "slow_agni": ["heavy", "sluggish", "low appetite", "coating"],
            },
        ),
        "ama_signs": _flags(
            text,
            {
                "possible_ama": ["coating", "heavy", "sluggish", "sticky", "mucus", "foul", "bloat", "low energy"],
            },
        ),
        "supporting_observations": {
            "digestion": symptoms.get("digestion", ""),
            "sleep": symptoms.get("sleep", ""),
            "energy": symptoms.get("energy", ""),
            "mood": symptoms.get("mood", ""),
            "temperature_patterns": symptoms.get("temperature_patterns", []),
            "ayurveda_notes": ayurveda_notes,
        },
        "missing_questions": _missing(
            {
                "prakriti": ayurveda_notes.get("prakriti"),
                "vikriti": ayurveda_notes.get("vikriti"),
                "agni": ayurveda_notes.get("agni") or symptoms.get("digestion"),
                "bowel_pattern": ayurveda_notes.get("bowel_pattern"),
                "tongue_notes": ayurveda_notes.get("tongue_notes"),
                "pulse_notes": ayurveda_notes.get("pulse_notes"),
            }
        ),
    }

    tcm_packet = {
        "evaluation_focus": "TCM pattern relevance from unified intake",
        "autofilled_from_main_intake": True,
        "possible_pattern_flags": _flags(
            text,
            {
                "spleen_qi_or_damp_tendency": ["bloat", "low energy", "fatigue", "heavy", "loose stool", "poor appetite"],
                "liver_qi_constraint_tendency": ["stress", "irritable", "distension", "sighing", "mood", "worse from stress"],
                "heat_tendency": ["hot", "heat", "burning", "thirst", "red", "irritable"],
                "cold_tendency": ["cold", "chilly", "better from heat", "pale"],
                "shen_sleep_involvement": ["sleep", "insomnia", "dream", "waking", "anxiety", "restless"],
            },
        ),
        "supporting_observations": {
            "temperature": symptoms.get("temperature_patterns", []),
            "thirst": tcm_notes.get("thirst", ""),
            "appetite": tcm_notes.get("appetite") or symptoms.get("digestion", ""),
            "sweating": tcm_notes.get("sweating", ""),
            "bowel_urine": tcm_notes.get("bowel_urine", ""),
            "emotional_pattern": tcm_notes.get("emotional_pattern") or symptoms.get("mood", ""),
            "sleep": symptoms.get("sleep", ""),
        },
        "missing_questions": _missing(
            {
                "tongue": tcm_notes.get("tongue"),
                "pulse": tcm_notes.get("pulse"),
                "temperature": tcm_notes.get("temperature") or temperature_text,
                "thirst": tcm_notes.get("thirst"),
                "sweating": tcm_notes.get("sweating"),
                "bowel_urine": tcm_notes.get("bowel_urine"),
            }
        ),
    }

    homeopathy_packet = {
        "evaluation_focus": "Homeopathy remedy and rubric direction from unified intake",
        "autofilled_from_main_intake": True,
        "rubric_seed_terms": _as_list(symptoms.get("primary_symptoms"))
        + _as_list(symptoms.get("secondary_symptoms"))
        + _as_list(symptoms.get("sleep"))
        + _as_list(symptoms.get("digestion")),
        "modalities": modalities + _as_list(homeopathy_notes.get("modalities")),
        "generals": _as_list(symptoms.get("energy"))
        + _as_list(symptoms.get("temperature_patterns"))
        + _as_list(homeopathy_notes.get("generals")),
        "mental_emotional_state": homeopathy_notes.get("mental_emotional_state") or symptoms.get("mood", ""),
        "peculiar_symptoms": _as_list(homeopathy_notes.get("peculiar_symptoms")),
        "possible_rubric_flags": _flags(
            text,
            {
                "sleep_rubrics": ["sleep", "insomnia", "dream", "waking"],
                "stomach_abdomen_rubrics": ["appetite", "stomach", "bloat", "nausea", "digestion"],
                "mind_rubrics": ["anxiety", "fear", "irritable", "mood", "sad", "restless"],
                "generalities_rubrics": ["fatigue", "low energy", "chilly", "hot", "weakness"],
            },
        ),
        "missing_questions": _missing(
            {
                "clear_modalities": modalities,
                "peculiar_symptoms": homeopathy_notes.get("peculiar_symptoms"),
                "food_cravings_aversions": homeopathy_notes.get("food_cravings_aversions"),
                "thermal_state": homeopathy_notes.get("thermal_state") or temperature_text,
                "mental_emotional_state": homeopathy_notes.get("mental_emotional_state") or symptoms.get("mood"),
            }
        ),
    }

    return {
        "source": "unified_practitioner_intake",
        "purpose": "Autofill hidden tradition-specific evaluation packets before separate scoring.",
        "ayurveda": ayurveda_packet,
        "tcm": tcm_packet,
        "homeopathy": homeopathy_packet,
    }
