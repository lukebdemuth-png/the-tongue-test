from __future__ import annotations

from collections import Counter
from datetime import date


def build_master_index(records: list[dict], chunks: list[dict]) -> dict:
    traditions = Counter()
    publications = Counter()
    for record in records:
        for tradition in record.get("tradition", []):
            traditions[tradition] += 1
        if record.get("publication"):
            publications[record["publication"]] += 1
    return {
        "retrieval_date": date.today().isoformat(),
        "record_count": len(records),
        "chunk_count": len(chunks),
        "traditions": dict(sorted(traditions.items())),
        "publications": dict(sorted(publications.items())),
        "sources": [
            {
                "title": record.get("title", ""),
                "source_url": record.get("source_url", ""),
                "publication": record.get("publication", ""),
                "date": record.get("date", ""),
                "open_access": record.get("open_access"),
            }
            for record in records
        ],
    }
