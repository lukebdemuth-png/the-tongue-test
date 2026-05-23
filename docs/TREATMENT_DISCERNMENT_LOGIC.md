# Treatment Discernment Logic

This document defines how the Pattern App should decide which traditional treatment direction is most relevant for practitioner review.

The app does not decide the best medical treatment. It ranks source-supported traditional-system treatment categories based on fit, evidence, safety, and coherence.

## Core Question

Given the practitioner intake and the retrieved source evidence, which tradition-specific direction is most worth reviewing first?

The answer should be:

- cited
- tradition-specific
- safety-aware
- uncertainty-preserving
- explainable
- not diagnostic
- not prescriptive

## Discernment Stack

```text
1. Safety filter
2. Case clarity
3. Pattern coherence
4. Source support
5. Treatment-category fit
6. Contraindication/risk review
7. Cross-tradition convergence
8. Practitioner review priority
```

## 1. Safety Filter

Safety decides whether treatment suggestions should appear at all.

Suppress suggestions when:

- emergency red flags are present
- symptoms may require urgent evaluation
- pregnancy/medication/condition risks are unresolved
- herb-drug, formula-drug, remedy-risk, or practice-risk concerns are significant

Output:

```json
{
  "safety_status": "clear | caution | suppress",
  "reason": "",
  "required_review": []
}
```

Current implementation support:

- `src/pattern_app_safety.py` detects medication, pregnancy/postpartum, condition, and missing-context cautions.
- `safety_gate.context_cautions` carries structured caution objects.
- Treatment directions receive `contraindications` review notes by category.
- Red flags keep the app in `suppress` mode and hold treatment categories until clarified.

## 2. Case Clarity

The app should know whether the intake is strong enough to rank treatment directions.

High clarity:

- clear chief complaint
- duration and severity known
- modalities known
- digestion/sleep/energy/context included
- medications and pregnancy status known
- tradition-specific observations included

Low clarity:

- vague symptom list
- missing duration/severity
- no modalities
- no medication/pregnancy context
- no differentiating features

Low clarity should produce questions before ranking too strongly.

## 3. Pattern Coherence

Pattern coherence asks:

Does one interpretation explain the case better than the alternatives?

High coherence:

- explains primary complaint
- explains secondary symptoms
- explains modalities
- explains constitution/context
- has few contradictions
- does not require mixing unrelated patterns

Low coherence:

- explains only one symptom
- ignores major symptoms
- depends on generic matches
- has contradictions
- requires too many assumptions

## 4. Source Support

Treatment directions must be backed by source layers.

Best support:

- classical theory or repertory/materia medica source
- practical clinical reference
- specific citation locator
- multiple independent citations
- citation directly relates to the matched pattern/remedy/rubric/category

Weak support:

- general article
- vague source
- no page/chapter/rubric
- source mentions a symptom but not the treatment logic

## 5. Treatment-Category Fit

The app should rank categories, not prescriptions.

Ayurveda categories:

- diet direction
- lifestyle direction
- herb category
- formula category
- cleansing/palliation category
- yoga/breath/practice category

TCM categories:

- formula category
- herb category
- diet direction
- lifestyle direction
- pattern-management strategy

Homeopathy categories:

- remedy differential
- repertory rubric cluster
- keynote confirmation
- modality confirmation
- constitutional direction

Each category gets a score:

```text
treatment_category_score =
  pattern_fit * 0.30 +
  source_specificity * 0.25 +
  symptom_priority_fit * 0.15 +
  modality_fit * 0.10 +
  safety_fit * 0.15 +
  practitioner_actionability * 0.05
```

## 6. Contraindication And Risk Review

A direction should be downgraded when:

- medication data is missing
- pregnancy status is missing or relevant
- known condition conflicts with the category
- herb/formula risk is plausible
- breath/movement practice could aggravate the case
- remedy direction is based on too little totality

Risk does not always remove the direction; it changes the wording:

- `reasonable to review`
- `review with caution`
- `do not suggest until safety information is clarified`

## 7. Cross-Tradition Convergence

Cross-tradition convergence can raise synthesis confidence, but only when logic matches.

The browser prototype now places cross-tradition outcome first. Tradition-specific analysis is kept available under the reasoning details. `synthesis_trace.tradition_weighting` gives first-pass percentages for Ayurveda, TCM, and Homeopathy based on source-supported traditional relevance, not medical certainty.

Useful convergence:

- Ayurveda and TCM both point toward heat/agitation
- Ayurveda and TCM both point toward damp/heavy/sluggish digestion
- Homeopathy remedy directions match the same modalities seen in Ayurveda/TCM
- all traditions suggest the same need for practitioner caution

Bad convergence:

- matching labels without matching reasoning
- forcing one system into another
- saying different traditions prove each other

## 8. Practitioner Review Priority

The final output should rank what the practitioner should review first.

Priority levels:

- `review_first`: strongest fit, best citations, acceptable safety context
- `review_second`: plausible but less specific or missing a key detail
- `exploratory`: weak fit or needs more intake detail
- `hold_until_clarified`: safety or missing data blocks useful ranking

## Treatment Direction Object

```json
{
  "tradition": "",
  "direction_type": "herb_category | formula_category | diet | lifestyle | practice | remedy_differential | rubric_cluster",
  "direction": "",
  "priority": "review_first | review_second | exploratory | hold_until_clarified",
  "why_this_direction": [],
  "matched_case_features": [],
  "missing_or_uncertain_features": [],
  "contradictions": [],
  "safety_notes": [],
  "citations": [],
  "confidence_score": 0,
  "practitioner_review_required": true
}
```

## What The Brain Should Optimize For

The brain should not ask, `What treatment is best?`

It should ask:

1. What is the safest thing to do with this information?
2. Which traditional pattern/repertory direction best explains the case?
3. Which treatment categories are directly supported by that direction?
4. Which directions have the strongest citations?
5. Which directions are weakened by contradictions or missing data?
6. What should the practitioner review first?
7. What one question would most improve the ranking?

## My Recommendation

Build discernment as a transparent scoring and review system, not as a black-box AI decision.

The best path:

1. Build strong candidate generation.
2. Add exact matched/unmatched/contradicting features.
3. Add source-backed treatment-category mapping.
4. Add safety and contraindication penalties.
5. Add next-best-question logic.
6. Let the LLM explain the ranked result in calm practitioner language.

This gives the app judgment without pretending certainty.
