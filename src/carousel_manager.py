"""ChatGPT Carousel Manager.

Small local CLI for storing carousel style locks, slide states, rejection logs,
and generating strict copy/paste-ready ChatGPT image edit prompts.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_STORE = Path("carousel_data/carousels.json")
DEFAULT_REJECTION_RULES = [
    "changed layout",
    "changed font",
    "changed art style",
    "moved text",
    "added icons",
    "altered face",
    "changed background",
    "added plants",
    "moved sacred geometry",
    "resized typography unintentionally",
    "changed spacing globally",
    "redesigned composition instead of editing",
    "confused duplicate text layers",
    "altered art when only text edits were requested",
    "created Instagram crop failures",
    "blended source-image roles incorrectly",
]
STYLE_FIELDS = [
    "background_style",
    "color_palette",
    "lighting",
    "texture",
    "text_style",
    "spacing",
    "logo_rule",
    "forbidden_changes",
    "safe_margins",
]
FORMAT_SIZES = {
    "car_size": "1080 x 1350",
    "story": "1080 x 1920",
}
FORMAT_ALIASES = {
    "car": "car_size",
    "carousel": "car_size",
    "ig_carousel": "car_size",
    "car_size": "car_size",
    "story": "story",
    "stories": "story",
    "ig_story": "story",
}


def normalize_format(value: str | None) -> str:
    if not value:
        return "car_size"
    normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
    return FORMAT_ALIASES.get(normalized, normalized)


def format_size(value: str | None) -> str:
    return FORMAT_SIZES.get(normalize_format(value), FORMAT_SIZES["car_size"])

def load_store(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"carousels": {}}
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_store(path: Path, store: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(store, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def get_carousel(store: dict[str, Any], name: str) -> dict[str, Any]:
    carousels = store.setdefault("carousels", {})
    if name not in carousels:
        carousels[name] = {
            "name": name,
            "format": "car_size",
            "master_locked_style": {},
            "slides": {},
            "rejection_log": list(DEFAULT_REJECTION_RULES),
        }
    return carousels[name]


def get_slide(carousel: dict[str, Any], slide_number: str) -> dict[str, Any]:
    slides = carousel.setdefault("slides", {})
    if slide_number not in slides:
        slides[slide_number] = {
            "approved": "",
            "must_stay_unchanged": "",
            "rejected": [],
            "next_requested_change": "",
            "editable_elements": "",
            "locked_elements": "",
        }
    return slides[slide_number]


def split_items(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split("|") if item.strip()]


def merge_unique(existing: list[str], new_items: list[str]) -> list[str]:
    merged = list(existing)
    normalized = {item.lower() for item in merged}
    for item in new_items:
        if item.lower() not in normalized:
            merged.append(item)
            normalized.add(item.lower())
    return merged


def style_lines(style: dict[str, str]) -> list[str]:
    lines: list[str] = []
    for field_name in STYLE_FIELDS:
        value = style.get(field_name, "").strip()
        if value:
            label = field_name.replace("_", " ").title()
            lines.append(f"- {label}: {value}")
    return lines


def rejection_lines(carousel: dict[str, Any], slide: dict[str, Any]) -> list[str]:
    merged = merge_unique(
        carousel.get("rejection_log", []),
        slide.get("rejected", []),
    )
    return [f"- Do not repeat: {item}." for item in merged]


def build_prompt(
    carousel: dict[str, Any],
    slide_number: str,
    change: str,
    is_new_slide: bool = False,
    must_stay: str = "",
) -> str:
    slide = get_slide(carousel, slide_number)
    style = carousel.get("master_locked_style", {})
    carousel_format = normalize_format(carousel.get("format"))
    canvas_size = format_size(carousel_format)
    approved = slide.get("approved", "").strip()
    locked = slide.get("locked_elements", "").strip()
    editable = slide.get("editable_elements", "").strip()
    unchanged = slide.get("must_stay_unchanged", "").strip()
    must_stay_text = must_stay.strip() or unchanged or locked or "all approved elements"

    mode = "NEW SLIDE LOCK" if is_new_slide else "IMAGE EDIT LOCK"
    source_line = (
        "Use the approved carousel style and prior slides as the exact visual reference."
        if is_new_slide
        else "Use the uploaded image as the exact source image."
    )

    lines = [
        f"CHATGPT {mode}:",
        f"Carousel: {carousel.get('name', '')}",
        f"Slide: {slide_number}",
        "You are continuing an existing Instagram carousel.",
        "You are not redesigning it.",
        f"Canvas format: {carousel_format} ({canvas_size}).",
        "Generate exactly ONE standalone image for this slide only.",
        "Do not create a grid, contact sheet, collage, multi-image preview, or grouped set of stills.",
        "The output must be downloadable as one individual still image.",
        "Slide 1 is the master template for layout, spacing, sacred geometry, typography hierarchy, color palette, lighting, rendering style, crop framing, visual density, and subject proportions.",
        source_line,
        f"Only change: {change.strip()}",
        f"Must stay identical: {must_stay_text}",
    ]

    if approved:
        lines.append(f"Current approved image state: {approved}")
    if locked:
        lines.append(f"Locked elements: {locked}")
    if editable:
        lines.append(f"Editable elements: {editable}")

    style_block = style_lines(style)
    if style_block:
        lines.append("")
        lines.append("MASTER LOCKED STYLE:")
        lines.extend(style_block)

    lines.extend(
        [
            "",
            "CONSISTENCY LOCK ACTIVE:",
            "- Preserve template.",
            "- Preserve geometry.",
            "- Preserve spacing.",
            "- Preserve typography hierarchy.",
            "- Preserve art style.",
            "- Preserve lighting.",
            "- Preserve Instagram-safe margins.",
            f"- Preserve {canvas_size} canvas size.",
            "- Preserve visual balance.",
            "- Preserve character scale.",
            "- Preserve sacred geometry proportions.",
            "- Preserve educational hierarchy.",
            "- Preserve single-slide output.",
            "",
            "DO NOT CHANGE:",
            "- Do not change background.",
            "- Do not change art style.",
            "- Do not change color palette.",
            "- Do not change lighting.",
            "- Do not change texture.",
            "- Do not change text placement.",
            "- Do not change font style.",
            "- Do not change typography scale unless explicitly requested.",
            "- Do not change layout.",
            "- Do not change spacing.",
            "- Do not move sacred geometry.",
            "- Do not resize sacred geometry.",
            "- Do not alter crop framing.",
            f"- Do not change canvas size from {canvas_size}.",
            "- Do not place critical text near top, bottom, or side edges.",
            "- Do not confuse duplicate text layers; preserve primary headline unless the request explicitly targets it.",
            "- Do not add icons.",
            "- Do not add plants.",
            "- Do not alter faces.",
            "- Do not blend source-image roles; use each source only for its stated purpose.",
            "- Do not output multiple slides in one image.",
            "- Do not combine several stills into one file.",
            "- Do not create a preview grid.",
        ]
    )
    lines.extend(rejection_lines(carousel, slide))
    lines.extend(
        [
            "",
            "All text must remain safely inside Instagram crop margins.",
            f"Canvas must remain exactly {canvas_size}.",
            "Sacred geometry should support the pose, not dominate it.",
            "Do not improve, redesign, reinterpret, rebalance, or make creative upgrades.",
            "This is a surgical edit only.",
        ]
    )
    return "\n".join(lines).strip()


def build_memory_card(carousel: dict[str, Any], slide_number: str, instruction: str = "") -> str:
    slide = get_slide(carousel, slide_number)
    style = carousel.get("master_locked_style", {})
    lines = [
        "CAROUSEL MEMORY CARD:",
        f"Carousel name: {carousel.get('name', '')}",
        f"Slide number: {slide_number}",
        "Approved style:",
        f"Canvas format: {normalize_format(carousel.get('format'))} ({format_size(carousel.get('format'))})",
    ]
    style_block = style_lines(style)
    lines.extend(style_block or ["- Not set yet."])
    lines.extend(
        [
            f"Locked elements: {slide.get('locked_elements', '') or slide.get('must_stay_unchanged', '') or 'All approved elements.'}",
            f"Editable elements: {slide.get('editable_elements', '') or 'Only the requested change.'}",
            f"Current approved state: {slide.get('approved', '') or 'Not recorded yet.'}",
            f"Exact current instruction: {instruction or slide.get('next_requested_change', '') or 'No current instruction recorded.'}",
            "Warning: Slide 1 is the master template. Do not reinterpret, improve, redesign, rebalance, or change approved elements.",
        ]
    )
    return "\n".join(lines).strip()


def print_output(text: str, output_path: Path | None = None) -> None:
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(text + "\n", encoding="utf-8")
    print(text)


def cmd_init(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    if args.format:
        carousel["format"] = normalize_format(args.format)
    style = carousel.setdefault("master_locked_style", {})
    for field_name in STYLE_FIELDS:
        value = getattr(args, field_name, None)
        if value:
            style[field_name] = value
    save_store(args.store, store)
    print(f"Carousel ready: {args.carousel}")
    return 0


def cmd_style(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    updated = False
    if args.format:
        carousel["format"] = normalize_format(args.format)
        updated = True
    style = carousel.setdefault("master_locked_style", {})
    for field_name in STYLE_FIELDS:
        value = getattr(args, field_name, None)
        if value is not None:
            style[field_name] = value
            updated = True
    save_store(args.store, store)
    print("Updated master locked style." if updated else "No style fields provided.")
    return 0


def cmd_slide(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    slide = get_slide(carousel, args.slide)
    for field_name in [
        "approved",
        "must_stay_unchanged",
        "next_requested_change",
        "editable_elements",
        "locked_elements",
    ]:
        value = getattr(args, field_name, None)
        if value is not None:
            slide[field_name] = value
    if args.rejected:
        slide["rejected"] = merge_unique(slide.get("rejected", []), split_items(args.rejected))
        carousel["rejection_log"] = merge_unique(carousel.get("rejection_log", []), split_items(args.rejected))
    save_store(args.store, store)
    print(f"Updated slide {args.slide} for carousel: {args.carousel}")
    return 0


def cmd_reject(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    items = split_items(args.mistake)
    carousel["rejection_log"] = merge_unique(carousel.get("rejection_log", []), items)
    if args.slide:
        slide = get_slide(carousel, args.slide)
        slide["rejected"] = merge_unique(slide.get("rejected", []), items)
    save_store(args.store, store)
    print("Updated rejection log.")
    return 0


def cmd_prompt(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    slide = get_slide(carousel, args.slide)
    if args.change:
        slide["next_requested_change"] = args.change
    change = args.change or slide.get("next_requested_change", "")
    if not change:
        raise SystemExit("No change provided. Use --change or set slide next_requested_change.")
    prompt = build_prompt(
        carousel=carousel,
        slide_number=args.slide,
        change=change,
        is_new_slide=args.new_slide,
        must_stay=args.must_stay or "",
    )
    save_store(args.store, store)
    print_output(prompt, args.output)
    return 0


def cmd_card(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel = get_carousel(store, args.carousel)
    card = build_memory_card(carousel, args.slide, instruction=args.instruction or "")
    print_output(card, args.output)
    return 0


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{prompt}{suffix}: ").strip()
    return value or default


def yes_no(prompt: str, default: bool = False) -> bool:
    default_text = "y" if default else "n"
    value = ask(f"{prompt} (y/n)", default_text).lower()
    return value.startswith("y")


def cmd_wizard(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    carousel_name = args.carousel or ask("Carousel name")
    slide_number = args.slide or ask("Slide number")
    carousel = get_carousel(store, carousel_name)
    carousel["format"] = normalize_format(
        ask("Format: car size (1080 x 1350) or story (1080 x 1920)", carousel.get("format", "car_size"))
    )
    slide = get_slide(carousel, slide_number)

    print("\nSLIDE CONSISTENCY CHECKLIST")
    is_new = yes_no("Is this a new slide", False)
    change = ask("What is the only thing allowed to change", slide.get("next_requested_change", ""))
    must_stay = ask("What must stay identical", slide.get("must_stay_unchanged", ""))
    art_style = ask("Is the same art style being preserved", "yes")
    person_pose = ask("Is the same person/pose style being preserved", "yes")
    text_zones = ask("Are text zones locked", "yes")
    approved = ask("Current approved state", slide.get("approved", ""))
    locked = ask("Locked elements", slide.get("locked_elements", must_stay))
    editable = ask("Editable elements", slide.get("editable_elements", "only the requested change"))

    slide["approved"] = approved
    slide["must_stay_unchanged"] = must_stay
    slide["next_requested_change"] = change
    slide["locked_elements"] = locked
    slide["editable_elements"] = editable

    checklist_note = (
        f"Checklist: new_slide={is_new}; same_art_style={art_style}; "
        f"same_person_pose={person_pose}; text_zones_locked={text_zones}."
    )
    prompt = build_prompt(carousel, slide_number, change, is_new_slide=is_new, must_stay=must_stay)
    prompt = f"{prompt}\n\n{checklist_note}"
    save_store(args.store, store)
    print_output(prompt, args.output)
    return 0


def add_store_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--store", type=Path, default=DEFAULT_STORE, help="Path to carousel JSON store.")


def add_style_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--format", choices=["car_size", "car", "carousel", "ig_carousel", "story", "stories", "ig_story"])
    parser.add_argument("--background-style")
    parser.add_argument("--color-palette")
    parser.add_argument("--lighting")
    parser.add_argument("--texture")
    parser.add_argument("--text-style")
    parser.add_argument("--spacing")
    parser.add_argument("--logo-rule")
    parser.add_argument("--forbidden-changes")
    parser.add_argument("--safe-margins")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ChatGPT Carousel Manager")
    add_store_arg(parser)
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="Create or initialize a carousel.")
    init_parser.add_argument("--carousel", required=True)
    add_style_args(init_parser)
    init_parser.set_defaults(func=cmd_init)

    style_parser = subparsers.add_parser("style", help="Update master locked style.")
    style_parser.add_argument("--carousel", required=True)
    add_style_args(style_parser)
    style_parser.set_defaults(func=cmd_style)

    slide_parser = subparsers.add_parser("slide", help="Update current approved state for a slide.")
    slide_parser.add_argument("--carousel", required=True)
    slide_parser.add_argument("--slide", required=True)
    slide_parser.add_argument("--approved")
    slide_parser.add_argument("--must-stay-unchanged")
    slide_parser.add_argument("--rejected", help="Pipe-separated rejection items.")
    slide_parser.add_argument("--next-requested-change")
    slide_parser.add_argument("--editable-elements")
    slide_parser.add_argument("--locked-elements")
    slide_parser.set_defaults(func=cmd_slide)

    reject_parser = subparsers.add_parser("reject", help="Add a rejection mistake to future do-not-repeat rules.")
    reject_parser.add_argument("--carousel", required=True)
    reject_parser.add_argument("--slide")
    reject_parser.add_argument("--mistake", required=True, help="Pipe-separated mistake list.")
    reject_parser.set_defaults(func=cmd_reject)

    prompt_parser = subparsers.add_parser("prompt", help="Generate a locked ChatGPT edit prompt.")
    prompt_parser.add_argument("--carousel", required=True)
    prompt_parser.add_argument("--slide", required=True)
    prompt_parser.add_argument("--change")
    prompt_parser.add_argument("--must-stay")
    prompt_parser.add_argument("--new-slide", action="store_true")
    prompt_parser.add_argument("--output", type=Path)
    prompt_parser.set_defaults(func=cmd_prompt)

    card_parser = subparsers.add_parser("card", help="Generate a carousel memory card.")
    card_parser.add_argument("--carousel", required=True)
    card_parser.add_argument("--slide", required=True)
    card_parser.add_argument("--instruction")
    card_parser.add_argument("--output", type=Path)
    card_parser.set_defaults(func=cmd_card)

    wizard_parser = subparsers.add_parser("wizard", help="Interactive checklist and prompt builder.")
    wizard_parser.add_argument("--carousel")
    wizard_parser.add_argument("--slide")
    wizard_parser.add_argument("--output", type=Path)
    wizard_parser.set_defaults(func=cmd_wizard)

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
