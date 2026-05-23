from __future__ import annotations

import re
from pathlib import Path

import fitz


def pdf_to_markdown(pdf_path: Path, output_path: Path) -> Path:
    document = fitz.open(pdf_path)
    pages = []
    for index, page in enumerate(document, start=1):
        text = page.get_text("text").strip()
        if text:
            pages.append(f"<!-- page: {index} -->\n\n{clean_pdf_text(text)}")
    document.close()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n\n".join(pages).strip() + "\n", encoding="utf-8")
    return output_path


def clean_pdf_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"-\n(?=[a-z])", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
