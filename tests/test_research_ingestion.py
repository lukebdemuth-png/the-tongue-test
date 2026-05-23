import json
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from research_ingestion.chunking import chunk_record
from research_ingestion.documents import pdf_to_markdown
from research_ingestion.index import build_master_index
from research_ingestion.nlp_tags import enrich_record, extract_intervention_outcome_relationships
from research_ingestion.pubmed import parse_pmc_article, parse_pubmed_article
from research_ingestion.schema import REQUIRED_RECORD_FIELDS, normalize_record
from research_ingestion.transcripts import clean_transcript
from research_ingest_homeopathy import HOMEOPATHY_TAGS, apply_homeopathy_defaults
from research_ingest_intake_sources import derive_intake_structure, derive_research_methodology, build_static_source_record
from research_ingest_jish import JISH_TAGS, parse_jish_current_issue
from research_ingest_pubmed_case_reasoning import apply_case_reasoning_metadata, build_relationship_map, build_symptom_map
from research_ingest_pmc import AYURCEL_TAGS, apply_ayurcel_priority_metadata


def test_research_record_schema_normalizes_required_fields() -> None:
    record = normalize_record(
        {
            "title": "Qigong and sleep",
            "author": "Example Author",
            "abstract": "Qigong may improve sleep quality.",
            "source_url": "https://example.org/qigong",
        }
    )

    assert set(REQUIRED_RECORD_FIELDS).issubset(record)
    assert record["authors"] == ["Example Author"]
    assert record["title"] == "Qigong and sleep"
    assert record["source_url"] == "https://example.org/qigong"


def test_rule_based_tags_find_symptoms_interventions_outcomes_and_tradition() -> None:
    record = enrich_record(
        normalize_record(
            {
                "title": "Qigong clinical trial",
                "abstract": "Qigong breathing may be associated with reduced stress and improved sleep quality.",
                "source_url": "https://example.org/qigong",
            }
        )
    )

    assert "stress" in record["symptoms"]
    assert "qigong" in record["interventions"]
    assert "sleep quality" in record["outcomes"]
    assert "may" in record["confidence_language"]
    assert "Qigong" in record["tradition"]


def test_chunk_record_creates_embeddings_ready_chunks() -> None:
    record = enrich_record(
        normalize_record(
            {
                "title": "Yoga therapy case study",
                "authors": ["Example Clinician"],
                "publication": "Sample Journal",
                "date": "2024",
                "abstract": "Yoga therapy case report may describe improved chronic pain.",
                "text": "Yoga therapy case report may describe improved chronic pain.\n\nThis sample paragraph keeps the text long enough for chunking.",
                "source_url": "https://example.org/yoga-case",
            }
        )
    )

    chunks = chunk_record(record, max_chars=120)

    assert chunks
    assert chunks[0]["chunk_id"].endswith("-0001")
    assert chunks[0]["source_url"] == "https://example.org/yoga-case"
    assert "chronic pain" in chunks[0]["symptoms"]
    assert "yoga" in chunks[0]["interventions"]
    assert chunks[0]["text"]


def test_extract_intervention_outcome_relationships() -> None:
    record = enrich_record(
        normalize_record(
            {
                "title": "Acupuncture outcome sample",
                "abstract": "Acupuncture may be associated with improved pain score.",
                "source_url": "https://example.org/acupuncture",
            }
        )
    )

    relationships = extract_intervention_outcome_relationships(record)

    assert relationships
    assert relationships[0]["intervention"] == "acupuncture"
    assert any(item["outcome"] == "pain score" for item in relationships)


def test_clean_transcript_removes_timestamps_and_speaker_labels() -> None:
    cleaned = clean_transcript("00:01 Host 1: Welcome.\n\n00:03 Guest 2: Qigong practice starts gently.")

    assert "00:01" not in cleaned
    assert "Host 1:" not in cleaned
    assert "Qigong practice" in cleaned


def test_pdf_to_markdown_preserves_page_markers(tmp_path: Path) -> None:
    pdf_path = tmp_path / "sample.pdf"
    output_path = tmp_path / "sample.md"
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "Sample PubMed Central text about Ayurveda.")
    document.save(pdf_path)
    document.close()

    pdf_to_markdown(pdf_path, output_path)

    markdown = output_path.read_text(encoding="utf-8")
    assert "<!-- page: 1 -->" in markdown
    assert "Ayurveda" in markdown


def test_master_index_summarizes_records_and_chunks() -> None:
    records = [
        {
            "title": "Sample qigong clinical trial metadata",
            "publication": "Sample Open Research Metadata",
            "date": "2024",
            "source_url": "https://example.org/sample-qigong-trial",
            "open_access": True,
            "tradition": ["Qigong"],
        }
    ]
    chunks = [{"chunk_id": "sample-0001"}]

    index = build_master_index(records, chunks)

    assert index["record_count"] == 1
    assert index["chunk_count"] == 1
    assert index["traditions"]["Qigong"] == 1


def test_sample_processed_dataset_has_required_shape() -> None:
    root = Path(__file__).resolve().parents[1]
    rows = [
        json.loads(line)
        for line in (root / "sources" / "metadata" / "sample_records.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    chunks = [
        json.loads(line)
        for line in (root / "sources" / "metadata" / "sample_chunks.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    assert rows
    assert chunks
    assert set(REQUIRED_RECORD_FIELDS).issubset(rows[0])
    assert {"chunk_id", "source_id", "title", "text", "source_url"}.issubset(chunks[0])


def test_pmc_full_text_parser_extracts_references_and_body() -> None:
    import xml.etree.ElementTree as ET

    article = ET.fromstring(
        """
        <article>
          <front>
            <journal-meta><journal-title>Journal of Ayurveda and Integrative Medicine</journal-title></journal-meta>
            <article-meta>
              <article-id pub-id-type="pmid">39951853</article-id>
              <article-id pub-id-type="doi">10.1016/j.jaim.2024.101107</article-id>
              <title-group><article-title>AyurCeL: A comprehensive ayurveda clinical E-learning and decision support platform</article-title></title-group>
              <contrib-group><contrib contrib-type="author"><name><surname>Example</surname><given-names>A.</given-names></name></contrib></contrib-group>
              <pub-date><year>2024</year></pub-date>
              <abstract><p>AyurCeL is an Ayurveda e-learning and clinical decision support platform.</p></abstract>
              <kwd-group><kwd>Ayurveda</kwd><kwd>clinical decision support</kwd></kwd-group>
            </article-meta>
          </front>
          <body>
            <sec>
              <title>System architecture</title>
              <p>The platform describes diagnostic reasoning, pattern recognition, and practitioner training.</p>
            </sec>
          </body>
          <back>
            <ref-list>
              <ref><element-citation><article-title>Reference article</article-title><source>Sample Source</source><year>2020</year><pub-id pub-id-type="doi">10.0000/example</pub-id></element-citation></ref>
            </ref-list>
          </back>
        </article>
        """
    )

    record = parse_pmc_article(article, "PMC11874735")

    assert record["identifiers"]["pmid"] == "39951853"
    assert record["identifiers"]["doi"] == "10.1016/j.jaim.2024.101107"
    assert record["references"][0]["doi"] == "10.0000/example"
    assert "System architecture" in record["text"]


def test_pubmed_parser_extracts_identifiers_and_pmc_link() -> None:
    import xml.etree.ElementTree as ET

    article = ET.fromstring(
        """
        <PubmedArticle>
          <MedlineCitation>
            <PMID>12345</PMID>
            <Article>
              <Journal><Title>Sample Journal</Title><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue></Journal>
              <ArticleTitle>Ayurveda case report with differential diagnosis</ArticleTitle>
              <Abstract><AbstractText>This case report may describe clinical reasoning.</AbstractText></Abstract>
              <AuthorList><Author><LastName>Doe</LastName><ForeName>Jane</ForeName></Author></AuthorList>
              <KeywordList><Keyword>Ayurveda</Keyword></KeywordList>
            </Article>
          </MedlineCitation>
          <PubmedData>
            <ArticleIdList>
              <ArticleId IdType="doi">10.0000/sample</ArticleId>
              <ArticleId IdType="pmc">PMC12345</ArticleId>
            </ArticleIdList>
          </PubmedData>
        </PubmedArticle>
        """
    )

    record = parse_pubmed_article(article)

    assert record["title"] == "Ayurveda case report with differential diagnosis"
    assert record["authors"] == ["Jane Doe"]
    assert record["identifiers"]["pmid"] == "12345"
    assert record["identifiers"]["doi"] == "10.0000/sample"
    assert record["identifiers"]["pmcid"] == "PMC12345"
    assert record["full_text_url"] == "https://pmc.ncbi.nlm.nih.gov/articles/PMC12345/"


def test_ayurcel_priority_metadata_adds_required_tags_and_extractions() -> None:
    record = apply_ayurcel_priority_metadata(
        normalize_record(
            {
                "title": "AyurCeL",
                "text": "The system architecture supports e-learning. Its clinical decision support logic describes diagnostic reasoning and pattern recognition for practitioner training.",
                "source_url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11874735/",
            }
        )
    )

    assert record["priority"] == "high"
    assert set(AYURCEL_TAGS).issubset(record["tags"])
    assert record["identifiers"]["pmcid"] == "PMC11874735"
    assert record["system_architecture_ideas"]
    assert record["decision_support_logic"]
    assert record["clinical_reasoning_frameworks"]


def test_homeopathy_tags_and_relationship_fields_are_extracted() -> None:
    record = apply_homeopathy_defaults(
        enrich_record(
            normalize_record(
                {
                    "title": "Materia medica repertory sample",
                    "text": (
                        "A materia medica remedy picture and repertory rubric describe a symptom totality "
                        "with chill, thirst, and aggravation at night. The constitutional pattern includes "
                        "restlessness. Differential remedy logic compares similar rubrics. A complementary "
                        "remedy follows well, while an antidote relationship is noted after clinical improvement."
                    ),
                    "source_url": "https://example.org/homeopathy",
                }
            )
        )
    )

    assert "Homeopathy" in record["tradition"]
    assert set(HOMEOPATHY_TAGS).intersection(record["terminology"])
    assert "homeopathy" in record["tags"]
    assert "materia medica" in record["tags"]
    assert "repertory" in record["tags"]
    assert "constitutional pattern" in record["tags"]
    assert "remedy relationship" in record["tags"]
    assert "symptom cluster" in record["tags"]
    assert "intervention outcome" in record["tags"]
    assert record["remedy_relationships"]
    assert record["symptom_pattern_relationships"]
    assert record["intervention_sequencing"]
    assert record["constitutional_descriptions"]
    assert record["differential_remedy_logic"]


def test_homeopathy_chunks_preserve_reasoning_metadata() -> None:
    record = apply_homeopathy_defaults(
        enrich_record(
            normalize_record(
                {
                    "title": "Homeopathy case reasoning sample",
                    "text": "Case reasoning uses repertorization and differential remedy logic. The symptom totality includes chill and thirst.",
                    "source_url": "https://example.org/homeopathy-case",
                }
            )
        )
    )

    chunks = chunk_record(record)

    assert chunks
    assert chunks[0]["remedy_relationships"] == record["remedy_relationships"]
    assert chunks[0]["symptom_pattern_relationships"] == record["symptom_pattern_relationships"]
    assert chunks[0]["differential_remedy_logic"] == record["differential_remedy_logic"]


def test_canonical_tradition_aliases_are_normalized() -> None:
    record = enrich_record(
        normalize_record(
            {
                "title": "Mixed tradition sample",
                "tradition": ["Traditional Chinese Medicine", "Classical Homeopathy", "Integrative Medicine"],
                "text": "TCM and homeopathy can appear in an integrative medicine source.",
                "source_url": "https://example.org/mixed",
            }
        )
    )

    assert "TCM" in record["tradition"]
    assert "Homeopathy" in record["tradition"]
    assert "Integrative medicine" in record["tradition"]
    assert "Traditional Chinese Medicine" not in record["tradition"]
    assert "Classical Homeopathy" not in record["tradition"]


def test_case_reasoning_metadata_maps_symptoms_and_relationships() -> None:
    record = apply_case_reasoning_metadata(
        normalize_record(
            {
                "title": "Traditional Chinese Medicine case report",
                "abstract": "A TCM case report discusses syndrome differentiation, insomnia, acupuncture, and improved sleep quality. Limitations include a single case.",
                "source_url": "https://pubmed.ncbi.nlm.nih.gov/1/",
            }
        )
    )

    symptom_map = build_symptom_map([record])
    relationships = build_relationship_map([record])

    assert "TCM" in record["tradition"]
    assert "case study" in record["tags"]
    assert "differential diagnosis" in record["tags"]
    assert record["diagnosis_pattern"]
    assert record["contradictions_limitations"]
    assert "insomnia" in symptom_map
    assert any(item["intervention"] == "acupuncture" and item["outcome"] == "sleep quality" for item in relationships)


def test_jish_current_issue_parser_extracts_high_priority_case_report() -> None:
    html = """
    <html><body>
      <h4>Volume 8 | Issue 3 | September-December 2025</h4>
      <p>Original Article</p>
      <h5><a href="/article/teaching-materia-medica/">Evaluating the efficacy of flipped classroom teaching method in teaching homoeopathic materia medica</a></h5>
      <p>Dhanashree Kulkarni, Bhavik Parekh</p>
      <p><a href="https://dx.doi.org/10.25259/JISH_48_2025">DOI: 10.25259/JISH_48_2025</a></p>
      <p><a href="/article/teaching-materia-medica/">Full text</a> | <a href="/pdf/teaching.pdf">PDF</a></p>
      <p>p.127-134</p>
      <p>Case Report</p>
      <h5><a href="/article/case-report/">Successful discontinuation of levothyroxine through personalised homoeopathic treatment: An evidence-based case report</a></h5>
      <p>Nitin Kumar Saklani, Bhavya Verma</p>
      <p><a href="https://dx.doi.org/10.25259/JISH_6_2025">DOI: 10.25259/JISH_6_2025</a></p>
      <p><a href="/article/case-report/">Full text</a> | <a href="/pdf/case.pdf">PDF</a></p>
      <p>p.143-152</p>
    </body></html>
    """

    records = parse_jish_current_issue(html, "https://jish-mldtrust.com/current-issue/")

    assert len(records) == 2
    training = records[0]
    case_report = records[1]
    assert training["priority"] == "high"
    assert training["identifiers"]["doi"] == "10.25259/JISH_48_2025"
    assert training["pdf_url"] == "https://jish-mldtrust.com/pdf/teaching.pdf"
    assert "practitioner training" in training["tags"]
    assert case_report["priority"] == "high"
    assert case_report["identifiers"]["doi"] == "10.25259/JISH_6_2025"
    assert case_report["pdf_url"] == "https://jish-mldtrust.com/pdf/case.pdf"
    assert "Homeopathy" in case_report["tradition"]
    assert set(JISH_TAGS).issubset(case_report["tags"])


def test_intake_structure_derives_priority_sections_without_raw_text() -> None:
    text = """
    Main concern and reason for visit
    Current medications and supplements
    Digestion appetite gas bloating
    Bowel movements and elimination
    Sleep and dreams
    Stress anxiety mood
    Constitution prakriti vata pitta kapha
    Rate severity on a 0-10 scale
    Follow-up progress and outcome
    """

    derived = derive_intake_structure(text)
    categories = {item["category"] for item in derived}

    assert "chief_concern" in categories
    assert "medications_supplements" in categories
    assert "digestion" in categories
    assert "elimination" in categories
    assert "sleep" in categories
    assert "emotional_state" in categories
    assert "constitution" in categories
    assert "severity_scale" in categories
    assert "follow_up" in categories


def test_research_methodology_derives_computational_ayurveda_fields() -> None:
    text = """
    The Prakriti questionnaire dataset includes items for dosha classification.
    The model uses machine learning classification methodology and scoring labels.
    Evaluation compares classifier performance on vata pitta kapha annotations.
    """

    derived = derive_research_methodology(text)
    categories = {item["category"] for item in derived}

    assert "questionnaire_structures" in categories
    assert "dosha_classification_logic" in categories
    assert "computational_reasoning_methods" in categories
    assert "scoring_systems" in categories
    assert "classification_methodology" in categories


def test_intake_source_record_uses_derived_structure_only() -> None:
    source = {
        "title": "Sample Ayurveda Intake",
        "source_url": "https://example.org/intake.pdf",
        "source_type": "intake_form_pdf",
        "access_status": "public_pdf",
    }
    record = build_static_source_record(source, [{"category": "digestion"}, {"category": "constitution"}])

    assert record["title"] == "Sample Ayurveda Intake"
    assert "Ayurveda" in record["tradition"]
    assert "digestion" in record["extracted_concepts"]
    assert "constitution" in record["diagnosis_pattern"]
    assert "raw copyrighted questionnaire text is not stored" in record["limitations"][0]
