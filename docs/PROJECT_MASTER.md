# Holistic Medicine App Project Master

This is the single starting reference for the project. It consolidates the app purpose, canon, source rules, ingestion standards, retrieval logic, output schema, safety boundaries, communication style, local source inventory, and development milestones. The current core medicine book list is maintained in `docs/CORE_BOOK_CANON.md`.

This repository is not a generic PDF scraper. It is the ingestion and knowledge-architecture foundation for a practitioner-facing holistic medicine research application.

## 1. Product Purpose

A practitioner enters symptoms, signs, constitution/context, modalities, notes, medications, and relevant observations.

The app returns:

1. Ayurveda interpretation
2. Traditional Chinese Medicine interpretation
3. Homeopathy interpretation
4. Cross-tradition synthesis

The app is:

- Educational
- Citation-based
- Practitioner-facing
- Research-oriented
- Built to preserve uncertainty and tradition-specific distinctions

The app is not:

- A diagnostic engine
- A prescribing engine
- A replacement for clinical judgment
- A patient-specific treatment plan generator
- A system for collapsing different traditions into one universal truth

The app ranks source-supported traditional-system relevance, not medical truth or scientific proof.

## 2. Core Output Requirements

Each tradition-specific output must include:

- Likely traditional patterns or remedy directions
- Supporting citations
- Suggested traditional treatment categories
- Herbs/formulas/remedy directions where source-supported
- Lifestyle/practice categories where source-supported
- Confidence scores
- Contraindications and safety notes
- Practitioner review requirements

Outputs must remain separated by tradition first:

- Ayurveda
- TCM
- Homeopathy

Cross-tradition synthesis happens after tradition-specific retrieval.

Never collapse traditions into one truth.

## 3. Minimum Viable App Output Schema

```json
{
  "case_id": "",
  "input_summary": {
    "primary_symptoms": [],
    "secondary_symptoms": [],
    "duration": "",
    "severity": "",
    "constitution_context": "",
    "red_flags_detected": [],
    "missing_information": []
  },
  "ayurveda_analysis": {
    "likely_patterns": [],
    "supporting_citations": [],
    "suggested_categories": {
      "herbs": [],
      "formulas": [],
      "diet": [],
      "lifestyle": [],
      "yoga_breath_practices": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "tcm_analysis": {
    "likely_patterns": [],
    "supporting_citations": [],
    "suggested_categories": {
      "herbs": [],
      "formulas": [],
      "diet": [],
      "lifestyle": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "homeopathy_analysis": {
    "likely_remedy_directions": [],
    "key_repertory_rubrics": [],
    "supporting_citations": [],
    "suggested_categories": {
      "remedy_differentials": [],
      "modalities": [],
      "constitution_notes": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "cross_tradition_synthesis": {
    "shared_themes": [],
    "areas_of_agreement": [],
    "areas_of_conflict": [],
    "combined_practitioner_notes": [],
    "suggested_treatment_categories": {
      "herbs_by_tradition": [],
      "formulas_by_tradition": [],
      "lifestyle": [],
      "breath_or_meditation": []
    },
    "safety_notes": [],
    "confidence_score": 0
  },
  "citations": [],
  "disclaimer": ""
}
```

Current local scaffolding:

- `src/normalize_pattern_chunks.py` normalizes current ingested books into the shared chunk contract.
- `src/pattern_app_validate.py` validates normalized chunks against `schemas/pattern_app_chunk.schema.json`.
- `src/pattern_app_source_report.py` reports processed, raw-only, and missing canon sources.
- `src/pattern_app_retrieval.py` runs the first citation-preserving retrieval and output-shaping prototype.
- `src/pattern_app_intake.py` accepts a structured practitioner intake JSON file and returns the MVP app output shape.
- `examples/intake_sleep_digestion.json` is the first runnable intake example.

## 4. Practitioner Intake Schema

```json
{
  "patient_context": {
    "age_range": "",
    "sex": "",
    "pregnancy_status": "",
    "known_conditions": [],
    "current_medications": [],
    "allergies": [],
    "clinical_setting": ""
  },
  "symptoms": {
    "chief_complaint": "",
    "primary_symptoms": [],
    "secondary_symptoms": [],
    "duration": "",
    "onset": "",
    "severity": "",
    "frequency": "",
    "better_from": [],
    "worse_from": [],
    "time_patterns": [],
    "temperature_patterns": [],
    "digestion": "",
    "sleep": "",
    "energy": "",
    "mood": "",
    "pain_location": "",
    "pain_quality": ""
  },
  "tradition_specific_inputs": {
    "ayurveda": {
      "prakriti": "",
      "vikriti": "",
      "agni": "",
      "ama_signs": [],
      "bowel_pattern": "",
      "tongue_notes": "",
      "pulse_notes": ""
    },
    "tcm": {
      "tongue": "",
      "pulse": "",
      "temperature": "",
      "sweating": "",
      "thirst": "",
      "appetite": "",
      "bowel_urine": "",
      "emotional_pattern": ""
    },
    "homeopathy": {
      "modalities": [],
      "mental_emotional_state": "",
      "generals": [],
      "peculiar_symptoms": [],
      "food_cravings_aversions": [],
      "thermal_state": ""
    }
  },
  "practitioner_notes": "",
  "requested_output_depth": "brief | standard | detailed"
}
```

## 5. Canonical Source Layers

### Ayurveda: Foundational Theory

#### Charaka Samhita

Role: foundational Ayurveda theory, pathology, doshas, diagnosis, physiology, and treatment principles.

Primary source:

- https://archive.org/details/JTrz_charak-samhita-with-ayurved-dipika-of-ram-karan-sharma-by-vaidya-bhagvan-dash-vol.-1-chaukhambh

Local status:

- Raw PDF present: `data/raw/charaka_vol1.pdf`
- Extracted/clean/chunk outputs present
- Full OCR still needs a complete quality pass

#### Ashtanga Hridayam

Role: practical clinical Ayurveda, integrated treatment logic, formulations, and lifestyle.

Primary source:

- https://ia800502.us.archive.org/0/items/AstangaHrdayam.Eng/Astanga-hrdayam.%20Eng.pdf

Local status:

- Raw PDF present: `data/raw/ashtanga_hridayam.pdf`
- Extracted/clean/chunk outputs present

#### Vasant Lad Textbook of Ayurveda Volumes 1-3

Role: modern Ayurveda educational framework, clinical assessment, management, and treatment principles.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

#### Ayurvedic Medicine: The Principles of Traditional Practice

Author: Sebastian Pole.

Role: concise modern Ayurveda practice reference for assessment, herbs, treatment categories, and practitioner-facing application.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear
- Track the 2nd edition separately when supplied or available

#### Prakriti: Your Ayurvedic Constitution

Author: Robert Svoboda.

Role: concise Ayurveda philosophical and constitutional reference.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

#### Sushruta Samhita

Role: surgery, anatomy, diagnostics, and classical expansion layer.

Local status:

- Raw PDF present: `data/raw/sushruta_samhita_vol1.pdf`
- Extracted/clean/chunk outputs present
- Normalized into `data/chunks/pattern_app_core_chunks.jsonl`
- Text layer is embedded OCR from the 1907 Archive scan and needs a page-quality review before user-facing quotation

### Ayurveda: Materia Medica

No additional Ayurveda materia medica text is currently part of the user-approved core canon. Prior generic candidates such as Dravyaguna Vijnana and Indian Materia Medica are excluded from core guiding use unless the user explicitly re-approves them.

### TCM: Foundational Theory

#### Huang Di Nei Jing Su Wen

Role: foundational TCM philosophy, yin/yang, qi dynamics, organ systems, and pattern logic.

Primary source:

- https://ia903101.us.archive.org/8/items/HuangDiNeiJingSuWen/Huang%20Di%20Nei%20jing%20su%20wen.pdf

Local status:

- Raw PDF present: `data/raw/huangdi_neijing.pdf`
- Extracted/clean/chunk outputs present

#### The Web That Has No Weaver

Author: Ted J. Kaptchuk.

Role: modern TCM philosophy and practitioner-facing explanation of Chinese medicine pattern language.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

### TCM: Materia Medica

#### Chinese Herbal Medicine: Materia Medica

Role: TCM herb database, channels entered, temperatures, contraindications, and herb functions.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

#### Chinese Herbal Medicine: Formulas and Strategies

Role: TCM formula architecture, herb relationships, formula families, and modification logic.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

#### User-confirmed office TCM Materia Medica

Role: supplemental TCM materia medica once the exact office title and edition are supplied.

Local status:

- Pending exact title and edition from user
- Metadata-only / private-local handling required unless rights are clear
- Prior generic candidates such as Shang Han Lun and Jin Gui Yao Lue are excluded from core guiding use unless the user explicitly re-approves them.

### Homeopathy: Foundational Theory

#### Organon of Medicine

Role: foundational homeopathic philosophy, constitutional logic, and case methodology.

Primary source:

- https://archive.org/details/organonofmedicin0000hahn/page/n9/mode/2up

Local status:

- Raw PDF present: `data/raw/organon_medicine.pdf`
- Additional historical edition present: `data/raw/organon_homeopathic_medicine_1849_third_american.pdf`
- Extracted/clean/chunk outputs present

Edition note:

- Prefer the 6th edition when using `Organon of the Medical Art` as the core modern Organon reference.
- Keep edition metadata explicit; do not merge Organon editions without edition-aware citations.

### Homeopathy: Materia Medica / Repertory

#### Boericke Materia Medica

Role: remedy database, modalities, constitutional tendencies, and symptom patterns.

Primary sources:

- https://archive.org/details/BoerickeMateriaMedica_201510
- https://www.homeoint.org/books/boericmm/index.htm

Local status:

- Missing

#### Kent's Repertory

Role: repertory logic, symptom indexing, and remedy mapping.

Local status:

- Missing

#### Kent's Lectures on Homeopathic Materia Medica

Role: materia medica, constitutional interpretation, remedy psychology, and remedy differentiation.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

#### Homeopathic Medical Repertory, 3rd ed.

Author: Robin Murphy.

Role: modern clinical repertory organized by organ system alphabetically and by clinical diagnosis; useful as a bridge between biomedical and homeopathic frameworks.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

### General Herbal Medicine

#### Encyclopedia of Herbal Medicine

Author: Andrew Chevallier.

Role: broad Western/general herbal medicine reference for botanical cross-checking and safety/context support.

Local status:

- Missing
- Metadata-only / private-local handling required unless rights are clear

Use note:

- This supports general herb context and safety review. It should not override Ayurveda or TCM materia medica logic.

### Yoga / Consciousness / Communication Layer

#### The Secret of the Yoga Sutra: Samadhi Pada

Role: yoga psychology, consciousness framework, subtle-body concepts, interpretive architecture, and practitioner-facing conceptual layer.

Use:

- Uploaded local PDF only
- Private ingestion only
- Do not publish extracted text

Local status:

- Missing

#### Science of Breath

Role: communication-style layer, East/West explanatory framework, breath/body/mind integration, and educational tone reference.

Use only for:

- Style analysis
- Communication architecture
- Response tone
- Practitioner explanation structure

Do not treat this as a primary medical authority.

Local status:

- Private PDF present: `private_sources/communication/science_of_breath.pdf`
- Registered in `docs/PRIVATE_SOURCE_REGISTER.md`
- `private_sources/` is git-ignored

#### Other Communication Style References

- Yoga and Psychotherapy
- The Web That Has No Weaver

Local status:

- Missing

## 6. Ingestion Standards

Every chunk must preserve:

- Source
- Author
- Translator
- Edition
- Page numbers
- Chapter/sutra/aphorism metadata
- Section names
- Text layer type
- Citations
- Rights/access note
- Extraction/OCR notes

Do not:

- Mix traditions together during ingestion
- Merge translations or editions into one text
- Discard metadata
- Remove uncertainty language
- Commit private or copyrighted extracted full text unless rights are explicitly documented

Prefer:

1. Embedded text extraction
2. OCR only if necessary
3. Markdown normalization
4. Structured JSONL chunks

## 7. Required Chunk Metadata

Every chunk should include these fields. If a value is unknown, use `null`, an empty list, or `"Unknown"` consistently.

- `book`
- `tradition`
- `school`
- `source_category`
- `canonical_layer`
- `volume`
- `title`
- `author_authors`
- `translator_authors`
- `editor_commentator`
- `edition`
- `source_url`
- `source_access_status`
- `license_or_rights_note`
- `retrieval_date`
- `page_start`
- `page_end`
- `stable_locator`
- `section`
- `chapter`
- `sutra_or_aphorism`
- `entry_type`
- `language`
- `sanskrit_text`
- `source_language_text`
- `english_text`
- `text`
- `keywords`
- `concepts`
- `symptoms`
- `patterns`
- `interventions`
- `contraindications`
- `text_layer_type`
- `ocr_engine`
- `ocr_confidence`
- `extraction_notes`

## 8. Citation Requirements

- Every app-facing claim must be traceable to one or more chunks.
- Citations should include tradition, source title, author or translator, section/chapter/sutra/aphorism, page range, source URL, access status, and retrieval date.
- When sources disagree, cite both sides and explain the disagreement.
- Distinguish primary text, translator commentary, modern commentary, clinical observation, and peer-reviewed evidence.
- Never cite the communication voice layer as medical evidence.
- For copyrighted/private sources, store metadata and notes only unless explicit permission allows more.

## 9. Public, Private, And Copyright Rules

Prefer public-domain, open-access, Creative Commons, government, institutional repository, and publisher-authorized sources.

Public-domain status must not be assumed solely from age when translation, commentary, edition, or scan rights are unclear.

Do not bypass:

- Paywalls
- Logins
- DRM
- Preview limits
- Robots.txt
- Access controls

Private style references may inform voice rules but must not become retrievable clinical source text.

## 10. Safety Rules

Always include:

- Educational use language
- Practitioner review requirements
- Contraindication awareness
- Red-flag suppression logic

Do not:

- Diagnose
- Prescribe
- Tell users to stop, change, combine, or replace medications
- Present traditional pattern interpretations as confirmed biomedical diagnoses
- Present suggested categories as patient-specific instructions

If severe red flags appear, suppress traditional suggestions and prioritize referral language.

Red flags include:

- Chest pain
- Difficulty breathing
- Stroke-like symptoms
- Suicidal ideation
- Severe allergic reaction
- Pregnancy complications
- High fever
- Severe dehydration
- Acute abdominal pain
- Uncontrolled bleeding
- Sudden neurological symptoms

Required app disclaimer:

> This app is a practitioner-facing research and comparison tool. It does not diagnose disease, prescribe treatment, or replace clinical judgment. Outputs are educational, tradition-specific interpretations based on cited source material. Herbs, formulas, remedies, diet, lifestyle, yoga, breath, or meditation suggestions must be reviewed by a qualified practitioner before use. Urgent, severe, worsening, or medically concerning symptoms require appropriate medical evaluation.

## 11. Ranking And Confidence

Use a score from 0 to 100.

Confidence combines:

- Symptom match
- Synonym match
- Modality match
- Constitution/context match
- Timing/location/quality match
- Source authority
- Citation quality
- Tradition-specific fit
- Cross-tradition agreement
- Safety completeness

Formula draft:

```text
confidence_score =
(symptom_match * 0.35)
+ (source_authority * 0.20)
+ (citation_quality * 0.20)
+ (tradition_specific_fit * 0.15)
+ (safety_completeness * 0.10)
```

Penalty modifiers:

- Missing medications: `-10`
- Pregnancy unknown when relevant: `-10`
- No citation: `-25`
- Conflicting source evidence: `-10` to `-25`
- Red flag present: suppress treatment suggestions

Confidence labels:

- `85-100`: strong source-supported match
- `70-84`: likely match, practitioner review required
- `50-69`: possible match, needs more intake detail
- `30-49`: weak match, exploratory only
- `0-29`: insufficient evidence

## 12. Cross-Tradition Synthesis

Compare traditions by analogy, not equivalence.

The synthesis should identify:

- Where the systems agree
- Where they conflict
- Shared themes
- Tradition-specific suggested categories
- Possible combined practitioner notes
- What needs practitioner review

Do not collapse dosha, qi, miasm, prana, nervous-system language, or biomedical terms into a single universal ontology.

Herbs, formulas, remedies, lifestyle, and practice suggestions must remain grouped by tradition.

## 13. Communication Style

The app voice should be:

- Calm
- Clear
- Grounded
- Intelligent
- Readable
- Explanatory without sounding mystical
- Explanatory without sounding cold or clinical

Avoid:

- Exaggerated claims
- Certainty inflation
- Mystical vagueness
- Diagnosis language
- Prescriptive tone
- Fear-based language

Use style references only as communication guidance, not clinical source authority.

## 14. Current Local Source Inventory

The machine-readable source registry for the three healing modes lives at:

- `sources/metadata/pattern_app_source_registry.json`

Present raw/source files:

- `data/raw/charaka_vol1.pdf`
- `data/raw/ashtanga_hridayam.pdf`
- `data/raw/huangdi_neijing.pdf`
- `data/raw/organon_medicine.pdf`
- `data/raw/organon_homeopathic_medicine_1849_third_american.pdf`
- `data/raw/sushruta_samhita_vol1.pdf`
- `private_sources/communication/science_of_breath.pdf`

Present processed outputs:

- `data/extracted/charaka_vol1_raw.txt`
- `data/clean/charaka_vol1.md`
- `data/chunks/charaka_vol1_chunks.jsonl`
- `data/extracted/ashtanga_hridayam_raw.txt`
- `data/clean/ashtanga_hridayam.md`
- `data/chunks/ashtanga_hridayam_chunks.jsonl`
- `data/extracted/huangdi_neijing_raw.txt`
- `data/clean/huangdi_neijing.md`
- `data/chunks/huangdi_neijing_chunks.jsonl`
- `data/extracted/organon_raw.txt`
- `data/clean/organon.md`
- `data/chunks/organon_chunks.jsonl`

Normalized retrieval outputs:

- `data/chunks/normalized/`
- `data/chunks/pattern_app_core_chunks.jsonl`

Current prototype tools:

- `src/pattern_app_validate.py`: validates normalized chunks against `schemas/pattern_app_chunk.schema.json`.
- `src/pattern_app_retrieval.py`: simple tradition-separated retrieval, citation rendering, confidence labels, and red-flag suppression prototype.

Missing major user-approved core medicine sources:

- Vasant Lad Textbook of Ayurveda Vol. 1
- Vasant Lad Textbook of Ayurveda Vol. 2
- Vasant Lad Textbook of Ayurveda Vol. 3
- Ayurvedic Medicine: The Principles of Traditional Practice
- Prakriti: Your Ayurvedic Constitution
- The Web That Has No Weaver
- User-confirmed TCM Materia Medica title
- Organon of the Medical Art edition, if distinct from the currently processed Organon source
- The Science of Homeopathy
- The Soul of Remedies
- Boericke's New Manual of Homeopathic Materia Medica with Repertory
- Morrison's Desktop Guide to Keynotes and Confirmatory Symptoms
- Morrison's Desktop Companion to Physical Pathology
- Kent's Final General Repertory
- Homeopathic Medical Repertory, 3rd ed.
- Encyclopedia of Herbal Medicine

Missing non-medical communication/style sources:

- The Secret of the Yoga Sutra: Samadhi Pada
- Yoga and Psychotherapy

## 15. Development Rules

Do not add isolated ingestion scripts without maintaining architecture consistency.

Before new features:

1. Maintain metadata structure.
2. Maintain citation traceability.
3. Maintain safety rules.
4. Maintain separation of traditions.
5. Maintain communication-style consistency.
6. Maintain source rights/access notes.
7. Keep private sources out of git.

When the user is collaborating with ChatGPT, treat pasted ChatGPT output as product input. If ChatGPT guidance would materially improve a task, ask the user to provide the relevant ChatGPT answer or decision notes, then document the resulting decision in repo docs or implementation notes.

## 16. Next Development Milestones

1. Keep the Pattern App source registry current as local files are added.
2. Improve the retrieval prototype with synonym maps and tradition-specific concept tags.
3. Finish full OCR for Charaka Volume 1 and document OCR quality by page range.
4. Add materia medica/repertory sources once rights/access are clear.
5. Improve Sushruta and Charaka OCR quality review by page range.
6. Build tradition-specific concept extraction for Ayurveda, TCM, Homeopathy, and Yoga/breath sources.
7. Build cross-tradition mapping tables with explicit confidence and non-equivalence notes.
8. Expand citation rendering utilities for app-facing outputs.
9. Add medical safety checks and red-flag response templates.
10. Replace prototype keyword retrieval with ranked lexical/vector retrieval once source text quality is stable.
