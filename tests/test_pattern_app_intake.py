import json
from pathlib import Path

from src.pattern_app_intake import build_output_from_intake, intake_to_query


EXAMPLE_INTAKE = Path("examples/intake_sleep_digestion.json")
CHUNKS_PATH = Path("data/chunks/pattern_app_core_chunks.jsonl")


def test_intake_to_query_uses_symptoms_and_notes() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    query = intake_to_query(intake)

    assert "sleep disturbance" in query
    assert "digestive discomfort" in query
    assert "Compare traditional source relevance" in query


def test_build_output_from_intake_preserves_case_and_summary() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    output = build_output_from_intake(intake, CHUNKS_PATH, limit=1)

    assert output["case_id"] == "example-sleep-digestion"
    assert output["input_summary"]["primary_symptoms"] == ["sleep disturbance", "digestive discomfort"]
    assert output["input_summary"]["duration"] == "several weeks"
    assert output["input_summary"]["severity"] == "moderate"
    assert output["ayurveda_analysis"]["practitioner_review_required"] is True
    assert output["citations"]
