# Question Sequencing

The system should ask the next best question, not a long intake form, unless the user explicitly requests a full intake.

## Question Priority

1. Safety screening
2. Missing data that could change urgency
3. Missing data that separates top interpretations
4. Missing data that affects confidence
5. Follow-up or outcome tracking

## Safety Questions

Ask first when relevant:

- Are you having chest pain, severe shortness of breath, fainting, or sudden neurological symptoms?
- Is there severe or rapidly worsening pain?
- Is there fever, bleeding, dehydration, or pregnancy?
- Are there thoughts of self-harm or harm to others?

## Pattern-Separating Questions

Ask questions that distinguish the top candidates.

Useful categories:

- onset: sudden, gradual, recurrent
- duration: hours, days, weeks, months
- severity and functional impact
- temperature preference: better/worse heat or cold
- thirst: increased, decreased, absent
- digestion: appetite, stool, nausea, bloating
- sleep: insomnia, waking time, dreams, rest quality
- energy: better morning/evening, post-exertional crash
- moisture/dryness: dry skin, mucus, edema, sweating
- pain modality: better/worse motion, rest, pressure, food, time of day
- mental/emotional pattern: irritability, fear, grief, restlessness, dullness
- prior diagnosis, current medications, and clinician guidance

## Next Best Question Rule

Choose the question with the highest expected information gain.

Ask one question when:

- one missing answer would strongly change the ranking
- the user is overwhelmed
- the answer affects safety

Ask two or three questions when:

- the user provided enough context for a focused mini-intake
- several top interpretations are tied
- safety is already reasonably clear

## Question Templates

Safety:

`Before interpreting this traditionally, are any red flags present: chest pain, severe shortness of breath, fainting, sudden weakness/numbness, severe abdominal pain, high fever, or uncontrolled bleeding?`

Pattern separation:

`Is this worse with heat, worse with cold, or not clearly affected by temperature?`

Symptom strength:

`Which symptom is most disruptive day to day, and how severe is it from 0 to 10?`

Timing:

`When did this begin, and is it improving, worsening, or cycling?`

Outcome tracking:

`After the intervention, what changed first: intensity, frequency, duration, sleep, digestion, mood, or function?`

## Output Field

Always produce:

```json
{
  "next_best_question": ""
}
```

The next best question should be specific, answerable, and tied to ranking or safety.
