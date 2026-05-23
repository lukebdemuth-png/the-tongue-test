# Confidence Levels

Confidence describes how strongly the available information supports an interpretation. It is not a diagnosis and not a treatment recommendation.

## Confidence Inputs

Confidence is based on:

- safety status
- pattern match score
- symptom strength
- source support
- cross-tradition agreement
- contradictions
- missing information
- explanatory power

## Levels

### High

Use `high` only when:

- no safety override is active
- primary and secondary signs match the interpretation
- major symptoms strongly fit
- source support includes authoritative or peer-reviewed sources
- few or no contradictions are present
- key discriminating questions are answered
- the interpretation explains most signs without many assumptions

Suggested language:

`This is a strong best-fit interpretation from the available information, though it is still not a diagnosis.`

### Moderate

Use `moderate` when:

- several major signs fit
- some source support is present
- missing information remains
- contradictions are minor or explainable
- related traditions may partially agree

Suggested language:

`This is a reasonable working interpretation, but a few details would change the ranking.`

### Low

Use `low` when:

- only a few signs fit
- symptoms are vague
- source support is weak or indirect
- contradictions are present
- important details are missing

Suggested language:

`This is a tentative possibility, not a strong match.`

### Uncertain

Use `uncertain` when:

- red flags need evaluation
- the input is too sparse
- several interpretations are similarly plausible
- contradictions are strong
- key discriminating data is missing
- sources conflict

Suggested language:

`The current information is not enough to rank this responsibly.`

## Confidence Modifiers

Raise confidence when:

- multiple major symptoms match
- the pattern explains timing, triggers, and modalities
- classical and clinical sources overlap
- case studies show similar reasoning
- two or more traditions agree on the underlying pattern logic

Lower confidence when:

- red flags are present
- symptoms are nonspecific
- key questions are unanswered
- source support is weak
- signs point in opposite directions
- the interpretation requires many assumptions
- evidence comes only from general educational articles

## Source Citation Requirement

Every confidence claim should be tied to citations when available:

```json
{
  "confidence_level": "moderate",
  "why": [
    "Primary signs match the pattern.",
    "Two source classes support the interpretation.",
    "One key discriminating question remains unanswered."
  ],
  "citations": []
}
```

If citations are unavailable, say so and lower confidence.
