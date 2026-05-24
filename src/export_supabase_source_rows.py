from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable


DEFAULT_CHUNK_GLOB = "data/chunks/normalized/*.jsonl"


def read_jsonl(path: Path) -> Iterable[dict]:
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                yield json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_number} is not valid JSONL") from exc


def as_text_array(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]


def build_source_row(chunk: dict) -> dict:
    return {
        "id": chunk["source_id"],
        "title": chunk.get("title") or chunk.get("book") or chunk["source_id"],
        "tradition": chunk["tradition"],
        "school": chunk.get("school"),
        "source_type": chunk.get("source_category"),
        "source_category": chunk.get("source_category"),
        "canonical_layer": chunk.get("canonical_layer"),
        "author_authors": as_text_array(chunk.get("author_authors")),
        "translator_authors": as_text_array(chunk.get("translator_authors")),
        "editor_commentator": as_text_array(chunk.get("editor_commentator")),
        "edition": chunk.get("edition"),
        "source_url": chunk.get("source_url"),
        "source_access_status": chunk.get("source_access_status") or "unknown",
        "license_or_rights_note": chunk.get("license_or_rights_note") or "verify before publishing extracted full text",
        "retrieval_date": chunk.get("retrieval_date") or None,
        "metadata": {
            "book": chunk.get("book"),
            "volume": chunk.get("volume"),
            "language": chunk.get("language"),
            "text_layer_type": chunk.get("text_layer_type"),
            "extraction_notes": chunk.get("extraction_notes"),
        },
    }


def build_chunk_row(chunk: dict) -> dict:
    citation = {
        "source_id": chunk.get("source_id"),
        "title": chunk.get("title"),
        "book": chunk.get("book"),
        "tradition": chunk.get("tradition"),
        "source_url": chunk.get("source_url"),
        "page_start": chunk.get("page_start"),
        "page_end": chunk.get("page_end"),
        "stable_locator": chunk.get("stable_locator"),
        "chapter": chunk.get("chapter"),
        "sutra_or_aphorism": chunk.get("sutra_or_aphorism"),
        "rights_note": chunk.get("license_or_rights_note"),
    }
    quality = {
        "source_access_status": chunk.get("source_access_status"),
        "text_layer_type": chunk.get("text_layer_type"),
        "ocr_engine": chunk.get("ocr_engine"),
        "ocr_confidence": chunk.get("ocr_confidence"),
        "extraction_notes": chunk.get("extraction_notes"),
    }
    return {
        "id": chunk["chunk_id"],
        "source_id": chunk["source_id"],
        "book": chunk.get("book") or chunk.get("title") or chunk["source_id"],
        "tradition": chunk["tradition"],
        "stable_locator": chunk.get("stable_locator"),
        "page_start": chunk.get("page_start"),
        "page_end": chunk.get("page_end"),
        "section": chunk.get("section"),
        "chapter": chunk.get("chapter"),
        "sutra_or_aphorism": chunk.get("sutra_or_aphorism"),
        "entry_type": chunk.get("entry_type"),
        "language": chunk.get("language"),
        "text": chunk.get("text") or chunk.get("english_text") or "",
        "keywords": as_text_array(chunk.get("keywords")),
        "concepts": as_text_array(chunk.get("concepts")),
        "symptoms": as_text_array(chunk.get("symptoms")),
        "patterns": as_text_array(chunk.get("patterns")),
        "interventions": as_text_array(chunk.get("interventions")),
        "contraindications": as_text_array(chunk.get("contraindications")),
        "citation": citation,
        "quality": quality,
        "raw_chunk": chunk,
    }


def write_jsonl(path: Path, rows: Iterable[dict]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True, sort_keys=True) + "\n")
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Export normalized pattern chunks into Supabase import JSONL files.")
    parser.add_argument("--chunk-glob", default=DEFAULT_CHUNK_GLOB)
    parser.add_argument("--output-dir", type=Path, default=Path("data/supabase_import"))
    args = parser.parse_args()

    chunk_paths = sorted(Path().glob(args.chunk_glob))
    if not chunk_paths:
        raise SystemExit(f"No chunk files matched {args.chunk_glob}")

    sources_by_id: dict[str, dict] = {}
    chunk_rows: list[dict] = []
    for path in chunk_paths:
        for chunk in read_jsonl(path):
            sources_by_id.setdefault(chunk["source_id"], build_source_row(chunk))
            chunk_rows.append(build_chunk_row(chunk))

    source_count = write_jsonl(args.output_dir / "sources.jsonl", sources_by_id.values())
    chunk_count = write_jsonl(args.output_dir / "source_chunks.jsonl", chunk_rows)
    print(f"Wrote {source_count} source rows and {chunk_count} chunk rows to {args.output_dir}")


if __name__ == "__main__":
    main()
