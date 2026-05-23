# Treatment Plan Output Design

The Pattern App should produce more than pattern matches. It should generate a structured practitioner-review treatment plan draft, then translate that plan into a digestible client/patient teaching sequence.

The app must not present this as a diagnosis, prescription, or replacement for clinical judgment.

## Core Output Layers

```text
1. Safety and scope note
2. Cross-tradition outcome
3. Treatment plan draft for practitioner review
4. Client/patient teaching sequence
5. How-this-was-built reasoning details
6. Tradition-specific analysis
7. Citations and confidence notes
8. Follow-up and reassessment prompts
```

The final app should make the cross-tradition outcome easy to digest first. The separate Ayurveda, TCM, and Homeopathy views should remain available underneath as the reasoning trail, not as the first thing a practitioner has to parse.

Current schema file: `schemas/pattern_app_output.schema.json`.

Current implementation returns a `practitioner_output` object with:

- `safety_gate`
- `cross_tradition_outcome`
- `treatment_plan_draft`
- `tradition_evaluations`
- `intake_state`
- `citations`
- `practitioner_review_required`
- `disclaimer`

## Unified Intake And Hidden Evaluation Packets

The user-facing intake should remain one form. The app then derives three hidden evaluation packets:

- Ayurveda packet: dosha flags, agni flags, possible ama signs, missing Ayurveda observations
- TCM packet: pattern tendency flags, tongue/pulse/thirst/sweating/bowel-urine missing fields
- Homeopathy packet: rubric seed terms, modalities, generals, peculiar symptoms, remedy/repertory hints

This keeps the app easy to use while preserving tradition-specific reasoning separation.

## Progressive Intake

Minimum first-pass fields:

- chief complaint
- primary symptoms
- duration
- severity
- current medications
- pregnancy/postpartum status when relevant

Deepening fields:

- better/worse modalities
- digestion/appetite/stool
- sleep
- energy
- mood
- temperature/thirst/dryness
- tongue/pulse/constitutional notes
- homeopathic generals, peculiar symptoms, cravings/aversions, thermal state

The app should produce a first pass when minimum safety and case information is available, then ask the next best question to improve confidence.

## 1. Practitioner Summary

This is the high-level clinical reasoning snapshot.

It should include:

- main presenting concern
- key symptom clusters
- red flags or safety cautions
- most likely Ayurveda direction
- most likely TCM direction
- most likely Homeopathy direction
- cross-tradition themes
- strongest citations
- confidence level
- what still needs clarification

Example shape:

```json
{
  "practitioner_summary": {
    "case_snapshot": "",
    "primary_traditional_directions": [],
    "shared_themes": [],
    "key_cautions": [],
    "confidence_summary": "",
    "next_best_question": ""
  }
}
```

## 2. Treatment Plan Draft

The plan should organize actions by tradition and by category.

It should not say `take this herb` or `prescribe this remedy`.

It should say:

- `review this herb category`
- `consider whether this formula category is appropriate`
- `source-supported direction for practitioner evaluation`
- `client education focus`

### Ayurveda Plan Categories

- dietary direction
- lifestyle/routine direction
- herb category
- formula category
- yoga/breath/practice category
- contraindications
- follow-up observations

### TCM Plan Categories

- formula category
- herb category
- diet direction
- lifestyle direction
- acupuncture/moxibustion category when relevant
- contraindications
- follow-up observations

### Homeopathy Plan Categories

- remedy differentials
- repertory rubric cluster
- key modalities to confirm
- constitutional/general symptoms to verify
- follow-up response markers
- contraindications/cautions

Current implementation note: Boericke/Homeoint is the first source-backed remedy-differential layer in the prototype. Selected Kent/Homeoint repertory sections are also used as the first rubric-cluster layer. Remedy directions must remain differentials for practitioner review until repertory rubrics, full case generals, modalities, contraindications, and practitioner judgment are added. The app should show why each remedy or rubric surfaced, including matched concepts, source snippets, citation IDs, and confidence scores below the highest tier when only partial support is available.

Current Ayurveda implementation note: the prototype includes a first-pass Ayurveda pattern-to-treatment category engine. It maps the unified intake packet into vata/pitta/kapha, agni, ama, sleep, appetite, digestion, and energy tags, then produces cited practitioner-review categories. Herb and formula outputs remain safety-held categories until Dravyaguna, materia medica, formulation, and contraindication data are stronger.

## 3. Treatment Direction Object

```json
{
  "tradition": "",
  "category": "herbs | formulas | diet | lifestyle | yoga_breath | remedy_differential | rubric_cluster",
  "direction": "",
  "practitioner_action": "",
  "client_facing_language": "",
  "why_this_matches": [],
  "citations": [],
  "confidence_score": 0,
  "safety_notes": [],
  "contraindications": [],
  "review_priority": "review_first | review_second | exploratory | hold_until_clarified"
}
```

Contraindication review notes are required on every concrete treatment-direction object. Missing medication status, missing pregnancy status, blood thinner use, serious medical history, and condition-specific cautions should lower confidence or hold suggestions until clarified.

## 4. Client/Patient Teaching Sequence

The app should turn the practitioner plan into a clear explanation sequence.

The teaching sequence should be educational, simple, and non-prescriptive.

Recommended sequence:

1. `What we are noticing`
2. `How this pattern is understood traditionally`
3. `Why these categories may be relevant`
4. `What the practitioner will review`
5. `What to watch for`
6. `When to seek medical evaluation`
7. `Follow-up questions`

Example language:

`From a traditional-pattern perspective, your notes point toward a relationship between sleep, digestion, and energy. The practitioner will review whether the pattern is more depletion, stagnation, heat, cold, dryness, or dampness before choosing any herbs, remedies, formulas, diet changes, or practices.`

Avoid:

- `You have...`
- `You should take...`
- `This will cure...`
- `This replaces medical care...`

## 5. Follow-Up And Reassessment

Every plan draft should include tracking prompts.

Track:

- symptom intensity
- frequency
- duration
- sleep
- digestion
- mood
- energy
- adverse reactions
- medication/herb changes
- practitioner modifications

The follow-up system should ask:

- What changed first?
- What got worse?
- What stayed the same?
- Did any new symptoms appear?
- Did the practitioner change the plan?

## 6. My Recommendation

Build plan generation in two stages.

Stage 1:

- Output treatment categories, not specific protocols.
- Include practitioner summary and client teaching text.
- Keep confidence and citations visible.

Stage 2:

- Add source-backed herb/formula/remedy suggestions only when materia medica, repertory, contraindication, and safety data are strong enough.
- Require a contraindication check before anything appears as a concrete option.

This keeps the app useful immediately while preventing it from becoming an unsafe prescription engine.
