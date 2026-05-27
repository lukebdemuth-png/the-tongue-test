# Core Book Canon

This document records the current user-approved core book set for the Pattern App. It is the working canon for Homeopathy, Ayurveda, Traditional Chinese Medicine, and general herbal source prioritization.

The app remains a practitioner-facing research and comparison tool. These books support citation-based traditional-system analysis; they do not turn the app into a diagnostic or prescribing system.

## Access Rule

Classical public-domain or open-access texts can be ingested into extracted text, markdown, and JSONL chunks after rights/access review.

Modern copyrighted books should be treated as private/local or metadata-only sources unless explicit permission or lawful open access is confirmed. Do not commit extracted full text from private/current copyrighted books. For those sources, preserve bibliographic metadata, chapter/section references when available, user-owned local paths if supplied, and short internal notes needed for retrieval architecture.

## User-Approved Medicine Canon

The following list combines the user's practitioner-supplied book lists and replaces prior generic/ChatGPT-suggested canon candidates. Communication-style references and case-study/outcome evidence are separate layers and should not be mixed into the core medicine canon.

Only the sources below should be treated as core guiding medicine texts unless the user explicitly adds another book later.

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

8. `Lectures on Homeopathic Materia Medica` by James Tyler Kent
   - Role: materia medica, constitutional interpretation, and remedy differentiation.
   - App layer: remedy pictures, constitutional tendencies, remedy psychology, and confirmation layer alongside Boericke and Kent repertory rubrics.
   - Access handling: verify edition and rights. Public-domain editions may be used for publishable extraction after access review; modern edited editions must remain private/local or metadata-only unless rights are clear.

9. `Homeopathic Medical Repertory`, 3rd ed. by Robin Murphy
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

9. Other works by Robert Svoboda
   - Role: supporting Ayurveda philosophy and practitioner interpretation layer.
   - App layer: candidate secondary interpretive/reference layer only after specific titles are supplied.
   - Access handling: metadata-only until specific titles and rights/access status are clarified.
   - Core handling: `Prakriti` is the named core title; other Svoboda works are not individually core until the user names them.

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

### TCM Materia Medica And Formulas

3. `Chinese Herbal Medicine: Materia Medica`
   - Role: TCM herb database, properties, channels, functions, contraindications, and formula support.
   - App layer: herb/formula safety and practitioner review.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear. Do not commit extracted full text without permission or lawful open access.

4. `Chinese Herbal Medicine: Formulas and Strategies`
   - Role: TCM formula reference, formula architecture, herb interactions, and formula relationships.
   - App layer: formula considerations, pattern-to-formula mapping, modification logic, and practitioner review.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear. Do not commit extracted full text without permission or lawful open access.

5. User-confirmed office TCM materia medica title pending
   - Role: additional practitioner office reference once the exact title and edition are supplied.
   - App layer: supplemental TCM materia medica and clinical confirmation.
   - Access handling: await exact title from user; treat as private/local or metadata-only unless rights are clear.

### TCM Diagnostic And Tongue Assessment Expansion

6. `The Foundations of Chinese Medicine` by Giovanni Maciocia
   - Role: broad modern textbook for TCM physiology, pathology, pattern differentiation, acupuncture-point principles, and treatment principles.
   - App layer: technical TCM organ-system language, pattern differentiation, zang-fu explanation, and practitioner-facing interpretation structure.
   - Source note: Giovanni-Maciocia.com and Elsevier describe the 3rd edition as covering basic TCM theory, acupuncture, acupuncture points, and principles of treatment.
   - Access handling: modern copyrighted text; metadata-only/private-local unless rights are clear. Do not commit extracted full text.

7. `Diagnosis in Chinese Medicine: A Comprehensive Guide` by Giovanni Maciocia
   - Role: diagnostic framework, clinical manifestations, pattern identification, tongue/pulse diagnosis, and Western-patient clinical adaptation.
   - App layer: intake interpretation, symptom-context weighting, TCM technical language, and plain-English decoding of pattern logic.
   - Source note: Maciocia/Elsevier pages describe it as a complete, illustrated guide to Chinese medicine diagnosis with tongue and pulse diagnosis and pattern identification.
   - Access handling: modern copyrighted text; metadata-only/private-local unless rights are clear. Do not commit extracted full text.

8. `Tongue Diagnosis in Chinese Medicine` by Giovanni Maciocia
   - Role: tongue-sign interpretation, tongue body/coating/location logic, and linking tongue observation to pattern differentiation.
   - App layer: visible tongue sign descriptions, organ-map interpretation, and report language for image-based tongue assessment.
   - Access handling: modern copyrighted text; metadata-only/private-local unless rights are clear. Do not commit extracted full text.

9. `Atlas of Chinese Tongue Diagnosis` by Barbara Kirschbaum
   - Role: picture-heavy clinical tongue diagnosis atlas.
   - App layer: visual comparison, tongue color/coating/shape/location interpretation, and clinical tongue-pattern language.
   - Source note: Open Library records Eastland Press editions, including a 2010 second edition; Google Books metadata describes links between tongue diagnosis theory and clinical practice.
   - Access handling: modern copyrighted text; metadata-only/private-local unless rights are clear. Do not commit extracted full text.

10. `Pocket Atlas of Tongue Diagnosis` by Claus C. Schnorrenberger and Beate Schnorrenberger
   - Role: concise tongue diagnosis atlas with Chinese therapy guidelines, including acupuncture, herbs, and nutrition in the second edition.
   - App layer: visual tongue-sign organization, location-based pattern interpretation, and diet/lifestyle/herb-category bridge language.
   - Source note: Thieme/Open Library metadata lists the 2011 second edition as `Pocket atlas of tongue diagnosis: with Chinese therapy guidelines for acupuncture, herbs, and nutrition`.
   - Access handling: modern copyrighted text; metadata-only/private-local unless rights are clear. Do not commit extracted full text.

## General Herbal Medicine Core Books

1. `Encyclopedia of Herbal Medicine` by Andrew Chevallier
   - Role: broad Western/general herbal medicine reference.
   - App layer: general herb reference, botanical cross-checking, safety review, and non-TCM/non-Ayurveda herb context.
   - Access handling: modern copyrighted text; private/local or metadata-only unless rights are clear.

## Priority Implication

For Homeopathy, the app needs both foundational philosophy and practical clinical references. The highest missing practical layers are Boericke, Morrison, Kent's repertory/rubric data, Kent's materia medica lectures, and Murphy's modern clinical repertory.

For Ayurveda, the app has the classical foundation started. The next useful private/metadata layers are Vasant Lad Vol. 2 for clinical assessment, Sebastian Pole for concise practitioner application, and Svoboda's `Prakriti` for constitution/philosophy.

For TCM, Huangdi Neijing remains the classical foundation. Kaptchuk should be treated as a modern explanatory bridge. Maciocia's foundations/diagnosis/tongue diagnosis works and the Kirschbaum/Schnorrenberger tongue atlases now support the technical explanation and visual tongue assessment lanes. `Chinese Herbal Medicine: Materia Medica` and `Chinese Herbal Medicine: Formulas and Strategies` are active core TCM herb/formula targets; the separate office materia medica title can be added when the user sends it.

For general herbs, Chevallier is a supporting herbal reference and should not override tradition-specific materia medica without practitioner review.
