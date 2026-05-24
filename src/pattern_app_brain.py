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
        notes = ["Red-flag language detected; suppress treatment-category suggestions."]
    elif context_cautions or "current_medications" in missing or "pregnancy_status" in missing:
        status = "caution"
        notes = ["Medication or pregnancy context is missing; lower confidence and require practitioner review."]
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
    return "pattern_or_treatment_category"


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
        rationale.append("Safety context is incomplete or cautionary; practitioner review remains required.")
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
        "note": "Synthesis compares matched reasoning features after tradition-specific retrieval; it does not merge traditions into one diagnosis.",
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
            "Prototype confidence is based on source-text relevance and citation quality; it is not a diagnosis or prescription."
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
        ["Hold treatment suggestions until red-flag concern is medically assessed."]
        if hold
        else ["Review medications, pregnancy status, conditions, and contraindications before use."]
    )
    context_cautions = context_cautions or []
    priority = "hold_until_clarified" if hold else candidate.get("priority", "exploratory")

    if tradition == "Ayurveda":
        items = [
            ("diet", "Review diet direction that supports digestion/agni and reduces symptom triggers."),
            ("lifestyle", "Review daily routine, meal timing, sleep rhythm, and stress load."),
            ("herbs", "Review Ayurveda herb category only after materia medica and contraindication checks."),
            ("formulas", "Review formula category only after pattern clarity and safety review."),
            ("yoga_breath", "Review gentle practice or breath category only if no red flags or contraindications are present."),
        ]
    elif tradition == "Traditional Chinese Medicine":
        items = [
            ("formulas", "Review formula category after syndrome differentiation is clearer."),
            ("herbs", "Review TCM herb category only after herb-drug and contraindication checks."),
            ("diet", "Review diet direction based on hot/cold, damp/dry, excess/deficiency logic."),
            ("lifestyle", "Review sleep, pacing, stress, and environmental triggers."),
        ]
    else:
        items = [
            ("remedy_differential", "Review remedy differentials after confirming modalities, generals, and peculiar symptoms."),
            ("rubric_cluster", "Review repertory rubric cluster when Boericke/Kent layer is available."),
            ("modalities", "Confirm what reliably makes symptoms better or worse."),
            ("constitution_notes", "Review generals, mental-emotional state, cravings/aversions, and thermal state."),
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
            f"Your practitioner may review {specific_direction} as a source-backed {tradition} direction. "
            "This is not a self-treatment instruction."
        )
    if category in {"herbs", "formulas", "remedy_differential", "rubric_cluster"}:
        return (
            f"Your practitioner may review {tradition} source material to decide whether this category is appropriate. "
            "This is not something to start without qualified review."
        )
    if category == "diet":
        return "The practitioner may look at whether food timing, food qualities, or digestion patterns are part of the case."
    if category == "lifestyle":
        return "The practitioner may review daily rhythm, sleep, stress, activity, and recovery patterns."
    if category == "yoga_breath":
        return "The practitioner may consider gentle practice categories only after safety and tolerance are clear."
    return "The practitioner may use this category to clarify the traditional pattern before making choices."


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
        "action": "Review whether the case points toward weak or variable agni and whether meal timing, food quality, and digestive load need practitioner-guided adjustment.",
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
        "action": "Review whether the case has enough signs of ama or incomplete digestion to justify a lighter, simpler practitioner-guided diet category.",
    },
    {
        "category": "yoga_breath",
        "direction": "Review gentle grounding breath or practice category only if symptoms, capacity, and safety context allow.",
        "triggers": {"vata", "sleep", "anxiety", "low_energy"},
        "keywords": {"vata", "sleep", "regimen", "mind", "body"},
        "action": "Review gentle practice only as supportive education after red flags, dizziness, respiratory issues, and contraindications are excluded.",
    },
    {
        "category": "herbs",
        "direction": "Review Ayurveda digestive herb category only after Dravyaguna or materia medica safety support is available.",
        "triggers": {"variable_or_weak_agni", "possible_ama", "bloating", "appetite"},
        "keywords": {"agni", "appetite", "digests", "undigested", "drug"},
        "action": "Hold specific herb selection until materia medica, contraindications, medications, pregnancy status, and practitioner scope are reviewed.",
    },
    {
        "category": "formulas",
        "direction": "Hold formula selection until pattern clarity, source support, and contraindication review are stronger.",
        "triggers": {"vata", "pitta", "kapha", "variable_or_weak_agni", "possible_ama"},
        "keywords": {"treatment", "therapy", "dosas", "agni", "sodhana", "samana"},
        "action": "Use formula direction as a placeholder for practitioner review; do not treat as a recommended formula.",
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
                    ["Hold treatment suggestions until red-flag concern is medically assessed."]
                    if hold
                    else ["Review medications, pregnancy status, conditions, and contraindications before use."]
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
        "action": "Review whether low energy, bloating, poor appetite, heaviness, or loose stool language suggests a TCM diet category for practitioner evaluation.",
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
        "action": "Use formula category only as a practitioner-review placeholder; do not present a named formula until stronger formula-source and safety data exist.",
    },
    {
        "category": "herbs",
        "direction": "Hold TCM herb selection until materia medica support and herb-drug contraindication review are available.",
        "triggers": {"spleen_qi_or_damp_tendency", "heat_tendency", "cold_tendency", "shen_sleep_involvement"},
        "keywords": {"qi", "yin", "yang", "heat", "cold", "stomach", "heart"},
        "action": "Review the herb category only after materia medica, medications, pregnancy status, and practitioner scope are checked.",
    },
    {
        "category": "acupuncture_moxibustion",
        "direction": "Review acupuncture or moxibustion category only as a pattern-management strategy after full TCM assessment.",
        "triggers": {"cold_tendency", "spleen_qi_or_damp_tendency", "liver_qi_constraint_tendency", "shen_sleep_involvement"},
        "keywords": {"channel", "qi", "cold", "heat", "depletion", "repletion"},
        "action": "Review whether channel, cold/heat, excess/deficiency, and shen signs justify an acupuncture or moxibustion discussion with a qualified practitioner.",
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
                    ["Hold treatment suggestions until red-flag concern is medically assessed."]
                    if hold
                    else ["Review medications, pregnancy status, conditions, and contraindications before use."]
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
                "safety_notes": ["Practitioner review required; this is not a dosing or self-treatment recommendation."],
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
                    "Your practitioner may use this repertory rubric as a symptom-index clue. "
                    "It is not a remedy choice by itself."
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
                "safety_notes": ["Practitioner review required; repertory rubrics do not diagnose or prescribe."],
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
            "scope": "Practitioner-review treatment plan draft; not diagnosis, prescription, or patient self-treatment instructions.",
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
        "scope": "Practitioner-review treatment plan draft; not diagnosis, prescription, or patient self-treatment instructions.",
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
                "teaching": "Once immediate concerns are ruled out, the practitioner can review traditional pattern information more responsibly.",
            },
        ]
    return [
        {
            "step": "What we are noticing",
            "teaching": f"The main concern appears to be {summary.get('case_snapshot') or 'the symptom pattern described'} with related context that may involve sleep, digestion, energy, mood, or modalities.",
        },
        {
            "step": "How this is understood traditionally",
            "teaching": "The practitioner is comparing separate traditional maps rather than forcing them into one diagnosis.",
        },
        {
            "step": "Why categories may be relevant",
            "teaching": "The plan draft groups possible directions such as diet, lifestyle, herbs, formulas, remedy differentials, or practices so the practitioner can review what fits and what is safe.",
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
        "summary": "Low energy is a broad signal. First-pass review should look for sleep debt, digestion/appetite changes, stress load, timing after meals or exertion, and safety context before choosing any traditional direction.",
        "signals": ["energy pattern", "sleep relationship", "digestion relationship", "stress load"],
        "actions": [
            ("diet", "Track whether energy drops after meals, with skipped meals, or with heavy foods; review meal timing and digestibility before adding stronger interventions."),
            ("sleep", "Review sleep quantity, waking time, dreams, night sweats, and whether rest actually restores energy."),
            ("movement", "Consider gentle, capacity-matched movement only if it improves energy without next-day depletion."),
            ("observation", "Log morning, afternoon, after-meal, and after-exertion energy for several days to identify the strongest pattern."),
            ("practitioner_follow_up", "Clarify medications, pregnancy status, anemia history, thyroid history, fever, weight loss, shortness of breath, dizziness, or bleeding before using herbs or formulas."),
        ],
        "review": [
            ("herbs", "Herbs or formulas should stay on hold until the practitioner clarifies whether the fatigue pattern is digestive, sleep-related, depletion-type, stress-related, or medically concerning."),
            ("remedy_differential", "Homeopathic remedy review should focus on modalities, generals, mental-emotional state, thermal state, and what kind of rest or exertion changes the fatigue."),
        ],
    },
    "headache": {
        "summary": "Headache needs safety screening first, then pattern review by location, quality, timing, triggers, digestion, sleep, stress, and temperature sensitivity.",
        "signals": ["pain location", "pain quality", "trigger pattern", "safety screen"],
        "actions": [
            ("avoid_reduce", "Do not treat traditionally first if headache is sudden, the worst of life, follows head injury, or comes with neurological symptoms, fever, stiff neck, vision changes, pregnancy concern, or severe hypertension concern."),
            ("observation", "Record location, quality, onset, duration, light sensitivity, nausea, menstrual timing, food/caffeine relationship, and what makes it better or worse."),
            ("sleep", "Review whether sleep loss, waking time, screens, jaw tension, or late meals are part of the headache pattern."),
            ("diet", "Review hydration, missed meals, alcohol, caffeine change, heavy foods, and food triggers before considering herb or formula categories."),
            ("practitioner_follow_up", "Clarify medication use, migraine history, blood pressure context, injury, fever, neurological symptoms, and pregnancy status."),
        ],
        "review": [
            ("herbs", "Herbs, formulas, and supplements for headache require practitioner review because medication interactions and red flags matter."),
            ("rubric_cluster", "Homeopathy repertory review should begin with location, sensation, modalities, timing, accompanying symptoms, and distinctive features."),
        ],
    },
    "insomnia": {
        "summary": "Poor sleep should be separated into trouble falling asleep, staying asleep, early waking, restless sleep, or non-restorative sleep, then linked to heat, worry, digestion, pain, urination, dreams, or stimulant use.",
        "signals": ["sleep phase", "night timing", "nervous-system load", "digestion relationship"],
        "actions": [
            ("sleep", "Identify the main sleep problem: falling asleep, staying asleep, early waking, restless dreaming, or waking unrefreshed."),
            ("avoid_reduce", "Review caffeine, alcohol, late meals, screens, intense evening work, and late exercise as possible pattern aggravators."),
            ("breathwork", "Consider gentle downshifting breath only if it is calming and does not cause dizziness, anxiety escalation, or air hunger."),
            ("observation", "Track waking time, body temperature, sweating, urination, hunger, worry, pain, and dreams."),
            ("practitioner_follow_up", "Clarify medications, pregnancy/postpartum status, sleep apnea signs, panic symptoms, severe depression, or manic symptoms."),
        ],
        "review": [
            ("formulas", "Sleep formulas should remain practitioner-review only until the sleep pattern, medications, pregnancy status, and contraindications are clear."),
            ("remedy_differential", "Homeopathic review should focus on sleep timing, mental state at night, dreams, temperature, and modalities."),
        ],
    },
    "bloating": {
        "summary": "Bloating should be reviewed through timing after meals, food triggers, stool pattern, gas movement, appetite, stress, and whether warmth, movement, pressure, or passing stool/gas changes it.",
        "signals": ["digestion", "food timing", "stool relationship", "gas movement"],
        "actions": [
            ("diet", "Track which meals, food qualities, speed of eating, and meal timing make bloating better or worse."),
            ("movement", "Review whether light walking after meals improves gas movement or whether movement worsens discomfort."),
            ("avoid_reduce", "Reduce guesswork: avoid adding multiple herbs, supplements, or restrictive diet changes before stool, appetite, and trigger patterns are clear."),
            ("observation", "Record appetite, belching, gas, stool frequency, stool form, abdominal pain, nausea, and relation to stress."),
            ("practitioner_follow_up", "Escalate for severe, persistent, worsening, painful, feverish, bloody, or unexplained weight-loss-associated digestive symptoms."),
        ],
        "review": [
            ("herbs", "Digestive herbs should wait for practitioner review of pregnancy status, medications, reflux, ulcers, gallbladder history, and stool pattern."),
            ("formulas", "Formula review should clarify whether the pattern looks more weak digestion, stagnation, dampness/heaviness, heat, cold, or food intolerance."),
        ],
    },
    "constipation": {
        "summary": "Constipation needs stool frequency, dryness, difficulty, incomplete evacuation, pain, bloating, fluids, movement, travel, stress, and medication context before any traditional intervention is chosen.",
        "signals": ["stool pattern", "dryness", "motility", "medication context"],
        "actions": [
            ("diet", "Review fluids, meal regularity, fiber tolerance, oils/fats, and whether dry or heavy foods are aggravating."),
            ("movement", "Review gentle daily movement and abdominal ease if appropriate for the person’s condition."),
            ("observation", "Track stool frequency, form, straining, dryness, incomplete feeling, pain, gas, and what changes it."),
            ("avoid_reduce", "Avoid stimulant laxative or strong herb assumptions without practitioner review, especially with pregnancy, medications, abdominal pain, or chronic disease."),
            ("practitioner_follow_up", "Clarify severe pain, vomiting, blood, unexplained weight loss, new constipation, medication causes, and pregnancy status."),
        ],
        "review": [
            ("herbs", "Laxative or bowel-moving herbs require careful practitioner review and are not appropriate as automatic suggestions."),
            ("remedy_differential", "Homeopathy review should focus on urging, stool character, sensations, timing, and modalities."),
        ],
    },
    "anxiety": {
        "summary": "Anxiety should be reviewed by trigger, timing, body sensations, sleep, digestion, caffeine/stimulant use, panic features, and safety context.",
        "signals": ["trigger", "body sensations", "sleep relationship", "stimulant relationship"],
        "actions": [
            ("breathwork", "Use only gentle, comfortable breath awareness; stop if breath practices increase panic, dizziness, or air hunger."),
            ("sleep", "Review whether anxiety is worse at night, on waking, after poor sleep, or with dreams."),
            ("avoid_reduce", "Review caffeine, stimulants, alcohol rebound, skipped meals, and doom-scrolling as possible aggravators."),
            ("observation", "Track triggers, time of day, chest sensations, breath changes, digestion, restlessness, and what reliably helps."),
            ("practitioner_follow_up", "Escalate urgently for chest pain, fainting, suicidal thoughts, mania, psychosis, severe panic, or substance withdrawal concerns."),
        ],
        "review": [
            ("herbs", "Calming herbs or formulas require practitioner review for medications, pregnancy status, sedation, bipolar history, and interactions."),
            ("remedy_differential", "Homeopathy review should focus on fears, triggers, restlessness, consolation, temperature, sleep, and peculiar symptoms."),
        ],
    },
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
) -> dict[str, Any]:
    return {
        "tradition": "Cross-tradition intake",
        "category": category,
        "direction": action,
        "practitioner_action": action,
        "confidence_score": confidence,
        "review_priority": review_priority,
        "citations": citations[:3],
        "safety_notes": ["Practitioner review required; educational pattern-support output only."],
    }


def apply_symptom_outcome_layer(
    practical_output: dict[str, Any],
    intake: dict[str, Any],
    citations: list[dict[str, Any]],
    safety: dict[str, Any],
    next_question: str,
) -> dict[str, Any]:
    normalized = normalize_intake_symptoms(intake)
    canonical = [item["canonical"] for item in normalized if item["canonical"] in SYMPTOM_OUTCOME_PROFILES]
    if not canonical:
        return practical_output

    citation_groups = citation_ids_by_tradition(citations)
    cross_citations = [
        *(citation_groups.get("Ayurveda") or [])[:1],
        *(citation_groups.get("Traditional Chinese Medicine") or [])[:1],
        *(citation_groups.get("Homeopathy") or [])[:1],
    ]
    action_rows: list[dict[str, Any]] = []
    review_rows: list[dict[str, Any]] = []
    summaries: list[str] = []
    signals: list[str] = []
    seen_actions: set[tuple[str, str]] = set()

    for canonical_symptom in canonical[:4]:
        profile = SYMPTOM_OUTCOME_PROFILES[canonical_symptom]
        summaries.append(profile["summary"])
        signals.extend(profile.get("signals", []))
        for category, action in profile.get("actions", []):
            key = (category, action)
            if key in seen_actions:
                continue
            seen_actions.add(key)
            action_rows.append(outcome_row(category, action, cross_citations, 74 if safety["status"] == "clear" else 66))
        for category, action in profile.get("review", []):
            key = (category, action)
            if key in seen_actions:
                continue
            seen_actions.add(key)
            review_rows.append(outcome_row(category, action, cross_citations, 68 if safety["status"] == "clear" else 58, "review_second"))

    case_snapshot = intake.get("symptoms", {}).get("chief_complaint") or ", ".join(
        intake.get("symptoms", {}).get("primary_symptoms", [])
    )
    practical_output["likely_pattern_summary"] = {
        **practical_output.get("likely_pattern_summary", {}),
        "case_snapshot": case_snapshot,
        "plain_language_summary": " ".join(summaries[:3]),
        "shared_pattern_signals": sorted(set(signals))[:10],
    }
    practical_output["confidence"] = {
        **practical_output.get("confidence", {}),
        "score": 68 if safety["status"] == "caution" else practical_output.get("confidence", {}).get("score", 72),
        "label": "first-pass practical guidance, practitioner review required",
        "basis": (
            "Generated from recognized symptom profiles, safety screening, and available source-linked retrieval. "
            "Confidence remains limited until the missing intake questions are answered."
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
        warnings.append("See an appropriate medical professional before using traditional-system recommendations.")
    for caution in safety.get("context_cautions", []):
        note = caution.get("note")
        if note and note not in warnings:
            warnings.append(note)
    for item in plan_items(plan):
        for note in item.get("contraindications", []):
            if note not in warnings:
                warnings.append(note)
    if not warnings:
        warnings.append("Practitioner review is required before herbs, formulas, remedies, diet changes, or practices are used.")
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
        "scope": "Working prototype output for qualified practitioner review; educational only and not a diagnosis or prescription.",
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
            "This is a transparent reasoning prototype. It ranks source-supported traditional relevance "
            "for practitioner review; it does not diagnose or prescribe."
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
