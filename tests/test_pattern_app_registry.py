import json
from pathlib import Path


REGISTRY_PATH = Path("sources/metadata/pattern_app_source_registry.json")


def load_registry() -> dict:
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def test_registry_includes_three_healing_modes() -> None:
    registry = load_registry()
    modes = {source["healing_mode"] for source in registry["sources"]}

    assert "Ayurveda" in modes
    assert "Traditional Chinese Medicine" in modes
    assert "Homeopathy" in modes


def test_registry_sources_have_required_tracking_fields() -> None:
    registry = load_registry()
    required = {
        "source_id",
        "healing_mode",
        "title",
        "canonical_role",
        "source_layer",
        "app_role",
        "priority",
        "known_source_url",
        "local_raw_path",
        "local_outputs",
        "local_file_status",
        "ingestion_status",
        "rights_access_status",
        "next_action",
    }

    for source in registry["sources"]:
        assert required.issubset(source), source["source_id"]


def test_present_raw_files_exist() -> None:
    registry = load_registry()

    for source in registry["sources"]:
        if source["local_file_status"] == "present" and source["local_raw_path"]:
            assert Path(source["local_raw_path"]).exists(), source["source_id"]


def test_p0_coverage_for_each_mode() -> None:
    registry = load_registry()
    p0_by_mode: dict[str, set[str]] = {}
    for source in registry["sources"]:
        if source["priority"] == "P0":
            p0_by_mode.setdefault(source["healing_mode"], set()).add(source["canonical_role"])

    assert {"foundational_theory", "materia_medica"}.issubset(p0_by_mode["Ayurveda"])
    assert {"foundational_theory", "clinical_pattern_text", "materia_medica"}.issubset(
        p0_by_mode["Traditional Chinese Medicine"]
    )
    assert {"foundational_theory", "materia_medica", "repertory"}.issubset(
        p0_by_mode["Homeopathy"]
    )
