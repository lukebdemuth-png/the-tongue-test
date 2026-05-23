import json
from pathlib import Path

from PIL import Image

from src.ig_carousel_composer import render_config, sample_config


def test_render_car_size_slide(tmp_path: Path) -> None:
    config = sample_config()
    config["output_dir"] = str(tmp_path)
    config["carousel_name"] = "test_carousel"

    outputs = render_config(config)

    assert len(outputs) == 1
    assert outputs[0].exists()
    with Image.open(outputs[0]) as image:
        assert image.size == (1080, 1350)


def test_render_story_slide(tmp_path: Path) -> None:
    config = sample_config()
    config["format"] = "story"
    config["output_dir"] = str(tmp_path)
    config["carousel_name"] = "test_story"

    outputs = render_config(config)

    with Image.open(outputs[0]) as image:
        assert image.size == (1080, 1920)


def test_render_multiple_slides_as_separate_pngs(tmp_path: Path) -> None:
    config = sample_config()
    config["output_dir"] = str(tmp_path)
    config["carousel_name"] = "multi"
    config["slides"].append(
        {
            "slide_number": 2,
            "title": "Second Slide",
            "subtitle": "Same locked system",
            "body_lines": ["One output file per slide."],
            "markers": ["check", "check", "check"],
        }
    )

    outputs = render_config(config)

    assert [path.name for path in outputs] == ["slide_01.png", "slide_02.png"]
    assert all(path.exists() for path in outputs)


def test_sample_config_is_json_serializable() -> None:
    assert json.loads(json.dumps(sample_config()))["format"] == "car_size"
