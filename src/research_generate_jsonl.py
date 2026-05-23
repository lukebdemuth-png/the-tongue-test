from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.chunking import chunk_record
from research_ingestion.io import read_jsonl, write_jsonl
from research_ingestion.nlp_tags import enrich_record
from research_ingestion.schema import normalize_record


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate embeddings-ready JSONL chunks.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--records-output", type=Path, required=True)
    parser.add_argument("--chunks-output", type=Path, required=True)
    args = parser.parse_args()

    records = [enrich_record(normalize_record(row)) for row in read_jsonl(args.input)]
    chunks = []
    for record in records:
        chunks.extend(chunk_record(record))
    write_jsonl(args.records_output, records)
    write_jsonl(args.chunks_output, chunks)
    print(f"Wrote {len(records)} records and {len(chunks)} chunks")


if __name__ == "__main__":
    main()
