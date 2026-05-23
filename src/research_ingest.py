from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.io import read_jsonl, write_jsonl
from research_ingestion.nlp_tags import enrich_record
from research_ingestion.schema import normalize_record


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize and tag research records.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    records = [enrich_record(normalize_record(row)) for row in read_jsonl(args.input)]
    write_jsonl(args.output, records)
    print(f"Wrote {len(records)} normalized records to {args.output}")


if __name__ == "__main__":
    main()
