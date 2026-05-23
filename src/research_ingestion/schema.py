from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any


@dataclass
class ResearchRecord:
    title: str
    authors: list[str] = field(default_factory=list)
    publication: str = ""
    date: str = ""
    abstract: str = ""
    keywords: list[str] = field(default_factory=list)
    symptoms: list[str] = field(default_factory=list)
    interventions: list[str] = field(default_factory=list)
    outcomes: list[str] = field(default_factory=list)
    confidence_language: list[str] = field(default_factory=list)
    tradition: list[str] = field(default_factory=list)
    source_url: str = ""
    retrieval_date: str = field(default_factory=lambda: date.today().isoformat())
    source_name: str = ""
    source_type: str = ""
    identifiers: dict[str, str] = field(default_factory=dict)
    open_access: bool | None = None
    license: str = ""
    full_text_url: str = ""
    pdf_url: str = ""
    text: str = ""
    publication_source: str = ""
    access_status: str = ""
    summary: str = ""
    extracted_concepts: list[str] = field(default_factory=list)
    symptom_clusters: list[str] = field(default_factory=list)
    intervention: list[str] = field(default_factory=list)
    outcome: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    source_scores: dict[str, Any] = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    priority: str = ""
    references: list[dict[str, Any]] = field(default_factory=list)
    terminology: list[str] = field(default_factory=list)
    system_architecture_ideas: list[str] = field(default_factory=list)
    decision_support_logic: list[str] = field(default_factory=list)
    clinical_reasoning_frameworks: list[str] = field(default_factory=list)
    diagnosis_pattern: list[str] = field(default_factory=list)
    contradictions_limitations: list[str] = field(default_factory=list)
    source_collection: str = ""
    remedy_relationships: list[str] = field(default_factory=list)
    symptom_pattern_relationships: list[str] = field(default_factory=list)
    intervention_sequencing: list[str] = field(default_factory=list)
    constitutional_descriptions: list[str] = field(default_factory=list)
    case_reasoning: list[str] = field(default_factory=list)
    differential_remedy_logic: list[str] = field(default_factory=list)


@dataclass
class ResearchChunk:
    chunk_id: str
    source_id: str
    title: str
    text: str
    page_start: int | None = None
    page_end: int | None = None
    section: str = ""
    title_slug: str = ""
    authors: list[str] = field(default_factory=list)
    publication: str = ""
    date: str = ""
    source_url: str = ""
    retrieval_date: str = field(default_factory=lambda: date.today().isoformat())
    symptoms: list[str] = field(default_factory=list)
    interventions: list[str] = field(default_factory=list)
    outcomes: list[str] = field(default_factory=list)
    confidence_language: list[str] = field(default_factory=list)
    tradition: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    remedy_relationships: list[str] = field(default_factory=list)
    symptom_pattern_relationships: list[str] = field(default_factory=list)
    constitutional_descriptions: list[str] = field(default_factory=list)
    differential_remedy_logic: list[str] = field(default_factory=list)
    diagnosis_pattern: list[str] = field(default_factory=list)
    contradictions_limitations: list[str] = field(default_factory=list)


REQUIRED_RECORD_FIELDS = [
    "title",
    "authors",
    "publication",
    "date",
    "abstract",
    "keywords",
    "symptoms",
    "interventions",
    "outcomes",
    "confidence_language",
    "tradition",
    "source_url",
    "retrieval_date",
]


def normalize_record(data: dict[str, Any]) -> dict[str, Any]:
    record = ResearchRecord(
        title=str(data.get("title", "")).strip(),
        authors=_as_list(data.get("authors") or data.get("author")),
        publication=str(data.get("publication", "")).strip(),
        date=str(data.get("date", "")).strip(),
        abstract=str(data.get("abstract", "")).strip(),
        keywords=_as_list(data.get("keywords")),
        symptoms=_as_list(data.get("symptoms")),
        interventions=_as_list(data.get("interventions")),
        outcomes=_as_list(data.get("outcomes")),
        confidence_language=_as_list(data.get("confidence_language")),
        tradition=_as_list(data.get("tradition")),
        source_url=str(data.get("source_url", "")).strip(),
        retrieval_date=str(data.get("retrieval_date") or date.today().isoformat()),
        source_name=str(data.get("source_name", "")).strip(),
        source_type=str(data.get("source_type", "")).strip(),
        identifiers=dict(data.get("identifiers") or {}),
        open_access=data.get("open_access"),
        license=str(data.get("license", "")).strip(),
        full_text_url=str(data.get("full_text_url", "")).strip(),
        pdf_url=str(data.get("pdf_url", "")).strip(),
        text=str(data.get("text", "")).strip(),
        publication_source=str(data.get("publication_source", "")).strip(),
        access_status=str(data.get("access_status", "")).strip(),
        summary=str(data.get("summary", "")).strip(),
        extracted_concepts=_as_list(data.get("extracted_concepts")),
        symptom_clusters=_as_list(data.get("symptom_clusters")),
        intervention=_as_list(data.get("intervention")),
        outcome=_as_list(data.get("outcome")),
        limitations=_as_list(data.get("limitations")),
        source_scores=dict(data.get("source_scores") or {}),
        tags=_as_list(data.get("tags")),
        priority=str(data.get("priority", "")).strip(),
        references=list(data.get("references") or []),
        terminology=_as_list(data.get("terminology")),
        system_architecture_ideas=_as_list(data.get("system_architecture_ideas")),
        decision_support_logic=_as_list(data.get("decision_support_logic")),
        clinical_reasoning_frameworks=_as_list(data.get("clinical_reasoning_frameworks")),
        diagnosis_pattern=_as_list(data.get("diagnosis_pattern")),
        contradictions_limitations=_as_list(data.get("contradictions_limitations")),
        source_collection=str(data.get("source_collection", "")).strip(),
        remedy_relationships=_as_list(data.get("remedy_relationships")),
        symptom_pattern_relationships=_as_list(data.get("symptom_pattern_relationships")),
        intervention_sequencing=_as_list(data.get("intervention_sequencing")),
        constitutional_descriptions=_as_list(data.get("constitutional_descriptions")),
        case_reasoning=_as_list(data.get("case_reasoning")),
        differential_remedy_logic=_as_list(data.get("differential_remedy_logic")),
    )
    return asdict(record)


def chunk_to_dict(chunk: ResearchChunk) -> dict[str, Any]:
    return asdict(chunk)


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, (tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value).strip()
    return [text] if text else []
