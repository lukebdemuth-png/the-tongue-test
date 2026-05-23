from src.pattern_app_validate import CHUNKS_PATH, SCHEMA_PATH, validate_file


def test_pattern_app_core_chunks_validate_against_schema() -> None:
    assert not validate_file(CHUNKS_PATH, SCHEMA_PATH)
