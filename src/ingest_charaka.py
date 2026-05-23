"""Ingest Charaka Samhita Volume 1 from PDF into cleaned text and JSONL chunks."""

from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Iterable, Literal
from urllib.parse import urlparse, unquote

import fitz


SOURCE_URL = (
    "https://dn721604.ca.archive.org/0/items/"
    "JTrz_charak-samhita-with-ayurved-dipika-of-ram-karan-sharma-by-vaidya-bhagvan-dash-vol.-1-chaukhambh/"
    "Charak%20Samhita%20with%20Ayurved%20Dipika%20of%20Ram%20Karan%20Sharma%20by%20Vaidya%20Bhagvan%20Dash%20Vol.%201%20-%20Chaukhambha.pdf"
)

BOOK = "Charak Samhita with Ayurved Dipika"
SCHOOL = "Ayurveda"
VOLUME = "Vol. 1"
TRANSLATOR_AUTHORS = [
    "Ram Karan Sharma",
    "Vaidya Bhagvan Dash",
]
NO_EMBEDDED_TEXT_MESSAGE = (
    "[No embedded text detected on this PDF page. OCR is required to extract the scanned page image.]"
)
OCR_NO_TEXT_MESSAGE = "[OCR ran on this scanned page, but no readable text was detected.]"

RAW_PDF = Path("data/raw/charaka_vol1.pdf")
EXTRACTED_TEXT = Path("data/extracted/charaka_vol1_raw.txt")
CLEAN_MARKDOWN = Path("data/clean/charaka_vol1.md")
CHUNKS_JSONL = Path("data/chunks/charaka_vol1_chunks.jsonl")
OCR_CONFIDENCE_LOG = Path("data/extracted/charaka_vol1_ocr_confidence.jsonl")
REQUIRED_METADATA = {
    "book",
    "school",
    "volume",
    "translator_authors",
    "source_url",
    "page_start",
    "page_end",
    "section",
    "chapter",
    "text",
}
OCR_ENGINE = Literal["auto", "paddle", "tesseract", "pymupdf"]
_PADDLE_OCR = None


@dataclass(frozen=True)
class PageText:
    page_number: int
    text: str
    source: str = "embedded"
    ocr_engine: str | None = None
    ocr_confidence: float | None = None
    sanskrit_text: str = ""
    english_text: str = ""


def resolve(root: Path, path: Path) -> Path:
    return path if path.is_absolute() else root / path


def ensure_directories(root: Path) -> None:
    for directory in ("data/raw", "data/extracted", "data/clean", "data/chunks"):
        (root / directory).mkdir(parents=True, exist_ok=True)


def import_optional(module_name: str):
    try:
        return __import__(module_name)
    except ImportError:
        return None


def download_pdf(source_url: str, output_path: Path, force: bool = False) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and not force:
        return output_path

    parsed = urlparse(source_url)
    if parsed.scheme == "file":
        source_path = Path(unquote(parsed.path))
        shutil.copyfile(source_path, output_path)
        return output_path

    urllib.request.urlretrieve(source_url, output_path)
    return output_path


def render_page_png(page: fitz.Page, dpi: int) -> bytes:
    zoom = dpi / 72
    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return pixmap.tobytes("png")


def ocr_with_tesseract(page: fitz.Page, dpi: int) -> tuple[str, float | None]:
    pytesseract = import_optional("pytesseract")
    if pytesseract is None:
        raise RuntimeError("pytesseract is not installed. Install it with `pip install pytesseract pillow`.")

    try:
        from PIL import Image
        from pytesseract import Output
    except ImportError as exc:
        raise RuntimeError("Pillow is required for Tesseract OCR. Install it with `pip install pillow`.") from exc

    image = Image.open(io.BytesIO(render_page_png(page, dpi)))
    data = pytesseract.image_to_data(image, lang="eng", output_type=Output.DICT, config="--psm 6")

    lines: dict[tuple[int, int, int], list[str]] = {}
    confidences: list[float] = []
    for index, raw_word in enumerate(data.get("text", [])):
        word = raw_word.strip()
        if not word:
            continue
        key = (
            data["block_num"][index],
            data["par_num"][index],
            data["line_num"][index],
        )
        lines.setdefault(key, []).append(word)
        try:
            confidence = float(data["conf"][index])
        except (TypeError, ValueError):
            continue
        if confidence >= 0:
            confidences.append(confidence)

    text = "\n".join(" ".join(words) for _, words in sorted(lines.items()))
    return text, round(mean(confidences), 2) if confidences else None


def ocr_with_paddle(page: fitz.Page, dpi: int) -> tuple[str, float | None]:
    global _PADDLE_OCR
    try:
        from paddleocr import PaddleOCR
    except ImportError as exc:
        raise RuntimeError("PaddleOCR is not installed. Install it with `pip install paddleocr`.") from exc

    try:
        import numpy as np
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("PaddleOCR image conversion requires Pillow and numpy.") from exc

    image = Image.open(io.BytesIO(render_page_png(page, dpi))).convert("RGB")
    if _PADDLE_OCR is None:
        _PADDLE_OCR = PaddleOCR(use_textline_orientation=True, lang="en")
    result = _PADDLE_OCR.ocr(np.array(image))

    lines: list[str] = []
    confidences: list[float] = []
    for page_result in result or []:
        if isinstance(page_result, dict):
            lines.extend(text.strip() for text in page_result.get("rec_texts", []) if text.strip())
            for score in page_result.get("rec_scores", []):
                try:
                    confidences.append(float(score) * 100)
                except (TypeError, ValueError):
                    continue
            continue
        for item in page_result or []:
            if len(item) < 2:
                continue
            text, confidence = item[1]
            if text.strip():
                lines.append(text.strip())
            try:
                confidences.append(float(confidence) * 100)
            except (TypeError, ValueError):
                continue

    return "\n".join(lines), round(mean(confidences), 2) if confidences else None


def ocr_with_pymupdf(page: fitz.Page, dpi: int) -> tuple[str, float | None]:
    text_page = page.get_textpage_ocr(language="eng", dpi=dpi, full=True)
    return page.get_text("text", textpage=text_page), None


def ocr_page(page: fitz.Page, engine: OCR_ENGINE = "auto", dpi: int = 300) -> tuple[str, float | None, str]:
    engines: list[str]
    if engine == "auto":
        engines = ["paddle", "tesseract", "pymupdf"]
    else:
        engines = [engine]

    errors: list[str] = []
    for candidate in engines:
        try:
            if candidate == "paddle":
                text, confidence = ocr_with_paddle(page, dpi)
            elif candidate == "tesseract":
                text, confidence = ocr_with_tesseract(page, dpi)
            elif candidate == "pymupdf":
                text, confidence = ocr_with_pymupdf(page, dpi)
            else:
                raise ValueError(f"Unsupported OCR engine: {candidate}")
        except Exception as exc:
            errors.append(f"{candidate}: {exc}")
            continue
        return text, confidence, candidate

    raise RuntimeError("No OCR engine succeeded. " + " | ".join(errors))


def is_probably_sanskrit_line(line: str) -> bool:
    text = line.strip()
    if not text:
        return False
    devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))
    if devanagari_chars >= 3:
        return True
    transliteration_markers = len(re.findall(r"[āīūṛṝḷṃḥṅñṭḍṇśṣĀĪŪṚṜḶṂḤṄÑṬḌṆŚṢ]", text))
    words = re.findall(r"[A-Za-zāīūṛṝḷṃḥṅñṭḍṇśṣĀĪŪṚṜḶṂḤṄÑṬḌṆŚṢ]+", text)
    if transliteration_markers >= 2 and len(words) <= 14:
        return True
    return bool(re.search(r"\b(atha|iti|ca|tu|eva|samhita|sūtra|sutra|śarīra|sarira|cikitsā|cikitsa)\b", text, re.IGNORECASE)) and len(words) <= 10


def split_sanskrit_english(text: str) -> tuple[str, str]:
    sanskrit_lines: list[str] = []
    english_lines: list[str] = []
    for line in text.splitlines():
        cleaned = line.strip()
        if not cleaned:
            continue
        if is_probably_sanskrit_line(cleaned):
            sanskrit_lines.append(cleaned)
        else:
            english_lines.append(cleaned)
    return "\n".join(sanskrit_lines), "\n".join(english_lines)


def clean_ocr_garbage(text: str) -> str:
    cleaned_lines: list[str] = []
    for raw_line in text.replace("\x0c", "\n").splitlines():
        line = raw_line.strip()
        line = re.sub(r"[|]{2,}", "|", line)
        line = re.sub(r"[_~*•·]{2,}", " ", line)
        line = re.sub(r"\s+", " ", line)
        if not line:
            continue
        alpha_count = len(re.findall(r"[A-Za-z\u0900-\u097F]", line))
        if alpha_count < 3 and not re.search(r"\d", line):
            continue
        if len(line) <= 2:
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def repeated_line_set(pages: Iterable[PageText], min_repeats: int = 4) -> set[str]:
    counts: dict[str, int] = {}
    for page in pages:
        seen_on_page: set[str] = set()
        lines = [line.strip() for line in page.text.splitlines() if line.strip()]
        candidates = lines[:3] + lines[-3:]
        for line in candidates:
            normalized = re.sub(r"\d+", "#", line.lower())
            normalized = re.sub(r"[^a-z# ]+", "", normalized)
            normalized = re.sub(r"\s+", " ", normalized).strip()
            if len(normalized) < 8 or normalized in seen_on_page:
                continue
            seen_on_page.add(normalized)
            counts[normalized] = counts.get(normalized, 0) + 1
    return {line for line, count in counts.items() if count >= min_repeats}


def remove_repeated_headers_footers(pages: Iterable[PageText]) -> list[PageText]:
    page_list = list(pages)
    repeated = repeated_line_set(page_list)
    if not repeated:
        return page_list

    cleaned_pages: list[PageText] = []
    for page in page_list:
        kept_lines: list[str] = []
        for line in page.text.splitlines():
            normalized = re.sub(r"\d+", "#", line.lower())
            normalized = re.sub(r"[^a-z# ]+", "", normalized)
            normalized = re.sub(r"\s+", " ", normalized).strip()
            if normalized in repeated:
                continue
            kept_lines.append(line)
        cleaned_pages.append(
            PageText(
                page_number=page.page_number,
                text="\n".join(kept_lines).strip(),
                source=page.source,
                ocr_engine=page.ocr_engine,
                ocr_confidence=page.ocr_confidence,
                sanskrit_text=page.sanskrit_text,
                english_text=page.english_text,
            )
        )
    return cleaned_pages


def write_ocr_confidence_log(pages: Iterable[PageText], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        for page in pages:
            if page.source != "ocr":
                continue
            handle.write(
                json.dumps(
                    {
                        "page": page.page_number,
                        "ocr_confidence": page.ocr_confidence,
                        "engine": page.ocr_engine,
                        "text_characters": len(page.text),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )


def extract_pdf_text(
    pdf_path: Path,
    output_path: Path,
    max_pages: int | None = None,
    use_ocr: bool = True,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
    ocr_log_path: Path | None = None,
) -> list[PageText]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pages: list[PageText] = []

    with fitz.open(pdf_path) as document:
        page_count = len(document) if max_pages is None else min(max_pages, len(document))
        for page_index in range(page_count):
            page = document[page_index]
            if use_ocr:
                text, confidence, used_engine = ocr_page(page, engine=ocr_engine, dpi=ocr_dpi)
                text = clean_ocr_garbage(text)
                sanskrit_text, english_text = split_sanskrit_english(text)
                pages.append(
                    PageText(
                        page_number=page_index + 1,
                        text=text,
                        source="ocr",
                        ocr_engine=used_engine,
                        ocr_confidence=confidence,
                        sanskrit_text=sanskrit_text,
                        english_text=english_text,
                    )
                )
                print(
                    f"OCR page {page_index + 1}/{page_count} via {used_engine}"
                    f" confidence={confidence if confidence is not None else 'n/a'}",
                    file=sys.stderr,
                )
            else:
                text = page.get_text("text").strip()
                sanskrit_text, english_text = split_sanskrit_english(text)
                pages.append(
                    PageText(
                        page_number=page_index + 1,
                        text=text,
                        source="embedded",
                        sanskrit_text=sanskrit_text,
                        english_text=english_text,
                    )
                )

    pages = remove_repeated_headers_footers(pages)
    if ocr_log_path is not None:
        write_ocr_confidence_log(pages, ocr_log_path)

    with output_path.open("w", encoding="utf-8") as handle:
        for page in pages:
            handle.write(f"\n\n[[PAGE {page.page_number}]]\n\n")
            if page.source == "ocr":
                handle.write(f"[[OCR_CONFIDENCE {page.ocr_confidence if page.ocr_confidence is not None else 'n/a'}]]\n\n")
            handle.write(page.text)
            handle.write("\n")

    return pages


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def infer_section(text: str, current_section: str | None) -> str | None:
    match = re.search(r"\b(Sutra|Nidana|Vimana|Sarira|Indriya|Cikitsa|Kalpa|Siddhi)\s+Sthana\b", text, re.IGNORECASE)
    if match:
        return f"{match.group(1).title()} Sthana"
    return current_section


def infer_chapter(text: str, current_chapter: str | None) -> str | None:
    patterns = (
        r"\bChapter\s+([IVXLCDM]+|\d+)\b[:.\-\s]*(.{0,90})",
        r"\bAdhyaya\s+([IVXLCDM]+|\d+)\b[:.\-\s]*(.{0,90})",
    )
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            title = normalize_text(match.group(2)).strip(" .:-")
            return f"Chapter {match.group(1)}" + (f": {title}" if title else "")
    return current_chapter


def clean_pages_to_markdown(pages: Iterable[PageText], output_path: Path) -> list[PageText]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned_pages: list[PageText] = []

    for page in pages:
        text = normalize_text(page.text)
        if not text:
            text = OCR_NO_TEXT_MESSAGE if page.source == "ocr" else NO_EMBEDDED_TEXT_MESSAGE
        sanskrit_text, english_text = split_sanskrit_english(text)
        cleaned_pages.append(
            PageText(
                page_number=page.page_number,
                text=text,
                source=page.source,
                ocr_confidence=page.ocr_confidence,
                sanskrit_text=sanskrit_text,
                english_text=english_text,
            )
        )

    with output_path.open("w", encoding="utf-8") as handle:
        handle.write(f"# {BOOK} ({VOLUME})\n\n")
        if cleaned_pages and all(page.text == NO_EMBEDDED_TEXT_MESSAGE for page in cleaned_pages):
            handle.write(
                "> PyMuPDF found no embedded text layer in this PDF. "
                "The page entries below preserve page-level provenance and mark the source as requiring OCR.\n\n"
            )
        for page in cleaned_pages:
            handle.write(f"<!-- page: {page.page_number} -->\n\n")
            if page.ocr_confidence is not None:
                handle.write(f"<!-- ocr_confidence: {page.ocr_confidence} -->\n\n")
            if page.sanskrit_text and page.english_text:
                handle.write("## Sanskrit / Source Lines\n\n")
                handle.write(page.sanskrit_text)
                handle.write("\n\n## English Commentary\n\n")
                handle.write(page.english_text)
            else:
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
    sanskrit_buffer: list[str] = []
    english_buffer: list[str] = []
    page_start: int | None = None
    page_end: int | None = None

    def flush() -> None:
        nonlocal buffer, sanskrit_buffer, english_buffer, page_start, page_end
        text = normalize_text(" ".join(buffer))
        if not text or page_start is None or page_end is None:
            buffer = []
            sanskrit_buffer = []
            english_buffer = []
            page_start = None
            page_end = None
            return
        chunks.append(
            {
                "book": BOOK,
                "school": SCHOOL,
                "volume": VOLUME,
                "translator_authors": TRANSLATOR_AUTHORS,
                "source_url": source_url,
                "page_start": page_start,
                "page_end": page_end,
                "section": current_section or "Unknown",
                "chapter": current_chapter or "Unknown",
                "sanskrit_text": normalize_text(" ".join(sanskrit_buffer)),
                "english_text": normalize_text(" ".join(english_buffer)) or text,
                "text": text,
            }
        )
        buffer = []
        sanskrit_buffer = []
        english_buffer = []
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
            if is_probably_sanskrit_line(sentence):
                sanskrit_buffer.append(sentence)
            else:
                english_buffer.append(sentence)

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
    use_ocr: bool = True,
    ocr_engine: OCR_ENGINE = "auto",
    ocr_dpi: int = 300,
) -> dict[str, Path]:
    root = root.resolve()
    ensure_directories(root)

    raw_pdf = resolve(root, RAW_PDF)
    extracted_text = resolve(root, EXTRACTED_TEXT)
    clean_markdown = resolve(root, CLEAN_MARKDOWN)
    chunks_jsonl = resolve(root, CHUNKS_JSONL)
    ocr_log = resolve(root, OCR_CONFIDENCE_LOG)

    download_pdf(source_url, raw_pdf, force=force_download)
    pages = extract_pdf_text(
        raw_pdf,
        extracted_text,
        max_pages=max_pages,
        use_ocr=use_ocr,
        ocr_engine=ocr_engine,
        ocr_dpi=ocr_dpi,
        ocr_log_path=ocr_log,
    )
    cleaned_pages = clean_pages_to_markdown(pages, clean_markdown)
    build_chunks(cleaned_pages, source_url, chunks_jsonl)

    return {
        "raw_pdf": raw_pdf,
        "extracted_text": extracted_text,
        "clean_markdown": clean_markdown,
        "chunks_jsonl": chunks_jsonl,
        "ocr_confidence_log": ocr_log,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest Charaka Samhita Volume 1 PDF.")
    parser.add_argument("--source-url", default=SOURCE_URL, help="PDF URL to ingest.")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Project root for data outputs.")
    parser.add_argument("--force-download", action="store_true", help="Download even when raw PDF already exists.")
    parser.add_argument("--max-pages", type=int, default=None, help="Optional page limit for development runs.")
    parser.add_argument("--no-ocr", action="store_true", help="Use embedded PDF text only; useful for tests or born-digital PDFs.")
    parser.add_argument(
        "--ocr-engine",
        choices=["auto", "paddle", "tesseract", "pymupdf"],
        default="auto",
        help="OCR engine for scanned pages. Auto tries PaddleOCR, Tesseract, then PyMuPDF OCR.",
    )
    parser.add_argument("--ocr-dpi", type=int, default=300, help="Render DPI used for OCR.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    outputs = run_pipeline(
        root=args.root,
        source_url=args.source_url,
        force_download=args.force_download,
        max_pages=args.max_pages,
        use_ocr=not args.no_ocr,
        ocr_engine=args.ocr_engine,
        ocr_dpi=args.ocr_dpi,
    )
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
