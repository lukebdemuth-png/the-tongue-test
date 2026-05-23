from __future__ import annotations

import hashlib
import re

from .nlp_tags import enrich_record
from .schema import ResearchChunk, chunk_to_dict


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:80] or "untitled"


def chunk_record(record: dict, max_chars: int = 1800, overlap: int = 150) -> list[dict]:
    enriched = enrich_record(record)
    body = str(enriched.get("text") or enriched.get("abstract") or "").strip()
    if not body:
        return []
    title = str(enriched.get("title", "")).strip() or "Untitled"
    source_id = stable_id(enriched.get("source_url") or title)
    pieces = split_text(body, max_chars=max_chars, overlap=overlap)
    chunks = []
    for index, piece in enumerate(pieces, start=1):
        chunk_id = f"{source_id}-{index:04d}"
        chunk = ResearchChunk(
            chunk_id=chunk_id,
            source_id=source_id,
            title=title,
            title_slug=slugify(title),
            text=piece,
            section=enriched.get("section", ""),
            authors=enriched.get("authors", []),
            publication=enriched.get("publication", ""),
            date=enriched.get("date", ""),
            source_url=enriched.get("source_url", ""),
            retrieval_date=enriched.get("retrieval_date", ""),
            symptoms=enriched.get("symptoms", []),
            interventions=enriched.get("interventions", []),
            outcomes=enriched.get("outcomes", []),
            confidence_language=enriched.get("confidence_language", []),
            tradition=enriched.get("tradition", []),
            tags=enriched.get("tags", []),
            remedy_relationships=enriched.get("remedy_relationships", []),
            symptom_pattern_relationships=enriched.get("symptom_pattern_relationships", []),
            constitutional_descriptions=enriched.get("constitutional_descriptions", []),
            differential_remedy_logic=enriched.get("differential_remedy_logic", []),
            diagnosis_pattern=enriched.get("diagnosis_pattern", []),
            contradictions_limitations=enriched.get("contradictions_limitations", []),
        )
        chunks.append(chunk_to_dict(chunk))
    return chunks


def split_text(text: str, max_chars: int = 1800, overlap: int = 150) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n{2,}", text) if paragraph.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if not current:
            current = paragraph
        elif len(current) + len(paragraph) + 2 <= max_chars:
            current = f"{current}\n\n{paragraph}"
        else:
            chunks.extend(split_long_text(current, max_chars=max_chars))
            current = paragraph
    if current:
        chunks.extend(split_long_text(current, max_chars=max_chars))
    if overlap <= 0 or len(chunks) < 2:
        return chunks
    overlapped = [chunks[0]]
    for previous, chunk in zip(chunks, chunks[1:]):
        prefix = previous[-overlap:].strip()
        overlapped.append(f"{prefix}\n\n{chunk}" if prefix else chunk)
    return overlapped


def split_long_text(text: str, max_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    for sentence in sentences:
        if not current:
            current = sentence
        elif len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}"
        else:
            chunks.append(current.strip())
            current = sentence
    if current:
        chunks.append(current.strip())
    return chunks


def stable_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]
