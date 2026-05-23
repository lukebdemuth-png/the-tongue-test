from src.ingest_homeoint_kent import content_links, parse_html, remedy_abbreviations, rubric_rows


def test_content_links_extract_selected_sections() -> None:
    html = """
    <table>
      <tr><td><a href="kent0000.htm#P1">1</a></td><td>Mind</td></tr>
      <tr><td><a href="../kentrep3/kent1230.htm#P1234">1234</a></td><td>Sleep</td></tr>
    </table>
    """

    links = content_links(html, {"Mind", "Sleep"})

    assert {item["section"] for item in links} == {"Mind", "Sleep"}
    assert links[0]["url"].endswith("kent0000.htm#P1")


def test_remedy_abbreviations_extracts_kent_abbreviations() -> None:
    remedies = remedy_abbreviations("night : Ars., lyc., Nux-v., phos., Puls.")

    assert remedies == ["ars", "lyc", "nux-v", "phos", "puls"]


def test_rubric_rows_preserve_nested_rubric_path() -> None:
    html = """
    <dir><dir>
      <p><a href="index.htm">KENT</a></p>
      <p>SLEEP</p>
      <p>SLEEP p. 1234</p>
      <p><b>DISTURBED</b> : Acon., Ars., Lyc.</p>
      <dir>
        <p>hunger : Abies-n., chin., Lyc.</p>
      </dir>
    </dir></dir>
    """
    paragraphs, _ = parse_html(html)

    rows = rubric_rows(paragraphs, "Sleep", "http://example.test/kent1230.htm")

    assert rows[0]["rubric_path"] == "DISTURBED"
    assert rows[1]["rubric_path"] == "DISTURBED > hunger"
    assert rows[1]["remedy_abbreviations"] == ["abies-n", "chin", "lyc"]
