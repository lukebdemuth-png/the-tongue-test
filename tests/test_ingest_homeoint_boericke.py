from src.ingest_homeoint_boericke import extract_title, parse_html, section_map


def test_parse_html_extracts_text_and_links() -> None:
    html = '<html><body><a href="n/nux-v.htm">Nux-v</a><p>Mind.--Irritable.</p></body></html>'
    text, links = parse_html(html)

    assert "Mind.--Irritable." in text
    assert "n/nux-v.htm" in links


def test_section_map_extracts_named_sections() -> None:
    sections = section_map("Mind.--Irritable. Stomach.--Nausea. Modalities.--Worse morning.")

    assert sections["Mind"] == "Irritable"
    assert sections["Stomach"] == "Nausea"
    assert sections["Modalities"] == "Worse morning"


def test_extract_title_from_title_tag() -> None:
    html = "<title>NUX VOMICA - HOMOEOPATHIC MATERIA MEDICA - By William BOERICKE</title>"
    title, _ = extract_title(html, "NUX VOMICA Poison-nut Mind.--Irritable.")

    assert title == "NUX VOMICA"
