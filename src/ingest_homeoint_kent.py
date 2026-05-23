"""Ingest selected public Homeoint Kent repertory pages into rubric JSONL."""

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


BASE_URL = "http://www.homeoint.org/books/kentrep/kentcont.htm"
OUTPUT_PATH = Path("data/chunks/homeopathy_kent_repertory_chunks.jsonl")
DEFAULT_SECTIONS = {"Mind", "Stomach", "Abdomen", "Stool", "Sleep", "Generalities"}
ALL_KENT_SECTIONS = {
    "ABDOMEN", "BACK", "BLADDER", "CHEST", "CHILL", "COUGH", "EAR", "EXPECTORATION",
    "EXTERNAL THROAT", "EXTREMITIES", "EYE", "FACE", "FEVER AND HEAT", "GENERALITIES",
    "GENITALIA MALE", "GENITALIA FEMALE", "HEAD", "HEARING", "KIDNEYS", "LARYNX AND TRACHEA",
    "MIND", "MOUTH", "NOSE", "PERSPIRATION", "PROSTATE GLAND", "RECTUM", "RESPIRATION",
    "SKIN", "SLEEP", "SMELL", "STOMACH", "STOOL", "TEETH", "THROAT", "URETHRA",
    "URINARY ORGANS", "URINE", "VERTIGO", "VISION", "VOICE",
}


class KentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.paragraphs: list[dict[str, str | int]] = []
        self.links: list[str] = []
        self.depth = 0
        self.current: list[str] = []
        self.current_depth = 0
        self.in_paragraph = False
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script":
            self.in_script = True
        if tag == "style":
            self.in_style = True
        if tag == "dir":
            self.depth += 1
        if tag == "p":
            self.in_paragraph = True
            self.current = []
            self.current_depth = self.depth
        if tag == "a":
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.links.append(value)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self.in_script = False
        if tag == "style":
            self.in_style = False
        if tag == "p" and self.in_paragraph:
            text = clean(" ".join(self.current))
            if text:
                self.paragraphs.append({"depth": self.current_depth, "text": text})
            self.in_paragraph = False
            self.current = []
        if tag == "dir":
            self.depth = max(0, self.depth - 1)

    def handle_data(self, data: str) -> None:
        if self.in_paragraph and not self.in_script and not self.in_style:
            self.current.append(data)


def clean(value: str) -> str:
    value = unescape(value).replace("\xa0", " ")
    value = value.replace("\x9c", "oe")
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([.,;:])", r"\1", value)
    return value.strip(" \t\r\n")


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "PatternAppResearchBot/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("latin-1", errors="replace")


def parse_html(html: str) -> tuple[list[dict[str, str | int]], list[str]]:
    parser = KentParser()
    parser.feed(html)
    return parser.paragraphs, parser.links


def content_links(html: str, sections: set[str] | None = None) -> list[dict[str, str]]:
    section_names = sections or DEFAULT_SECTIONS
    rows: list[dict[str, str]] = []
    for href, section in re.findall(r'<a href="([^"]+)".*?</a></td>\s*<td[^>]*>([^<]+)</td>', html, re.I | re.S):
        section = clean(section)
        if section in section_names:
            rows.append({"section": section, "url": urljoin(BASE_URL, href)})
    if rows:
        return rows

    paragraphs, links = parse_html(html)
    for index, paragraph in enumerate(paragraphs):
        text = str(paragraph["text"])
        if text in section_names:
            href = links[index] if index < len(links) else ""
            rows.append({"section": text, "url": urljoin(BASE_URL, href)})
    return rows


def current_section(paragraphs: list[dict[str, str | int]], fallback: str) -> str:
    for paragraph in paragraphs:
        text = str(paragraph["text"]).upper()
        if text in ALL_KENT_SECTIONS:
            return text.title()
    return fallback


def next_page_url(base_url: str, links: list[str]) -> str | None:
    for href in reversed(links):
        if "#" in href and re.search(r"kent\d+\.htm#P\d+", href):
            return urljoin(base_url, href.split("#", 1)[0])
    return None


def page_number(paragraphs: list[dict[str, str | int]]) -> int | None:
    for paragraph in paragraphs:
        match = re.search(r"\bp\.\s*(\d+)\b", str(paragraph["text"]), re.I)
        if match:
            return int(match.group(1))
    return None


def remedy_abbreviations(text: str) -> list[str]:
    if ":" not in text:
        return []
    remedy_text = text.split(":", 1)[1]
    raw = re.findall(r"\b[A-Z]?[a-z]{2,}(?:-[a-z0-9]+)?\.|\b[A-Z][a-z]{1,}(?:-[a-z0-9]+)?\.", remedy_text)
    remedies = []
    for item in raw:
        remedy = item.strip(" .").lower()
        if remedy in {"see", "and", "the", "from", "after", "before", "while", "with"}:
            continue
        remedies.append(remedy)
    return sorted(set(remedies))


def rubric_rows(paragraphs: list[dict[str, str | int]], section: str, source_url: str) -> list[dict[str, object]]:
    page = page_number(paragraphs)
    stack: list[tuple[int, str]] = []
    rows: list[dict[str, object]] = []
    for paragraph in paragraphs:
        depth = int(paragraph["depth"])
        text = clean(str(paragraph["text"]))
        if not text or text.startswith("----------") or text.startswith("Copyright"):
            continue
        if text.upper() in {section.upper(), "KENT"} or re.match(r"^[A-Z ]+ p\. \d+", text):
            continue
        if ">>>>>" in text or "<<<<<" in text:
            continue
        while stack and stack[-1][0] >= depth:
            stack.pop()
        rubric_text = text.split(":", 1)[0].strip()
        if rubric_text:
            stack.append((depth, rubric_text))
        remedies = remedy_abbreviations(text)
        if not remedies:
            continue
        rubric_path = " > ".join(item for _, item in stack)
        rows.append(
            {
                "section": section,
                "rubric": rubric_text,
                "rubric_path": rubric_path,
                "remedy_abbreviations": remedies,
                "page_start": page,
                "page_end": page,
                "source_url": source_url,
                "text": text,
            }
        )
    return rows


def ingest(
    sections: set[str] | None = None,
    max_pages_per_section: int | None = None,
    sleep: float = 0.1,
    output_path: Path = OUTPUT_PATH,
) -> int:
    sections = sections or DEFAULT_SECTIONS
    toc_html = fetch(BASE_URL)
    starts = content_links(toc_html, sections)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    seen_urls = set()
    count = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for start in starts:
            section = start["section"]
            url: str | None = start["url"]
            pages = 0
            while url and url not in seen_urls:
                seen_urls.add(url)
                html = fetch(url)
                paragraphs, links = parse_html(html)
                found_section = current_section(paragraphs, section)
                if found_section != section:
                    break
                for row in rubric_rows(paragraphs, section, url):
                    count += 1
                    row.update(
                        {
                            "chunk_id": f"homeopathy_kent_repertory:{count:05d}",
                            "source_id": "homeopathy_kent_repertory",
                            "tradition": "Homeopathy",
                            "title": "Kent's Repertory",
                            "author": "James Tyler Kent",
                            "entry_type": "repertory_rubric",
                            "rights_note": "Homeoint public web presentation; verify terms before publishing extracted full text.",
                        }
                    )
                    handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
                pages += 1
                if max_pages_per_section and pages >= max_pages_per_section:
                    break
                next_url = next_page_url(url, links)
                if not next_url or next_url == url:
                    break
                url = next_url
                time.sleep(sleep)
    return count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest selected Kent repertory pages from Homeoint.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--sections", nargs="*", default=sorted(DEFAULT_SECTIONS))
    parser.add_argument("--max-pages-per-section", type=int, default=None)
    parser.add_argument("--sleep", type=float, default=0.1)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    count = ingest(
        sections=set(args.sections),
        max_pages_per_section=args.max_pages_per_section,
        sleep=args.sleep,
        output_path=args.output,
    )
    print(f"Wrote {count} Kent repertory rubrics to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
