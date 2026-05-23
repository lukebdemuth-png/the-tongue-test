"""Build Pattern App output from a structured practitioner intake JSON file."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.pattern_app_retrieval import build_app_output, read_jsonl


def collect_strings(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        strings: list[str] = []
        for item in value:
            strings.extend(collect_strings(item))
        return strings
    if isinstance(value, dict):
        strings = []
        for item in value.values():
            strings.extend(collect_strings(item))
        return strings
    return []


def intake_to_query(intake: dict[str, Any]) -> str:
    """Flatten clinically relevant intake fields into a retrieval query."""
    sections = [
        intake.get("symptoms", {}),
        intake.get("tradition_specific_inputs", {}),
        {"practitioner_notes": intake.get("practitioner_notes", "")},
    ]
    return " ".join(collect_strings(sections))


def summarize_input(intake: dict[str, Any], detected_red_flags: list[str]) -> dict[str, Any]:
    symptoms = intake.get("symptoms", {})
    context = intake.get("patient_context", {})
    missing = []
    if not context.get("current_medications"):
        missing.append("current_medications")
    if not context.get("pregnancy_status"):
        missing.append("pregnancy_status")
    for field in ["duration", "severity"]:
        if not symptoms.get(field):
            missing.append(field)

    return {
        "primary_symptoms": symptoms.get("primary_symptoms", []),
        "secondary_symptoms": symptoms.get("secondary_symptoms", []),
        "duration": symptoms.get("duration", ""),
        "severity": symptoms.get("severity", ""),
        "constitution_context": intake.get("tradition_specific_inputs", {}).get("ayurveda", {}).get("prakriti", ""),
        "red_flags_detected": detected_red_flags,
        "missing_information": missing,
    }


def build_output_from_intake(intake: dict[str, Any], chunks_path: Path, limit: int) -> dict[str, Any]:
    query = intake_to_query(intake)
    output = build_app_output(query, read_jsonl(chunks_path), limit_per_tradition=limit)
    output["case_id"] = intake.get("case_id", "")
    output["input_summary"] = summarize_input(intake, output["input_summary"]["red_flags_detected"])
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Pattern App retrieval from a practitioner intake JSON file.")
    parser.add_argument("intake", type=Path)
    parser.add_argument("--chunks", type=Path, default=Path("data/chunks/pattern_app_core_chunks.jsonl"))
    parser.add_argument("--limit", type=int, default=3)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    intake = json.loads(args.intake.read_text(encoding="utf-8"))
    output = build_output_from_intake(intake, args.chunks, args.limit)
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
