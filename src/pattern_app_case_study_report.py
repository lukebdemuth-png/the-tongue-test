"""Summarize case-study evidence coverage for the Pattern App brain."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


RECORDS_PATH = Path("sources/metadata/pubmed_case_reasoning/records.jsonl")
REPORT_PATH = Path("sources/metadata/pubmed_case_reasoning/case_study_evidence_report.md")
TARGET_TRADITIONS = ["Ayurveda", "TCM", "Homeopathy"]


NEEDED_CASE_STUDY_TYPES = {
    "Ayurveda": [
        "digestive/agni/ama presentations",
        "skin conditions with dosha and srotas reasoning",
        "pain and musculoskeletal cases",
        "metabolic/endocrine cases",
        "respiratory/allergy cases",
        "mental health/sleep/stress cases",
        "reproductive/menstrual cases",
        "clear treatment rationale with diet, lifestyle, herbs, procedures, and follow-up",
    ],
    "TCM": [
        "syndrome differentiation cases with tongue/pulse/signs",
        "formula-selection cases",
        "acupuncture/moxibustion cases with pattern rationale",
        "pain and musculoskeletal cases",
        "digestive and metabolic cases",
        "respiratory/allergy cases",
        "mental health/sleep/stress cases",
        "cases that separate excess/deficiency, hot/cold, damp/dry, qi/blood/fluid",
    ],
    "Homeopathy": [
        "individualized remedy case reports",
        "case series with remedy differentiating symptoms",
        "cases with repertory rubrics and materia medica confirmation",
        "physical pathology cases",
        "mental/emotional and constitutional cases",
        "follow-up cases showing remedy response, aggravation, change of remedy, or no response",
        "case reports using HOM-CASE or similar reporting guidance",
    ],
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def record_traditions(record: dict[str, Any]) -> list[str]:
    traditions = record.get("tradition") or []
    if isinstance(traditions, str):
        traditions = [traditions]
    return traditions or ["Unclassified"]


def is_case_record(record: dict[str, Any]) -> bool:
    text = " ".join(
        [
            record.get("title", ""),
            record.get("abstract", ""),
            " ".join(record.get("tags", [])),
            " ".join(record.get("publication_types", [])),
        ]
    ).lower()
    return any(marker in text for marker in ["case report", "case study", "case series", "clinical case"])


def build_report(records: list[dict[str, Any]]) -> dict[str, Any]:
    by_tradition: dict[str, list[dict[str, Any]]] = defaultdict(list)
    tag_counts = Counter()
    pmc_counts = Counter()

    for record in records:
        for tag in record.get("tags", []):
            tag_counts[tag] += 1
        for tradition in record_traditions(record):
            by_tradition[tradition].append(record)
            if record.get("identifiers", {}).get("pmcid"):
                pmc_counts[tradition] += 1

    tradition_summary = {}
    for tradition, rows in sorted(by_tradition.items()):
        cases = [row for row in rows if is_case_record(row)]
        tradition_summary[tradition] = {
            "records": len(rows),
            "case_like_records": len(cases),
            "open_access_pmc_records": pmc_counts[tradition],
            "samples": [
                {
                    "title": row.get("title", ""),
                    "source_url": row.get("source_url", ""),
                    "pmid": row.get("identifiers", {}).get("pmid", ""),
                    "pmcid": row.get("identifiers", {}).get("pmcid", ""),
                }
                for row in cases[:12]
            ],
        }

    return {
        "total_records": len(records),
        "total_case_like_records": sum(1 for record in records if is_case_record(record)),
        "tag_counts": dict(tag_counts.most_common(30)),
        "tradition_summary": tradition_summary,
        "needed_case_study_types": NEEDED_CASE_STUDY_TYPES,
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Case Study Evidence Report",
        "",
        "This report summarizes open biomedical-indexed case-study evidence currently gathered for the Pattern App brain.",
        "",
        f"- Total records: {report['total_records']}",
        f"- Case-like records: {report['total_case_like_records']}",
        "",
        "## Tradition Coverage",
        "",
    ]
    for tradition, summary in report["tradition_summary"].items():
        lines.extend(
            [
                f"### {tradition}",
                "",
                f"- Records: {summary['records']}",
                f"- Case-like records: {summary['case_like_records']}",
                f"- Open-access PMC records: {summary['open_access_pmc_records']}",
                "",
            ]
        )
        if summary["samples"]:
            lines.append("Representative records:")
            for sample in summary["samples"]:
                locator = sample["pmcid"] or sample["pmid"] or sample["source_url"]
                lines.append(f"- {sample['title']} ({locator})")
            lines.append("")

    lines.extend(["## Case Study Types Still Needed", ""])
    for tradition in TARGET_TRADITIONS:
        lines.append(f"### {tradition}")
        lines.append("")
        for item in report["needed_case_study_types"][tradition]:
            lines.append(f"- {item}")
        lines.append("")

    lines.extend(
        [
            "## Brain-Building Use",
            "",
            "Use case studies to train and test:",
            "",
            "- symptom-to-pattern extraction",
            "- pattern-to-treatment-category mapping",
            "- intervention rationale extraction",
            "- outcome and follow-up tracking",
            "- contradiction detection",
            "- confidence penalties for missing information",
            "- next-best-question selection",
            "",
            "Case studies should not override classical source hierarchy. They are a clinical reasoning and outcome layer.",
            "",
        ]
    )
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize Pattern App case-study evidence coverage.")
    parser.add_argument("--records", type=Path, default=RECORDS_PATH)
    parser.add_argument("--output", type=Path, default=REPORT_PATH)
    parser.add_argument("--print", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = build_report(read_jsonl(args.records))
    rendered = render_markdown(report)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered + "\n", encoding="utf-8")
    if args.print:
        print(rendered)
    else:
        print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
