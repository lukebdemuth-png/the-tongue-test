from __future__ import annotations

import argparse
import re
from pathlib import Path

from research_ingestion.io import write_jsonl
from research_ingestion.nlp_tags import enrich_record
from research_ingestion.pubmed import pmc_fetch

AYURCEL_TAGS = [
    "Ayurveda",
    "clinical decision support",
    "e-learning",
    "diagnostic reasoning",
    "clinical reasoning",
    "pattern recognition",
    "practitioner training",
    "high-priority architecture source",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest a PMC full-text article by PMCID.")
    parser.add_argument("--pmcid", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--email", default=None, help="Optional NCBI contact email.")
    parser.add_argument("--high-priority-ayurcel", action="store_true")
    args = parser.parse_args()

    record = pmc_fetch(args.pmcid, email=args.email)
    if args.high_priority_ayurcel:
        record = apply_ayurcel_priority_metadata(record)
    record = enrich_record(record)
    write_jsonl(args.output, [record])
    print(f"Wrote PMC record for {args.pmcid} to {args.output}")


def apply_ayurcel_priority_metadata(record: dict) -> dict:
    record = dict(record)
    record["priority"] = "high"
    record["tags"] = sorted(set(record.get("tags") or []) | set(AYURCEL_TAGS))
    record["tradition"] = sorted(set(record.get("tradition") or []) | {"Ayurveda"})
    record["identifiers"] = {
        **dict(record.get("identifiers") or {}),
        "pmcid": "PMC11874735",
        "pmid": "39951853",
        "doi": "10.1016/j.jaim.2024.101107",
    }
    record["source_url"] = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11874735/"
    record["full_text_url"] = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11874735/"
    record["system_architecture_ideas"] = extract_focus_sentences(
        record.get("text", ""),
        ["architecture", "platform", "module", "system", "e-learning", "decision support", "knowledge"],
    )
    record["decision_support_logic"] = extract_focus_sentences(
        record.get("text", ""),
        ["decision support", "diagnostic", "diagnosis", "reasoning", "recommendation", "algorithm", "rule"],
    )
    record["clinical_reasoning_frameworks"] = extract_focus_sentences(
        record.get("text", ""),
        ["clinical reasoning", "diagnostic reasoning", "pattern", "prakriti", "vikriti", "assessment", "case"],
    )
    record["terminology"] = sorted(
        set(record.get("terminology") or [])
        | {
            "AyurCeL",
            "Ayurveda",
            "clinical decision support",
            "e-learning",
            "diagnostic reasoning",
            "clinical reasoning",
            "pattern recognition",
            "practitioner training",
        }
    )
    return record


def extract_focus_sentences(text: str, keywords: list[str], limit: int = 12) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    matches = []
    for sentence in sentences:
        clean = re.sub(r"\s+", " ", sentence).strip()
        lowered = clean.lower()
        if clean and any(keyword.lower() in lowered for keyword in keywords):
            matches.append(clean)
        if len(matches) >= limit:
            break
    return matches


if __name__ == "__main__":
    main()
