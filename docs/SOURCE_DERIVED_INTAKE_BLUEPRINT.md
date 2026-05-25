# Source-Derived Intake Blueprint

This note records how the Patterns intake should be shaped from the actual processed canon currently on file, rather than from generic wellness quizzes.

## Important Finding

The processed books currently available in the repository do not contain modern fillable intake forms. They contain the older source logic that intake forms are built from:

- what to observe
- what to ask
- how to ask without leading the person
- which body functions matter
- which qualities, timings, modalities, and peculiarities refine the pattern

The app should therefore use a source-derived intake, not a literal copied questionnaire.

## Homeopathy Intake Basis

Primary processed source:

- `Organon of Medicine`, aphorisms 84-104

Useful case-taking structure found in the processed chunks:

- Begin with the person's own history and wording.
- Record each circumstance separately.
- Return to each symptom for particulars after the free narrative.
- Ask non-leading questions rather than yes/no suggestions.
- Clarify timing, exact sensation, exact location, continuation vs episodes, and relation to prior medicines.
- Ask broadly about body functions and mental state when not volunteered.
- Include stool, urine, day/night sleep, disposition, memory, and thirst.
- Note what is observed directly.
- In chronic cases, attend to small peculiarities and long-standing circumstances.

App translation:

- Main concern in the user's own words.
- What was happening around onset.
- Better from / worse from.
- Exact sensation and place.
- Repeating emotional pattern.
- Environment that drains the person.
- Individual details that feel odd, intense, characteristic, or hard to explain.

## Ayurveda Intake Basis

Primary processed sources:

- `Sushruta Samhita`, including clinical observation and agni material.
- `Ashtanga Hridayam`, including dosha classification, agni types, taste, sleep, routine, and diet timing material.

Useful assessment structure found in the processed chunks:

- Dosha tendency and mixed dosha states.
- Digestive fire: regular, variable, sharp, dull.
- Ama-like heaviness, sluggishness, coating, incomplete digestion, bloating, low appetite, and low energy.
- Relationship between doshas and age, day, night, and stages of digestion.
- Taste, food quality, appetite, stool, urine, thirst, sleep, and strength.
- Routine, timing, and what steadies or disturbs the person.

App translation:

- Schedule irregularity response.
- Body/mind qualities: light, dry, cold, sharp, hot, heavy, slow, steady, oily.
- Appetite and digestive-fire pattern.
- Food tastes, cravings, and aversions.
- Heavy/sluggish/coated/sticky signs.
- Daily rhythm and what settles the person.

## Chinese Medicine Intake Basis

Primary processed source:

- `Huang Di Nei Jing Su Wen`

Useful assessment structure found in the processed chunks:

- Cold/heat and alternating cold/heat.
- Sweat, dryness, thirst, urine, stool, and fluid signs.
- Sleep, restlessness, pain, abdomen, chest, head, throat, and qi movement.
- Exterior/surface signs such as swelling, flushing, sweating, and cold limbs.
- Seasonal and timing relationships.
- Deficiency/excess style language through depletion, repletion, movement, obstruction, and counterflow.

App translation:

- Hot/cold/mixed/changing tendency.
- Sweating, dryness, thirst, urination, swelling, flushing, cold hands/feet.
- Where stress affects the body first.
- Digestion under stress.
- Sleep rhythm.
- Bowel/urine rhythm.
- Chest, abdomen, head, or pain pattern.

## UI Rule

The source basis should be visible enough to build trust, but not so prominent that the intake becomes academic. Use small source-basis notes and plain-language questions.

## Functional Medicine Form Structure Used As Inspiration

Local reference reviewed:

- `/Users/creative/Desktop/FM-Intake-Forms-2019.pdf`

The app should not copy the administrative, medical-history, surgery, hospitalization, diagnosis, insurance, or clinical-record portions of that form.

Useful structural patterns adapted for everyday-user intake:

- General symptoms currently experienced.
- Time of day symptoms feel worst or most aggravated.
- Stress level from 1-10.
- Major sources of stress.
- Strong flavor likes and dislikes: sour, bitter, sweet, rich/fatty, spicy/pungent, salty.
- Warmth/cold preference for food, drinks, weather, and body state.
- Disturbed sleep timing.
- Time of day with most or least energy.
- Exercise frequency, duration, and type.
- Nutrition style, food restrictions, food frequency, and eating habits.
- Breakfast skipping, grazing, eating on the run, eating when not hungry.
- Caffeine and water intake.
- Goal prompts framed as "Would you like to..."
- 0-3 stress/metabolic-style ratings for repeated patterns.

App translation:

- Current Pattern Snapshot.
- Goals / Would You Like To.
- Diet + Eating Pattern.
- Exercise + Movement.
- Stress Assessment.
- Metabolic Pattern Ratings.
- Timing / Rhythm.

These layers are designed to produce better personalized wellness education and pattern exploration without making the app feel like medical paperwork.

## Implementation Notes

- Current intake UI lives in `components/pattern-app/pattern-brain-prototype.tsx`.
- Section-level source-basis notes are now shown for Chinese Medicine, Ayurveda, and Homeopathy.
- The `intakeFromForm` mapper now sends more source-derived structure into the hidden tradition packets:
  - Ayurveda `ama_signs` and `bowel_pattern`
  - TCM `sweating` and `thirst`
  - Homeopathy `peculiar_symptoms`
- The intake now includes lifestyle and goal layers inspired by the local Functional Medicine form's useful non-administrative structure.
