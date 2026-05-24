from src.pattern_app_retrieval import (
    build_app_output,
    content_quality_penalty,
    detect_red_flags,
    query_terms,
    read_jsonl,
    render_citation,
    search,
)


def test_render_citation_includes_source_locator() -> None:
    chunk = read_jsonl()[0]
    citation = render_citation(chunk)

    assert citation["citation_id"]
    assert citation["source"]
    assert citation["locator"]
    assert citation["rights_note"]


def test_search_returns_tradition_separated_results() -> None:
    results = search("sleep digestion breath", read_jsonl(), limit_per_tradition=2)

    assert set(results) == {"Ayurveda", "Traditional Chinese Medicine", "Homeopathy"}
    assert all(isinstance(items, list) for items in results.values())


def test_app_output_suppresses_suggestions_for_red_flags() -> None:
    output = build_app_output("chest pain and difficulty breathing with anxiety", read_jsonl())

    assert output["input_summary"]["red_flags_detected"]
    assert "suppressed" in output["cross_tradition_synthesis"]["safety_notes"][0].lower()
    assert output["disclaimer"].startswith("This app is a practitioner-facing")


def test_detect_red_flags() -> None:
    assert "chest pain" in detect_red_flags("client reports chest pain after exertion")


def test_query_terms_remove_intake_boilerplate() -> None:
    terms = query_terms("standard practitioner review compare source relevance sleep digestion")

    assert "sleep" in terms
    assert "digestion" in terms
    assert "standard" not in terms
    assert "practitioner" not in terms
    assert "source" not in terms


def test_query_terms_expand_symptom_typos_and_aliases() -> None:
    constipation_terms = query_terms("consitation")
    fatigue_terms = query_terms("low energy")

    assert "constipation" in constipation_terms
    assert "stool" in constipation_terms
    assert "fatigue" in fatigue_terms
    assert "weakness" in fatigue_terms


def test_daily_symptom_seed_file_has_50_cases() -> None:
    cases = [
        line.strip()
        for line in open("examples/pattern_app_daily_symptoms.txt", encoding="utf-8")
        if line.strip() and not line.strip().startswith("#")
    ]

    assert len(cases) == 50
    assert "consitation" in cases
    assert "headace" in cases


def test_content_quality_penalty_catches_generic_chapter_openers() -> None:
    chunk = {
        "text": "Now we shall discourse on the Chapter which treats of food and drink. Head pain appears later.",
        "section": "",
        "chapter": "",
    }

    assert content_quality_penalty(chunk, {"head", "pain"}) >= 12
