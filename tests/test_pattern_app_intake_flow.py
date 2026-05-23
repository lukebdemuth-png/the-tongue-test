from src.pattern_app_intake_flow import build_progressive_intake_state


def test_progressive_intake_allows_first_pass_after_minimum_fields() -> None:
    intake = {
        "patient_context": {"current_medications": ["none"], "pregnancy_status": "not pregnant"},
        "symptoms": {
            "chief_complaint": "Poor sleep",
            "primary_symptoms": ["insomnia"],
            "duration": "two weeks",
            "severity": "moderate",
        },
    }
    safety = {"status": "caution"}
    state = build_progressive_intake_state(intake, safety, "What makes it better or worse?")

    assert state["minimum_complete"] is True
    assert state["can_generate_first_pass"] is True
    assert state["stage"] == "first_pass_ready_needs_depth"
    assert "modalities" in state["deepening_missing"]


def test_progressive_intake_suppresses_first_pass_for_red_flags() -> None:
    state = build_progressive_intake_state(
        {"patient_context": {}, "symptoms": {"chief_complaint": "chest pain"}},
        {"status": "suppress"},
        "Has urgent medical evaluation ruled this out?",
    )

    assert state["stage"] == "safety_referral_first"
    assert state["can_generate_first_pass"] is False
    assert state["can_generate_treatment_categories"] is False
