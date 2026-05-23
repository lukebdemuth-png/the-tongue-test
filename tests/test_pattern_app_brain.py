import json
from pathlib import Path

from src.pattern_app_brain import (
    attach_kent_support_to_remedies,
    ayurveda_treatment_directions,
    boericke_remedy_differentials,
    build_brain_trace,
    build_candidates,
    kent_rubric_clusters,
    normalize_features,
    safety_gate,
)


EXAMPLE_INTAKE = Path("examples/intake_sleep_digestion.json")
MEDICATION_CAUTION_INTAKE = Path("examples/intake_medication_caution.json")


def test_brain_trace_includes_core_sections() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    trace = build_brain_trace(intake, limit=1)

    assert trace["brain_stage"] == "trace_prototype_v1"
    assert trace["safety_gate"]["status"] in {"clear", "caution", "suppress"}
    assert set(trace["derived_evaluation_packets"]) >= {"ayurveda", "tcm", "homeopathy"}
    assert trace["normalized_features"]
    assert set(trace["candidates"]) == {"ayurveda", "tcm", "homeopathy"}
    assert trace["practitioner_summary"]["case_snapshot"]
    assert trace["treatment_plan_draft"]["scope"].startswith("Practitioner-review")
    assert trace["practitioner_output"]["schema"] == "schemas/pattern_app_output.schema.json"
    assert trace["practitioner_output"]["cross_tradition_outcome"]["tradition_weighting"]
    assert trace["client_teaching_sequence"]
    assert trace["next_best_question"]
    assert trace["app_output"]["practitioner_review_required"] if "practitioner_review_required" in trace["app_output"] else True


def test_safety_gate_suppresses_red_flags() -> None:
    intake = {
        "symptoms": {"chief_complaint": "chest pain and difficulty breathing"},
        "patient_context": {},
        "tradition_specific_inputs": {},
        "practitioner_notes": "",
    }
    safety = safety_gate(intake)

    assert safety["status"] == "suppress"
    assert "chest pain" in safety["red_flags_detected"]


def test_brain_trace_holds_plan_for_red_flags() -> None:
    intake = {
        "case_id": "red-flag",
        "symptoms": {"chief_complaint": "chest pain and difficulty breathing", "primary_symptoms": ["chest pain"]},
        "patient_context": {},
        "tradition_specific_inputs": {},
        "practitioner_notes": "",
    }
    trace = build_brain_trace(intake, limit=1)

    assert trace["safety_gate"]["status"] == "suppress"
    assert trace["client_teaching_sequence"][0]["step"] == "Safety first"
    for tradition_items in trace["treatment_plan_draft"].values():
        if not isinstance(tradition_items, list):
            continue
        for item in tradition_items:
            assert item["review_priority"] == "hold_until_clarified"


def test_normalize_features_tags_known_dimensions() -> None:
    intake = {
        "symptoms": {"primary_symptoms": ["restless sleep", "bloating", "worse at night"]},
        "tradition_specific_inputs": {},
        "practitioner_notes": "",
    }
    dimensions = {item["dimension"] for item in normalize_features(intake)}

    assert "sleep" in dimensions
    assert "digestion" in dimensions
    assert "timing" in dimensions


def test_boericke_remedy_differentials_include_source_backed_treatment_details() -> None:
    differentials = boericke_remedy_differentials(
        "poor sleep worse at night with bloating, variable appetite, low energy, and digestive discomfort",
        limit=3,
    )

    assert differentials
    first = differentials[0]
    assert first["category"] == "remedy_differential"
    assert first["citations"][0].startswith("homeopathy_boericke-")
    assert first["source_url"].startswith("http")
    assert first["why_this_matches"]
    assert first["text_preview"]
    assert first["confidence_score"] < 85


def test_kent_rubric_clusters_include_repertory_support_when_available() -> None:
    clusters = kent_rubric_clusters("sleep disturbed from hunger, appetite at night, bloating", limit=3)

    if not clusters:
        return
    first = clusters[0]
    assert first["category"] == "rubric_cluster"
    assert first["citations"][0].startswith("homeopathy_kent_repertory-")
    assert first["source_url"].startswith("http")
    assert first["text_preview"]
    assert "WEAKNESS, leg" not in first["direction"]


def test_homeopathy_remedies_can_show_kent_cross_support() -> None:
    query = "sleep disturbed from hunger, appetite at night, bloating"
    rubrics = kent_rubric_clusters(query, limit=20)
    remedies = boericke_remedy_differentials(query, limit=10)
    supported = attach_kent_support_to_remedies(remedies, rubrics)

    assert any(item.get("kent_supporting_rubrics") for item in supported)
    assert all("WEAKNESS, leg" not in rubric["direction"] for rubric in rubrics)


def test_medication_context_adds_contraindication_review_to_plan() -> None:
    intake = json.loads(MEDICATION_CAUTION_INTAKE.read_text(encoding="utf-8"))
    trace = build_brain_trace(intake, limit=1)

    assert trace["safety_gate"]["status"] == "caution"
    assert any(caution["type"] == "blood_thinner" for caution in trace["safety_gate"]["context_cautions"])
    assert not any(caution["type"] == "pregnancy_or_postpartum" for caution in trace["safety_gate"]["context_cautions"])
    plan_items = trace["treatment_plan_draft"]["ayurveda"] + trace["treatment_plan_draft"]["tcm"] + trace["treatment_plan_draft"]["homeopathy"]
    assert any(item["contraindications"] for item in plan_items)


def test_ayurveda_treatment_directions_use_pattern_flags_and_citations() -> None:
    packet = {
        "possible_dosha_flags": ["vata"],
        "agni_flags": ["variable_or_weak_agni"],
        "ama_signs": ["possible_ama"],
        "missing_questions": ["prakriti", "tongue_notes"],
    }
    directions = ayurveda_treatment_directions(
        "poor sleep at night with variable appetite bloating digestion low energy",
        packet,
        "caution",
        [],
    )

    categories = {item["category"] for item in directions}
    assert {"diet", "lifestyle", "herbs", "formulas", "yoga_breath"} <= categories
    assert any("variable_or_weak_agni" in item["matched_case_features"] for item in directions)
    assert all(item["citations"] for item in directions)
    formula = next(item for item in directions if item["category"] == "formulas")
    assert "Hold formula selection" in formula["direction"]


def test_brain_trace_uses_ayurveda_engine_before_generic_categories() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    trace = build_brain_trace(intake, limit=1)
    ayurveda_plan = trace["treatment_plan_draft"]["ayurveda"]

    assert ayurveda_plan
    assert any("Inferred Ayurveda tags" in item["why_this_matches"][0] for item in ayurveda_plan)
    assert any(item["category"] == "herbs" and "Dravyaguna" in item["direction"] for item in ayurveda_plan)


def test_candidates_explain_missing_data_and_score_breakdown() -> None:
    intake = json.loads(EXAMPLE_INTAKE.read_text(encoding="utf-8"))
    trace = build_brain_trace(intake, limit=1)
    ayurveda_candidate = trace["candidates"]["ayurveda"][0]

    assert ayurveda_candidate["missing_key_data"]
    assert "score_breakdown" in ayurveda_candidate
    assert ayurveda_candidate["score_breakdown"]["missing_information_penalty"] > 0
    assert ayurveda_candidate["confidence_rationale"]
    assert ayurveda_candidate["confidence_score"] <= ayurveda_candidate["score_breakdown"]["retrieval_score"]


def test_candidate_contradictions_are_visible_when_case_conflicts_with_source_direction() -> None:
    results = {
        "Ayurveda": [
            {
                "score": 76.0,
                "confidence_label": "likely match, practitioner review required",
                "score_details": {
                    "matched_terms": ["cold"],
                    "symptom_match": 44,
                    "source_authority": 88,
                    "citation_quality": 90,
                    "source_quality_tier": "usable_source_supported",
                },
                "citation": {
                    "citation_id": "ayurveda-test",
                    "locator": "Heat and burning pattern",
                    "source": "Test source",
                },
                "text_preview": "This passage discusses heat, hot signs, burning, and thirst.",
            }
        ]
    }
    candidates = build_candidates(results, "clear", feature_terms={"cold", "chilly"})

    candidate = candidates["Ayurveda"][0]
    assert candidate["contradicting_features"]
    assert candidate["score_breakdown"]["contradiction_penalty"] > 0
