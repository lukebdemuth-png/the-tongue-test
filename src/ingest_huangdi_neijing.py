"""Ingest Huang Di Nei Jing Su Wen from PDF into discourse chunks."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse

import fitz

from ingest_ashtanga_hridayam import has_usable_embedded_text
from ingest_charaka import (
    OCR_ENGINE,
    PageText,
    clean_ocr_garbage,
    ensure_directories,
    normalize_text,
    ocr_page,
    remove_repeated_headers_footers,
    resolve,
)


SOURCE_URL = "https://ia903101.us.archive.org/8/items/HuangDiNeiJingSuWen/Huang%20Di%20Nei%20jing%20su%20wen.pdf"

BOOK = "Huang Di Nei Jing Su Wen"
SCHOOL = "Traditional Chinese Medicine"
TRANSLATOR_AUTHORS = ["Paul U. Unschuld", "Hermann Tessenow"]
LANGUAGE = "English translation"
NO_EXTRACTED_TEXT_MESSAGE = (
    "[No embedded text or OCR-readable text was detected on this PDF page.]"
)

RAW_PDF = Path("data/raw/huangdi_neijing.pdf")
EXTRACTED_TEXT = Path("data/extracted/huangdi_neijing_raw.txt")
CLEAN_MARKDOWN = Path("data/clean/huangdi_neijing.md")
CHUNKS_JSONL = Path("data/chunks/huangdi_neijing_chunks.jsonl")
REQUIRED_METADATA = {
    "book",
    "school",
    "translator_authors",
    "source_url",
    "discourse",
    "page_start",
    "page_end",
    "text",
}


def download_pdf(source_url: str, output_path: Path, force: bool = False) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and not force:
        return output_path

    parsed = urlparse(source_url)
    if parsed.scheme == "file":
        shutil.copyfile(Path(unquote(parsed.path)), output_path)
        return output_path

    urllib.request.urlretrieve(source_url, output_path)
    return output_path


def normalize_discourse_markers(text: str) -> str:
    text = re.sub(
        r"(?m)^\s*(?:DISCOURSE|Discourse)\s+([0-9IVXLCDM]+)\s*[:.\-]?\s*(.*)$",
        lambda match: f"Discourse {match.group(1)}" + (f": {match.group(2).strip()}" if match.group(2).strip() else ""),
        text,
    )
    text = re.sub(
        r"(?m)^\s*(?:CHAPTER|Chapter)\s+([0-9IVXLCDM]+)\s*[:.\-]?\s*(.*)$",
        lambda match: f"Chapter {match.group(1)}" + (f": {match.group(2).strip()}" if match.group(2).strip() else ""),
        text,
    )
    return text


def clean_page_text(text: str) -> str:
    cleaned_lines: list[str] = []
    in_reference_block = False

    for raw_line in text.replace("\x0c", "\n").splitlines():
        line = raw_line.strip()
        line = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", line)
        line = re.sub(r"\s+", " ", line)
        line = re.sub(r"[|_~*•·]{2,}", " ", line)
        if not line:
            continue
        if re.fullmatch(r"[-—\s]*\d{1,4}[-—\s]*", line):
            continue
        if re.fullmatch(r"(?:huang\s+di\s+nei\s+jing\s+su\s+wen|su\s+wen|huangdi\s+neijing)", line, re.IGNORECASE):
            continue
        if re.match(r"^(?:references|bibliography|notes|index)\b", line, re.IGNORECASE):
            in_reference_block = True
            continue
        if in_reference_block:
            if re.match(r"^(?:Discourse|DISCOURSE|Chapter|CHAPTER)\s+\d+", line):
                in_reference_block = False
            else:
                continue
        if re.match(r"^\[\d+\]\s+", line):
            continue
        if re.match(r"^\d{1,3}\.\s+[A-Z][a-z]+,\s+[A-Z]", line):
            continue
        alpha_count = len(re.findall(r"[A-Za-z]", line))
        if alpha_count < 3 and not re.search(r"\d", line):
            continue
        cleaned_lines.append(line)

    return normalize_discourse_markers("\n".join(cleaned_lines)).strip()


def normalize_page_lines(text: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def extract_pdf_text(
    pdf_path: Path,
    output_path: Path,
    max_pages: int | None = None,
    use_ocr_fallback: bool = True,
    ocr_empty_pages: bool = False,
    min_ocr_text_chars: int = 120,
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

            should_try_ocr = (
                use_ocr_fallback
                and not has_usable_embedded_text(text)
                and (ocr_empty_pages or len(text.strip()) >= min_ocr_text_chars)
            )
            if should_try_ocr:
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
    cleaned_pages: list[PageText] = []

    for page in pages:
        text = normalize_page_lines(clean_page_text(page.text))
        if not text:
            text = NO_EXTRACTED_TEXT_MESSAGE
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
        handle.write(f"School: {SCHOOL}\n\n")
        handle.write(f"Translator/authors: {', '.join(TRANSLATOR_AUTHORS)}\n\n")
        handle.write(f"Language: {LANGUAGE}\n\n")
        for page in cleaned_pages:
            handle.write(f"<!-- page: {page.page_number} -->\n\n")
            handle.write(page.text)
            handle.write("\n\n")

    return cleaned_pages


def discourse_markers(text: str) -> list[re.Match[str]]:
    patterns = (
        r"(?m)(?:^|\n)\s*(Discourse\s+([0-9IVXLCDM]+)\b[^\n]*)",
        r"(?m)(?:^|\n)\s*(Chapter\s+([0-9IVXLCDM]+)\b[^\n]*)",
    )
    matches: list[re.Match[str]] = []
    for pattern in patterns:
        matches.extend(re.finditer(pattern, text, re.IGNORECASE))
    return sorted(matches, key=lambda match: match.start())


def marker_label(match: re.Match[str]) -> str:
    return normalize_text(match.group(1)).strip(" .:-")


def discourse_number(label: str) -> str | None:
    match = re.match(r"^(?:Chapter|Discourse)\s+([0-9IVXLCDM]+)\b", label, re.IGNORECASE)
    return match.group(1).upper() if match else None


def select_translation_pages(pages: Iterable[PageText]) -> list[PageText]:
    page_list = list(pages)
    start_index = 0
    for index, page in enumerate(page_list):
        first_lines = "\n".join(page.text.splitlines()[:3]).lower()
        if (
            "chapter 1:" in first_lines
            and "discourse on the true" in first_lines
            and "heaven" in first_lines
        ):
            start_index = index
            break
    return page_list[start_index:]


def build_chunks(
    pages: Iterable[PageText],
    source_url: str,
    output_path: Path,
    max_chars: int = 7000,
) -> list[dict[str, object]]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    chunks: list[dict[str, object]] = []
    current_discourse: str | None = None
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
                "translator_authors": TRANSLATOR_AUTHORS,
                "source_url": source_url,
                "language": LANGUAGE,
                "discourse": current_discourse or "Unknown",
                "page_start": page_start,
                "page_end": page_end,
                "text": text,
            }
        )
        buffer = []
        page_start = None
        page_end = None

    for page in select_translation_pages(pages):
        text = page.text
        matches = discourse_markers(text)
        if not matches:
            if text:
                if buffer and len(" ".join(buffer + [text])) > max_chars:
                    flush()
                if page_start is None:
                    page_start = page.page_number
                page_end = page.page_number
                buffer.append(text)
            continue

        if matches[0].start() > 0 and buffer:
            prefix = text[: matches[0].start()].strip()
            if prefix:
                buffer.append(prefix)
                page_end = page.page_number

        for index, match in enumerate(matches):
            segment_end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            segment = text[match.start() : segment_end].strip()
            label = marker_label(match)
            if current_discourse and discourse_number(label) == discourse_number(current_discourse):
                if page_start is None:
                    page_start = page.page_number
                page_end = page.page_number
                buffer.append(segment)
            else:
                flush()
                current_discourse = label
                page_start = page.page_number
                page_end = page.page_number
                buffer.append(segment)

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
    ocr_empty_pages: bool = False,
    min_ocr_text_chars: int = 120,
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
        ocr_empty_pages=ocr_empty_pages,
        min_ocr_text_chars=min_ocr_text_chars,
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
    parser = argparse.ArgumentParser(description="Ingest Huang Di Nei Jing Su Wen PDF.")
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
        "--ocr-empty-pages",
        action="store_true",
        help="OCR pages with no embedded text at all. Off by default to avoid slow OCR on blank/image divider pages.",
    )
    parser.add_argument(
        "--min-ocr-text-chars",
        type=int,
        default=120,
        help="Only OCR poor embedded text pages when the cleaned embedded text has at least this many characters.",
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
        ocr_empty_pages=args.ocr_empty_pages,
        min_ocr_text_chars=args.min_ocr_text_chars,
        ocr_engine=args.ocr_engine,
        ocr_dpi=args.ocr_dpi,
    )
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
