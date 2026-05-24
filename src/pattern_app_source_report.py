"""Report source coverage for the Pattern App canon."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REGISTRY_PATH = Path("sources/metadata/pattern_app_source_registry.json")


def load_registry(path: Path = REGISTRY_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_report(registry: dict[str, Any]) -> dict[str, Any]:
    sources = registry["sources"]
    by_mode: dict[str, Counter[str]] = defaultdict(Counter)
    by_priority: Counter[str] = Counter()
    next_actions = []
    excluded_audit_entries = []

    for source in sources:
        mode = source["healing_mode"]
        status = source["ingestion_status"]
        by_mode[mode][status] += 1
        by_priority[source["priority"]] += 1
        if status != "processed":
            item = {
                "source_id": source["source_id"],
                "mode": mode,
                "priority": source["priority"],
                "status": status,
                "local_file_status": source["local_file_status"],
                "title": source["title"],
                "next_action": source["next_action"],
            }
            if source["next_action"].startswith("No ingestion action"):
                excluded_audit_entries.append(item)
            else:
                next_actions.append(item)

    return {
        "registry_name": registry["registry_name"],
        "last_updated": registry["last_updated"],
        "total_sources": len(sources),
        "ingestion_status_counts": dict(Counter(source["ingestion_status"] for source in sources)),
        "local_file_status_counts": dict(Counter(source["local_file_status"] for source in sources)),
        "priority_counts": dict(by_priority),
        "by_mode": {mode: dict(counts) for mode, counts in by_mode.items()},
        "next_actions": sorted(next_actions, key=lambda item: (item["priority"], item["mode"], item["source_id"])),
        "excluded_audit_entries": sorted(
            excluded_audit_entries, key=lambda item: (item["priority"], item["mode"], item["source_id"])
        ),
    }


def markdown_report(report: dict[str, Any]) -> str:
    lines = [
        f"# {report['registry_name']}",
        "",
        f"- Last updated: {report['last_updated']}",
        f"- Total sources tracked: {report['total_sources']}",
        f"- Ingestion status: {report['ingestion_status_counts']}",
        f"- Local file status: {report['local_file_status_counts']}",
        f"- Priority counts: {report['priority_counts']}",
        "",
        "## Coverage By Mode",
        "",
    ]
    for mode, counts in report["by_mode"].items():
        lines.append(f"- {mode}: {counts}")

    lines.extend(["", "## Next Actions", ""])
    for item in report["next_actions"]:
        lines.append(
            f"- [{item['priority']}] {item['title']} ({item['source_id']}): "
            f"{item['status']}, {item['local_file_status']}. {item['next_action']}"
        )
    lines.extend(["", "## Excluded Audit Entries", ""])
    for item in report["excluded_audit_entries"]:
        lines.append(
            f"- [{item['priority']}] {item['title']} ({item['source_id']}): "
            f"{item['status']}, {item['local_file_status']}. {item['next_action']}"
        )
    return "\n".join(lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Report Pattern App source coverage.")
    parser.add_argument("--registry", type=Path, default=REGISTRY_PATH)
    parser.add_argument("--format", choices=["json", "markdown"], default="markdown")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = build_report(load_registry(args.registry))
    if args.format == "json":
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(markdown_report(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
