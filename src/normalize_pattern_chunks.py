"""Normalize existing ingestion chunks to the Pattern App metadata schema."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from typing import Any, Iterable


REGISTRY_PATH = Path("sources/metadata/pattern_app_source_registry.json")
OUTPUT_DIR = Path("data/chunks/normalized")
COMBINED_OUTPUT = Path("data/chunks/pattern_app_core_chunks.jsonl")

REQUIRED_CHUNK_FIELDS = [
    "chunk_id",
    "source_id",
    "book",
    "tradition",
    "school",
    "source_category",
    "canonical_layer",
    "volume",
    "title",
    "author_authors",
    "translator_authors",
    "editor_commentator",
    "edition",
    "source_url",
    "source_access_status",
    "license_or_rights_note",
    "retrieval_date",
    "page_start",
    "page_end",
    "stable_locator",
    "section",
    "chapter",
    "sutra_or_aphorism",
    "entry_type",
    "language",
    "sanskrit_text",
    "source_language_text",
    "english_text",
    "text",
    "keywords",
    "concepts",
    "symptoms",
    "patterns",
    "interventions",
    "contraindications",
    "text_layer_type",
    "ocr_engine",
    "ocr_confidence",
    "extraction_notes",
]


SOURCE_OUTPUT_MAP = {
    "ayurveda_charaka_samhita_vol1": "data/chunks/charaka_vol1_chunks.jsonl",
    "ayurveda_ashtanga_hridayam": "data/chunks/ashtanga_hridayam_chunks.jsonl",
    "ayurveda_sushruta_samhita_vol1": "data/chunks/sushruta_samhita_vol1_chunks.jsonl",
    "tcm_huangdi_neijing_suwen": "data/chunks/huangdi_neijing_chunks.jsonl",
    "homeopathy_organon_fifth_sixth": "data/chunks/organon_chunks.jsonl",
}


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            missing = [field for field in REQUIRED_CHUNK_FIELDS if field not in row]
            if missing:
                raise ValueError(f"Normalized chunk missing fields {missing}: {row.get('chunk_id')}")
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
            count += 1
    return count


def as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [str(value)]


def source_category(canonical_role: str) -> str:
    if canonical_role == "foundational_theory":
        return "classical authoritative text"
    if canonical_role == "clinical_pattern_text":
        return "clinical pattern text"
    if canonical_role == "materia_medica":
        return "materia medica / remedy text"
    if canonical_role == "repertory":
        return "repertory"
    return canonical_role or "Unknown"


def infer_language(source: dict[str, Any], chunk: dict[str, Any]) -> str:
    if chunk.get("language"):
        return str(chunk["language"])
    if chunk.get("sanskrit_text"):
        return "Sanskrit and English"
    if source["healing_mode"] == "Traditional Chinese Medicine":
        return "English translation"
    return "English"


def stable_locator(chunk: dict[str, Any]) -> str:
    def shorten(value: str, max_length: int = 180) -> str:
        value = re.sub(r"\s+", " ", value).strip()
        if len(value) <= max_length:
            return value
        return value[:max_length].rsplit(" ", 1)[0].rstrip(" .,:;") + "..."

    if chunk.get("aphorism_number"):
        return f"Aphorism {chunk['aphorism_number']}"
    if chunk.get("discourse"):
        return shorten(str(chunk["discourse"]))
    if chunk.get("chapter") and chunk.get("chapter") != "Unknown":
        return shorten(str(chunk["chapter"]))
    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    if page_start and page_end:
        return f"pages {page_start}-{page_end}" if page_start != page_end else f"page {page_start}"
    return "Unknown"


def normalized_text_layer(chunk: dict[str, Any]) -> str:
    if chunk.get("ocr_engine") or chunk.get("ocr_confidence") is not None:
        return "ocr"
    text = str(chunk.get("text", ""))
    if "OCR ran on this scanned page" in text or "No embedded text" in text:
        return "ocr_placeholder"
    return "embedded_or_archive_text"


def normalize_chunk(
    source: dict[str, Any],
    chunk: dict[str, Any],
    sequence: int,
    retrieval_date: str,
) -> dict[str, Any]:
    source_id = source["source_id"]
    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    aphorism = chunk.get("aphorism_number")
    locator = stable_locator(chunk)
    chunk_id = f"{source_id}:{sequence:06d}"
    if aphorism:
        chunk_id = f"{source_id}:aphorism-{aphorism}:{sequence:06d}"

    translator_authors = as_list(source.get("translator_authors")) or as_list(
        chunk.get("translator_authors") or chunk.get("translator_author")
    )
    author_authors = as_list(source.get("authors")) or as_list(chunk.get("author"))

    text = str(chunk.get("text", "")).strip()
    english_text = str(chunk.get("english_text") or text).strip()

    return {
        "chunk_id": chunk_id,
        "source_id": source_id,
        "book": chunk.get("book") or source["title"],
        "tradition": source["tradition"],
        "school": chunk.get("school") or source["healing_mode"],
        "source_category": source_category(source["canonical_role"]),
        "canonical_layer": source["source_layer"],
        "volume": chunk.get("volume") or "Unknown",
        "title": source["title"],
        "author_authors": author_authors,
        "translator_authors": translator_authors,
        "editor_commentator": as_list(source.get("editor_commentator")),
        "edition": source.get("edition") or chunk.get("edition") or "Unknown",
        "source_url": chunk.get("source_url") or source.get("known_source_url") or "Unknown",
        "source_access_status": source.get("rights_access_status") or "Unknown",
        "license_or_rights_note": source.get("rights_access_status") or "Unknown",
        "retrieval_date": retrieval_date,
        "page_start": page_start,
        "page_end": page_end,
        "stable_locator": locator,
        "section": chunk.get("section") or chunk.get("discourse") or "Unknown",
        "chapter": chunk.get("chapter") or chunk.get("discourse") or "Unknown",
        "sutra_or_aphorism": str(aphorism) if aphorism else "Unknown",
        "entry_type": "aphorism" if aphorism else "text_chunk",
        "language": infer_language(source, chunk),
        "sanskrit_text": chunk.get("sanskrit_text") or "",
        "source_language_text": chunk.get("source_language_text") or chunk.get("sanskrit_text") or "",
        "english_text": english_text,
        "text": text,
        "keywords": as_list(chunk.get("keywords")),
        "concepts": as_list(chunk.get("concepts")),
        "symptoms": as_list(chunk.get("symptoms")),
        "patterns": as_list(chunk.get("patterns")),
        "interventions": as_list(chunk.get("interventions")),
        "contraindications": as_list(chunk.get("contraindications")),
        "text_layer_type": normalized_text_layer(chunk),
        "ocr_engine": chunk.get("ocr_engine"),
        "ocr_confidence": chunk.get("ocr_confidence"),
        "extraction_notes": source.get("text_quality_notes") or "",
    }


def processed_sources(registry: dict[str, Any]) -> list[dict[str, Any]]:
    by_id = {source["source_id"]: source for source in registry["sources"]}
    return [by_id[source_id] for source_id in SOURCE_OUTPUT_MAP if source_id in by_id]


def normalize_all(
    registry_path: Path = REGISTRY_PATH,
    output_dir: Path = OUTPUT_DIR,
    combined_output: Path = COMBINED_OUTPUT,
    retrieval_date: str | None = None,
) -> dict[str, int]:
    registry = read_json(registry_path)
    retrieval_date = retrieval_date or date.today().isoformat()
    counts: dict[str, int] = {}
    combined: list[dict[str, Any]] = []

    for source in processed_sources(registry):
        source_id = source["source_id"]
        input_path = Path(SOURCE_OUTPUT_MAP[source_id])
        if not input_path.exists():
            continue
        rows = [
            normalize_chunk(source, chunk, index, retrieval_date)
            for index, chunk in enumerate(read_jsonl(input_path), start=1)
        ]
        output_path = output_dir / f"{source_id}.jsonl"
        counts[source_id] = write_jsonl(output_path, rows)
        combined.extend(rows)

    counts["combined"] = write_jsonl(combined_output, combined)
    return counts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize Pattern App core chunks.")
    parser.add_argument("--registry", type=Path, default=REGISTRY_PATH)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--combined-output", type=Path, default=COMBINED_OUTPUT)
    parser.add_argument("--retrieval-date", default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    counts = normalize_all(
        registry_path=args.registry,
        output_dir=args.output_dir,
        combined_output=args.combined_output,
        retrieval_date=args.retrieval_date,
    )
    for source_id, count in counts.items():
        print(f"{source_id}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
