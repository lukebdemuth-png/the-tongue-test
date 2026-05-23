from __future__ import annotations

import argparse
import re
import urllib.parse
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError

import fitz

from research_ingestion.io import append_jsonl, write_jsonl
from research_ingestion.polite import polite_get
from research_ingestion.schema import normalize_record

INTAKE_SOURCES = [
    {
        "title": "Touchstone Health Ayurveda Intake",
        "source_url": "https://touchstonehealth.ca/wp-content/uploads/2013/06/Ayurveda-Intake-fillable-v11.pdf",
        "source_type": "intake_form_pdf",
        "access_status": "public_pdf",
    },
    {
        "title": "Deborah Keene Ayurveda Client Intake Form",
        "source_url": "https://thedeborahkeene.com/wp-content/uploads/2015/02/ayurveda-client-intake-form.pdf",
        "source_type": "intake_form_pdf",
        "access_status": "public_pdf",
    },
    {
        "title": "Eliza Kerr Ayurveda Client Intake Form",
        "source_url": "https://elizakerr.com/ayurveda/client_intake_form/",
        "source_type": "intake_form_html",
        "access_status": "public_web_page",
    },
    {
        "title": "Jotform Ayurvedic Center Medical Questionnaire",
        "source_url": "https://www.jotform.com/form-templates/ayurvedic-center-medical-questionnaire",
        "source_type": "questionnaire_template",
        "access_status": "public_web_page",
    },
]

RESEARCH_SOURCES = [
    {
        "title": "Prakriti200 dataset",
        "source_url": "https://arxiv.org/abs/2510.06262",
        "source_type": "research_preprint",
        "access_status": "open_access_metadata",
    },
    {
        "title": "AyurParam language model",
        "source_url": "https://arxiv.org/abs/2511.02374",
        "source_type": "research_preprint",
        "access_status": "open_access_metadata",
    },
]

SECTION_PATTERNS = [
    ("identity_contact", ["name", "address", "phone", "email", "date of birth", "age", "occupation"]),
    ("chief_concern", ["main concern", "chief complaint", "primary concern", "reason for visit"]),
    ("medical_history", ["medical history", "health history", "surgeries", "hospital", "diagnosis"]),
    ("medications_supplements", ["medication", "supplement", "prescription", "vitamin", "herb"]),
    ("digestion", ["digestion", "appetite", "bloating", "gas", "nausea", "heartburn", "craving"]),
    ("elimination", ["bowel", "stool", "constipation", "diarrhea", "urination", "urine"]),
    ("sleep", ["sleep", "insomnia", "dream", "wake", "rested"]),
    ("energy", ["energy", "fatigue", "tired", "vitality"]),
    ("emotional_state", ["stress", "anxiety", "depression", "anger", "fear", "grief", "mood", "emotional"]),
    ("constitution", ["constitution", "prakriti", "vata", "pitta", "kapha", "dosha"]),
    ("lifestyle", ["exercise", "diet", "lifestyle", "work", "routine", "smoking", "alcohol", "caffeine"]),
    ("reproductive_health", ["menstrual", "pregnancy", "menopause", "cycle", "birth control"]),
    ("follow_up", ["follow up", "follow-up", "progress", "changes since", "outcome"]),
    ("severity_scale", ["scale", "rate", "severity", "0-10", "1-10", "mild", "moderate", "severe"]),
]

RESEARCH_PATTERNS = [
    ("questionnaire_structures", ["questionnaire", "survey", "items", "instrument", "assessment"]),
    ("dosha_classification_logic", ["dosha", "prakriti", "vata", "pitta", "kapha", "classification"]),
    ("computational_reasoning_methods", ["model", "language model", "machine learning", "transformer", "embedding", "classification"]),
    ("scoring_systems", ["score", "scoring", "scale", "label", "annotation"]),
    ("classification_methodology", ["classifier", "classification", "dataset", "benchmark", "evaluation"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest priority Ayurveda intake forms and questionnaire research sources.")
    parser.add_argument("--output-dir", type=Path, default=Path("sources/metadata/intake_methodology"))
    parser.add_argument("--download-dir", type=Path, default=Path("sources/raw/intake_methodology"))
    parser.add_argument("--skip-network", action="store_true")
    parser.add_argument("--clear-error-log", action="store_true")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.download_dir.mkdir(parents=True, exist_ok=True)
    error_log = args.output_dir / "error_log.jsonl"
    if args.clear_error_log and error_log.exists():
        error_log.unlink()
    error_log.touch()

    records = []
    if not args.skip_network:
        for source in INTAKE_SOURCES:
            records.append(fetch_intake_source(source, args.download_dir, error_log))
        for source in RESEARCH_SOURCES:
            records.append(fetch_research_source(source, error_log))
    else:
        records = [build_static_source_record(source, []) for source in INTAKE_SOURCES + RESEARCH_SOURCES]

    records = [record for record in records if record]
    write_jsonl(args.output_dir / "intake_source_records.jsonl", records)
    print(f"Wrote {len(records)} intake/research source records to {args.output_dir}")


def fetch_intake_source(source: dict, download_dir: Path, error_log: Path) -> dict:
    url = source["source_url"]
    try:
        payload = polite_get(url)
        if url.lower().endswith(".pdf"):
            path = download_dir / safe_filename(url)
            path.write_bytes(payload)
            text = extract_pdf_text(path)
        else:
            text = extract_html_text(payload.decode("utf-8", errors="replace"))
        derived = derive_intake_structure(text)
        return build_static_source_record(source, derived)
    except (PermissionError, HTTPError, URLError, TimeoutError, fitz.FileDataError) as exc:
        append_jsonl(error_log, {"source_url": url, "error": str(exc), "stage": "fetch_intake_source"})
        return build_static_source_record(source, [])


def fetch_research_source(source: dict, error_log: Path) -> dict:
    url = source["source_url"]
    try:
        html = polite_get(url).decode("utf-8", errors="replace")
        text = extract_html_text(html)
        derived = derive_research_methodology(text)
        title = extract_arxiv_title(text) or source["title"]
        record = build_static_source_record({**source, "title": title}, derived)
        record["summary"] = "Open-access arXiv metadata source prioritized for computational Ayurveda intake and reasoning methodology."
        return record
    except (PermissionError, HTTPError, URLError, TimeoutError) as exc:
        append_jsonl(error_log, {"source_url": url, "error": str(exc), "stage": "fetch_research_source"})
        return build_static_source_record(source, [])


def build_static_source_record(source: dict, derived: list[dict]) -> dict:
    categories = [item["category"] for item in derived]
    return normalize_record(
        {
            "title": source["title"],
            "authors": [],
            "publication": source.get("publication", source.get("source_url", "")),
            "publication_source": source.get("publication", source.get("source_url", "")),
            "date": "",
            "tradition": ["Ayurveda"],
            "source_type": source["source_type"],
            "access_status": source["access_status"],
            "source_url": source["source_url"],
            "summary": summarize_source(source, categories),
            "extracted_concepts": sorted(set(categories)),
            "symptom_clusters": sorted(set(category for category in categories if category in {"digestion", "elimination", "sleep", "energy", "emotional_state"})),
            "diagnosis_pattern": [category for category in categories if category in {"constitution", "dosha_classification_logic", "classification_methodology"}],
            "intervention": [],
            "outcome": [category for category in categories if category in {"follow_up", "severity_scale"}],
            "limitations": ["Derived structure only; raw copyrighted questionnaire text is not stored in git outputs."],
            "confidence_language": ["derived", "structure only"],
            "tags": ["intake methodology", "questionnaire", "ayurveda", "constitutional pattern"],
            "source_collection": "intake_methodology",
            "source_scores": {
                "authority_score": 2.5 if source["source_type"].startswith("intake") else 3.5,
                "relevance_score": 5,
                "clinical_reasoning_value": 3,
                "pattern_recognition_value": 4,
                "outcome_tracking_value": 3 if "follow_up" in categories else 1,
                "legal_access_status": source["access_status"],
                "confidence_level": "moderate" if categories else "low",
            },
            "text": " ".join(categories),
        }
    )


def derive_intake_structure(text: str) -> list[dict]:
    lines = meaningful_lines(text)
    derived = []
    for order, (category, patterns) in enumerate(SECTION_PATTERNS, start=1):
        matches = [line for line in lines if contains_any(line, patterns)]
        if matches:
            derived.append(
                {
                    "order": order,
                    "category": category,
                    "matched_signals": sorted(set(pattern for pattern in patterns if contains_any(" ".join(matches), [pattern]))),
                    "question_count_estimate": len(matches),
                }
            )
    return derived


def derive_research_methodology(text: str) -> list[dict]:
    lines = meaningful_lines(text)
    derived = []
    for order, (category, patterns) in enumerate(RESEARCH_PATTERNS, start=1):
        matches = [line for line in lines if contains_any(line, patterns)]
        if matches:
            derived.append(
                {
                    "order": order,
                    "category": category,
                    "matched_signals": sorted(set(pattern for pattern in patterns if contains_any(" ".join(matches), [pattern]))),
                    "question_count_estimate": len(matches),
                }
            )
    return derived


def extract_pdf_text(path: Path) -> str:
    document = fitz.open(path)
    pages = [page.get_text("text") for page in document]
    document.close()
    return "\n".join(pages)


def extract_html_text(html: str) -> str:
    parser = VisibleTextParser()
    parser.feed(html)
    return "\n".join(parser.text)


def meaningful_lines(text: str) -> list[str]:
    lines = []
    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip()
        if 3 <= len(clean) <= 180:
            lines.append(clean)
    return lines


def contains_any(text: str, patterns: list[str]) -> bool:
    lowered = text.lower()
    return any(pattern.lower() in lowered for pattern in patterns)


def summarize_source(source: dict, categories: list[str]) -> str:
    if categories:
        return f"Public Ayurveda intake/research source with derived structure covering: {', '.join(sorted(set(categories)))}."
    return "Priority Ayurveda intake/research source queued for derived structure extraction."


def extract_arxiv_title(text: str) -> str:
    for line in meaningful_lines(text):
        if line.lower().startswith("title:"):
            return line.split(":", 1)[1].strip()
    return ""


def safe_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = Path(parsed.path).name or "source.pdf"
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style", "noscript"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        clean = re.sub(r"\s+", " ", data).strip()
        if clean:
            self.text.append(clean)


if __name__ == "__main__":
    main()
