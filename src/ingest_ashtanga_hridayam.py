"""Ingest Ashtanga Hridayam from PDF into cleaned text and JSONL chunks."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable

import fitz

from ingest_charaka import (
    OCR_ENGINE,
    PageText,
    clean_ocr_garbage,
    download_pdf,
    ensure_directories,
    infer_chapter,
    infer_section,
    is_probably_sanskrit_line,
    normalize_text,
    ocr_page,
    remove_repeated_headers_footers,
    resolve,
    split_sanskrit_english,
)


SOURCE_URL = "https://ia800502.us.archive.org/0/items/AstangaHrdayam.Eng/Astanga-hrdayam.%20Eng.pdf"

BOOK = "Ashtanga Hridayam"
SCHOOL = "Ayurveda"
TRANSLATOR_AUTHOR = "K. R. Srikantha Murthy"
NO_EXTRACTED_TEXT_MESSAGE = (
    "[No embedded text or OCR-readable text was detected on this PDF page.]"
)

RAW_PDF = Path("data/raw/ashtanga_hridayam.pdf")
EXTRACTED_TEXT = Path("data/extracted/ashtanga_hridayam_raw.txt")
CLEAN_MARKDOWN = Path("data/clean/ashtanga_hridayam.md")
CHUNKS_JSONL = Path("data/chunks/ashtanga_hridayam_chunks.jsonl")
REQUIRED_METADATA = {
    "book",
    "school",
    "translator_author",
    "source_url",
    "page_start",
    "page_end",
    "section",
    "chapter",
    "text",
}


def has_usable_embedded_text(text: str, min_characters: int = 40) -> bool:
    words = re.findall(r"[A-Za-z\u0900-\u097F]{2,}", text)
    return len(text.strip()) >= min_characters and len(words) >= 6


def extract_pdf_text(
    pdf_path: Path,
    output_path: Path,
    max_pages: int | None = None,
    use_ocr_fallback: bool = True,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
) -> list[PageText]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pages: list[PageText] = []

    with fitz.open(pdf_path) as document:
        page_count = len(document) if max_pages is None else min(max_pages, len(document))
        for page_index in range(page_count):
            page = document[page_index]
            embedded_text = page.get_text("text").strip()
            source = "embedded"
            confidence = None
            used_engine = None

            if not has_usable_embedded_text(embedded_text) and use_ocr_fallback:
                text, confidence, used_engine = ocr_page(page, engine=ocr_engine, dpi=ocr_dpi)
                embedded_text = clean_ocr_garbage(text)
                source = "ocr"
                print(
                    f"OCR fallback page {page_index + 1}/{page_count} via {used_engine}"
                    f" confidence={confidence if confidence is not None else 'n/a'}",
                    file=sys.stderr,
                )

            sanskrit_text, english_text = split_sanskrit_english(embedded_text)
            pages.append(
                PageText(
                    page_number=page_index + 1,
                    text=embedded_text,
                    source=source,
                    ocr_engine=used_engine,
                    ocr_confidence=confidence,
                    sanskrit_text=sanskrit_text,
                    english_text=english_text,
                )
            )

    pages = remove_repeated_headers_footers(pages)
    with output_path.open("w", encoding="utf-8") as handle:
        for page in pages:
            handle.write(f"\n\n[[PAGE {page.page_number}]]\n\n")
            if page.source == "ocr":
                handle.write(f"[[OCR_CONFIDENCE {page.ocr_confidence if page.ocr_confidence is not None else 'n/a'}]]\n\n")
            handle.write(page.text)
            handle.write("\n")

    return pages


def clean_pages_to_markdown(pages: Iterable[PageText], output_path: Path) -> list[PageText]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned_pages: list[PageText] = []

    for page in pages:
        text = normalize_text(page.text)
        if not text:
            text = NO_EXTRACTED_TEXT_MESSAGE
        sanskrit_text, english_text = split_sanskrit_english(text)
        cleaned_pages.append(
            PageText(
                page_number=page.page_number,
                text=text,
                source=page.source,
                ocr_engine=page.ocr_engine,
                ocr_confidence=page.ocr_confidence,
                sanskrit_text=sanskrit_text,
                english_text=english_text,
            )
        )

    with output_path.open("w", encoding="utf-8") as handle:
        handle.write(f"# {BOOK}\n\n")
        handle.write(f"Translator/author: {TRANSLATOR_AUTHOR}\n\n")
        for page in cleaned_pages:
            handle.write(f"<!-- page: {page.page_number} -->\n\n")
            if page.ocr_confidence is not None:
                handle.write(f"<!-- ocr_confidence: {page.ocr_confidence} -->\n\n")
            handle.write(page.text)
            handle.write("\n\n")

    return cleaned_pages


def split_sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def build_chunks(
    pages: Iterable[PageText],
    source_url: str,
    output_path: Path,
    max_chars: int = 2500,
) -> list[dict[str, object]]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    chunks: list[dict[str, object]] = []
    current_section: str | None = None
    current_chapter: str | None = None

    buffer: list[str] = []
    page_start: int | None = None
    page_end: int | None = None

    def flush() -> None:
        nonlocal buffer, page_start, page_end
        text = normalize_text(" ".join(buffer))
        if not text or page_start is None or page_end is None:
            buffer = []
            page_start = None
            page_end = None
            return
        chunks.append(
            {
                "book": BOOK,
                "school": SCHOOL,
                "translator_author": TRANSLATOR_AUTHOR,
                "source_url": source_url,
                "page_start": page_start,
                "page_end": page_end,
                "section": current_section or "Unknown",
                "chapter": current_chapter or "Unknown",
                "text": text,
            }
        )
        buffer = []
        page_start = None
        page_end = None

    for page in pages:
        current_section = infer_section(page.text, current_section)
        current_chapter = infer_chapter(page.text, current_chapter)

        for sentence in split_sentences(page.text):
            candidate_length = len(" ".join(buffer + [sentence]))
            if buffer and candidate_length > max_chars:
                flush()
            if page_start is None:
                page_start = page.page_number
            page_end = page.page_number
            buffer.append(sentence)

    flush()

    with output_path.open("w", encoding="utf-8") as handle:
        for chunk in chunks:
            missing = REQUIRED_METADATA.difference(chunk)
            if missing:
                raise ValueError(f"Chunk missing metadata fields: {sorted(missing)}")
            handle.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    return chunks


def run_pipeline(
    root: Path,
    source_url: str = SOURCE_URL,
    force_download: bool = False,
    max_pages: int | None = None,
    use_ocr_fallback: bool = True,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
) -> dict[str, Path]:
    root = root.resolve()
    ensure_directories(root)

    raw_pdf = resolve(root, RAW_PDF)
    extracted_text = resolve(root, EXTRACTED_TEXT)
    clean_markdown = resolve(root, CLEAN_MARKDOWN)
    chunks_jsonl = resolve(root, CHUNKS_JSONL)

    download_pdf(source_url, raw_pdf, force=force_download)
    pages = extract_pdf_text(
        raw_pdf,
        extracted_text,
        max_pages=max_pages,
        use_ocr_fallback=use_ocr_fallback,
        ocr_engine=ocr_engine,
        ocr_dpi=ocr_dpi,
    )
    cleaned_pages = clean_pages_to_markdown(pages, clean_markdown)
    build_chunks(cleaned_pages, source_url, chunks_jsonl)

    return {
        "raw_pdf": raw_pdf,
        "extracted_text": extracted_text,
        "clean_markdown": clean_markdown,
        "chunks_jsonl": chunks_jsonl,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest Ashtanga Hridayam PDF.")
    parser.add_argument("--source-url", default=SOURCE_URL, help="PDF URL to ingest.")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root for data outputs.")
    parser.add_argument("--force-download", action="store_true", help="Download even when raw PDF already exists.")
    parser.add_argument("--max-pages", type=int, default=None, help="Optional page limit for development runs.")
    parser.add_argument(
        "--no-ocr-fallback",
        action="store_true",
        help="Disable OCR fallback and use only embedded PDF text.",
    )
    parser.add_argument(
        "--ocr-engine",
        choices=["auto", "paddle", "tesseract", "pymupdf"],
        default="auto",
        help="OCR engine for pages where embedded text extraction fails.",
    )
    parser.add_argument("--ocr-dpi", type=int, default=300, help="Render DPI used for OCR fallback.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    outputs = run_pipeline(
        root=args.root,
        source_url=args.source_url,
        force_download=args.force_download,
        max_pages=args.max_pages,
        use_ocr_fallback=not args.no_ocr_fallback,
        ocr_engine=args.ocr_engine,
        ocr_dpi=args.ocr_dpi,
    )
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
