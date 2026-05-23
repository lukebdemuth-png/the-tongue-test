import json
from pathlib import Path

from src.normalize_pattern_chunks import (
    COMBINED_OUTPUT,
    OUTPUT_DIR,
    REQUIRED_CHUNK_FIELDS,
    normalize_all,
)


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def test_normalizer_outputs_required_fields() -> None:
    counts = normalize_all(retrieval_date="2026-05-19")

    assert counts["combined"] > 0
    assert COMBINED_OUTPUT.exists()

    first = read_jsonl(COMBINED_OUTPUT)[0]
    assert set(REQUIRED_CHUNK_FIELDS).issubset(first)
    assert first["source_id"]
    assert first["tradition"] in {"Ayurveda", "Traditional Chinese Medicine", "Homeopathy"}
    assert first["source_access_status"]
    assert first["stable_locator"]


def test_normalizer_writes_per_source_files() -> None:
    counts = normalize_all(retrieval_date="2026-05-19")

    expected_sources = [
        "ayurveda_charaka_samhita_vol1",
        "ayurveda_ashtanga_hridayam",
        "tcm_huangdi_neijing_suwen",
        "homeopathy_organon_fifth_sixth",
    ]
    for source_id in expected_sources:
        path = OUTPUT_DIR / f"{source_id}.jsonl"
        assert path.exists()
        assert len(read_jsonl(path)) == counts[source_id]


def test_normalized_organon_preserves_aphorism_locator() -> None:
    normalize_all(retrieval_date="2026-05-19")
    rows = read_jsonl(OUTPUT_DIR / "homeopathy_organon_fifth_sixth.jsonl")

    first = rows[0]
    assert first["entry_type"] == "aphorism"
    assert first["sutra_or_aphorism"] != "Unknown"
    assert first["stable_locator"].startswith("Aphorism")
