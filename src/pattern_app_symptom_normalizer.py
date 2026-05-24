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
    "anxiety": {
        "dimension": "mental_emotional",
        "aliases": ["anxiety", "anxious", "worry", "panic", "nervous", "restless mind"],
        "next_questions": [
            "Does the anxiety come with panic, chest pain, shortness of breath, insomnia, digestive changes, or a clear trigger?",
            "Is it worse at a certain time of day, before events, after caffeine, or when alone?",
            "What helps: reassurance, movement, pressure, warmth, breathing, food, or rest?",
        ],
    },
    "bloating": {
        "dimension": "digestion",
        "aliases": ["bloating", "bloated", "gas", "flatulence", "abdominal distension", "distention"],
        "next_questions": [
            "Is bloating worse after meals, specific foods, stress, evening, or before stool?",
            "Is there belching, gas, pain, constipation, loose stool, nausea, or appetite change?",
            "What helps: warmth, pressure, movement, passing gas, stool, fasting, or smaller meals?",
        ],
    },
    "cough": {
        "dimension": "respiratory",
        "aliases": ["cough", "coughing", "dry cough", "wet cough", "phlegm", "mucus"],
        "next_questions": [
            "Is the cough dry, wet, barking, spasmodic, or productive with phlegm?",
            "Are there red flags such as difficulty breathing, chest pain, blood, high fever, or low oxygen?",
            "What makes it worse: lying down, cold air, talking, exertion, night, or morning?",
        ],
    },
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
        "aliases": ["fatigue", "low energy", "no energy", "tired", "tiredness", "weakness", "exhaustion", "low stamina"],
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
    "insomnia": {
        "dimension": "sleep",
        "aliases": ["insomnia", "can't sleep", "cant sleep", "sleepless", "poor sleep", "waking at night", "restless sleep"],
        "next_questions": [
            "Is the main issue falling asleep, staying asleep, waking too early, or non-restorative sleep?",
            "What time does waking happen, and is there heat, sweating, urination, hunger, worry, pain, or dreams?",
            "What helps or worsens sleep: food, screens, stress, caffeine, exercise, warmth, or position?",
        ],
    },
    "nausea": {
        "dimension": "digestion",
        "aliases": ["nausea", "nauseous", "queasy", "vomiting", "retching", "upset stomach"],
        "next_questions": [
            "Is there vomiting, pregnancy possibility, fever, severe abdominal pain, dehydration, or blood?",
            "Is nausea worse before eating, after eating, with motion, odors, stress, morning, or night?",
            "What helps: eating, fasting, ginger, warmth, fresh air, lying still, or vomiting?",
        ],
    },
    "pain": {
        "dimension": "pain",
        "aliases": ["pain", "ache", "aching", "soreness", "sharp pain", "dull pain"],
        "next_questions": [
            "Where is the pain located, and does it move anywhere?",
            "What is the quality: sharp, dull, throbbing, burning, cramping, heavy, or shooting?",
            "What makes it better or worse: motion, rest, pressure, heat, cold, eating, stool, or time of day?",
        ],
    },
    "rash": {
        "dimension": "skin",
        "aliases": ["rash", "itch", "itching", "hives", "red skin", "skin eruption"],
        "next_questions": [
            "Is there swelling of lips or throat, breathing difficulty, fever, blistering, or rapidly spreading rash?",
            "Is the rash itchy, burning, painful, dry, oozing, raised, or hot?",
            "What triggered it: food, medication, herb, supplement, contact exposure, heat, cold, stress, or infection?",
        ],
    },
    "stomach_pain": {
        "dimension": "digestion",
        "aliases": ["stomach pain", "abdominal pain", "belly pain", "stomach ache", "cramps", "cramping"],
        "next_questions": [
            "Where is the pain located, and is it mild, moderate, severe, sudden, or worsening?",
            "Is there fever, vomiting, blood, pregnancy possibility, chest pain, or acute severe abdominal pain?",
            "Is it better or worse with food, stool, gas, pressure, warmth, cold, movement, or rest?",
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
    "cant sleep": "can't sleep",
    "cantsleep": "can't sleep",
    "stomache": "stomach ache",
    "stomachach": "stomach ache",
    "anxity": "anxiety",
    "nausia": "nausea",
    "tummypain": "stomach pain",
    "tird": "tired",
    "tierd": "tired",
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
