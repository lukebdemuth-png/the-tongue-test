# IG Carousel Composer

This is the deterministic replacement for asking ChatGPT to perform precise Instagram layout edits.

Use ChatGPT for base illustration/art if needed. Use this composer for final slide assembly:

- exact canvas size
- locked text placement
- locked typography scale
- locked safe margins
- locked sacred geometry
- one PNG per slide

## Canvas Sizes

- `car_size`: `1080 x 1350`
- `story`: `1080 x 1920`

## Create A Sample Config

```bash
python3 src/ig_carousel_composer.py sample --output carousel_composer.example.json
```

## Render Slides

```bash
python3 src/ig_carousel_composer.py render --config carousel_composer.example.json
```

Outputs go to:

```text
carousel_exports/<carousel-name>/slide_01.png
```

## Config Shape

```json
{
  "carousel_name": "example_yoga_carousel",
  "format": "car_size",
  "output_dir": "carousel_exports",
  "safe_margin": 96,
  "sacred_geometry": true,
  "background_image": "optional/path/to/chatgpt-art.png",
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
```

## Workflow

1. Ask ChatGPT for art only, preferably without final text.
2. Put the art path in `background_image`.
3. Put final words in the JSON config.
4. Render locally.
5. Upload the exported PNGs to Instagram.

This prevents:

- wrong text layer edits
- typography drift
- sacred geometry drift
- crop cutoff
- contact-sheet downloads
- layout reinterpretation
