from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.transcripts import clean_transcript


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean transcript text without copying private extracts into git.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(clean_transcript(args.input.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Wrote cleaned transcript to {args.output}")


if __name__ == "__main__":
    main()
