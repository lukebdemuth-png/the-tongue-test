from src.pattern_app_source_report import build_report, load_registry, markdown_report


def test_source_report_summarizes_registry_status() -> None:
    report = build_report(load_registry())

    assert report["total_sources"] >= 15
    assert report["ingestion_status_counts"]["processed"] >= 1
    assert "Ayurveda" in report["by_mode"]
    assert "Traditional Chinese Medicine" in report["by_mode"]
    assert "Homeopathy" in report["by_mode"]


def test_source_report_lists_unprocessed_next_actions() -> None:
    report = build_report(load_registry())
    actions = report["next_actions"]

    assert actions
    assert all("next_action" in action for action in actions)
    assert any(action["status"] == "missing_source" for action in actions)


def test_source_report_markdown_is_readable() -> None:
    report = build_report(load_registry())
    rendered = markdown_report(report)

    assert "# Pattern App Core Source Registry" in rendered
    assert "## Coverage By Mode" in rendered
    assert "## Next Actions" in rendered
