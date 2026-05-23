"""Deterministic Instagram carousel composer.

Use ChatGPT for illustration/art if desired, then use this local renderer for
final text, sacred geometry, spacing, crop safety, and one-PNG-per-slide export.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont


FORMATS = {
    "car_size": (1080, 1350),
    "car": (1080, 1350),
    "carousel": (1080, 1350),
    "story": (1080, 1920),
    "ig_story": (1080, 1920),
}

DEFAULT_FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
DEFAULT_OUTPUT_DIR = Path("carousel_exports")
DEFAULT_PALETTE = {
    "background": "#f5efe3",
    "background_alt": "#eadfcf",
    "text": "#2e2922",
    "muted_text": "#6f6253",
    "gold": "#b99243",
    "soft_gold": "#d9bd73",
    "white": "#fffaf0",
}


def load_config(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def hex_color(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise ValueError(f"Expected 6-digit hex color, got {value!r}")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def palette(config: dict[str, Any]) -> dict[str, str]:
    merged = dict(DEFAULT_PALETTE)
    merged.update(config.get("palette", {}))
    return merged


def canvas_size(format_name: str) -> tuple[int, int]:
    try:
        return FORMATS[format_name]
    except KeyError as exc:
        raise ValueError(f"Unknown format {format_name!r}. Use car_size or story.") from exc


def font(size: int, font_path: str | None = None) -> ImageFont.FreeTypeFont:
    path = Path(font_path) if font_path else DEFAULT_FONT
    return ImageFont.truetype(str(path), size=size)


def text_size(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.ImageFont) -> tuple[int, int]:
    if not text:
        return 0, 0
    bbox = draw.textbbox((0, 0), text, font=text_font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = " ".join(current + [word])
        width, _ = text_size(draw, candidate, text_font)
        if current and width > max_width:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines or [""]


def cover_image(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image = image.convert("RGB")
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((math.ceil(image.width * scale), math.ceil(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def make_background(size: tuple[int, int], colors: dict[str, str]) -> Image.Image:
    width, height = size
    base = Image.new("RGB", size, hex_color(colors["background"]))
    draw = ImageDraw.Draw(base)
    alt = hex_color(colors["background_alt"])
    for y in range(height):
        ratio = y / max(height - 1, 1)
        r0, g0, b0 = hex_color(colors["background"])
        r = int(r0 * (1 - ratio) + alt[0] * ratio)
        g = int(g0 * (1 - ratio) + alt[1] * ratio)
        b = int(b0 * (1 - ratio) + alt[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return base.filter(ImageFilter.GaussianBlur(radius=0.2))


def place_background(canvas: Image.Image, background_path: str | None, opacity: float = 0.9) -> Image.Image:
    if not background_path:
        return canvas
    background = cover_image(Image.open(background_path), canvas.size)
    if opacity < 1:
        canvas = Image.blend(canvas, background, opacity)
    else:
        canvas = background
    return canvas


def draw_sacred_geometry(draw: ImageDraw.ImageDraw, size: tuple[int, int], colors: dict[str, str]) -> None:
    width, height = size
    gold = hex_color(colors["gold"])
    soft_gold = hex_color(colors["soft_gold"])
    center = (width // 2, int(height * 0.45))
    radii = [205, 275, 345]
    for index, radius in enumerate(radii):
        color = gold if index == 1 else soft_gold
        line_width = 4 if index == 1 else 2
        bbox = [
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius,
        ]
        draw.ellipse(bbox, outline=color, width=line_width)

    small_radius = 74
    orbit = 275
    for step in range(6):
        angle = math.tau * step / 6
        x = center[0] + int(math.cos(angle) * orbit)
        y = center[1] + int(math.sin(angle) * orbit)
        draw.ellipse(
            [x - small_radius, y - small_radius, x + small_radius, y + small_radius],
            outline=soft_gold,
            width=2,
        )


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    max_width: int,
    text_font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    line_gap: int = 12,
) -> int:
    lines = wrap_text(draw, text, text_font, max_width)
    for line in lines:
        line_width, line_height = text_size(draw, line, text_font)
        draw.text(((1080 - line_width) // 2, y), line, font=text_font, fill=fill)
        y += line_height + line_gap
    return y


def draw_body_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    x: int,
    y: int,
    max_width: int,
    text_font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    line_gap: int = 16,
) -> int:
    for line in lines:
        wrapped = wrap_text(draw, line, text_font, max_width)
        for wrapped_line in wrapped:
            draw.text((x, y), wrapped_line, font=text_font, fill=fill)
            _, line_height = text_size(draw, wrapped_line, text_font)
            y += line_height + line_gap
    return y


def draw_markers(
    draw: ImageDraw.ImageDraw,
    markers: list[str],
    y: int,
    colors: dict[str, str],
    marker_font: ImageFont.ImageFont,
) -> None:
    if not markers:
        return
    gold = hex_color(colors["gold"])
    text_fill = hex_color(colors["text"])
    count = len(markers)
    gap = 34
    diameter = 76
    total_width = count * diameter + (count - 1) * gap
    x = (1080 - total_width) // 2
    for marker in markers:
        draw.ellipse([x, y, x + diameter, y + diameter], outline=gold, width=4)
        label = "✓" if marker.lower() in {"check", "checkmark", "✓"} else marker
        label_width, label_height = text_size(draw, label, marker_font)
        draw.text(
            (x + (diameter - label_width) // 2, y + (diameter - label_height) // 2 - 4),
            label,
            font=marker_font,
            fill=text_fill,
        )
        x += diameter + gap


def draw_safe_margin(draw: ImageDraw.ImageDraw, size: tuple[int, int], margin: int, colors: dict[str, str]) -> None:
    gold = hex_color(colors["soft_gold"])
    width, height = size
    draw.rectangle([margin, margin, width - margin, height - margin], outline=gold, width=1)


def render_slide(config: dict[str, Any], slide: dict[str, Any], output_path: Path) -> Path:
    fmt = slide.get("format") or config.get("format", "car_size")
    size = canvas_size(fmt)
    colors = palette(config)
    safe_margin = int(config.get("safe_margin", 96))
    font_path = config.get("font_path")

    canvas = make_background(size, colors)
    canvas = place_background(
        canvas,
        slide.get("background_image") or config.get("background_image"),
        float(slide.get("background_opacity", config.get("background_opacity", 0.72))),
    )
    overlay = Image.new("RGBA", size, (255, 250, 240, int(255 * float(config.get("wash_opacity", 0.18)))))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(canvas)

    if slide.get("sacred_geometry", config.get("sacred_geometry", True)):
        draw_sacred_geometry(draw, size, colors)

    text_fill = hex_color(colors["text"])
    muted_fill = hex_color(colors["muted_text"])
    title_font = font(int(slide.get("title_size", config.get("title_size", 82))), font_path)
    subtitle_font = font(int(slide.get("subtitle_size", config.get("subtitle_size", 38))), font_path)
    body_font = font(int(slide.get("body_size", config.get("body_size", 34))), font_path)
    footer_font = font(int(slide.get("footer_size", config.get("footer_size", 26))), font_path)
    marker_font = font(int(slide.get("marker_size", config.get("marker_size", 42))), font_path)

    y = int(slide.get("title_y", config.get("title_y", safe_margin + 42)))
    if slide.get("eyebrow"):
        y = draw_centered_text(draw, slide["eyebrow"], y, size[0] - safe_margin * 2, footer_font, muted_fill, 8)
        y += 8
    if slide.get("title"):
        y = draw_centered_text(draw, slide["title"], y, size[0] - safe_margin * 2, title_font, text_fill, 10)
    if slide.get("subtitle"):
        y += 14
        draw_centered_text(draw, slide["subtitle"], y, size[0] - safe_margin * 2, subtitle_font, muted_fill, 10)

    body_lines = slide.get("body_lines", [])
    if body_lines:
        body_y = int(slide.get("body_y", config.get("body_y", int(size[1] * 0.69))))
        draw_body_lines(
            draw,
            body_lines,
            safe_margin,
            body_y,
            size[0] - safe_margin * 2,
            body_font,
            text_fill,
            int(config.get("body_line_gap", 18)),
        )

    markers = [str(marker) for marker in slide.get("markers", [])]
    if markers:
        draw_markers(draw, markers, int(slide.get("markers_y", config.get("markers_y", size[1] - 190))), colors, marker_font)

    if slide.get("footer"):
        footer_text = slide["footer"]
        footer_width, footer_height = text_size(draw, footer_text, footer_font)
        draw.text(
            ((size[0] - footer_width) // 2, size[1] - safe_margin - footer_height),
            footer_text,
            font=footer_font,
            fill=muted_fill,
        )

    if config.get("debug_safe_margin", False):
        draw_safe_margin(draw, size, safe_margin, colors)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG", optimize=True)
    return output_path


def render_config(config: dict[str, Any]) -> list[Path]:
    output_dir = Path(config.get("output_dir", DEFAULT_OUTPUT_DIR))
    carousel_name = config.get("carousel_name", "carousel")
    safe_name = "".join(char.lower() if char.isalnum() else "_" for char in carousel_name).strip("_")
    output_dir = output_dir / safe_name
    outputs: list[Path] = []
    for index, slide in enumerate(config.get("slides", []), start=1):
        slide_number = int(slide.get("slide_number", index))
        output_path = output_dir / f"slide_{slide_number:02d}.png"
        outputs.append(render_slide(config, slide, output_path))
    return outputs


def sample_config() -> dict[str, Any]:
    return {
        "carousel_name": "example_yoga_carousel",
        "format": "car_size",
        "output_dir": "carousel_exports",
        "safe_margin": 96,
        "sacred_geometry": True,
        "palette": DEFAULT_PALETTE,
        "slides": [
            {
                "slide_number": 1,
                "eyebrow": "HIP OPENING SERIES",
                "title": "Cow Face Pose",
                "subtitle": "Stabilize first, soften second",
                "body_lines": [
                    "Contain the pelvis before chasing range.",
                    "Let the breath locate the diaphragm.",
                    "Keep the chest open without forcing the shoulders."
                ],
                "markers": ["1", "2", "3"],
                "footer": "Practitioner education • not medical advice"
            }
        ]
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render deterministic Instagram carousel stills.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    render_parser = subparsers.add_parser("render", help="Render PNG slides from a JSON config.")
    render_parser.add_argument("--config", type=Path, required=True)

    sample_parser = subparsers.add_parser("sample", help="Write a sample JSON config.")
    sample_parser.add_argument("--output", type=Path, default=Path("carousel_composer.example.json"))

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "sample":
        args.output.write_text(json.dumps(sample_config(), indent=2) + "\n", encoding="utf-8")
        print(args.output)
        return 0
    if args.command == "render":
        outputs = render_config(load_config(args.config))
        for output in outputs:
            print(output)
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
