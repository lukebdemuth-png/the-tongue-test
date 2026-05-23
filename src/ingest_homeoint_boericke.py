"""Ingest public Homeoint Boericke materia medica pages into remedy JSONL."""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.request
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin


BASE_URL = "http://www.homeoint.org/books/boericmm/"
OUTPUT_PATH = Path("data/chunks/homeopathy_boericke_chunks.jsonl")
LETTERS = "abcdefghijklmnopqrstuvwxyz"


class TextAndLinksParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text: list[str] = []
        self.links: list[str] = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.in_script = True
            self.in_style = True
        if tag == "a":
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.links.append(value)
        if tag in {"p", "br", "div", "tr", "blockquote"}:
            self.text.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self.in_script = False
        if tag == "style":
            self.in_style = False
        if tag in {"p", "div", "tr", "blockquote"}:
            self.text.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.in_script and not self.in_style:
            self.text.append(data)


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "PatternAppResearchBot/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("latin-1", errors="replace")


def parse_html(html: str) -> tuple[str, list[str]]:
    parser = TextAndLinksParser()
    parser.feed(html)
    text = unescape(" ".join(parser.text))
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,;:])", r"\1", text).strip()
    return text, parser.links


def remedy_links(max_letters: int | None = None) -> list[str]:
    urls: list[str] = []
    seen = set()
    letters = LETTERS[:max_letters] if max_letters else LETTERS
    for letter in letters:
        html = fetch(urljoin(BASE_URL, f"{letter}.htm"))
        _, links = parse_html(html)
        for href in links:
            if re.fullmatch(rf"{letter}/[a-z0-9-]+\.htm", href, re.IGNORECASE):
                url = urljoin(BASE_URL, href)
                if url not in seen:
                    urls.append(url)
                    seen.add(url)
    return urls


def extract_title(html: str, text: str) -> tuple[str, str]:
    title_match = re.search(r"<title>(.*?)\s+-\s+HOM", html, re.IGNORECASE | re.DOTALL)
    title = clean(title_match.group(1)) if title_match else ""
    if not title:
        match = re.search(r"Presented by.*?([A-Z][A-Z\s\-]+)\s+([A-Z][A-Za-z\- ]+)?\s+Is the", text)
        title = clean(match.group(1)) if match else "Unknown Remedy"
    common = ""
    title_block = re.search(rf"{re.escape(title)}\s+([A-Z][A-Za-z\- ]{{2,80}})", text)
    if title_block:
        candidate = clean(title_block.group(1))
        if not re.search(r"Mind|Head|Stomach|Modalities|Relationship|Dose", candidate):
            common = candidate
    return title, common


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip(" .:-")


def section_map(text: str) -> dict[str, str]:
    section_names = [
        "Mind", "Head", "Eyes", "Ears", "Nose", "Mouth", "Throat", "Stomach", "Abdomen",
        "Stool", "Urine", "Male", "Female", "Respiratory", "Heart", "Back", "Extremities",
        "Sleep", "Skin", "Fever", "Modalities", "Relationship", "Dose",
    ]
    pattern = re.compile(rf"\b({'|'.join(section_names)})\.--", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    sections: dict[str, str] = {}
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections[match.group(1).title()] = clean(text[start:end])
    return sections


def ingest(max_remedies: int | None = None, sleep: float = 0.1, output_path: Path = OUTPUT_PATH) -> int:
    urls = remedy_links()
    if max_remedies:
        urls = urls[:max_remedies]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for index, url in enumerate(urls, start=1):
            html = fetch(url)
            text, _ = parse_html(html)
            title, common = extract_title(html, text)
            sections = section_map(text)
            body_start = text.find(title)
            body = clean(text[body_start:]) if body_start >= 0 else text
            row = {
                "chunk_id": f"homeopathy_boericke:{index:04d}",
                "source_id": "homeopathy_boericke_materia_medica",
                "tradition": "Homeopathy",
                "title": "Boericke's New Manual of Homeopathic Materia Medica with Repertory",
                "author": "William Boericke",
                "remedy": title.title(),
                "common_name": common,
                "source_url": url,
                "entry_type": "materia_medica_remedy",
                "sections": sections,
                "text": body,
                "rights_note": "Homeoint public web presentation; verify terms before publishing extracted full text.",
            }
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
            count += 1
            time.sleep(sleep)
    return count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest Boericke materia medica from Homeoint.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--max-remedies", type=int, default=None)
    parser.add_argument("--sleep", type=float, default=0.1)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    count = ingest(max_remedies=args.max_remedies, sleep=args.sleep, output_path=args.output)
    print(f"Wrote {count} Boericke remedy entries to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
