"""Normalize plain-language symptom input for Pattern App retrieval.

The normalizer is deliberately conservative: it adds search aliases and flags
without replacing the user's original words. That keeps the practitioner trace
honest while making single-word and typo-heavy tests less brittle.
"""

from __future__ import annotations

import re
from difflib import get_close_matches
from typing import Any


CANONICAL_SYMPTOMS: dict[str, dict[str, Any]] = {
    "constipation": {
        "dimension": "elimination",
        "aliases": ["constipation", "hard stool", "dry stool", "infrequent stool", "difficult stool", "bowel"],
        "next_questions": [
            "How often is the stool passed, and is it hard, dry, incomplete, or painful?",
            "Is there bloating, gas, abdominal pain, or straining?",
            "What makes the constipation better or worse: fluids, warmth, oil, movement, stress, or travel?",
        ],
    },
    "fatigue": {
        "dimension": "energy",
        "aliases": ["fatigue", "low energy", "tired", "weakness", "exhaustion", "low stamina"],
        "next_questions": [
            "Is the low energy worse in the morning, afternoon, after meals, or after exertion?",
            "How are sleep, appetite, digestion, mood, and recovery after rest?",
            "Is there dizziness, shortness of breath, fever, weight loss, bleeding, or other medical concern?",
        ],
    },
    "headache": {
        "dimension": "pain",
        "aliases": ["headache", "head pain", "migraine", "forehead pain", "temple pain", "occipital pain"],
        "next_questions": [
            "Where is the headache located: forehead, temples, behind the eyes, vertex, or occiput?",
            "What is the quality: throbbing, pressure, sharp, dull, burning, or heavy?",
            "Are there red flags such as sudden worst headache, neurological symptoms, fever, head injury, or vision changes?",
        ],
    },
    "symptom": {
        "dimension": "general",
        "aliases": ["symptom", "symptoms", "complaint", "main concern"],
        "next_questions": [
            "What is the single main symptom or concern?",
            "When did it start, how severe is it, and what changes it?",
        ],
    },
}

TYPO_CORRECTIONS = {
    "consitation": "constipation",
    "constiation": "constipation",
    "constipaton": "constipation",
    "constapation": "constipation",
    "headace": "headache",
    "headach": "headache",
    "lowenergy": "low energy",
    "tird": "tired",
}

ALIAS_TO_CANONICAL: dict[str, str] = {}
for canonical, payload in CANONICAL_SYMPTOMS.items():
    for alias in payload["aliases"]:
        ALIAS_TO_CANONICAL[alias] = canonical
ALIAS_TO_CANONICAL.update({canonical: canonical for canonical in CANONICAL_SYMPTOMS})


def normalize_text(text: str) -> str:
    lowered = text.lower()
    lowered = re.sub(r"[^a-z0-9\s-]+", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    for typo, correction in TYPO_CORRECTIONS.items():
        lowered = re.sub(rf"\b{re.escape(typo)}\b", correction, lowered)
    return lowered


def canonical_for_phrase(phrase: str) -> str | None:
    normalized = normalize_text(phrase)
    if not normalized:
        return None
    if normalized in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[normalized]
    for alias, canonical in ALIAS_TO_CANONICAL.items():
        if alias in normalized:
            return canonical
    close = get_close_matches(normalized, ALIAS_TO_CANONICAL.keys(), n=1, cutoff=0.86)
    if close:
        return ALIAS_TO_CANONICAL[close[0]]
    return None


def symptom_alias_terms(text: str) -> set[str]:
    canonical = canonical_for_phrase(text)
    if not canonical:
        return set()
    if canonical == "symptom":
        return set()
    terms = set()
    for alias in CANONICAL_SYMPTOMS[canonical]["aliases"]:
        terms.update(normalize_text(alias).split())
    terms.add(canonical)
    return {term for term in terms if len(term) > 2}


def normalize_intake_symptoms(intake: dict[str, Any]) -> list[dict[str, Any]]:
    symptoms = intake.get("symptoms", {}) if isinstance(intake.get("symptoms"), dict) else {}
    values: list[str] = []
    for key in ["chief_complaint", "digestion", "sleep", "energy", "mood", "pain_location", "pain_quality"]:
        value = symptoms.get(key)
        if isinstance(value, str) and value.strip():
            values.append(value)
    for key in ["primary_symptoms", "secondary_symptoms", "better_from", "worse_from", "time_patterns", "temperature_patterns"]:
        value = symptoms.get(key)
        if isinstance(value, list):
            values.extend(str(item) for item in value if str(item).strip())

    seen = set()
    normalized: list[dict[str, Any]] = []
    for value in values:
        canonical = canonical_for_phrase(value)
        if not canonical or canonical in seen:
            continue
        seen.add(canonical)
        payload = CANONICAL_SYMPTOMS[canonical]
        normalized.append(
            {
                "canonical": canonical,
                "original": value,
                "dimension": payload["dimension"],
                "aliases": payload["aliases"],
                "next_questions": payload["next_questions"],
            }
        )
    return normalized


def expanded_query_text(query: str) -> str:
    canonical = canonical_for_phrase(query)
    if not canonical:
        return query
    if canonical == "symptom":
        return query
    aliases = CANONICAL_SYMPTOMS[canonical]["aliases"]
    return " ".join([query, canonical, *aliases])
