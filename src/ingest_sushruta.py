"""Ingest Sushruta Samhita Volume 1 from PDF into cleaned text and JSONL chunks."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable

import fitz

from ingest_ashtanga_hridayam import has_usable_embedded_text, split_sentences
from ingest_charaka import (
    OCR_ENGINE,
    PageText,
    clean_ocr_garbage,
    download_pdf,
    ensure_directories,
    normalize_text,
    ocr_page,
    remove_repeated_headers_footers,
    resolve,
)


SOURCE_URL = "https://archive.org/details/englishtranslati01susruoft"
BOOK = "Sushruta Samhita"
SCHOOL = "Ayurveda"
VOLUME = "Vol. 1 - Sutrasthanam"
AUTHOR = "Sushruta"
TRANSLATOR_AUTHOR = "Kaviraj Kunja Lal Bhishagratna"
EDITION = "Calcutta, 1907"
NO_EXTRACTED_TEXT_MESSAGE = "[No embedded text or OCR-readable text was detected on this PDF page.]"

RAW_PDF = Path("data/raw/sushruta_samhita_vol1.pdf")
EXTRACTED_TEXT = Path("data/extracted/sushruta_samhita_vol1_raw.txt")
CLEAN_MARKDOWN = Path("data/clean/sushruta_samhita_vol1.md")
CHUNKS_JSONL = Path("data/chunks/sushruta_samhita_vol1_chunks.jsonl")
REQUIRED_METADATA = {
    "book",
    "school",
    "volume",
    "author",
    "translator_author",
    "edition",
    "source_url",
    "page_start",
    "page_end",
    "section",
    "chapter",
    "text",
}


def clean_page_text(text: str) -> str:
    lines = []
    for raw_line in text.replace("\x0c", "\n").splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        line = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", line)
        if not line:
            continue
        if re.fullmatch(r"[-—\s]*[ivxlcdmIVXLCDM0-9]{1,6}[-—\s]*", line):
            continue
        if re.fullmatch(r"(?:sushruta samhita|sutrasthanam|introduction)\.?", line, re.IGNORECASE):
            continue
        if len(re.findall(r"[A-Za-z]", line)) < 3 and not re.search(r"\d", line):
            continue
        lines.append(line)
    return normalize_text("\n".join(lines))


def infer_section(text: str, current: str | None = None) -> str | None:
    if re.search(r"\bSutra[-\s]?sthanam\b", text, re.IGNORECASE):
        return "Sutrasthanam"
    return current


def infer_chapter(text: str, current: str | None = None) -> str | None:
    patterns = [
        r"(?im)^\s*CHAPTER\s+([IVXLCDM]+|\d+)\.?\s*(.*)$",
        r"(?im)^\s*Chapter\s+([IVXLCDM]+|\d+)\.?\s*(.*)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            title = normalize_text(match.group(2)).strip(" .:-")
            return f"Chapter {match.group(1)}" + (f": {title}" if title else "")
    return current


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
            text = clean_page_text(page.get_text("text"))
            source = "embedded"
            confidence = None
            used_engine = None

            if not has_usable_embedded_text(text) and use_ocr_fallback:
                ocr_text, confidence, used_engine = ocr_page(page, engine=ocr_engine, dpi=ocr_dpi)
                text = clean_page_text(clean_ocr_garbage(ocr_text))
                source = "ocr"
                print(
                    f"OCR fallback page {page_index + 1}/{page_count} via {used_engine}"
                    f" confidence={confidence if confidence is not None else 'n/a'}",
                    file=sys.stderr,
                )

            pages.append(
                PageText(
                    page_number=page_index + 1,
                    text=text,
                    source=source,
                    ocr_engine=used_engine,
                    ocr_confidence=confidence,
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
    cleaned_pages = []
    for page in pages:
        text = normalize_text(page.text) or NO_EXTRACTED_TEXT_MESSAGE
        cleaned_pages.append(
            PageText(
                page_number=page.page_number,
                text=text,
                source=page.source,
                ocr_engine=page.ocr_engine,
                ocr_confidence=page.ocr_confidence,
            )
        )

    with output_path.open("w", encoding="utf-8") as handle:
        handle.write(f"# {BOOK}\n\n")
        handle.write(f"Volume: {VOLUME}\n\n")
        handle.write(f"Author: {AUTHOR}\n\n")
        handle.write(f"Translator/editor: {TRANSLATOR_AUTHOR}\n\n")
        handle.write(f"Edition: {EDITION}\n\n")
        for page in cleaned_pages:
            handle.write(f"<!-- page: {page.page_number} -->\n\n")
            handle.write(page.text)
            handle.write("\n\n")
    return cleaned_pages


def build_chunks(
    pages: Iterable[PageText],
    source_url: str,
    output_path: Path,
    max_chars: int = 3000,
) -> list[dict[str, object]]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    chunks = []
    current_section = "Sutrasthanam"
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
        chunk = {
            "book": BOOK,
            "school": SCHOOL,
            "volume": VOLUME,
            "author": AUTHOR,
            "translator_author": TRANSLATOR_AUTHOR,
            "edition": EDITION,
            "source_url": source_url,
            "page_start": page_start,
            "page_end": page_end,
            "section": current_section,
            "chapter": current_chapter or "Unknown",
            "text": text,
        }
        missing = REQUIRED_METADATA.difference(chunk)
        if missing:
            raise ValueError(f"Chunk missing metadata fields: {sorted(missing)}")
        chunks.append(chunk)
        buffer = []
        page_start = None
        page_end = None

    for page in pages:
        current_section = infer_section(page.text, current_section) or current_section
        current_chapter = infer_chapter(page.text, current_chapter)
        for sentence in split_sentences(page.text):
            if buffer and len(" ".join(buffer + [sentence])) > max_chars:
                flush()
            if page_start is None:
                page_start = page.page_number
            page_end = page.page_number
            buffer.append(sentence)
    flush()

    with output_path.open("w", encoding="utf-8") as handle:
        for chunk in chunks:
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
    parser = argparse.ArgumentParser(description="Ingest Sushruta Samhita Volume 1 PDF.")
    parser.add_argument("--source-url", default=SOURCE_URL)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--force-download", action="store_true")
    parser.add_argument("--max-pages", type=int, default=None)
    parser.add_argument("--no-ocr-fallback", action="store_true")
    parser.add_argument("--ocr-engine", choices=["auto", "paddle", "tesseract", "pymupdf"], default="auto")
    parser.add_argument("--ocr-dpi", type=int, default=300)
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
    raise SystemExit(main())
