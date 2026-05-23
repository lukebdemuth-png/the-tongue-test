from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.io import read_jsonl, write_jsonl
from research_ingestion.nlp_tags import enrich_record, extract_intervention_outcome_relationships


def main() -> None:
    parser = argparse.ArgumentParser(description="Identify rule-based intervention/outcome relationships.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    relationships = []
    for row in read_jsonl(args.input):
        relationships.extend(extract_intervention_outcome_relationships(enrich_record(row)))
    write_jsonl(args.output, relationships)
    print(f"Wrote {len(relationships)} relationships to {args.output}")


if __name__ == "__main__":
    main()
