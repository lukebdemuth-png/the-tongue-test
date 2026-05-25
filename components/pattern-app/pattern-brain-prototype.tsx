"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { ShortResultDisclaimer } from "@/components/compliance/disclosures";

const symptomLibrary = [
  "low energy",
  "headache",
  "poor sleep",
  "waking at night",
  "bloating",
  "constipation",
  "loose stool",
  "anxiety",
  "irritability",
  "brain fog",
  "cold hands",
  "hot flashes",
  "cravings",
  "dry skin",
  "joint pain",
  "neck tension",
  "nausea",
  "heavy feeling",
  "dizziness",
  "low appetite",
  "high stress",
  "sadness",
  "restlessness",
  "night sweats",
  "cough",
  "sore throat",
  "congestion",
  "runny nose",
  "shortness of breath",
  "chest tightness",
  "palpitations",
  "abdominal pain",
  "reflux",
  "diarrhea",
  "gas",
  "excessive thirst",
  "dry mouth",
  "frequent urination",
  "menstrual cramps",
  "irregular period",
  "PMS",
  "back pain",
  "shoulder pain",
  "muscle aches",
  "swelling",
  "rash",
  "itching",
  "acne",
  "fever",
  "weight gain",
];

const goalOptions = [
  "have more energy",
  "sleep better",
  "think more clearly",
  "feel less moody",
  "feel more motivated",
  "improve digestion",
  "feel more grounded",
  "reduce cravings",
  "support healthy weight",
  "feel stronger",
  "improve endurance",
  "feel less scattered",
  "feel more emotionally steady",
  "understand my food patterns",
  "understand my stress pattern",
  "build a better daily rhythm",
];

const metabolicRatingItems = [
  { key: "fatigue_after_meals", label: "Fatigue after meals" },
  { key: "cravings", label: "Cravings" },
  { key: "blood_sugar_dips", label: "Blood sugar dips" },
  { key: "afternoon_crash", label: "Afternoon crash" },
  { key: "weight_change_difficulty", label: "Difficulty losing or gaining weight" },
  { key: "cold_hands_feet", label: "Cold hands or feet" },
  { key: "feeling_overheated", label: "Feeling overheated" },
  { key: "bloating", label: "Bloating" },
  { key: "constipation_loose_stool", label: "Constipation or loose stool tendency" },
  { key: "brain_fog", label: "Brain fog" },
  { key: "waking_tired", label: "Waking tired" },
  { key: "trouble_falling_asleep", label: "Trouble falling asleep" },
  { key: "trouble_staying_asleep", label: "Trouble staying asleep" },
  { key: "puffiness_fluid", label: "Puffiness or fluid retention" },
  { key: "dry_skin", label: "Dry skin" },
  { key: "night_sweats", label: "Night sweats" },
  { key: "appetite_changes", label: "Appetite changes" },
];

type MetabolicRatings = Record<string, number>;

type Candidate = {
  candidate_name: string;
  confidence_score: number;
  confidence_label: string;
  priority: string;
  matched_features: string[];
  supporting_citations: string[];
};

type BrainTrace = {
  case_id: string;
  safety_gate: {
    status: string;
    red_flags_detected: string[];
    missing_safety_context: string[];
    context_cautions: Array<{ type: string; severity: string; note: string }>;
    notes: string[];
  };
  derived_evaluation_packets: {
    ayurveda: TraditionEvaluationPacket;
    tcm: TraditionEvaluationPacket;
    homeopathy: TraditionEvaluationPacket;
  };
  intake_state: {
    stage: string;
    minimum_complete: boolean;
    minimum_missing: string[];
    deepening_missing: string[];
    next_question: string;
    can_generate_first_pass: boolean;
    can_generate_treatment_categories: boolean;
  };
  normalized_features: Array<{ feature: string; dimension: string }>;
  candidates: {
    ayurveda: Candidate[];
    tcm: Candidate[];
    homeopathy: Candidate[];
  };
  practitioner_summary: {
    case_snapshot: string;
    key_cautions: string[];
    primary_traditional_directions: Array<{
      tradition: string;
      direction: string;
      confidence_score: number;
      priority: string;
    }>;
    confidence_summary: string;
    next_best_question: string;
  };
  practical_output: {
    scope: string;
    likely_pattern_summary: {
      case_snapshot: string;
      plain_language_summary?: string;
      tradition_directions: Array<{
        tradition: string;
        direction: string;
        confidence_score: number;
        priority: string;
        citations?: string[];
      }>;
      shared_pattern_signals: string[];
      areas_of_conflict: string[];
    };
    confidence: {
      score: number;
      label: string;
      basis: string;
    };
    questions_still_needed: string[];
    herbs_formulas_remedies_to_consider: PracticalRecommendation[];
    lifestyle_diet_practice_actions: PracticalRecommendation[];
    stepwise_outcome?: {
      title: string;
      confidence: { score: number; label: string; basis: string };
      plain_language: string;
      why_this_matched: string[];
      step_1_pattern: { label: string; items: string[] };
      step_2_traditions: {
        label: string;
        items: Array<{
          tradition: string;
          direction: string;
          confidence_score: number;
          priority: string;
          citations?: string[];
        }>;
      };
      step_3_do_first: { label: string; items: PracticalRecommendation[] };
      step_4_track: { label: string; items: string[] };
      step_5_explore_next: { label: string; items: PracticalRecommendation[] };
      counts: {
        generated_actions: number;
        generated_explore_next: number;
        matched_actions: number;
        matched_explore_next: number;
      };
      missing_source_notes: string[];
      category_outcomes: {
        diet: string[];
        herbs_formulas_remedies: string[];
        lifestyle_practices: string[];
        sleep_recovery: string[];
        movement_body: string[];
        breathwork_meditation: string[];
        avoid_reduce: string[];
        practitioner_follow_up: string[];
        tracking: string[];
        questions_refinement: string[];
        additional_insights: string[];
        source_basis: string[];
      };
    };
    missing_outcome_sources?: string[];
    warnings_and_professional_boundaries: string[];
    cited_source_references: Array<{
      citation_id: string;
      tradition: string;
      source: string;
      locator: string;
      pages: string;
      url?: string;
      rights_note?: string;
    }>;
  };
  treatment_plan_draft: {
    scope: string;
    ayurveda: TreatmentDirection[];
    tcm: TreatmentDirection[];
    homeopathy: TreatmentDirection[];
  };
  client_teaching_sequence: Array<{ step: string; teaching: string }>;
  synthesis_trace: {
    shared_themes: string[];
    areas_of_agreement: string[];
    areas_of_conflict: string[];
    tradition_weighting?: Array<{
      tradition: string;
      direction: string;
      confidence_score: number;
      percentage: number;
    }>;
    confidence_score: number;
    confidence_label?: string;
    note: string;
  };
  next_best_question: string;
  app_output: {
    citations: Array<{
      citation_id: string;
      tradition: string;
      source: string;
      book?: string;
      author_or_translator?: string;
      edition?: string;
      section?: string;
      chapter?: string;
      locator: string;
      pages: string;
      url?: string;
      rights_note?: string;
    }>;
    disclaimer: string;
  };
  prototype_warning: string;
};

type PracticalRecommendation = {
  tradition: string;
  category: string;
  direction: string;
  practitioner_action: string;
  confidence_score: number;
  review_priority: string;
  citations: string[];
  source_basis?: string;
  safety_notes: string[];
};

type CitationReference = BrainTrace["practical_output"]["cited_source_references"][number];

type TraditionEvaluationPacket = {
  evaluation_focus: string;
  possible_dosha_flags?: string[];
  agni_flags?: string[];
  ama_signs?: string[];
  possible_pattern_flags?: string[];
  possible_rubric_flags?: string[];
  rubric_seed_terms?: string[];
  modalities?: string[];
  generals?: string[];
  missing_questions: string[];
};

type TreatmentDirection = {
  tradition: string;
  category: string;
  direction: string;
  practitioner_action: string;
  client_facing_language: string;
  why_this_matches?: string[];
  matched_case_features?: string[];
  kent_supporting_rubrics?: Array<{ rubric: string; citation: string; matched_abbreviations: string[] }>;
  confidence_score: number;
  safety_notes: string[];
  contraindications: string[];
  citations: string[];
  review_priority: string;
  source_url?: string;
  text_preview?: string;
};

type IntakeForm = {
  chiefComplaint: string;
  primarySymptoms: string;
  secondarySymptoms: string;
  duration: string;
  severity: string;
  betterFrom: string;
  worseFrom: string;
  digestion: string;
  sleep: string;
  energy: string;
  mood: string;
  temperature: string;
  cravings: string;
  elimination: string;
  pain: string;
  stress: string;
  reproductive: string;
  skin: string;
  circulation: string;
  mindFocus: string;
  goals: string;
  cautions: string;
  preferences: string;
  medications: string;
  pregnancyStatus: string;
  knownConditions: string;
  allergies: string;
  practitionerNotes: string;
  ayurvedaNotes: string;
  tcmNotes: string;
  homeopathyNotes: string;
  currentSnapshot: string;
  goalIntentions: string;
  dietHabits: string;
  dietaryChoices: string;
  foodPreferences: string;
  mealRhythm: string;
  hydrationCaffeine: string;
  appetiteDynamics: string;
  postMealComfort: string;
  bowelRegularity: string;
  stoolConsistency: string;
  thirstLevel: string;
  movementHabits: string;
  movementResponse: string;
  stressLevel: string;
  stressSources: string;
  stressPattern: string;
  stressRelief: string;
  mentalFocusStyle: string;
  metabolicRatings: MetabolicRatings;
  timingRhythm: string;
  sleepSchedule: string;
  dreamPattern: string;
  sensoryExposures: string;
  substanceUse: string;
};

const sampleForm: IntakeForm = {
  chiefComplaint: "Poor sleep with digestive discomfort",
  primarySymptoms: "sleep disturbance, digestive discomfort",
  secondarySymptoms: "low energy",
  duration: "several weeks",
  severity: "moderate",
  betterFrom: "",
  worseFrom: "worse at night",
  digestion: "variable appetite and digestion with bloating",
  sleep: "difficulty staying asleep",
  energy: "low morning energy",
  mood: "",
  temperature: "",
  cravings: "",
  elimination: "",
  pain: "",
  stress: "",
  reproductive: "",
  skin: "",
  circulation: "",
  mindFocus: "",
  goals: "Improve sleep quality and digestive comfort with practitioner review.",
  cautions: "",
  preferences: "Prefer gentle diet and routine steps before stronger interventions.",
  medications: "",
  pregnancyStatus: "",
  knownConditions: "",
  allergies: "",
  practitionerNotes: "Compare traditional source relevance for sleep, digestion, appetite, bloating, and low energy.",
  ayurvedaNotes: "",
  tcmNotes: "",
  homeopathyNotes: "worse at night; low morning energy",
  currentSnapshot: "low morning energy, bloating, poor sleep, brain fog after meals",
  goalIntentions: "have more energy, sleep better, improve digestion, think more clearly, build a better daily rhythm",
  dietHabits: "skip breakfast some days, two meals/day, eat on the run, sometimes graze",
  dietaryChoices: "eggs, rice, cooked vegetables, chicken, soups; avoids dairy when bloated",
  foodPreferences: "craves sweet and salty; prefers warm foods; cold drinks worsen digestion",
  mealRhythm: "irregular meal timing; bloating worse after late meals",
  hydrationCaffeine: "coffee in the morning, water intake variable",
  appetiteDynamics: "variable appetite",
  postMealComfort: "bloating and sluggishness after eating",
  bowelRegularity: "one bowel movement most days",
  stoolConsistency: "normal to sticky, sometimes loose",
  thirstLevel: "dry mouth at night, variable thirst",
  movementHabits: "walking and gentle yoga 1-2 days per week",
  movementResponse: "gentle movement helps; intense workouts can exhaust me the next day",
  stressLevel: "7",
  stressSources: "work pressure, schedule changes, too much screen time",
  stressPattern: "stress shows up first in digestion, sleep, racing thoughts, and shoulder tension",
  stressRelief: "better from rest, warmth, routine, solitude, gentle movement",
  mentalFocusStyle: "restless and racing when stressed; brain fog after meals",
  metabolicRatings: {
    fatigue_after_meals: 2,
    cravings: 2,
    afternoon_crash: 2,
    bloating: 3,
    brain_fog: 2,
    waking_tired: 2,
    trouble_staying_asleep: 3,
  },
  timingRhythm: "best late morning; worst after lunch and 2-4 a.m. waking",
  sleepSchedule: "bedtime around 10:30 p.m.; waking around 6:30 a.m.",
  dreamPattern: "active anxious dreams when stressed",
  sensoryExposures: "sensitive to loud noise, bright screens, cold wind",
  substanceUse: "morning coffee; no tobacco; alcohol occasional",
};

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function metabolicRatingsText(ratings: MetabolicRatings) {
  return metabolicRatingItems
    .filter((item) => ratings[item.key] > 0)
    .map((item) => `${item.label}: ${ratings[item.key]}/3`)
    .join(", ");
}

function intakeFromForm(form: IntakeForm) {
  const agniMalaContext = [
    form.appetiteDynamics,
    form.postMealComfort,
    form.bowelRegularity,
    form.stoolConsistency,
    form.thirstLevel,
  ].filter(Boolean).join("\n");
  const dietContext = [
    form.dietHabits,
    form.dietaryChoices,
    form.foodPreferences,
    form.mealRhythm,
    form.hydrationCaffeine,
    form.substanceUse,
    agniMalaContext,
  ].filter(Boolean).join("\n");
  const movementContext = [form.movementHabits, form.movementResponse].filter(Boolean).join("\n");
  const stressContext = [
    form.stressLevel ? `Stress level ${form.stressLevel}/10` : "",
    form.stressSources,
    form.stressPattern,
    form.stressRelief,
    form.mentalFocusStyle,
    form.sensoryExposures,
  ].filter(Boolean).join("\n");
  const sleepContext = [form.sleepSchedule, form.sleep, form.dreamPattern].filter(Boolean).join("\n");
  const rhythmContext = [form.timingRhythm, form.energy, sleepContext].filter(Boolean).join("\n");
  const metabolicContext = metabolicRatingsText(form.metabolicRatings);
  const thirstPattern = [form.temperature, form.cravings, form.foodPreferences, form.hydrationCaffeine, form.thirstLevel]
    .filter((value) => /thirst|dry mouth|cold drinks|warm drinks/i.test(value))
    .join("\n");
  const sweatingPattern = [form.temperature, form.circulation]
    .filter((value) => /sweat|night sweats|flushing|flush/i.test(value))
    .join("\n");
  const amaSigns = splitList([form.ayurvedaNotes, form.digestion, form.energy, form.elimination, form.currentSnapshot, agniMalaContext, metabolicContext].join(", "))
    .filter((item) => /heavy|sluggish|coating|sticky|mucus|foul|bloat|low energy|after meals/i.test(item));

  return {
    case_id: "browser-intake",
    patient_context: {
      age_range: "adult",
      sex: "",
      pregnancy_status: form.pregnancyStatus,
      known_conditions: splitList(form.knownConditions),
      current_medications: splitList(form.medications),
      allergies: splitList(form.allergies),
      clinical_setting: "practitioner research review",
    },
    symptoms: {
      chief_complaint: form.chiefComplaint,
      primary_symptoms: splitList(form.primarySymptoms),
      secondary_symptoms: splitList(form.secondarySymptoms),
      duration: form.duration,
      onset: "",
      severity: form.severity,
      frequency: "",
      better_from: splitList(form.betterFrom),
      worse_from: splitList(form.worseFrom),
      time_patterns: splitList([form.worseFrom, form.timingRhythm].filter(Boolean).join(", ")).filter((item) => /morning|night|day|evening|time|a\.m\.|p\.m\.|afternoon/i.test(item)),
      temperature_patterns: splitList(form.temperature),
      digestion: [form.digestion, form.cravings, form.elimination, dietContext, agniMalaContext, metabolicContext].filter(Boolean).join("\n"),
      sleep: [sleepContext, form.timingRhythm, metabolicContext].filter(Boolean).join("\n"),
      energy: [form.energy, form.currentSnapshot, movementContext, rhythmContext, metabolicContext].filter(Boolean).join("\n"),
      mood: [form.mood, form.stress, form.mindFocus, form.mentalFocusStyle, stressContext, form.currentSnapshot].filter(Boolean).join("\n"),
      pain_location: form.pain,
      pain_quality: form.pain,
    },
    tradition_specific_inputs: {
      ayurveda: {
        prakriti: "",
        vikriti: [form.ayurvedaNotes, form.currentSnapshot, form.timingRhythm].filter(Boolean).join("\n"),
        agni: [form.digestion, form.appetiteDynamics, form.postMealComfort, dietContext, metabolicContext].filter(Boolean).join("\n"),
        ama_signs: amaSigns,
        bowel_pattern: [form.elimination, form.bowelRegularity, form.stoolConsistency, metabolicContext].filter(Boolean).join("\n"),
        tongue_notes: "",
        pulse_notes: "",
      },
      tcm: {
        tongue: "",
        pulse: "",
        temperature: [form.temperature, form.circulation, form.foodPreferences, metabolicContext].filter(Boolean).join("\n"),
        sweating: sweatingPattern,
        thirst: thirstPattern,
        appetite: [form.digestion, form.appetiteDynamics, form.cravings, dietContext, metabolicContext].filter(Boolean).join("\n"),
        bowel_urine: [form.elimination, form.bowelRegularity, form.stoolConsistency, metabolicContext].filter(Boolean).join("\n"),
        emotional_pattern: [form.mood, form.stress, form.tcmNotes, stressContext].filter(Boolean).join("\n"),
      },
      homeopathy: {
        modalities: [...splitList(form.betterFrom), ...splitList(form.worseFrom)],
        mental_emotional_state: [form.mood, form.stress, form.mindFocus, form.mentalFocusStyle, stressContext].filter(Boolean).join("\n"),
        generals: [
          ...splitList(form.homeopathyNotes),
          ...splitList(form.energy),
          ...splitList(form.temperature),
          ...splitList(form.cravings),
          ...splitList(form.goalIntentions),
        ],
        peculiar_symptoms: splitList([form.pain, form.skin, form.reproductive, form.currentSnapshot, form.dreamPattern, form.sensoryExposures, metabolicContext].filter(Boolean).join(", ")),
        food_cravings_aversions: splitList([form.cravings, form.foodPreferences].filter(Boolean).join(", ")),
        thermal_state: [form.temperature, form.circulation, form.foodPreferences].filter(Boolean).join("\n"),
      },
    },
    practitioner_notes: [
      form.practitionerNotes,
      form.goals ? `Goals: ${form.goals}` : "",
      form.goalIntentions ? `Would like to: ${form.goalIntentions}` : "",
      form.currentSnapshot ? `Current pattern snapshot: ${form.currentSnapshot}` : "",
      dietContext ? `Diet and eating pattern: ${dietContext}` : "",
      movementContext ? `Exercise and movement pattern: ${movementContext}` : "",
      stressContext ? `Stress pattern: ${stressContext}` : "",
      agniMalaContext ? `Metabolic and elimination pattern: ${agniMalaContext}` : "",
      sleepContext ? `Sleep and dream pattern: ${sleepContext}` : "",
      rhythmContext ? `Timing and rhythm: ${rhythmContext}` : "",
      metabolicContext ? `0-3 pattern ratings: ${metabolicContext}` : "",
      form.cautions ? `Cautions: ${form.cautions}` : "",
      form.preferences ? `Preferences: ${form.preferences}` : "",
      form.reproductive ? `Menstrual/reproductive: ${form.reproductive}` : "",
      form.skin ? `Skin: ${form.skin}` : "",
    ].filter(Boolean).join("\n"),
    requested_output_depth: "standard",
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-moss">{label}</span>
      <input
        className="min-h-11 w-full rounded-md border border-ink/10 bg-fog/70 px-3 text-sm text-ink outline-none focus:border-moss"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-moss">{label}</span>
      <textarea
        className="w-full resize-y rounded-md border border-ink/10 bg-fog/70 p-3 text-sm leading-6 text-ink outline-none focus:border-moss"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}

function IntakeSection({
  title,
  description,
  children,
  defaultOpen = false,
  reflection,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
  reflection?: string;
}) {
  return (
    <details className="group border-t border-ink/10 py-5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block text-base font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink/55">{description}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-sm text-ink/55 transition group-open:rotate-45 group-open:border-moss/35 group-open:text-moss">
          +
        </span>
      </summary>
      {reflection ? (
        <p className="mt-4 rounded-md border border-moss/20 bg-[#f4f2ea] px-3 py-2 text-xs leading-5 text-ink/58">
          {reflection}
        </p>
      ) : null}
      <div className="mt-4 grid gap-4">{children}</div>
    </details>
  );
}

function LearningCue({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-md border border-amber-300/30 bg-[#fff8e6] px-3.5 py-3 text-sm leading-6 text-ink/66">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function mergeChoice(current: string, choice: string) {
  const parts = splitList(current);
  if (parts.some((part) => part.toLowerCase() === choice.toLowerCase())) return current;
  return [...parts, choice].join(", ");
}

function ChoicePills({
  prompt,
  value,
  choices,
  onChange,
  note,
}: {
  prompt: string;
  value: string;
  choices: string[];
  onChange: (value: string) => void;
  note?: string;
}) {
  const selected = splitList(value).map((item) => item.toLowerCase());
  return (
    <div>
      <p className="text-sm font-semibold leading-6 text-ink">{prompt}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-ink/52">{note}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = selected.includes(choice.toLowerCase());
          return (
            <button
              key={choice}
              type="button"
              className={`rounded-full border px-3.5 py-2 text-sm transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-white/70 text-ink/70 hover:border-moss/35 hover:bg-white"
              }`}
              onClick={() => onChange(mergeChoice(value, choice))}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RatingGrid({
  value,
  onChange,
}: {
  value: MetabolicRatings;
  onChange: (value: MetabolicRatings) => void;
}) {
  const labels = ["Never", "Rarely", "Sometimes", "Often"];
  return (
    <div className="border border-ink/10 bg-white/72 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold leading-6 text-ink">How often does each pattern show up?</p>
          <p className="mt-1 text-xs leading-5 text-ink/52">0 = never, 1 = rarely, 2 = sometimes, 3 = often.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {metabolicRatingItems.map((item) => (
          <div key={item.key} className="grid gap-2 border-t border-ink/8 pt-3 first:border-t-0 first:pt-0 md:grid-cols-[1fr_auto] md:items-center">
            <p className="text-sm leading-5 text-ink/72">{item.label}</p>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((score) => {
                const active = value[item.key] === score;
                return (
                  <button
                    key={`${item.key}-${score}`}
                    type="button"
                    className={`min-h-9 min-w-11 border px-2 text-xs transition ${
                      active ? "border-ink bg-ink text-white" : "border-ink/10 bg-fog/70 text-ink/60 hover:border-moss/35"
                    }`}
                    aria-label={`${item.label}: ${labels[score]}`}
                    onClick={() => onChange({ ...value, [item.key]: score })}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TraditionTone = "tcm" | "ayurveda" | "homeopathy";

const traditionToneClasses: Record<TraditionTone, string> = {
  tcm: "border-ink/10 bg-white text-ink",
  ayurveda: "border-ink/10 bg-white text-ink",
  homeopathy: "border-ink/10 bg-white text-ink",
};

const traditionMicrocopy: Record<TraditionTone, string> = {
  tcm: "This lens watches rhythm: heat and cold, movement and blockage, fullness and depletion.",
  ayurveda: "This lens listens for constitution: what steadies you, what scatters you, and how digestion carries the story.",
  homeopathy: "This lens looks for what is most individual: sensitivities, reactions, and the patterns that repeat under stress.",
};

function TraditionIntakeSection({
  index,
  tone,
  title,
  subtitle,
  children,
}: {
  index: string;
  tone: TraditionTone;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className={`border bg-white ${traditionToneClasses[tone]}`}>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">
              Section {index}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/64">{subtitle}</p>
          </div>
          <span className="border border-ink/10 bg-fog/60 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ink/58">
            {tone === "tcm" ? "Flow" : tone === "ayurveda" ? "Constitution" : "Sensitivity"}
          </span>
        </div>
        <p className="mt-4 border-l-2 border-moss/40 pl-3 text-sm leading-6 text-ink/62">
          {traditionMicrocopy[tone]}
        </p>
      </div>
      <div className="grid gap-4 border-t border-ink/8 bg-[#fbfaf6] p-5 md:p-6">
        {children}
      </div>
    </section>
  );
}

function ReflectionCard({
  title,
  insight,
  children,
}: {
  title: string;
  insight?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/72 p-4 shadow-[0_12px_36px_rgba(36,32,26,0.035)] first:border-t-0 first:pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{title}</p>
      {insight ? <p className="mt-2 text-sm leading-6 text-ink/58">{insight}</p> : null}
      <div className="mt-3 grid gap-4">{children}</div>
    </div>
  );
}

function SymptomPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (symptom: string) => void;
}) {
  return (
    <div className="border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Quick Symptoms</p>
          <h2 className="text-2xl font-semibold leading-tight">Tap what fits.</h2>
        </div>
        <p className="text-sm text-ink/55">{selected.length} selected</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {symptomLibrary.map((symptom) => {
          const active = selected.includes(symptom);
          return (
            <button
              key={symptom}
              type="button"
              className={`border px-3.5 py-2 text-sm transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-fog/70 text-ink/72 hover:border-moss/35 hover:bg-white"
              }`}
              onClick={() => onToggle(symptom)}
            >
              {symptom}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PatternProfileBuilder({
  form,
  selectedSymptoms,
}: {
  form: IntakeForm;
  selectedSymptoms: string[];
}) {
  const lenses = [
    {
      name: "Chinese Medicine",
      filled: [form.temperature, form.circulation, form.digestion, form.sleep, form.energy, form.elimination, form.tcmNotes, form.timingRhythm, form.stressPattern].filter(Boolean).length,
      total: 9,
    },
    {
      name: "Ayurveda",
      filled: [
        form.ayurvedaNotes,
        form.digestion,
        form.cravings,
        form.elimination,
        form.energy,
        form.sleep,
        form.dietHabits,
        form.dietaryChoices,
        form.foodPreferences,
        form.mealRhythm,
        form.appetiteDynamics,
        form.postMealComfort,
        form.bowelRegularity,
        form.stoolConsistency,
        form.thirstLevel,
      ].filter(Boolean).length,
      total: 15,
    },
    {
      name: "Homeopathy",
      filled: [form.homeopathyNotes, form.mood, form.stress, form.mindFocus, form.betterFrom, form.worseFrom, form.cravings, form.currentSnapshot, form.stressRelief, form.mentalFocusStyle, form.dreamPattern, form.sensoryExposures].filter(Boolean).length,
      total: 12,
    },
  ];
  const signals = [
    ...selectedSymptoms,
    ...splitList(form.goalIntentions),
    ...splitList(form.temperature),
    ...splitList(form.cravings),
    ...splitList(form.betterFrom),
    ...splitList(form.worseFrom),
  ].slice(0, 12);

  return (
    <section className="border border-ink/10 bg-[#f7f4ed] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Pattern Profile</p>
          <h2 className="text-2xl font-semibold leading-tight">Your answers are turning into a pattern map.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/62">
            As you answer, the app listens for rhythm, constitution, sensitivity, and what changes symptoms. Think of it as a mirror that gets clearer as you go.
          </p>
        </div>
        <span className="border border-ink/10 bg-white px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ink/58">
          {selectedSymptoms.length} symptoms
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {lenses.map((lens) => {
          const percent = Math.round((lens.filled / lens.total) * 100);
          return (
            <div key={lens.name} className="border border-ink/10 bg-white/75 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{lens.name}</span>
                <span className="text-ink/50">{percent}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden bg-ink/8">
                <div className="h-full bg-moss transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {signals.length ? (
        <div className="mt-4 rounded-md border border-ink/10 bg-white/64 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-moss">Pattern seeds noticed so far</p>
          <div className="flex flex-wrap gap-2">
            {signals.map((signal) => (
              <span key={signal} className="rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs text-ink/62">
                {signal}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function sourceLabel(citationIds: string[], references: CitationReference[]) {
  if (!citationIds.length) return "Book source: current on-file canon, stronger citation pending.";
  const labels = citationIds.slice(0, 3).map((id) => {
    const reference = references.find((item) => item.citation_id === id);
    if (!reference) return id;
    return `${reference.source}${reference.locator ? `, ${reference.locator}` : ""}${reference.pages ? `, p. ${reference.pages}` : ""}`;
  });
  return `Book source: ${labels.join(" | ")}`;
}

function complianceText(value: string) {
  return value
    .replace(/\bdiagnosis\b/gi, "pattern insight")
    .replace(/\bdiagnose\b/gi, "identify a pattern")
    .replace(/\btreatment plan\b/gi, "wellness direction overview")
    .replace(/\btreatment\b/gi, "wellness direction")
    .replace(/\btreat\b/gi, "address")
    .replace(/\bprescription\b/gi, "tradition-based suggestion")
    .replace(/\bprescribe\b/gi, "make a tradition-based suggestion")
    .replace(/\bpatient\b/gi, "user")
    .replace(/\brecommendations\b/gi, "wellness directions")
    .replace(/\brecommendation\b/gi, "wellness direction")
    .replace(/\brecommended\b/gi, "suggested for educational review");
}

function categoryTitle(category: string) {
  const labels: Record<string, string> = {
    acupuncture_moxibustion: "Acupuncture / Moxibustion",
    avoid_reduce: "Avoid / Reduce",
    breathwork: "Breathwork",
    constitution_notes: "Constitution Notes",
    diet: "Foods / Diet",
    formulas: "Formulas",
    herbs: "Herbs",
    lifestyle: "Lifestyle",
    meditation: "Meditation",
    modalities: "Modalities",
    movement: "Movement",
    observation: "Observation Notes",
    pattern_insight: "Pattern Insight",
    practitioner_follow_up: "Follow-Up",
    remedy_differential: "Remedy Differential",
    rubric_cluster: "Repertory Rubrics",
    sleep: "Sleep",
    yoga_breath: "Yoga / Breath",
  };
  return labels[category] || category.replaceAll("_", " ");
}

function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    review_first: "Start here",
    review_second: "Explore next",
    exploratory: "Optional",
    matched_pattern: "Matched pattern",
    hold_until_clarified: "Needs more detail",
    context_first: "Context first",
  };
  return labels[priority] || priority.replaceAll("_", " ");
}

function OutcomeItemCard({
  item,
  references,
}: {
  item: PracticalRecommendation;
  references: CitationReference[];
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white/78 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{categoryTitle(item.category)}</p>
          <h4 className="mt-2 text-base font-semibold leading-6 text-ink">{item.tradition}</h4>
        </div>
        <span className="rounded-full border border-ink/10 bg-fog px-2.5 py-1 text-xs text-ink/55">
          {priorityLabel(item.review_priority)}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Practical Outcome</p>
          <p className="mt-1 text-sm leading-6 text-ink/76">{complianceText(item.direction)}</p>
        </div>
        <p className="text-xs leading-5 text-ink/48">{sourceLabel(item.citations, references)}</p>
      </div>
    </article>
  );
}

function groupedOutcomeItems(items: PracticalRecommendation[]) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = `${item.category}-${item.tradition}-${item.practitioner_action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const categoryRank = (category: string) =>
    category === "pattern_insight" ? 4 :
    ["diet", "sleep", "movement", "breathwork", "lifestyle", "observation", "avoid_reduce"].includes(category) ? 3 :
      ["remedy_differential", "rubric_cluster", "herbs", "formulas"].includes(category) ? 2 : 1;
  return unique.sort((a, b) => {
    const priority = { matched_pattern: 5, review_first: 4, context_first: 3, review_second: 2, exploratory: 1, hold_until_clarified: 0 };
    return (
      categoryRank(b.category) - categoryRank(a.category) ||
      (priority[b.review_priority as keyof typeof priority] ?? 0) -
        (priority[a.review_priority as keyof typeof priority] ?? 0) ||
      b.confidence_score - a.confidence_score
    );
  });
}

function OutcomeTextList({ items, limit = 5 }: { items: string[]; limit?: number }) {
  const usefulItems = items
    .filter((item) => item && !item.startsWith("Current source basis:") && !item.includes("source lane"))
    .slice(0, limit);
  if (!usefulItems.length) return null;
  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/74">
      {usefulItems.map((item) => (
        <li key={item}>{complianceText(item)}</li>
      ))}
    </ul>
  );
}

function PracticalDirectionBlock({
  title,
  eyebrow,
  items,
  limit = 5,
}: {
  title: string;
  eyebrow: string;
  items: string[];
  limit?: number;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold leading-6 text-ink">{title}</h3>
      <OutcomeTextList items={items} limit={limit} />
    </article>
  );
}

function StepwiseOutcome({ trace }: { trace: BrainTrace }) {
  const output = trace.practical_output;
  const outcome = output.stepwise_outcome;
  const references = output.cited_source_references;
  if (!outcome) return null;

  return (
    <section className="rounded-xl border border-ink/12 bg-white p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Outcome</p>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">{complianceText(outcome.title)}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink/72">{complianceText(outcome.plain_language)}</p>
        </div>
        <span className="rounded-full border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-ink/62">
          {outcome.confidence.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-lg border border-moss/20 bg-[#f8f7f1] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Why This Matched</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/72">
            {outcome.why_this_matched.map((item) => (
              <li key={item}>{complianceText(item)}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Step 1 · Pattern Read</p>
          <p className="mt-3 text-sm leading-6 text-ink/76">{complianceText(outcome.step_1_pattern.items[0] || outcome.plain_language)}</p>
        </article>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {outcome.step_2_traditions.items.map((item) => (
          <article key={`${item.tradition}-${item.direction}`} className="rounded-lg border border-ink/10 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Step 2 · {item.tradition}</p>
            <p className="mt-3 text-sm leading-6 text-ink/76">{complianceText(item.direction)}</p>
            {item.citations?.length ? (
              <p className="mt-3 text-xs leading-5 text-ink/45">{sourceLabel(item.citations, references)}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Step 3 · Do First</p>
          <ol className="mt-3 space-y-3 text-sm leading-6 text-ink/76">
            {outcome.step_3_do_first.items.map((item, index) => (
              <li key={`${item.category}-${item.practitioner_action}`} className="grid grid-cols-[1.6rem_1fr] gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white">{index + 1}</span>
                <span>
                  {complianceText(item.practitioner_action)}
                  <span className="mt-1 block text-xs leading-5 text-ink/45">
                    {categoryTitle(item.category)} · {sourceLabel(item.citations, references)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </article>

        <div className="space-y-3">
          <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Step 4 · Track Next</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/72">
              {outcome.step_4_track.items.map((item) => (
                <li key={item}>{complianceText(item)}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      <article className="mt-4 rounded-lg border border-ink/10 bg-white/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Step 5 · Explore Carefully</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {outcome.step_5_explore_next.items.slice(0, 6).map((item) => (
            <div key={`${item.category}-${item.practitioner_action}`} className="rounded-md bg-fog/65 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{categoryTitle(item.category)}</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">{complianceText(item.practitioner_action)}</p>
              <p className="mt-2 text-xs leading-5 text-ink/45">{sourceLabel(item.citations, references)}</p>
            </div>
          ))}
        </div>
      </article>

      <section className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Practical Direction</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <PracticalDirectionBlock
            eyebrow="Food Pattern"
            title="Use food to clarify the pattern"
            items={outcome.category_outcomes.diet}
            limit={5}
          />
          <PracticalDirectionBlock
            eyebrow="Herbs / Formulas / Remedies"
            title="Compare these as tradition-based possibilities"
            items={outcome.category_outcomes.herbs_formulas_remedies}
            limit={6}
          />
          <PracticalDirectionBlock
            eyebrow="Sleep / Recovery"
            title="Read sleep as a pattern clue"
            items={outcome.category_outcomes.sleep_recovery}
            limit={4}
          />
          <PracticalDirectionBlock
            eyebrow="Avoid / Reduce"
            title="Remove the clearest aggravator first"
            items={outcome.category_outcomes.avoid_reduce}
            limit={4}
          />
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">What To Track</p>
          <OutcomeTextList items={outcome.category_outcomes.tracking} limit={6} />
        </article>
        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">What Would Sharpen This</p>
          <OutcomeTextList items={outcome.category_outcomes.questions_refinement} limit={5} />
        </article>
      </section>

      {outcome.missing_source_notes.length ? (
        <article className="mt-4 rounded-lg border border-amber-300/35 bg-[#fffaf0] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Source Coverage Notes</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            {outcome.missing_source_notes.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <details className="mt-4 rounded-lg border border-ink/10 bg-fog/45 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">More pattern notes</summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <PracticalDirectionBlock eyebrow="Lifestyle" title="Daily rhythm and practice" items={outcome.category_outcomes.lifestyle_practices} limit={6} />
          <PracticalDirectionBlock eyebrow="Movement" title="Body response tests" items={outcome.category_outcomes.movement_body} limit={5} />
          <PracticalDirectionBlock eyebrow="Breath / Meditation" title="Nervous-system experiments" items={outcome.category_outcomes.breathwork_meditation} limit={5} />
          <PracticalDirectionBlock eyebrow="Follow-Up" title="Questions for a better result" items={outcome.category_outcomes.practitioner_follow_up} limit={6} />
        </div>
      </details>
    </section>
  );
}

export function PatternBrainPrototype() {
  const [form, setForm] = useState<IntakeForm>(sampleForm);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "poor sleep",
    "bloating",
    "low energy",
  ]);
  const [trace, setTrace] = useState<BrainTrace | null>(null);
  const [view, setView] = useState<"intake" | "results">("intake");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setError("");
    setLoading(true);
    try {
      const selected = selectedSymptoms.join(", ");
      const parsed = intakeFromForm({
        ...form,
        primarySymptoms: [selected, form.primarySymptoms].filter(Boolean).join(", "),
      });
      const response = await fetch("/api/pattern-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Brain analysis failed");
      setTrace(body);
      setView("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze this intake");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    );
  }

  if (view === "results" && trace) {
    return (
      <main className="min-h-screen bg-[#fbfaf6]">
        <div className="container-shell max-w-6xl py-10 md:py-14">
          <section className="mb-8 border border-moss/20 bg-white p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Results</p>
                <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] md:text-6xl">
                  Your pattern interpretation is ready.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-ink/68">
                  The system has read your intake across Chinese Medicine, Ayurveda, and Homeopathy for wellness education, self-reflection, and pattern exploration. This result keeps the traditions distinct, then shows practical pattern signals that overlap.
                </p>
              </div>
              <button
                className="button-secondary min-h-9 px-3 py-2 text-xs"
                onClick={() => setView("intake")}
              >
                Back To Intake
              </button>
            </div>
          </section>

          <section className="space-y-5">
            <StepwiseOutcome trace={trace} />

            <div className="rounded-lg border border-ink/10 bg-white/70 p-4">
              <ShortResultDisclaimer />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6]">
      <div className="container-shell max-w-5xl py-8 md:py-12">
        <section className="mb-7">
          <div>
            <p className="eyebrow mb-3">3 Patterns</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] md:text-5xl">
              Build your pattern profile, one clue at a time.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              This is the main experience: a calm, reflective flow that helps you notice symptoms, rhythms, tendencies, sensitivities, and goals through Chinese Medicine, Ayurveda, and Homeopathy.
            </p>
            <div className="mt-5 grid max-w-3xl gap-3 md:grid-cols-3">
              {[
                ["Notice", "What is happening now"],
                ["Connect", "Where patterns repeat"],
                ["Interpret", "What the traditions may see"],
              ].map(([step, copy]) => (
                <div key={step} className="rounded-md border border-ink/10 bg-white/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{step}</p>
                  <p className="mt-1 text-sm leading-5 text-ink/62">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl">
          <section className="space-y-5">
            <SymptomPicker selected={selectedSymptoms} onToggle={toggleSymptom} />
            <PatternProfileBuilder form={form} selectedSymptoms={selectedSymptoms} />

            <section className="border border-ink/10 bg-white p-5">
              <div className="mb-4">
                <p className="eyebrow mb-2">Intake</p>
                <h2 className="text-2xl font-semibold leading-tight">Three traditions, one unfolding picture.</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Move through each lens. The questions are simple, but they collect details for wellness education, self-reflection, and traditional pattern exploration.
                </p>
                <LearningCue title="How to use this">
                  Answer quickly when something is obvious. Pause when a question makes you notice a pattern you had not named before. That is the point.
                </LearningCue>
              </div>
              <div className="space-y-4">
                <IntakeSection
                  title="Main Concern"
                  description="Start with the story before the system looks for patterns."
                  reflection="What you are learning here: the way a pattern begins, repeats, and changes often matters as much as the symptom name itself."
                  defaultOpen
                >
                  <TextField
                    label="Main concern, in your own words"
                    value={form.chiefComplaint}
                    onChange={(value) => updateForm("chiefComplaint", value)}
                    placeholder="Tell the story simply: what started, what changed, what you notice most..."
                    rows={3}
                  />
                  <TextField label="Other symptoms" value={form.secondarySymptoms} onChange={(value) => updateForm("secondarySymptoms", value)} placeholder="Anything not covered by the symptom taps" rows={2} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Duration" value={form.duration} onChange={(value) => updateForm("duration", value)} placeholder="days, weeks, months" />
                    <Field label="Severity" value={form.severity} onChange={(value) => updateForm("severity", value)} placeholder="mild, moderate, severe, 0-10" />
                  </div>
                  <TextField
                    label="What was happening around the time it started?"
                    value={form.stress}
                    onChange={(value) => updateForm("stress", value)}
                    placeholder="stress, illness, travel, loss, weather change, food change, medication change, overwork..."
                    rows={2}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Current Pattern Snapshot"
                  description="A quick read of what your body and mood are showing today."
                  reflection="This is the first self-check: not a diagnosis, just a clear look at what has been asking for attention."
                  defaultOpen
                >
                  <ChoicePills
                    prompt="What are you currently noticing?"
                    note="This gives the app a quick pattern map before the deeper sections."
                    value={form.currentSnapshot}
                    choices={[
                      "low energy",
                      "uneven energy",
                      "bloating",
                      "poor sleep",
                      "moody",
                      "high stress",
                      "low appetite",
                      "cravings",
                      "body tension",
                      "brain fog",
                      "low motivation",
                    ]}
                    onChange={(value) => updateForm("currentSnapshot", value)}
                  />
                  <TextField
                    label="What feels most important about this pattern?"
                    value={form.currentSnapshot}
                    onChange={(value) => updateForm("currentSnapshot", value)}
                    placeholder="The thing I keep noticing is... It tends to show up when..."
                    rows={3}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Goals / Would You Like To..."
                  description="Name what you want life to feel like on the other side of the pattern."
                  reflection="This turns the intake from symptom collection into direction. The output can speak to what you are actually trying to change."
                  defaultOpen
                >
                  <ChoicePills
                    prompt="What would you like to move toward?"
                    note="This is aspirational. It helps the output align with your actual goals."
                    value={form.goalIntentions}
                    choices={goalOptions}
                    onChange={(value) => updateForm("goalIntentions", value)}
                  />
                  <TextField
                    label="Your own words for the outcome you want"
                    value={form.goals}
                    onChange={(value) => updateForm("goals", value)}
                    placeholder="I want to feel... I want my daily rhythm to..."
                    rows={3}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Diet + Eating Pattern"
                  description="Food shows rhythm, appetite, cravings, comfort, and what your system resists."
                  reflection="This chapter is about your daily chemistry: how hunger, meals, thirst, and elimination behave when life is steady or stressful."
                >
                  <div>
                    <p className="eyebrow mb-2">Metabolic + Elimination Health</p>
                    <h3 className="text-xl font-semibold leading-tight">Agni and malas, in plain language.</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      Appetite, post-meal comfort, bowel rhythm, stool quality, and thirst give the app a much clearer picture of digestion and elimination.
                    </p>
                  </div>
                  <ChoicePills
                    prompt="How does your appetite usually behave?"
                    note="Appetite is one of the clearest places to notice whether your system feels variable, intense, dull, or steady."
                    value={form.appetiteDynamics}
                    choices={["variable appetite", "intensely sharp appetite", "dull appetite", "steady and consistent appetite", "low appetite", "forget to eat", "hungry soon after eating"]}
                    onChange={(value) => updateForm("appetiteDynamics", value)}
                  />
                  <ChoicePills
                    prompt="What happens after meals?"
                    note="Post-meal clues help separate food choice, timing, digestive strength, heaviness, heat, and stagnation patterns."
                    value={form.postMealComfort}
                    choices={["gas", "bloating", "burping", "hyperacidity", "sluggishness", "sleepy after eating", "clear and comfortable", "heavy after eating"]}
                    onChange={(value) => updateForm("postMealComfort", value)}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Bowel movements daily" value={form.bowelRegularity} onChange={(value) => updateForm("bowelRegularity", value)} placeholder="0, 1, 2, 3+, irregular" />
                    <TextField label="Typical stool consistency" value={form.stoolConsistency} onChange={(value) => updateForm("stoolConsistency", value)} placeholder="loose, hard, dry, normal, heavy, sticky..." rows={2} />
                  </div>
                  <ChoicePills
                    prompt="How is your thirst?"
                    note="Thirst can reveal dryness, heat, fluid movement, habit, and temperature preference."
                    value={form.thirstLevel}
                    choices={["frequent dry mouth", "very thirsty", "rarely thirsty", "prefer cold drinks", "prefer warm drinks", "thirst at night", "steady thirst"]}
                    onChange={(value) => updateForm("thirstLevel", value)}
                  />
                  <ChoicePills
                    prompt="Which eating habits fit most often?"
                    value={form.dietHabits}
                    choices={[
                      "skip breakfast",
                      "two meals/day",
                      "one meal/day",
                      "graze",
                      "eat on the run",
                      "eat when not hungry",
                      "late meals",
                      "irregular meal timing",
                      "add salt to food",
                    ]}
                    onChange={(value) => updateForm("dietHabits", value)}
                  />
                  <ChoicePills
                    prompt="Strong attraction or dislike?"
                    note="Inspired by the PDF's flavor preference structure; useful for Ayurveda, Chinese Medicine, and Homeopathy."
                    value={form.foodPreferences}
                    choices={[
                      "sweet",
                      "salty",
                      "sour",
                      "bitter",
                      "spicy or pungent",
                      "rich or fatty",
                      "warm foods",
                      "raw foods",
                      "cooked foods",
                      "cold drinks",
                      "warm drinks",
                    ]}
                    onChange={(value) => updateForm("foodPreferences", value)}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Foods that feel better or worse" value={form.mealRhythm} onChange={(value) => updateForm("mealRhythm", value)} placeholder="better with warm meals, worse with dairy, worse late at night..." rows={3} />
                    <TextField label="Caffeine + hydration" value={form.hydrationCaffeine} onChange={(value) => updateForm("hydrationCaffeine", value)} placeholder="coffee, tea, soda, water, thirst, dry mouth..." rows={3} />
                    <TextField label="Substance patterns" value={form.substanceUse} onChange={(value) => updateForm("substanceUse", value)} placeholder="caffeine, alcohol, tobacco, cannabis, recreational substances..." rows={3} />
                    <TextField label="Typical week of food" value={form.dietaryChoices} onChange={(value) => updateForm("dietaryChoices", value)} placeholder="foods you eat most often, foods you avoid because they trigger symptoms..." rows={3} />
                  </div>
                </IntakeSection>

                <IntakeSection
                  title="Exercise + Movement"
                  description="Movement response shows whether action clears, drains, grounds, or overstimulates you."
                  reflection="Notice the difference between what you think you should do and what your system actually recovers from."
                >
                  <ChoicePills
                    prompt="What kind of movement do you usually do?"
                    value={form.movementHabits}
                    choices={[
                      "walk",
                      "run or jog",
                      "weights",
                      "swim",
                      "yoga",
                      "stretching",
                      "intense workouts",
                      "gentle movement",
                      "1-2 days/week",
                      "3-4 days/week",
                      "5-7 days/week",
                    ]}
                    onChange={(value) => updateForm("movementHabits", value)}
                  />
                  <ChoicePills
                    prompt="How do you respond to movement?"
                    value={form.movementResponse}
                    choices={[
                      "energized after exercise",
                      "exhausted after exercise",
                      "slow recovery",
                      "quick recovery",
                      "better with walking",
                      "better with stretching",
                      "worse after intensity",
                      "need movement to clear my mind",
                    ]}
                    onChange={(value) => updateForm("movementResponse", value)}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Stress Assessment"
                  description="More than a stress score: where it lands, what it does, and what helps."
                  reflection="This is where the intake gets personal. Stress has a signature: it may go to digestion, sleep, focus, mood, appetite, or tension first."
                >
                  <div className="grid gap-3 md:grid-cols-[12rem_1fr]">
                    <Field label="Stress level 1-10" value={form.stressLevel} onChange={(value) => updateForm("stressLevel", value)} placeholder="7" />
                    <TextField label="Major sources of stress" value={form.stressSources} onChange={(value) => updateForm("stressSources", value)} placeholder="work, money, caregiving, uncertainty, conflict, schedule..." rows={2} />
                  </div>
                  <ChoicePills
                    prompt="Where does stress show up first?"
                    value={form.stressPattern}
                    choices={[
                      "digestion",
                      "sleep",
                      "mood",
                      "appetite",
                      "pain or tension",
                      "fatigue",
                      "racing thoughts",
                      "withdrawal",
                      "restlessness",
                    ]}
                    onChange={(value) => updateForm("stressPattern", value)}
                  />
                  <ChoicePills
                    prompt="What does stress tend to do to you?"
                    note="No perfect answer here. The useful part is seeing your default adaptation style."
                    value={form.stressPattern}
                    choices={[
                      "wired",
                      "depleted",
                      "irritable",
                      "scattered",
                      "withdrawn",
                      "emotional",
                      "restless",
                      "shut down",
                    ]}
                    onChange={(value) => updateForm("stressPattern", value)}
                  />
                  <ChoicePills
                    prompt="What is your mind like most often?"
                    note="This helps the app tell the difference between racing, focused, foggy, scattered, calm, and shut-down states."
                    value={form.mentalFocusStyle}
                    choices={["restless and racing", "highly focused and goal-oriented", "calm but sometimes unmotivated", "foggy or scattered", "indecisive", "organized under pressure", "easily distracted"]}
                    onChange={(value) => updateForm("mentalFocusStyle", value)}
                  />
                  <ChoicePills
                    prompt="What tends to help?"
                    value={form.stressRelief}
                    choices={["rest", "movement", "food", "solitude", "warmth", "structure", "expression", "being reassured", "quiet"]}
                    onChange={(value) => updateForm("stressRelief", value)}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Metabolic Pattern Ratings"
                  description="A quick signal-strength scan. Nothing to overthink."
                  reflection="The 0-3 ratings help the app tell which patterns are background noise and which ones keep showing up."
                >
                  <RatingGrid value={form.metabolicRatings} onChange={(value) => updateForm("metabolicRatings", value)} />
                </IntakeSection>

                <IntakeSection
                  title="Timing / Rhythm"
                  description="When something happens can be a pattern all by itself."
                  reflection="This chapter teaches you to look for repetition: morning, afternoon, night, after meals, before meals, or the same waking time."
                >
                  <div>
                    <p className="eyebrow mb-2">Sleep + Circadian Rhythm</p>
                    <h3 className="text-xl font-semibold leading-tight">When your system restores, wakes, and repeats.</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Typical bedtime + waking time" value={form.sleepSchedule} onChange={(value) => updateForm("sleepSchedule", value)} placeholder="bed around 10:30 p.m., wake around 6:30 a.m..." rows={2} />
                    <TextField label="Sleep quality" value={form.sleep} onChange={(value) => updateForm("sleep", value)} placeholder="hard to fall asleep, frequent awakenings, heavy sleep, groggy waking..." rows={2} />
                  </div>
                  <ChoicePills
                    prompt="What are your dreams like?"
                    note="Dream tone can sometimes reflect whether the system is anxious, fiery, heavy, busy, or quietly restorative."
                    value={form.dreamPattern}
                    choices={["anxious and active", "vivid and fiery", "peaceful and infrequent", "busy problem-solving dreams", "nightmares", "do not remember dreams", "wake from dreams"]}
                    onChange={(value) => updateForm("dreamPattern", value)}
                  />
                  <ChoicePills
                    prompt="When do you feel best or worst?"
                    value={form.timingRhythm}
                    choices={[
                      "best morning",
                      "best afternoon",
                      "best evening",
                      "worst morning",
                      "worst afternoon",
                      "worst evening",
                      "worse 1-3 a.m.",
                      "worse 3-5 a.m.",
                      "worse after meals",
                      "worse before meals",
                    ]}
                    onChange={(value) => updateForm("timingRhythm", value)}
                  />
                  <TextField
                    label="Repeated timing"
                    value={form.timingRhythm}
                    onChange={(value) => updateForm("timingRhythm", value)}
                    placeholder="Symptoms repeat around... I wake at... Energy drops at..."
                    rows={3}
                  />
                </IntakeSection>

                <IntakeSection
                  title="Sensory + Environmental Exposures"
                  description="Your environment may be part of the pattern, not just background."
                  reflection="This is a useful moment for people who think they are just sensitive. The intake treats sensitivity as information."
                >
                  <ChoicePills
                    prompt="Which exposures affect you?"
                    value={form.sensoryExposures}
                    choices={["loud noises", "bright lights", "screens", "cold wind", "intense heat", "strong smells", "crowds", "weather changes", "travel", "too much stimulation"]}
                    onChange={(value) => updateForm("sensoryExposures", value)}
                  />
                  <TextField
                    label="How your environment changes your pattern"
                    value={form.sensoryExposures}
                    onChange={(value) => updateForm("sensoryExposures", value)}
                    placeholder="I feel worse with... I feel calmer when..."
                    rows={3}
                  />
                </IntakeSection>

                <TraditionIntakeSection
                  index="1"
                  tone="tcm"
                  title="Chinese Medicine"
                  subtitle="Chinese Medicine looks at how energy moves through the body and where imbalance begins to appear."
                >
                  <ReflectionCard title="Temperature + Rhythm" insight="This lens asks whether your system tends to run cold, hot, mixed, dry, restless, full, or depleted.">
                    <ChoicePills
                      prompt="Do you tend to feel more hot, cold, mixed, or changing?"
                      note="This helps separate temperature, dryness, sweating, and changing states."
                      value={form.temperature}
                      choices={["cold easily", "runs hot", "alternating hot and cold", "hot flashes", "night sweats", "dry mouth", "thirsty", "changes day to day"]}
                      onChange={(value) => updateForm("temperature", value)}
                    />
                    <ChoicePills
                      prompt="When do you feel most energized or most depleted?"
                      value={form.energy}
                      choices={["low morning energy", "afternoon crash", "wired at night", "depleted after meals", "better with movement", "worse after exertion"]}
                      onChange={(value) => updateForm("energy", value)}
                    />
                  </ReflectionCard>

                  <ReflectionCard title="Flow + Body Location" insight="Stress often chooses a doorway: chest, throat, stomach, head, bowels, jaw, or shoulders.">
                    <ChoicePills
                      prompt="Where does stress affect you first?"
                      value={form.tcmNotes}
                      choices={["chest", "throat", "stomach", "head", "sleep", "bowels", "jaw or shoulders"]}
                      onChange={(value) => updateForm("tcmNotes", value)}
                    />
                    <ChoicePills
                      prompt="What surface or fluid signs show up?"
                      note="This maps to sweating, swelling, dryness, urination, and exterior/interior clues."
                      value={form.circulation}
                      choices={["sweats easily", "rarely sweats", "night sweats", "cold hands or feet", "flushing", "swelling", "dry skin", "frequent urination"]}
                      onChange={(value) => updateForm("circulation", value)}
                    />
                    <TextField
                      label="How stress changes digestion, sleep, or body tension"
                      value={form.stress}
                      onChange={(value) => updateForm("stress", value)}
                      placeholder="I get tight in my chest, digestion slows down, sleep gets restless..."
                      rows={3}
                    />
                  </ReflectionCard>

                  <ReflectionCard title="Digestion + Sleep + Elimination" insight="These everyday rhythms help show how smoothly energy, fluids, rest, and release are moving.">
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Digestion under stress" value={form.digestion} onChange={(value) => updateForm("digestion", value)} placeholder="bloating, appetite, reflux, heaviness, nausea..." rows={3} />
                      <TextField label="Sleep rhythm" value={form.sleep} onChange={(value) => updateForm("sleep", value)} placeholder="falling asleep, waking time, dreams, restless sleep..." rows={3} />
                      <TextField label="Bowel / urine rhythm" value={form.elimination} onChange={(value) => updateForm("elimination", value)} placeholder="constipation, loose stool, frequency, color, urgency, urination..." rows={3} />
                      <TextField label="Chest, abdomen, head, or pain pattern" value={form.pain} onChange={(value) => updateForm("pain", value)} placeholder="where it is, what it feels like, whether it moves or stays..." rows={3} />
                    </div>
                  </ReflectionCard>
                </TraditionIntakeSection>

                <TraditionIntakeSection
                  index="2"
                  tone="ayurveda"
                  title="Ayurveda"
                  subtitle="Ayurveda explores your natural constitution and how your mind and body respond to daily life."
                >
                  <ReflectionCard title="Constitution + Routine" insight="This lens looks for what steadies you, what scatters you, and what your baseline nature seems to prefer.">
                    <ChoicePills
                      prompt="What happens when your schedule becomes irregular?"
                      note="This helps notice whether rhythm changes make you scattered, intense, heavy, hungry, tired, or unsteady."
                      value={form.ayurvedaNotes}
                      choices={["scattered", "anxious", "irritable", "heavy or sluggish", "cravings increase", "sleep gets off", "digestion changes"]}
                      onChange={(value) => updateForm("ayurvedaNotes", value)}
                    />
                    <ChoicePills
                      prompt="Which qualities feel most familiar in your body or mind?"
                      value={form.ayurvedaNotes}
                      choices={["light", "dry", "cold", "intense", "sharp", "hot", "heavy", "slow", "steady", "oily"]}
                      onChange={(value) => updateForm("ayurvedaNotes", value)}
                    />
                  </ReflectionCard>

                  <ReflectionCard title="Agni: Your Digestive Fire" insight="Agni is the everyday question of how well you take in, transform, and feel clear after food and experience.">
                    <ChoicePills
                      prompt="How would you describe your appetite?"
                      note="This helps distinguish steady, variable, sharp, dull, heavy, or irritated digestion."
                      value={form.digestion}
                      choices={["regular appetite", "variable appetite", "strong appetite", "low appetite", "heavy after meals", "bloating", "burning or acidity", "skipping meals throws me off"]}
                      onChange={(value) => updateForm("digestion", value)}
                    />
                    <ChoicePills
                      prompt="Do any ama-like heaviness signs fit?"
                      note="This does not diagnose ama; it helps notice traditional signs of heaviness, coating, sluggishness, and incomplete digestion."
                      value={form.ayurvedaNotes}
                      choices={["heavy after eating", "coated tongue", "sticky mucus", "sluggish on waking", "foul gas or stool", "brain fog after meals", "low appetite with bloating"]}
                      onChange={(value) => updateForm("ayurvedaNotes", value)}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Food tastes, cravings, aversions" value={form.cravings} onChange={(value) => updateForm("cravings", value)} placeholder="sweet, salty, sour, spicy, bitter, cold drinks, warm foods, aversions..." rows={3} />
                      <TextField label="Daily rhythm" value={form.energy} onChange={(value) => updateForm("energy", value)} placeholder="when you feel steady, scattered, intense, or heavy..." rows={3} />
                    </div>
                  </ReflectionCard>

                  <ReflectionCard title="Grounding + Overstimulation" insight="A lot of constitution shows up in what happens when life gets irregular, noisy, fast, or demanding.">
                    <TextField
                      label="How overstimulation affects you"
                      value={form.mindFocus}
                      onChange={(value) => updateForm("mindFocus", value)}
                      placeholder="too much noise, screens, travel, people, pressure, or change..."
                      rows={3}
                    />
                    <TextField
                      label="What helps you feel settled"
                      value={form.stressRelief}
                      onChange={(value) => updateForm("stressRelief", value)}
                      placeholder="routine, warmth, movement, quiet, structure, food rhythm..."
                      rows={3}
                    />
                  </ReflectionCard>
                </TraditionIntakeSection>

                <TraditionIntakeSection
                  index="3"
                  tone="homeopathy"
                  title="Homeopathy"
                  subtitle="Homeopathy looks at the unique ways your system responds physically, mentally, and emotionally."
                >
                  <ReflectionCard title="Sensitivity + Response" insight="This section watches your individual style: what drains you, what overwhelms you, and how you adapt.">
                    <ChoicePills
                      prompt="What happens when you feel emotionally overwhelmed?"
                      note="This helps find your individual response pattern, not just the symptom name."
                      value={form.homeopathyNotes}
                      choices={["withdraw", "need reassurance", "become restless", "push through", "get irritable", "shut down", "cry easily", "feel stuck"]}
                      onChange={(value) => updateForm("homeopathyNotes", value)}
                    />
                    <ChoicePills
                      prompt="What kind of environment drains you most?"
                      value={form.homeopathyNotes}
                      choices={["noise", "conflict", "crowds", "being watched", "too much responsibility", "lack of control", "uncertainty", "feeling unseen"]}
                      onChange={(value) => updateForm("homeopathyNotes", value)}
                    />
                  </ReflectionCard>

                  <ReflectionCard title="What Changes Symptoms" insight="Better and worse are not small details. They are often the details that make your pattern more specific.">
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Better from" value={form.betterFrom} onChange={(value) => updateForm("betterFrom", value)} placeholder="rest, heat, cold, pressure, movement, eating, being alone..." rows={3} />
                      <TextField label="Worse from" value={form.worseFrom} onChange={(value) => updateForm("worseFrom", value)} placeholder="night, stress, cold, heat, motion, noise, certain foods..." rows={3} />
                    </div>
                    <TextField
                      label="Repeating emotional patterns"
                      value={form.mood}
                      onChange={(value) => updateForm("mood", value)}
                      placeholder="the same feeling, reaction, fear, pressure, or coping pattern that keeps returning..."
                      rows={3}
                    />
                  </ReflectionCard>

                  <ReflectionCard title="Individual Details" insight="The odd, precise, personal details are welcome here. They often carry more signal than generic symptom names.">
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Exact sensation and place" value={form.pain} onChange={(value) => updateForm("pain", value)} placeholder="location, quality, timing, what changes it, what it reminds you of..." rows={3} />
                      <TextField label="Skin / surface patterns" value={form.skin} onChange={(value) => updateForm("skin", value)} placeholder="rash, dryness, itching, acne, sensitivity..." rows={3} />
                      <TextField label="Menstrual / reproductive patterns" value={form.reproductive} onChange={(value) => updateForm("reproductive", value)} rows={3} />
                      <TextField label="Preferences or avoidances" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="gentle first, avoid herbs, food-based, slow changes..." rows={3} />
                    </div>
                  </ReflectionCard>
                </TraditionIntakeSection>

                <IntakeSection title="Preferences + Context" description="A few details that help the output stay relevant to you.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Sensitivities or prior reactions" value={form.cautions} onChange={(value) => updateForm("cautions", value)} placeholder="sensitivities, strong reactions, things you know do not work for you..." rows={2} />
                    <TextField label="Preferences" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="gentle first, food only, avoid herbs..." rows={2} />
                    <TextField label="Current herbs, supplements, or medications, if relevant" value={form.medications} onChange={(value) => updateForm("medications", value)} rows={2} />
                    <TextField label="Pregnancy / postpartum status, if relevant" value={form.pregnancyStatus} onChange={(value) => updateForm("pregnancyStatus", value)} rows={2} />
                  </div>
                </IntakeSection>

                <section className="border-t border-ink/10 pt-5">
                  <p className="eyebrow mb-2">In Your Own Words</p>
                  <h2 className="text-2xl font-semibold leading-tight">Now describe what you understand about what is happening.</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/60">
                    After moving through the three lenses, use this space for anything the questions helped you notice: symptoms, emotional state, timeline, odd details, repeating patterns, or what feels most important.
                  </p>
                  <textarea
                    className="mt-5 min-h-[13rem] w-full resize-y border border-ink/10 bg-fog/60 p-4 text-base leading-7 text-ink outline-none transition focus:border-moss focus:bg-white"
                    value={form.practitionerNotes}
                    onChange={(event) => updateForm("practitionerNotes", event.target.value)}
                    placeholder="After answering, I notice... The pattern seems to be... What I keep wondering about is..."
                  />
                </section>
              </div>

              <div className="mt-6 border border-moss/20 bg-[#f7f4ed] p-5">
                <p className="eyebrow mb-2">Complete the Intake</p>
                <h2 className="text-2xl font-semibold leading-tight">Looking across your patterns through multiple traditions.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                  When you finish, the system will build a wellness pattern insight from your symptoms, rhythms, constitution, sensitivities, goals, and preferences.
                </p>
                {loading ? (
                  <div className="mt-4 border border-ink/10 bg-white/70 p-4">
                    <p className="text-sm font-semibold text-ink">Building your personalized interpretation...</p>
                    <p className="mt-1 text-sm leading-6 text-ink/60">
                      The app is comparing your intake across Chinese Medicine, Ayurveda, and Homeopathy.
                    </p>
                  </div>
                ) : null}
                {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="button-primary" onClick={analyze} disabled={loading}>
                    {loading ? "Building..." : "Finish Intake"}
                  </button>
                  {trace ? (
                    <button className="button-secondary min-h-9 px-3 py-2 text-xs" onClick={() => setTrace(null)}>
                      Return To Intake Only
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="button-secondary min-h-9 px-3 py-2 text-xs"
                  onClick={() => {
                    setForm(sampleForm);
                    setSelectedSymptoms(["poor sleep", "bloating", "low energy"]);
                    setTrace(null);
                    setView("intake");
                    setError("");
                  }}
                >
                  Reset Sample
                </button>
              </div>
            </section>

          </section>
        </div>
      </div>
    </main>
  );
}
