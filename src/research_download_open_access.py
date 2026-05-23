from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.config import METADATA_DIR, SOURCES_DIR
from research_ingestion.io import read_jsonl
from research_ingestion.polite import download_open_access_file


def main() -> None:
    parser = argparse.ArgumentParser(description="Download legal open-access files referenced in metadata.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=SOURCES_DIR / "metadata" / "downloads")
    parser.add_argument("--error-log", type=Path, default=METADATA_DIR / "error_log.jsonl")
    args = parser.parse_args()

    count = 0
    for index, record in enumerate(read_jsonl(args.input), start=1):
        url = record.get("pdf_url") or record.get("full_text_url")
        if not url or record.get("open_access") is False:
            continue
        suffix = ".pdf" if ".pdf" in url.lower() else ".html"
        destination = args.output_dir / f"source_{index:04d}{suffix}"
        if download_open_access_file(url, destination, error_log=args.error_log):
            count += 1
    print(f"Downloaded {count} open-access files to {args.output_dir}")


if __name__ == "__main__":
    main()
