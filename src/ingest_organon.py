"""Ingest Organon of Medicine from Archive.org into text and aphorism chunks."""

from __future__ import annotations

import argparse
import gzip
import json
import re
import shutil
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
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


SOURCE_URL = "https://archive.org/details/organonofmedicin0000hahn/page/n9/mode/2up"
ARCHIVE_IDENTIFIER = "organonofmedicin0000hahn"

BOOK = "Organon of Medicine"
AUTHOR = "Samuel Hahnemann"
SCHOOL = "Classical Homeopathy"
EDITION = "5th and 6th edition"
TRANSLATOR_AUTHORS = ["R. E. Dudgeon", "William Boericke"]
NO_EXTRACTED_TEXT_MESSAGE = (
    "[No embedded text, Archive full text, or OCR-readable text was detected on this PDF page.]"
)

RAW_PDF = Path("data/raw/organon_medicine.pdf")
EXTRACTED_TEXT = Path("data/extracted/organon_raw.txt")
CLEAN_MARKDOWN = Path("data/clean/organon.md")
CHUNKS_JSONL = Path("data/chunks/organon_chunks.jsonl")
REQUIRED_METADATA = {
    "book",
    "author",
    "school",
    "edition",
    "translator_authors",
    "source_url",
    "aphorism_number",
    "page_start",
    "page_end",
    "text",
}


def download_file(source_url: str, output_path: Path, force: bool = False) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and not force:
        return output_path

    parsed = urlparse(source_url)
    if parsed.scheme == "file":
        shutil.copyfile(Path(unquote(parsed.path)), output_path)
        return output_path

    request = urllib.request.Request(source_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        output_path.write_bytes(response.read())
    return output_path


def archive_identifier(source_url: str) -> str | None:
    parsed = urlparse(source_url)
    if parsed.scheme == "file" or parsed.path.lower().endswith(".pdf"):
        return None
    parts = [part for part in parsed.path.split("/") if part]
    if "details" in parts:
        details_index = parts.index("details")
        if details_index + 1 < len(parts):
            return parts[details_index + 1]
    if "download" in parts:
        download_index = parts.index("download")
        if download_index + 1 < len(parts):
            return parts[download_index + 1]
    return ARCHIVE_IDENTIFIER if "archive.org" in parsed.netloc else None


def archive_download_url(identifier: str, filename: str) -> str:
    return f"https://archive.org/download/{identifier}/{filename}"


def load_archive_metadata(source_url: str) -> dict[str, object] | None:
    identifier = archive_identifier(source_url)
    if identifier is None:
        return None
    try:
        with urllib.request.urlopen(f"https://archive.org/metadata/{identifier}", timeout=30) as response:
            return json.loads(response.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None


def archive_files(metadata: dict[str, object] | None) -> list[dict[str, object]]:
    if not metadata:
        return []
    files = metadata.get("files", [])
    return files if isinstance(files, list) else []


def file_name(file_info: dict[str, object]) -> str:
    name = file_info.get("name", "")
    return name if isinstance(name, str) else ""


def file_format(file_info: dict[str, object]) -> str:
    file_format_value = file_info.get("format", "")
    return file_format_value.lower() if isinstance(file_format_value, str) else ""


def choose_archive_pdf_url(source_url: str, metadata: dict[str, object] | None) -> str:
    parsed = urlparse(source_url)
    if parsed.scheme == "file" or parsed.path.lower().endswith(".pdf"):
        return source_url

    identifier = archive_identifier(source_url)
    if identifier is None:
        return source_url

    files = archive_files(metadata)
    pdf_files = [
        file_info
        for file_info in files
        if file_name(file_info).lower().endswith(".pdf")
    ]
    text_pdfs = [
        file_info
        for file_info in pdf_files
        if "text pdf" in file_format(file_info)
        or "pdf with text" in file_format(file_info)
        or file_name(file_info).lower().endswith("_text.pdf")
    ]
    preferred = text_pdfs or pdf_files
    if preferred:
        return archive_download_url(identifier, file_name(preferred[0]))
    return archive_download_url(identifier, f"{identifier}.pdf")


def candidate_archive_pdf_urls(source_url: str, metadata: dict[str, object] | None) -> list[str]:
    parsed = urlparse(source_url)
    if parsed.scheme == "file" or parsed.path.lower().endswith(".pdf"):
        return [source_url]

    identifier = archive_identifier(source_url)
    if identifier is None:
        return [source_url]

    files = archive_files(metadata)
    pdf_files = [
        file_info
        for file_info in files
        if file_name(file_info).lower().endswith(".pdf")
        and "encrypted" not in file_name(file_info).lower()
        and "encrypted" not in file_format(file_info)
        and "lcp" not in file_format(file_info)
    ]
    text_pdfs = [
        file_info
        for file_info in pdf_files
        if "text pdf" in file_format(file_info)
        or "pdf with text" in file_format(file_info)
        or file_name(file_info).lower().endswith("_text.pdf")
    ]
    ordered = text_pdfs + [file_info for file_info in pdf_files if file_info not in text_pdfs]
    urls = [archive_download_url(identifier, file_name(file_info)) for file_info in ordered]
    return urls or [archive_download_url(identifier, f"{identifier}.pdf")]


def download_first_available_pdf(
    source_url: str,
    metadata: dict[str, object] | None,
    output_path: Path,
    force: bool = False,
) -> Path:
    errors: list[str] = []
    for candidate_url in candidate_archive_pdf_urls(source_url, metadata):
        try:
            return download_file(candidate_url, output_path, force=force)
        except urllib.error.HTTPError as exc:
            errors.append(f"{candidate_url} -> HTTP {exc.code}")
        except urllib.error.URLError as exc:
            errors.append(f"{candidate_url} -> {exc.reason}")

    if output_path.exists() and force:
        output_path.unlink()
    raise RuntimeError(
        "No public, non-encrypted Archive.org PDF asset could be downloaded. "
        + " | ".join(errors)
    )


def pdf_download_url(source_url: str) -> str:
    return choose_archive_pdf_url(source_url, load_archive_metadata(source_url))


def full_text_file_urls(source_url: str, metadata: dict[str, object] | None) -> list[tuple[str, str]]:
    identifier = archive_identifier(source_url)
    if identifier is None:
        return []

    urls: list[tuple[str, str]] = []
    files = archive_files(metadata)
    xml_files = []
    txt_files = []
    for file_info in files:
        name = file_name(file_info)
        name_lower = name.lower()
        format_lower = file_format(file_info)
        if not name:
            continue
        if name_lower.endswith(("_djvu.xml", "_djvu.xml.gz")) or "djvu xml" in format_lower:
            xml_files.append(name)
        elif name_lower.endswith(("_djvu.txt", ".txt")) and (
            "djvu" in format_lower or "text" in format_lower or name_lower.endswith("_djvu.txt")
        ):
            txt_files.append(name)

    for name in xml_files:
        urls.append(("xml", archive_download_url(identifier, name)))
    for name in txt_files:
        urls.append(("txt", archive_download_url(identifier, name)))

    if not urls:
        urls.extend(
            [
                ("xml", archive_download_url(identifier, f"{identifier}_djvu.xml")),
                ("xml", archive_download_url(identifier, f"{identifier}_djvu.xml.gz")),
                ("txt", archive_download_url(identifier, f"{identifier}_djvu.txt")),
            ]
        )
    return urls


def fetch_url_text(url: str) -> str | None:
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
    except (urllib.error.URLError, TimeoutError):
        return None
    if url.endswith(".gz"):
        data = gzip.decompress(data)
    return data.decode("utf-8", errors="replace")


def parse_djvu_xml(xml_text: str) -> list[PageText]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []

    pages: list[PageText] = []
    for page_number, object_node in enumerate(root.findall(".//OBJECT"), start=1):
        lines: list[str] = []
        for line_node in object_node.findall(".//LINE"):
            words = [
                "".join(word_node.itertext()).strip()
                for word_node in line_node.findall(".//WORD")
            ]
            line = " ".join(word for word in words if word)
            if line:
                lines.append(line)
        text = clean_page_text("\n".join(lines))
        pages.append(PageText(page_number=page_number, text=text, source="archive_full_text"))
    return pages


def parse_plain_full_text(text: str) -> list[PageText]:
    pages: list[PageText] = []
    parts = text.split("\f")
    if len(parts) == 1:
        cleaned = clean_page_text(text)
        return [PageText(page_number=1, text=cleaned, source="archive_full_text")] if cleaned else []
    for page_number, part in enumerate(parts, start=1):
        pages.append(PageText(page_number=page_number, text=clean_page_text(part), source="archive_full_text"))
    return pages


def load_archive_full_text(source_url: str, metadata: dict[str, object] | None = None) -> list[PageText]:
    for text_type, url in full_text_file_urls(source_url, metadata):
        xml_text = fetch_url_text(url)
        if not xml_text:
            continue
        pages = parse_djvu_xml(xml_text) if text_type == "xml" else parse_plain_full_text(xml_text)
        if pages and sum(len(page.text) for page in pages) > 5000:
            print(f"Using Archive full text: {url}", file=sys.stderr)
            return pages
    return []


def normalize_aphorism_markers(text: str) -> str:
    text = re.sub(r"(?m)^[\s*•·]*(?:APHORISM|Aphorism)\s+(\d{1,3})\.?\s*", r"§ \1 ", text)
    text = re.sub(r"(?m)^[\s*•·]*[§S]\s*(\d{1,3})[.)]?\s+", r"§ \1 ", text)
    text = re.sub(r"(?m)^[\s*•·]*(\d{1,3})\.\s+(?=[A-Z\"'])", r"§ \1 ", text)
    return text


def clean_page_text(text: str) -> str:
    cleaned_lines: list[str] = []
    for raw_line in text.replace("\x0c", "\n").splitlines():
        line = raw_line.strip()
        line = re.sub(r"\s+", " ", line)
        line = re.sub(r"[|_~*•·]{2,}", " ", line)
        if not line:
            continue
        line = normalize_aphorism_line(line)
        if re.fullmatch(r"[-—\s]*\d{1,4}[-—\s]*", line):
            continue
        if re.fullmatch(r"\(?\s*(?:ORGANON|ORGANON OF MEDICINE|MATERIA MEDICA)\s*\)?", line, re.IGNORECASE):
            continue
        alpha_count = len(re.findall(r"[A-Za-z]", line))
        if alpha_count < 3 and not re.search(r"\d", line):
            continue
        cleaned_lines.append(line)
    return normalize_aphorism_markers("\n".join(cleaned_lines)).strip()


def normalize_aphorism_line(line: str) -> str:
    marker_patterns = (
        r"^[§%?]\s*(\d{1,3})\s*[.)*]*\s*$",
        r"^[IilS5]\s+(\d{1,3})\s*[.)*]*\s*$",
        r"^(\d{1,3})\s*/\s*$",
        r"^(\d{1,3})\s*\.\s*$",
    )
    for pattern in marker_patterns:
        match = re.match(pattern, line)
        if match:
            return f"§ {match.group(1)}"

    prefixed_patterns = (
        r"^[§%?]\s*(\d{1,3})\s*[.)*]*\s+(.+)$",
        r"^[IilS5]\s+(\d{1,3})\s*[.)*]*\s+(.+)$",
    )
    for pattern in prefixed_patterns:
        match = re.match(pattern, line)
        if match:
            return f"§ {match.group(1)} {match.group(2)}"
    return line


def normalize_page_lines(text: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def pages_have_usable_text(pages: Iterable[PageText]) -> bool:
    page_list = list(pages)
    text = "\n".join(page.text for page in page_list)
    if len(text) < 5000:
        return False
    return bool(
        re.search(r"physician.{0,80}(?:mission|restore)", text, re.IGNORECASE)
        or len(aphorism_markers(text)) >= 20
    )


def extract_pdf_pages(
    pdf_path: Path,
    max_pages: int | None = None,
    use_ocr_fallback: bool = False,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
) -> list[PageText]:
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
    return pages


def extract_pdf_text(
    pdf_path: Path,
    output_path: Path,
    source_url: str,
    archive_metadata: dict[str, object] | None = None,
    max_pages: int | None = None,
    use_archive_full_text: bool = True,
    use_ocr_fallback: bool = True,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
) -> list[PageText]:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pages: list[PageText] = []
    if pdf_path.exists():
        pages = extract_pdf_pages(pdf_path, max_pages=max_pages, use_ocr_fallback=False)
        if pages_have_usable_text(pages):
            print("Using embedded text from downloaded PDF.", file=sys.stderr)

    if not pages_have_usable_text(pages):
        archive_pages = load_archive_full_text(source_url, archive_metadata) if use_archive_full_text else []
        if max_pages is not None and archive_pages:
            archive_pages = archive_pages[:max_pages]
        if pages_have_usable_text(archive_pages):
            pages = archive_pages
        elif pdf_path.exists() and use_ocr_fallback:
            pages = extract_pdf_pages(
                pdf_path,
                max_pages=max_pages,
                use_ocr_fallback=True,
                ocr_engine=ocr_engine,
                ocr_dpi=ocr_dpi,
            )
        elif archive_pages:
            pages = archive_pages

    if not pages:
        raise RuntimeError("No usable PDF embedded text, Archive full text OCR, or OCR-able PDF pages were available.")

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
        handle.write(f"Author: {AUTHOR}\n\n")
        handle.write(f"Edition: {EDITION}\n\n")
        handle.write(f"Translator/authors: {', '.join(TRANSLATOR_AUTHORS)}\n\n")
        for page in cleaned_pages:
            handle.write(f"<!-- page: {page.page_number} -->\n\n")
            handle.write(page.text)
            handle.write("\n\n")

    return cleaned_pages


def aphorism_markers(text: str) -> list[re.Match[str]]:
    return list(re.finditer(r"(?m)(?:^|\n)\s*§\s*(\d{1,3}[a-zA-Z]?)\b[.)]?\s*", text))


def select_main_organon_pages(pages: Iterable[PageText]) -> list[PageText]:
    page_list = list(pages)
    start_index = 0
    for index, page in enumerate(page_list):
        text = page.text.lower()
        opening_aphorism = (
            re.search(r"high\s+and\s+only\s+mission", text)
            or re.search(r"hif>h\s+and\s+only\s+mission", text)
            or re.search(r"restore.{0,40}sick.{0,40}health", text)
            or re.search(r"sick.{0,40}health.{0,40}cure", text)
        )
        if re.search(r"(?m)^§\s*1\b", page.text) and "physician" in text and opening_aphorism:
            start_index = index
            break

    end_index = len(page_list)
    for index in range(start_index, len(page_list)):
        if re.search(r"(?m)^§\s*294\b", page_list[index].text):
            end_index = index + 2 if index + 1 < len(page_list) else index + 1
            break
    return page_list[start_index:end_index]


def build_chunks(
    pages: Iterable[PageText],
    source_url: str,
    output_path: Path,
    max_chars: int = 4500,
) -> list[dict[str, object]]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    chunks: list[dict[str, object]] = []
    current_aphorism: str | None = None
    buffer: list[str] = []
    page_start: int | None = None
    page_end: int | None = None

    def flush() -> None:
        nonlocal buffer, page_start, page_end, current_aphorism
        text = normalize_text(" ".join(buffer))
        if not text or page_start is None or page_end is None:
            buffer = []
            page_start = None
            page_end = None
            return
        chunks.append(
            {
                "book": BOOK,
                "author": AUTHOR,
                "school": SCHOOL,
                "edition": EDITION,
                "translator_authors": TRANSLATOR_AUTHORS,
                "source_url": source_url,
                "aphorism_number": current_aphorism or "Unknown",
                "page_start": page_start,
                "page_end": page_end,
                "text": text,
            }
        )
        buffer = []
        page_start = None
        page_end = None

    for page in select_main_organon_pages(pages):
        text = page.text
        matches = aphorism_markers(text)
        if not matches:
            if buffer:
                if len(" ".join(buffer + [text])) > max_chars:
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
            flush()
            current_aphorism = match.group(1)
            segment_end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            segment = text[match.start() : segment_end].strip()
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
    use_archive_full_text: bool = True,
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

    archive_metadata = load_archive_metadata(source_url)
    pdf_error: RuntimeError | None = None
    try:
        download_first_available_pdf(source_url, archive_metadata, raw_pdf, force=force_download)
    except RuntimeError as exc:
        pdf_error = exc
        print(str(exc), file=sys.stderr)

    pages = extract_pdf_text(
        raw_pdf,
        extracted_text,
        source_url=source_url,
        archive_metadata=archive_metadata,
        max_pages=max_pages,
        use_archive_full_text=use_archive_full_text,
        use_ocr_fallback=use_ocr_fallback,
        ocr_engine=ocr_engine,
        ocr_dpi=ocr_dpi,
    )
    if pdf_error is not None and not pages:
        raise pdf_error
    cleaned_pages = clean_pages_to_markdown(pages, clean_markdown)
    build_chunks(cleaned_pages, source_url, chunks_jsonl)

    return {
        "raw_pdf": raw_pdf,
        "extracted_text": extracted_text,
        "clean_markdown": clean_markdown,
        "chunks_jsonl": chunks_jsonl,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest Organon of Medicine PDF.")
    parser.add_argument("--source-url", default=SOURCE_URL, help="Archive item URL or PDF URL to ingest.")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root for data outputs.")
    parser.add_argument("--force-download", action="store_true", help="Download even when raw PDF already exists.")
    parser.add_argument("--max-pages", type=int, default=None, help="Optional page limit for development runs.")
    parser.add_argument(
        "--no-archive-full-text",
        action="store_true",
        help="Skip Archive DjVu XML full text and use PDF extraction/OCR instead.",
    )
    parser.add_argument(
        "--no-ocr-fallback",
        action="store_true",
        help="Disable OCR fallback and use only Archive/PDF text.",
    )
    parser.add_argument(
        "--ocr-engine",
        choices=["auto", "paddle", "tesseract", "pymupdf"],
        default="auto",
        help="OCR engine for pages where text extraction fails.",
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
        use_archive_full_text=not args.no_archive_full_text,
        use_ocr_fallback=not args.no_ocr_fallback,
        ocr_engine=args.ocr_engine,
        ocr_dpi=args.ocr_dpi,
    )
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
