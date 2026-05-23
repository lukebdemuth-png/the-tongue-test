# ChatGPT Carousel Manager

This is a side tool for Luke's carousel workflow. It is not a Canva replacement and it is not part of the medicine app's retrieval architecture.

The tool stores a locked carousel brief and returns strict copy/paste-ready ChatGPT instructions so image generation/editing stays consistent across a 7-slide carousel.

## Instagram Sizes

When Luke says `car size`, that means Instagram carousel portrait size:

- `car size`: `1080 x 1350`
- `IG story`: `1080 x 1920`

Generated prompts always include the locked canvas size. Do not let ChatGPT switch formats, crop ratios, or framing unless Luke explicitly asks.

## Single-Image Output Rule

When creating a carousel, do not ask ChatGPT to generate 5 stills in one image. It often returns a grid/contact sheet that downloads as one combined image.

Default workflow:

- Generate or edit one slide at a time.
- Each prompt should request exactly one standalone image.
- Never request a grouped set, grid, collage, contact sheet, or multi-image preview unless Luke explicitly wants one combined preview.
- For a 5-slide batch, create five separate prompts, one per slide.

Batch helper:

```bash
scripts/create_stills_batch_prompts.sh --carousel "Yoga Body Cue Carousel" --slides 5
```

With exact changes:

```bash
scripts/create_stills_batch_prompts.sh \
  --carousel "Yoga Body Cue Carousel" \
  --changes /tmp/carousel_changes.txt
```

Where `/tmp/carousel_changes.txt` looks like:

```text
1|create slide 1 cover still
2|replace the bottom 1 2 3 with checkmarks
3|tighten only vertical spacing between text rows
```

The Carousel Manager prompt includes this lock by default:

```text
Generate exactly ONE standalone image for this slide only.
Do not create a grid, contact sheet, collage, multi-image preview, or grouped set of stills.
The output must be downloadable as one individual still image.
```

## Core Rule

Slide 1 is the master template. Every future slide inherits its layout structure, spacing system, sacred geometry placement, typography hierarchy, color palette, lighting style, rendering style, crop framing, visual density, and subject proportions.

Only wording, pose, educational content, and explicitly requested instructional overlays may change.

## What It Manages

- Master locked style: background style, palette, lighting, texture, text style, spacing, logo/no-logo rule, forbidden changes, and safe margins.
- Current approved image state per slide.
- What must stay unchanged.
- Rejected mistakes and do-not-repeat rules.
- The next requested change.
- Carousel memory cards for ChatGPT.
- Strict surgical edit prompts.

## Failure Patterns It Prevents

- Layout drift
- Redesign drift
- Spacing drift
- Sacred geometry drift
- Typography hierarchy drift
- Wrong-layer editing when duplicate text exists
- Art changes when only text edits were requested
- Instagram crop failures
- Source-role confusion when one image supplies the subject and another supplies art/typography

## Carousel Style Notes

### Lion's Pose

- Warm cinematic lighting
- Mystical yogic aesthetic
- Centered sacred geometry
- Strong typography hierarchy
- Educational infographic structure
- Symmetrical composition
- Gold sacred geometry accents
- Refined luxury wellness aesthetic

### Cow Face / Gomukhasana

- Refined yogic educational infographic style
- Centered pose
- Gold sacred geometry
- Symmetrical layout
- Concise instructional structure
- Elegant typography
- Warm gold palette
- Common themes: stabilization, inward awareness, sensory refinement, nourishment, containment, diaphragm localization, pelvic floor stabilization, chest opening

## Prompting Lessons

When duplicate text exists, identify the targeted layer. Preserve the large primary headline unless the user explicitly targets it.

When the user says "keep art intact," "do not change art," "leave everything else the same," or "only change words," lock layout, spacing, geometry, lighting, crop, framing, typography placement, typography scale, color palette, visual density, subject scale, texture, and rendering style.

When the user asks to tighten vertical spacing, only reduce vertical spacing. Do not alter horizontal spacing, alignment, geometry, crop, layout structure, or typography scale.

When one image is the subject source and another image is the art/typography source, keep roles separate. Do not import the wrong person or blend subjects.

When Instagram cuts off text, recenter typography safely inside crop margins without redesigning the slide.

When replacing symbols, preserve scale, spacing, placement, balance, and sacred geometry hierarchy.

When scaling the subject, keep the head and body clear of sacred geometry boundaries.

## Quick Start

Create or update a carousel style:

```bash
python3 src/carousel_manager.py init \
  --carousel "Yoga Body Cue Carousel" \
  --format car_size \
  --background-style "warm off-white paper texture" \
  --color-palette "sage, cream, charcoal" \
  --lighting "soft even editorial light" \
  --texture "subtle paper grain" \
  --text-style "clean editorial sans, consistent size and weight" \
  --spacing "wide margins, stable text zones" \
  --logo-rule "no logo unless explicitly requested" \
  --forbidden-changes "do not add icons, plants, new props, new faces, new layout" \
  --safe-margins "keep all text inside safe margins"
```

Record an approved slide:

```bash
python3 src/carousel_manager.py slide \
  --carousel "Yoga Body Cue Carousel" \
  --slide 2 \
  --approved "Background, headline, figure, circles, and top text are approved." \
  --locked-elements "background, color palette, font, layout, spacing, figure, circles" \
  --editable-elements "bottom numbered row only"
```

Generate a strict prompt:

```bash
python3 src/carousel_manager.py prompt \
  --carousel "Yoga Body Cue Carousel" \
  --slide 2 \
  --change "replace the bottom 1 2 3 with checkmarks"
```

Use the interactive checklist:

```bash
python3 src/carousel_manager.py wizard
```

## One Bash Command

Use this wrapper when you do not want to remember the Python commands:

```bash
scripts/chatgpt_carousel_manager.sh wizard
```

Easiest batch workflow:

```bash
scripts/chatgpt_carousel_manager.sh
```

Then answer the prompts. It creates separate files in:

```text
carousel_prompts/<carousel-name>/slide_01_prompt.txt
carousel_prompts/<carousel-name>/slide_02_prompt.txt
...
```

Open each file and paste one prompt into ChatGPT at a time.

Common commands:

```bash
scripts/chatgpt_carousel_manager.sh setup --carousel "Lion Pose" --format car
scripts/chatgpt_carousel_manager.sh slide --carousel "Lion Pose" --slide 2 --approved "Approved state here"
scripts/chatgpt_carousel_manager.sh prompt --carousel "Lion Pose" --slide 2 --change "only requested change"
scripts/chatgpt_carousel_manager.sh batch --carousel "Lion Pose" --slides 5 --format car
```

## Example Output

```text
CHATGPT IMAGE EDIT LOCK:
Carousel: Yoga Body Cue Carousel
Slide: 2
Canvas format: car_size (1080 x 1350).
Generate exactly ONE standalone image for this slide only.
Do not create a grid, contact sheet, collage, multi-image preview, or grouped set of stills.
The output must be downloadable as one individual still image.
Use the uploaded image as the exact source image.
Only change: replace the bottom 1 2 3 with checkmarks
Must stay identical: background, color palette, font, layout, spacing, figure, circles
Current approved image state: Background, headline, figure, circles, and top text are approved.
Locked elements: background, color palette, font, layout, spacing, figure, circles
Editable elements: bottom numbered row only

DO NOT CHANGE:
- Do not change background.
- Do not change art style.
- Do not change color palette.
- Do not change lighting.
- Do not change texture.
- Do not change text placement.
- Do not change font style.
- Do not change typography scale unless explicitly requested.
- Do not change layout.
- Do not change spacing.
- Do not move sacred geometry.
- Do not resize sacred geometry.
- Do not alter crop framing.
- Do not change canvas size from 1080 x 1350.
- Do not place critical text near top, bottom, or side edges.
- Do not confuse duplicate text layers; preserve primary headline unless the request explicitly targets it.
- Do not add icons.
- Do not add plants.
- Do not alter faces.
- Do not blend source-image roles; use each source only for its stated purpose.
- Do not output multiple slides in one image.
- Do not combine several stills into one file.
- Do not create a preview grid.
- Do not repeat: changed layout.
- Do not repeat: changed font.
- Do not repeat: changed art style.
- Do not repeat: moved text.
- Do not repeat: added icons.
- Do not repeat: altered face.
- Do not repeat: changed background.
- Do not repeat: added plants.

Do not improve, redesign, reinterpret, rebalance, or make creative upgrades.
This is a surgical edit only.
```

## Storage

By default, the tool stores local carousel state at:

```text
carousel_data/carousels.json
```

This file is for local workflow memory. It is intentionally separate from the medicine app source ingestion system.
