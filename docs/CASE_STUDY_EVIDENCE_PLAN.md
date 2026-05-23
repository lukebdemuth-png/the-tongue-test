# Case Study Evidence Plan

Case studies are the clinical reasoning and outcome layer for the Pattern App brain. They do not replace classical texts, materia medica, repertories, or safety rules.

## Purpose

Use case studies to teach the brain how practitioners reason through real cases:

- symptoms and signs
- traditional pattern interpretation
- treatment-category rationale
- intervention details
- follow-up and outcome tracking
- adverse events or limitations
- uncertainty and missing information

## Three Healing Arts Coverage

### Ayurveda

Needed case-study coverage:

- digestive/agni/ama presentations
- skin conditions with dosha and srotas reasoning
- pain and musculoskeletal cases
- metabolic/endocrine cases
- respiratory/allergy cases
- mental health, sleep, and stress cases
- reproductive/menstrual cases
- cases with clear diet, lifestyle, herb, procedure, and follow-up logic

### Traditional Chinese Medicine

Needed case-study coverage:

- syndrome differentiation with tongue, pulse, signs, and symptoms
- formula-selection cases
- acupuncture/moxibustion cases with pattern rationale
- pain and musculoskeletal cases
- digestive and metabolic cases
- respiratory/allergy cases
- mental health, sleep, and stress cases
- cases separating excess/deficiency, hot/cold, damp/dry, qi/blood/fluid

### Homeopathy

Needed case-study coverage:

- individualized remedy case reports
- case series with remedy differentiating symptoms
- repertory rubrics and materia medica confirmation
- physical pathology cases
- mental/emotional and constitutional cases
- follow-up cases showing remedy response, aggravation, change of remedy, or no response
- reports using HOM-CASE or similar case-reporting guidance

## Current Evidence Pull

The current PubMed/PMC pull is stored in:

- `sources/metadata/pubmed_case_reasoning/records.jsonl`
- `sources/metadata/pubmed_case_reasoning/chunks.jsonl`
- `sources/metadata/pubmed_case_reasoning/intervention_outcome_relationships.jsonl`
- `sources/metadata/pubmed_case_reasoning/case_study_evidence_report.md`

Generate a fresh report:

```bash
python3 src/pattern_app_case_study_report.py --print
```

## High-Value Source Examples

Initial examples found in open biomedical indexes include:

- Ayurveda achalasia case report: `https://pmc.ncbi.nlm.nih.gov/articles/PMC4395928/`
- Ayurveda lichen planus case report: `https://pmc.ncbi.nlm.nih.gov/articles/PMC10972801/`
- Ayurveda and yoga cholecystitis case report: `https://pmc.ncbi.nlm.nih.gov/articles/PMC8039339/`
- Homeopathy vitiligo case series: `https://pmc.ncbi.nlm.nih.gov/articles/PMC5723025/`
- Homeopathy surgical menopause multimorbidity case report: `https://pmc.ncbi.nlm.nih.gov/articles/PMC7580138/`
- Homeopathy case-reporting guidance: `https://pmc.ncbi.nlm.nih.gov/articles/PMC8803476/`
- TCM syndrome differentiation biomarker study: `https://pmc.ncbi.nlm.nih.gov/articles/PMC3859256/`
- TCM chronic low back pain syndrome-differentiation protocol: `https://pmc.ncbi.nlm.nih.gov/articles/PMC9056205/`

## Next Actions

1. Replace broad PubMed queries with focused tradition-specific case-study queries.
2. Filter out unrelated biomedical differential-diagnosis records.
3. Extract structured fields from case reports:
   - presenting symptoms
   - traditional diagnosis/pattern/rubric
   - intervention category
   - rationale
   - follow-up
   - outcome
   - limitations
   - safety concerns
4. Build case-study scoring:
   - case relevance
   - reasoning clarity
   - outcome clarity
   - follow-up quality
   - safety reporting
   - citation completeness
5. Use case studies to test the next-best-question engine.
6. Keep case studies below classical sources in authority ranking but high for applied reasoning.
