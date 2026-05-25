"""Run repeatable single-symptom Pattern App tests into local folders."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.pattern_app_brain import build_brain_trace


DEFAULT_OUTPUT_ROOT = Path("private_sources/pattern_app_test_runs")
DEFAULT_SYMPTOMS = ["symptoms", "constipation", "low energy", "headache"]
DEFAULT_SYMPTOMS_FILE = Path("examples/pattern_app_daily_symptoms.txt")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "case"


def build_minimal_intake(symptom: str, case_id: str) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "patient_context": {
            "age_range": "",
            "sex": "",
            "pregnancy_status": "",
            "known_conditions": [],
            "current_medications": [],
            "allergies": [],
            "clinical_setting": "prototype single-symptom test",
        },
        "symptoms": {
            "chief_complaint": symptom,
            "primary_symptoms": [symptom],
            "secondary_symptoms": [],
            "duration": "",
            "onset": "",
            "severity": "",
            "frequency": "",
            "better_from": [],
            "worse_from": [],
            "time_patterns": [],
            "temperature_patterns": [],
            "digestion": symptom if symptom in {"constipation", "low energy"} else "",
            "sleep": "",
            "energy": symptom if symptom == "low energy" else "",
            "mood": "",
            "pain_location": "head" if symptom == "headache" else "",
            "pain_quality": "",
        },
        "tradition_specific_inputs": {
            "ayurveda": {
                "prakriti": "",
                "vikriti": "",
                "agni": "",
                "ama_signs": [],
                "bowel_pattern": "constipation" if symptom == "constipation" else "",
                "tongue_notes": "",
                "pulse_notes": "",
            },
            "tcm": {
                "tongue": "",
                "pulse": "",
                "temperature": "",
                "sweating": "",
                "thirst": "",
                "appetite": "",
                "bowel_urine": "constipation" if symptom == "constipation" else "",
                "emotional_pattern": "",
            },
            "homeopathy": {
                "modalities": [],
                "mental_emotional_state": "",
                "generals": [symptom] if symptom == "low energy" else [],
                "peculiar_symptoms": [],
                "food_cravings_aversions": [],
                "thermal_state": "",
            },
        },
        "practitioner_notes": "Single-symptom production-style test. Minimal context intentionally provided.",
        "requested_output_depth": "standard",
    }


def compact_candidate(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "direction": candidate.get("candidate_name", ""),
        "confidence_score": candidate.get("confidence_score", 0),
        "confidence_label": candidate.get("confidence_label", ""),
        "matched_features": candidate.get("matched_features", []),
        "missing_key_data": candidate.get("missing_key_data", []),
        "citations": candidate.get("supporting_citations", []),
    }


def production_view(trace: dict[str, Any]) -> dict[str, Any]:
    candidates = trace.get("candidates", {})
    normalized_symptoms = [
        item
        for item in trace.get("normalized_features", [])
        if item.get("source") == "symptom_normalizer"
    ]
    return {
        "case_id": trace.get("case_id", ""),
        "input": trace.get("practitioner_summary", {}).get("case_snapshot", ""),
        "status": "prototype production-style output",
        "safety": trace.get("safety_gate", {}),
        "normalized_symptoms": normalized_symptoms,
        "likely_pattern_summary": trace.get("practical_output", {}).get("likely_pattern_summary", {}),
        "confidence": trace.get("practical_output", {}).get("confidence", {}),
        "next_best_question": trace.get("next_best_question", ""),
        "tradition_results": {
            "ayurveda": [compact_candidate(item) for item in candidates.get("ayurveda", [])[:3]],
            "tcm": [compact_candidate(item) for item in candidates.get("tcm", [])[:3]],
            "homeopathy": [compact_candidate(item) for item in candidates.get("homeopathy", [])[:3]],
        },
        "practical_output": trace.get("practical_output", {}),
        "warnings": trace.get("practical_output", {}).get("warnings_and_professional_boundaries", []),
        "cited_source_references": trace.get("practical_output", {}).get("cited_source_references", []),
        "prototype_warning": trace.get("prototype_warning", ""),
    }


def render_preview(output: dict[str, Any]) -> str:
    practical = output.get("practical_output", {})
    actions = practical.get("lifestyle_diet_practice_actions", [])
    next_actions = practical.get("herbs_formulas_remedies_to_consider", [])
    lines = [
        f"# {output['input'].title()}",
        "",
        "## App Preview",
        "",
        f"**Status:** {output['status']}",
        f"**Confidence:** {output['confidence'].get('score', 0)} - {output['confidence'].get('label', 'insufficient evidence')}",
        f"**Next question:** {output['next_best_question']}",
        "",
        "## Likely Pattern Summary",
        "",
    ]
    summary = output.get("likely_pattern_summary", {})
    for direction in summary.get("tradition_directions", []):
        lines.append(
            f"- {direction.get('tradition', '').upper()}: {direction.get('direction', '')} "
            f"({direction.get('confidence_score', 0)}, {direction.get('priority', '')})"
        )
    if not summary.get("tradition_directions"):
        lines.append("- No tradition-specific direction matched strongly enough yet.")

    lines.extend(["", "## Do First", ""])
    if actions:
        for item in actions[:5]:
            lines.append(f"- **{item.get('category', 'action').replace('_', ' ').title()}**: {item.get('practitioner_action') or item.get('direction')}")
    else:
        lines.append("- No practical actions generated yet.")

    lines.extend(["", "## Explore Next", ""])
    if next_actions:
        for item in next_actions[:2]:
            lines.append(f"- **{item.get('category', 'review').replace('_', ' ').title()}**: {item.get('practitioner_action') or item.get('direction')}")
    else:
        lines.append("- No tradition-specific explore-next items generated yet.")

    lines.extend(["", "## Questions Still Needed", ""])
    for item in output.get("practical_output", {}).get("questions_still_needed", [])[:8]:
        lines.append(f"- {item}")

    lines.extend(["", "## Source References", ""])
    for citation in output.get("cited_source_references", [])[:8]:
        label = citation.get("label") or citation.get("source") or citation.get("citation_id", "source")
        lines.append(f"- {label}")

    lines.extend(["", "## Prototype Note", "", output.get("prototype_warning", "")])
    return "\n".join(lines).strip() + "\n"


def render_practitioner_view(output: dict[str, Any]) -> str:
    safety = output.get("safety", {})
    practical = output.get("practical_output", {})
    summary = output.get("likely_pattern_summary", {})
    tradition_results = output.get("tradition_results", {})

    lines = [
        f"# Practitioner View: {output['input'].title()}",
        "",
        "## 1. Safety First",
        "",
        f"- Safety status: {safety.get('status', 'unknown')}",
        f"- Red flags detected: {', '.join(safety.get('red_flags_detected', [])) or 'None from this minimal intake'}",
    ]
    for note in safety.get("notes", []):
        lines.append(f"- {note}")
    for caution in safety.get("context_cautions", []):
        lines.append(f"- {caution.get('note', '')}")

    lines.extend(
        [
            "",
            "## 2. Intake Snapshot",
            "",
            f"- Chief input: {output['input']}",
            "- Intake depth: single-symptom test with intentionally minimal context",
            f"- Missing safety/context fields: {', '.join(safety.get('missing_safety_context', [])) or 'None listed'}",
        ]
    )
    for item in output.get("normalized_symptoms", []):
        original = item.get("original", output["input"])
        canonical = item.get("feature", "")
        if original != canonical:
            lines.append(f"- Normalized symptom: `{original}` -> `{canonical}`")
        else:
            lines.append(f"- Normalized symptom: `{canonical}`")

    lines.extend(
        [
            "",
            "## 3. Overall Confidence",
            "",
            f"- Score: {output['confidence'].get('score', 0)}",
            f"- Label: {output['confidence'].get('label', 'insufficient evidence')}",
            f"- Basis: {output['confidence'].get('basis', '')}",
            "",
            "## 4. Top Tradition Directions",
            "",
        ]
    )

    directions = summary.get("tradition_directions", [])
    if directions:
        for item in directions:
            lines.append(
                f"- {item.get('tradition', '').upper()}: {item.get('direction', '')} "
                f"| confidence {item.get('confidence_score', 0)} | {item.get('priority', '')}"
            )
    else:
        lines.append("- No source-supported direction ranked high enough for practitioner use yet.")

    lines.extend(["", "## 5. Tradition Detail", ""])
    for tradition in ["ayurveda", "tcm", "homeopathy"]:
        lines.append(f"### {tradition.upper()}")
        rows = tradition_results.get(tradition, [])
        if not rows:
            lines.append("- No match returned.")
            lines.append("")
            continue
        for index, row in enumerate(rows[:3], start=1):
            lines.append(f"{index}. {row.get('direction', '')}")
            lines.append(f"   - Confidence: {row.get('confidence_score', 0)} ({row.get('confidence_label', '')})")
            lines.append(f"   - Matched features: {', '.join(row.get('matched_features', [])) or 'None'}")
            lines.append(f"   - Missing data: {', '.join(row.get('missing_key_data', [])[:8]) or 'None'}")
            lines.append(f"   - Citations: {', '.join(row.get('citations', [])) or 'None'}")
        lines.append("")

    lines.extend(["## 6. Questions To Ask Next", ""])
    lines.append(f"- First question: {output.get('next_best_question', '')}")
    for item in practical.get("questions_still_needed", [])[:10]:
        if item != output.get("next_best_question"):
            lines.append(f"- {item}")

    lines.extend(["", "## 7. Practical Review Categories", ""])
    category_sections = [
        ("Herbs / Formulas / Remedies To Consider", "herbs_formulas_remedies_to_consider"),
        ("Lifestyle / Diet / Practice Actions", "lifestyle_diet_practice_actions"),
    ]
    for title, key in category_sections:
        lines.append(f"### {title}")
        values = practical.get(key, [])
        if not values:
            lines.append("- None yet. Needs more intake detail.")
        else:
            for value in values[:8]:
                if isinstance(value, dict):
                    text = value.get("direction") or value.get("practitioner_action") or str(value)
                    lines.append(f"- {text}")
                else:
                    lines.append(f"- {value}")
        lines.append("")

    lines.extend(["## 8. Warnings / Boundaries", ""])
    for warning in output.get("warnings", [])[:12]:
        lines.append(f"- {warning}")

    lines.extend(["", "## 9. Sources", ""])
    citations = output.get("cited_source_references", [])
    if citations:
        for citation in citations[:12]:
            label = citation.get("label") or citation.get("source") or citation.get("citation_id", "source")
            lines.append(f"- {label}")
    else:
        lines.append("- No citations returned.")

    lines.extend(
        [
            "",
            "## 10. Practitioner Note",
            "",
            "This single-word case is useful for testing retrieval behavior, but it is not enough for a real pattern interpretation. The app should keep the output cautious and ask targeted follow-up questions before showing stronger recommendations.",
        ]
    )
    return "\n".join(lines).strip() + "\n"


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run single-symptom Pattern App tests.")
    parser.add_argument("symptoms", nargs="*", default=[])
    parser.add_argument("--symptoms-file", type=Path, help="Newline-delimited symptoms to run as a batch.")
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    args = parser.parse_args()

    symptoms = args.symptoms
    if args.symptoms_file:
        symptoms = [
            line.strip()
            for line in args.symptoms_file.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
    elif not symptoms and DEFAULT_SYMPTOMS_FILE.exists():
        symptoms = [
            line.strip()
            for line in DEFAULT_SYMPTOMS_FILE.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
    elif not symptoms:
        symptoms = DEFAULT_SYMPTOMS

    run_id = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = args.output_root / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    index: list[dict[str, Any]] = []
    for position, symptom in enumerate(symptoms, start=1):
        normalized = symptom.strip().lower()
        case_id = f"single-word-{position:03d}-{slugify(normalized)}"
        intake = build_minimal_intake(normalized, case_id)
        trace = build_brain_trace(intake)
        output = production_view(trace)
        case_dir = run_dir / f"{position:02d}-{slugify(normalized)}"
        case_dir.mkdir(parents=True, exist_ok=True)
        write_json(case_dir / "input.json", intake)
        write_json(case_dir / "brain_trace.json", trace)
        write_json(case_dir / "production_output.json", output)
        (case_dir / "app_preview.md").write_text(render_preview(output), encoding="utf-8")
        (case_dir / "practitioner_view.md").write_text(render_practitioner_view(output), encoding="utf-8")
        index.append(
            {
                "case_id": case_id,
                "input": normalized,
                "folder": str(case_dir),
                "confidence": output["confidence"],
                "next_best_question": output["next_best_question"],
            }
        )

    write_json(run_dir / "index.json", {"run_id": run_id, "case_count": len(index), "cases": index})
    (run_dir / "README.md").write_text(
        "# Pattern App Single-Symptom Test Run\n\n"
        f"Run ID: `{run_id}`\n\n"
        "This folder contains local production-style prototype outputs for single-symptom test cases.\n"
        "Each case includes `input.json`, `brain_trace.json`, `production_output.json`, and `app_preview.md`.\n",
        encoding="utf-8",
    )
    print(run_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
