from __future__ import annotations

import argparse
import json
from pathlib import Path

from research_ingestion.index import build_master_index
from research_ingestion.io import read_jsonl


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a master source index from records and chunks.")
    parser.add_argument("--records", type=Path, required=True)
    parser.add_argument("--chunks", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    index = build_master_index(read_jsonl(args.records), read_jsonl(args.chunks))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(index, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote master source index to {args.output}")


if __name__ == "__main__":
    main()
