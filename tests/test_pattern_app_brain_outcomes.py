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


def test_single_word_symptoms_generate_practical_outcome_layer() -> None:
    trace = build_brain_trace(minimal_intake("low energy", "headace"), limit=1)
    output = trace["practical_output"]

    assert output["confidence"]["label"] == "first-pass practical guidance, practitioner review required"
    assert "Low energy is a broad signal" in output["likely_pattern_summary"]["plain_language_summary"]
    assert "Headache needs safety screening first" in output["likely_pattern_summary"]["plain_language_summary"]
    directions = output["likely_pattern_summary"]["tradition_directions"]

    assert any(item["tradition"] == "Ayurveda" and "available Ayurveda canon" in item["direction"] for item in directions)
    assert any(item["tradition"] == "Traditional Chinese Medicine" and "Huangdi Neijing" in item["direction"] for item in directions)
    assert any(item["tradition"] == "Homeopathy" and "Boericke" in item["direction"] for item in directions)

    actions = " ".join(item["practitioner_action"] for item in output["lifestyle_diet_practice_actions"])
    review_items = " ".join(item["practitioner_action"] for item in output["herbs_formulas_remedies_to_consider"])

    assert "Track whether energy drops after meals" in actions
    assert "Do not treat traditionally first if headache is sudden" in actions
    assert "Herbs or formulas should stay on hold" in review_items
    assert "Homeopathic remedy review should focus on modalities" in review_items
    assert all("tradition" in item and "citations" in item for item in output["lifestyle_diet_practice_actions"][:3])


def test_symptom_outcome_questions_are_specific() -> None:
    trace = build_brain_trace(minimal_intake("bloating"), limit=1)
    questions = trace["practical_output"]["questions_still_needed"]

    assert any("bloating worse after meals" in question for question in questions)
    assert any("belching, gas, pain" in question for question in questions)


def test_new_top_symptoms_get_generic_book_backed_outcomes() -> None:
    trace = build_brain_trace(minimal_intake("palpitations", "acne", "back pain"), limit=1)
    output = trace["practical_output"]

    assert "Palpitations first-pass outcome" in output["likely_pattern_summary"]["plain_language_summary"]
    assert "Skin Acne first-pass outcome" in output["likely_pattern_summary"]["plain_language_summary"]
    assert output["likely_pattern_summary"]["tradition_directions"]
    assert output["lifestyle_diet_practice_actions"]
    assert all(item["direction"] for item in output["lifestyle_diet_practice_actions"][:3])
