from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.documents import pdf_to_markdown


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert PDFs with embedded text to markdown.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    if args.input.is_dir():
        args.output.mkdir(parents=True, exist_ok=True)
        count = 0
        for pdf_path in sorted(args.input.glob("*.pdf")):
            pdf_to_markdown(pdf_path, args.output / f"{pdf_path.stem}.md")
            count += 1
        print(f"Converted {count} PDFs to {args.output}")
    else:
        pdf_to_markdown(args.input, args.output)
        print(f"Converted {args.input} to {args.output}")


if __name__ == "__main__":
    main()
