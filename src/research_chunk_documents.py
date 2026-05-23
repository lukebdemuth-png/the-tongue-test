from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.chunking import chunk_record
from research_ingestion.io import read_jsonl, write_jsonl


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk normalized research records.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-chars", type=int, default=1800)
    args = parser.parse_args()

    chunks = []
    for record in read_jsonl(args.input):
        chunks.extend(chunk_record(record, max_chars=args.max_chars))
    write_jsonl(args.output, chunks)
    print(f"Wrote {len(chunks)} chunks to {args.output}")


if __name__ == "__main__":
    main()
