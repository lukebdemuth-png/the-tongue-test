import json
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import ingest_charaka
import ingest_ashtanga_hridayam
import ingest_organon
import ingest_huangdi_neijing
import ingest_sushruta
from ingest_charaka import REQUIRED_METADATA, run_pipeline


def create_sample_pdf(path: Path) -> None:
    document = fitz.open()
    page_one = document.new_page()
    page_one.insert_text(
        (72, 72),
        "Sutra Sthana Chapter 1: Longevity. Ayurveda teaches careful observation.",
    )
    page_two = document.new_page()
    page_two.insert_text(
        (72, 72),
        "This page continues the source text. It has enough text for a chunk.",
    )
    document.save(path)
    document.close()


def test_pipeline_creates_expected_files(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "source.pdf"
    create_sample_pdf(sample_pdf)

    outputs = run_pipeline(root=tmp_path, source_url=sample_pdf.as_uri(), use_ocr=False)

    assert outputs["raw_pdf"].exists()
    assert outputs["extracted_text"].exists()
    assert outputs["clean_markdown"].exists()
    assert outputs["chunks_jsonl"].exists()
    assert outputs["raw_pdf"].parent == tmp_path / "data" / "raw"


def test_chunks_include_required_metadata(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "source.pdf"
    create_sample_pdf(sample_pdf)

    outputs = run_pipeline(root=tmp_path, source_url=sample_pdf.as_uri(), use_ocr=False)
    lines = outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    chunks = [json.loads(line) for line in lines]

    assert chunks
    first_chunk = chunks[0]
    assert REQUIRED_METADATA.issubset(first_chunk)
    assert first_chunk["book"] == "Charak Samhita with Ayurved Dipika"
    assert first_chunk["school"] == "Ayurveda"
    assert first_chunk["volume"] == "Vol. 1"
    assert first_chunk["translator_authors"] == ["Ram Karan Sharma", "Vaidya Bhagvan Dash"]
    assert first_chunk["source_url"] == sample_pdf.as_uri()
    assert first_chunk["page_start"] <= first_chunk["page_end"]
    assert first_chunk["section"] == "Sutra Sthana"
    assert first_chunk["chapter"].startswith("Chapter 1")
    assert "Ayurveda" in first_chunk["text"]


def test_ocr_pipeline_preserves_page_numbers_and_logs_confidence(tmp_path: Path, monkeypatch) -> None:
    sample_pdf = tmp_path / "source.pdf"
    create_sample_pdf(sample_pdf)

    def fake_ocr_page(page, engine="auto", dpi=300):
        page_number = page.number + 1
        return (
            f"Sutra Sthana Chapter {page_number}. Ayurveda commentary page {page_number}.",
            91.5,
            "tesseract",
        )

    monkeypatch.setattr(ingest_charaka, "ocr_page", fake_ocr_page)

    outputs = run_pipeline(root=tmp_path, source_url=sample_pdf.as_uri(), use_ocr=True)
    raw_text = outputs["extracted_text"].read_text(encoding="utf-8")
    logs = [json.loads(line) for line in outputs["ocr_confidence_log"].read_text(encoding="utf-8").splitlines()]
    chunks = [json.loads(line) for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()]

    assert "[[PAGE 1]]" in raw_text
    assert "[[OCR_CONFIDENCE 91.5]]" in raw_text
    assert logs[0]["page"] == 1
    assert logs[0]["engine"] == "tesseract"
    assert logs[0]["ocr_confidence"] == 91.5
    assert chunks[0]["page_start"] == 1
    assert chunks[0]["english_text"]


def test_ashtanga_pipeline_creates_expected_files(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "source.pdf"
    create_sample_pdf(sample_pdf)

    outputs = ingest_ashtanga_hridayam.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )

    assert outputs["raw_pdf"] == tmp_path / "data" / "raw" / "ashtanga_hridayam.pdf"
    assert outputs["extracted_text"].exists()
    assert outputs["clean_markdown"].exists()
    assert outputs["chunks_jsonl"].exists()


def test_ashtanga_chunks_include_required_metadata(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "source.pdf"
    create_sample_pdf(sample_pdf)

    outputs = ingest_ashtanga_hridayam.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )
    chunks = [
        json.loads(line)
        for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    ]

    assert chunks
    first_chunk = chunks[0]
    assert ingest_ashtanga_hridayam.REQUIRED_METADATA.issubset(first_chunk)
    assert first_chunk["book"] == "Ashtanga Hridayam"
    assert first_chunk["school"] == "Ayurveda"
    assert first_chunk["translator_author"] == "K. R. Srikantha Murthy"
    assert first_chunk["source_url"] == sample_pdf.as_uri()
    assert first_chunk["page_start"] <= first_chunk["page_end"]
    assert first_chunk["section"] == "Sutra Sthana"
    assert first_chunk["chapter"].startswith("Chapter 1")
    assert "Ayurveda" in first_chunk["text"]


def test_ashtanga_uses_ocr_only_when_embedded_text_fails(tmp_path: Path, monkeypatch) -> None:
    sample_pdf = tmp_path / "source.pdf"
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "x")
    document.save(sample_pdf)
    document.close()

    def fake_ocr_page(page, engine="auto", dpi=300):
        return (
            "Sutra Sthana Chapter 2. Ayurveda text recovered by OCR fallback.",
            88.0,
            "tesseract",
        )

    monkeypatch.setattr(ingest_ashtanga_hridayam, "ocr_page", fake_ocr_page)

    outputs = ingest_ashtanga_hridayam.run_pipeline(root=tmp_path, source_url=sample_pdf.as_uri())
    raw_text = outputs["extracted_text"].read_text(encoding="utf-8")
    chunks = [
        json.loads(line)
        for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    ]

    assert "[[OCR_CONFIDENCE 88.0]]" in raw_text
    assert chunks[0]["chapter"].startswith("Chapter 2")
    assert "OCR fallback" in chunks[0]["text"]


def create_organon_sample_pdf(path: Path) -> None:
    document = fitz.open()
    page_one = document.new_page()
    page_one.insert_text(
        (72, 72),
        "ORGANON OF MEDICINE\n§ 1 The physician's high and only mission is to restore the sick to health.",
    )
    page_two = document.new_page()
    page_two.insert_text(
        (72, 72),
        "§ 2 The highest ideal of cure is rapid, gentle, and permanent restoration of health.",
    )
    document.save(path)
    document.close()


def test_organon_pipeline_creates_expected_files(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "organon.pdf"
    create_organon_sample_pdf(sample_pdf)

    outputs = ingest_organon.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_archive_full_text=False,
        use_ocr_fallback=False,
    )

    assert outputs["raw_pdf"] == tmp_path / "data" / "raw" / "organon_medicine.pdf"
    assert outputs["extracted_text"].exists()
    assert outputs["clean_markdown"].exists()
    assert outputs["chunks_jsonl"].exists()


def test_organon_chunks_include_aphorism_metadata(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "organon.pdf"
    create_organon_sample_pdf(sample_pdf)

    outputs = ingest_organon.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_archive_full_text=False,
        use_ocr_fallback=False,
    )
    chunks = [
        json.loads(line)
        for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    ]

    assert len(chunks) == 2
    first_chunk = chunks[0]
    assert ingest_organon.REQUIRED_METADATA.issubset(first_chunk)
    assert first_chunk["book"] == "Organon of Medicine"
    assert first_chunk["author"] == "Samuel Hahnemann"
    assert first_chunk["school"] == "Classical Homeopathy"
    assert first_chunk["edition"] == "5th and 6th edition"
    assert first_chunk["translator_authors"] == ["R. E. Dudgeon", "William Boericke"]
    assert first_chunk["source_url"] == sample_pdf.as_uri()
    assert first_chunk["aphorism_number"] == "1"
    assert first_chunk["page_start"] == 1
    assert first_chunk["page_end"] == 1
    assert chunks[1]["aphorism_number"] == "2"
    assert chunks[1]["page_start"] == 2


def create_huangdi_sample_pdf(path: Path) -> None:
    document = fitz.open()
    page_one = document.new_page()
    page_one.insert_text(
        (72, 72),
        "Chapter 1: Discourse on Heavenly Truth in Antiquity. The Yellow Emperor asks about ancient people.",
    )
    page_two = document.new_page()
    page_two.insert_text(
        (72, 72),
        "Chapter 2: Discourse on the Great Treatise. Yin and yang are discussed in detail.",
    )
    document.save(path)
    document.close()


def test_huangdi_pipeline_creates_expected_files(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "huangdi.pdf"
    create_huangdi_sample_pdf(sample_pdf)

    outputs = ingest_huangdi_neijing.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )

    assert outputs["raw_pdf"] == tmp_path / "data" / "raw" / "huangdi_neijing.pdf"
    assert outputs["extracted_text"].exists()
    assert outputs["clean_markdown"].exists()
    assert outputs["chunks_jsonl"].exists()


def test_sushruta_pipeline_creates_expected_files(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "sushruta.pdf"
    create_sample_pdf(sample_pdf)

    outputs = ingest_sushruta.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )

    assert outputs["raw_pdf"] == tmp_path / "data" / "raw" / "sushruta_samhita_vol1.pdf"
    assert outputs["extracted_text"].exists()
    assert outputs["clean_markdown"].exists()
    assert outputs["chunks_jsonl"].exists()


def test_sushruta_chunks_include_required_metadata(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "sushruta.pdf"
    create_sample_pdf(sample_pdf)

    outputs = ingest_sushruta.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )
    chunks = [
        json.loads(line)
        for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    ]

    assert chunks
    first_chunk = chunks[0]
    assert ingest_sushruta.REQUIRED_METADATA.issubset(first_chunk)
    assert first_chunk["book"] == "Sushruta Samhita"
    assert first_chunk["school"] == "Ayurveda"
    assert first_chunk["volume"] == "Vol. 1 - Sutrasthanam"
    assert first_chunk["author"] == "Sushruta"
    assert first_chunk["translator_author"] == "Kaviraj Kunja Lal Bhishagratna"
    assert first_chunk["source_url"] == sample_pdf.as_uri()
    assert first_chunk["page_start"] <= first_chunk["page_end"]


def test_huangdi_chunks_include_discourse_metadata(tmp_path: Path) -> None:
    sample_pdf = tmp_path / "huangdi.pdf"
    create_huangdi_sample_pdf(sample_pdf)

    outputs = ingest_huangdi_neijing.run_pipeline(
        root=tmp_path,
        source_url=sample_pdf.as_uri(),
        use_ocr_fallback=False,
    )
    chunks = [
        json.loads(line)
        for line in outputs["chunks_jsonl"].read_text(encoding="utf-8").splitlines()
    ]

    assert len(chunks) == 2
    first_chunk = chunks[0]
    assert ingest_huangdi_neijing.REQUIRED_METADATA.issubset(first_chunk)
    assert first_chunk["book"] == "Huang Di Nei Jing Su Wen"
    assert first_chunk["school"] == "Traditional Chinese Medicine"
    assert first_chunk["translator_authors"] == ["Paul U. Unschuld", "Hermann Tessenow"]
    assert first_chunk["source_url"] == sample_pdf.as_uri()
    assert first_chunk["language"] == "English translation"
    assert first_chunk["discourse"].startswith("Chapter 1")
    assert first_chunk["page_start"] == 1
    assert first_chunk["page_end"] == 1
    assert chunks[1]["discourse"].startswith("Chapter 2")
    assert chunks[1]["page_start"] == 2
