"""Validation helpers for Pattern App normalized chunks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


SCHEMA_PATH = Path("schemas/pattern_app_chunk.schema.json")
CHUNKS_PATH = Path("data/chunks/pattern_app_core_chunks.jsonl")


def load_schema(path: Path = SCHEMA_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def iter_jsonl(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if line:
                yield line_number, json.loads(line)


def validate_type(value: Any, expected: Any) -> bool:
    if isinstance(expected, list):
        return any(validate_type(value, item) for item in expected)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "array":
        return isinstance(value, list)
    if expected == "object":
        return isinstance(value, dict)
    if expected == "null":
        return value is None
    return True


def validate_chunk(chunk: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = schema.get("required", [])
    properties = schema.get("properties", {})

    for field in required:
        if field not in chunk:
            errors.append(f"missing required field: {field}")

    if schema.get("additionalProperties") is False:
        allowed = set(properties)
        for field in chunk:
            if field not in allowed:
                errors.append(f"unexpected field: {field}")

    for field, rules in properties.items():
        if field not in chunk:
            continue
        value = chunk[field]
        expected_type = rules.get("type")
        if expected_type and not validate_type(value, expected_type):
            errors.append(f"{field}: expected {expected_type}, got {type(value).__name__}")
            continue
        if isinstance(value, str) and rules.get("minLength") and len(value) < rules["minLength"]:
            errors.append(f"{field}: below minLength {rules['minLength']}")
        if "enum" in rules and value not in rules["enum"]:
            errors.append(f"{field}: {value!r} not in enum {rules['enum']}")
        if isinstance(value, list) and rules.get("items", {}).get("type") == "string":
            bad_items = [item for item in value if not isinstance(item, str)]
            if bad_items:
                errors.append(f"{field}: array contains non-string item")

    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    if isinstance(page_start, int) and isinstance(page_end, int) and page_start > page_end:
        errors.append("page_start cannot be greater than page_end")
    if not str(chunk.get("text", "")).strip():
        errors.append("text is empty")
    return errors


def validate_file(chunks_path: Path = CHUNKS_PATH, schema_path: Path = SCHEMA_PATH) -> list[str]:
    schema = load_schema(schema_path)
    errors: list[str] = []
    for line_number, chunk in iter_jsonl(chunks_path):
        chunk_errors = validate_chunk(chunk, schema)
        for error in chunk_errors:
            errors.append(f"{chunks_path}:{line_number}:{chunk.get('chunk_id', 'unknown')}: {error}")
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Pattern App normalized chunks.")
    parser.add_argument("--chunks", type=Path, default=CHUNKS_PATH)
    parser.add_argument("--schema", type=Path, default=SCHEMA_PATH)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors = validate_file(args.chunks, args.schema)
    if errors:
        for error in errors[:100]:
            print(error)
        if len(errors) > 100:
            print(f"... {len(errors) - 100} more errors")
        return 1
    print(f"OK: {args.chunks}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
