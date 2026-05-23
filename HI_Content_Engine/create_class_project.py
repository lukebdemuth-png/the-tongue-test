#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import textwrap
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib import error, request

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


STOPWORDS = {
    "about",
    "again",
    "also",
    "always",
    "around",
    "because",
    "being",
    "breath",
    "breathe",
    "breathing",
    "could",
    "every",
    "first",
    "from",
    "going",
    "into",
    "just",
    "maybe",
    "might",
    "more",
    "most",
    "notice",
    "other",
    "really",
    "right",
    "still",
    "than",
    "that",
    "their",
    "there",
    "these",
    "those",
    "through",
    "today",
    "under",
    "until",
    "using",
    "very",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
    "would",
    "your",
    "youre",
    "this",
    "have",
    "will",
    "they",
    "them",
    "then",
    "here",
    "lets",
    "take",
    "feel",
    "stay",
    "keep",
    "teacher",
    "class",
    "practice",
    "state",
    "building",
}

BODY_TERMS = [
    "spine",
    "ribcage",
    "ribs",
    "pelvis",
    "hips",
    "shoulders",
    "shoulder",
    "neck",
    "jaw",
    "belly",
    "diaphragm",
    "chest",
    "sternum",
    "throat",
    "seat",
    "base",
]

DIRECTORY_MAP = {
    "01_Source": [],
    "02_Transcript": ["full_transcript.txt"],
    "03_Extraction": [
        "core_themes.md",
        "quotes.md",
        "practices.md",
        "visual_opportunities.md",
    ],
    "04_Carousels": [
        "carousel_1_infographic.md",
        "carousel_2_practice_checklist.md",
        "carousel_3_photo_hero.md",
    ],
    "05_Reels": ["reel_script.md", "text_overlays.md", "caption.md"],
    "06_Stories": ["story_frames.md"],
    "07_PDF": ["free_lead_magnet.md"],
    "08_Thumbnails": ["youtube_titles.md", "visual_directions.md"],
    "09_Stills": ["still_headlines.md"],
    "10_Final": [],
}


@dataclass
class ProjectContext:
    title: str
    teacher: str
    theme: list[str]
    transcript: str
    transcript_path: Path
    created_at: str
    root_dir: Path
    class_dir: Path
    use_llm: bool
    model: str
    content_source: str = "heuristic"


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"-{2,}", "-", value).strip("-") or "untitled-class"


def clean_transcript(transcript: str) -> str:
    return (
        transcript.replace("\r", "\n")
        .replace("\t", " ")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def split_sentences(transcript: str) -> list[str]:
    merged = normalize_whitespace(
        re.sub(r"\b\d{1,2}:\d{2}(?::\d{2})?\b", " ", clean_transcript(transcript))
    )
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", merged) if len(s.strip()) > 35]


def sentence_words(sentence: str) -> list[str]:
    return [
        token
        for token in re.sub(r"[^a-z0-9\s-]", " ", sentence.lower()).split()
        if token
    ]


def trim_text(text: str, max_chars: int) -> str:
    compact = normalize_whitespace(text)
    if len(compact) <= max_chars:
        return compact
    return compact[: max_chars - 1].rstrip() + "…"


def unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            output.append(value)
    return output


def extract_keywords(sentences: list[str], provided_theme: list[str]) -> list[str]:
    counter: Counter[str] = Counter()
    for sentence in sentences:
        for word in sentence_words(sentence):
            if len(word) < 4 or word in STOPWORDS:
                continue
            counter[word] += 1
    combined = [word.replace("-", " ").title() for word, _ in counter.most_common(10)]
    return unique([theme.strip().title() for theme in provided_theme if theme.strip()] + combined)[:8]


def match_sentences(sentences: list[str], patterns: list[str], limit: int = 1) -> list[str]:
    matches = []
    lowered = [pattern.lower() for pattern in patterns]
    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(pattern in sentence_lower for pattern in lowered):
            matches.append(sentence)
        if len(matches) >= limit:
            break
    return matches


def top_quotes(sentences: list[str], keywords: list[str], limit: int = 6) -> list[str]:
    ranked = []
    lowered_keywords = [keyword.lower() for keyword in keywords]
    for sentence in sentences:
        hits = sum(1 for keyword in lowered_keywords if keyword in sentence.lower())
        if hits:
            ranked.append((hits, len(sentence), sentence))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return unique([sentence for _, _, sentence in ranked])[:limit]


def needs_review(value: str | None = None) -> str:
    return value if value else "needs review"


def heuristics_content(context: ProjectContext) -> dict[str, Any]:
    sentences = split_sentences(context.transcript)
    keywords = extract_keywords(sentences, context.theme)
    quotes = top_quotes(sentences, keywords)
    body_terms = [term for term in BODY_TERMS if term in context.transcript.lower()]
    theme_summary = [
        {
            "title": keywords[0] if keywords else "Primary Theme",
            "summary": trim_text(quotes[0], 160) if quotes else needs_review(),
            "transcript_support": quotes[0] if quotes else needs_review(),
        },
        {
            "title": keywords[1] if len(keywords) > 1 else "Breath Awareness",
            "summary": trim_text(
                match_sentences(sentences, ["inhale", "exhale", "breath"], 1)[0]
                if match_sentences(sentences, ["inhale", "exhale", "breath"], 1)
                else "",
                160,
            )
            or needs_review(),
            "transcript_support": (
                match_sentences(sentences, ["inhale", "exhale", "breath"], 1)[0]
                if match_sentences(sentences, ["inhale", "exhale", "breath"], 1)
                else needs_review()
            ),
        },
        {
            "title": keywords[2] if len(keywords) > 2 else "Steady Posture",
            "summary": trim_text(
                match_sentences(sentences, ["posture", "pelvis", "sternum", "spine"], 1)[0]
                if match_sentences(sentences, ["posture", "pelvis", "sternum", "spine"], 1)
                else "",
                160,
            )
            or needs_review(),
            "transcript_support": (
                match_sentences(sentences, ["posture", "pelvis", "sternum", "spine"], 1)[0]
                if match_sentences(sentences, ["posture", "pelvis", "sternum", "spine"], 1)
                else needs_review()
            ),
        },
    ]

    practices = unique(
        [
            *match_sentences(sentences, ["inhale", "length"], 1),
            *match_sentences(sentences, ["exhale", "soften"], 1),
            *match_sentences(sentences, ["pelvis", "ground"], 1),
            *match_sentences(sentences, ["jaw", "throat", "shoulder"], 1),
        ]
    )
    while len(practices) < 4:
        practices.append(needs_review())

    infographic_sentence = (
        match_sentences(sentences, ["ribcage", "spine", "sternum", "pelvis", "diaphragm"], 1)[0]
        if match_sentences(sentences, ["ribcage", "spine", "sternum", "pelvis", "diaphragm"], 1)
        else needs_review()
    )
    hero_sentence = quotes[0] if quotes else needs_review()
    checklist_sentence = practices[0] if practices else needs_review()

    return {
        "keywords": keywords,
        "core_themes": theme_summary,
        "quotes": quotes or [needs_review()],
        "practices": [
            {
                "name": "Breath-led setup",
                "steps": [trim_text(practices[0], 110), trim_text(practices[1], 110)],
                "notes": "Keep the language calm and specific. Mark any unsupported detail as needs review.",
            },
            {
                "name": "Posture refinement",
                "steps": [trim_text(practices[2], 110), trim_text(practices[3], 110)],
                "notes": "Useful for teaching notes, carousel checklists, or class recap copy.",
            },
        ],
        "visual_opportunities": [
            {
                "type": "Infographic / anatomy",
                "focus": infographic_sentence,
                "design_notes": "Use deep green, warm cream, and Himalayan Institute orange #CF6F1A.",
            },
            {
                "type": "Checklist",
                "focus": checklist_sentence,
                "design_notes": "Keep each checklist line under two lines and easy to paste into Canva.",
            },
            {
                "type": "Hero photo / text",
                "focus": hero_sentence,
                "design_notes": "Quiet photo, grounded posture, generous negative space, serif headline.",
            },
        ],
        "carousel_infographic": {
            "title": context.title,
            "slides": [
                {
                    "slide": 1,
                    "type": "hero photo/text",
                    "headline": context.title,
                    "body": trim_text(hero_sentence, 130),
                    "visual": "Hero photo with calm text overlay and subtle orange accent line.",
                },
                {
                    "slide": 2,
                    "type": "infographic/anatomy",
                    "headline": "What the breath organizes",
                    "body": trim_text(infographic_sentence, 160),
                    "visual": "Label ribcage, spine, sternum, or pelvis if supported by the transcript.",
                },
                {
                    "slide": 3,
                    "type": "checklist",
                    "headline": "Practice checkpoints",
                    "body": "\n".join(f"- {trim_text(item, 90)}" for item in practices[:4]),
                    "visual": "Saveable checklist slide with compact body copy.",
                },
                {
                    "slide": 4,
                    "type": "cta",
                    "headline": "Save and follow",
                    "body": "Save this for practice notes and follow Himalayan Institute for grounded teaching.",
                    "visual": "Minimal CTA slide in cream, green, and orange.",
                },
            ],
        },
        "carousel_checklist": {
            "title": "Meditative State Practice Checklist",
            "slides": [
                {
                    "slide": 1,
                    "type": "hero photo/text",
                    "headline": "A calm setup changes the practice",
                    "body": trim_text(quotes[1] if len(quotes) > 1 else hero_sentence, 130),
                    "visual": "Portrait or seated posture with understated text treatment.",
                },
                {
                    "slide": 2,
                    "type": "checklist",
                    "headline": "Before you deepen the posture",
                    "body": "\n".join(f"- {trim_text(item, 90)}" for item in practices[:4]),
                    "visual": "Checklist layout with small icons or checkmarks.",
                },
                {
                    "slide": 3,
                    "type": "infographic/anatomy",
                    "headline": "Where to soften, where to ground",
                    "body": trim_text(
                        match_sentences(sentences, ["jaw", "throat", "shoulder", "pelvis"], 1)[0]
                        if match_sentences(sentences, ["jaw", "throat", "shoulder", "pelvis"], 1)
                        else needs_review(),
                        160,
                    ),
                    "visual": "Contrast gripping zones with grounding zones using labeled callouts.",
                },
                {
                    "slide": 4,
                    "type": "cta",
                    "headline": "Keep this nearby",
                    "body": "Save this checklist and follow Himalayan Institute for useful class takeaways.",
                    "visual": "Simple brand CTA treatment.",
                },
            ],
        },
        "carousel_hero": {
            "title": "Building a Meditative State",
            "slides": [
                {
                    "slide": 1,
                    "type": "hero photo/text",
                    "headline": "Building a meditative state",
                    "body": trim_text(hero_sentence, 130),
                    "visual": "Full-bleed calm photo, serif headline, warm cream caption block.",
                },
                {
                    "slide": 2,
                    "type": "infographic/anatomy",
                    "headline": "The body cues behind steadiness",
                    "body": trim_text(infographic_sentence, 160),
                    "visual": "Use a single posture silhouette with 3 labeled body points.",
                },
                {
                    "slide": 3,
                    "type": "checklist",
                    "headline": "Three ways to return to center",
                    "body": "\n".join(f"- {trim_text(item, 90)}" for item in practices[:3]),
                    "visual": "Short-list slide designed to be saved.",
                },
                {
                    "slide": 4,
                    "type": "cta",
                    "headline": "Save for your next practice",
                    "body": "Follow Himalayan Institute for calm, grounded, useful practice guidance.",
                    "visual": "Closing slide with orange underline or button shape.",
                },
            ],
        },
        "reel_script": [
            "Hook: A meditative state is not something you force. It is something you build.",
            f"Transcript pull: {trim_text(hero_sentence, 180)}",
            f"Practice note: {trim_text(practices[0], 120)}",
            f"Practice note: {trim_text(practices[1], 120)}",
            "Close: Save this and return to it before your next practice.",
        ],
        "text_overlays": [
            context.title,
            "Breath before effort",
            "Ground the base",
            "Soften what grips",
            "Save this practice note",
        ],
        "caption": {
            "short_caption": trim_text(hero_sentence, 180),
            "takeaways": [trim_text(item, 95) for item in practices[:3]],
            "cta": "Save this for your next practice and follow Himalayan Institute for more grounded teaching.",
        },
        "story_frames": [
            {"frame": 1, "text": context.title},
            {"frame": 2, "text": trim_text(hero_sentence, 110)},
            {"frame": 3, "text": trim_text(practices[0], 100)},
            {"frame": 4, "text": trim_text(practices[1], 100)},
            {"frame": 5, "text": "Save this and come back before practice."},
        ],
        "lead_magnet": {
            "title": f"{context.title}: Practice Notes",
            "sections": [
                {
                    "heading": "Core teaching",
                    "body": trim_text(hero_sentence, 220),
                },
                {
                    "heading": "What to try in practice",
                    "body": "\n".join(f"- {trim_text(item, 100)}" for item in practices[:4]),
                },
                {
                    "heading": "Reflection",
                    "body": "Which cue made the posture steadier? What changed when the breath became even?",
                },
            ],
        },
        "youtube_titles": [
            f"{context.title} | Calm Breath and Steady Posture",
            "How Breath Builds a Meditative State",
            "3 Grounded Cues for a Meditative Practice",
            "What a Meditative State Feels Like in the Body",
            "Breath, Posture, and a Steadier Inner State",
        ],
        "thumbnail_directions": [
            "Teacher portrait or seated pose with warm cream negative space and deep green headline.",
            "One anatomy label in Himalayan Institute orange #CF6F1A pointing to ribcage, sternum, or pelvis.",
            "Avoid hype. The image should feel grounded, calm, and precise.",
        ],
        "still_headlines": [
            "Breath before effort",
            "Ground the base, steady the mind",
            "A meditative state is built, not forced",
            "Soften what grips",
            "Let the breath teach the posture",
        ],
        "body_terms": body_terms,
    }


def llm_schema() -> dict[str, Any]:
    string_array = {"type": "array", "items": {"type": "string"}}
    slide = {
        "type": "object",
        "properties": {
            "slide": {"type": "integer"},
            "type": {"type": "string"},
            "headline": {"type": "string"},
            "body": {"type": "string"},
            "visual": {"type": "string"},
        },
        "required": ["slide", "type", "headline", "body", "visual"],
        "additionalProperties": False,
    }
    return {
        "type": "object",
        "properties": {
            "keywords": string_array,
            "core_themes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "summary": {"type": "string"},
                        "transcript_support": {"type": "string"},
                    },
                    "required": ["title", "summary", "transcript_support"],
                    "additionalProperties": False,
                },
            },
            "quotes": string_array,
            "practices": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "steps": string_array,
                        "notes": {"type": "string"},
                    },
                    "required": ["name", "steps", "notes"],
                    "additionalProperties": False,
                },
            },
            "visual_opportunities": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string"},
                        "focus": {"type": "string"},
                        "design_notes": {"type": "string"},
                    },
                    "required": ["type", "focus", "design_notes"],
                    "additionalProperties": False,
                },
            },
            "carousel_infographic": {
                "type": "object",
                "properties": {"title": {"type": "string"}, "slides": {"type": "array", "items": slide}},
                "required": ["title", "slides"],
                "additionalProperties": False,
            },
            "carousel_checklist": {
                "type": "object",
                "properties": {"title": {"type": "string"}, "slides": {"type": "array", "items": slide}},
                "required": ["title", "slides"],
                "additionalProperties": False,
            },
            "carousel_hero": {
                "type": "object",
                "properties": {"title": {"type": "string"}, "slides": {"type": "array", "items": slide}},
                "required": ["title", "slides"],
                "additionalProperties": False,
            },
            "reel_script": string_array,
            "text_overlays": string_array,
            "caption": {
                "type": "object",
                "properties": {
                    "short_caption": {"type": "string"},
                    "takeaways": string_array,
                    "cta": {"type": "string"},
                },
                "required": ["short_caption", "takeaways", "cta"],
                "additionalProperties": False,
            },
            "story_frames": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"frame": {"type": "integer"}, "text": {"type": "string"}},
                    "required": ["frame", "text"],
                    "additionalProperties": False,
                },
            },
            "lead_magnet": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "sections": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"heading": {"type": "string"}, "body": {"type": "string"}},
                            "required": ["heading", "body"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["title", "sections"],
                "additionalProperties": False,
            },
            "youtube_titles": string_array,
            "thumbnail_directions": string_array,
            "still_headlines": string_array,
        },
        "required": [
            "keywords",
            "core_themes",
            "quotes",
            "practices",
            "visual_opportunities",
            "carousel_infographic",
            "carousel_checklist",
            "carousel_hero",
            "reel_script",
            "text_overlays",
            "caption",
            "story_frames",
            "lead_magnet",
            "youtube_titles",
            "thumbnail_directions",
            "still_headlines",
        ],
        "additionalProperties": False,
    }


def build_llm_prompt(context: ProjectContext) -> str:
    return textwrap.dedent(
        f"""
        Create a complete structured content pack for Himalayan Institute from the transcript below.

        Rules:
        - Use a calm, grounded, useful tone.
        - Avoid hype, vague inspiration, and cheesy wellness language.
        - Generate content directly from the transcript.
        - Never invent quotes. Every quote must match transcript language exactly.
        - If the transcript does not support something, write exactly: needs review
        - Every carousel must contain:
          1. at least one infographic/anatomy-style slide
          2. at least one checklist slide
          3. at least one hero photo/text slide
          4. one save/follow CTA slide
        - In visual and design notes, use deep green, warm cream, and Himalayan Institute orange #CF6F1A.
        - Keep outputs easy to paste into Canva, captions, PDFs, and video editing notes.

        Class title: {context.title}
        Teacher: {context.teacher}
        Theme input: {", ".join(context.theme) if context.theme else "needs review"}

        Transcript:
        {context.transcript}
        """
    ).strip()


def build_llm_input(context: ProjectContext) -> list[dict[str, Any]]:
    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "input_text",
                    "text": "You are a precise content strategist for Himalayan Institute. Output JSON only.",
                }
            ],
        },
        {"role": "user", "content": [{"type": "input_text", "text": build_llm_prompt(context)}]},
    ]


def call_openai(context: ProjectContext) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    payload = {
        "model": context.model,
        "input": build_llm_input(context),
        "text": {
            "format": {
                "type": "json_schema",
                "name": "hi_class_content_pack",
                "strict": True,
                "schema": llm_schema(),
            }
        },
    }

    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=120) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        message = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI request failed: {exc.code} {message}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI request failed: {exc.reason}") from exc

    output_text = body.get("output_text")
    if not output_text:
        raise RuntimeError("OpenAI response did not include output_text.")
    return json.loads(output_text)


def generate_content(context: ProjectContext) -> tuple[dict[str, Any], str]:
    if context.use_llm:
        try:
            return call_openai_sdk(context), "llm"
        except Exception as sdk_exc:
            print(f"[warn] SDK LLM step failed, retrying with direct HTTP call: {sdk_exc}", file=sys.stderr)
            try:
                return call_openai(context), "llm"
            except Exception as http_exc:
                print(
                    f"[warn] LLM step failed, falling back to local extraction: {http_exc}",
                    file=sys.stderr,
                )
    return heuristics_content(context), "heuristic"


def call_openai_sdk(context: ProjectContext) -> dict[str, Any]:
    if OpenAI is None:
        raise RuntimeError("The openai package is not installed.")

    client = OpenAI()
    response = client.responses.create(
        model=context.model,
        input=build_llm_input(context),
        text={
            "format": {
                "type": "json_schema",
                "name": "hi_class_content_pack",
                "strict": True,
                "schema": llm_schema(),
            }
        },
    )
    output_text = getattr(response, "output_text", None)
    if not output_text:
        raise RuntimeError("OpenAI SDK response did not include output_text.")
    return json.loads(output_text)


def render_bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def render_slides(pack: dict[str, Any]) -> str:
    lines = [
        f"# {pack['title']}",
        "",
        "## Design Direction",
        "- Deep green",
        "- Warm cream",
        "- Himalayan Institute orange `#CF6F1A`",
        "- Calm, grounded, useful visual tone",
        "",
    ]
    for slide in pack["slides"]:
        lines.extend(
            [
                f"## Slide {slide['slide']} - {slide['type']}",
                f"**Headline:** {slide['headline']}",
                "",
                "**Body Copy:**",
                slide["body"],
                "",
                f"**Visual Direction:** {slide['visual']}",
                "",
                "**Production Notes:**",
                "Keep copy concise, brand-aligned, and easy to paste into Canva layouts.",
                "",
            ]
        )
    return "\n".join(lines).strip() + "\n"


def infer_transcript_support(content: dict[str, Any]) -> list[str]:
    support = []
    for item in content.get("core_themes", []):
        value = item.get("transcript_support", "")
        if value and value not in support:
            support.append(value)
    for quote in content.get("quotes", []):
        if quote and quote != "needs review" and quote not in support:
            support.append(quote)
    return support[:6]


def build_markdown_files(content: dict[str, Any], source_mode: str, context: ProjectContext) -> dict[str, str]:
    evidence = infer_transcript_support(content)
    themes_lines = [
        "# Core Themes",
        "",
        f"Generated via: `{source_mode}`",
        "",
    ]
    for item in content["core_themes"]:
        themes_lines.extend(
            [
                f"## {item['title']}",
                item["summary"],
                "",
                f"Transcript support: {item['transcript_support']}",
                "",
            ]
        )

    quotes_lines = ["# Quotes", "", "Only use these if they match the transcript exactly.", ""]
    quotes_lines.extend(f"- \"{quote}\"" if quote != "needs review" else "- needs review" for quote in content["quotes"])

    practices_lines = ["# Practices", ""]
    for practice in content["practices"]:
        practices_lines.extend(
            [
                f"## {practice['name']}",
                render_bullets(practice["steps"]),
                "",
                f"Notes: {practice['notes']}",
                "",
            ]
        )

    visual_lines = ["# Visual Opportunities", ""]
    for item in content["visual_opportunities"]:
        visual_lines.extend(
            [
                f"## {item['type']}",
                f"Focus: {item['focus']}",
                f"Design notes: {item['design_notes']}",
                "",
            ]
        )

    reel_lines = [
        "# Reel Script",
        "",
        "## Purpose",
        "Short-form teaching recap built directly from the class transcript.",
        "",
        "## Script Beats",
    ]
    reel_lines.extend(f"- {line}" for line in content["reel_script"])
    reel_lines.extend(
        [
            "",
            "## Transcript Evidence",
            render_bullets(evidence if evidence else ["needs review"]),
        ]
    )

    overlays_lines = ["# Text Overlays", "", "Use these as scene-by-scene overlays or subtitle emphasis.", ""]
    overlays_lines.extend(f"- {line}" for line in content["text_overlays"])

    caption_lines = [
        "# Caption",
        "",
        "## Short Caption",
        content["caption"]["short_caption"],
        "",
        "## Takeaways",
        render_bullets(content["caption"]["takeaways"]),
        "",
        "## CTA",
        content["caption"]["cta"],
        "",
        "## Hashtag Direction",
        "Use a small, relevant set only if needed. Avoid generic wellness hashtag stuffing.",
    ]

    story_lines = ["# Story Frames", "", "Keep each frame readable in 1-2 breaths.", ""]
    for frame in content["story_frames"]:
        story_lines.extend([f"## Frame {frame['frame']}", frame["text"], ""])

    lead_lines = [
        "# Free Lead Magnet",
        "",
        f"## {content['lead_magnet']['title']}",
        "",
        "## Format Notes",
        "Designed for a simple, calm PDF handout with generous spacing and practical takeaways.",
        "",
    ]
    for section in content["lead_magnet"]["sections"]:
        lead_lines.extend([f"### {section['heading']}", section["body"], ""])

    youtube_lines = ["# YouTube Titles", "", "Aim for clarity, usefulness, and calm authority.", ""]
    youtube_lines.extend(f"- {title}" for title in content["youtube_titles"])

    thumb_visual_lines = ["# Thumbnail Visual Directions", ""]
    thumb_visual_lines.extend(f"- {line}" for line in content["thumbnail_directions"])

    still_lines = ["# Still Headlines", ""]
    still_lines.extend(f"- {line}" for line in content["still_headlines"])

    return {
        "03_Extraction/core_themes.md": "\n".join(themes_lines).strip() + "\n",
        "03_Extraction/quotes.md": "\n".join(quotes_lines).strip() + "\n",
        "03_Extraction/practices.md": "\n".join(practices_lines).strip() + "\n",
        "03_Extraction/visual_opportunities.md": "\n".join(visual_lines).strip() + "\n",
        "04_Carousels/carousel_1_infographic.md": render_slides(content["carousel_infographic"]),
        "04_Carousels/carousel_2_practice_checklist.md": render_slides(content["carousel_checklist"]),
        "04_Carousels/carousel_3_photo_hero.md": render_slides(content["carousel_hero"]),
        "05_Reels/reel_script.md": "\n".join(reel_lines).strip() + "\n",
        "05_Reels/text_overlays.md": "\n".join(overlays_lines).strip() + "\n",
        "05_Reels/caption.md": "\n".join(caption_lines).strip() + "\n",
        "06_Stories/story_frames.md": "\n".join(story_lines).strip() + "\n",
        "07_PDF/free_lead_magnet.md": "\n".join(lead_lines).strip() + "\n",
        "08_Thumbnails/youtube_titles.md": "\n".join(youtube_lines).strip() + "\n",
        "08_Thumbnails/visual_directions.md": "\n".join(thumb_visual_lines).strip() + "\n",
        "09_Stills/still_headlines.md": "\n".join(still_lines).strip() + "\n",
    }


def build_project_index(context: ProjectContext) -> dict[str, Any]:
    relative_paths = {
        folder: str((context.class_dir / folder).relative_to(context.root_dir))
        for folder in DIRECTORY_MAP
    }
    asset_status = {}
    for folder, files in DIRECTORY_MAP.items():
        for file_name in files:
            rel_path = Path(relative_paths[folder]) / file_name
            asset_status[str(rel_path)] = {
                "draft": True,
                "designed": False,
                "exported": False,
                "posted": False,
            }
    return {
        "class_title": context.title,
        "teacher": context.teacher,
        "theme": context.theme,
        "date_created": context.created_at,
        "content_source": context.content_source,
        "model": context.model if context.content_source == "llm" else None,
        "folder_paths": relative_paths,
        "asset_status": asset_status,
    }


def ensure_structure(class_dir: Path) -> None:
    for folder, files in DIRECTORY_MAP.items():
        target_dir = class_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        for file_name in files:
            file_path = target_dir / file_name
            if not file_path.exists():
                file_path.write_text("", encoding="utf-8")


def write_project(context: ProjectContext, content: dict[str, Any], source_mode: str) -> None:
    ensure_structure(context.class_dir)

    source_copy = context.class_dir / "01_Source" / context.transcript_path.name
    transcript_copy = context.class_dir / "02_Transcript" / "full_transcript.txt"
    shutil.copyfile(context.transcript_path, source_copy)
    transcript_copy.write_text(context.transcript, encoding="utf-8")

    markdown_files = build_markdown_files(content, source_mode, context)
    for relative_path, body in markdown_files.items():
        (context.class_dir / relative_path).write_text(body, encoding="utf-8")

    project_index = build_project_index(context)
    (context.class_dir / "project_index.json").write_text(
        json.dumps(project_index, indent=2), encoding="utf-8"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a class content project for Himalayan Institute.")
    parser.add_argument("--title", required=True, help="Class or lecture title.")
    parser.add_argument("--teacher", required=True, help="Teacher name.")
    parser.add_argument("--transcript", required=True, help="Path to the transcript text file.")
    parser.add_argument(
        "--theme",
        default="",
        help="Comma-separated theme terms, for example: 'breath, posture, meditative state'",
    )
    parser.add_argument(
        "--output-root",
        default=str(Path(__file__).resolve().parent),
        help="Base directory for Classes/ output. Defaults to the HI_Content_Engine folder.",
    )
    parser.add_argument(
        "--use-llm",
        action="store_true",
        help="Use the OpenAI Responses API to enrich content from the transcript.",
    )
    parser.add_argument(
        "--model",
        default="gpt-4o-mini",
        help="Model name for the optional OpenAI step. Default: gpt-4o-mini",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    transcript_path = Path(args.transcript).expanduser().resolve()
    if not transcript_path.exists():
        print(f"Transcript not found: {transcript_path}", file=sys.stderr)
        return 1

    transcript = clean_transcript(transcript_path.read_text(encoding="utf-8"))
    root_dir = Path(args.output_root).expanduser().resolve()
    classes_dir = root_dir / "Classes"
    classes_dir.mkdir(parents=True, exist_ok=True)

    class_slug = slugify(args.title)
    class_dir = classes_dir / class_slug
    created_at = datetime.now().astimezone().isoformat(timespec="seconds")
    theme = [item.strip() for item in args.theme.split(",") if item.strip()]

    context = ProjectContext(
        title=args.title,
        teacher=args.teacher,
        theme=theme,
        transcript=transcript,
        transcript_path=transcript_path,
        created_at=created_at,
        root_dir=root_dir,
        class_dir=class_dir,
        use_llm=args.use_llm,
        model=args.model,
    )

    content, source_mode = generate_content(context)
    context.content_source = source_mode
    write_project(context, content, source_mode)

    print(f"Created project: {class_dir}")
    print(f"Content source: {source_mode}")
    print(f"Project index: {class_dir / 'project_index.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
