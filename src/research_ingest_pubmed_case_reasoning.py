from __future__ import annotations

import argparse
import json
import time
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError

from research_ingestion.chunking import chunk_record
from research_ingestion.index import build_master_index
from research_ingestion.io import append_jsonl, write_jsonl
from research_ingestion.nlp_tags import enrich_record, extract_intervention_outcome_relationships
from research_ingestion.pubmed import pmc_fetch, pubmed_fetch, pubmed_search

SEARCH_TERMS = [
    "Ayurveda case report",
    "Ayurvedic management case study",
    "TCM syndrome differentiation",
    "Traditional Chinese Medicine case report",
    "Homeopathy case report",
    "Homeopathic clinical case",
    "Integrative medicine case study",
    "Constitutional medicine",
    "Whole systems medicine",
    "Pattern differentiation",
    "Clinical reasoning",
    "Differential diagnosis",
]

CASE_REASONING_FILTER = (
    '("case reports"[Publication Type] OR "case report"[Title/Abstract] OR '
    '"case study"[Title/Abstract] OR "clinical case"[Title/Abstract] OR '
    '"clinical reasoning"[Title/Abstract] OR "differential diagnosis"[Title/Abstract] OR '
    '"pattern differentiation"[Title/Abstract] OR "syndrome differentiation"[Title/Abstract] OR '
    '"constitutional medicine"[Title/Abstract] OR "practitioner reasoning"[Title/Abstract] OR '
    '"intervention rationale"[Title/Abstract] OR "outcome tracking"[Title/Abstract] OR '
    '"longitudinal follow-up"[Title/Abstract] OR "diagnostic methodology"[Title/Abstract] OR '
    '"integrative medicine"[Title/Abstract])'
)

TARGET_TAGS = [
    "ayurveda",
    "tcm",
    "homeopathy",
    "case study",
    "clinical reasoning",
    "differential diagnosis",
    "constitutional pattern",
    "intervention outcome",
    "practitioner methodology",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Search PubMed/PMC for case studies and clinical reasoning papers.")
    parser.add_argument("--output-dir", type=Path, default=Path("sources/metadata/pubmed_case_reasoning"))
    parser.add_argument("--retmax-per-term", type=int, default=200)
    parser.add_argument("--email", default=None, help="Optional NCBI contact email.")
    parser.add_argument("--skip-pmc-full-text", action="store_true")
    parser.add_argument("--max-pmc-full-text", type=int, default=75)
    parser.add_argument("--clear-error-log", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.34)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    error_log = args.output_dir / "error_log.jsonl"
    if args.clear_error_log and error_log.exists():
        error_log.unlink()
    error_log.touch()
    manifest = build_manifest(args.retmax_per_term)
    (args.output_dir / "metadata_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=True, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    pmid_terms = search_all_terms(args.retmax_per_term, args.email, error_log, args.sleep)
    print(f"Found {len(pmid_terms)} unique PubMed IDs")
    pubmed_records = fetch_pubmed_records(sorted(pmid_terms), args.email, error_log, args.sleep)
    print(f"Fetched {len(pubmed_records)} PubMed metadata records")
    records = merge_search_terms(pubmed_records, pmid_terms)
    if not args.skip_pmc_full_text:
        records = attach_open_access_pmc_text(records, args.email, error_log, args.sleep, args.max_pmc_full_text)
        print(f"Attempted PMC full-text enrichment for up to {args.max_pmc_full_text} open-access records")
    records = [apply_case_reasoning_metadata(record) for record in records]
    records.sort(key=lambda row: (row.get("publication", ""), row.get("date", ""), row.get("title", "")))

    chunks = []
    for record in records:
        chunks.extend(chunk_record(record))
    relationships = build_relationship_map(records)
    symptom_map = build_symptom_map(records)
    index = build_master_index(records, chunks)

    write_jsonl(args.output_dir / "records.jsonl", records)
    write_jsonl(args.output_dir / "chunks.jsonl", chunks)
    write_jsonl(args.output_dir / "intervention_outcome_relationships.jsonl", relationships)
    (args.output_dir / "symptom_map.json").write_text(json.dumps(symptom_map, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (args.output_dir / "master_index.json").write_text(json.dumps(index, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} records, {len(chunks)} chunks, and {len(relationships)} relationships to {args.output_dir}")


def search_all_terms(retmax: int, email: str | None, error_log: Path, sleep: float) -> dict[str, set[str]]:
    pmid_terms: dict[str, set[str]] = defaultdict(set)
    for term in SEARCH_TERMS:
        query = f"({term}) AND {CASE_REASONING_FILTER}"
        try:
            pmids = pubmed_search(query, retmax=retmax, email=email)
            print(f"Search {term!r}: {len(pmids)} PMIDs")
            for pmid in pmids:
                pmid_terms[pmid].add(term)
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            log_error(error_log, "search", term, exc)
        time.sleep(sleep)
    return pmid_terms


def fetch_pubmed_records(pmids: list[str], email: str | None, error_log: Path, sleep: float) -> list[dict]:
    records = []
    for start in range(0, len(pmids), 100):
        batch = pmids[start : start + 100]
        try:
            records.extend(pubmed_fetch(batch, email=email))
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            log_error(error_log, "pubmed_fetch", ",".join(batch), exc)
        time.sleep(sleep)
    return records


def merge_search_terms(records: list[dict], pmid_terms: dict[str, set[str]]) -> list[dict]:
    by_key = {}
    for record in records:
        identifiers = record.get("identifiers", {})
        key = identifiers.get("pmid") or identifiers.get("pmcid") or identifiers.get("doi") or record.get("source_url")
        if key in by_key:
            by_key[key]["search_terms"] = sorted(set(by_key[key].get("search_terms", [])) | pmid_terms.get(identifiers.get("pmid", ""), set()))
            continue
        row = dict(record)
        row["search_terms"] = sorted(pmid_terms.get(identifiers.get("pmid", ""), set()))
        by_key[key] = row
    return list(by_key.values())


def attach_open_access_pmc_text(records: list[dict], email: str | None, error_log: Path, sleep: float, max_full_text: int) -> list[dict]:
    enriched = []
    attempts = 0
    for record in records:
        pmcid = record.get("identifiers", {}).get("pmcid", "")
        if not pmcid or attempts >= max_full_text:
            enriched.append(record)
            continue
        attempts += 1
        try:
            pmc_record = pmc_fetch(pmcid, email=email)
            merged = {**record, **pmc_record}
            merged["search_terms"] = record.get("search_terms", [])
            merged["source_url"] = pmc_record.get("source_url") or record.get("source_url", "")
            enriched.append(merged)
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            log_error(error_log, "pmc_fetch", pmcid, exc)
            enriched.append(record)
        time.sleep(sleep)
    return enriched


def apply_case_reasoning_metadata(record: dict) -> dict:
    row = enrich_record(record)
    text = " ".join(str(row.get(field, "")) for field in ["title", "abstract", "text"])
    lowered = text.lower()
    tags = set(row.get("tags", []))
    if "ayurveda" in lowered or "ayurvedic" in lowered:
        tags.add("ayurveda")
    if "traditional chinese medicine" in lowered or "tcm" in lowered or "syndrome differentiation" in lowered:
        tags.add("tcm")
    if "homeopathy" in lowered or "homeopathic" in lowered or "homoeopathy" in lowered or "homoeopathic" in lowered:
        tags.add("homeopathy")
        row["tradition"] = sorted(set(row.get("tradition", [])) | {"Homeopathy"})
    if "case report" in lowered or "case study" in lowered or "clinical case" in lowered:
        tags.add("case study")
    row["tags"] = sorted(tags | set(tag for tag in TARGET_TAGS if tag in tags))
    row["source_collection"] = "pubmed_case_reasoning"
    row["retrieval_date"] = row.get("retrieval_date") or date.today().isoformat()
    return row


def build_symptom_map(records: list[dict]) -> dict:
    symptom_map: dict[str, list[dict]] = defaultdict(list)
    for record in records:
        for symptom in record.get("symptoms", []):
            symptom_map[symptom].append(
                {
                    "title": record.get("title", ""),
                    "tradition": record.get("tradition", []),
                    "diagnosis_pattern": record.get("diagnosis_pattern", []),
                    "interventions": record.get("interventions", []),
                    "outcomes": record.get("outcomes", []),
                    "source_url": record.get("source_url", ""),
                }
            )
    return dict(sorted(symptom_map.items()))


def build_relationship_map(records: list[dict]) -> list[dict]:
    relationships = []
    for record in records:
        relationships.extend(extract_intervention_outcome_relationships(record))
        for intervention in record.get("interventions", []):
            for outcome in record.get("outcomes", []):
                item = {
                    "title": record.get("title", ""),
                    "tradition": record.get("tradition", []),
                    "intervention": intervention,
                    "outcome": outcome,
                    "diagnosis_pattern": record.get("diagnosis_pattern", []),
                    "confidence_language": record.get("confidence_language", []),
                    "contradictions_limitations": record.get("contradictions_limitations", []),
                    "source_url": record.get("source_url", ""),
                }
                if item not in relationships:
                    relationships.append(item)
    return relationships


def build_manifest(retmax: int) -> dict:
    return {
        "created": datetime.now(timezone.utc).isoformat(),
        "sources": ["https://pubmed.ncbi.nlm.nih.gov/", "https://pmc.ncbi.nlm.nih.gov/"],
        "policy": "PubMed E-utilities API first; PMC full text only when PMCID is available; no paywall/login bypassing.",
        "retmax_per_term": retmax,
        "search_terms": SEARCH_TERMS,
        "case_reasoning_filter": CASE_REASONING_FILTER,
        "collect_fields": [
            "title",
            "abstract",
            "authors",
            "journal",
            "publication year",
            "PMCID",
            "PMID",
            "DOI",
            "keywords",
            "symptoms",
            "diagnosis/pattern",
            "interventions",
            "outcomes",
            "confidence language",
            "contradictions/limitations",
            "source URL",
        ],
        "tags": TARGET_TAGS,
    }


def log_error(path: Path, stage: str, target: str, exc: Exception) -> None:
    append_jsonl(
        path,
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
            "target": target,
            "error": str(exc),
        },
    )


if __name__ == "__main__":
    main()
