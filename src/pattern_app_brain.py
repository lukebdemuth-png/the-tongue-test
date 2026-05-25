"""Transparent brain-trace prototype for the Pattern App."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
import re
from typing import Any

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.pattern_app_intake import intake_to_query, summarize_input
from src.pattern_app_intake_flow import build_progressive_intake_state
from src.pattern_app_intake_mapper import build_tradition_evaluation_packets
from src.pattern_app_retrieval import (
    CHUNKS_PATH,
    DISCLAIMER,
    EMERGENCY_WARNING,
    SHORT_RESULT_DISCLAIMER,
    build_app_output,
    confidence_label,
    detect_red_flags,
    query_terms,
    read_jsonl,
    search,
)
from src.pattern_app_safety import category_contraindications, detect_context_cautions, safety_completeness_score
from src.pattern_app_symptom_normalizer import CANONICAL_SYMPTOMS, normalize_intake_symptoms


BOERICKE_PATH = Path("data/chunks/homeopathy_boericke_chunks.jsonl")
KENT_REPERTORY_PATH = Path("data/chunks/homeopathy_kent_repertory_chunks.jsonl")

FEATURE_DIMENSIONS = {
    "sleep": "sleep",
    "insomnia": "sleep",
    "dream": "sleep",
    "digestion": "digestion",
    "appetite": "digestion",
    "bloating": "digestion",
    "stool": "elimination",
    "constipation": "elimination",
    "diarrhea": "elimination",
    "pain": "pain",
    "ache": "pain",
    "itch": "skin",
    "rash": "skin",
    "skin": "skin",
    "mood": "mental_emotional",
    "anxiety": "mental_emotional",
    "irritability": "mental_emotional",
    "fear": "mental_emotional",
    "energy": "energy",
    "fatigue": "energy",
    "cold": "temperature",
    "heat": "temperature",
    "hot": "temperature",
    "thirst": "fluid",
    "dry": "fluid",
    "mucus": "fluid",
    "night": "timing",
    "morning": "timing",
    "motion": "modality",
    "rest": "modality",
    "pressure": "modality",
}


def normalize_features(intake: dict[str, Any]) -> list[dict[str, Any]]:
    query = intake_to_query(intake)
    terms = sorted(query_terms(query))
    features = []
    for term in terms:
        dimension = FEATURE_DIMENSIONS.get(term)
        if not dimension:
            if term.endswith("ing"):
                dimension = "symptom"
            else:
                dimension = "general"
        features.append({"feature": term, "dimension": dimension, "source": "intake"})
    for normalized in normalize_intake_symptoms(intake):
        features.append(
            {
                "feature": normalized["canonical"],
                "dimension": normalized["dimension"],
                "source": "symptom_normalizer",
                "original": normalized["original"],
                "aliases": normalized["aliases"],
            }
        )
    return features


def safety_gate(intake: dict[str, Any]) -> dict[str, Any]:
    query = intake_to_query(intake)
    red_flags = detect_red_flags(query)
    missing = summarize_input(intake, red_flags)["missing_information"]
    context_cautions = detect_context_cautions(intake)
    if red_flags:
        status = "suppress"
        notes = ["Red-flag language detected; hold tradition-based wellness directions."]
    elif context_cautions or "current_medications" in missing or "pregnancy_status" in missing:
        status = "caution"
        notes = ["Some context is still missing, so keep this first pass light, observational, and easy to refine."]
    else:
        status = "clear"
        notes = ["No red-flag language detected in the current intake."]
    return {
        "status": status,
        "red_flags_detected": red_flags,
        "missing_safety_context": missing,
        "context_cautions": context_cautions,
        "safety_completeness_score": safety_completeness_score(context_cautions, red_flags),
        "notes": notes,
    }


def candidate_type(tradition: str) -> str:
    if tradition == "Homeopathy":
        return "remedy_or_rubric_direction"
    if tradition == "Traditional Chinese Medicine":
        return "pattern_or_formula_direction"
    return "pattern_or_wellness_direction_category"


def priority_from_score(score: float, safety_status: str) -> str:
    if safety_status == "suppress":
        return "hold_until_clarified"
    if score >= 85:
        return "review_first"
    if score >= 70:
        return "review_second"
    if score >= 50:
        return "exploratory"
    return "hold_until_clarified"


TRADITION_PACKET_KEYS = {
    "Ayurveda": "ayurveda",
    "Traditional Chinese Medicine": "tcm",
    "Homeopathy": "homeopathy",
}

CONTRADICTION_RULES = [
    {
        "candidate_terms": {"heat", "hot", "burning", "thirst", "pitta"},
        "case_terms": {"cold", "chilly", "chilliness", "better from heat"},
        "message": "Candidate leans heat/thirst, while the intake includes cold or chilliness language.",
    },
    {
        "candidate_terms": {"cold", "chilly", "chilliness"},
        "case_terms": {"heat", "hot", "burning", "thirst"},
        "message": "Candidate leans cold/chilliness, while the intake includes heat, burning, or thirst language.",
    },
    {
        "candidate_terms": {"dry", "dryness", "constipation", "vata"},
        "case_terms": {"mucus", "congestion", "sticky", "edema", "swelling"},
        "message": "Candidate leans dryness/depletion, while the intake includes damp, mucus, or swelling language.",
    },
    {
        "candidate_terms": {"damp", "mucus", "phlegm", "kapha", "heaviness"},
        "case_terms": {"dry", "dryness", "constipation"},
        "message": "Candidate leans damp/heavy, while the intake includes dryness or constipation language.",
    },
]


def contradiction_notes(candidate_text: str, feature_terms: set[str]) -> list[str]:
    text = candidate_text.lower()
    notes = []
    for rule in CONTRADICTION_RULES:
        if any(term in text for term in rule["candidate_terms"]) and feature_terms & rule["case_terms"]:
            notes.append(rule["message"])
    return notes


def packet_missing_key_data(
    tradition: str,
    evaluation_packets: dict[str, Any] | None,
    safety: dict[str, Any] | None,
) -> list[str]:
    packet_key = TRADITION_PACKET_KEYS.get(tradition)
    packet = (evaluation_packets or {}).get(packet_key, {}) if packet_key else {}
    missing = list(packet.get("missing_questions", []))
    if safety:
        for item in safety.get("missing_safety_context", []):
            if item not in missing:
                missing.append(item)
    return missing


def confidence_rationale(
    row: dict[str, Any],
    missing_key_data: list[str],
    contradictions: list[str],
    safety_status: str,
) -> list[str]:
    details = row.get("score_details", {})
    matched = details.get("matched_terms", [])
    rationale = [
        f"Matched {len(matched)} intake feature(s) in source text.",
        f"Source quality tier: {details.get('source_quality_tier', 'unscored')}.",
        f"Citation quality score: {details.get('citation_quality', 'unscored')}.",
    ]
    if missing_key_data:
        rationale.append(f"Missing information lowers confidence: {', '.join(missing_key_data[:5])}.")
    if contradictions:
        rationale.append(f"Contradiction review needed: {contradictions[0]}")
    if safety_status == "suppress":
        rationale.append("Safety override is active; traditional interpretation is held until medical concern is clarified.")
    elif safety_status == "caution":
        rationale.append("Context is incomplete, so this should be treated as a first pattern read rather than a final interpretation.")
    return rationale


def score_breakdown_for_candidate(
    row: dict[str, Any],
    adjusted_score: float,
    missing_key_data: list[str],
    contradictions: list[str],
    safety_status: str,
) -> dict[str, Any]:
    details = row.get("score_details", {})
    return {
        "display_score": adjusted_score,
        "retrieval_score": row["score"],
        "pattern_match_score": details.get("symptom_match", 0),
        "source_support_score": round(
            (float(details.get("source_authority", 0)) * 0.55)
            + (float(details.get("citation_quality", 0)) * 0.45),
            2,
        ),
        "citation_quality": details.get("citation_quality", 0),
        "source_quality_tier": details.get("source_quality_tier", "unscored"),
        "missing_information_penalty": min(12, len(missing_key_data) * 2),
        "contradiction_penalty": min(16, len(contradictions) * 4),
        "safety_gate": 0 if safety_status == "suppress" else 1,
        "formula_note": "Prototype display score starts from retrieval score, then applies visible missing-information and contradiction penalties.",
    }


def build_candidates(
    results: dict[str, list[dict[str, Any]]],
    safety_status: str,
    evaluation_packets: dict[str, Any] | None = None,
    safety: dict[str, Any] | None = None,
    feature_terms: set[str] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    candidates: dict[str, list[dict[str, Any]]] = {}
    feature_terms = feature_terms or set()
    for tradition, rows in results.items():
        tradition_candidates = []
        for row in rows:
            citation = row["citation"]
            matched = row["score_details"]["matched_terms"]
            missing = packet_missing_key_data(tradition, evaluation_packets, safety)
            contradictions = contradiction_notes(
                " ".join([citation.get("locator", ""), row.get("text_preview", "")]),
                feature_terms,
            )
            adjusted_score = max(0.0, round(row["score"] - min(12, len(missing) * 2) - min(16, len(contradictions) * 4), 2))
            tradition_candidates.append(
                {
                    "tradition": tradition,
                    "candidate_name": citation["locator"],
                    "candidate_type": candidate_type(tradition),
                    "priority": priority_from_score(adjusted_score, safety_status),
                    "confidence_score": adjusted_score,
                    "confidence_label": confidence_label(adjusted_score),
                    "matched_features": matched,
                    "unmatched_features": [],
                    "contradicting_features": contradictions,
                    "missing_key_data": missing,
                    "supporting_citations": [citation["citation_id"]],
                    "score_breakdown": score_breakdown_for_candidate(
                        row,
                        adjusted_score,
                        missing,
                        contradictions,
                        safety_status,
                    ),
                    "confidence_rationale": confidence_rationale(row, missing, contradictions, safety_status),
                    "why_this_direction": [
                        f"Matched intake features: {', '.join(matched)}" if matched else "Matched source text weakly.",
                        f"Source layer: {citation['source']}",
                        f"Source quality: {row['score_details'].get('source_quality_tier', 'unscored')}",
                    ],
                    "text_preview": row["text_preview"],
                }
            )
        candidates[tradition] = tradition_candidates
    return candidates


def next_best_question(safety: dict[str, Any], features: list[dict[str, Any]]) -> str:
    if safety["red_flags_detected"]:
        return "Before traditional interpretation, has urgent medical evaluation ruled out the red-flag concern?"
    normalized = [feature for feature in features if feature.get("source") == "symptom_normalizer"]
    if any(feature.get("feature") == "symptom" for feature in normalized):
        return "What is the single main symptom or concern?"
    if normalized and normalized[0].get("aliases"):
        questions = CANONICAL_SYMPTOMS.get(normalized[0]["feature"], {}).get("next_questions", [])
        if questions:
            return questions[0]
    missing = safety["missing_safety_context"]
    if "current_medications" in missing:
        return "What current medications, supplements, or herbs is the person taking?"
    if "pregnancy_status" in missing:
        return "Is pregnancy possible, current, or recently postpartum?"
    dimensions = {feature["dimension"] for feature in features}
    if "modality" not in dimensions:
        return "What makes the main symptom better or worse: heat, cold, motion, rest, pressure, food, or time of day?"
    if "digestion" not in dimensions:
        return "How are appetite, digestion, bloating, stool, and thirst?"
    return "Which symptom is most disruptive day to day, and how severe is it from 0 to 10?"


def synthesis_notes(candidates: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    top = [rows[0] for rows in candidates.values() if rows]
    shared_terms: dict[str, int] = {}
    for candidate in top:
        for feature in candidate["matched_features"]:
            shared_terms[feature] = shared_terms.get(feature, 0) + 1
    shared = sorted(term for term, count in shared_terms.items() if count >= 2)
    conflicts = []
    if not shared and len(top) >= 2:
        conflicts.append("Top candidates do not yet share enough matched features for strong cross-tradition agreement.")
    confidence = round(sum(item["confidence_score"] for item in top) / len(top), 2) if top else 0
    total = sum(max(item["confidence_score"], 0) for item in top)
    weighting = [
        {
            "tradition": item["tradition"],
            "direction": item["candidate_name"],
            "confidence_score": item["confidence_score"],
            "percentage": round((max(item["confidence_score"], 0) / total) * 100) if total else 0,
        }
        for item in top
    ]
    return {
        "shared_themes": shared,
        "areas_of_agreement": [
            f"Multiple traditions matched: {', '.join(shared)}"
        ] if shared else [],
        "areas_of_conflict": conflicts,
        "tradition_weighting": weighting,
        "confidence_score": confidence,
        "confidence_label": confidence_label(confidence),
        "note": "Synthesis compares matched reasoning features after tradition-specific retrieval; it does not merge traditions into one diagnosis or medical conclusion.",
    }


def practitioner_summary(
    intake: dict[str, Any],
    safety: dict[str, Any],
    candidates: dict[str, list[dict[str, Any]]],
    synthesis: dict[str, Any],
    next_question: str,
) -> dict[str, Any]:
    symptoms = intake.get("symptoms", {})
    top = {
        "ayurveda": candidates.get("Ayurveda", [{}])[0] if candidates.get("Ayurveda") else {},
        "tcm": candidates.get("Traditional Chinese Medicine", [{}])[0] if candidates.get("Traditional Chinese Medicine") else {},
        "homeopathy": candidates.get("Homeopathy", [{}])[0] if candidates.get("Homeopathy") else {},
    }
    directions = []
    for tradition, candidate in top.items():
        if candidate:
            directions.append(
                {
                    "tradition": tradition,
                    "direction": candidate.get("candidate_name", ""),
                    "confidence_score": candidate.get("confidence_score", 0),
                    "priority": candidate.get("priority", "exploratory"),
                }
            )
    return {
        "case_snapshot": symptoms.get("chief_complaint", "") or ", ".join(symptoms.get("primary_symptoms", [])),
        "key_symptom_clusters": {
            "primary": symptoms.get("primary_symptoms", []),
            "secondary": symptoms.get("secondary_symptoms", []),
            "duration": symptoms.get("duration", ""),
            "severity": symptoms.get("severity", ""),
        },
        "safety_status": safety["status"],
        "key_cautions": safety["notes"],
        "primary_traditional_directions": directions,
        "shared_themes": synthesis["shared_themes"],
        "confidence_summary": (
            "Prototype confidence is based on source-text relevance, citation quality, and how clearly the intake matches known pattern language."
        ),
        "next_best_question": next_question,
    }


def treatment_categories_for_candidate(
    tradition: str,
    candidate: dict[str, Any],
    safety_status: str,
    context_cautions: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    if not candidate:
        return []
    base = {
        "tradition": tradition,
        "why_this_matches": candidate.get("why_this_direction", []),
        "matched_case_features": candidate.get("matched_features", []),
        "missing_or_uncertain_features": candidate.get("missing_key_data", []),
        "contradictions": candidate.get("contradicting_features", []),
        "citations": candidate.get("supporting_citations", []),
        "confidence_score": candidate.get("confidence_score", 0),
        "practitioner_review_required": True,
    }
    hold = safety_status == "suppress"
    safety_notes = (
        ["Hold tradition-based suggestions until red-flag concern is medically assessed."]
        if hold
        else ["Keep this as a pattern-study direction until medications, pregnancy status, and other context are known."]
    )
    context_cautions = context_cautions or []
    priority = "hold_until_clarified" if hold else candidate.get("priority", "exploratory")

    if tradition == "Ayurveda":
        items = [
            ("diet", "Explore diet direction that supports digestion/agni and reduces symptom triggers."),
            ("lifestyle", "Explore daily routine, meal timing, sleep rhythm, and stress load."),
            ("herbs", "Use the Ayurveda herb category as a source-study lane until materia medica details are added."),
            ("formulas", "Use formula category as an explore-next lane after the pattern is clearer."),
            ("yoga_breath", "Explore gentle practice or breath categories when energy, dizziness, and tolerance are clear."),
        ]
    elif tradition == "Traditional Chinese Medicine":
        items = [
            ("formulas", "Use formula category as an explore-next lane after syndrome differentiation is clearer."),
            ("herbs", "Use the TCM herb category as a source-study lane until materia medica details are added."),
            ("diet", "Explore diet direction based on hot/cold, damp/dry, excess/deficiency logic."),
            ("lifestyle", "Explore sleep, pacing, stress, and environmental triggers."),
        ]
    else:
        items = [
            ("remedy_differential", "Explore remedy differentials after confirming modalities, generals, and peculiar symptoms."),
            ("rubric_cluster", "Explore repertory rubric clusters when the Boericke/Kent layer has a match."),
            ("modalities", "Confirm what reliably makes symptoms better or worse."),
            ("constitution_notes", "Explore generals, mental-emotional state, cravings/aversions, and thermal state."),
        ]

    return [
        {
            **base,
            "category": category,
            "direction": direction,
            "practitioner_action": direction,
            "client_facing_language": client_language_for_category(tradition, category),
            "safety_notes": safety_notes,
            "contraindications": category_contraindications(category, context_cautions),
            "review_priority": priority,
        }
        for category, direction in items
    ]


def client_language_for_category(tradition: str, category: str, specific_direction: str | None = None) -> str:
    if specific_direction:
        return (
            f"Use {specific_direction} as a source-backed {tradition} direction to explore against the full pattern."
        )
    if category in {"herbs", "formulas", "remedy_differential", "rubric_cluster"}:
        return (
            f"Use the {tradition} source material to study whether this category belongs in the pattern."
        )
    if category == "diet":
        return "Look at whether food timing, food qualities, or digestion patterns are part of the case."
    if category == "lifestyle":
        return "Look at daily rhythm, sleep, stress, activity, and recovery patterns."
    if category == "yoga_breath":
        return "Consider gentle practice categories once energy, breath comfort, and tolerance are clear."
    return "Use this category to clarify the traditional pattern before making choices."


def read_boericke(path: Path = BOERICKE_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def read_kent_repertory(path: Path = KENT_REPERTORY_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


REMEDY_CONCEPT_TERMS = {
    "sleep": {"sleep", "sleepless", "insomnia", "awakes", "waking", "drowsy", "dreams"},
    "digestion": {"digestion", "digestive", "dyspepsia", "stomach", "nausea", "appetite", "eructations", "vomit", "eating"},
    "bloating": {"bloating", "bloated", "flatulence", "distension", "gas", "abdomen"},
    "constipation": {"constipation", "stool", "rectum", "urging", "ineffectual"},
    "diarrhea": {"diarrhea", "diarrhoea", "stool", "evacuations"},
    "low_energy": {"energy", "fatigue", "weakness", "exhaustion", "wretched"},
    "irritability": {"irritable", "anger", "sullen", "fault-finding", "sensitive"},
    "anxiety": {"anxiety", "fear", "restless", "nervous"},
    "night_worse": {"night", "3 am", "morning", "worse morning", "worse, morning"},
    "cold_sensitivity": {"cold", "chilly", "chilled", "uncovered"},
    "pressure_better": {"pressure", "better pressure", "strong pressure"},
}


QUERY_CONCEPT_TRIGGERS = {
    "sleep": {"sleep", "asleep", "insomnia", "dream", "night"},
    "digestion": {"digestion", "digestive", "appetite", "stomach"},
    "bloating": {"bloating", "bloated", "gas", "distension"},
    "constipation": {"constipation", "stool", "urging"},
    "diarrhea": {"diarrhea", "diarrhoea", "loose"},
    "low_energy": {"energy", "fatigue", "tired", "weakness", "exhaustion"},
    "irritability": {"irritable", "irritability", "anger"},
    "anxiety": {"anxiety", "fear", "nervous", "restless"},
    "night_worse": {"night", "morning", "worse"},
    "cold_sensitivity": {"cold", "chilly"},
    "pressure_better": {"pressure"},
}


def concepts_from_query(terms: set[str]) -> set[str]:
    concepts = set()
    for concept, triggers in QUERY_CONCEPT_TRIGGERS.items():
        if terms & triggers:
            concepts.add(concept)
    return concepts


SECTION_WEIGHTS = {
    "Mind": 1.0,
    "Stomach": 1.35,
    "Abdomen": 1.25,
    "Stool": 1.2,
    "Sleep": 1.35,
    "Modalities": 1.3,
    "Fever": 0.9,
    "Skin": 0.85,
    "Respiratory": 0.85,
}

CONCEPT_SECTIONS = {
    "sleep": ["Sleep", "Mind"],
    "digestion": ["Stomach", "Abdomen"],
    "bloating": ["Stomach", "Abdomen"],
    "constipation": ["Stool", "Abdomen"],
    "diarrhea": ["Stool", "Abdomen"],
    "low_energy": ["Sleep", "Mind", "Stomach"],
    "irritability": ["Mind"],
    "anxiety": ["Mind", "Respiratory"],
    "night_worse": ["Sleep", "Modalities", "Fever"],
    "cold_sensitivity": ["Modalities", "Fever"],
    "pressure_better": ["Modalities", "Stomach"],
}


def compact_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_citation_id(chunk: dict[str, Any]) -> str:
    return chunk.get("chunk_id", "unknown").replace(":", "-").replace(" ", "-")


def source_backed_chunks(
    tradition: str,
    keywords: set[str],
    limit: int = 2,
    chunks_path: Path = CHUNKS_PATH,
) -> list[dict[str, Any]]:
    if not chunks_path.exists():
        return []
    ranked = []
    for chunk in read_jsonl(chunks_path):
        if chunk.get("tradition") != tradition:
            continue
        text = compact_text(" ".join([chunk.get("text", ""), chunk.get("section", ""), chunk.get("chapter", "")]))
        lowered = text.lower()
        if "no readable text" in lowered or "ocr ran on this scanned page" in lowered:
            continue
        matches = sorted(keyword for keyword in keywords if keyword in lowered)
        if not matches:
            continue
        locator_bonus = 6 if chunk.get("stable_locator") and chunk.get("page_start") is not None else 0
        ranked.append((len(matches) * 10 + locator_bonus, matches, chunk))
    return [
        {**chunk, "_matched_keywords": matches}
        for _, matches, chunk in sorted(ranked, key=lambda item: item[0], reverse=True)[:limit]
    ]


AYURVEDA_DIRECTION_RULES = [
    {
        "category": "diet",
        "direction": "Review agni-supporting diet direction focused on regular meals, digestibility, and avoiding overload.",
        "triggers": {"variable_or_weak_agni", "digestion", "bloating", "appetite"},
        "keywords": {"agni", "digestion", "diet", "food", "appetite"},
        "action": "Review whether the case points toward weak or variable agni and whether meal timing, food quality, and digestive load are relevant educational considerations.",
    },
    {
        "category": "lifestyle",
        "direction": "Review vata-calming routine direction around regular sleep, meals, rest, and nervous-system steadiness.",
        "triggers": {"vata", "sleep", "night_worse", "anxiety", "restless"},
        "keywords": {"vata", "sleep", "night", "daily regimen", "routine"},
        "action": "Review whether irregularity, night aggravation, poor sleep, or variable digestion suggests a vata-calming routine category.",
    },
    {
        "category": "diet",
        "direction": "Review ama-reducing food and routine category when heaviness, coating, sluggishness, bloating, or low energy are present.",
        "triggers": {"possible_ama", "low_energy", "bloating"},
        "keywords": {"ama", "undigested", "digestion", "food", "light"},
        "action": "Explore whether the case has enough signs of ama or incomplete digestion to try a lighter, simpler diet category as a study direction.",
    },
    {
        "category": "yoga_breath",
        "direction": "Explore gentle grounding breath or practice category when symptoms, capacity, and tolerance allow.",
        "triggers": {"vata", "sleep", "anxiety", "low_energy"},
        "keywords": {"vata", "sleep", "regimen", "mind", "body"},
        "action": "Explore gentle practice as supportive pattern education after dizziness, breath comfort, and tolerance are clear.",
    },
    {
        "category": "herbs",
        "direction": "Use Ayurveda digestive herb category as an explore-next lane after Dravyaguna or materia medica support is available.",
        "triggers": {"variable_or_weak_agni", "possible_ama", "bloating", "appetite"},
        "keywords": {"agni", "appetite", "digests", "undigested", "drug"},
        "action": "Hold specific herb selection until materia medica detail, medications, pregnancy status, and user context are known.",
    },
    {
        "category": "formulas",
        "direction": "Hold formula selection until pattern clarity and source support are stronger.",
        "triggers": {"vata", "pitta", "kapha", "variable_or_weak_agni", "possible_ama"},
        "keywords": {"treatment", "therapy", "dosas", "agni", "sodhana", "samana"},
        "action": "Use formula direction as a placeholder for later pattern refinement, not as a named formula yet.",
    },
]


def ayurveda_case_tags(packet: dict[str, Any], terms: set[str]) -> set[str]:
    tags = set(packet.get("possible_dosha_flags", []))
    tags.update(packet.get("agni_flags", []))
    tags.update(packet.get("ama_signs", []))
    if terms & {"sleep", "insomnia", "asleep"}:
        tags.add("sleep")
    if terms & {"night", "worse"}:
        tags.add("night_worse")
    if terms & {"digestion", "digestive", "stomach"}:
        tags.add("digestion")
    if terms & {"bloating", "gas", "flatulence"}:
        tags.add("bloating")
    if terms & {"appetite", "hunger"}:
        tags.add("appetite")
    if terms & {"energy", "fatigue", "tired", "weakness"}:
        tags.add("low_energy")
    if terms & {"anxiety", "restless"}:
        tags.add("anxiety")
    return tags


def ayurveda_treatment_directions(
    query: str,
    ayurveda_packet: dict[str, Any],
    safety_status: str,
    context_cautions: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    context_cautions = context_cautions or []
    terms = query_terms(query)
    tags = ayurveda_case_tags(ayurveda_packet, terms)
    hold = safety_status == "suppress"
    directions = []
    for rule in AYURVEDA_DIRECTION_RULES:
        trigger_matches = sorted(tags & rule["triggers"])
        if not trigger_matches and not hold:
            continue
        evidence = source_backed_chunks("Ayurveda", rule["keywords"], limit=2)
        citations = [chunk_citation_id(chunk) for chunk in evidence]
        evidence_notes = [
            f"{chunk.get('book', chunk.get('title', 'Ayurveda source'))} {chunk.get('stable_locator', '')}: matched {', '.join(chunk.get('_matched_keywords', []))}"
            for chunk in evidence
        ]
        base_score = 42 if hold else 58 + min(len(trigger_matches) * 6, 18) + min(len(citations) * 4, 8)
        directions.append(
            {
                "tradition": "Ayurveda",
                "category": rule["category"],
                "direction": rule["direction"],
                "practitioner_action": rule["action"],
                "client_facing_language": client_language_for_category("Ayurveda", rule["category"]),
                "why_this_matches": [
                    f"Inferred Ayurveda tags: {', '.join(trigger_matches) if trigger_matches else 'held for safety review'}",
                    *evidence_notes[:2],
                ],
                "matched_case_features": trigger_matches,
                "missing_or_uncertain_features": ayurveda_packet.get("missing_questions", []),
                "contradictions": [],
                "citations": citations,
                "confidence_score": min(84.0, round(base_score, 2)),
                "practitioner_review_required": True,
                "safety_notes": (
                    ["Hold tradition-based suggestions until red-flag concern is medically assessed."]
                    if hold
                    else ["Keep this as a pattern-study direction until medications, pregnancy status, and other context are known."]
                ),
                "contraindications": category_contraindications(rule["category"], context_cautions),
                "review_priority": "hold_until_clarified"
                if hold
                else "review_first"
                if base_score >= 72
                else "review_second"
                if base_score >= 60
                else "exploratory",
                "source_url": evidence[0].get("source_url", "") if evidence else "",
                "source": evidence[0].get("title", "Ayurveda source") if evidence else "Ayurveda source",
                "text_preview": compact_text(evidence[0].get("text", ""))[:420] if evidence else "",
            }
        )
    return sorted(directions, key=lambda item: item["confidence_score"], reverse=True)


TCM_DIRECTION_RULES = [
    {
        "category": "diet",
        "direction": "Review a spleen-qi/dampness-informed diet direction focused on digestibility, regular meals, and reducing heavy or damp-aggravating inputs.",
        "triggers": {"spleen_qi_or_damp_tendency", "digestion", "bloating", "low_energy"},
        "keywords": {"food", "drinking", "moderate", "qi", "dampness", "stomach"},
        "action": "Explore whether low energy, bloating, poor appetite, heaviness, or loose stool language suggests a TCM diet category.",
    },
    {
        "category": "lifestyle",
        "direction": "Review sleep, rest-activity rhythm, and spirit/qi regulation as a source-backed lifestyle category.",
        "triggers": {"shen_sleep_involvement", "sleep", "anxiety", "night_worse"},
        "keywords": {"spirit", "sleep", "resting", "qi", "heart", "peace"},
        "action": "Review whether sleep disturbance, anxiety, restlessness, or night timing makes lifestyle rhythm and shen-settling education relevant.",
    },
    {
        "category": "formulas",
        "direction": "Hold formula selection until syndrome differentiation, tongue, pulse, medication status, and contraindications are clearer.",
        "triggers": {"spleen_qi_or_damp_tendency", "liver_qi_constraint_tendency", "heat_tendency", "cold_tendency", "shen_sleep_involvement"},
        "keywords": {"qi", "yin", "yang", "heat", "cold", "depletion", "repletion"},
        "action": "Use formula category as a later refinement lane; do not present a named formula until stronger formula-source detail exists.",
    },
    {
        "category": "herbs",
        "direction": "Hold TCM herb selection until materia medica support and user-context review are available.",
        "triggers": {"spleen_qi_or_damp_tendency", "heat_tendency", "cold_tendency", "shen_sleep_involvement"},
        "keywords": {"qi", "yin", "yang", "heat", "cold", "stomach", "heart"},
        "action": "Keep the herb category in explore-next until materia medica detail, medications, and pregnancy status are known.",
    },
    {
        "category": "acupuncture_moxibustion",
        "direction": "Explore acupuncture or moxibustion category as a pattern-management strategy after fuller TCM assessment.",
        "triggers": {"cold_tendency", "spleen_qi_or_damp_tendency", "liver_qi_constraint_tendency", "shen_sleep_involvement"},
        "keywords": {"channel", "qi", "cold", "heat", "depletion", "repletion"},
        "action": "Explore whether channel, cold/heat, excess/deficiency, and shen signs point toward an acupuncture or moxibustion lane.",
    },
]


def tcm_case_tags(packet: dict[str, Any], terms: set[str]) -> set[str]:
    tags = set(packet.get("possible_pattern_flags", []))
    if terms & {"sleep", "insomnia", "asleep", "dream", "night"}:
        tags.add("sleep")
    if terms & {"anxiety", "restless", "fear"}:
        tags.add("anxiety")
    if terms & {"night", "worse"}:
        tags.add("night_worse")
    if terms & {"digestion", "digestive", "stomach", "appetite"}:
        tags.add("digestion")
    if terms & {"bloating", "gas", "distension"}:
        tags.add("bloating")
    if terms & {"energy", "fatigue", "tired", "weakness"}:
        tags.add("low_energy")
    return tags


def tcm_treatment_directions(
    query: str,
    tcm_packet: dict[str, Any],
    safety_status: str,
    context_cautions: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    context_cautions = context_cautions or []
    terms = query_terms(query)
    tags = tcm_case_tags(tcm_packet, terms)
    hold = safety_status == "suppress"
    directions = []
    for rule in TCM_DIRECTION_RULES:
        trigger_matches = sorted(tags & rule["triggers"])
        if not trigger_matches and not hold:
            continue
        evidence = source_backed_chunks("Traditional Chinese Medicine", rule["keywords"], limit=2)
        citations = [chunk_citation_id(chunk) for chunk in evidence]
        evidence_notes = [
            f"{chunk.get('book', chunk.get('title', 'TCM source'))} {chunk.get('stable_locator', '')}: matched {', '.join(chunk.get('_matched_keywords', []))}"
            for chunk in evidence
        ]
        base_score = 40 if hold else 54 + min(len(trigger_matches) * 6, 18) + min(len(citations) * 4, 8)
        directions.append(
            {
                "tradition": "Traditional Chinese Medicine",
                "category": rule["category"],
                "direction": rule["direction"],
                "practitioner_action": rule["action"],
                "client_facing_language": client_language_for_category("Traditional Chinese Medicine", rule["category"]),
                "why_this_matches": [
                    f"Inferred TCM tags: {', '.join(trigger_matches) if trigger_matches else 'held for safety review'}",
                    *evidence_notes[:2],
                ],
                "matched_case_features": trigger_matches,
                "missing_or_uncertain_features": tcm_packet.get("missing_questions", []),
                "contradictions": [],
                "citations": citations,
                "confidence_score": min(82.0, round(base_score, 2)),
                "practitioner_review_required": True,
                "safety_notes": (
                    ["Hold tradition-based suggestions until red-flag concern is medically assessed."]
                    if hold
                    else ["Keep this as a pattern-study direction until medications, pregnancy status, and other context are known."]
                ),
                "contraindications": category_contraindications(rule["category"], context_cautions),
                "review_priority": "hold_until_clarified"
                if hold
                else "review_first"
                if base_score >= 72
                else "review_second"
                if base_score >= 60
                else "exploratory",
                "source_url": evidence[0].get("source_url", "") if evidence else "",
                "source": evidence[0].get("title", "TCM source") if evidence else "TCM source",
                "text_preview": compact_text(evidence[0].get("text", ""))[:420] if evidence else "",
            }
        )
    return sorted(directions, key=lambda item: item["confidence_score"], reverse=True)


COMMON_KENT_ABBREVIATIONS = {
    "abies nigra": ["abies-n"],
    "aconitum napellus": ["acon"],
    "aesculus hippocastanum": ["aesc"],
    "aloe socotrina": ["aloe"],
    "alumina": ["alum"],
    "ambra grisea": ["ambr"],
    "anacardium orientale": ["anac"],
    "antimonium crudum": ["ant-c"],
    "antimonium tartaricum": ["ant-t"],
    "apis mellifica": ["apis"],
    "argentum nitricum": ["arg-n"],
    "arnica montana": ["arn"],
    "arsenicum album": ["ars"],
    "baryta carbonica": ["bar-c"],
    "belladonna": ["bell"],
    "borax veneta": ["bor"],
    "bryonia alba": ["bry"],
    "calcarea carbonica": ["calc"],
    "carbo vegetabilis": ["carb-v"],
    "causticum": ["caust"],
    "chamomilla": ["cham"],
    "china officinalis": ["chin"],
    "cinchona officinalis": ["chin"],
    "cocculus indicus": ["cocc"],
    "coffea cruda": ["coff"],
    "colocynthis": ["coloc"],
    "conium maculatum": ["con"],
    "graphites": ["graph"],
    "hepar sulphuris calcareum": ["hep"],
    "hyoscyamus niger": ["hyos"],
    "ignatia amara": ["ign"],
    "kali carbonicum": ["kali-c"],
    "lachesis mutus": ["lach"],
    "lycopodium clavatum": ["lyc"],
    "magnesia carbonica": ["mag-c"],
    "magnesia muriatica": ["mag-m"],
    "mercurius solubilis": ["merc"],
    "natrum muriaticum": ["nat-m"],
    "nitric acid": ["nit-ac"],
    "nux vomica": ["nux-v"],
    "opium": ["op"],
    "phosphoric acid": ["ph-ac"],
    "phosphorus": ["phos"],
    "pulsatilla": ["puls"],
    "rhus toxicodendron": ["rhus-t"],
    "sepia": ["sep"],
    "silicea": ["sil"],
    "staphysagria": ["staph"],
    "sulphur": ["sulph"],
    "thuja occidentalis": ["thuj"],
    "zincum metallicum": ["zinc"],
}


def normalized_remedy_name(remedy: str) -> str:
    base = remedy.split("--", 1)[0].split("-", 1)[0]
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z\s]", " ", base).lower()).strip()


def kent_abbreviation_candidates(remedy: dict[str, Any]) -> list[str]:
    name = normalized_remedy_name(remedy.get("remedy", ""))
    if not name:
        return []
    candidates = set(COMMON_KENT_ABBREVIATIONS.get(name, []))
    parts = name.split()
    if parts:
        candidates.add(parts[0][:4])
        candidates.add(parts[0][:3])
    if len(parts) >= 2:
        candidates.add(f"{parts[0][:4]}-{parts[1][0]}")
        candidates.add(f"{parts[0][:3]}-{parts[1][0]}")
    return sorted(item for item in candidates if len(item) >= 3)


def concept_evidence(remedy: dict[str, Any], concept: str) -> list[dict[str, str]]:
    sections = remedy.get("sections", {})
    terms = REMEDY_CONCEPT_TERMS[concept]
    evidence = []
    for section_name in CONCEPT_SECTIONS.get(concept, []):
        section_text = compact_text(sections.get(section_name, ""))
        lowered = section_text.lower()
        matched_terms = sorted(term for term in terms if term in lowered)
        if not matched_terms:
            continue
        sentence = section_text
        for part in re.split(r"(?<=[.!?])\s+", section_text):
            if any(term in part.lower() for term in matched_terms):
                sentence = part
                break
        evidence.append(
            {
                "section": section_name,
                "matched_terms": ", ".join(matched_terms[:4]),
                "snippet": sentence[:240],
            }
        )
    return evidence


def score_remedy(remedy: dict[str, Any], terms: set[str]) -> tuple[float, list[str], list[dict[str, str]], float]:
    sections = remedy.get("sections", {})
    text_parts = [remedy.get("remedy", ""), remedy.get("common_name", ""), remedy.get("text", "")]
    for name in ["Mind", "Stomach", "Abdomen", "Stool", "Sleep", "Modalities", "Skin", "Respiratory", "Fever"]:
        text_parts.append(sections.get(name, ""))
    text = " ".join(text_parts).lower()
    query_concepts = concepts_from_query(terms)
    concept_matches = []
    evidence_rows = []
    for concept in query_concepts:
        evidence = concept_evidence(remedy, concept)
        if evidence or any(term in text for term in REMEDY_CONCEPT_TERMS[concept]):
            concept_matches.append(concept)
            evidence_rows.extend({**row, "concept": concept} for row in evidence[:2])
    if not concept_matches:
        return 0.0, [], [], 0.0
    weights = {
        "digestion": 20,
        "bloating": 18,
        "sleep": 18,
        "constipation": 18,
        "diarrhea": 16,
        "low_energy": 10,
        "irritability": 14,
        "anxiety": 14,
        "night_worse": 8,
        "cold_sensitivity": 8,
        "pressure_better": 8,
    }
    raw_score = 0.0
    for concept in concept_matches:
        evidence = [row for row in evidence_rows if row["concept"] == concept]
        if evidence:
            best_section_weight = max(SECTION_WEIGHTS.get(row["section"], 0.75) for row in evidence)
        else:
            best_section_weight = 0.65
        raw_score += weights.get(concept, 8) * best_section_weight

    section_bonus = 0
    if sections.get("Stomach") and {"digestion", "bloating"} & set(concept_matches):
        section_bonus += 10
    if sections.get("Sleep") and "sleep" in concept_matches:
        section_bonus += 8
    if sections.get("Modalities") and {"night_worse", "cold_sensitivity", "pressure_better"} & set(concept_matches):
        section_bonus += 8
    specificity_bonus = min(len(evidence_rows) * 2.5, 15)
    score = (raw_score * 0.55) + section_bonus + specificity_bonus
    if {"digestion", "bloating", "sleep"} <= set(concept_matches):
        score += 6
    # Boericke-only remedy directions are useful differentials, but not final remedy selection.
    # Keep displayed confidence below "strong" until repertory rubrics and full case generals are included.
    display_score = min(84.0, score * 0.68)
    return display_score, sorted(concept_matches), evidence_rows[:6], score


def boericke_remedy_differentials(
    query: str,
    limit: int = 5,
    context_cautions: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    remedies = read_boericke()
    terms = query_terms(query)
    context_cautions = context_cautions or []
    results = []
    for remedy in remedies:
        score, matches, evidence, rank_score = score_remedy(remedy, terms)
        if score <= 0:
            continue
        sections = remedy.get("sections", {})
        abbreviations = kent_abbreviation_candidates(remedy)
        evidence_text = [
            f"{row['concept']} / {row['section']}: {row['snippet']}"
            for row in evidence
            if row.get("snippet")
        ]
        results.append(
            {
                "tradition": "Homeopathy",
                "category": "remedy_differential",
                "direction": f"Review {remedy['remedy']} as a remedy differential",
                "practitioner_action": (
                    f"Review {remedy['remedy']} in Boericke against confirmed modalities, generals, and peculiar symptoms."
                ),
                "client_facing_language": client_language_for_category("Homeopathy", "remedy_differential", remedy["remedy"]),
                "why_this_matches": [f"Matched Boericke concepts: {', '.join(matches)}", *evidence_text[:3]],
                "matched_case_features": matches,
                "remedy_abbreviations": abbreviations,
                "kent_supporting_rubrics": [],
                "missing_or_uncertain_features": ["Confirm modalities, generals, and peculiar symptoms before remedy selection."],
                "contradictions": [],
                "citations": [remedy["chunk_id"].replace(":", "-")],
                "confidence_score": round(score, 2),
                "safety_notes": ["Use this as a remedy-study clue only; confirm modalities, generals, and peculiar symptoms before narrowing."],
                "contraindications": category_contraindications("remedy_differential", context_cautions),
                "review_priority": "review_first" if score >= 72 else "review_second" if score >= 48 else "exploratory",
                "source_url": remedy.get("source_url", ""),
                "source": remedy.get("title", "Boericke"),
                "text_preview": compact_text(" ".join(
                    part for part in [sections.get("Stomach", ""), sections.get("Sleep", ""), sections.get("Modalities", "")]
                    if part
                ))[:420],
                "_rank_score": rank_score,
            }
        )
    ranked = sorted(results, key=lambda item: item["_rank_score"], reverse=True)[:limit]
    for item in ranked:
        item.pop("_rank_score", None)
    return ranked


KENT_QUERY_EXPANSIONS = {
    "sleep": {"sleep", "sleeplessness", "sleepless", "waking", "wakeful", "dreams", "disturbed"},
    "asleep": {"sleep", "falling asleep", "sleeplessness"},
    "night": {"night", "midnight", "3 a.m.", "after 3 a.m."},
    "morning": {"morning", "waking"},
    "appetite": {"appetite", "hunger", "hungry", "satiety"},
    "digestion": {"stomach", "appetite", "hunger", "nausea", "eructations", "dyspepsia"},
    "bloating": {"distension", "flatulence", "flatus", "bloated"},
    "stool": {"stool", "constipation", "diarrhoea", "diarrhea"},
    "constipation": {"constipation", "stool", "ineffectual"},
    "diarrhea": {"diarrhoea", "diarrhea", "stool"},
    "anxiety": {"anxiety", "fear", "anguish"},
}

KENT_SECTION_TARGETS = {
    "Sleep": {"sleep", "asleep", "night", "morning"},
    "Stomach": {"appetite", "digestion", "bloating", "nausea", "stomach"},
    "Stool": {"stool", "constipation", "diarrhea"},
    "Mind": {"anxiety", "fear", "irritability", "anger"},
    "Generalities": {"night", "morning", "weakness", "cold", "heat"},
}

KENT_ROOT_ALLOWLIST = {
    "Sleep": {
        "SLEEPLESSNESS",
        "SLEEP",
        "WAKING",
        "UNREFRESHING",
        "DREAMS",
        "DROWSINESS",
        "SLEEPINESS",
        "WAKES",
    },
    "Stomach": {
        "APPETITE",
        "STOMACH",
        "HUNGER",
        "NAUSEA",
        "ERUCTATIONS",
        "VOMITING",
        "THIRST",
        "DYSPEPSIA",
    },
    "Stool": {"STOOL", "CONSTIPATION", "DIARRHOEA", "DIARRHEA"},
    "Mind": {"ANXIETY", "FEAR", "IRRITABILITY", "ANGER", "RESTLESSNESS", "SADNESS"},
    "Generalities": {"WEAKNESS", "CHILLINESS", "HEAT", "COLDNESS", "WEARINESS"},
}


def kent_rubric_root(rubric: dict[str, Any]) -> str:
    path = rubric.get("rubric_path") or rubric.get("rubric") or ""
    return path.split(">", 1)[0].split(",", 1)[0].strip().upper()


def kent_rubric_is_relevant(rubric: dict[str, Any], terms: set[str]) -> bool:
    section = rubric.get("section", "")
    root = kent_rubric_root(rubric)
    allowed_roots = KENT_ROOT_ALLOWLIST.get(section)
    if allowed_roots and root not in allowed_roots:
        return False
    if section == "Generalities" and not (terms & {"fatigue", "weakness", "tired", "cold", "heat", "hot", "chilly"}):
        return False
    if root == "DREAMS" and not (terms & {"dream", "dreams"}):
        return False
    if root == "WAKING" and not (terms & {"waking", "wake", "awakes", "asleep", "sleep"}):
        return False
    if root in {"SLEEPLESSNESS", "SLEEP", "UNREFRESHING"} and not (terms & {"sleep", "asleep", "insomnia", "sleepless", "night"}):
        return False
    return True


def kent_query_terms(terms: set[str]) -> set[str]:
    ignore = {"low", "poor", "variable", "difficulty", "discomfort", "disturbance", "staying", "digestive", "energy"}
    expanded = {term for term in terms if term not in ignore}
    for term in terms:
        expanded.update(KENT_QUERY_EXPANSIONS.get(term, set()))
    return {term for term in expanded if len(term) > 2}


def score_kent_rubric(rubric: dict[str, Any], terms: set[str]) -> tuple[float, list[str]]:
    if not kent_rubric_is_relevant(rubric, terms):
        return 0.0, []
    text = " ".join([rubric.get("section", ""), rubric.get("rubric", ""), rubric.get("rubric_path", ""), rubric.get("text", "")]).lower()
    section = rubric.get("section", "")
    expanded_terms = kent_query_terms(terms)
    matched = sorted(term for term in expanded_terms if term in text)
    if not matched:
        return 0.0, []
    target_terms = KENT_SECTION_TARGETS.get(section, set())
    if section == "Generalities" and not ({term for term in terms if term in target_terms} & target_terms):
        return 0.0, []
    section_bonus = 0
    if {term for term in terms if term in target_terms}:
        section_bonus = 18
    elif section in {"Sleep", "Stomach", "Stool", "Mind"}:
        section_bonus = 8
    remedy_count = len(rubric.get("remedy_abbreviations", []))
    specificity = 14 if remedy_count <= 12 else 8 if remedy_count <= 30 else 2
    exact_case_matches = sorted(term for term in terms if term in text and term not in {"low", "poor"})
    root_bonus = 12 if kent_rubric_root(rubric) in KENT_ROOT_ALLOWLIST.get(section, set()) else 0
    score = min(84.0, (len(matched) * 10) + (len(exact_case_matches) * 10) + section_bonus + specificity + root_bonus)
    if section == "Generalities":
        score = min(score, 68.0)
    return score, matched


def kent_rubric_clusters(
    query: str,
    limit: int = 6,
    context_cautions: list[dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    rubrics = read_kent_repertory()
    terms = query_terms(query)
    context_cautions = context_cautions or []
    results = []
    seen = set()
    for rubric in rubrics:
        score, matches = score_kent_rubric(rubric, terms)
        if score <= 0:
            continue
        dedupe_key = (rubric.get("section", ""), rubric.get("rubric_path", ""), rubric.get("text", ""))
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        remedies = rubric.get("remedy_abbreviations", [])
        page = rubric.get("page_start")
        results.append(
            {
                "tradition": "Homeopathy",
                "category": "rubric_cluster",
                "direction": f"Review Kent rubric: {rubric.get('rubric_path', rubric.get('rubric', 'Unknown rubric'))}",
                "practitioner_action": (
                    f"Compare this Kent rubric against the case totality and cross-check listed remedies: {', '.join(remedies[:12])}."
                ),
                "client_facing_language": (
                    "Use this repertory rubric as a symptom-index clue. It is not a remedy choice by itself."
                ),
                "remedy_abbreviations": remedies,
                "why_this_matches": [
                    f"Matched intake terms in Kent rubric: {', '.join(matches)}",
                    f"Section: {rubric.get('section', 'Unknown')}; page: {page or 'unknown'}",
                ],
                "matched_case_features": matches,
                "missing_or_uncertain_features": ["Confirm repertory wording, modalities, generals, and peculiar symptoms."],
                "contradictions": [],
                "citations": [rubric["chunk_id"].replace(":", "-")],
                "confidence_score": round(score, 2),
                "safety_notes": ["Use repertory rubrics as map points; the total pattern still needs confirmation."],
                "contraindications": category_contraindications("rubric_cluster", context_cautions),
                "review_priority": "review_second" if score >= 58 else "exploratory",
                "source_url": rubric.get("source_url", ""),
                "source": rubric.get("title", "Kent's Repertory"),
                "text_preview": compact_text(rubric.get("text", ""))[:420],
                "_section": rubric.get("section", ""),
            }
        )
    section_priority = {"Sleep": 5, "Stomach": 4, "Stool": 4, "Mind": 3, "Generalities": 1}
    ranked = sorted(
        results,
        key=lambda item: (item["confidence_score"], section_priority.get(item.get("_section", ""), 0)),
        reverse=True,
    )[:limit]
    for item in ranked:
        item.pop("_section", None)
    return ranked


def attach_kent_support_to_remedies(
    remedy_differentials: list[dict[str, Any]],
    rubric_clusters: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    for remedy in remedy_differentials:
        abbreviations = set(remedy.get("remedy_abbreviations", []))
        support = []
        for rubric in rubric_clusters:
            rubric_remedies = set(rubric.get("remedy_abbreviations", []))
            if abbreviations & rubric_remedies:
                support.append(
                    {
                        "rubric": rubric["direction"].replace("Review Kent rubric: ", ""),
                        "citation": rubric["citations"][0] if rubric.get("citations") else "",
                        "matched_abbreviations": sorted(abbreviations & rubric_remedies),
                    }
                )
        if support:
            remedy["kent_supporting_rubrics"] = support[:4]
            remedy["why_this_matches"].append(f"Kent cross-support: {len(support[:4])} matching rubric(s)")
            remedy["confidence_score"] = min(84.0, round(remedy["confidence_score"] + min(len(support) * 3, 9), 2))
            remedy["review_priority"] = "review_first" if remedy["confidence_score"] >= 72 else remedy["review_priority"]
    return remedy_differentials


def treatment_plan_draft(
    candidates: dict[str, list[dict[str, Any]]],
    safety_status: str,
    query: str = "",
    context_cautions: list[dict[str, str]] | None = None,
    evaluation_packets: dict[str, Any] | None = None,
) -> dict[str, Any]:
    context_cautions = context_cautions or []
    evaluation_packets = evaluation_packets or {}
    top_by_tradition = {
        "Ayurveda": candidates.get("Ayurveda", [])[:1],
        "Traditional Chinese Medicine": candidates.get("Traditional Chinese Medicine", [])[:1],
        "Homeopathy": candidates.get("Homeopathy", [])[:1],
    }
    if not any(top_by_tradition.values()):
        return {
            "scope": "Source-based pattern direction draft.",
            "ayurveda": [],
            "tcm": [],
            "homeopathy": [],
        }
    homeopathy_categories = (
        treatment_categories_for_candidate("Homeopathy", top_by_tradition["Homeopathy"][0], safety_status, context_cautions)
        if top_by_tradition["Homeopathy"]
        else []
    )
    if safety_status != "suppress":
        remedy_differentials = boericke_remedy_differentials(query, context_cautions=context_cautions)
        rubric_clusters = kent_rubric_clusters(query, context_cautions=context_cautions)
        remedy_differentials = attach_kent_support_to_remedies(remedy_differentials, rubric_clusters)
        if remedy_differentials:
            homeopathy_categories = remedy_differentials + homeopathy_categories
        if rubric_clusters:
            insert_at = len(remedy_differentials) if remedy_differentials else 0
            homeopathy_categories = homeopathy_categories[:insert_at] + rubric_clusters + homeopathy_categories[insert_at:]

    ayurveda_categories = (
        ayurveda_treatment_directions(
            query,
            evaluation_packets.get("ayurveda", {}),
            safety_status,
            context_cautions,
        )
        if query
        else []
    )
    if not ayurveda_categories and top_by_tradition["Ayurveda"]:
        ayurveda_categories = treatment_categories_for_candidate(
            "Ayurveda",
            top_by_tradition["Ayurveda"][0],
            safety_status,
            context_cautions,
        )

    tcm_categories = (
        tcm_treatment_directions(
            query,
            evaluation_packets.get("tcm", {}),
            safety_status,
            context_cautions,
        )
        if query
        else []
    )
    if not tcm_categories and top_by_tradition["Traditional Chinese Medicine"]:
        tcm_categories = treatment_categories_for_candidate(
            "Traditional Chinese Medicine",
            top_by_tradition["Traditional Chinese Medicine"][0],
            safety_status,
            context_cautions,
        )

    return {
        "scope": "Source-based pattern direction draft.",
        "ayurveda": ayurveda_categories,
        "tcm": tcm_categories,
        "homeopathy": homeopathy_categories,
    }


def client_teaching_sequence(summary: dict[str, Any], plan: dict[str, Any], safety: dict[str, Any]) -> list[dict[str, str]]:
    if safety["status"] == "suppress":
        return [
            {
                "step": "Safety first",
                "teaching": "Some symptoms can signal something urgent. It is safer to get medical evaluation before interpreting this traditionally.",
            },
            {
                "step": "After safety is clear",
                "teaching": "Once immediate concerns are ruled out, the traditional pattern information becomes easier to interpret responsibly.",
            },
        ]
    return [
        {
            "step": "What we are noticing",
            "teaching": f"The main concern appears to be {summary.get('case_snapshot') or 'the symptom pattern described'} with related context that may involve sleep, digestion, energy, mood, or modalities.",
        },
        {
            "step": "How this is understood traditionally",
            "teaching": "The system is comparing separate traditional maps rather than forcing them into one diagnosis.",
        },
        {
            "step": "Why categories may be relevant",
            "teaching": "The wellness direction draft groups educational possibilities such as diet, lifestyle, herbs, formulas, remedy differentials, or practices so the pattern can be refined without overwhelming you.",
        },
        {
            "step": "What needs review",
            "teaching": "Medication use, pregnancy status, known conditions, contraindications, and missing pattern details should be clarified before any action is chosen.",
        },
        {
            "step": "What to watch for",
            "teaching": "Track what changes first: symptom intensity, frequency, sleep, digestion, mood, energy, or any adverse reaction.",
        },
    ]


def plan_items(plan: dict[str, Any]) -> list[dict[str, Any]]:
    items = []
    for tradition in ["ayurveda", "tcm", "homeopathy"]:
        for item in plan.get(tradition, []):
            items.append({**item, "tradition_key": tradition})
    return items


ACTION_CATEGORY_GROUPS = {
    "concrete": {"herbs", "formulas", "remedy_differential", "rubric_cluster"},
    "action": {
        "diet",
        "lifestyle",
        "yoga_breath",
        "acupuncture_moxibustion",
        "modalities",
        "constitution_notes",
        "sleep",
        "breathwork",
        "movement",
        "meditation",
        "avoid_reduce",
        "observation",
        "practitioner_follow_up",
    },
}


SYMPTOM_OUTCOME_PROFILES: dict[str, dict[str, Any]] = {
    "fatigue": {
        "summary": "Low energy looks most useful when it is organized by timing: morning energy, post-meal crashes, recovery after sleep, and whether movement restores or drains the person.",
        "signals": ["energy pattern", "sleep relationship", "digestion relationship", "stress load"],
        "tradition_directions": [
            ("Ayurveda", "Use the available Ayurveda canon to review whether low energy clusters with weak/variable digestion, ama-like heaviness, vata irregularity, or kapha sluggishness before choosing diet, routine, herbs, or formulas."),
            ("Traditional Chinese Medicine", "Use the Huangdi Neijing layer to review qi, rest-activity rhythm, digestion, and deficiency/excess clues before any formula or herb direction is considered."),
            ("Homeopathy", "Use Organon method, Boericke materia medica, and Kent repertory support to clarify the totality: generals, modalities, mental-emotional state, thermal state, and what changes the fatigue."),
        ],
        "actions": [
            ("diet", "For the next 3 days, compare energy after a warm simple breakfast versus skipped breakfast or coffee-only mornings. Note whether energy is steadier with food rhythm."),
            ("sleep", "Track whether sleep actually restores energy: bedtime, waking time, night waking, dreams, and morning heaviness."),
            ("movement", "Use a 10-15 minute easy walk as a test. If energy improves afterward, movement may be supportive; if there is next-day depletion, keep intensity lower."),
            ("observation", "Log energy at waking, late morning, after lunch, mid-afternoon, and after exertion. The strongest dip is the first pattern clue."),
            ("lifestyle", "Create one steady anchor for 3 days: same wake time, same first meal window, and one short outdoor walk."),
        ],
        "review": [
            ("herbs", "If the pattern is clearly digestive heaviness, low appetite, or post-meal fatigue, digestive/supportive herb categories can be explored after the missing action books are added."),
            ("remedy_differential", "Homeopathic review should compare remedies around fatigue after eating, morning heaviness, poor recovery from sleep, and what improves or worsens energy."),
        ],
    },
    "headache": {
        "summary": "Headache becomes more useful when organized by exact location, sensation, timing, food/caffeine relationship, sleep relationship, stress pattern, and heat/cold sensitivity.",
        "signals": ["pain location", "pain quality", "trigger pattern", "safety screen"],
        "tradition_directions": [
            ("Ayurveda", "Use the available Ayurveda canon to review headache through digestion/agni, heat/cold, dryness, sleep, routine, and dosha-pattern clues after urgent causes are screened out."),
            ("Traditional Chinese Medicine", "Use Huangdi Neijing source support to review headache through location, timing, heat/cold, qi movement, sleep, digestion, and channel-style relationships before herbs or formulas."),
            ("Homeopathy", "Use Kent rubrics and Boericke materia medica only after location, sensation, modalities, timing, concomitants, and peculiar features are clarified."),
        ],
        "actions": [
            ("observation", "Create a headache map: location, sensation, time started, what was eaten, caffeine change, sleep quality, stress level, light sensitivity, nausea, and what helped."),
            ("avoid_reduce", "For one test cycle, reduce the most likely aggravator: skipped meals, dehydration, alcohol, excess screen strain, jaw tension, or late-night work."),
            ("sleep", "Check whether the headache follows poor sleep, late meals, jaw clenching, or waking at the same hour."),
            ("diet", "Keep meals regular for 24-48 hours and note whether headaches improve when blood-sugar dips and caffeine swings are reduced."),
            ("lifestyle", "Pair screen breaks with shoulder/jaw release and hydration notes so the pattern is not treated as only a head symptom."),
        ],
        "review": [
            ("herbs", "Herb/formula exploration depends on whether the headache pattern looks more heat, tension/stagnation, deficiency, digestion-related, menstrual, or externally triggered."),
            ("rubric_cluster", "Homeopathy repertory review should begin with location, sensation, modalities, timing, accompanying symptoms, and distinctive features."),
        ],
    },
    "insomnia": {
        "summary": "Poor sleep should first be separated into falling asleep, staying asleep, early waking, restless dreaming, or waking unrefreshed. The next layer is what wakes the person: heat, worry, digestion, pain, urination, dreams, or stimulants.",
        "signals": ["sleep phase", "night timing", "nervous-system load", "digestion relationship"],
        "tradition_directions": [
            ("Ayurveda", "Use the available Ayurveda canon to review sleep through routine, vata-style irregularity, digestion, heat, dryness, and depletion/heaviness clues."),
            ("Traditional Chinese Medicine", "Use Huangdi Neijing source support to review sleep through spirit/qi regulation, night timing, heat/cold, digestion, and rest-activity rhythm."),
            ("Homeopathy", "Use Organon case method plus Boericke and Kent to review sleep timing, dreams, waking pattern, mental state, temperature, and modalities."),
        ],
        "actions": [
            ("sleep", "For 3 nights, write the sleep type: hard to fall asleep, waking often, waking too early, restless dreams, or waking unrefreshed."),
            ("avoid_reduce", "Run one clean evening test: no caffeine after midday, no alcohol, lighter earlier dinner, dimmer screens, and no intense work in the final hour."),
            ("breathwork", "Try 3-5 minutes of slow nasal breathing or extended exhale before bed and note whether the body settles or becomes more restless."),
            ("observation", "If waking happens, record the time and the clue: heat, sweating, urination, hunger, worry, pain, dream, noise, or no obvious reason."),
            ("lifestyle", "Build a consistent wind-down sequence: same bedtime window, warm low-stimulation routine, and one repeated cue that tells the body the day is ending."),
        ],
        "review": [
            ("formulas", "Formula direction needs the sleep subtype first: restless heat, digestive disturbance, depletion, worry, or rhythm disruption."),
            ("remedy_differential", "Homeopathic review should focus on sleep timing, mental state at night, dreams, temperature, and modalities."),
        ],
    },
    "bloating": {
        "summary": "Bloating becomes actionable when tied to meal timing, food quality, appetite, stool pattern, stress, gas movement, and whether warmth, pressure, walking, or passing stool/gas changes it.",
        "signals": ["digestion", "food timing", "stool relationship", "gas movement"],
        "tradition_directions": [
            ("Ayurveda", "Use Charaka/Ashtanga/Sushruta layers to review agni, ama-like heaviness, appetite, stool, meal timing, and whether the pattern points more to vata movement or kapha heaviness."),
            ("Traditional Chinese Medicine", "Use Huangdi Neijing source support to review digestion, qi movement, damp/heavy tendencies, appetite, and bowel relationships before formula direction."),
            ("Homeopathy", "Use Boericke and Kent to review bloating through modalities, food aggravations, pressure/movement effects, stool relationship, and remedy differentials."),
        ],
        "actions": [
            ("diet", "For 3 meals, choose warm cooked simple food, eat slower, and stop before heaviness. Compare bloating to raw/cold/heavy or late meals."),
            ("movement", "Use a 10 minute easy walk after the largest meal and note whether gas/bloating moves, settles, or worsens."),
            ("avoid_reduce", "Pause the biggest likely aggravator for a short test: cold drinks, late meals, rushing, grazing, dairy, carbonated drinks, or very heavy foods."),
            ("observation", "Record appetite before eating, belching, gas, stool frequency, stool form, abdominal pain, nausea, and stress level."),
            ("lifestyle", "Keep one steady meal window for 3 days so the app can tell whether rhythm alone changes digestion."),
        ],
        "review": [
            ("herbs", "Digestive herb categories should be separated by pattern: weak appetite, gas movement, heaviness/dampness, heat/reflux, cold digestion, or food intolerance."),
            ("formulas", "Formula review should clarify whether the pattern looks more like weak digestion, stagnation, dampness/heaviness, heat, cold, or food intolerance."),
        ],
    },
    "constipation": {
        "summary": "Constipation should be organized by stool frequency, dryness, straining, incomplete evacuation, bloating, fluids, movement, travel, stress, and routine disruption.",
        "signals": ["stool pattern", "dryness", "motility", "medication context"],
        "tradition_directions": [
            ("Ayurveda", "Use the available Ayurveda canon to review stool dryness, vata movement, agni, fluids/oiliness, routine, and abdominal symptoms before any bowel-moving herb direction."),
            ("Traditional Chinese Medicine", "Use Huangdi Neijing source support to review dryness, heat/cold, qi movement, fluid relationship, and deficiency/excess clues before herbs or formulas."),
            ("Homeopathy", "Use Kent stool rubrics and Boericke materia medica after clarifying urging, stool character, sensations, modalities, timing, and concomitants."),
        ],
        "actions": [
            ("diet", "For 3 days, pair regular meals with warm fluids and notice whether stool improves with rhythm, warmth, and softer/moister foods."),
            ("movement", "Use gentle daily walking and abdominal ease practices; note whether movement improves urge or gas movement."),
            ("observation", "Track stool frequency, form, straining, dryness, incomplete feeling, pain, gas, and what changes it."),
            ("avoid_reduce", "Watch whether very dry foods, skipped meals, travel, stress, low fluids, or inactivity are the clearest aggravators."),
            ("lifestyle", "Set a calm morning bathroom window after warm fluid or breakfast so routine can become part of the pattern test."),
        ],
        "review": [
            ("herbs", "Herb categories should separate dryness/moistening, motility, heat, cold, tension, and depletion rather than jumping straight to laxatives."),
            ("remedy_differential", "Homeopathy review should focus on urging, stool character, sensations, timing, and modalities."),
        ],
    },
    "anxiety": {
        "summary": "Anxiety becomes clearer when organized by trigger, timing, body sensations, sleep, digestion, caffeine/stimulant use, and what reliably calms or worsens it.",
        "signals": ["trigger", "body sensations", "sleep relationship", "stimulant relationship"],
        "tradition_directions": [
            ("Ayurveda", "Use the available Ayurveda canon to review anxiety through vata-style instability, sleep, digestion, routine, depletion, and stimulant/stress relationships."),
            ("Traditional Chinese Medicine", "Use Huangdi Neijing source support to review anxiety through spirit/qi regulation, sleep, chest/breath sensations, heat/cold, and digestion relationships."),
            ("Homeopathy", "Use Organon case method, Boericke, and Kent after clarifying fears, triggers, consolation, restlessness, sleep, temperature, and peculiar symptoms."),
        ],
        "actions": [
            ("breathwork", "Use 2-3 minutes of gentle breath awareness with a longer exhale. Track whether it settles the system or makes it feel more activated."),
            ("sleep", "Check whether anxiety is worse at night, on waking, after poor sleep, or after vivid/restless dreams."),
            ("avoid_reduce", "For one test day, reduce caffeine swings, skipped meals, alcohol rebound, and late-night scrolling to see how much the pattern changes."),
            ("observation", "Track trigger, time of day, chest/breath sensations, digestion, restlessness, temperature, and what reliably helps."),
            ("lifestyle", "Choose one grounding cue after stress: warm drink, quiet walk, simple meal, lower light, or a predictable routine block."),
        ],
        "review": [
            ("herbs", "Calming herb/formula categories should wait until the pattern is clearer: restless heat, depletion, digestive anxiety, stimulant-driven anxiety, or sleep-related anxiety."),
            ("remedy_differential", "Homeopathy review should focus on fears, triggers, restlessness, consolation, temperature, sleep, and peculiar symptoms."),
        ],
    },
    "brain_fog": {
        "summary": "Brain fog becomes actionable when connected to timing: morning fog, post-meal fog, poor sleep, stress load, exertion, hydration, caffeine, or digestion.",
        "signals": ["mind focus", "sleep relationship", "digestion relationship", "energy pattern"],
        "tradition_directions": [
            ("Ayurveda", "Review brain fog through agni, ama-like heaviness, meal timing, sleep, kapha sluggishness, and vata overstimulation."),
            ("Traditional Chinese Medicine", "Review brain fog through damp/heavy tendencies, qi movement, sleep rhythm, digestion, and clear versus turbid sensory state."),
            ("Homeopathy", "Review brain fog through mental clarity, modalities, time of day, food relationship, sleep quality, and the person’s distinctive mental-emotional state."),
        ],
        "actions": [
            ("observation", "Track when the fog is worst: on waking, after meals, after screens, with stress, after poor sleep, or after exertion."),
            ("diet", "Run a 3-meal test: warm simple meals, slower eating, no grazing, and note whether clarity changes 30-90 minutes after eating."),
            ("sleep", "Compare brain fog against bedtime, waking time, night waking, dreams, and whether sleep feels restorative."),
            ("movement", "Use a 10 minute walk or outdoor light break when fog appears and note whether clarity improves or energy drops."),
            ("avoid_reduce", "Reduce the most obvious aggravator first: skipped meals, sugar swings, dehydration, heavy meals, late screens, or caffeine overuse."),
        ],
        "review": [
            ("herbs", "Herb/formula categories should separate damp/heavy digestion, depletion, overstimulation, poor sleep, and stimulant-driven fog."),
            ("remedy_differential", "Homeopathy review should focus on time of day, food effects, sleep, mental dullness, restlessness, and peculiar accompanying symptoms."),
        ],
    },
    "reflux": {
        "summary": "Reflux becomes useful when organized by burning/sour/bitter quality, timing after meals, lying down, late food, coffee/alcohol/spice, stress, nausea, cough, or throat irritation.",
        "signals": ["upper digestion", "heat or acidity", "meal timing", "trigger pattern"],
        "tradition_directions": [
            ("Ayurveda", "Review reflux through agni disturbance, pitta/heat, meal timing, food quality, stress, and whether heaviness or acidity dominates."),
            ("Traditional Chinese Medicine", "Review reflux through counterflow, heat, food stagnation, stress constraint, stomach relationship, and timing after eating or lying down."),
            ("Homeopathy", "Review reflux through sour/bitter/burning character, modalities, food aggravations, timing, nausea, throat/chest relationship, and cravings/aversions."),
        ],
        "actions": [
            ("diet", "For 3 days, test earlier lighter dinners, slower eating, smaller portions, and note reflux after coffee, alcohol, spicy/fatty foods, or late meals."),
            ("avoid_reduce", "Do not change everything at once: first reduce the clearest trigger such as late eating, coffee, alcohol, spicy food, heavy fats, or lying down after meals."),
            ("observation", "Record burning versus sour burps, nausea, cough/throat irritation, timing after meals, stress level, and whether upright posture helps."),
            ("lifestyle", "Create a meal-to-bed gap and stay upright after the largest meal; note whether reflux intensity changes."),
            ("breathwork", "Use gentle settling breath before meals if stress seems to drive rushing, tightness, or upper digestive tension."),
        ],
        "review": [
            ("herbs", "Digestive herb categories should separate heat/acidity, stagnation, heaviness, cold digestion, and stress-driven counterflow."),
            ("formulas", "Formula direction depends on whether the pattern is more heat, food stagnation, stress constraint, weak digestion, or mixed."),
        ],
    },
    "diarrhea": {
        "summary": "Loose stool becomes actionable when organized by frequency, urgency, watery versus loose quality, burning, mucus, food timing, stress, cold foods, morning pattern, and abdominal pain.",
        "signals": ["stool pattern", "digestion", "urgency", "trigger pattern"],
        "tradition_directions": [
            ("Ayurveda", "Review loose stool through agni, ama-like signs, pitta heat, vata irregularity, food triggers, and whether weakness or urgency dominates."),
            ("Traditional Chinese Medicine", "Review loose stool through dampness, cold/heat, spleen-style digestive weakness, stress relationship, and morning or post-meal timing."),
            ("Homeopathy", "Review diarrhea through stool character, urgency, timing, pain, food triggers, temperature, modalities, and accompanying mental-emotional state."),
        ],
        "actions": [
            ("observation", "Track stool count, urgency, watery/loose quality, burning, mucus, pain, foods, stress, and time of day."),
            ("diet", "Use a simple-food test for 24-48 hours: warm, plain, easy-to-digest meals and pause cold/raw/heavy foods to see whether frequency settles."),
            ("avoid_reduce", "Temporarily reduce likely aggravators: alcohol, rich/fatty foods, dairy if suspect, cold drinks, excess caffeine, and rushing meals."),
            ("lifestyle", "Keep meals smaller and steady; note whether stool worsens after stress, travel, or irregular eating."),
            ("observation", "Note thirst, dry mouth, dizziness, weakness, fever, blood, or severe pain because those change the next step."),
        ],
        "review": [
            ("herbs", "Herb categories should separate acute irritation, damp/heavy digestion, cold digestion, heat/burning, stress-triggered stool, and depletion."),
            ("remedy_differential", "Homeopathy review should focus on stool character, urgency, timing, triggers, pains, thirst, and modalities."),
        ],
    },
    "nausea": {
        "summary": "Nausea becomes clearer by timing: before eating, after eating, morning, motion, odors, stress, pregnancy possibility, reflux, headache, or bowel changes.",
        "signals": ["upper digestion", "timing", "trigger pattern", "motion or odor sensitivity"],
        "tradition_directions": [
            ("Ayurveda", "Review nausea through agni, ama-like heaviness, pitta heat, kapha heaviness, vata motion sensitivity, and food timing."),
            ("Traditional Chinese Medicine", "Review nausea through counterflow, stomach relationship, phlegm/damp, heat/cold, food stagnation, and stress constraint."),
            ("Homeopathy", "Review nausea through timing, odors, motion, food desires/aversions, vomiting relief, temperature, and peculiar accompanying symptoms."),
        ],
        "actions": [
            ("observation", "Track whether nausea is worse before food, after food, with motion, odors, stress, morning, night, reflux, headache, or bowel changes."),
            ("diet", "Test smaller warm simple meals and avoid rushing, heavy fats, alcohol, and strong odors for one day; note whether nausea changes."),
            ("avoid_reduce", "Pause the clearest trigger first: late meals, coffee, alcohol, rich foods, motion exposure, strong smells, or eating too quickly."),
            ("breathwork", "Use slow nasal breathing or fresh air as a pattern test when nausea rises; note whether settling the nervous system changes the stomach."),
            ("observation", "Record whether vomiting relieves nausea, whether thirst changes, and whether abdominal pain, fever, or dizziness appears."),
        ],
        "review": [
            ("herbs", "Digestive herb categories should separate heat/reflux, cold digestion, damp/heaviness, motion sensitivity, and stress counterflow."),
            ("remedy_differential", "Homeopathy review should focus on nausea timing, odors, motion, vomiting relief, thirst, food aversions, and modalities."),
        ],
    },
    "cold_hands": {
        "summary": "Cold hands or feet become useful when connected to time of day, weather, stress, food, fatigue, color change, numbness, movement response, and warmth response.",
        "signals": ["temperature", "circulation", "stress relationship", "movement response"],
        "tradition_directions": [
            ("Ayurveda", "Review cold extremities through vata/cold/dry tendencies, routine, nourishment, circulation, and whether fatigue or anxiety travels with the coldness."),
            ("Traditional Chinese Medicine", "Review cold extremities through cold/heat balance, qi movement, yang-style warming function, constraint, and response to movement or warmth."),
            ("Homeopathy", "Review cold hands/feet through thermal state, modalities, time of day, emotional state, circulation sensations, and individual generals."),
        ],
        "actions": [
            ("observation", "Track when hands/feet get cold: morning, evening, after meals, with stress, after caffeine, outdoors, or while sitting."),
            ("movement", "Use a 5-10 minute brisk-but-easy walk or hand/foot mobility test and note whether warmth returns."),
            ("diet", "Compare coldness after warm meals versus skipped meals, cold drinks, or coffee-only mornings."),
            ("lifestyle", "Use warmth as a pattern test: warm socks, warm drink, warm meal, and steady routine; note what changes fastest."),
            ("avoid_reduce", "Reduce cold exposure and long unmoving screen blocks for one test day and track circulation response."),
        ],
        "review": [
            ("herbs", "Warming/circulation herb categories should wait until the pattern separates cold constitution, stress constraint, depletion, and circulation concern."),
            ("remedy_differential", "Homeopathy review should focus on thermal state, cold extremities, emotional state, modalities, and what restores warmth."),
        ],
    },
    "hot_flashes": {
        "summary": "Hot flashes become clearer when organized by timing, night sweats, menstrual/perimenopause relationship, stress, alcohol/spicy food, sleep disruption, palpitations, and cooling response.",
        "signals": ["heat", "sweating", "sleep relationship", "hormonal rhythm"],
        "tradition_directions": [
            ("Ayurveda", "Review hot flashes through pitta/heat, depletion, sleep rhythm, stress, menstrual stage, and food/alcohol aggravation."),
            ("Traditional Chinese Medicine", "Review hot flashes through heat, yin/fluids, night timing, sweating, spirit/rest relationship, and trigger pattern."),
            ("Homeopathy", "Review hot flashes through timing, sweating, flushing, emotional trigger, menstrual relationship, thermal modalities, and peculiar features."),
        ],
        "actions": [
            ("observation", "Track time, trigger, sweating, flushing, heart racing, stress, alcohol/spice, sleep disruption, and menstrual/cycle context."),
            ("avoid_reduce", "Run a 3-day trigger test: reduce alcohol, spicy foods, late meals, overheated rooms, and intense evening work."),
            ("sleep", "Note whether hot flashes wake you, what time they happen, and whether there is thirst, sweating, dreams, or anxiety."),
            ("breathwork", "Use slow cooling/settling breath at the first sign of heat and note whether intensity or duration changes."),
            ("lifestyle", "Use layers, cooler sleep environment, and a consistent wind-down to reduce heat accumulation before bed."),
        ],
        "review": [
            ("herbs", "Cooling or nourishing herb categories need pattern separation: heat excess, depletion heat, stress heat, hormonal transition, or food-triggered heat."),
            ("remedy_differential", "Homeopathy review should focus on flash timing, sweat, flush, emotions, menstrual relationship, and thermal modalities."),
        ],
    },
    "irritability": {
        "summary": "Irritability becomes more useful when linked to hunger, poor sleep, heat, stress, overstimulation, menstrual timing, pain, or needing solitude/structure.",
        "signals": ["stress response", "heat or tension", "sleep relationship", "food relationship"],
        "tradition_directions": [
            ("Ayurveda", "Review irritability through pitta intensity/heat, vata overstimulation, hunger rhythm, sleep, and routine disruption."),
            ("Traditional Chinese Medicine", "Review irritability through constraint, heat, qi movement, sleep, digestion, and stress location in chest/throat/head/digestion."),
            ("Homeopathy", "Review irritability through triggers, consolation/solitude, anger expression, hunger, sleep, heat, and repeating emotional pattern."),
        ],
        "actions": [
            ("observation", "Track irritability against hunger, caffeine, poor sleep, heat, overstimulation, pain, deadlines, and menstrual timing."),
            ("diet", "Use regular meals and protein/fat/fiber balance for one day and see whether mood steadies when hunger dips are reduced."),
            ("avoid_reduce", "Reduce the clearest irritant first: skipped meals, heat, noise, conflict overload, late screens, or over-scheduling."),
            ("lifestyle", "Create a decompression block after high-stimulation periods: quiet, walk, lower light, or no-input time."),
            ("breathwork", "Use a 2-minute pause with longer exhale before responding when irritation rises; note whether intensity drops."),
        ],
        "review": [
            ("herbs", "Herb/formula categories should separate heat/intensity, constraint/tension, depletion, poor sleep, and blood-sugar-related irritability."),
            ("remedy_differential", "Homeopathy review should focus on triggers, anger style, consolation, hunger, sleep, heat, and peculiar emotional patterns."),
        ],
    },
    "cravings": {
        "summary": "Cravings become useful when organized by taste, timing, stress, fatigue, sleep, menstrual pattern, meals skipped, blood-sugar dips, and what happens after eating the craved food.",
        "signals": ["taste pattern", "blood sugar rhythm", "stress relationship", "digestion"],
        "tradition_directions": [
            ("Ayurveda", "Review cravings through rasa/taste, dosha tendency, agni, ama-like heaviness, routine, and emotional/stress eating patterns."),
            ("Traditional Chinese Medicine", "Review cravings through digestion, spleen/stomach relationship, damp/heavy tendencies, heat/cold, and emotional constraint."),
            ("Homeopathy", "Review cravings and aversions as generals: sweet/salty/sour/spicy/fatty/cold/warm desires, timing, and accompanying symptoms."),
        ],
        "actions": [
            ("observation", "Track the craved taste, time of day, hunger level, stress, sleep, menstrual timing, and whether the craving follows skipped meals."),
            ("diet", "For 3 days, test steady meals before cravings usually appear and note whether intensity reduces."),
            ("avoid_reduce", "Do not fight every craving at once; reduce the biggest trigger: skipped breakfast, late-night screen time, caffeine swings, or under-eating."),
            ("lifestyle", "Pair the craving moment with a check-in: hungry, tired, stressed, overstimulated, or needing rhythm."),
            ("observation", "Record how you feel 30-90 minutes after eating the craved food: clearer, heavier, sleepy, wired, bloated, or calmer."),
        ],
        "review": [
            ("herbs", "Digestive/metabolic herb categories should wait until cravings are separated by taste, timing, digestion, stress, and blood-sugar rhythm."),
            ("remedy_differential", "Homeopathy review should use cravings/aversions as generals alongside modalities, mental state, sleep, and thermal state."),
        ],
    },
    "low_appetite": {
        "summary": "Low appetite becomes actionable when connected to morning pattern, stress, nausea, bloating, heaviness, sadness, fever, early fullness, or taste changes.",
        "signals": ["appetite", "digestion", "mood relationship", "meal rhythm"],
        "tradition_directions": [
            ("Ayurveda", "Review low appetite through agni, ama-like heaviness, vata irregularity, kapha dullness, stress, and meal timing."),
            ("Traditional Chinese Medicine", "Review low appetite through digestive qi, damp/heaviness, stomach relationship, stress constraint, and cold/heat signs."),
            ("Homeopathy", "Review low appetite through aversions, nausea, thirst, timing, mental-emotional state, food desires, and modalities."),
        ],
        "actions": [
            ("diet", "Use small warm simple meals at steady times for 3 meals and note whether appetite wakes up with rhythm."),
            ("movement", "Take a short easy walk before a meal and note whether hunger appears or digestion feels clearer."),
            ("avoid_reduce", "Pause grazing, heavy late meals, cold drinks, and coffee-only mornings if they seem to dull appetite."),
            ("observation", "Track appetite morning/midday/evening, nausea, bloating, mood, stress, taste, and early fullness."),
            ("lifestyle", "Create a predictable first-meal window so the body has a repeated signal for hunger."),
        ],
        "review": [
            ("herbs", "Digestive/appetite herb categories should separate weak digestion, heaviness, nausea, heat, cold, stress, and sadness-linked low appetite."),
            ("remedy_differential", "Homeopathy review should focus on appetite loss with aversions, nausea, mood, thirst, timing, and modalities."),
        ],
    },
    "dry_skin": {
        "summary": "Dry skin becomes useful when connected to itching, cracking, season, cold weather, bathing, hydration/thirst, constipation, stress, sleep, and food/fat rhythm.",
        "signals": ["dryness", "skin", "fluid relationship", "elimination relationship"],
        "tradition_directions": [
            ("Ayurveda", "Review dry skin through vata dryness, tissue nourishment, routine, oils/fats, hydration, stool dryness, and seasonal aggravation."),
            ("Traditional Chinese Medicine", "Review dry skin through fluids, dryness, blood/yin-style nourishment categories, heat/cold, and lung/skin relationship language."),
            ("Homeopathy", "Review dry skin through location, itching/burning/cracking, modalities, season, bathing effects, and accompanying generals."),
        ],
        "actions": [
            ("observation", "Track dryness location, itch, cracking, redness, bathing products, weather, thirst, stool dryness, and sleep."),
            ("diet", "For 3 days, note whether regular warm meals, adequate fluids, and healthy fats change dryness or itching."),
            ("lifestyle", "Use a consistent external moisture/oil routine after bathing and note whether skin comfort changes."),
            ("avoid_reduce", "Reduce the clearest aggravator first: hot showers, harsh products, cold wind, low humidity, or skipped meals/fluids."),
            ("observation", "Record whether dryness travels with constipation, anxiety, poor sleep, or feeling cold."),
        ],
        "review": [
            ("herbs", "Skin/supportive herb categories should separate dryness, heat, itch, inflammation, depletion, and digestive triggers."),
            ("remedy_differential", "Homeopathy review should focus on skin location, sensation, modalities, seasonality, and concomitant dryness/stool/thirst patterns."),
        ],
    },
    "neck_tension": {
        "summary": "Neck tension becomes actionable when connected to screen posture, jaw clenching, stress, headache, sleep position, cold exposure, movement response, and exact location.",
        "signals": ["pain location", "stress relationship", "posture", "headache relationship"],
        "tradition_directions": [
            ("Ayurveda", "Review neck tension through vata movement/tension, stress, cold/dry aggravation, sleep position, and routine."),
            ("Traditional Chinese Medicine", "Review neck tension through qi movement, channel/location logic, wind/cold exposure, constraint, and headache relationship."),
            ("Homeopathy", "Review neck tension through exact sensation, modalities, posture, stress trigger, headache connection, and thermal state."),
        ],
        "actions": [
            ("observation", "Map exact location, sensation, headache link, jaw tension, screen time, sleep position, cold exposure, and stress level."),
            ("movement", "Use a gentle 2-minute mobility test every few hours and note whether movement relieves or aggravates tension."),
            ("avoid_reduce", "Reduce the clearest aggravator: long unmoving screen blocks, cold wind on the neck, jaw clenching, or sleeping awkwardly."),
            ("lifestyle", "Add a heat or warmth test when tension appears and note whether warmth changes pain, range of motion, or headache."),
            ("breathwork", "Use slow exhale with shoulder drop for 1-2 minutes and note whether the neck softens when the nervous system settles."),
        ],
        "review": [
            ("herbs", "Herb/formula categories depend on whether the pattern is cold/tight, heat/inflamed, stress constraint, injury, or depletion."),
            ("rubric_cluster", "Homeopathy repertory review should focus on neck location, stiffness, modalities, headache connection, and exact sensation."),
        ],
    },
    "joint_pain": {
        "summary": "Joint pain becomes useful when organized by which joints, swelling, heat, redness, stiffness, morning pattern, cold/damp weather, activity, rest, and movement response.",
        "signals": ["joint location", "stiffness", "weather relationship", "movement response"],
        "tradition_directions": [
            ("Ayurveda", "Review joint pain through vata dryness/movement, ama-like heaviness, heat/inflammation, stiffness, digestion, and weather sensitivity."),
            ("Traditional Chinese Medicine", "Review joint pain through obstruction-style patterning, cold/damp/heat clues, channel location, movement response, and swelling."),
            ("Homeopathy", "Review joint pain through location, sensation, stiffness, modalities, weather, movement/rest response, and accompanying generals."),
        ],
        "actions": [
            ("observation", "Track which joints, swelling, heat/redness, stiffness, morning duration, weather, activity, rest, and what changes pain."),
            ("movement", "Use gentle range-of-motion or walking as a test; note whether joints warm and loosen or become more painful."),
            ("avoid_reduce", "Reduce the clearest aggravator: cold/damp exposure, overuse, long immobility, inflammatory food triggers, or sleep loss."),
            ("diet", "Note whether heavy foods, alcohol, sugar swings, or digestive heaviness appear alongside joint flares."),
            ("lifestyle", "Use warmth versus coolness as a careful pattern test and record which one the joint prefers."),
        ],
        "review": [
            ("herbs", "Joint herb/formula categories should separate cold/damp stiffness, heat/inflammation, dryness, digestion-linked heaviness, and overuse/injury."),
            ("rubric_cluster", "Homeopathy repertory review should focus on joint location, weather, motion/rest, sensation, stiffness, and concomitants."),
        ],
    },
    "dizziness": {
        "summary": "Dizziness becomes clearer when separated into spinning, lightheadedness, imbalance, standing-related faintness, motion sensitivity, meal timing, hydration, anxiety, ear symptoms, or medication context.",
        "signals": ["dizziness type", "timing", "food/fluid relationship", "nervous-system relationship"],
        "tradition_directions": [
            ("Ayurveda", "Review dizziness through vata instability, depletion, digestion, hydration, sleep, movement, and overstimulation."),
            ("Traditional Chinese Medicine", "Review dizziness through wind/movement language, qi/blood/fluid relationships, phlegm/damp heaviness, sleep, and digestion."),
            ("Homeopathy", "Review dizziness through type, position, motion, timing, nausea, anxiety, thermal state, and modalities."),
        ],
        "actions": [
            ("observation", "Define the dizziness type: spinning, lightheaded, faint, off-balance, motion-sensitive, or standing-related."),
            ("diet", "Track whether dizziness follows skipped meals, caffeine, dehydration, heavy meals, or blood-sugar dips."),
            ("avoid_reduce", "Reduce rapid position changes, dehydration, skipped meals, and overexertion while tracking the pattern."),
            ("breathwork", "If anxiety-linked, use gentle longer-exhale breathing only while seated and note whether dizziness changes."),
            ("observation", "Record ear symptoms, headache, nausea, palpitations, visual changes, stress, sleep, and medications/supplements."),
        ],
        "review": [
            ("herbs", "Herb/formula categories need the dizziness type first: phlegm/heaviness, depletion, heat, movement/wind, digestion, or anxiety-linked."),
            ("remedy_differential", "Homeopathy review should focus on position, motion, nausea, visual symptoms, timing, and modalities."),
        ],
    },
    "heavy_feeling": {
        "summary": "A heavy feeling becomes useful when located: whole body, head, limbs, digestion, chest, or mood, then connected to meals, sleep, damp weather, stress, and movement response.",
        "signals": ["heaviness", "digestion relationship", "sleep relationship", "movement response"],
        "tradition_directions": [
            ("Ayurveda", "Review heaviness through kapha sluggishness, ama-like heaviness, agni, sleep, food quality, and whether movement clears it."),
            ("Traditional Chinese Medicine", "Review heaviness through damp/heavy tendency, qi movement, digestion, fluids, and whether weather or food worsens it."),
            ("Homeopathy", "Review heaviness through location, time, modalities, sleep, food, mood, and peculiar accompanying symptoms."),
        ],
        "actions": [
            ("observation", "Locate the heaviness: head, limbs, digestion, chest, whole body, or mood, and track when it appears."),
            ("diet", "For 3 meals, choose lighter warm cooked food and pause heavy/greasy/cold foods to see whether heaviness changes."),
            ("movement", "Use a short walk or gentle sweating/movement test and note whether heaviness lifts or worsens."),
            ("avoid_reduce", "Reduce late meals, oversleeping, grazing, heavy foods, and long sedentary blocks for one test day."),
            ("lifestyle", "Start the day with one activating rhythm cue: light, movement, warm drink, or a consistent first meal."),
        ],
        "review": [
            ("herbs", "Herb/formula categories should separate damp/heavy digestion, low metabolism, poor sleep, depression-like heaviness, and depletion."),
            ("remedy_differential", "Homeopathy review should focus on location, timing, food effects, sleep, mood, and what lifts heaviness."),
        ],
    },
    "night_sweats": {
        "summary": "Night sweats become clearer when organized by timing, soaking versus mild sweat, heat, chills, dreams, thirst, fever, stress, alcohol/spice, menstrual transition, and sleep disruption.",
        "signals": ["night timing", "sweating", "heat/fluid relationship", "sleep relationship"],
        "tradition_directions": [
            ("Ayurveda", "Review night sweats through pitta/heat, depletion, sleep rhythm, stress, hormonal timing, and food/alcohol triggers."),
            ("Traditional Chinese Medicine", "Review night sweats through yin/fluid/heat language, sleep timing, spirit/rest relationship, and accompanying thirst or heat."),
            ("Homeopathy", "Review night sweats through timing, amount, body location, dreams, thirst, temperature, and modalities."),
        ],
        "actions": [
            ("observation", "Track time of sweating, amount, body area, heat/chills, thirst, dreams, stress, alcohol/spice, and menstrual/cycle context."),
            ("sleep", "Note whether sweats wake you, whether sleep feels restored, and whether sweating clusters at the same time each night."),
            ("avoid_reduce", "For 3 nights, reduce alcohol, spicy/heavy late meals, overheated room, and intense evening work."),
            ("lifestyle", "Use a cooler sleep environment and consistent wind-down; note whether intensity or timing changes."),
            ("breathwork", "Use a short settling breath practice before bed if stress heat or activation seems involved."),
        ],
        "review": [
            ("herbs", "Cooling/nourishing herb categories need separation between heat, depletion heat, hormonal transition, infection concern, and food/alcohol triggers."),
            ("remedy_differential", "Homeopathy review should focus on sweat timing, location, amount, dreams, thirst, and thermal modalities."),
        ],
    },
}


GENERIC_OUTCOME_BY_DIMENSION: dict[str, dict[str, Any]] = {
    "pain": {
        "summary": "Pain needs location, quality, severity, timing, triggers, what changes it, and safety context before any traditional direction is chosen.",
        "signals": ["pain location", "pain quality", "modality", "safety screen"],
        "actions": [
            ("observation", "Record exact location, quality, intensity, onset, timing, what improves it, what worsens it, and related symptoms."),
            ("avoid_reduce", "Avoid strong interventions until red flags, injury, fever, neurological symptoms, or rapidly worsening pain are ruled out."),
            ("practitioner_follow_up", "Clarify medications, pregnancy status, injury, fever, neurological symptoms, and whether this is new or worsening."),
        ],
        "review": [
            ("rubric_cluster", "Homeopathy repertory review should focus on location, sensation, modalities, timing, concomitants, and peculiar features."),
            ("herbs", "For pain, keep herbs, formulas, and supplements in the explore-next lane until medications, red flags, and trigger context are clear."),
        ],
    },
    "digestion": {
        "summary": "Digestive symptoms should be organized through appetite, stool, timing after meals, food triggers, gas, nausea, pain, thirst, and stress relationship.",
        "signals": ["digestion", "food timing", "stool relationship", "trigger pattern"],
        "actions": [
            ("diet", "Run a 3-meal pattern test: warm cooked simple food, slower eating, no rushing, and note appetite, gas, stool, nausea, and bloating afterward."),
            ("observation", "Record whether the symptom changes with warmth, pressure, walking, passing stool/gas, fasting, smaller meals, or stress relief."),
            ("lifestyle", "Keep meal timing steady for 3 days so the app can separate food choice from rhythm disruption."),
        ],
        "review": [
            ("herbs", "Digestive herb categories should separate weak appetite, gas movement, heaviness/dampness, heat/reflux, cold digestion, and food intolerance."),
            ("formulas", "Formula review should clarify whether the pattern looks more like weak digestion, stagnation, dampness/heaviness, heat, cold, or food intolerance."),
        ],
    },
    "mental_emotional": {
        "summary": "Mental-emotional symptoms should be organized through trigger, timing, sleep, digestion, body sensations, stimulant use, and what reliably helps.",
        "signals": ["trigger", "sleep relationship", "body sensations", "stress load"],
        "actions": [
            ("observation", "Track trigger, time of day, sleep, food/caffeine, body sensations, digestion, temperature, and what reliably helps."),
            ("breathwork", "Use 2-3 minutes of gentle breath awareness with a longer exhale and note whether the body settles or becomes more activated."),
            ("lifestyle", "Choose one grounding cue after stress: warm drink, quiet walk, simple meal, lower light, or a predictable routine block."),
        ],
        "review": [
            ("herbs", "Calming herb/formula categories should be separated by pattern: restless heat, depletion, digestive anxiety, stimulant-driven anxiety, or sleep-related anxiety."),
            ("remedy_differential", "Homeopathy review should focus on triggers, fears, consolation, restlessness, sleep, temperature, and peculiar symptoms."),
        ],
    },
    "respiratory": {
        "summary": "Respiratory symptoms need quality, timing, mucus, fever, breathing safety, triggers, position, and exposure history before traditional interpretation.",
        "signals": ["respiratory quality", "mucus", "timing", "safety screen"],
        "actions": [
            ("observation", "Record dry/wet quality, mucus color/amount, fever, throat/nasal symptoms, position, time of day, and triggers."),
            ("avoid_reduce", "Do not treat traditionally first if there is breathing difficulty, chest pain, blue lips, blood, high fever, or low oxygen concern."),
            ("practitioner_follow_up", "Clarify asthma/COPD history, medications, fever, oxygen status, exposure, and whether symptoms are worsening."),
        ],
        "review": [
            ("herbs", "For respiratory symptoms, keep herbs and formulas in the explore-next lane until pregnancy status, medications, asthma, fever, and breathing comfort are clear."),
            ("remedy_differential", "Homeopathy review should focus on cough quality, modalities, mucus, position, timing, thirst, and concomitants."),
        ],
    },
    "skin": {
        "summary": "Skin symptoms should be reviewed through appearance, sensation, heat/cold, dryness/oozing, triggers, medications, digestion, stress, and safety signs.",
        "signals": ["skin appearance", "sensation", "trigger pattern", "safety screen"],
        "actions": [
            ("observation", "Record appearance, location, itching/burning/pain, dryness/oozing, heat, spread, triggers, foods, products, and medication changes."),
            ("avoid_reduce", "Avoid adding herbs, supplements, or topical experiments until allergic reaction, infection, blistering, fever, or rapid spread is ruled out."),
            ("practitioner_follow_up", "Escalate skin symptoms with throat/lip swelling, breathing difficulty, fever, blistering, severe pain, or rapid spread."),
        ],
        "review": [
            ("herbs", "For skin symptoms, keep herbs and formulas in the explore-next lane until triggers, medications, allergy, pregnancy status, and infection signs are clear."),
            ("remedy_differential", "Homeopathy review should focus on eruption type, sensation, modalities, location, discharge, and concomitants."),
        ],
    },
    "general": {
        "summary": "This symptom becomes useful when it is connected to timing, severity, triggers, what changes it, and related body systems.",
        "signals": ["timing", "severity", "trigger pattern", "missing details"],
        "actions": [
            ("observation", "Record when it happens, how severe it is, what improves it, what worsens it, and what appears with it."),
            ("lifestyle", "Run one simple pattern test for 3 days: steady sleep window, steady meals, gentle movement, and a short daily note."),
            ("avoid_reduce", "Reduce the clearest likely aggravator first rather than changing many things at once."),
        ],
        "review": [
            ("remedy_differential", "Homeopathy review should wait for clearer modalities, generals, mental-emotional state, and peculiar symptoms."),
            ("formulas", "Formula review should wait until the pattern is clearer and safety context is complete."),
        ],
    },
}


DIMENSION_FALLBACKS = {
    "cardiorespiratory": "respiratory",
    "circulation_temperature": "general",
    "elimination": "digestion",
    "energy": "general",
    "fluid": "general",
    "mind_focus": "mental_emotional",
    "metabolic": "general",
    "neurological": "general",
    "reproductive": "general",
    "temperature": "general",
    "temperature_fluid": "general",
    "urinary": "general",
}


def outcome_profile_for_symptom(normalized_symptom: dict[str, Any]) -> dict[str, Any]:
    canonical = normalized_symptom["canonical"]
    if canonical in SYMPTOM_OUTCOME_PROFILES:
        return SYMPTOM_OUTCOME_PROFILES[canonical]
    dimension = normalized_symptom.get("dimension", "general")
    profile_key = dimension if dimension in GENERIC_OUTCOME_BY_DIMENSION else DIMENSION_FALLBACKS.get(dimension, "general")
    base = GENERIC_OUTCOME_BY_DIMENSION[profile_key]
    label = canonical.replace("_", " ")
    return {
        **base,
        "summary": f"{label.title()} first-pass outcome: {base['summary']}",
        "tradition_directions": [
            ("Ayurveda", f"Use the available Ayurveda canon to review {label} through digestion, routine, heat/cold, dryness/heaviness, strength, and dosha-pattern clues."),
            ("Traditional Chinese Medicine", f"Use Huangdi Neijing source support to review {label} through qi, yin-yang, heat/cold, fluids, rest-activity rhythm, and organ-network relationships."),
            ("Homeopathy", f"Use Organon method, Boericke materia medica, and Kent repertory support to review {label} through totality, modalities, generals, concomitants, and peculiar features."),
        ],
    }


def citation_ids_by_tradition(citations: list[dict[str, Any]]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {"Ayurveda": [], "Traditional Chinese Medicine": [], "Homeopathy": []}
    for citation in citations:
        tradition = citation.get("tradition", "")
        if tradition in grouped and citation.get("citation_id"):
            grouped[tradition].append(citation["citation_id"])
    return grouped


def outcome_row(
    category: str,
    action: str,
    citations: list[str],
    confidence: float,
    review_priority: str = "review_first",
    tradition: str = "Cross-tradition intake",
    source_basis: str = "",
) -> dict[str, Any]:
    return {
        "tradition": tradition,
        "category": category,
        "direction": action,
        "practitioner_action": action,
        "confidence_score": confidence,
        "review_priority": review_priority,
        "citations": citations[:3],
        "source_basis": source_basis,
        "safety_notes": ["Pattern-support note: personalize this direction with more intake detail before relying on it."],
    }


def apply_symptom_outcome_layer(
    practical_output: dict[str, Any],
    intake: dict[str, Any],
    citations: list[dict[str, Any]],
    safety: dict[str, Any],
    next_question: str,
) -> dict[str, Any]:
    normalized = normalize_intake_symptoms(intake)
    recognized = [item for item in normalized if item.get("canonical") != "symptom"]
    if not recognized:
        return practical_output
    if safety["status"] == "suppress":
        case_snapshot = intake.get("symptoms", {}).get("chief_complaint") or ", ".join(
            intake.get("symptoms", {}).get("primary_symptoms", [])
        )
        questions = [next_question]
        for item in normalized:
            questions.extend(item.get("next_questions", [])[:2])
        questions.extend(practical_output.get("questions_still_needed", []))
        deduped_questions = []
        for question in questions:
            if question and question not in deduped_questions:
                deduped_questions.append(question)
        practical_output["likely_pattern_summary"] = {
            **practical_output.get("likely_pattern_summary", {}),
            "case_snapshot": case_snapshot,
            "plain_language_summary": (
                "This intake contains red-flag language. Traditional pattern interpretation and wellness directions "
                "are held until appropriate medical evaluation has addressed the urgent concern."
            ),
            "tradition_directions": [],
            "shared_pattern_signals": ["safety screen", "urgent medical evaluation first"],
        }
        practical_output["confidence"] = {
            **practical_output.get("confidence", {}),
            "score": 0,
            "label": "safety-first hold",
            "basis": (
                "Red-flag language was detected. The app does not provide wellness directions while urgent medical "
                "concerns may be present."
            ),
        }
        practical_output["questions_still_needed"] = deduped_questions[:10]
        practical_output["lifestyle_diet_practice_actions"] = []
        practical_output["herbs_formulas_remedies_to_consider"] = []
        practical_output["warnings_and_professional_boundaries"] = [
            *practical_output.get("warnings_and_professional_boundaries", []),
            EMERGENCY_WARNING,
        ]
        return practical_output

    citation_groups = citation_ids_by_tradition(citations)
    cross_citations = [
        *(citation_groups.get("Ayurveda") or [])[:1],
        *(citation_groups.get("Traditional Chinese Medicine") or [])[:1],
        *(citation_groups.get("Homeopathy") or [])[:1],
    ]
    default_citations_by_tradition = {
        "Ayurveda": (citation_groups.get("Ayurveda") or cross_citations)[:2],
        "Traditional Chinese Medicine": (citation_groups.get("Traditional Chinese Medicine") or cross_citations)[:2],
        "Homeopathy": (citation_groups.get("Homeopathy") or cross_citations)[:2],
        "Cross-tradition intake": cross_citations,
    }
    action_rows: list[dict[str, Any]] = []
    review_rows: list[dict[str, Any]] = []
    summaries: list[str] = []
    signals: list[str] = []
    tradition_directions: list[dict[str, Any]] = []
    seen_actions: set[tuple[str, str]] = set()
    seen_directions: set[tuple[str, str]] = set()

    for normalized_symptom in recognized[:6]:
        profile = outcome_profile_for_symptom(normalized_symptom)
        summaries.append(profile["summary"])
        signals.extend(profile.get("signals", []))
        for tradition, direction in profile.get("tradition_directions", []):
            direction_key = (tradition, direction)
            if direction_key in seen_directions:
                continue
            seen_directions.add(direction_key)
            tradition_directions.append(
                {
                    "tradition": tradition,
                    "direction": direction,
                    "confidence_score": 68 if safety["status"] == "caution" else 74,
                    "priority": "review_first",
                    "citations": default_citations_by_tradition.get(tradition, cross_citations),
                }
            )
        for category, action in profile.get("actions", []):
            key = (category, action)
            if key in seen_actions:
                continue
            seen_actions.add(key)
            tradition = "Ayurveda" if category in {"diet", "movement"} else "Traditional Chinese Medicine" if category in {"sleep", "breathwork"} else "Cross-tradition intake"
            action_rows.append(
                outcome_row(
                    category,
                    action,
                    default_citations_by_tradition.get(tradition, cross_citations),
                    74 if safety["status"] == "clear" else 66,
                    tradition=tradition,
                    source_basis="Drawn from the currently processed source layers and the recognized symptom profile.",
                )
            )
        for category, action in profile.get("review", []):
            key = (category, action)
            if key in seen_actions:
                continue
            seen_actions.add(key)
            tradition = "Homeopathy" if category in {"remedy_differential", "rubric_cluster"} else "Ayurveda" if category in {"herbs", "formulas"} else "Cross-tradition intake"
            review_rows.append(
                outcome_row(
                    category,
                    action,
                    default_citations_by_tradition.get(tradition, cross_citations),
                    68 if safety["status"] == "clear" else 58,
                    "review_second",
                    tradition=tradition,
                    source_basis="Drawn from the currently processed source layers; new action books will make this more specific.",
                )
            )

    case_snapshot = intake.get("symptoms", {}).get("chief_complaint") or ", ".join(
        intake.get("symptoms", {}).get("primary_symptoms", [])
    )
    practical_output["likely_pattern_summary"] = {
        **practical_output.get("likely_pattern_summary", {}),
        "case_snapshot": case_snapshot,
        "plain_language_summary": " ".join(summaries[:3]),
        "tradition_directions": tradition_directions[:9],
        "shared_pattern_signals": sorted(set(signals))[:10],
    }
    practical_output["confidence"] = {
        **practical_output.get("confidence", {}),
        "score": 68 if safety["status"] == "caution" else practical_output.get("confidence", {}).get("score", 72),
        "label": "first-pass pattern direction",
        "basis": (
            "Generated from recognized symptom profiles, intake signals, and available source-linked retrieval. "
            "The pattern becomes more specific as the missing intake questions are answered."
        ),
    }
    practical_output["lifestyle_diet_practice_actions"] = [
        *action_rows,
        *practical_output.get("lifestyle_diet_practice_actions", []),
    ]
    practical_output["herbs_formulas_remedies_to_consider"] = [
        *review_rows,
        *practical_output.get("herbs_formulas_remedies_to_consider", []),
    ]
    questions = [next_question]
    for item in normalized:
        questions.extend(item.get("next_questions", [])[:2])
    questions.extend(practical_output.get("questions_still_needed", []))
    deduped_questions = []
    for question in questions:
        if question and question not in deduped_questions:
            deduped_questions.append(question)
    practical_output["questions_still_needed"] = deduped_questions[:10]
    return practical_output


def practical_considerations(plan: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    buckets = {
        "herbs_formulas_remedies_to_consider": [],
        "lifestyle_diet_practice_actions": [],
    }
    for item in plan_items(plan):
        row = {
            "tradition": item["tradition"],
            "category": item["category"],
            "direction": item["direction"],
            "practitioner_action": item["practitioner_action"],
            "confidence_score": item["confidence_score"],
            "review_priority": item["review_priority"],
            "citations": item["citations"],
            "source_basis": item.get("source_basis", ""),
            "safety_notes": item["safety_notes"],
        }
        if item["category"] in ACTION_CATEGORY_GROUPS["concrete"]:
            buckets["herbs_formulas_remedies_to_consider"].append(row)
        if item["category"] in ACTION_CATEGORY_GROUPS["action"]:
            buckets["lifestyle_diet_practice_actions"].append(row)
    for key in buckets:
        buckets[key] = sorted(
            buckets[key],
            key=lambda row: (
                {"review_first": 3, "review_second": 2, "exploratory": 1, "hold_until_clarified": 0}.get(row["review_priority"], 0),
                row["confidence_score"],
            ),
            reverse=True,
        )
    return buckets


def practical_warnings(safety: dict[str, Any], plan: dict[str, Any]) -> list[str]:
    warnings = list(safety.get("notes", []))
    if safety.get("red_flags_detected"):
        warnings.append("See an appropriate medical professional before using traditional-system suggestions.")
    for caution in safety.get("context_cautions", []):
        note = caution.get("note")
        if note and note not in warnings:
            warnings.append(note)
    for item in plan_items(plan):
        for note in item.get("contraindications", []):
            if note not in warnings:
                warnings.append(note)
    if not warnings:
        warnings.append("Use the explore-next items as study and reflection prompts until the intake is more complete.")
    return warnings[:12]


def cited_reference_summary(citations: list[dict[str, Any]], limit: int = 10) -> list[dict[str, Any]]:
    return [
        {
            "citation_id": citation["citation_id"],
            "tradition": citation["tradition"],
            "source": citation["source"],
            "locator": citation["locator"],
            "pages": citation["pages"],
            "url": citation.get("url", ""),
            "rights_note": citation.get("rights_note", ""),
        }
        for citation in citations[:limit]
    ]


def build_practical_output(
    summary: dict[str, Any],
    synthesis: dict[str, Any],
    plan: dict[str, Any],
    safety: dict[str, Any],
    intake_state: dict[str, Any],
    citations: list[dict[str, Any]],
    next_question: str,
) -> dict[str, Any]:
    considerations = practical_considerations(plan)
    additional_questions = [
        item
        for item in [next_question, *intake_state.get("minimum_missing", []), *intake_state.get("deepening_missing", [])]
        if item
    ]
    return {
        "scope": "Working prototype output for source-based pattern exploration and practical next-step organization.",
        "disclaimer": DISCLAIMER,
        "short_result_disclaimer": SHORT_RESULT_DISCLAIMER,
        "emergency_warning": EMERGENCY_WARNING,
        "basis_of_insight": (
            "Outputs are generated from traditional wellness frameworks, source texts, user-entered information, "
            "and app logic. They are not generated from medical testing, physical examination, clinical diagnosis, "
            "or emergency evaluation."
        ),
        "likely_pattern_summary": {
            "case_snapshot": summary.get("case_snapshot", ""),
            "tradition_directions": summary.get("primary_traditional_directions", []),
            "shared_pattern_signals": synthesis.get("shared_themes", []),
            "areas_of_conflict": synthesis.get("areas_of_conflict", []),
        },
        "confidence": {
            "score": synthesis.get("confidence_score", 0),
            "label": synthesis.get("confidence_label", "insufficient evidence"),
            "basis": summary.get("confidence_summary", ""),
        },
        "questions_still_needed": additional_questions[:10],
        **considerations,
        "warnings_and_professional_boundaries": practical_warnings(safety, plan),
        "cited_source_references": cited_reference_summary(citations),
    }


def build_brain_trace(intake: dict[str, Any], chunks_path: Path = CHUNKS_PATH, limit: int = 3) -> dict[str, Any]:
    chunks = read_jsonl(chunks_path)
    query = intake_to_query(intake)
    evaluation_packets = build_tradition_evaluation_packets(intake)
    safety = safety_gate(intake)
    features = normalize_features(intake)
    results = search(query, chunks, limit_per_tradition=limit)
    candidates = build_candidates(
        results,
        safety["status"],
        evaluation_packets=evaluation_packets,
        safety=safety,
        feature_terms={feature["feature"] for feature in features},
    )
    synthesis = synthesis_notes(candidates)
    next_question = next_best_question(safety, features)
    intake_state = build_progressive_intake_state(intake, safety, next_question)
    summary = practitioner_summary(intake, safety, candidates, synthesis, next_question)
    plan = treatment_plan_draft(candidates, safety["status"], query, safety["context_cautions"], evaluation_packets)
    app_output = build_app_output(query, chunks, limit_per_tradition=limit)
    app_output["case_id"] = intake.get("case_id", "")
    app_output["input_summary"] = summarize_input(intake, safety["red_flags_detected"])
    practical_output = build_practical_output(
        summary,
        synthesis,
        plan,
        safety,
        intake_state,
        app_output["citations"],
        next_question,
    )
    practical_output = apply_symptom_outcome_layer(
        practical_output,
        intake,
        app_output["citations"],
        safety,
        next_question,
    )
    practitioner_output = {
        "case_id": intake.get("case_id", ""),
        "safety_gate": safety,
        "cross_tradition_outcome": {
            **synthesis,
            "practitioner_review_focus": next_question,
        },
        "practical_output": practical_output,
        "treatment_plan_draft": plan,
        "tradition_evaluations": evaluation_packets,
        "intake_state": intake_state,
        "citations": app_output["citations"],
        "practitioner_review_required": True,
        "disclaimer": DISCLAIMER,
        "short_result_disclaimer": SHORT_RESULT_DISCLAIMER,
        "emergency_warning": EMERGENCY_WARNING,
        "schema": "schemas/pattern_app_output.schema.json",
    }
    return {
        "case_id": intake.get("case_id", ""),
        "safety_gate": safety,
        "derived_evaluation_packets": evaluation_packets,
        "intake_state": intake_state,
        "practitioner_output": practitioner_output,
        "normalized_features": features,
        "retrieval": results,
        "candidates": {
            "ayurveda": candidates.get("Ayurveda", []),
            "tcm": candidates.get("Traditional Chinese Medicine", []),
            "homeopathy": candidates.get("Homeopathy", []),
        },
        "practitioner_summary": summary,
        "practical_output": practical_output,
        "treatment_plan_draft": plan,
        "client_teaching_sequence": client_teaching_sequence(summary, plan, safety),
        "synthesis_trace": synthesis,
        "next_best_question": next_question,
        "app_output": app_output,
        "brain_stage": "trace_prototype_v1",
        "prototype_warning": (
            "Prototype note: this result is a source-based pattern exploration. It will become more specific "
            "as more source books, case examples, and intake detail are added."
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Pattern App brain trace prototype.")
    parser.add_argument("intake", nargs="?", type=Path, help="Practitioner intake JSON file.")
    parser.add_argument("--stdin", action="store_true", help="Read intake JSON from stdin.")
    parser.add_argument("--chunks", type=Path, default=CHUNKS_PATH)
    parser.add_argument("--limit", type=int, default=3)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.stdin:
        intake = json.loads(sys.stdin.read())
    elif args.intake:
        intake = json.loads(args.intake.read_text(encoding="utf-8"))
    else:
        raise SystemExit("Provide an intake JSON path or --stdin.")
    print(json.dumps(build_brain_trace(intake, args.chunks, args.limit), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
