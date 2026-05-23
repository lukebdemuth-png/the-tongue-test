from __future__ import annotations

import argparse
import re
from pathlib import Path

import fitz


PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN_X = 54
MARGIN_Y = 54
LINE_GAP = 4
CODE_BG = (0.96, 0.95, 0.92)
TEXT_COLOR = (0.12, 0.13, 0.12)
MOSS = (0.22, 0.32, 0.24)


def clean_inline(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = text.replace("->", "→")
    return text


class PdfWriter:
    def __init__(self, title: str):
        self.doc = fitz.open()
        self.page = None
        self.y = MARGIN_Y
        self.title = title
        self.page_number = 0
        self.new_page()

    def new_page(self) -> None:
        self.page = self.doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
        self.page_number += 1
        self.y = MARGIN_Y
        footer = f"{self.title}  |  {self.page_number}"
        self.page.insert_text(
            (MARGIN_X, PAGE_HEIGHT - 28),
            footer,
            fontsize=8,
            fontname="helv",
            color=(0.45, 0.45, 0.42),
        )

    def ensure_space(self, height: float) -> None:
        if self.y + height > PAGE_HEIGHT - MARGIN_Y:
            self.new_page()

    def textbox(self, text: str, size: float, font: str = "helv", color=TEXT_COLOR, indent: float = 0, leading: float = 1.25) -> None:
        width = PAGE_WIDTH - (MARGIN_X * 2) - indent
        rect = fitz.Rect(MARGIN_X + indent, self.y, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - MARGIN_Y)
        required = max(size * leading, estimate_height(text, size, width, leading))
        self.ensure_space(required + LINE_GAP)
        rect = fitz.Rect(MARGIN_X + indent, self.y, PAGE_WIDTH - MARGIN_X, self.y + required + 8)
        spare = self.page.insert_textbox(rect, text, fontsize=size, fontname=font, color=color, align=fitz.TEXT_ALIGN_LEFT)
        used = required + 8 if spare < 0 else (required + 8 - spare)
        self.y += max(size * leading, used) + LINE_GAP

    def codebox(self, text: str) -> None:
        size = 8.5
        width = PAGE_WIDTH - (MARGIN_X * 2)
        height = estimate_height(text, size, width, 1.25) + 18
        self.ensure_space(height + LINE_GAP)
        rect = fitz.Rect(MARGIN_X, self.y, PAGE_WIDTH - MARGIN_X, self.y + height)
        self.page.draw_rect(rect, color=(0.86, 0.84, 0.78), fill=CODE_BG, width=0.5)
        self.page.insert_textbox(
            fitz.Rect(rect.x0 + 10, rect.y0 + 9, rect.x1 - 10, rect.y1 - 8),
            text,
            fontsize=size,
            fontname="cour",
            color=(0.16, 0.16, 0.15),
        )
        self.y += height + LINE_GAP


def estimate_height(text: str, size: float, width: float, leading: float) -> float:
    avg_char = size * 0.48
    chars_per_line = max(24, int(width / avg_char))
    lines = 0
    for para in text.splitlines() or [""]:
        lines += max(1, (len(para) // chars_per_line) + 1)
    return lines * size * leading


def render_markdown(input_path: Path, output_path: Path, subtitle: str | None = None) -> None:
    raw = input_path.read_text(encoding="utf-8")
    lines = raw.splitlines()
    title = next((line[2:].strip() for line in lines if line.startswith("# ")), input_path.stem)
    writer = PdfWriter(title)
    writer.textbox(title, 25, font="helv", color=MOSS, leading=1.05)
    if subtitle:
        writer.textbox(subtitle, 10.5, color=(0.34, 0.34, 0.31))
    writer.y += 8

    in_code = False
    code_lines: list[str] = []
    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code:
                writer.codebox("\n".join(code_lines).strip())
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not stripped:
            writer.y += 5
            continue
        if stripped.startswith("## "):
            writer.y += 8
            writer.textbox(clean_inline(stripped[3:]), 16, font="helv", color=MOSS, leading=1.12)
            continue
        if stripped.startswith("### "):
            writer.y += 4
            writer.textbox(clean_inline(stripped[4:]), 12.5, font="helv", color=(0.18, 0.22, 0.18))
            continue
        if re.match(r"^\d+\.\s+", stripped):
            writer.textbox(clean_inline(stripped), 9.8, indent=10)
            continue
        if stripped.startswith("- "):
            writer.textbox("• " + clean_inline(stripped[2:]), 9.6, indent=12)
            continue
        writer.textbox(clean_inline(stripped), 10.2)

    if code_lines:
        writer.codebox("\n".join(code_lines).strip())

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer.doc.set_metadata({"title": title, "author": "Pattern App Project"})
    writer.doc.save(output_path)
    writer.doc.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a simple Markdown document to PDF.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--subtitle", default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    render_markdown(args.input, args.output, args.subtitle)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
