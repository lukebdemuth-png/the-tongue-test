# Core Book Canon

This document records the current core book set for the Pattern App. It is the working canon for Homeopathy, Ayurveda, Traditional Chinese Medicine, and general herbal source prioritization.

The app remains a practitioner-facing research and comparison tool. These books support citation-based traditional-system analysis; they do not turn the app into a diagnostic or prescribing system.

## Access Rule

Classical public-domain or open-access texts can be ingested into extracted text, markdown, and JSONL chunks after rights/access review.

Modern copyrighted books should be treated as private/local or metadata-only sources unless explicit permission or lawful open access is confirmed. Do not commit extracted full text from private/current copyrighted books. For those sources, preserve bibliographic metadata, chapter/section references when available, user-owned local paths if supplied, and short internal notes needed for retrieval architecture.

## Practitioner-Recommended Medicine Canon

The following list reflects the current medicine-book canon for Patterns. Communication-style references and case-study/outcome evidence are separate layers and should not be mixed into the core medicine canon.

## Homeopathy Core Books

### Foundational And System Framework

1. `Organon of the Medical Art` by Samuel Hahnemann
   - Role: foundational/authoritative philosophical text.
   - App layer: foundational theory, case methodology, philosophical frame.
   - Edition preference: 6th edition preferred when edition-specific access is available; keep edition metadata distinct because 5th/6th edition history and posthumous publication questions matter for interpretation.
   - Access handling: modern editions/translations may be copyrighted; use public-domain Organon editions for publishable extracted text unless the user supplies a lawful private copy for private-only indexing.

2. `The Science of Homeopathy` by George Vithoulkas
   - Role: framework of the system.
   - App layer: homeopathic theory, levels of health, case reasoning framework.
   - Access handling: likely modern copyrighted text; track as private/local or metadata-only until rights are clear.

3. `The Soul of Remedies` by Dr. Rajan Sankaran
   - Role: newer framework of the system.
   - App layer: remedy essence, sensation/vital approach, modern interpretive framework.
   - Access handling: likely modern copyrighted text; track as private/local or metadata-only until rights are clear.

### Clinical Application References

4. `Boericke's New Manual of Homeopathic Materia Medica with Repertory` by William Boericke
   - Role: practical materia medica plus repertory reference.
   - App layer: remedy database, modalities, constitutional tendencies, symptom patterns, repertory direction.
   - Access handling: public-domain/structured web editions may be usable after robots/terms review; modern edited editions may be copyrighted.

5. `Desktop Guide to Keynotes and Confirmatory Symptoms` by Roger Morrison, M.D.
   - Role: clinical keynotes and confirmatory symptoms.
   - App layer: remedy differentials, keynote confirmation, clinical decision support.
   - Access handling: likely modern copyrighted text; private/local or metadata-only unless rights are clear.

6. `Desktop Companion to Physical Pathology` by Roger Morrison, M.D.
   - Role: clinical pathology-oriented homeopathic reference.
   - App layer: pathology-based remedy differentials and clinical context.
   - Access handling: likely modern copyrighted text; private/local or metadata-only unless rights are clear.

7. `Kent's Final General Repertory` by James Tyler Kent
   - Role: repertory logic and symptom-to-remedy mapping.
   - App layer: repertory, rubrics, remedy weighting.
   - Access handling: verify edition and rights. Public-domain Kent repertory sources may be used for publishable extraction; modern edited editions may be copyrighted.

8. `Homeopathic Medical Repertory`, 3rd ed. by Robin Murphy
   - Role: modern clinical repertory organized by organ system alphabetically and by clinical diagnosis.
   - App layer: practitioner bridge between biomedical framing and homeopathic rubric navigation.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear.

## Ayurveda Core Books

### Classical Foundation

1. `Charaka Samhita`
   - Role: foundational Ayurveda theory, doshas, pathology, diagnosis, physiology, treatment principles.
   - Current repo status: processed baseline exists.

2. `Sushruta Samhita`
   - Role: classical expansion layer, anatomy, surgery, diagnostics.
   - Current repo status: Volume 1 baseline processed; OCR/heading quality review still needed.

3. `Vagbhata Samhita`
   - Role: practical clinical Ayurveda, integrated treatment logic, formulations, lifestyle.
   - Current repo status: represented in the repo by `Ashtanga Hridayam` by Vagbhata; processed baseline exists.

### Vasant Lad Textbook Core

4. `Textbook of Ayurveda, Vol. 1: Fundamental Principles of Ayurveda` by Vasant Lad
   - Role: modern educational framework for fundamental principles.
   - App layer: communication bridge, practical concept organization, modern practitioner teaching layer.
   - Access handling: likely modern copyrighted text; private/local or metadata-only unless rights are clear.

5. `Textbook of Ayurveda, Vol. 2: A Complete Guide to Clinical Assessment` by Vasant Lad
   - Role: clinical assessment framework.
   - App layer: intake, prakriti/vikriti, agni, ama, dhatu/mala, pulse/tongue/clinical observation structures.
   - Access handling: likely modern copyrighted text; private/local or metadata-only unless rights are clear.

6. `Textbook of Ayurveda, Vol. 3: General Principles of Management and Treatment` by Vasant Lad
   - Role: management and treatment principles.
   - App layer: treatment categories, diet/lifestyle/herb/practice organization for practitioner review.
   - Access handling: likely modern copyrighted text; private/local or metadata-only unless rights are clear.

### Concise Practitioner Ayurveda References

7. `Ayurvedic Medicine: The Principles of Traditional Practice` by Sebastian Pole
   - Role: thorough but concise Ayurveda practice reference.
   - App layer: practical bridge for assessment, traditional interpretation, herbs, and practitioner-facing treatment-category organization.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear. Track the 2nd edition separately when available.

8. `Prakriti: Your Ayurvedic Constitution` by Robert Svoboda
   - Role: concise philosophical and constitutional Ayurveda work.
   - App layer: constitution language, prakriti framing, philosophical bridge for practitioner explanation.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear.

9. Works by Robert Svoboda
   - Role: supporting Ayurveda philosophy and practitioner interpretation layer.
   - App layer: secondary interpretive/reference layer after specific titles are supplied.
   - Access handling: metadata-only until specific titles and rights/access status are clarified.

## Traditional Chinese Medicine Core Books

### Foundational And Philosophical Framework

1. `Huangdi Neijing` / `Yellow Emperor's Inner Classic`
   - Role: most revered classical TCM foundational text; yin/yang, qi, organ networks, seasonal physiology, and pattern logic.
   - App layer: foundational theory and traditional pattern architecture.
   - Current repo status: `Huang Di Nei Jing Su Wen` processed baseline exists; edition/translator metadata still needs verification.

2. `The Web That Has No Weaver` by Ted J. Kaptchuk
   - Role: modern philosophical and conceptual bridge for TCM.
   - App layer: practitioner-facing explanation, TCM worldview, pattern-language communication.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear.

### TCM Materia Medica

3. TCM Materia Medica title pending user confirmation
   - Role: TCM herb database, properties, channels, functions, contraindications, and formula support.
   - App layer: herb/formula safety and practitioner review.
   - Access handling: await exact title from user; treat as private/local or metadata-only unless rights are clear.

## General Herbal Medicine Core Books

1. `Encyclopedia of Herbal Medicine` by Andrew Chevallier
   - Role: broad Western/general herbal medicine reference.
   - App layer: general herb reference, botanical cross-checking, safety review, and non-TCM/non-Ayurveda herb context.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear.

## Priority Implication

For Homeopathy, the app needs both foundational philosophy and practical clinical references. The highest missing practical layers are Boericke, Morrison, Kent-style repertory/rubric data, and Murphy's modern clinical repertory.

For Ayurveda, the app has the classical foundation started. The next useful private/metadata layers are Vasant Lad Vol. 2 for clinical assessment, Sebastian Pole for concise practitioner application, and Svoboda's `Prakriti` for constitution/philosophy.

For TCM, Huangdi Neijing remains the classical foundation. Kaptchuk should be treated as a modern explanatory bridge, and the exact TCM materia medica title should be added when the user sends it.

For general herbs, Chevallier is a supporting herbal reference and should not override tradition-specific materia medica without practitioner review.
