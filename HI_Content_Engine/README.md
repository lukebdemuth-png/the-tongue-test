# hi-class-content-engine

Local Python CLI for turning one yoga class or lecture transcript into a structured Himalayan Institute content project.

## What it creates

For each class, the tool builds:

- `Classes/{class_slug}/01_Source/`
- `Classes/{class_slug}/02_Transcript/`
- `Classes/{class_slug}/03_Extraction/`
- `Classes/{class_slug}/04_Carousels/`
- `Classes/{class_slug}/05_Reels/`
- `Classes/{class_slug}/06_Stories/`
- `Classes/{class_slug}/07_PDF/`
- `Classes/{class_slug}/08_Thumbnails/`
- `Classes/{class_slug}/09_Stills/`
- `Classes/{class_slug}/10_Final/`
- `Classes/{class_slug}/project_index.json`

It also fills the markdown deliverables used for:

- transcript extraction
- carousel copy
- reel scripts and overlays
- story frame notes
- PDF lead magnets
- thumbnail and still ideation

## Install

From [HI_Content_Engine](/Users/creative/Documents/New project/HI_Content_Engine):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Basic usage

```bash
python3 create_class_project.py \
  --title "Sandy - Building a Meditative State" \
  --teacher "Sandy" \
  --transcript "./sample_input/sandy_transcript.txt" \
  --theme "breath, posture, meditative state"
```

This creates:

- [Classes/sandy-building-a-meditative-state](/Users/creative/Documents/New project/HI_Content_Engine/Classes/sandy-building-a-meditative-state)

## Optional LLM enrichment

The CLI works without an API key by using a local heuristic extraction pass.

When `--use-llm` is enabled, the tool now:

- prefers the official OpenAI Python SDK
- falls back to a direct Responses API call if needed
- falls back again to local transcript extraction if the API step fails

If you want a stronger transcript-to-content step, set `OPENAI_API_KEY` and add `--use-llm`:

```bash
export OPENAI_API_KEY="your_key_here"

python3 create_class_project.py \
  --title "Sandy - Building a Meditative State" \
  --teacher "Sandy" \
  --transcript "./sample_input/sandy_transcript.txt" \
  --theme "breath, posture, meditative state" \
  --use-llm
```

Optional flags:

- `--output-root` to place the `Classes/` directory somewhere else
- `--model` to override the default model used for the LLM step

## Content rules baked into the tool

- Calm, grounded, useful tone
- Avoid hype and cheesy wellness language
- Pull from the transcript rather than inventing claims
- Never invent quotes
- Mark unsupported items as `needs review`
- Include deep green, warm cream, and Himalayan Institute orange `#CF6F1A` in design notes
- Ensure each carousel includes:
  - one infographic or anatomy-style slide
  - one checklist slide
  - one hero photo/text slide
  - one save/follow CTA slide

## Files to review first

- [create_class_project.py](/Users/creative/Documents/New project/HI_Content_Engine/create_class_project.py)
- [sample_input/sandy_transcript.txt](/Users/creative/Documents/New project/HI_Content_Engine/sample_input/sandy_transcript.txt)
- [Classes/sandy-building-a-meditative-state/project_index.json](/Users/creative/Documents/New project/HI_Content_Engine/Classes/sandy-building-a-meditative-state/project_index.json)
