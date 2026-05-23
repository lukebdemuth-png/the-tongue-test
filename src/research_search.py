from __future__ import annotations

import argparse
from pathlib import Path

from research_ingestion.config import FOCUS_SEARCH_TERMS, METADATA_DIR
from research_ingestion.io import write_jsonl
from research_ingestion.pubmed import pubmed_fetch, pubmed_search


def main() -> None:
    parser = argparse.ArgumentParser(description="Search PubMed for holistic medicine research metadata.")
    parser.add_argument("--term", action="append", dest="terms", help="Search term. Can be repeated.")
    parser.add_argument("--retmax", type=int, default=10)
    parser.add_argument("--email", default=None, help="Optional NCBI contact email.")
    parser.add_argument("--output", type=Path, default=METADATA_DIR / "pubmed_search_results.jsonl")
    args = parser.parse_args()

    records = []
    for term in args.terms or FOCUS_SEARCH_TERMS:
        pmids = pubmed_search(term, retmax=args.retmax, email=args.email)
        for record in pubmed_fetch(pmids, email=args.email):
            record["search_term"] = term
            records.append(record)
    write_jsonl(args.output, records)
    print(f"Wrote {len(records)} PubMed records to {args.output}")


if __name__ == "__main__":
    main()
