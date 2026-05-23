from src.pattern_app_retrieval import (
    build_app_output,
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
