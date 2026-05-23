from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES_DIR = ROOT / "sources"
METADATA_DIR = SOURCES_DIR / "metadata"

SOURCE_FOLDERS = [
    "classical",
    "journals",
    "case_studies",
    "lectures",
    "transcripts",
    "qigong",
    "tcm",
    "ayurveda",
    "intake_forms",
    "metadata",
]

FOCUS_SEARCH_TERMS = [
    "Ayurveda case report",
    "constitutional medicine",
    "TCM syndrome differentiation",
    "pattern differentiation",
    "integrative medicine reasoning",
    "qigong clinical trial",
    "yoga therapy case study",
    "whole systems medicine",
    "practitioner reasoning",
    "differential diagnosis",
]

DEFAULT_USER_AGENT = "HolisticResearchIngestion/0.1 (open-access metadata research)"

CANONICAL_TRADITIONS = [
    "Ayurveda",
    "Yoga",
    "TCM",
    "Qigong",
    "Homeopathy",
    "Integrative medicine",
]

TRADITION_ALIASES = {
    "traditional chinese medicine": "TCM",
    "classical homeopathy": "Homeopathy",
    "integrative medicine": "Integrative medicine",
    "integrative": "Integrative medicine",
}
