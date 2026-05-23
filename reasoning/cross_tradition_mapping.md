# Cross-Tradition Mapping

Cross-tradition mapping helps compare pattern logic across Ayurveda, TCM, Homeopathy, Yoga, Qigong, and Integrative medicine. It should never flatten traditions into one system or claim they are equivalent.

## Core Rule

Map by reasoning logic, not by label similarity.

Useful mappings compare:

- heat/cold
- excess/deficiency
- stagnation/flow
- dryness/dampness
- depletion/agitation
- constitution/predisposition
- symptom modalities
- intervention rationale
- follow-up outcomes

## Agreement Strength

### Strong Agreement

Use when three or more traditions point to similar pattern logic and the user signs support that logic.

Example:

- Ayurveda: heat or pitta-like signs
- TCM: heat pattern signs
- Homeopathy: remedy picture with heat, thirst, irritability, burning sensations

### Moderate Agreement

Use when two traditions align clearly, or three traditions partially align with some missing data.

### Weak Agreement

Use when labels sound similar but the underlying reasoning differs.

### No Agreement

Use when traditions point in different directions or available data is too thin.

## Mapping Dimensions

### Ayurveda

Common reasoning dimensions:

- dosha pattern
- agni/digestion
- ama/toxic residue language
- dhatu/tissue involvement
- prakriti/constitution
- vikriti/current imbalance
- srotas/channel involvement

### TCM

Common reasoning dimensions:

- exterior/interior
- hot/cold
- excess/deficiency
- yin/yang
- qi/blood/fluid
- dampness/phlegm
- stagnation
- organ-system pattern
- syndrome differentiation

### Homeopathy

Common reasoning dimensions:

- symptom totality
- characteristic symptoms
- modalities
- constitutional pattern
- remedy picture
- differential remedy logic
- remedy relationships
- follow-up response

### Yoga

Common reasoning dimensions:

- breath pattern
- nervous-system regulation
- guna/mental quality when sourced
- posture/movement tolerance
- stress recovery
- attention and interoception
- practice contraindications

### Qigong

Common reasoning dimensions:

- qi flow/stagnation
- breath and movement coordination
- regulation of arousal
- balance, grounding, and body awareness
- practice dosage and follow-up response

### Integrative Medicine

Common reasoning dimensions:

- biomedical diagnosis and safety context
- lifestyle contributors
- psychosocial stressors
- patient goals
- evidence level
- risk/benefit
- care coordination

## Contradictions Across Traditions

Flag contradictions when:

- one tradition points to heat while another points to cold
- one points to excess while another points to depletion
- one suggests stimulation while safety context suggests rest or medical review
- a remedy picture contradicts key modalities
- a practice recommendation conflicts with biomedical contraindications

Contradiction output:

```json
{
  "contradictions": [
    {
      "sign": "",
      "argues_against": "",
      "why": "",
      "tradition": "",
      "citation": ""
    }
  ]
}
```

## Output Guidance

Use:

- `These traditions appear to overlap in the underlying pattern logic.`
- `The labels differ, but the reasoning is similar around heat, agitation, and thirst.`
- `The traditions diverge here, so confidence should be lower.`

Avoid:

- `Ayurveda and TCM say the same thing.`
- `This proves the diagnosis.`
- `All traditions agree` unless the source-backed pattern logic really supports that.
