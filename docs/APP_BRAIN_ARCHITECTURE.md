# Pattern App Brain Architecture

This document defines the first practical architecture for the Pattern App brain.

The brain is not one prompt. It is a staged reasoning system that turns practitioner intake into cited, tradition-separated interpretations, then synthesizes across traditions while preserving uncertainty and safety.

## Core Principle

The app ranks source-supported traditional-system relevance, not medical truth.

It must never diagnose, prescribe, or collapse Ayurveda, TCM, and Homeopathy into one blended system.

## Brain Pipeline

```text
Practitioner intake
  -> safety gate
  -> intake normalization
  -> source retrieval by tradition
  -> candidate generation
  -> tradition-specific scoring
  -> contradiction and missing-data detection
  -> citation assembly
  -> treatment plan draft for practitioner review
  -> cross-tradition synthesis
  -> client/patient teaching sequence
  -> practitioner-facing output
```

## 1. Safety Gate

Safety runs before every other reasoning step.

Inputs:

- symptoms
- severity
- duration
- pregnancy status
- medications
- known conditions
- red-flag language

Outputs:

- `red_flags_detected`
- `safety_level`
- `suppressed_traditional_suggestions`
- `referral_language`

Behavior:

- If emergency red flags appear, suppress herbs, formulas, remedies, yoga, breath, and lifestyle suggestions.
- If high-priority medical review signs appear, lower confidence and add practitioner review warnings.
- If medication/pregnancy/condition data is missing, apply confidence penalties.

## 2. Intake Normalizer

The normalizer converts practitioner notes into structured features without making conclusions.

Feature groups:

- chief complaint
- primary symptoms
- secondary symptoms
- onset, duration, severity
- location, quality, timing
- better/worse modalities
- temperature, thirst, sweat
- digestion, stool, urine
- sleep, energy, mood
- constitution/context
- medications, pregnancy, allergies, known conditions
- tradition-specific observations

Normalized features should preserve the user's language and also map to controlled concept tags.

Example:

```json
{
  "raw": "worse at night, bloating, dry stool, restless sleep",
  "features": ["worse_at_night", "bloating", "dry_stool", "restless_sleep"],
  "dimensions": ["timing", "digestion", "elimination", "sleep"]
}
```

### Intake Depth

The prototype should support three intake depths.

Minimum intake:

- chief complaint
- primary symptoms
- duration if known
- severity if known

Useful intake:

- chief complaint
- primary and secondary symptoms
- duration, onset, severity, frequency
- better/worse modalities
- digestion, sleep, energy, mood
- temperature/thirst/dryness patterns
- medications, pregnancy status, known conditions

Deep practitioner intake:

- all useful intake fields
- Ayurveda notes: prakriti, vikriti, agni, ama signs, bowel pattern, tongue, pulse
- TCM notes: tongue, pulse, temperature, sweating, thirst, appetite, bowel/urine, emotional pattern
- Homeopathy notes: modalities, mental-emotional state, generals, peculiar symptoms, cravings/aversions, thermal state
- practitioner notes and desired output depth

The app should accept a minimal intake, but it should lower confidence and ask the next best question when important discriminating information is missing.

### Intake Flow

The user-facing flow should be progressive:

1. Start with symptoms and context.
2. Run an initial safety and pattern scan.
3. Ask the next best question.
4. Add tradition-specific details only when they improve ranking.
5. Re-run the trace and show what changed.

The app should not force a long form before giving any feedback. It should make missing information visible and useful.

## 3. Retrieval Layer

Retrieval must run separately for each tradition.

Ayurveda retrieval searches:

- dosha patterns
- agni and ama language
- dhatu/mala/srotas concepts
- classical citations
- modern assessment frameworks when private/local access exists

TCM retrieval searches:

- organ-system patterns
- hot/cold
- excess/deficiency
- qi/blood/fluid
- damp/phlegm/stagnation
- formula and herb logic

Homeopathy retrieval searches:

- symptom totality
- characteristic symptoms
- modalities
- mental/emotional generals
- remedy pictures
- repertory rubrics
- confirmatory symptoms

Retrieval output must include:

- source chunk ID
- source title
- tradition
- page/chapter/aphorism/rubric locator
- text preview
- matched features
- citation quality score
- rights/access note

## 4. Candidate Generator

The candidate generator groups retrieved chunks into possible interpretations.

Examples:

- Ayurveda candidate: `vata aggravation with dry/irregular digestion features`
- TCM candidate: `spleen qi deficiency with dampness`
- Homeopathy candidate: `remedy differential: Nux vomica / Lycopodium / Pulsatilla`

Each candidate should include:

```json
{
  "tradition": "",
  "candidate_name": "",
  "candidate_type": "pattern | remedy_direction | rubric_cluster | treatment_category",
  "matched_features": [],
  "unmatched_features": [],
  "contradicting_features": [],
  "missing_key_data": [],
  "supporting_citations": []
}
```

## 5. Scoring Engine

The first scoring formula:

```text
final_score =
  safety_gate *
  (
    pattern_match_score * 0.25 +
    symptom_strength_score * 0.15 +
    source_support_score * 0.20 +
    cross_tradition_score * 0.10 +
    root_cause_explanatory_score * 0.15 -
    contradiction_penalty * 0.10 -
    missing_information_penalty * 0.05
  )
```

Scores should be explainable. Every output should be able to answer:

- What matched?
- What did not match?
- What contradicted the candidate?
- Which citations support it?
- What missing answer would change confidence most?

Confidence labels:

- `85-100`: strong source-supported match
- `70-84`: likely match, practitioner review required
- `50-69`: possible match, needs more intake detail
- `30-49`: weak match, exploratory only
- `0-29`: insufficient evidence

## 6. Citation Engine

No output should make a source-backed claim without a citation object.

Citation fields:

- `citation_id`
- `source_id`
- `title`
- `author`
- `translator`
- `edition`
- `tradition`
- `page_start`
- `page_end`
- `chapter`
- `sutra_or_aphorism`
- `rubric`
- `source_url`
- `rights_note`

The citation engine should distinguish:

- public extracted source
- private/local-only source
- metadata-only source
- excerpt-only public preview

## 7. Cross-Tradition Synthesizer

Synthesis happens only after tradition-specific analysis.

It compares reasoning dimensions, not labels:

- heat/cold
- excess/deficiency
- stagnation/flow
- dryness/dampness
- depletion/agitation
- constitution/predisposition
- modalities
- intervention rationale

Synthesis output:

- shared themes
- areas of agreement
- areas of conflict
- non-equivalence notes
- what needs practitioner review
- confidence score

Forbidden synthesis behavior:

- saying traditions are identical
- claiming scientific proof
- using one tradition to validate another
- turning suggestions into prescriptions

## 8. Treatment Category Layer

The app can suggest categories for practitioner review, not prescriptions.

Allowed category language:

- Ayurveda: herbs, formulas, diet, lifestyle, yoga/breath practices
- TCM: herbs, formulas, diet, lifestyle
- Homeopathy: remedy differentials, repertory rubrics, modalities, constitution notes

Output should say:

- `suggested categories for practitioner review`
- `source-supported direction`
- `requires qualified review`

Output should not say:

- `take this`
- `prescribe this`
- `this will cure`
- `diagnosis is`

The detailed treatment plan output design lives in `docs/TREATMENT_PLAN_OUTPUT_DESIGN.md`.

## 9. Memory And Learning

The app should have two kinds of memory.

Project memory:

- source registry
- chunk schema
- known citations
- synonym maps
- pattern maps
- remedy/rubric maps
- safety rules

Case memory:

- current intake
- missing information
- questions already asked
- practitioner corrections
- outcome/follow-up notes

Do not let case memory overwrite source truth. Corrections should update the case state, not mutate source data.

## 10. Recommended First Build Order

1. Finish public Homeopathy retrieval layer:
   - Boericke materia medica: first remedy-differential layer implemented from Homeoint JSONL chunks
   - Boericke repertory
   - Kent repertory: selected Homeoint sections implemented as first rubric-cluster layer
   - Kent lectures

2. Add controlled concept tags:
   - symptoms
   - modalities
   - temperature
   - digestion
   - sleep
   - mental/emotional generals
   - red flags

3. Build candidate generator:
   - group citations by pattern/remedy/rubric cluster
   - produce matched/unmatched/contradicting features

4. Build scoring engine:
   - transparent score breakdown
   - missing-info penalties
   - contradiction penalties

5. Build next-best-question engine:
   - ask the one question most likely to change the ranking

6. Build synthesis engine:
   - compare dimensions after tradition-specific scoring
   - show agreement and conflict without flattening traditions

7. Add private-source support:
   - Vasant Lad
   - Vithoulkas
   - Sankaran
   - Morrison
   - private extracted text stays gitignored

## My Recommended Brain Shape

The strongest architecture is a hybrid system:

- structured rules for safety, metadata, citations, and scoring
- lexical/vector retrieval for finding relevant source passages
- LLM summarization only after evidence is retrieved
- deterministic output schema validation before anything reaches the UI

Do not make the LLM the source of truth. Make the LLM the explainer and comparator after the retrieval/scoring system has assembled evidence.

That gives the app a calm, intelligent voice without letting it hallucinate the medical/traditional reasoning.

## Current Prototype

The first testable brain trace is available in:

- `src/pattern_app_brain.py`
- `app/pattern-app/page.tsx`
- `app/api/pattern-brain/route.ts`

Run the CLI trace:

```bash
python3 src/pattern_app_brain.py examples/intake_sleep_digestion.json
```

Run the local browser prototype:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/pattern-app
```
