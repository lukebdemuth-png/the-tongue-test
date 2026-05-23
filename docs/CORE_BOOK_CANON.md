# Core Book Canon

This document records the current core book set for the Pattern App. It is the working canon for Homeopathy and Ayurveda source prioritization.

The app remains a practitioner-facing research and comparison tool. These books support citation-based traditional-system analysis; they do not turn the app into a diagnostic or prescribing system.

## Access Rule

Classical public-domain or open-access texts can be ingested into extracted text, markdown, and JSONL chunks after rights/access review.

Modern copyrighted books should be treated as private/local or metadata-only sources unless explicit permission or lawful open access is confirmed. Do not commit extracted full text from private/current copyrighted books. For those sources, preserve bibliographic metadata, chapter/section references when available, user-owned local paths if supplied, and short internal notes needed for retrieval architecture.

## Homeopathy Core Books

### Foundational And System Framework

1. `Organon of the Medical Art` by Samuel Hahnemann
   - Role: foundational/authoritative philosophical text.
   - App layer: foundational theory, case methodology, philosophical frame.
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

## Priority Implication

For Homeopathy, the app needs both foundational philosophy and practical clinical references. The highest missing practical layers are Boericke, Morrison, and Kent-style repertory/rubric data.

For Ayurveda, the app has the classical foundation started. The next useful private/metadata layer is Vasant Lad Vol. 2 because it directly improves practitioner intake and clinical assessment structure.
