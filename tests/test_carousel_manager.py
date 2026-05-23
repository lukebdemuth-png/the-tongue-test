import json
from pathlib import Path

from src.carousel_manager import (
    build_memory_card,
    build_prompt,
    get_carousel,
    get_slide,
    load_store,
    save_store,
)


def test_build_prompt_locks_requested_change_only(tmp_path: Path) -> None:
    store_path = tmp_path / "carousels.json"
    store = load_store(store_path)
    carousel = get_carousel(store, "Yoga Carousel")
    carousel["format"] = "car_size"
    carousel["master_locked_style"] = {
        "background_style": "warm off-white paper texture",
        "color_palette": "sage, cream, charcoal",
        "text_style": "clean editorial sans",
        "safe_margins": "keep all text inside 120px margins",
    }
    slide = get_slide(carousel, "3")
    slide["approved"] = "Approved pose and headline are correct."
    slide["locked_elements"] = "background, headline, figure, circles"
    slide["editable_elements"] = "bottom number row only"
    slide["rejected"] = ["changed circles"]
    save_store(store_path, store)

    prompt = build_prompt(
        carousel,
        "3",
        "replace the bottom 1 2 3 with checkmarks",
    )

    assert "Only change: replace the bottom 1 2 3 with checkmarks" in prompt
    assert "Do not change background." in prompt
    assert "Do not change art style." in prompt
    assert "Slide 1 is the master template" in prompt
    assert "Canvas format: car_size (1080 x 1350)." in prompt
    assert "Canvas must remain exactly 1080 x 1350." in prompt
    assert "Generate exactly ONE standalone image" in prompt
    assert "Do not create a grid, contact sheet, collage" in prompt
    assert "Do not output multiple slides in one image." in prompt
    assert "CONSISTENCY LOCK ACTIVE" in prompt
    assert "All text must remain safely inside Instagram crop margins." in prompt
    assert "Do not move sacred geometry." in prompt
    assert "Do not confuse duplicate text layers" in prompt
    assert "Do not improve, redesign, reinterpret" in prompt
    assert "Do not repeat: changed circles." in prompt
    assert "Safe Margins: keep all text inside 120px margins" in prompt


def test_memory_card_includes_current_instruction(tmp_path: Path) -> None:
    store = {"carousels": {}}
    carousel = get_carousel(store, "HI Carousel")
    carousel["master_locked_style"] = {"lighting": "soft studio light"}
    slide = get_slide(carousel, "1")
    slide["approved"] = "Approved cover image."
    slide["locked_elements"] = "title, face, background"

    card = build_memory_card(carousel, "1", "Only change the subtitle.")

    assert "CAROUSEL MEMORY CARD" in card
    assert "Carousel name: HI Carousel" in card
    assert "Slide number: 1" in card
    assert "Lighting: soft studio light" in card
    assert "Exact current instruction: Only change the subtitle." in card


def test_store_round_trip(tmp_path: Path) -> None:
    store_path = tmp_path / "nested" / "carousels.json"
    store = {"carousels": {"Test": {"slides": {}, "rejection_log": []}}}
    save_store(store_path, store)

    loaded = load_store(store_path)

    assert json.dumps(loaded, sort_keys=True) == json.dumps(store, sort_keys=True)
