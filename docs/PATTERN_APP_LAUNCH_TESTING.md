# Pattern App Launch Testing

This document defines the current launch-readiness testing loop for the Patterns / Three Traditions app.

## Daily 50-Case Test

Run:

```bash
python3 src/run_single_word_app_tests.py --symptoms-file examples/pattern_app_daily_symptoms.txt
```

Output is written locally to:

```text
private_sources/pattern_app_test_runs/<timestamp>/
```

Each case folder includes:

- `input.json`
- `brain_trace.json`
- `production_output.json`
- `app_preview.md`
- `practitioner_view.md`

The test output stays local because it can include source excerpts and development traces.

## Practitioner Output Order

Each practitioner view should appear in this order:

1. Safety first
2. Intake snapshot
3. Overall confidence
4. Top tradition directions
5. Ayurveda / TCM / Homeopathy detail
6. Questions to ask next
7. Practical review categories
8. Warnings / boundaries
9. Sources
10. Practitioner note

## Current Acceptance Rules

For launch-readiness, a single-word case should:

- Correct common typos visibly, such as `consitation` -> `constipation` and `headace` -> `headache`.
- Ask a symptom-specific next question when a recognizable symptom is present.
- Return insufficient evidence for generic input such as `symptoms`.
- Avoid herbs, formulas, remedies, or lifestyle categories when no source-backed match exists.
- Preserve tradition separation before synthesis.
- Keep all output educational and practitioner-facing.
- Include safety boundaries and citations when source-backed matches are shown.

## Known Gaps

- Retrieval is still lexical, not vector-based.
- Some source chunks are OCR noisy or chapter-heading heavy.
- Some results are still broad and exploratory instead of clinically precise.
- Charaka currently has only one normalized chunk and needs reprocessing.
- Supabase/pgvector is scaffolded but not connected in production yet.

## Next Quality Targets

- Add source chunk quality metadata and filter low-value chunks before ranking.
- Add symptom-specific red-flag rules, especially headache, abdominal pain, fever, breathing, and rash.
- Add vector retrieval over normalized chunks.
- Save daily test summaries so regressions are easy to compare across days.
