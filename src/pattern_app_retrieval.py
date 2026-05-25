"""Simple retrieval, citation, and output scaffolding for the Pattern App."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from src.pattern_app_symptom_normalizer import expanded_query_text


CHUNKS_PATH = Path("data/chunks/pattern_app_core_chunks.jsonl")
TRADITIONS = ["Ayurveda", "Traditional Chinese Medicine", "Homeopathy"]
RED_FLAGS = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "stroke",
    "stroke-like",
    "suicidal",
    "suicidal ideation",
    "severe allergic reaction",
    "anaphylaxis",
    "pregnancy complications",
    "high fever",
    "severe dehydration",
    "acute abdominal pain",
    "uncontrolled bleeding",
    "sudden neurological",
]
SUGGESTED_CATEGORY_FIELDS = {
    "Ayurveda": {
        "herbs": [],
        "formulas": [],
        "diet": [],
        "lifestyle": [],
        "yoga_breath_practices": [],
    },
    "Traditional Chinese Medicine": {
        "herbs": [],
        "formulas": [],
        "diet": [],
        "lifestyle": [],
    },
    "Homeopathy": {
        "remedy_differentials": [],
        "modalities": [],
        "constitution_notes": [],
    },
}
DISCLAIMER = (
    "Patterns is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. "
    "The information provided is for informational and educational purposes only. Always consult a qualified "
    "healthcare professional for medical advice, diagnosis, or treatment."
)
SHORT_RESULT_DISCLAIMER = "Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns."
EMERGENCY_WARNING = "If you are experiencing a medical emergency, call emergency services immediately."


def read_jsonl(path: Path = CHUNKS_PATH) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z\-']+", text.lower())


def query_terms(query: str) -> set[str]:
    stopwords = {
        "and", "or", "the", "a", "an", "of", "to", "in", "with", "for", "from", "is", "are",
        "patient", "symptom", "symptoms", "notes", "has", "have", "mild", "severe",
        "moderate", "standard", "brief", "detailed", "adult", "educational", "practitioner",
        "review", "source", "sources", "relevance", "traditional", "compare", "comparison",
        "case", "current", "known", "clinical", "setting", "several", "weeks",
        "any", "before", "context", "check", "safety", "none", "not", "pregnant",
        "herb", "herbs", "formula", "formulas", "supplement", "supplements",
        "test", "single", "word", "prototype", "production", "style", "minimal",
        "provided", "intentionally",
        "cant", "can't", "cannot",
    }
    expanded = expanded_query_text(query)
    return {term for term in tokenize(expanded) if len(term) > 2 and term not in stopwords}


def citation_id(chunk: dict[str, Any]) -> str:
    return chunk["chunk_id"].replace(":", "-").replace(" ", "-")


def render_citation(chunk: dict[str, Any]) -> dict[str, Any]:
    contributors = chunk.get("translator_authors") or chunk.get("author_authors") or []
    pages = (
        str(chunk["page_start"])
        if chunk.get("page_start") == chunk.get("page_end")
        else f"{chunk.get('page_start')}-{chunk.get('page_end')}"
    )
    return {
        "citation_id": citation_id(chunk),
        "tradition": chunk["tradition"],
        "source": chunk["title"],
        "book": chunk["book"],
        "author_or_translator": ", ".join(contributors) if contributors else "Unknown",
        "edition": chunk.get("edition", "Unknown"),
        "section": chunk.get("section", "Unknown"),
        "chapter": chunk.get("chapter", "Unknown"),
        "locator": chunk.get("stable_locator", "Unknown"),
        "pages": pages,
        "url": chunk.get("source_url", "Unknown"),
        "retrieval_date": chunk.get("retrieval_date", "Unknown"),
        "rights_note": chunk.get("license_or_rights_note", "Unknown"),
    }


def source_authority_score(chunk: dict[str, Any]) -> float:
    category = chunk.get("source_category", "").lower()
    layer = chunk.get("canonical_layer", "").lower()
    if "classical authoritative" in category or "foundational" in layer:
        return 88.0
    if "clinical pattern" in category:
        return 82.0
    if "materia" in category or "repertory" in category:
        return 78.0
    return 55.0


def source_quality_tier(authority: float, citation_quality: float) -> str:
    combined = (authority * 0.55) + (citation_quality * 0.45)
    if combined >= 85:
        return "high_authority_high_citation_quality"
    if combined >= 70:
        return "usable_source_supported"
    if combined >= 50:
        return "limited_source_support"
    return "weak_or_incomplete_source_support"


def citation_quality_score(chunk: dict[str, Any]) -> float:
    score = 40.0
    if chunk.get("page_start") is not None:
        score += 20
    if chunk.get("stable_locator") and chunk["stable_locator"] != "Unknown":
        score += 20
    if chunk.get("source_url") and chunk["source_url"] != "Unknown":
        score += 10
    if chunk.get("translator_authors") or chunk.get("author_authors"):
        score += 10
    return min(score, 100.0)


GENERIC_CHAPTER_PHRASES = [
    "now we shall discuss",
    "now we shall discourse",
    "we shall discourse",
    "chapter which treats",
    "chapter which deals",
    "having made obeisance",
    "foreword",
    "published by",
    "all rights reserved",
    "no part of this publication",
]


def content_quality_penalty(chunk: dict[str, Any], matched_terms: set[str]) -> float:
    text = " ".join([chunk.get("text", ""), chunk.get("section", ""), chunk.get("chapter", "")]).lower()
    penalty = 0.0
    if any(phrase in text[:1400] for phrase in GENERIC_CHAPTER_PHRASES):
        penalty += 12.0
    if len(text) < 180:
        penalty += 6.0
    if len(matched_terms) == 1 and next(iter(matched_terms), "") in {"pain", "head", "low", "dry", "hard"}:
        penalty += 8.0
    if "ocr ran on this scanned page" in text or "no readable text" in text:
        penalty += 30.0
    return min(penalty, 40.0)


def score_chunk(chunk: dict[str, Any], terms: set[str]) -> tuple[float, dict[str, Any]]:
    text = " ".join(
        [
            chunk.get("text", ""),
            chunk.get("section", ""),
            chunk.get("chapter", ""),
            chunk.get("stable_locator", ""),
        ]
    ).lower()
    tokens = set(tokenize(text))
    exact_matches = terms & tokens
    substring_matches = {term for term in terms if term not in exact_matches and term in text}
    if not exact_matches and not substring_matches:
        return 0.0, {}

    matched_terms = exact_matches | substring_matches
    symptom_match = min(100.0, (len(exact_matches) * 22) + (len(substring_matches) * 10))
    authority = source_authority_score(chunk)
    citation_quality = citation_quality_score(chunk)
    tradition_fit = 75.0
    safety_completeness = 55.0
    quality_penalty = content_quality_penalty(chunk, matched_terms)
    score = (
        symptom_match * 0.35
        + authority * 0.20
        + citation_quality * 0.20
        + tradition_fit * 0.15
        + safety_completeness * 0.10
        - quality_penalty
    )
    score = max(0.0, score)
    details = {
        "matched_terms": sorted(matched_terms),
        "symptom_match": round(symptom_match, 2),
        "source_authority": round(authority, 2),
        "citation_quality": round(citation_quality, 2),
        "content_quality_penalty": round(quality_penalty, 2),
        "source_quality_tier": source_quality_tier(authority, citation_quality),
        "tradition_specific_fit": round(tradition_fit, 2),
        "safety_completeness": round(safety_completeness, 2),
        "ranking_formula": "symptom_match*.35 + source_authority*.20 + citation_quality*.20 + tradition_specific_fit*.15 + safety_completeness*.10 - content_quality_penalty",
    }
    return round(score, 2), details


def confidence_label(score: float) -> str:
    if score >= 85:
        return "strong source-supported match"
    if score >= 70:
        return "likely match, qualified professional review required"
    if score >= 50:
        return "possible match, needs more intake detail"
    if score >= 30:
        return "weak match, exploratory only"
    return "insufficient evidence"


def detect_red_flags(text: str) -> list[str]:
    lowered = text.lower()
    return [flag for flag in RED_FLAGS if flag in lowered]


def search(query: str, chunks: list[dict[str, Any]], limit_per_tradition: int = 5) -> dict[str, list[dict[str, Any]]]:
    terms = query_terms(query)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for chunk in chunks:
        score, details = score_chunk(chunk, terms)
        if score <= 0:
            continue
        result = {
            "chunk_id": chunk["chunk_id"],
            "tradition": chunk["tradition"],
            "score": score,
            "confidence_label": confidence_label(score),
            "score_details": details,
            "citation": render_citation(chunk),
            "text_preview": chunk["text"][:600],
        }
        grouped[chunk["tradition"]].append(result)

    output: dict[str, list[dict[str, Any]]] = {}
    for tradition in TRADITIONS:
        ranked = sorted(grouped.get(tradition, []), key=lambda item: item["score"], reverse=True)
        output[tradition] = ranked[:limit_per_tradition]
    return output


def empty_suggested_categories(tradition: str) -> dict[str, list[Any]]:
    return {field: [] for field in SUGGESTED_CATEGORY_FIELDS[tradition]}


def build_app_output(query: str, chunks: list[dict[str, Any]], limit_per_tradition: int = 3) -> dict[str, Any]:
    red_flags = detect_red_flags(query)
    results = search(query, chunks, limit_per_tradition=limit_per_tradition)
    citations = []
    seen = set()
    for tradition_results in results.values():
        for result in tradition_results:
            cid = result["citation"]["citation_id"]
            if cid not in seen:
                citations.append(result["citation"])
                seen.add(cid)

    def analysis(tradition: str, key: str) -> dict[str, Any]:
        tradition_results = results[tradition]
        avg_score = (
            round(sum(item["score"] for item in tradition_results) / len(tradition_results), 2)
            if tradition_results
            else 0
        )
        output = {
            key: [
                {
                    "label": item["citation"]["locator"],
                    "score": item["score"],
                    "confidence_label": item["confidence_label"],
                    "matched_terms": item["score_details"]["matched_terms"],
                    "citation_id": item["citation"]["citation_id"],
                }
                for item in tradition_results
            ],
            "supporting_citations": [item["citation"]["citation_id"] for item in tradition_results],
            "suggested_categories": empty_suggested_categories(tradition),
            "contraindications": [],
            "confidence_score": avg_score,
            "practitioner_review_required": True,
        }
        if tradition == "Homeopathy":
            output["key_repertory_rubrics"] = []
        return output

    suppress = bool(red_flags)
    return {
        "case_id": "",
        "input_summary": {
            "primary_symptoms": list(query_terms(query)),
            "secondary_symptoms": [],
            "duration": "",
            "severity": "",
            "constitution_context": "",
            "red_flags_detected": red_flags,
            "missing_information": ["medications", "pregnancy status when relevant", "duration", "severity"],
        },
        "ayurveda_analysis": analysis("Ayurveda", "likely_patterns"),
        "tcm_analysis": analysis("Traditional Chinese Medicine", "likely_patterns"),
        "homeopathy_analysis": analysis("Homeopathy", "likely_remedy_directions"),
        "cross_tradition_synthesis": {
            "shared_themes": [],
            "areas_of_agreement": [],
            "areas_of_conflict": [],
            "combined_practitioner_notes": (
                ["Red flag detected; prioritize appropriate medical evaluation before traditional-system interpretation."]
                if suppress
                else ["Review tradition-specific matches side by side; current prototype ranks source relevance for informational pattern exploration only."]
            ),
            "suggested_wellness_direction_categories": {
                "herbs_by_tradition": [] if suppress else [],
                "formulas_by_tradition": [] if suppress else [],
                "lifestyle": [] if suppress else [],
                "breath_or_meditation": [] if suppress else [],
            },
            "safety_notes": (
                [f"Traditional suggestions suppressed because red-flag language was detected. {EMERGENCY_WARNING}"]
                if suppress
                else ["Qualified professional review required before any herbs, formulas, remedies, diet, lifestyle, yoga, breath, or meditation use."]
            ),
            "confidence_score": 0,
        },
        "citations": citations,
        "disclaimer": DISCLAIMER,
        "short_result_disclaimer": SHORT_RESULT_DISCLAIMER,
        "emergency_warning": EMERGENCY_WARNING,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pattern App retrieval prototype.")
    parser.add_argument("query", nargs="*", help="Search query or practitioner notes.")
    parser.add_argument("--chunks", type=Path, default=CHUNKS_PATH)
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--app-output", action="store_true", help="Return MVP app output shape.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    query = " ".join(args.query).strip()
    if not query:
        raise SystemExit("Provide a query, e.g. python3 src/pattern_app_retrieval.py sleep digestion")
    chunks = read_jsonl(args.chunks)
    if args.app_output:
        print(json.dumps(build_app_output(query, chunks, args.limit), ensure_ascii=False, indent=2))
    else:
        print(json.dumps(search(query, chunks, args.limit), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
