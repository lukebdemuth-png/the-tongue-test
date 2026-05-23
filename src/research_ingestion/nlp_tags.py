from __future__ import annotations

import re

from .config import TRADITION_ALIASES

SYMPTOM_TERMS = [
    "anxiety",
    "asthma",
    "breathlessness",
    "chronic pain",
    "depression",
    "fatigue",
    "headache",
    "hypertension",
    "insomnia",
    "nausea",
    "stress",
    "chill",
    "thirst",
    "sleeplessness",
    "restlessness",
    "modalities",
    "aggravation",
    "amelioration",
]

INTERVENTION_TERMS = [
    "acupuncture",
    "ayurveda",
    "breathing",
    "chinese herbal medicine",
    "herbal",
    "homeopathy",
    "homeopathic remedy",
    "potency",
    "repertorization",
    "materia medica",
    "repertory",
    "remedy",
    "meditation",
    "moxibustion",
    "pranayama",
    "qigong",
    "tai chi",
    "yoga",
    "decision support",
    "e-learning",
    "clinical decision support",
]

OUTCOME_TERMS = [
    "adverse event",
    "blood pressure",
    "clinical improvement",
    "improved",
    "pain score",
    "quality of life",
    "reduced",
    "remission",
    "sleep quality",
]

CONFIDENCE_TERMS = [
    "appears",
    "associated with",
    "case report",
    "could",
    "may",
    "might",
    "pilot",
    "preliminary",
    "suggests",
    "was not significant",
    "limited",
    "limitation",
    "limitations",
    "further research",
    "cannot be concluded",
    "uncertain",
    "small sample",
    "single case",
]

TRADITION_PATTERNS = {
    "Ayurveda": ["ayurveda", "ayurvedic", "dosha", "prakriti", "vata", "pitta", "kapha"],
    "TCM": ["traditional chinese medicine", "tcm", "syndrome differentiation", "pattern differentiation", "qi", "yin", "yang", "meridian"],
    "Qigong": ["qigong", "qi gong"],
    "Yoga": ["yoga", "pranayama", "asana"],
    "Homeopathy": ["homeopathy", "homeopathic", "hahnemann", "organon", "materia medica", "repertory", "repertorization", "remedy"],
    "Integrative medicine": ["integrative medicine", "whole systems medicine", "complementary medicine"],
}

HOMEOPATHY_TAG_TERMS = [
    "homeopathy",
    "materia medica",
    "repertory",
    "constitutional pattern",
    "constitutional",
    "remedy relationship",
    "remedy relationships",
    "complementary remedy",
    "antidote",
    "follows well",
    "incompatible",
    "symptom cluster",
    "symptom totality",
    "intervention outcome",
    "case reasoning",
    "differential remedy",
    "differential diagnosis",
    "repertorization",
    "potency",
    "miasm",
    "proving",
]

ARCHITECTURE_TERMS = [
    "architecture",
    "algorithm",
    "case-based",
    "clinical decision support",
    "decision support",
    "diagnostic reasoning",
    "e-learning",
    "framework",
    "knowledge base",
    "learning management",
    "pattern recognition",
    "practitioner training",
    "rule-based",
    "system design",
    "clinical documentation",
    "clinical decision framework",
    "follow-up",
    "longitudinal",
    "outcome tracking",
    "practitioner methodology",
    "standardized case record",
    "structured intake",
    "training method",
]

HOMEOPATHY_OUTPUT_TAGS = {
    "homeopathy": ["homeopathy", "homeopathic", "hahnemann", "organon"],
    "materia medica": ["materia medica", "drug picture", "remedy picture", "proving"],
    "repertory": ["repertory", "rubric", "repertorization"],
    "constitutional pattern": ["constitutional", "constitution", "miasm", "temperament"],
    "remedy relationship": ["remedy relationship", "remedy relationships", "complementary remedy", "antidote", "follows well", "incompatible"],
    "symptom cluster": ["symptom cluster", "symptom totality", "totality of symptoms", "modalities"],
    "intervention outcome": ["intervention outcome", "outcome", "clinical improvement", "aggravation", "amelioration"],
    "standardized case record": ["standardized case record", "standardised case record", "case record", "case recording"],
    "clinical reasoning": ["clinical reasoning", "case reasoning", "reasoning"],
    "practitioner methodology": ["practitioner methodology", "methodology", "clinical method", "case taking"],
    "outcome tracking": ["outcome tracking", "follow-up", "follow up", "longitudinal outcomes"],
    "longitudinal care": ["longitudinal care", "longitudinal", "follow-up evaluation"],
    "differential diagnosis": ["differential diagnosis", "differential remedy", "differential"],
    "community medicine": ["community medicine", "community health", "public health"],
    "intake methodology": ["intake methodology", "structured intake", "case taking", "history taking"],
}

GENERAL_REASONING_TAGS = {
    "case study": ["case report", "case study", "case studies", "clinical case"],
    "clinical reasoning": ["clinical reasoning", "practitioner reasoning", "diagnostic reasoning", "case reasoning"],
    "differential diagnosis": ["differential diagnosis", "differential", "differentiation"],
    "constitutional pattern": ["constitutional", "constitution", "prakriti", "pattern differentiation", "syndrome differentiation"],
    "intervention outcome": ["intervention", "outcome", "follow-up", "follow up", "longitudinal"],
    "practitioner methodology": ["practitioner methodology", "methodology", "diagnostic methodology", "case taking", "clinical method"],
}


def enrich_record(record: dict) -> dict:
    text = " ".join(
        str(record.get(field, ""))
        for field in ["title", "abstract", "text", "publication"]
    )
    record = dict(record)
    record["symptoms"] = sorted(set(record.get("symptoms") or []) | set(find_terms(text, SYMPTOM_TERMS)))
    record["interventions"] = sorted(set(record.get("interventions") or []) | set(find_terms(text, INTERVENTION_TERMS)))
    record["outcomes"] = sorted(set(record.get("outcomes") or []) | set(find_terms(text, OUTCOME_TERMS)))
    record["confidence_language"] = sorted(
        set(record.get("confidence_language") or []) | set(find_terms(text, CONFIDENCE_TERMS))
    )
    existing_traditions = {normalize_tradition(tradition) for tradition in record.get("tradition", [])}
    record["tradition"] = sorted(existing_traditions | set(find_traditions(text)))
    record["tags"] = sorted(set(record.get("tags") or []) | set(find_terms(text, ARCHITECTURE_TERMS)))
    record["tags"] = sorted(set(record["tags"]) | set(find_homeopathy_tags(text)))
    record["tags"] = sorted(set(record["tags"]) | set(find_reasoning_tags(text)))
    record["terminology"] = sorted(set(record.get("terminology") or []) | set(find_terms(text, ARCHITECTURE_TERMS + INTERVENTION_TERMS + HOMEOPATHY_TAG_TERMS)))
    record["diagnosis_pattern"] = sorted(
        set(record.get("diagnosis_pattern") or [])
        | set(extract_focus_sentences(text, ["diagnosis", "pattern differentiation", "syndrome differentiation", "constitutional", "prakriti", "differential diagnosis"]))
    )
    record["contradictions_limitations"] = sorted(
        set(record.get("contradictions_limitations") or [])
        | set(extract_focus_sentences(text, ["limitation", "limitations", "conflict", "contradiction", "however", "uncertain", "further research", "small sample", "single case"]))
    )
    if "Homeopathy" in record["tradition"]:
        record["remedy_relationships"] = sorted(
            set(record.get("remedy_relationships") or [])
            | set(extract_focus_sentences(text, ["complementary remedy", "antidote", "follows well", "incompatible", "remedy relationship"]))
        )
        record["symptom_pattern_relationships"] = sorted(
            set(record.get("symptom_pattern_relationships") or [])
            | set(extract_focus_sentences(text, ["symptom totality", "symptom cluster", "modalities", "aggravation", "amelioration", "rubric"]))
        )
        record["intervention_sequencing"] = sorted(
            set(record.get("intervention_sequencing") or [])
            | set(extract_focus_sentences(text, ["potency", "dose", "repetition", "sequence", "follow-up", "follows well"]))
        )
        record["constitutional_descriptions"] = sorted(
            set(record.get("constitutional_descriptions") or [])
            | set(extract_focus_sentences(text, ["constitutional", "constitution", "temperament", "miasm"]))
        )
        record["case_reasoning"] = sorted(
            set(record.get("case_reasoning") or [])
            | set(extract_focus_sentences(text, ["case reasoning", "case analysis", "repertorization", "differential", "selected because"]))
        )
        record["differential_remedy_logic"] = sorted(
            set(record.get("differential_remedy_logic") or [])
            | set(extract_focus_sentences(text, ["differential remedy", "differential", "compare", "distinguish", "rubric"]))
        )
    return record


def find_terms(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    found = []
    for term in terms:
        pattern = r"\b" + re.escape(term.lower()) + r"\b"
        if re.search(pattern, lowered):
            found.append(term)
    return found


def find_traditions(text: str) -> list[str]:
    traditions = []
    for tradition, patterns in TRADITION_PATTERNS.items():
        if find_terms(text, patterns):
            traditions.append(tradition)
    return traditions


def normalize_tradition(tradition: str) -> str:
    stripped = str(tradition).strip()
    return TRADITION_ALIASES.get(stripped.lower(), stripped)


def find_homeopathy_tags(text: str) -> list[str]:
    tags = []
    for tag, patterns in HOMEOPATHY_OUTPUT_TAGS.items():
        if find_terms(text, patterns):
            tags.append(tag)
    return tags


def find_reasoning_tags(text: str) -> list[str]:
    tags = []
    for tag, patterns in GENERAL_REASONING_TAGS.items():
        if find_terms(text, patterns):
            tags.append(tag)
    return tags


def extract_focus_sentences(text: str, keywords: list[str], limit: int = 12) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    matches = []
    for sentence in sentences:
        clean = re.sub(r"\s+", " ", sentence).strip()
        lowered = clean.lower()
        if clean and any(keyword.lower() in lowered for keyword in keywords):
            matches.append(clean)
        if len(matches) >= limit:
            break
    return matches


def extract_intervention_outcome_relationships(record: dict) -> list[dict]:
    text = str(record.get("abstract") or record.get("text") or "")
    relationships = []
    for intervention in record.get("interventions", []):
        for outcome in record.get("outcomes", []):
            if intervention.lower() in text.lower() and outcome.lower() in text.lower():
                relationships.append(
                    {
                        "title": record.get("title", ""),
                        "intervention": intervention,
                        "outcome": outcome,
                        "confidence_language": record.get("confidence_language", []),
                        "source_url": record.get("source_url", ""),
                    }
                )
    return relationships
