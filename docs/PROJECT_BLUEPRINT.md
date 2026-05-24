# Project Blueprint

This blueprint is governed by [MASTER_CANON.md](MASTER_CANON.md). Treat the master canon as the canonical source list and architecture reference before changing ingestion, retrieval, ranking, synthesis, or output behavior.

## 1. Product Vision

This repository is the ingestion and knowledge-architecture foundation for a cross-tradition holistic medicine practitioner research app.

A practitioner enters symptoms, signs, constitution/context, and relevant notes. The app returns citation-based traditional-system interpretations from Ayurveda, Traditional Chinese Medicine, and Homeopathy, plus a cross-tradition synthesis that highlights agreement, conflict, shared themes, possible tradition-specific treatment directions, and what requires practitioner review.

The goal is not to diagnose, prescribe, or replace clinical judgment. The goal is to support qualified practitioners as they research, compare, cite, and explain traditional pattern systems clearly.

## 2. What This App Is

- A structured ingestion system for public-domain, open-access, and properly licensed source material.
- A knowledge architecture for comparing traditional concepts without flattening them into one generic model.
- A citation-first research assistant for practitioners.
- A pattern-literacy tool that explains how a source tradition frames symptoms, constitutions, remedies, interventions, and practitioner reasoning.
- A system that returns separate Ayurveda, TCM, and Homeopathy analysis blocks before attempting synthesis.
- A foundation for retrieval, ranking, confidence scoring, safety screening, and cross-tradition comparison.
- A communication system that can translate dense traditional or clinical language into clear educational explanations.

## 3. What This App Is Not

- Not a diagnostic engine.
- Not a prescribing tool.
- Not a substitute for a licensed medical professional.
- Not a generator of patient-specific treatment plans.
- Not a source of emergency, acute-care, or medication-management advice.
- Not a claim that different traditions are equivalent or interchangeable.
- Not a system that recommends combined treatments without qualified practitioner review.
- Not a system for copying private, copyrighted, paywalled, or login-restricted books into the repo.
- Not a system for presenting traditional claims as proven biomedical facts unless supported by appropriate evidence.

## 4. Source Categories

Sources should be categorized before ingestion so downstream retrieval can rank and explain them correctly.

- Classical authoritative texts: foundational source texts within a tradition.
- Commentaries and translations: interpretive layers that must retain translator/commentator attribution.
- Clinical pattern texts: sources focused on diagnosis frameworks, pattern differentiation, case reasoning, or clinical decision processes.
- Materia medica and remedy texts: herb, formula, remedy, substance, or intervention reference works.
- Intake forms and questionnaires: practitioner-facing tools that reveal question order, categories, and assessment logic.
- Teacher lectures and transcripts: educational but lower authority unless tied to a known lineage or cited source base.
- Structured databases: normalized open data with clear licensing and provenance.
- Peer-reviewed case studies and clinical literature: later evidence layer for outcomes, adverse events, and biomedical context.
- Communication voice references: style-only materials that shape explanation tone but do not become clinical source authority.

## Canonical Main Books

The main app canon is defined in [MASTER_CANON.md](MASTER_CANON.md), with the current user-approved core book set in [CORE_BOOK_CANON.md](CORE_BOOK_CANON.md). At minimum, architecture and retrieval work must account for these layers:

- Ayurveda foundational theory: Charaka Samhita, Sushruta Samhita, Vagbhata Samhita / Ashtanga Hridayam.
- Ayurveda modern clinical framework: Vasant Lad's `Textbook of Ayurveda` Vol. 1, Vol. 2, and Vol. 3; Sebastian Pole's `Ayurvedic Medicine: The Principles of Traditional Practice`; Robert Svoboda's `Prakriti`, all handled as private/local or metadata-only unless rights are clear.
- Ayurveda materia medica: no additional Ayurveda materia medica text is core unless the user names it later.
- TCM foundational theory: Huang Di Nei Jing Su Wen and Ted Kaptchuk's `The Web That Has No Weaver`.
- TCM materia medica/formulas: user-confirmed TCM materia medica title pending; no other TCM materia medica/formula text is core unless the user names it later.
- Homeopathy foundational/framework: Organon of the Medical Art, The Science of Homeopathy, The Soul of Remedies.
- Homeopathy materia medica/repertory: Boericke's New Manual of Homeopathic Materia Medica with Repertory, Morrison's Desktop Guide, Morrison's Desktop Companion, Kent's Final General Repertory, Robin Murphy's `Homeopathic Medical Repertory`.
- General herbal medicine: Andrew Chevallier's `Encyclopedia of Herbal Medicine` as a cross-checking/safety-support layer, not a replacement for tradition-specific materia medica.
- Yoga / consciousness / communication: The Secret of the Yoga Sutra: Samadhi Pada, Science of Breath, Yoga and Psychotherapy, The Web That Has No Weaver.

Prior generic candidate sources such as Dravyaguna Vijnana, Indian Materia Medica, Shang Han Lun, Jin Gui Yao Lue, Chinese Herbal Medicine: Materia Medica, Chinese Herbal Medicine: Formulas and Strategies, and Kent's Lectures on Homeopathic Materia Medica are not part of the core guiding canon unless the user explicitly re-approves them.

Private or copyrighted style/source references must follow the private source rules below.

## 5. Canonical Book Layers

### Foundational Theory

Texts that define a tradition's conceptual architecture: elements, doshas, gunas, qi, channels, miasms, vital force, prana, breath, consciousness, causation, constitution, and health/disease models.

### Clinical Pattern Texts

Texts that show how practitioners reason from signs, symptoms, history, constitution, modalities, pulse/tongue, mental-emotional state, lifestyle, or disease stage into patterns or case interpretations.

### Materia Medica / Remedy Texts

Texts that describe herbs, formulas, homeopathic remedies, substances, actions, indications, contraindications, preparation, dosage context, remedy pictures, and traditional usage.

### Communication Voice Layer

Style references, response templates, and tone guides that determine how the app explains source material. This layer must never be treated as clinical evidence unless it is also independently ingested as a legitimate source with permissions.

### Peer-Reviewed Evidence Layer

Case reports, clinical trials, reviews, adverse-event reports, and mechanistic papers. This layer is used to contextualize traditional claims, identify evidence strength or weakness, and support safety language.

## 6. Ingestion Pipeline Standards

- Ingest sources only when access rights are clear.
- Preserve raw source files separately from extracted, cleaned, and chunked outputs.
- Preserve page numbers or stable source locators whenever available.
- Prefer structured extraction over ad hoc text manipulation.
- Use OCR when PDFs are scanned, and log OCR engine, page-level confidence, and known OCR limitations.
- Clean repeated headers, footers, page artifacts, OCR noise, broken hyphenation, and duplicated lines.
- Do not erase uncertain readings; mark them with uncertainty metadata when needed.
- Attempt to separate source-language lines from English translation/commentary when practical.
- Chunk by meaningful semantic boundaries when possible: section, chapter, verse, aphorism, remedy entry, herb entry, case, or paragraph.
- Keep ingestion scripts reproducible from documented commands.
- Add tests for output creation, metadata presence, citation fields, and representative chunk shape.

## 7. Required Metadata for Every Chunk

Every chunk must include:

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
- `source_url`
- `source_access_status`
- `license_or_rights_note`
- `retrieval_date`
- `page_start`
- `page_end`
- `stable_locator`
- `section`
- `chapter`
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
- `ocr_engine`
- `ocr_confidence`
- `extraction_notes`

If a field is unknown, use `null`, an empty list, or `"Unknown"` consistently. Do not omit required keys.

## 8. Citation Requirements

- Every app-facing claim must be traceable to one or more chunks.
- Citations should include tradition, book/source title, author or translator, section/chapter, page range, source URL, and retrieval date.
- When sources disagree, cite both sides and explain the disagreement.
- Distinguish primary text, translator commentary, modern commentary, clinical observation, and peer-reviewed evidence.
- Never cite the communication voice layer as medical evidence.
- For copyrighted/private sources, store metadata and notes only unless explicit permission allows more.

## 9. Medical Safety Rules

- Do not diagnose.
- Do not prescribe herbs, formulas, remedies, breath practices, diets, supplements, or medical treatments.
- Frame outputs as educational, citation-based traditional-system suggestions for qualified practitioner review.
- Suggested herbs, formulas, remedies, lifestyle categories, breath practices, and treatment directions must be grouped as research categories, not instructions.
- Do not tell users to stop, change, or combine medications.
- Do not present traditional pattern interpretations as confirmed biomedical diagnoses.
- Flag red-flag symptoms and advise appropriate professional or emergency care where relevant.
- Include uncertainty and scope limits in user-facing explanations.
- For pregnancy, children, serious disease, mental health crisis, medication interactions, or acute symptoms, use stronger safety language and route to qualified care.
- Keep practitioner research support separate from patient-specific treatment advice.
- Always set `practitioner_review_required` to true for app outputs that mention herbs, formulas, homeopathic remedies, lifestyle practices, breath practices, or possible combined treatment directions.

## 10. Ranking / Confidence Logic

Ranking should combine source authority, relevance, safety, and evidence quality.

Priority factors:

1. Safety override: red flags, contraindications, toxic substances, interactions, and scope risks.
2. Source authority: primary classical text, respected commentary, peer-reviewed source, practitioner methodology, or general article.
3. Tradition fit: whether the source is actually within the tradition being queried.
4. Pattern relevance: symptom/sign overlap, constitutional context, modalities, disease stage, and differentiating features.
5. Citation quality: page or stable locator available, clear attribution, and accessible source.
6. Evidence layer: case study, trial, review, adverse-event literature, or absence of modern evidence.
7. Contradictions: conflicting sources lower confidence unless the conflict is explained.
8. Missing information: confidence drops when key assessment data is absent.

Confidence labels should be human-readable, such as `high_source_support`, `moderate_source_support`, `low_source_support`, `conflicting_sources`, `insufficient_context`, or `safety_limited`.

## 11. Cross-Tradition Comparison Logic

Compare traditions by analogy, not equivalence.

- Preserve each tradition's own vocabulary and reasoning model.
- Map concepts only when there is a clear functional relationship, not because labels sound similar.
- Keep original pattern names visible beside any cross-map.
- Explain what overlaps, what differs, and what cannot be responsibly mapped.
- Separate symptom-level overlap from theory-level equivalence.
- Do not collapse dosha, qi, miasm, prana, nervous-system language, or biomedical terms into a single universal ontology.
- When comparing, output side-by-side source-grounded notes with citations and confidence labels.
- Identify where Ayurveda, TCM, and Homeopathy appear to agree, where they conflict, and where they are simply describing different dimensions of the case.
- Combined treatment direction must mean a practitioner-facing research synthesis, not a protocol or prescription.
- Herbs, formulas, remedies, lifestyle, and practice suggestions must remain grouped by tradition so users can see which system each suggestion belongs to.

## 12. Communication Voice Rules

The app voice should be clear, calm, practitioner-facing, and citation-aware.

- Explain without overclaiming.
- Use plain language first, then define technical terms.
- Preserve tradition-specific terms where they matter.
- Name uncertainty directly.
- Distinguish source summary from interpretation.
- Avoid fear-based language.
- Avoid giving instructions that amount to treatment.
- For patient-facing summaries, soften jargon and add safety boundaries.
- For practitioner-facing summaries, include source logic, differentiating signs, and citation trails.

## 13. Private/Copyrighted Source Rules

- Do not ingest or commit full text from private, copyrighted, paywalled, login-restricted, or personally supplied copyrighted works unless explicit rights are documented.
- Private style references may inform voice rules but must not become retrievable clinical source text.
- Store only metadata, bibliographic notes, chapter outlines, or user-owned excerpts when rights are unclear.
- Do not bypass DRM, paywalls, logins, preview limits, robots.txt, or access controls.
- If a source requires permission, stop and document what permission is needed.

## 14. Public-Domain Source Rules

- Prefer public-domain, open-access, Creative Commons, government, institutional repository, and publisher-authorized sources.
- Record source URL, access status, rights note, retrieval date, and any license text.
- Public-domain status must not be assumed solely from age when translation, commentary, edition, or scan rights are unclear.
- Translations and commentaries may have separate rights from the underlying classical text.
- If multiple public/open sources exist, prefer the one with clearer metadata, stable URLs, better scan quality, and page images.

## 15. Future App Output Format

The main app workflow is:

1. Practitioner enters symptoms, signs, constitution/context, and relevant notes.
2. App retrieves tradition-specific source chunks.
3. App returns separate Ayurveda, TCM, and Homeopathy views.
4. App returns a cross-tradition synthesis for qualified practitioner review.

The output must include:

- Ayurveda view: likely pattern interpretation, supporting source citations, suggested herbs/formulas/lifestyle categories, confidence level, and safety notes.
- Traditional Chinese Medicine view: likely pattern interpretation, supporting source citations, suggested herbs/formulas/lifestyle categories, confidence level, and safety notes.
- Homeopathy view: likely remedy/repertory direction, supporting source citations, suggested remedy categories or differentials, confidence level, and safety notes.
- Cross-tradition synthesis: where the systems agree, where they conflict, shared themes, possible combined treatment direction, herbs/lifestyle/practice suggestions grouped by tradition, and what needs practitioner review.

These outputs are educational, citation-based traditional-system suggestions. They must not be presented as medical diagnosis, prescription, or patient-specific treatment instruction.

## APP_OUTPUT_SCHEMA

Future app responses should use this structured, citation-first schema:

```json
{
  "user_symptoms": {
    "symptoms": ["reported symptom or concern"],
    "signs": ["observable sign"],
    "constitution_context": "Relevant constitution, baseline, history, season, age range, lifestyle, diet, sleep, digestion, stress, menstrual or other context when provided",
    "relevant_notes": "Practitioner-entered notes",
    "missing_information": ["Important question still needed for better traditional pattern comparison"]
  },
  "ayurveda_analysis": {
    "likely_pattern_interpretation": "Possible dosha, dhatu, agni, ama, srotas, prakriti/vikriti, or disease-stage framing",
    "supporting_source_citations": ["citation_id"],
    "suggested_herbs_formulas_lifestyle_categories": ["research category, not prescription"],
    "confidence_level": "moderate_source_support",
    "safety_notes": ["Scope, contraindication, red-flag, or practitioner-review note"]
  },
  "tcm_analysis": {
    "likely_pattern_interpretation": "Possible zang-fu, qi/blood/fluids, cold/heat, deficiency/excess, channel, or pathogen framing",
    "supporting_source_citations": ["citation_id"],
    "suggested_herbs_formulas_lifestyle_categories": ["research category, not prescription"],
    "confidence_level": "moderate_source_support",
    "safety_notes": ["Scope, contraindication, red-flag, or practitioner-review note"]
  },
  "homeopathy_analysis": {
    "likely_remedy_repertory_direction": "Possible repertory rubrics, remedy family, keynote direction, modalities, or differentials",
    "supporting_source_citations": ["citation_id"],
    "suggested_remedy_categories_or_differentials": ["research category or differential, not prescription"],
    "confidence_level": "low_source_support",
    "safety_notes": ["Scope, contraindication, red-flag, or practitioner-review note"]
  },
  "cross_tradition_synthesis": {
    "agreements": ["Where Ayurveda, TCM, and/or Homeopathy appear to point in a similar functional direction"],
    "conflicts": ["Where interpretations diverge or imply different priorities"],
    "shared_themes": ["Common themes across systems"],
    "possible_combined_treatment_direction": "Practitioner-facing research synthesis, not a protocol",
    "grouped_suggestions_by_tradition": {
      "ayurveda": ["herb/formula/lifestyle/practice category"],
      "tcm": ["herb/formula/lifestyle/practice category"],
      "homeopathy": ["remedy category or differential"]
    },
    "needs_practitioner_review": ["Items that require qualified review before clinical use"]
  },
  "suggested_treatment_categories": {
    "ayurveda": ["category"],
    "tcm": ["category"],
    "homeopathy": ["category"],
    "yoga_breath_consciousness": ["supportive practice category when relevant"]
  },
  "herbs_and_remedies": {
    "ayurveda": ["herb or formula category with citation_id"],
    "tcm": ["herb or formula category with citation_id"],
    "homeopathy": ["remedy differential or remedy family with citation_id"]
  },
  "lifestyle_practices": {
    "ayurveda": ["diet/lifestyle category"],
    "tcm": ["diet/lifestyle category"],
    "yoga_breath_consciousness": ["practice category with safety note"]
  },
  "contraindications": [
    {
      "item": "Herb, remedy category, formula category, lifestyle category, or practice category",
      "risk": "Known or suspected safety concern",
      "citation_ids": ["citation_id"],
      "requires_medical_review": true
    }
  ],
  "confidence_scores": {
    "ayurveda": {
      "label": "moderate_source_support",
      "score": 0.64,
      "drivers": ["matched symptoms", "source authority", "missing pulse/tongue equivalent not applicable"]
    },
    "tcm": {
      "label": "insufficient_context",
      "score": 0.42,
      "drivers": ["missing tongue/pulse", "conflicting hot/cold signs"]
    },
    "homeopathy": {
      "label": "low_source_support",
      "score": 0.35,
      "drivers": ["missing modalities", "insufficient mental-emotional detail"]
    },
    "synthesis": {
      "label": "practitioner_review_required",
      "score": 0.5,
      "drivers": ["cross-tradition overlap present", "clinical details incomplete"]
    }
  },
  "citations": [
    {
      "citation_id": "ayurveda-charaka-vol1-p41-42",
      "tradition": "Ayurveda",
      "source": "Source title",
      "author_or_translator": "Author or translator",
      "section": "Chapter or section",
      "pages": "41-42",
      "url": "https://example.org/source",
      "retrieval_date": "YYYY-MM-DD",
      "rights_note": "Public-domain/open-access/metadata-only note"
    }
  ],
  "practitioner_review_required": true,
  "not_medical_advice": true
}
```

## 16. Next Development Milestones

1. Normalize the chunk metadata schema across all existing ingestion scripts.
2. Add schema validation tests for every JSONL output.
3. Finish full OCR for Charaka Volume 1 and document OCR quality by page range.
4. Create a source registry with access status, rights notes, canonical layer, and ingestion status.
5. Build tradition-specific concept extraction passes for Ayurveda, TCM, Homeopathy, and Yoga/breath sources.
6. Build cross-tradition mapping tables with explicit confidence and non-equivalence notes.
7. Add citation rendering utilities for app-facing outputs.
8. Add medical safety checks and red-flag response templates.
9. Add peer-reviewed case-study ingestion after classical and pattern text schemas are stable.
10. Build the first retrieval prototype that returns cited, confidence-labeled comparison notes.
