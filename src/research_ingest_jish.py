from __future__ import annotations

import argparse
import re
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

from research_ingestion.io import write_jsonl
from research_ingestion.nlp_tags import enrich_record
from research_ingestion.polite import polite_get
from research_ingestion.schema import normalize_record

JISH_CURRENT_ISSUE_URL = "https://jish-mldtrust.com/current-issue/"

JISH_TAGS = [
    "homeopathy",
    "standardized case record",
    "clinical reasoning",
    "practitioner methodology",
    "outcome tracking",
    "longitudinal care",
    "differential diagnosis",
    "community medicine",
    "intake methodology",
]

PRIORITY_TERMS = [
    "methodology",
    "structured intake",
    "case record",
    "case recording",
    "follow-up",
    "follow up",
    "evaluation",
    "clinical decision",
    "framework",
    "training",
    "teaching",
    "education",
    "case report",
]

ARTICLE_CATEGORIES = {
    "Book Review",
    "Case Report",
    "Case Series",
    "Editorial",
    "Original Article",
    "Pilot Research Projects/Observational Studies",
    "Policy Paper on Homoeopathic Education",
    "Policy Paper on Homoeopathic Education/Research/Clinical Training",
    "Proceedings of Scientific Conferences and Research Meets",
    "Review Article",
    "Systematic Review and Meta-analysis",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest JISH current-issue metadata as a high-priority Homeopathy source.")
    parser.add_argument("--url", default=JISH_CURRENT_ISSUE_URL)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    html = polite_get(args.url).decode("utf-8", errors="replace")
    records = [enrich_record(record) for record in parse_jish_current_issue(html, args.url)]
    write_jsonl(args.output, records)
    print(f"Wrote {len(records)} JISH records to {args.output}")


def parse_jish_current_issue(html: str, base_url: str = JISH_CURRENT_ISSUE_URL) -> list[dict]:
    parser = LinkTextParser(base_url)
    parser.feed(html)
    lines = [line.strip() for line in parser.text_lines if line.strip()]
    link_by_title = {link["text"]: link["href"] for link in parser.links if link["text"]}
    pdf_links = [link["href"] for link in parser.links if link["text"].lower() == "pdf"]
    records = []
    current_issue = next((line for line in lines if re.search(r"Volume\s+\d+.+Issue\s+\d+", line)), "")
    index = 0
    pdf_index = 0
    while index < len(lines):
        category = lines[index]
        if category not in ARTICLE_CATEGORIES:
            index += 1
            continue
        title_index = next_content_line(lines, index + 1)
        if title_index is None:
            index += 1
            continue
        title = lines[title_index]
        author_index = next_content_line(lines, title_index + 1)
        authors = split_authors(lines[author_index]) if author_index is not None else []
        doi = ""
        page_range = ""
        scan_index = (author_index or title_index) + 1
        while scan_index < len(lines) and lines[scan_index] not in ARTICLE_CATEGORIES:
            if lines[scan_index].startswith("DOI:"):
                doi = lines[scan_index].replace("DOI:", "").strip()
            if re.match(r"p\.\d+", lines[scan_index]):
                page_range = lines[scan_index]
                break
            scan_index += 1
        source_url = link_by_title.get(title, base_url)
        pdf_url = pdf_links[pdf_index] if pdf_index < len(pdf_links) else ""
        if pdf_url:
            pdf_index += 1
        if doi and title.lower() not in {"home", "current issue", "archives"}:
            records.append(build_jish_record(category, title, authors, doi, page_range, current_issue, source_url, pdf_url))
        index = scan_index + 1
    return records


def build_jish_record(
    category: str,
    title: str,
    authors: list[str],
    doi: str,
    page_range: str,
    issue: str,
    source_url: str,
    pdf_url: str,
) -> dict:
    text = " ".join([title, category, issue, page_range])
    priority = "high" if is_priority_jish_article(category, title) else "normal"
    tags = set(JISH_TAGS)
    if category == "Case Report":
        tags.update({"case reasoning", "longitudinal care", "outcome tracking"})
    if "teaching" in title.lower() or "training" in title.lower() or "education" in title.lower():
        tags.update({"practitioner training", "practitioner methodology"})
    return normalize_record(
        {
            "title": title,
            "authors": authors,
            "publication": "Journal of Integrated Standardized Homoeopathy",
            "date": issue,
            "abstract": "",
            "keywords": [category, "JISH", "homoeopathy"],
            "source_url": source_url,
            "source_name": "Journal of Integrated Standardized Homoeopathy",
            "source_type": "current_issue_metadata",
            "identifiers": {"doi": doi} if doi else {},
            "open_access": True,
            "full_text_url": source_url,
            "pdf_url": pdf_url,
            "text": text,
            "priority": priority,
            "tags": sorted(tags),
            "tradition": ["Homeopathy"],
            "source_collection": "homeopathy",
            "clinical_reasoning_frameworks": [text] if priority == "high" else [],
            "case_reasoning": [text] if category == "Case Report" else [],
        }
    )


def is_priority_jish_article(category: str, title: str) -> bool:
    haystack = f"{category} {title}".lower()
    return category == "Case Report" or any(term in haystack for term in PRIORITY_TERMS)


def next_content_line(lines: list[str], start: int) -> int | None:
    skip_prefixes = ("Full text", "PDF", "DOI:")
    for index in range(start, len(lines)):
        line = lines[index]
        if line in ARTICLE_CATEGORIES:
            return None
        if line and not line.startswith(skip_prefixes) and not re.match(r"p\.\d+", line):
            return index
    return None


def split_authors(text: str) -> list[str]:
    return [author.strip() for author in re.split(r",\s*", text) if author.strip()]


class LinkTextParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.text_lines: list[str] = []
        self.links: list[dict[str, str]] = []
        self._current_href = ""
        self._current_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            attrs_dict = dict(attrs)
            href = attrs_dict.get("href") or ""
            self._current_href = urllib.parse.urljoin(self.base_url, href)
            self._current_text = []

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._current_href:
            text = clean_space(" ".join(self._current_text))
            self.links.append({"text": text, "href": self._current_href})
            self._current_href = ""
            self._current_text = []

    def handle_data(self, data: str) -> None:
        text = clean_space(data)
        if not text:
            return
        self.text_lines.append(text)
        if self._current_href:
            self._current_text.append(text)


def clean_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


if __name__ == "__main__":
    main()
