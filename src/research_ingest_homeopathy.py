from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.io import read_jsonl, write_jsonl
from research_ingestion.nlp_tags import enrich_record
from research_ingestion.schema import normalize_record

HOMEOPATHY_TAGS = [
    "homeopathy",
    "materia medica",
    "repertory",
    "constitutional pattern",
    "remedy relationship",
    "symptom cluster",
    "intervention outcome",
]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize open-access homeopathy metadata/text records for retrieval."
    )
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    records = [apply_homeopathy_defaults(enrich_record(normalize_record(row))) for row in read_jsonl(args.input)]
    write_jsonl(args.output, records)
    print(f"Wrote {len(records)} homeopathy records to {args.output}")


def apply_homeopathy_defaults(record: dict) -> dict:
    record = dict(record)
    record["source_collection"] = record.get("source_collection") or "homeopathy"
    record["tradition"] = sorted(set(record.get("tradition") or []) | {"Homeopathy"})
    record["tags"] = sorted(set(record.get("tags") or []) | {"homeopathy"})
    record["terminology"] = sorted(set(record.get("terminology") or []) | set(HOMEOPATHY_TAGS))
    return record


if __name__ == "__main__":
    main()
