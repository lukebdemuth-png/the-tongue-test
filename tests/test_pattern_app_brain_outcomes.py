from src.pattern_app_brain import build_brain_trace


def minimal_intake(*symptoms: str) -> dict:
    return {
        "case_id": "test-outcome",
        "patient_context": {
            "age_range": "adult",
            "known_conditions": [],
            "current_medications": ["unknown"],
            "allergies": [],
            "clinical_setting": "practitioner research review",
        },
        "symptoms": {
            "chief_complaint": " ".join(symptoms),
            "primary_symptoms": list(symptoms),
            "secondary_symptoms": [],
            "duration": "several days",
            "severity": "moderate",
            "better_from": [],
            "worse_from": [],
            "time_patterns": [],
            "temperature_patterns": [],
            "digestion": "",
            "sleep": "",
            "energy": "",
            "mood": "",
            "pain_location": "",
            "pain_quality": "",
        },
        "tradition_specific_inputs": {
            "ayurveda": {},
            "tcm": {},
            "homeopathy": {},
        },
        "practitioner_notes": "",
        "requested_output_depth": "standard",
    }


def rich_stress_digestion_sleep_intake() -> dict:
    intake = minimal_intake("bloating", "trouble sleeping", "headace", "stress")
    intake["patient_context"]["current_medications"] = ["none"]
    intake["symptoms"].update(
        {
            "duration": "2 weeks",
            "severity": "moderate",
            "worse_from": ["stress"],
            "time_patterns": ["wakes at 3am", "low afternoon"],
            "temperature_patterns": ["cold hands", "flushed when stressed"],
            "digestion": "bloating after meals, worse with stress",
            "sleep": "hard to fall asleep and wakes at 3am",
            "energy": "low afternoon",
            "mood": "stressed and irritable",
            "pain_location": "head and neck",
            "pain_quality": "tension",
        }
    )
    return intake


def test_single_word_symptoms_generate_practical_outcome_layer() -> None:
    trace = build_brain_trace(minimal_intake("low energy", "headace"), limit=1)
    output = trace["practical_output"]

    assert output["confidence"]["label"] == "first-pass pattern direction"
    assert "Low energy looks most useful" in output["likely_pattern_summary"]["plain_language_summary"]
    assert "Headache becomes more useful" in output["likely_pattern_summary"]["plain_language_summary"]
    directions = output["likely_pattern_summary"]["tradition_directions"]

    assert any(item["tradition"] == "Ayurveda" and "available Ayurveda canon" in item["direction"] for item in directions)
    assert any(item["tradition"] == "Traditional Chinese Medicine" and "Huangdi Neijing" in item["direction"] for item in directions)
    assert any(item["tradition"] == "Homeopathy" and "Boericke" in item["direction"] for item in directions)

    actions = " ".join(item["practitioner_action"] for item in output["lifestyle_diet_practice_actions"])
    review_items = " ".join(item["practitioner_action"] for item in output["herbs_formulas_remedies_to_consider"])

    assert "Log energy at waking" in actions
    assert "Create a headache map" in actions
    assert "Herb/formula exploration depends" in review_items
    assert "Homeopathy repertory review" in review_items
    assert all("tradition" in item and "citations" in item for item in output["lifestyle_diet_practice_actions"][:3])


def test_symptom_outcome_questions_are_specific() -> None:
    trace = build_brain_trace(minimal_intake("bloating"), limit=1)
    questions = trace["practical_output"]["questions_still_needed"]

    assert any("bloating worse after meals" in question for question in questions)
    assert any("belching, gas, pain" in question for question in questions)


def test_new_top_symptoms_get_generic_book_backed_outcomes() -> None:
    trace = build_brain_trace(minimal_intake("palpitations", "acne", "back pain"), limit=1)
    output = trace["practical_output"]

    assert "Back pain becomes useful" in output["likely_pattern_summary"]["plain_language_summary"]
    assert "Acne becomes useful" in output["likely_pattern_summary"]["plain_language_summary"]
    assert output["likely_pattern_summary"]["tradition_directions"]
    assert output["lifestyle_diet_practice_actions"]
    assert all(item["direction"] for item in output["lifestyle_diet_practice_actions"][:3])


def test_sparse_inputs_generate_twenty_outcomes_per_category() -> None:
    sparse_cases = [
        minimal_intake("low energy"),
        minimal_intake("headace"),
        minimal_intake("consitation"),
        minimal_intake("stress"),
        minimal_intake("trouble sleeping"),
        minimal_intake("weird cloudy feeling"),
    ]
    expected_categories = {
        "diet",
        "herbs_formulas_remedies",
        "lifestyle_practices",
        "sleep_recovery",
        "movement_body",
        "breathwork_meditation",
        "avoid_reduce",
        "practitioner_follow_up",
        "tracking",
        "questions_refinement",
        "additional_insights",
        "source_basis",
    }

    for intake in sparse_cases:
        trace = build_brain_trace(intake, limit=1)
        outcomes = trace["practical_output"]["stepwise_outcome"]["category_outcomes"]

        assert set(outcomes) == expected_categories
        assert all(len(items) == 20 for items in outcomes.values())
        assert all(items[0] for items in outcomes.values())


def test_expanded_outcomes_do_not_show_placeholder_language() -> None:
    trace = build_brain_trace(minimal_intake("bloating", "trouble sleeping", "headace", "stress"), limit=1)
    stepwise = trace["practical_output"]["stepwise_outcome"]
    forbidden = [
        "placeholder",
        "still missing",
        "missing source",
        "missing/not",
        "not ingested",
        "not ready",
        "still needed",
        "temporary source",
        "temporary placeholder",
        "missing source layer",
        "needed before",
    ]

    assert stepwise["missing_source_notes"] == []
    for items in stepwise["category_outcomes"].values():
        for item in items:
            lowered = item.lower()
            assert not any(term in lowered for term in forbidden)


def test_source_basis_includes_researched_working_books() -> None:
    trace = build_brain_trace(minimal_intake("bloating", "trouble sleeping", "headace", "stress"), limit=1)
    source_basis = " ".join(trace["practical_output"]["stepwise_outcome"]["category_outcomes"]["source_basis"])

    for expected in [
        "Bensky",
        "John K. Chen",
        "Formulas and Strategies",
        "Vasant Lad Textbook of Ayurveda Vol. 2",
        "Vasant Lad Textbook of Ayurveda Vol. 3",
        "Sebastian Pole",
        "Robert Svoboda",
        "Roger Morrison",
        "Robin Murphy",
        "George Vithoulkas",
        "Rajan Sankaran",
        "Roger van Zandvoort",
        "Andrew Chevallier",
        "Anne McIntyre",
        "Organon of the Medical Art",
    ]:
        assert expected in source_basis


def test_rich_case_outputs_are_not_source_padding() -> None:
    trace = build_brain_trace(rich_stress_digestion_sleep_intake(), limit=1)
    outcomes = trace["practical_output"]["stepwise_outcome"]["category_outcomes"]

    for category, items in outcomes.items():
        if category == "source_basis":
            continue
        joined = " ".join(items)
        assert "Source lane:" not in joined
        assert "working source lane" not in joined
        assert "Useful but uncategorized" not in joined
        assert "Pattern signal worth keeping" not in joined
        assert "Refinement pass" not in joined


def test_rich_case_has_tradition_specific_practical_material() -> None:
    trace = build_brain_trace(rich_stress_digestion_sleep_intake(), limit=1)
    outcomes = trace["practical_output"]["stepwise_outcome"]["category_outcomes"]

    diet = " ".join(outcomes["diet"])
    herbs = " ".join(outcomes["herbs_formulas_remedies"])
    sleep = " ".join(outcomes["sleep_recovery"])
    follow_up = " ".join(outcomes["practitioner_follow_up"])
    insights = " ".join(outcomes["additional_insights"])

    assert "Ayurveda" in diet and "Chinese medicine" in diet and "Homeopathy" in diet
    assert "triphala" in herbs
    assert "Xiao Yao San" in herbs
    assert "Nux vomica" in herbs
    assert "Lycopodium" in herbs
    assert "Coffea" in sleep
    assert "shen" in sleep
    assert "vata" in sleep
    assert "Ayurveda next question" in follow_up
    assert "Chinese medicine next question" in follow_up
    assert "Homeopathy next question" in follow_up
    assert "Cross-tradition overlap" in insights
