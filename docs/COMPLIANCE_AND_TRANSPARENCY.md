# Patterns Compliance And Transparency Notes

## Purpose

Patterns is framed as a wellness education, self-reflection, and traditional pattern exploration tool across Ayurveda, Chinese Medicine, and Homeopathy.

It must not be presented as a medical device, diagnostic engine, prescription engine, treatment plan generator, emergency tool, or replacement for doctors, licensed practitioners, emergency care, or prescribed medication.

## Required Disclaimer Language

Full app disclaimer:

> Patterns is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.

Short result disclaimer:

> Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.

Emergency warning:

> If you are experiencing a medical emergency, call emergency services immediately.

## Output Framing

Visible app language should prefer:

- Pattern Insight
- Suggested Wellness Direction
- Tradition-Based Suggestion
- User or Client
- Qualified professional review
- Educational possibility

Visible app language should avoid presenting outputs as:

- Diagnosis
- Prescription
- Treatment plan
- Cure
- Medical recommendation
- Patient-specific instruction

## Basis Of Insight

Results include a Basis of Insight disclosure:

> Outputs are generated from traditional wellness frameworks, source texts, user-entered information, and app logic. They are not generated from medical testing, physical examination, clinical diagnosis, or emergency evaluation.

## Safety Override

When red-flag language is detected, the app should hold tradition-based wellness directions and prioritize emergency or appropriate medical evaluation language.

Current behavior:

- Red-flag result confidence becomes `safety-first hold`.
- Lifestyle/action rows are suppressed.
- Herb, formula, remedy, and repertory rows are suppressed.
- The emergency warning remains attached to output.

## Implementation Points

- UI disclosures live in `components/compliance/disclosures.tsx`.
- The tongue assessment app places calm disclosure language in the hero/onboarding copy, AI visible-sign result, pattern summary, result disclosure stack, and bottom app disclosure band.
- Tongue assessment outputs are framed as educational Chinese medicine-style pattern insights and tradition-based possibilities, not medical diagnosis, treatment, prescription, or instructions.
- Backend disclaimer constants live in `src/pattern_app_retrieval.py`.
- The brain trace attaches disclaimer, short disclaimer, emergency warning, and Basis of Insight to practical output.
- Red-flag suppression is enforced in `apply_symptom_outcome_layer` in `src/pattern_app_brain.py`.
