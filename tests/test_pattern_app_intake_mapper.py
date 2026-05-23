import json
from pathlib import Path

from src.pattern_app_intake_mapper import build_tradition_evaluation_packets


EXAMPLE_INTAKE = Path("examples/intake_sleep_digestion.json")


def test_mapper_autofills_three_tradition_packets_from_one_intake() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    packets = build_tradition_evaluation_packets(intake)

    assert packets["source"] == "unified_practitioner_intake"
    assert set(packets) >= {"ayurveda", "tcm", "homeopathy"}
    assert packets["ayurveda"]["autofilled_from_main_intake"] is True
    assert packets["tcm"]["autofilled_from_main_intake"] is True
    assert packets["homeopathy"]["autofilled_from_main_intake"] is True


def test_mapper_derives_tradition_specific_hints_without_extra_forms() -> None:
    intake = {
        "symptoms": {
            "chief_complaint": "Poor sleep with bloating",
            "primary_symptoms": ["insomnia", "bloating"],
            "secondary_symptoms": ["low energy"],
            "worse_from": ["worse at night"],
            "digestion": "variable appetite with gas and bloating",
            "sleep": "waking at night",
            "energy": "low morning energy",
        },
        "patient_context": {"current_medications": [], "pregnancy_status": ""},
        "tradition_specific_inputs": {},
        "practitioner_notes": "",
    }
    packets = build_tradition_evaluation_packets(intake)

    assert "vata" in packets["ayurveda"]["possible_dosha_flags"]
    assert "spleen_qi_or_damp_tendency" in packets["tcm"]["possible_pattern_flags"]
    assert "sleep_rubrics" in packets["homeopathy"]["possible_rubric_flags"]
    assert "worse at night" in packets["homeopathy"]["modalities"]
