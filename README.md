# Holistic Medicine Research Ingestion

Python ingestion project for processing public-domain and open-access holistic medicine sources into clean text, metadata-rich JSONL chunks, indexes, and reasoning-oriented maps.

Start with [docs/PROJECT_MASTER.md](docs/PROJECT_MASTER.md). It consolidates the product goal, canon, source inventory, ingestion rules, retrieval schema, ranking logic, safety rules, and next milestones. The current Homeopathy and Ayurveda core book set lives in [docs/CORE_BOOK_CANON.md](docs/CORE_BOOK_CANON.md). Supporting detail remains in [docs/MASTER_CANON.md](docs/MASTER_CANON.md), [docs/PROJECT_BLUEPRINT.md](docs/PROJECT_BLUEPRINT.md), and [docs/APP_SCHEMA_AND_RETRIEVAL_PLAN.md](docs/APP_SCHEMA_AND_RETRIEVAL_PLAN.md).

The first concrete reasoning design for the app brain lives in [docs/APP_BRAIN_ARCHITECTURE.md](docs/APP_BRAIN_ARCHITECTURE.md).

Treatment-category ranking and practitioner review priority logic lives in [docs/TREATMENT_DISCERNMENT_LOGIC.md](docs/TREATMENT_DISCERNMENT_LOGIC.md).

Case-study evidence strategy lives in [docs/CASE_STUDY_EVIDENCE_PLAN.md](docs/CASE_STUDY_EVIDENCE_PLAN.md).

Practitioner treatment-plan and client teaching output design lives in [docs/TREATMENT_PLAN_OUTPUT_DESIGN.md](docs/TREATMENT_PLAN_OUTPUT_DESIGN.md).

The formal practitioner output contract lives in [schemas/pattern_app_output.schema.json](schemas/pattern_app_output.schema.json). The current brain trace returns both a transparent debug trace and a `practitioner_output` object shaped for the final app.

The core product workflow is practitioner-facing: a practitioner enters one unified intake with symptoms, signs, constitution/context, safety context, and relevant notes. In the background the app derives separate Ayurveda, Traditional Chinese Medicine, and Homeopathy evaluation packets, scores each tradition separately, then puts a digestible cross-tradition outcome first. Separate modality reasoning, source citations, confidence levels, safety notes, and treatment categories remain available for review. Outputs are educational research support, not medical diagnosis or prescription.

The app uses a separate communication-style layer so retrieved medical content is explained clearly, calmly, and without overclaiming.

Canonical research traditions are Ayurveda, Yoga, TCM, Qigong, Homeopathy, and Integrative medicine.

## Side Tool: ChatGPT Carousel Manager

This repo also includes a small side workflow tool for Luke's ChatGPT image/carousel work. It stores a locked carousel style, approved slide states, rejection logs, and generates strict copy/paste-ready image edit prompts so ChatGPT does not drift between carousel slides.

Docs: [docs/CHATGPT_CAROUSEL_MANAGER.md](docs/CHATGPT_CAROUSEL_MANAGER.md)

For final, deterministic Instagram stills, use the local composer instead of asking ChatGPT to do precise layout edits:

Docs: [docs/IG_CAROUSEL_COMPOSER.md](docs/IG_CAROUSEL_COMPOSER.md)

```bash
scripts/ig_carousel_composer.sh sample carousel_composer.example.json
scripts/ig_carousel_composer.sh render carousel_composer.example.json
```

Example:

```bash
python3 src/carousel_manager.py wizard
```

Simpler bash wrapper:

```bash
scripts/chatgpt_carousel_manager.sh
```

Run it with no arguments for a guided batch prompt creator. It writes one prompt file per still to `carousel_prompts/<carousel-name>/`.

## Ingestion And Ranking System

The purpose of this repo is not only to collect information. Sources are organized so a downstream app can compare patterns, rank likelihood, detect contradictions, and explain confidence across Ayurveda, TCM, Homeopathy, Yoga, Qigong, and Integrative medicine.

Source priority hierarchy:

1. Classical authoritative texts
2. Peer-reviewed case reports and clinical studies
3. Practitioner methodology papers
4. Structured databases
5. Intake forms and diagnostic questionnaires
6. Teacher lectures and transcripts
7. General educational articles

Every ingested source should include source URL, title, author/authors, publication/source, date, tradition, source type, access status, retrieval date, summary, extracted concepts, symptom clusters, diagnosis/pattern, intervention, outcome, limitations, and confidence language.

Every source also gets a scoring block:

- `authority_score`
- `relevance_score`
- `clinical_reasoning_value`
- `pattern_recognition_value`
- `outcome_tracking_value`
- `legal_access_status`
- `confidence_level`

Schemas live in:

- `sources/metadata/metadata_schema.json`
- `sources/metadata/source_scoring_schema.json`
- `sources/metadata/pattern_app_source_registry.json`

Normalize existing core chunks to the Pattern App metadata contract:

```bash
python3 src/normalize_pattern_chunks.py
```

This writes per-source normalized chunks to `data/chunks/normalized/` and a combined retrieval file at `data/chunks/pattern_app_core_chunks.jsonl`.

Validate normalized chunks and run the first retrieval prototype:

```bash
python3 src/pattern_app_validate.py
python3 src/pattern_app_retrieval.py "sleep digestion breath" --app-output
```

Check source coverage and remaining canon gaps:

```bash
python3 src/pattern_app_source_report.py
```

Run the prototype from a structured practitioner intake JSON file:

```bash
python3 src/pattern_app_intake.py examples/intake_sleep_digestion.json
```

Run the transparent brain trace prototype:

```bash
python3 src/pattern_app_brain.py examples/intake_sleep_digestion.json
```

The current prototype includes source-backed Homeopathy treatment-direction layers from Boericke/Homeoint and selected Kent repertory/Homeoint sections. It can surface remedy differentials, rubric clusters, Kent cross-support, citations, source snippets, confidence scores, and practitioner-review warnings.

Ayurveda now has a first-pass pattern-to-treatment category engine. It uses the hidden Ayurveda packet to infer vata/pitta/kapha, agni, ama, sleep, appetite, digestion, and energy tags, then produces cited practitioner-review categories for diet, lifestyle, gentle yoga/breath, herbs, and formulas. Specific herbs and formulas remain held until Dravyaguna/materia medica and contraindication support are stronger.

TCM herbs/formulas are still category-level until formula and materia medica sources are ingested and safety-checked.

Run the local browser prototype:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/pattern-app
```

The browser prototype now supports a simple practitioner intake form. Minimum useful input is a chief complaint plus primary symptoms; stronger results come from adding duration, severity, better/worse modalities, digestion, sleep, energy, mood, medications, pregnancy status, known conditions, and optional Ayurveda/TCM/Homeopathy notes.

Current Pattern App prototype behavior:

- one visible intake form
- hidden Ayurveda, TCM, and Homeopathy evaluation packets
- progressive intake state with minimum/deepening missing fields
- cross-tradition outcome first
- tradition weighting percentages based on source-supported relevance
- practitioner-review treatment plan draft
- contraindication review notes from medication, pregnancy, condition, and missing-context signals
- collapsible reasoning details and citation viewer

Example safety and testing intakes:

```bash
python3 src/pattern_app_brain.py examples/intake_medication_caution.json
python3 src/pattern_app_brain.py examples/intake_red_flag.json
```

Safety rules:

- Do not bypass paywalls or logins.
- Respect robots.txt and use rate limits.
- Collect open-access material only.
- Prefer APIs where available.
- Preserve citations, identifiers, and source metadata.
- Keep metadata and links only when full text is not legally available.

## Intake Methodology Layer

Priority Ayurveda intake and questionnaire sources are tracked in `sources/metadata/intake_priority_sources.jsonl`. Derived outputs include:

- `sources/metadata/standardized_intake_schema.json`
- `sources/metadata/symptom_ontology.json`
- `sources/metadata/question_priority_ranking.json`
- `sources/metadata/cross_tradition_intake_map.json`
- `sources/metadata/intake_pattern_relationships.json`

The intake ingest extracts structure rather than copying full form text into git outputs:

```bash
python src/research_ingest_intake_sources.py --output-dir sources/metadata/intake_methodology --download-dir sources/raw/intake_methodology
```

Use intake forms to derive question ordering, symptom categories, severity scales, constitutional questions, digestion/sleep/elimination questions, emotional-state questions, follow-up structures, medication/history sections, and lifestyle sections. Use open-access computational Ayurveda research sources to derive questionnaire structures, dosha classification logic, computational reasoning methods, scoring systems, and classification methodology.

## Reasoning Framework

The first reasoning framework lives in `reasoning/`:

- `pattern_scoring.md`
- `safety_overrides.md`
- `confidence_levels.md`
- `question_sequencing.md`
- `cross_tradition_mapping.md`

The ranking order is safety override, pattern match score, symptom strength, source support, cross-tradition agreement, contradiction detection, missing-information penalty, and root-cause explanatory power. Standard outputs include best-fit interpretation, supporting evidence, contradictions, missing questions, confidence level, source citations, and next best question.

The first pipeline ingests Volume 1 of *Charak Samhita with Ayurved Dipika*, translated/authored by Ram Karan Sharma and Vaidya Bhagvan Dash, from Internet Archive.

The second pipeline ingests *Ashtanga Hridayam*, translated/authored by K. R. Srikantha Murthy, from Internet Archive.

The third pipeline ingests *Organon of Medicine*, by Samuel Hahnemann, with R. E. Dudgeon and William Boericke as translator/authors, from the Archive.org item `organonofmedicin0000hahn`.

The fourth pipeline ingests *Huang Di Nei Jing Su Wen*, translated/authored by Paul U. Unschuld and Hermann Tessenow, from Internet Archive.

The fifth pipeline ingests *Sushruta Samhita, Volume 1 - Sutrasthanam*, edited/translated by Kaviraj Kunja Lal Bhishagratna, from the local/Archive.org scan.

## Project Layout

```text
data/
  raw/          # downloaded source PDFs
  extracted/    # raw extracted text
  clean/        # cleaned markdown text
  chunks/       # JSONL chunks for downstream indexing
src/
  ingest_charaka.py
  ingest_ashtanga_hridayam.py
  ingest_organon.py
  ingest_huangdi_neijing.py
  ingest_sushruta.py
  research_ingestion/       # open-access research ingestion helpers
  research_search.py
  research_ingest_pmc.py
  research_ingest_homeopathy.py
  research_ingest_jish.py
  research_ingest_intake_sources.py
  research_ingest_pubmed_case_reasoning.py
  research_ingest.py
  research_download_open_access.py
  research_pdf_to_markdown.py
  research_clean_transcripts.py
  research_chunk_documents.py
  research_generate_jsonl.py
  research_tag_symptoms.py
  research_extract_relationships.py
  research_build_index.py
sources/
  raw/
  processed/
  classical/
  journals/
  case_studies/
  databases/
  lectures/
  transcripts/
  qigong/
  tcm/
  ayurveda/
  intake_forms/
  metadata/
indexes/
chunks/
logs/
tests/
  test_ingestion.py
  test_research_ingestion.py
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## OCR Setup

The Charaka PDF is scanned, so the default Charaka pipeline OCRs every page. The Ashtanga Hridayam and Huang Di Nei Jing pipelines extract embedded text first and use OCR only for pages where embedded text extraction fails. The Organon pipeline reads downloadable Archive.org metadata, downloads a PDF asset, prefers embedded PDF text, then falls back to Archive full text OCR assets, then local OCR from the downloaded PDF only if necessary. The scripts try OCR engines in this order when run with `--ocr-engine auto`:

1. PaddleOCR, if installed
2. Tesseract through `pytesseract`
3. PyMuPDF OCR, if local Tesseract/tessdata is available to PyMuPDF

For Tesseract on macOS:

```bash
brew install tesseract
pip install -r requirements.txt
```

For PaddleOCR:

```bash
pip install paddleocr paddlepaddle
```

PaddleOCR can be slower to install but usually performs better on complex scans. Tesseract is simpler and works well for many English OCR jobs.

## Run The Charaka Pipeline

```bash
python src/ingest_charaka.py
```

This creates:

- `data/raw/charaka_vol1.pdf`
- `data/extracted/charaka_vol1_raw.txt`
- `data/extracted/charaka_vol1_ocr_confidence.jsonl`
- `data/clean/charaka_vol1.md`
- `data/chunks/charaka_vol1_chunks.jsonl`

To force a fresh PDF download:

```bash
python src/ingest_charaka.py --force-download
```

To limit pages during development:

```bash
python src/ingest_charaka.py --max-pages 25
```

To choose an OCR engine:

```bash
python src/ingest_charaka.py --ocr-engine tesseract
python src/ingest_charaka.py --ocr-engine paddle
```

For born-digital PDFs with an embedded text layer:

```bash
python src/ingest_charaka.py --no-ocr
```

## Run The Ashtanga Hridayam Pipeline

```bash
python src/ingest_ashtanga_hridayam.py
```

This creates:

- `data/raw/ashtanga_hridayam.pdf`
- `data/extracted/ashtanga_hridayam_raw.txt`
- `data/clean/ashtanga_hridayam.md`
- `data/chunks/ashtanga_hridayam_chunks.jsonl`

To force a fresh PDF download:

```bash
python src/ingest_ashtanga_hridayam.py --force-download
```

To limit pages during development:

```bash
python src/ingest_ashtanga_hridayam.py --max-pages 25
```

To choose the fallback OCR engine:

```bash
python src/ingest_ashtanga_hridayam.py --ocr-engine tesseract
python src/ingest_ashtanga_hridayam.py --ocr-engine paddle
```

To disable OCR fallback and use only embedded text:

```bash
python src/ingest_ashtanga_hridayam.py --no-ocr-fallback
```

## Run The Organon Pipeline

```bash
python src/ingest_organon.py
```

This creates:

- `data/raw/organon_medicine.pdf`
- `data/extracted/organon_raw.txt`
- `data/clean/organon.md`
- `data/chunks/organon_chunks.jsonl`

To force a fresh PDF download:

```bash
python src/ingest_organon.py --force-download
```

To limit pages during development:

```bash
python src/ingest_organon.py --max-pages 25
```

To skip Archive full text and use PDF extraction/OCR:

```bash
python src/ingest_organon.py --no-archive-full-text
```

The Organon script uses Archive.org `/metadata` and `/download` assets. It does not scrape the page viewer.

To choose the fallback OCR engine:

```bash
python src/ingest_organon.py --ocr-engine tesseract
python src/ingest_organon.py --ocr-engine paddle
```

## Run The Huang Di Nei Jing Pipeline

```bash
python src/ingest_huangdi_neijing.py
```

This creates:

- `data/raw/huangdi_neijing.pdf`
- `data/extracted/huangdi_neijing_raw.txt`
- `data/clean/huangdi_neijing.md`
- `data/chunks/huangdi_neijing_chunks.jsonl`

To force a fresh PDF download:

```bash
python src/ingest_huangdi_neijing.py --force-download
```

To limit pages during development:

```bash
python src/ingest_huangdi_neijing.py --max-pages 25
```

To choose the fallback OCR engine:

```bash
python src/ingest_huangdi_neijing.py --ocr-engine tesseract
python src/ingest_huangdi_neijing.py --ocr-engine paddle
```

To disable OCR fallback and use only embedded text:

```bash
python src/ingest_huangdi_neijing.py --no-ocr-fallback
```

The Huang Di Nei Jing PDF contains many image-heavy divider pages. By default, the pipeline skips OCR on totally empty or very short embedded-text pages to avoid spending most of its time on non-body pages. To OCR those too:

```bash
python src/ingest_huangdi_neijing.py --ocr-empty-pages --min-ocr-text-chars 0
```

## Run The Sushruta Pipeline

```bash
python src/ingest_sushruta.py --no-ocr-fallback
```

This creates:

- `data/raw/sushruta_samhita_vol1.pdf`
- `data/extracted/sushruta_samhita_vol1_raw.txt`
- `data/clean/sushruta_samhita_vol1.md`
- `data/chunks/sushruta_samhita_vol1_chunks.jsonl`

The current baseline uses the embedded OCR text layer from the 1907 scan. Use OCR fallback only for a later page-quality pass:

```bash
python src/ingest_sushruta.py --ocr-engine tesseract
```

## Output Chunk Shape

Each Charaka JSONL row includes provenance and page range metadata:

```json
{
  "book": "Charak Samhita with Ayurved Dipika",
  "school": "Ayurveda",
  "volume": "Vol. 1",
  "translator_authors": ["Ram Karan Sharma", "Vaidya Bhagvan Dash"],
  "source_url": "https://dn721604.ca.archive.org/0/items/JTrz_charak-samhita-with-ayurved-dipika-of-ram-karan-sharma-by-vaidya-bhagvan-dash-vol.-1-chaukhambh/Charak%20Samhita%20with%20Ayurved%20Dipika%20of%20Ram%20Karan%20Sharma%20by%20Vaidya%20Bhagvan%20Dash%20Vol.%201%20-%20Chaukhambha.pdf",
  "page_start": 41,
  "page_end": 42,
  "section": "Sutra Sthana",
  "chapter": "Chapter 1: Longevity",
  "sanskrit_text": "atha ato dirgham jivitiyam adhyayam vyakhyasyamah",
  "english_text": "We shall now expound the chapter on the quest for longevity...",
  "text": "atha ato dirgham jivitiyam adhyayam vyakhyasyamah We shall now expound the chapter on the quest for longevity..."
}
```

OCR confidence is logged per page in `data/extracted/charaka_vol1_ocr_confidence.jsonl`.

Each Ashtanga Hridayam JSONL row includes:

```json
{
  "book": "Ashtanga Hridayam",
  "school": "Ayurveda",
  "translator_author": "K. R. Srikantha Murthy",
  "source_url": "https://ia800502.us.archive.org/0/items/AstangaHrdayam.Eng/Astanga-hrdayam.%20Eng.pdf",
  "page_start": 12,
  "page_end": 13,
  "section": "Sutra Sthana",
  "chapter": "Chapter 1",
  "text": "..."
}
```

Each Organon JSONL row is chunked by aphorism where possible and includes:

```json
{
  "book": "Organon of Medicine",
  "author": "Samuel Hahnemann",
  "school": "Classical Homeopathy",
  "edition": "5th and 6th edition",
  "translator_authors": ["R. E. Dudgeon", "William Boericke"],
  "source_url": "https://archive.org/details/organonofmedicin0000hahn/page/n9/mode/2up",
  "aphorism_number": "1",
  "page_start": 31,
  "page_end": 31,
  "text": "§ 1 ..."
}
```

Each Huang Di Nei Jing Su Wen JSONL row is chunked by discourse/chapter where possible and includes:

```json
{
  "book": "Huang Di Nei Jing Su Wen",
  "school": "Traditional Chinese Medicine",
  "translator_authors": ["Paul U. Unschuld", "Hermann Tessenow"],
  "source_url": "https://ia903101.us.archive.org/8/items/HuangDiNeiJingSuWen/Huang%20Di%20Nei%20jing%20su%20wen.pdf",
  "language": "English translation",
  "discourse": "Chapter 1: Discourse on ...",
  "page_start": 42,
  "page_end": 51,
  "text": "..."
}
```

## Public Research Ingestion

The research layer collects open-access metadata, abstracts, permitted links, public transcripts, and PDFs where legally allowed. It respects robots.txt for web fetches, uses modest rate limits, never bypasses login or paywalls, and prefers APIs where available. PubMed and PMC should be reached through NCBI E-utilities and public PMC assets before any direct web fetching.

Seed files live in `sources/metadata/`:

- `source_manifest.json` lists the allowed sources, access mode, and compliance notes.
- `high_priority_sources.jsonl` tracks priority architecture and reasoning sources.
- `homeopathy_source_manifest.json`, `homeopathy_tags.json`, and `homeopathy_sample_records.jsonl` define the homeopathy ingestion lane.
- `traditions.json` defines the canonical tradition taxonomy and aliases.
- `metadata_schema.json` defines the normalized research record shape.
- `search_terms.txt` contains the initial focus terms.
- `sample_records.jsonl`, `sample_chunks.jsonl`, and `master_source_index.json` provide a small processed fixture for downstream retrieval work.
- `error_log.jsonl` records failed or blocked downloads.

The normalized research record includes:

```json
{
  "title": "Sample qigong clinical trial metadata",
  "authors": ["Example Author"],
  "publication": "Sample Open Research Metadata",
  "date": "2024",
  "abstract": "...",
  "keywords": ["qigong", "sleep", "stress"],
  "symptoms": ["insomnia", "stress"],
  "interventions": ["breathing", "qigong"],
  "outcomes": ["reduced", "sleep quality"],
  "confidence_language": ["may", "associated with"],
  "tradition": ["Qigong"],
  "source_url": "https://example.org/sample-qigong-trial",
  "retrieval_date": "2026-05-18"
}
```

The main workflow scripts are:

```bash
python src/research_search.py --retmax 10 --output sources/metadata/pubmed_search_results.jsonl
python src/research_ingest_pmc.py --pmcid PMC11874735 --high-priority-ayurcel --output sources/metadata/ayurcel_pmc11874735.jsonl
python src/research_ingest_homeopathy.py --input sources/metadata/homeopathy_sample_records.jsonl --output sources/metadata/homeopathy_records.jsonl
python src/research_ingest_jish.py --output sources/metadata/jish_current_issue.jsonl
python src/research_ingest_pubmed_case_reasoning.py --output-dir sources/metadata/pubmed_case_reasoning --retmax-per-term 500 --max-pmc-full-text 40 --clear-error-log
python src/research_ingest.py --input sources/metadata/pubmed_search_results.jsonl --output sources/metadata/research_records.jsonl
python src/research_download_open_access.py --input sources/metadata/research_records.jsonl
python src/research_pdf_to_markdown.py --input sources/metadata/downloads --output sources/metadata/markdown
python src/research_clean_transcripts.py --input sources/transcripts/raw.txt --output sources/transcripts/clean.txt
python src/research_chunk_documents.py --input sources/metadata/research_records.jsonl --output sources/metadata/research_chunks.jsonl
python src/research_generate_jsonl.py --input sources/metadata/research_records.jsonl --records-output sources/metadata/processed_records.jsonl --chunks-output sources/metadata/retrieval_chunks.jsonl
python src/research_tag_symptoms.py --input sources/metadata/processed_records.jsonl --output sources/metadata/tagged_records.jsonl
python src/research_extract_relationships.py --input sources/metadata/tagged_records.jsonl --output sources/metadata/intervention_outcome_relationships.jsonl
python src/research_build_index.py --records sources/metadata/tagged_records.jsonl --chunks sources/metadata/retrieval_chunks.jsonl --output sources/metadata/master_source_index.json
```

Rule-based tagging currently identifies symptom clusters, intervention terms, outcome language, confidence language, and broad tradition labels. This is intentionally conservative: it supports retrieval and review, but it does not diagnose, rank treatments, or make clinical claims.

### Homeopathy Ingestion

Homeopathy source support covers public/open-access materia medica, repertories, clinical case studies, remedy relationship systems, historical journals, pharmacopoeias, and practitioner writings. The primary public source lanes are Archive.org, HathiTrust public-domain/full-view records, and Project Gutenberg public-domain ebooks.

The homeopathy metadata path focuses on symptom-pattern relationships, remedy relationships, intervention sequencing, constitutional descriptions, case reasoning, and differential remedy logic. Retrieval tags include `homeopathy`, `materia medica`, `repertory`, `constitutional pattern`, `remedy relationship`, `symptom cluster`, and `intervention outcome`.

JISH, the Journal of Integrated Standardized Homoeopathy, is tracked as a high-priority current-issue source for case reports, standardized case record methodology, practitioner reasoning, follow-up logic, intervention rationale, longitudinal outcomes, practitioner training methods, clinical documentation structures, differential reasoning, and confidence/limitations language. Prioritize JISH articles discussing methodology, structured intake systems, follow-up evaluation, clinical decision frameworks, and practitioner training.

```bash
python src/research_ingest_homeopathy.py --input sources/metadata/homeopathy_sample_records.jsonl --output sources/metadata/homeopathy_records.jsonl
python src/research_ingest_jish.py --output sources/metadata/jish_current_issue.jsonl
python src/research_chunk_documents.py --input sources/metadata/homeopathy_records.jsonl --output sources/metadata/homeopathy_chunks.jsonl
```

As with the rest of the research layer, this support is for source organization and reasoning-context retrieval. It does not convert historical remedy descriptions into clinical recommendations.

### High-Priority Architecture Source

### PubMed/PMC Case Reasoning Search

The PubMed/PMC case reasoning ingest searches NIH/PubMed for Ayurveda, TCM, Homeopathy, and integrative medicine case reports or clinical reasoning papers. It uses PubMed E-utilities for metadata and only pulls PMC full text when a PMCID is present. It writes `records.jsonl`, `chunks.jsonl`, `master_index.json`, `metadata_manifest.json`, `symptom_map.json`, `intervention_outcome_relationships.jsonl`, and `error_log.jsonl`.

```bash
python src/research_ingest_pubmed_case_reasoning.py --output-dir sources/metadata/pubmed_case_reasoning --retmax-per-term 500 --max-pmc-full-text 40 --clear-error-log
```

The resulting records include title, abstract, authors, journal, publication date, PMID, PMCID, DOI, keywords, symptoms, diagnosis/pattern, interventions, outcomes, confidence language, contradictions/limitations, source URL, and retrieval-ready chunks. Increase `--max-pmc-full-text` to enrich more PMCID-backed records with open-access PMC XML full text.

AyurCeL is listed as a high-priority Ayurveda architecture source:

- Title: *AyurCeL: A comprehensive ayurveda clinical E-learning and decision support platform*
- PMCID: `PMC11874735`
- PMID: `39951853`
- DOI: `10.1016/j.jaim.2024.101107`
- URL: `https://pmc.ncbi.nlm.nih.gov/articles/PMC11874735/`

It is tagged for Ayurveda, clinical decision support, e-learning, diagnostic reasoning, clinical reasoning, pattern recognition, practitioner training, and high-priority architecture review. The PMC ingest script preserves abstract, open-access body text, references, terminology, system architecture ideas, decision-support logic, and clinical reasoning framework notes when available in the PMC XML.

## Run Tests

```bash
pytest
```

The tests build a small temporary PDF locally, run the ingestion pipeline against it, and confirm that all expected output files are created and that chunks include the required metadata fields.
