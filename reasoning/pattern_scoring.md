# Pattern Scoring

This framework ranks possible interpretations for retrieval and explanation. It does not diagnose, prescribe, or replace clinical judgment.

## Ranking Order

1. Safety override
2. Pattern match score
3. Symptom strength
4. Source support
5. Cross-tradition agreement
6. Contradiction detection
7. Missing-information penalty
8. Root-cause explanatory power

Safety always outranks pattern logic. If a red flag is present, the system should explain the safety concern before any traditional interpretation.

## Candidate Interpretation

A candidate interpretation is a possible pattern, syndrome, constitution, remedy picture, clinical reasoning frame, or integrative explanation.

Each candidate should include:

- `tradition`
- `pattern_name`
- `pattern_type`
- `matched_signs`
- `unmatched_signs`
- `contradicting_signs`
- `missing_key_data`
- `source_citations`
- `score_breakdown`

## Score Components

Use a 0-100 score for internal ranking.

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

`safety_gate` is `0` for interpretations that should not be shown until urgent safety guidance is surfaced. It is `1` for non-urgent cases.

## Pattern Match Score

Pattern match measures how many user signs match known pattern features.

```text
pattern_match_score = matched_pattern_features / total_required_or_characteristic_features
```

Weight required signs more heavily than optional signs:

- Required or defining feature: `3`
- Strong characteristic feature: `2`
- Supportive feature: `1`
- Weak or incidental feature: `0.5`

Do not over-reward vague matches. A broad sign such as `fatigue` should count less than a specific sign such as `fatigue worse after eating`.

## Symptom Strength

Major symptoms count more than minor symptoms.

Major symptoms include:

- primary complaint
- severe symptom
- persistent symptom
- symptom affecting function
- symptom repeatedly mentioned by the user
- symptom with clear timing, trigger, modality, or progression

Minor symptoms include:

- occasional or mild signs
- vague background signs
- signs mentioned once without detail

Suggested weights:

- Major symptom: `3`
- Moderate symptom: `2`
- Minor symptom: `1`
- Unclear symptom: `0.5`

## Source Support

Increase confidence when multiple source classes support the same interpretation.

Source support hierarchy:

1. Classical authoritative text
2. Peer-reviewed case report or clinical study
3. Practitioner methodology paper
4. Structured database
5. Intake form or diagnostic questionnaire
6. Teacher lecture or transcript
7. General educational article

Suggested source values:

- Classical authoritative text: `5`
- Peer-reviewed clinical study: `4.5`
- Peer-reviewed case report: `4`
- Practitioner methodology paper: `3.5`
- Structured database: `3`
- Intake form or diagnostic questionnaire: `2.5`
- Teacher lecture or transcript: `2`
- General educational article: `1`

Use overlap, not raw count. Ten weak articles should not outrank one strong source plus a relevant case report.

## Cross-Tradition Agreement

Cross-tradition agreement increases confidence only when the underlying pattern logic is similar, not merely when labels sound alike.

Examples of comparable logic:

- heat, inflammation, thirst, irritability across Ayurveda/TCM/Homeopathy
- coldness, low vitality, sluggish digestion, pallor across traditions
- dryness, depletion, insomnia, anxiety, constipation across traditions
- dampness/heaviness/congestion with slow metabolism or stagnation language

Mark agreement as:

- `strong`: three or more traditions align on pattern logic
- `moderate`: two traditions align on pattern logic
- `weak`: labels overlap but reasoning differs
- `none`: no meaningful agreement

## Contradiction Detection

Contradictions are signs that argue against a candidate interpretation.

Examples:

- Candidate suggests heat, but user reports chilliness, aversion to cold, and no thirst.
- Candidate suggests deficiency/depletion, but user has acute high fever and severe inflammatory signs.
- Candidate suggests dryness, but user reports heavy mucus, edema, and damp congestion.
- Candidate remedy picture requires thirstlessness, but user has strong thirst.

Contradictions should reduce confidence and appear in the output.

## Missing-Information Penalty

Lower confidence when key discriminating data is missing.

Common missing fields:

- onset and duration
- severity
- age and pregnancy status when relevant
- red flags
- current medications or diagnosis
- fever, pain, bleeding, shortness of breath, neurological signs
- digestion, sleep, thirst, temperature preference
- modalities: better/worse from heat, cold, rest, motion, food, time of day
- follow-up outcome after intervention

Missing data should produce questions, not speculation.

## Root-Cause Explanatory Power

Prefer the interpretation that explains the most signs with the fewest assumptions.

High explanatory power:

- explains primary complaint
- explains secondary symptoms
- explains timing and triggers
- explains emotional, digestive, sleep, and constitutional features when present
- does not require many exceptions

Low explanatory power:

- explains only one symptom
- ignores strong contradictory signs
- depends on unsupported assumptions
- requires mixing unrelated patterns without evidence

## Required Output Shape

```json
{
  "best_fit_interpretation": {
    "name": "",
    "tradition": "",
    "pattern_type": "",
    "confidence_level": ""
  },
  "supporting_evidence": [],
  "contradictions": [],
  "missing_questions": [],
  "source_citations": [],
  "next_best_question": ""
}
```

Use calm language. Say `best fit from available information`, not `diagnosis`.
