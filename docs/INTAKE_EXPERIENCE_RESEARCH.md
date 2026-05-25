# Intake Experience Research Notes

This note records the first redesign pass for the everyday-user intake experience in the Pattern App.

The current source-derived intake blueprint is now tracked in
`docs/SOURCE_DERIVED_INTAKE_BLUEPRINT.md`. That document takes priority over
generic external intake-form examples when shaping the app intake.

## Product Decision

The intake should clearly move through three distinct lenses:

1. Chinese Medicine
2. Ayurveda
3. Homeopathy

The interface should remain unified and accessible, but each tradition should feel different in tone, question style, and visual atmosphere. The user should learn through the questions rather than reading academic explanations.

## Source-Grounded Intake Logic

The processed books currently available in the repository do not contain modern
fillable intake forms. They contain source assessment logic. The app should
translate that logic into plain-language intake questions instead of copying a
generic questionnaire.

### Chinese Medicine

Design basis:

- The processed `Huang Di Nei Jing Su Wen` chunks repeatedly organize illness through cold/heat, sweating, pain, urine, sleep, abdomen/chest/head signs, qi movement, timing, and exterior/interior body signs.
- Classical and contemporary TCM inquiry commonly asks about hot/cold, sweating, pain, stool/urine, appetite/thirst, chest/abdomen, sleep, menstrual patterns, past illness, and the cause/context of the current illness.
- The app translates this into plain-language questions about temperature tendency, body rhythm, stress location, digestion under stress, sleep rhythm, bowel/urine rhythm, and surface/circulation signs.

Reference examples:

- Yin Yang House, `"The Ten Questions" Clinical Questioning in TCM Acupuncture Theory`: https://yinyanghouse.com/theory/theory/chinese/questioning_diagnosis/
- Sacred Lotus, `TCM Diagnosis by Asking - One of the 4 Pillars`: https://www.sacredlotus.com/go/diagnosis-chinese-medicine/get/4-pillars-asking-tcm-diagnosis

### Ayurveda

Design basis:

- The processed `Sushruta Samhita` and `Ashtanga Hridayam` chunks support questions around dosha tendency, agni, ama-like heaviness, food taste, stool/urine, sleep, routine, strength, and timing across age/day/night/digestion.
- Ayurveda assessment uses prakriti/vikriti, digestion/agni, routine, physiological habits, appetite, sleep, temperature tolerance, physical/psychological traits, and behavioral tendencies.
- The app translates this into questions about schedule irregularity, body/mind qualities, appetite, food tendencies, daily rhythm, and overstimulation/grounding.

Reference examples:

- `Development, Validation, and Verification of a Self-Assessment Tool to Estimate Agnibala (Digestive Strength)`: https://pmc.ncbi.nlm.nih.gov/articles/PMC5871217/
- `Prakriti (constitutional typology) in Ayurveda: a critical review of Prakriti assessment tools and their scientific validity`: https://pmc.ncbi.nlm.nih.gov/articles/PMC12631390/

### Homeopathy

Design basis:

- The processed `Organon of Medicine` aphorisms 84-104 provide direct case-taking logic: begin with the user's own words, record each circumstance separately, return to each symptom for precise particulars, avoid leading questions, and ask about stool, urine, sleep, disposition, memory, thirst, observed changes, causes, and peculiarities.
- Homeopathic case-taking emphasizes the totality of symptoms, modalities, generals, mental-emotional state, and striking/individualizing details.
- The app translates this into questions about emotional overwhelm, environments that drain the person, what improves/worsens symptoms, repeating emotional patterns, sensations, and individual preferences.

Reference examples:

- `Organon of Medicine`, 6th edition PDF reference: https://thehomeopathiccollege.org/wp-content/uploads/2019/12/Organon-of-Medicine-6th-edition.pdf
- Homeopathy Network, `Totality of Symptoms`: https://www.homeopathy.network/learn/principles/totality-of-symptoms/

## UI Translation Rules

- Do not present the intake as a clinical form.
- Use distinct atmospheres for the traditions while preserving one continuous journey.
- Teach by question wording and microcopy.
- Use large reflection cards, chips, and spacious text inputs.
- Show that a pattern profile is being built while the user answers.
- Keep safety questions present but secondary.

## Current Implementation Notes

- The redesigned intake is implemented in `components/pattern-app/pattern-brain-prototype.tsx`.
- The same underlying brain schema is preserved; the new UI maps everyday-language answers into existing fields such as temperature, digestion, sleep, energy, modalities, cravings, and tradition-specific notes.
- This is a first UI/experience pass. The next pass should connect selected chips to more structured scoring rather than only joining them into text fields.
