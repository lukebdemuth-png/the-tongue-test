# Master Canon And Architecture Instructions

This document is the canonical project reference for ingestion, retrieval, ranking, synthesis, and output architecture.

This repository is not a generic PDF scraper. It is the knowledge architecture foundation for a practitioner-facing holistic medicine research application.

The app compares and explains traditional systems side by side:

- Ayurveda
- Traditional Chinese Medicine (TCM)
- Homeopathy
- Yoga / breath / consciousness frameworks

The app is educational, citation-based, practitioner-facing, and research-oriented.

The app is not a diagnostic engine, a prescribing engine, or a replacement for clinical judgment.

All outputs must preserve citations, source metadata, uncertainty, tradition-specific distinctions, and practitioner review requirements.

## Core App Purpose

A practitioner enters:

- Symptoms
- Signs
- Constitution/context
- Modalities
- Notes
- Medications
- Relevant observations

The app returns:

1. Ayurveda interpretation
2. TCM interpretation
3. Homeopathy interpretation
4. Cross-tradition synthesis

Each output should include:

- Likely traditional patterns
- Supporting citations
- Suggested traditional treatment categories
- Herbs/formulas/remedy directions
- Lifestyle/practice categories
- Confidence scores
- Contraindications
- Practitioner review requirements

The app ranks traditional system relevance, not medical truth.

## Canonical Source Layers

The core medicine canon is user-approved only. Prior generic or ChatGPT-suggested books should not be treated as app-guiding sources unless the user explicitly adds them back later.

### Ayurveda: Foundational Theory

#### Charaka Samhita

Role:

- Foundational Ayurveda theory
- Pathology
- Doshas
- Diagnosis
- Physiology
- Treatment principles

Primary source:

- https://archive.org/details/JTrz_charak-samhita-with-ayurved-dipika-of-ram-karan-sharma-by-vaidya-bhagvan-dash-vol.-1-chaukhambh

#### Vagbhata Samhita / Ashtanga Hridayam

Role:

- Practical clinical Ayurveda
- Integrated treatment logic
- Formulations
- Lifestyle

Primary source:

- https://ia800502.us.archive.org/0/items/AstangaHrdayam.Eng/Astanga-hrdayam.%20Eng.pdf

#### Sushruta Samhita

Role:

- Surgery
- Anatomy
- Diagnostics
- Classical expansion layer

Local file status:

- Present as `data/raw/sushruta_samhita_vol1.pdf`.

#### Vasant Lad Textbook of Ayurveda Volumes 1-3

Role:

- Modern Ayurveda educational framework
- Fundamental principles
- Clinical assessment
- Management and treatment principles
- Practitioner-facing organization layer

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text from these books.

#### Ayurvedic Medicine: The Principles of Traditional Practice

Author:

- Sebastian Pole

Role:

- Concise modern Ayurveda practice reference
- Practical bridge between traditional principles and clinical application
- Useful for herbs, treatment categories, and practitioner-facing organization

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Track the 2nd edition separately when available.
- Do not commit extracted full text from copyrighted editions.

#### Prakriti: Your Ayurvedic Constitution

Author:

- Robert Svoboda

Role:

- Concise philosophical Ayurveda text
- Constitution and prakriti framing
- Practitioner-facing explanatory bridge

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text from copyrighted editions.

### Ayurveda: Materia Medica

No additional Ayurveda materia medica text is currently part of the user-approved core canon. Prior generic candidates are excluded from core guiding use unless the user explicitly re-approves them.

### TCM: Foundational Theory

#### Huang Di Nei Jing Su Wen

Role:

- Foundational TCM philosophy
- Yin/yang
- Qi dynamics
- Organ systems
- Pattern logic

Primary source:

- https://ia903101.us.archive.org/8/items/HuangDiNeiJingSuWen/Huang%20Di%20Nei%20jing%20su%20wen.pdf

#### The Web That Has No Weaver

Author:

- Ted J. Kaptchuk

Role:

- Modern TCM philosophical and conceptual bridge
- Practitioner-facing explanation of Chinese medicine pattern language
- Longstanding interpretive reference for TCM worldview

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text from copyrighted editions.

### TCM: Materia Medica

#### User-Confirmed TCM Materia Medica Pending

Role:

- TCM herb database
- Channels entered
- Temperatures
- Contraindications
- Herb functions

Note:

- User will send the exact office TCM materia medica title when available. Keep this layer open until the exact title/edition is confirmed. No other TCM materia medica or formula text is currently part of the core canon.

### Homeopathy: Foundational Theory

#### Organon of the Medical Art / Organon of Medicine

Role:

- Foundational homeopathic philosophy
- Constitutional logic
- Case methodology
- Authoritative philosophical frame

Primary source:

- https://archive.org/details/organonofmedicin0000hahn/page/n9/mode/2up

Local file status:

- Present as `data/raw/organon_medicine.pdf`.
- Additional local historical edition present as `data/raw/organon_homeopathic_medicine_1849_third_american.pdf`.

Edition note:

- Prefer the 6th edition when using `Organon of the Medical Art` as the core modern Organon reference.
- Keep edition metadata explicit and do not merge editions without edition-aware citation handling.

#### The Science of Homeopathy

Role:

- Homeopathic system framework
- Levels of health
- Case reasoning architecture

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text.

#### The Soul of Remedies

Role:

- Modern remedy framework
- Remedy essence and differentiation
- Sensation/vital approach reference

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text.

### Homeopathy: Materia Medica / Repertory

#### Boericke's New Manual of Homeopathic Materia Medica with Repertory

Role:

- Remedy database
- Modalities
- Constitutional tendencies
- Symptom patterns
- Repertory reference

Primary sources:

- https://archive.org/details/BoerickeMateriaMedica_201510
- https://www.homeoint.org/books/boericmm/index.htm

#### Desktop Guide to Keynotes and Confirmatory Symptoms

Role:

- Clinical keynotes
- Confirmatory symptoms
- Remedy differentials
- Practical clinical reference

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text.

#### Desktop Companion to Physical Pathology

Role:

- Physical pathology reference
- Pathology-oriented remedy differentials
- Practical clinical reference

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text.

#### Kent's Final General Repertory

Role:

- Repertory logic
- Symptom indexing
- Remedy mapping

#### Homeopathic Medical Repertory, 3rd ed.

Author:

- Robin Murphy

Role:

- Modern clinical repertory
- Organ-system alphabetical organization
- Clinical diagnosis bridge for practitioners moving between biomedical and homeopathic frameworks

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text from copyrighted editions.

### General Herbal Medicine

#### Encyclopedia of Herbal Medicine

Author:

- Andrew Chevallier

Role:

- Broad Western/general herbal medicine reference
- Botanical and herbal cross-checking layer
- General herb safety/context support outside tradition-specific materia medica

Access rule:

- Treat as private/local or metadata-only unless lawful open access or permission is confirmed.
- Do not commit extracted full text from copyrighted editions.

Traditional-system rule:

- General herbal references should support safety and cross-checking, not override Ayurveda or TCM materia medica logic.

### Yoga / Consciousness / Communication Layer

#### The Secret of the Yoga Sutra: Samadhi Pada

Role:

- Yoga psychology
- Consciousness framework
- Subtle-body concepts
- Interpretive architecture
- Practitioner-facing conceptual layer

Use:

- Uploaded local PDF only
- Private ingestion only
- Do not publish extracted text

#### Science of Breath

Role:

- Communication-style layer
- East/West explanatory framework
- Breath/body/mind integration
- Educational tone reference

Use only for:

- Style analysis
- Communication architecture
- Response tone
- Practitioner explanation structure

Do not treat this as a primary medical authority.

Local private file status:

- Registered in [PRIVATE_SOURCE_REGISTER.md](PRIVATE_SOURCE_REGISTER.md).
- Expected local path: `private_sources/communication/science_of_breath.pdf`.
- The `private_sources/` directory is git-ignored and must remain private.

Additional communication style references:

- Yoga and Psychotherapy
- The Web That Has No Weaver

## Ingestion Rules

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

Do not:

- Mix traditions together during ingestion
- Merge translations into one text
- Discard metadata
- Remove uncertainty language

Prefer:

1. Embedded text extraction
2. OCR only if necessary
3. Markdown normalization
4. Structured JSONL chunks

## Output Architecture

Outputs must remain separated by tradition first:

- Ayurveda
- TCM
- Homeopathy

Cross-tradition synthesis happens after tradition-specific retrieval.

Never collapse traditions into one truth.

## Safety Rules

Always include:

- Educational use language
- Practitioner review requirements
- Contraindication awareness
- Red-flag suppression logic

If severe red flags appear:

- Suppress traditional suggestions
- Prioritize referral language

## Communication Style

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

## Ranking / Confidence

Confidence scores should combine:

- Symptom match
- Modality match
- Constitution/context match
- Source authority
- Citation quality
- Cross-tradition agreement
- Safety completeness

The app ranks source-supported traditional relevance, not scientific proof.

## Development Rule

Do not continue adding isolated ingestion scripts without maintaining architecture consistency.

Before new features:

1. Maintain metadata structure.
2. Maintain citation traceability.
3. Maintain safety rules.
4. Maintain separation of traditions.
5. Maintain communication-style consistency.

When external ChatGPT collaboration is needed, ask the user to provide ChatGPT's output or decision guidance and document the resulting decision in the relevant project docs.
