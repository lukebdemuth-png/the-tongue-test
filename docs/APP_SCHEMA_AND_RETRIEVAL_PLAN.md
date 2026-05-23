# App Schema And Retrieval Plan

We are designing a practitioner-facing holistic medicine research app, not a diagnostic or prescribing app.

A practitioner enters symptoms, signs, constitution/context, and notes.

The app returns:

- Ayurveda view
- Traditional Chinese Medicine view
- Homeopathy view
- Cross-tradition synthesis

Each view must include citations, confidence levels, suggested traditional categories, safety notes, and practitioner review requirements.

The app should rank traditional-system relevance, not medical truth.

## 1. Minimum Viable App Output Schema

```json
{
  "case_id": "",
  "input_summary": {
    "primary_symptoms": [],
    "secondary_symptoms": [],
    "duration": "",
    "severity": "",
    "constitution_context": "",
    "red_flags_detected": [],
    "missing_information": []
  },
  "ayurveda_analysis": {
    "likely_patterns": [],
    "supporting_citations": [],
    "suggested_categories": {
      "herbs": [],
      "formulas": [],
      "diet": [],
      "lifestyle": [],
      "yoga_breath_practices": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "tcm_analysis": {
    "likely_patterns": [],
    "supporting_citations": [],
    "suggested_categories": {
      "herbs": [],
      "formulas": [],
      "diet": [],
      "lifestyle": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "homeopathy_analysis": {
    "likely_remedy_directions": [],
    "key_repertory_rubrics": [],
    "supporting_citations": [],
    "suggested_categories": {
      "remedy_differentials": [],
      "modalities": [],
      "constitution_notes": []
    },
    "contraindications": [],
    "confidence_score": 0,
    "practitioner_review_required": true
  },
  "cross_tradition_synthesis": {
    "shared_themes": [],
    "areas_of_agreement": [],
    "areas_of_conflict": [],
    "combined_practitioner_notes": [],
    "suggested_treatment_categories": {
      "herbs_by_tradition": [],
      "formulas_by_tradition": [],
      "lifestyle": [],
      "breath_or_meditation": []
    },
    "safety_notes": [],
    "confidence_score": 0
  },
  "citations": [],
  "disclaimer": ""
}
```

## 2. Practitioner Intake / Input Schema

```json
{
  "patient_context": {
    "age_range": "",
    "sex": "",
    "pregnancy_status": "",
    "known_conditions": [],
    "current_medications": [],
    "allergies": [],
    "clinical_setting": ""
  },
  "symptoms": {
    "chief_complaint": "",
    "primary_symptoms": [],
    "secondary_symptoms": [],
    "duration": "",
    "onset": "",
    "severity": "",
    "frequency": "",
    "better_from": [],
    "worse_from": [],
    "time_patterns": [],
    "temperature_patterns": [],
    "digestion": "",
    "sleep": "",
    "energy": "",
    "mood": "",
    "pain_location": "",
    "pain_quality": ""
  },
  "tradition_specific_inputs": {
    "ayurveda": {
      "prakriti": "",
      "vikriti": "",
      "agni": "",
      "ama_signs": [],
      "bowel_pattern": "",
      "tongue_notes": "",
      "pulse_notes": ""
    },
    "tcm": {
      "tongue": "",
      "pulse": "",
      "temperature": "",
      "sweating": "",
      "thirst": "",
      "appetite": "",
      "bowel_urine": "",
      "emotional_pattern": ""
    },
    "homeopathy": {
      "modalities": [],
      "mental_emotional_state": "",
      "generals": [],
      "peculiar_symptoms": [],
      "food_cravings_aversions": [],
      "thermal_state": ""
    }
  },
  "practitioner_notes": "",
  "requested_output_depth": "brief | standard | detailed"
}
```

## 3. First Public / Open-Access Source Priorities

Verify copyright and access status before committing extracted text. Prefer sources with downloadable PDF, OCR text, structured text, stable URLs, and clear rights metadata. Avoid relying on Archive viewer pages alone.

### Ayurveda

1. Charaka Samhita: Sharma/Dash or P. V. Sharma English editions where usable text is available.
2. Ashtanga Hridayam: K. R. Srikantha Murthy English translation.
3. Sushruta Samhita: English translation.
4. Dravyaguna Vijnana / Ayurvedic materia medica sources.
5. Indian Materia Medica: K. M. Nadkarni.

Useful known sources include Archive.org entries for Charaka Samhita and Ashtanga Hridayam, including versions with PDF/text assets. Verify copyright and access status before committing extracted text.

### Traditional Chinese Medicine

1. Huang Di Nei Jing Su Wen.
2. Shang Han Lun.
3. Jin Gui Yao Lue.
4. Open-access materia medica or formula references.
5. Peer-reviewed case studies later.

Prioritize sources with downloadable PDF, OCR text, or structured text. Avoid relying on Archive viewer pages alone.

### Homeopathy

1. Organon of the Medical Art: Samuel Hahnemann.
2. The Science of Homeopathy: George Vithoulkas.
3. The Soul of Remedies: Rajan Sankaran.
4. Boericke's New Manual of Homeopathic Materia Medica with Repertory: William Boericke.
5. Desktop Guide to Keynotes and Confirmatory Symptoms: Roger Morrison, M.D.
6. Desktop Companion to Physical Pathology: Roger Morrison, M.D.
7. Kent's Final General Repertory: James Tyler Kent.
8. Homeoint public online materia medica/repertory pages where usable.

Boericke is available in structured web form through Homeoint, which may be easier to parse than a scanned PDF. Verify terms, robots.txt, and access status before scraping.

## 4. Safety / Disclaimer Language

Use this language in the app:

> This app is a practitioner-facing research and comparison tool. It does not diagnose disease, prescribe treatment, or replace clinical judgment. Outputs are educational, tradition-specific interpretations based on cited source material. Herbs, formulas, remedies, diet, lifestyle, yoga, breath, or meditation suggestions must be reviewed by a qualified practitioner before use. Urgent, severe, worsening, or medically concerning symptoms require appropriate medical evaluation.

Red-flag handling must include:

- Chest pain
- Difficulty breathing
- Stroke-like symptoms
- Suicidal ideation
- Severe allergic reaction
- Pregnancy complications
- High fever
- Severe dehydration
- Acute abdominal pain
- Uncontrolled bleeding
- Sudden neurological symptoms

If red flags appear, the app should prioritize referral language over traditional suggestions.

## 5. Ranking / Confidence Logic

Use a score from 0 to 100.

Confidence should combine:

### A. Symptom Match

- Exact symptom match
- Synonym match
- Modality match
- Constitution/context match
- Timing/location/quality match

### B. Source Authority

- Classical root text
- Materia medica/repertory
- Clinical commentary
- Peer-reviewed evidence
- General article

### C. Citation Quality

- Direct quote available
- Page/chapter/sutra/aphorism available
- Source metadata complete
- Translation reliable

### D. Cross-Tradition Agreement

- Strong agreement across traditions increases synthesis confidence.
- Conflict lowers synthesis confidence but should be shown clearly.

### E. Safety Risk

- Possible herb-drug interaction lowers recommendation confidence.
- Pregnancy, medications, or serious condition lowers confidence.
- Insufficient intake data lowers confidence.

### Confidence Labels

- `85-100`: strong source-supported match
- `70-84`: likely match, practitioner review required
- `50-69`: possible match, needs more intake detail
- `30-49`: weak match, exploratory only
- `0-29`: insufficient evidence

### Ranking Formula Draft

```text
confidence_score =
(symptom_match * 0.35)
+ (source_authority * 0.20)
+ (citation_quality * 0.20)
+ (tradition_specific_fit * 0.15)
+ (safety_completeness * 0.10)
```

### Penalty Modifiers

- Missing medications: `-10`
- Pregnancy unknown when relevant: `-10`
- No citation: `-25`
- Conflicting source evidence: `-10` to `-25`
- Red flag present: suppress treatment suggestions

Important: confidence scores rank traditional-system relevance, not medical truth.
