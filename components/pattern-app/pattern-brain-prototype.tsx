"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  BasisOfInsightDisclosure,
  EmergencyWarning,
  FullMedicalDisclaimer,
  ShortResultDisclaimer,
} from "@/components/compliance/disclosures";

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
};

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function intakeFromForm(form: IntakeForm) {
  const thirstPattern = [form.temperature, form.cravings]
    .filter((value) => /thirst|dry mouth|cold drinks|warm drinks/i.test(value))
    .join("\n");
  const sweatingPattern = [form.temperature, form.circulation]
    .filter((value) => /sweat|night sweats|flushing|flush/i.test(value))
    .join("\n");
  const amaSigns = splitList([form.ayurvedaNotes, form.digestion, form.energy, form.elimination].join(", "))
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
      time_patterns: splitList(form.worseFrom).filter((item) => /morning|night|day|evening|time/i.test(item)),
      temperature_patterns: splitList(form.temperature),
      digestion: [form.digestion, form.cravings, form.elimination].filter(Boolean).join("\n"),
      sleep: form.sleep,
      energy: form.energy,
      mood: [form.mood, form.stress, form.mindFocus].filter(Boolean).join("\n"),
      pain_location: form.pain,
      pain_quality: form.pain,
    },
    tradition_specific_inputs: {
      ayurveda: {
        prakriti: "",
        vikriti: form.ayurvedaNotes,
        agni: form.digestion,
        ama_signs: amaSigns,
        bowel_pattern: form.elimination,
        tongue_notes: "",
        pulse_notes: "",
      },
      tcm: {
        tongue: "",
        pulse: "",
        temperature: [form.temperature, form.circulation].filter(Boolean).join("\n"),
        sweating: sweatingPattern,
        thirst: thirstPattern,
        appetite: [form.digestion, form.cravings].filter(Boolean).join("\n"),
        bowel_urine: form.elimination,
        emotional_pattern: [form.mood, form.stress, form.tcmNotes].filter(Boolean).join("\n"),
      },
      homeopathy: {
        modalities: [...splitList(form.betterFrom), ...splitList(form.worseFrom)],
        mental_emotional_state: [form.mood, form.stress, form.mindFocus].filter(Boolean).join("\n"),
        generals: [
          ...splitList(form.homeopathyNotes),
          ...splitList(form.energy),
          ...splitList(form.temperature),
          ...splitList(form.cravings),
        ],
        peculiar_symptoms: splitList([form.pain, form.skin, form.reproductive].filter(Boolean).join(", ")),
        food_cravings_aversions: splitList(form.cravings),
        thermal_state: [form.temperature, form.circulation].filter(Boolean).join("\n"),
      },
    },
    practitioner_notes: [
      form.practitionerNotes,
      form.goals ? `Goals: ${form.goals}` : "",
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
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-t border-ink/10 py-5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block text-base font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink/55">{description}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-ink/10 bg-white text-sm text-ink/55 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-4 grid gap-3">{children}</div>
    </details>
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

type TraditionTone = "tcm" | "ayurveda" | "homeopathy";

const traditionToneClasses: Record<TraditionTone, string> = {
  tcm: "border-ink/10 bg-white text-ink",
  ayurveda: "border-ink/10 bg-white text-ink",
  homeopathy: "border-ink/10 bg-white text-ink",
};

const sourceIntakeBasis: Record<TraditionTone, string[]> = {
  tcm: [
    "Huangdi Neijing: cold/heat, sweating, sleep, urine, pain, chest/abdomen, qi movement",
    "Current app translation: rhythm, temperature, fluids, elimination, stress location, surface signs",
  ],
  ayurveda: [
    "Sushruta / Ashtanga Hridayam: dosha, agni, ama, mala, sleep, taste, routine, age/day/diet timing",
    "Current app translation: constitution, appetite, heaviness, routine, food tendencies, grounding",
  ],
  homeopathy: [
    "Organon aphorisms 84-104: narrative first, precise particulars, non-leading questions, modalities, mental state, stools, urine, sleep, thirst, peculiarities",
    "Current app translation: personal story, better/worse, exact sensation, triggers, repeating emotional pattern",
  ],
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
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {sourceIntakeBasis[tone].map((basis) => (
            <p key={basis} className="border border-ink/10 bg-white/68 px-3 py-2 text-xs leading-5 text-ink/54">
              {basis}
            </p>
          ))}
        </div>
      </div>
      <div className="grid gap-4 border-t border-ink/8 bg-[#fbfaf6] p-5 md:p-6">
        {children}
      </div>
    </section>
  );
}

function ReflectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-ink/10 pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{title}</p>
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
      filled: [form.temperature, form.circulation, form.digestion, form.sleep, form.energy, form.elimination, form.tcmNotes].filter(Boolean).length,
      total: 7,
    },
    {
      name: "Ayurveda",
      filled: [form.ayurvedaNotes, form.digestion, form.cravings, form.elimination, form.energy, form.sleep].filter(Boolean).length,
      total: 6,
    },
    {
      name: "Homeopathy",
      filled: [form.homeopathyNotes, form.mood, form.stress, form.mindFocus, form.betterFrom, form.worseFrom, form.cravings].filter(Boolean).length,
      total: 7,
    },
  ];
  const signals = [
    ...selectedSymptoms,
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
          <h2 className="text-2xl font-semibold leading-tight">Your answers are building a multi-lens profile.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/62">
            Each section adds a different kind of signal: rhythm, constitution, sensitivity, and what changes symptoms.
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
        <div className="mt-4 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <span key={signal} className="border border-ink/10 bg-white/72 px-3 py-1.5 text-xs text-ink/62">
              {signal}
            </span>
          ))}
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
    .replace(/\bpractitioner\b/gi, "qualified professional")
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
    practitioner_follow_up: "Qualified Professional Follow-Up",
    remedy_differential: "Remedy Differential",
    rubric_cluster: "Repertory Rubrics",
    sleep: "Sleep",
    yoga_breath: "Yoga / Breath",
  };
  return labels[category] || category.replaceAll("_", " ");
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
          {item.review_priority.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Outcome</p>
          <p className="mt-1 text-sm leading-6 text-ink/76">{complianceText(item.direction)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Educational Possibility</p>
          <p className="mt-1 text-sm leading-6 text-ink/76">{complianceText(item.practitioner_action)}</p>
        </div>
        <ShortResultDisclaimer />
        <p className="text-xs leading-5 text-ink/48">{sourceLabel(item.citations, references)}</p>
        {item.source_basis ? <p className="text-xs leading-5 text-ink/48">{item.source_basis}</p> : null}
        {item.safety_notes.length ? <p className="text-xs leading-5 text-ink/48">{item.safety_notes[0]}</p> : null}
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
  return unique.sort((a, b) => {
    const priority = { review_first: 3, review_second: 2, exploratory: 1, hold_until_clarified: 0 };
    return (
      (priority[b.review_priority as keyof typeof priority] ?? 0) -
        (priority[a.review_priority as keyof typeof priority] ?? 0) ||
      b.confidence_score - a.confidence_score
    );
  });
}

function OutcomePanel({ trace }: { trace: BrainTrace }) {
  const output = trace.practical_output;
  const references = output.cited_source_references;
  const actionItems = output.lifestyle_diet_practice_actions;
  const reviewItems = output.herbs_formulas_remedies_to_consider;
  const summary =
    output.likely_pattern_summary.plain_language_summary ||
    output.likely_pattern_summary.case_snapshot ||
    "The intake does not yet contain enough recognized symptom detail for a useful first-pass outcome.";
  const doFirst = actionItems.slice(0, 5);
  const holdForReview = reviewItems.slice(0, 4);
  const bookDirections = output.likely_pattern_summary.tradition_directions.slice(0, 6);
  const nextQuestion = output.questions_still_needed[0] || trace.next_best_question;
  const safetyBoundary =
    output.warnings_and_professional_boundaries.find((warning) => /urgent|red|medical|severe|sudden|pregnancy|medication/i.test(warning)) ||
    output.warnings_and_professional_boundaries[0];

  return (
    <section className="rounded-xl border border-ink/12 bg-white p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Outcome</p>
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Working wellness direction</h2>
        </div>
        <span className="rounded-full border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-ink/62">
          {output.confidence.label}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-moss/20 bg-[#f8f7f1] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Working Interpretation</p>
        <p className="mt-3 text-base leading-7 text-ink/78">{complianceText(summary)}</p>
        <div className="mt-4">
          <ShortResultDisclaimer />
        </div>
      </div>

      {bookDirections.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {bookDirections.map((item) => (
            <article key={`${item.tradition}-${item.direction}`} className="rounded-lg border border-ink/10 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{item.tradition}</p>
              <p className="mt-3 text-sm leading-6 text-ink/76">{complianceText(item.direction)}</p>
              {item.citations?.length ? (
                <p className="mt-3 text-xs leading-5 text-ink/45">{sourceLabel(item.citations, references)}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Explore First</p>
          {doFirst.length ? (
            <ol className="mt-3 space-y-3 text-sm leading-6 text-ink/76">
              {doFirst.map((item, index) => (
                <li key={`${item.category}-${item.practitioner_action}`} className="grid grid-cols-[1.6rem_1fr] gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white">{index + 1}</span>
                  <span>
                    {complianceText(item.practitioner_action)}
                    <span className="mt-1 block text-xs leading-5 text-ink/45">
                      {item.tradition} · {sourceLabel(item.citations, references)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm leading-6 text-ink/60">
              Add one clear symptom, duration, severity, and what makes it better or worse to generate first steps.
            </p>
          )}
        </article>

        <div className="space-y-3">
          <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Next Question</p>
            <p className="mt-3 text-sm leading-6 text-ink/76">{complianceText(nextQuestion)}</p>
          </article>
          <article className="rounded-lg border border-amber-200/70 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Safety Boundary</p>
            <p className="mt-3 text-sm leading-6 text-ink/76">{complianceText(safetyBoundary)}</p>
          </article>
        </div>
      </div>

      <article className="mt-4 rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Hold For Qualified Review</p>
        {holdForReview.length ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/72">
            {holdForReview.map((item) => (
              <li key={`${item.category}-${item.practitioner_action}`}>
                {complianceText(item.practitioner_action)}
                <span className="mt-1 block text-xs leading-5 text-ink/45">
                  {item.tradition} · {sourceLabel(item.citations, references)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink/60">
            Herbs, formulas, remedies, and supplements remain educational possibilities only until safety context and pattern details are clearer.
          </p>
        )}
      </article>
    </section>
  );
}

function CandidateList({ title, items }: { title: string; items: Candidate[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white/75 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/60">
          {items.length} candidates
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={`${title}-${item.candidate_name}-${item.supporting_citations.join("-")}`} className="rounded-md bg-fog/70 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="max-w-[38rem] text-sm font-semibold leading-6">{item.candidate_name}</h3>
              <span className="rounded-full bg-ink px-2.5 py-1 text-xs text-white">{item.confidence_score}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/70">{item.confidence_label} · {item.priority}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-moss">Matched</p>
            <p className="mt-1 text-sm text-ink/70">{item.matched_features.join(", ") || "No strong feature match yet"}</p>
            <p className="mt-2 text-xs text-ink/55">Citation: {item.supporting_citations.join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function traditionWeights(trace: BrainTrace) {
  if (trace.synthesis_trace.tradition_weighting?.length) {
    return trace.synthesis_trace.tradition_weighting.map((direction) => ({
      ...direction,
      priority:
        trace.practitioner_summary.primary_traditional_directions.find((item) => item.tradition === direction.tradition)?.priority ??
        "exploratory",
    }));
  }
  const directions = trace.practitioner_summary.primary_traditional_directions;
  const total = directions.reduce((sum, direction) => sum + Math.max(direction.confidence_score, 0), 0);

  return directions.map((direction) => ({
    ...direction,
    percentage: total > 0 ? Math.round((Math.max(direction.confidence_score, 0) / total) * 100) : 0,
  }));
}

function CrossTraditionOutcome({ trace }: { trace: BrainTrace }) {
  const sharedThemes = trace.synthesis_trace.shared_themes;
  const agreements = trace.synthesis_trace.areas_of_agreement;
  const conflicts = trace.synthesis_trace.areas_of_conflict;
  const weights = traditionWeights(trace);

  return (
    <section className="rounded-lg border border-moss/25 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Main Outcome</p>
          <h2 className="text-2xl font-semibold leading-tight">Cross-Tradition Outcome</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/68">
            This is the front-door synthesis: where Ayurveda, TCM, and Homeopathy appear to overlap, where they need to stay distinct, and what a qualified professional can review first.
          </p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1.5 text-sm text-white">
          Synthesis {trace.synthesis_trace.confidence_score}
        </span>
      </div>

      <p className="mt-4 rounded-md bg-fog/70 p-3 text-sm leading-6 text-ink/72">{complianceText(trace.synthesis_trace.note)}</p>
      {trace.synthesis_trace.confidence_label ? (
        <p className="mt-2 text-sm text-ink/60">{trace.synthesis_trace.confidence_label}</p>
      ) : null}

      <div className="mt-4 rounded-md border border-ink/10 bg-white/75 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Tradition Weighting</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {weights.map((direction) => (
            <div key={`${direction.tradition}-weight`}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{direction.tradition}</span>
                <span className="text-ink/60">{direction.percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-fog">
                <div className="h-full rounded-full bg-moss" style={{ width: `${direction.percentage}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-ink/50">Use as {direction.priority.toLowerCase()} educational guidance</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          Prototype weighting reflects source-supported traditional relevance, not medical certainty.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Shared Themes</p>
          <p className="mt-2 text-sm leading-6 text-ink/72">
            {sharedThemes.join(", ") || "Not enough cross-tradition overlap yet."}
          </p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Agreement</p>
          <p className="mt-2 text-sm leading-6 text-ink/72">
            {agreements.join(" ") || "No strong agreement has been established in this pass."}
          </p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Conflict / Caution</p>
          <p className="mt-2 text-sm leading-6 text-ink/72">
            {conflicts.join(" ") || "No major cross-tradition conflict detected in this prototype pass."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-fog/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Tradition-Specific Anchors</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {trace.practitioner_summary.primary_traditional_directions.map((direction) => (
            <div key={`${direction.tradition}-${direction.direction}`} className="rounded-md bg-white/75 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{direction.tradition}</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">{complianceText(direction.direction)}</p>
              <p className="mt-2 text-xs text-ink/50">{direction.confidence_score} · {direction.priority}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-white/75 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Review Focus</p>
        <p className="mt-2 text-sm leading-6 text-ink/72">{complianceText(trace.next_best_question)}</p>
      </div>
    </section>
  );
}

function PracticalOutput({ trace }: { trace: BrainTrace }) {
  const output = trace.practical_output;
  const references = output.cited_source_references;
  const allActions = groupedOutcomeItems([
    ...output.herbs_formulas_remedies_to_consider,
    ...output.lifestyle_diet_practice_actions,
  ]);
  const observationNotes = [
    ...output.questions_still_needed.slice(0, 4),
    ...output.likely_pattern_summary.shared_pattern_signals.slice(0, 3),
  ];

  return (
    <section className="rounded-xl border border-moss/25 bg-white p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Organized Insight Boxes</p>
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Full source-based wellness directions</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/68">
            Each box below is an informational, tradition-based possibility from the books currently on file. Missing modern books will sharpen the details later, but these boxes should stand on the current canon.
          </p>
        </div>
        <span className="rounded-full border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-ink/62">
          {output.confidence.label}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {allActions.slice(0, 12).map((item) => (
          <OutcomeItemCard
            key={`${item.category}-${item.tradition}-${item.practitioner_action}`}
            item={item}
            references={references}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-lg border border-ink/10 bg-fog/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Observation Notes</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            {observationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-amber-200/70 bg-amber-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Review Boundaries</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            {output.warnings_and_professional_boundaries.slice(0, 8).map((warning) => (
              <li key={warning}>{complianceText(warning)}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="mt-5 text-xs leading-5 text-ink/50">
        Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.
      </p>
    </section>
  );
}

function EvaluationPacketCard({ title, packet }: { title: string; packet: TraditionEvaluationPacket }) {
  const flags = [
    ...(packet.possible_dosha_flags ?? []),
    ...(packet.agni_flags ?? []),
    ...(packet.ama_signs ?? []),
    ...(packet.possible_pattern_flags ?? []),
    ...(packet.possible_rubric_flags ?? []),
  ];
  const detailTerms = [...(packet.rubric_seed_terms ?? []), ...(packet.modalities ?? []), ...(packet.generals ?? [])].slice(0, 8);

  return (
    <article className="rounded-md bg-fog/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/72">{packet.evaluation_focus}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-moss">Autofilled Flags</p>
      <p className="mt-1 text-sm leading-6 text-ink/68">{flags.join(", ") || "Needs more pattern detail"}</p>
      {detailTerms.length ? (
        <>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-moss">Seed Terms</p>
          <p className="mt-1 text-sm leading-6 text-ink/68">{detailTerms.join(", ")}</p>
        </>
      ) : null}
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-moss">Missing</p>
      <p className="mt-1 text-sm leading-6 text-ink/68">{packet.missing_questions.slice(0, 5).join(", ") || "No major gaps detected"}</p>
    </article>
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

  const featureSummary = useMemo(() => {
    if (!trace) return [];
    const counts = new Map<string, number>();
    for (const feature of trace.normalized_features) {
      counts.set(feature.dimension, (counts.get(feature.dimension) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [trace]);

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
                <div className="mt-5">
                  <FullMedicalDisclaimer compact />
                </div>
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
            <EmergencyWarning />
            <BasisOfInsightDisclosure />
            <OutcomePanel trace={trace} />
            <PracticalOutput trace={trace} />

            <details className="rounded-lg border border-ink/10 bg-white/80 p-4">
              <summary className="cursor-pointer text-lg font-semibold">How We Arrived Here</summary>
              <div className="mt-4 space-y-4">
                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Safety + Intake State</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/68">
                    Safety gate: {trace.safety_gate.status}. {complianceText(trace.safety_gate.notes.join(" "))}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/68">
                    {trace.intake_state.minimum_complete ? "Minimum intake is complete." : "Minimum intake still needs details."} Next question: {complianceText(trace.next_best_question)}
                  </p>
                </section>

                <CrossTraditionOutcome trace={trace} />

                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Autofilled Tradition Evaluations</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    One unified intake generated these hidden packets before the separate tradition scoring ran.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <EvaluationPacketCard title="Ayurveda Packet" packet={trace.derived_evaluation_packets.ayurveda} />
                    <EvaluationPacketCard title="TCM Packet" packet={trace.derived_evaluation_packets.tcm} />
                    <EvaluationPacketCard title="Homeopathy Packet" packet={trace.derived_evaluation_packets.homeopathy} />
                  </div>
                </section>

                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Next Best Question</h2>
                  <p className="mt-2 text-ink/75">{trace.next_best_question}</p>
                </section>

                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Pattern Insight Summary</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/75">{complianceText(trace.practitioner_summary.case_snapshot)}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {trace.practitioner_summary.primary_traditional_directions.map((direction) => (
                      <div key={direction.tradition} className="rounded-md bg-fog/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{direction.tradition}</p>
                        <p className="mt-2 text-sm leading-6 text-ink/70">{complianceText(direction.direction)}</p>
                        <p className="mt-2 text-xs text-ink/50">{direction.confidence_score} · {direction.priority}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-ink/60">{complianceText(trace.practitioner_summary.confidence_summary)}</p>
                </section>

                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Feature Map</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featureSummary.map(([dimension, count]) => (
                      <span key={dimension} className="rounded-full bg-fog px-3 py-1.5 text-sm text-ink/70">
                        {dimension}: {count}
                      </span>
                    ))}
                  </div>
                </section>

                <div className="grid gap-4">
                  <CandidateList title="Ayurveda" items={trace.candidates.ayurveda} />
                  <CandidateList title="Traditional Chinese Medicine" items={trace.candidates.tcm} />
                  <CandidateList title="Homeopathy" items={trace.candidates.homeopathy} />
                </div>

                <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                  <h2 className="text-lg font-semibold">Citations</h2>
                  <div className="mt-3 space-y-2">
                    {trace.app_output.citations.slice(0, 8).map((citation) => (
                      <details key={citation.citation_id} className="rounded-md bg-fog/70 p-3 text-sm text-ink/70">
                        <summary className="cursor-pointer">
                          <span className="font-semibold text-ink">{citation.tradition}</span> · {citation.source} · {citation.locator} · pages {citation.pages}
                        </summary>
                        <div className="mt-3 space-y-1 text-xs leading-5 text-ink/60">
                          <p>ID: {citation.citation_id}</p>
                          <p>Book: {citation.book || citation.source}</p>
                          <p>Author / translator: {citation.author_or_translator || "Unknown"}</p>
                          <p>Section: {citation.section || "Unknown"} · Chapter: {citation.chapter || "Unknown"}</p>
                          <p>Edition: {citation.edition || "Unknown"}</p>
                          <p>Rights: {citation.rights_note || "Unknown"}</p>
                          {citation.url ? (
                            <a className="underline" href={citation.url} target="_blank" rel="noreferrer">
                              Open source
                            </a>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              </div>
            </details>

            <p className="rounded-lg border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">{trace.prototype_warning}</p>
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
              Move through the three lenses.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              The intake is the first experience: a guided wellness education and self-understanding flow through Chinese Medicine, Ayurveda, and Homeopathy before any pattern insight appears.
            </p>
            <div className="mt-5 max-w-2xl">
              <FullMedicalDisclaimer compact />
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
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ShortResultDisclaimer />
                  <p className="border-l-2 border-amber-300/70 pl-3 text-xs leading-5 text-ink/54">
                    If you are experiencing a medical emergency, call emergency services immediately.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <IntakeSection title="Main Concern" description="A few basics are enough for a first pass." defaultOpen>
                  <p className="border-l-2 border-moss/35 pl-3 text-xs leading-5 text-ink/54">
                    Source basis: the Organon case method begins with the person describing the history in their own words before the system asks for particulars.
                  </p>
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

                <TraditionIntakeSection
                  index="1"
                  tone="tcm"
                  title="Chinese Medicine"
                  subtitle="Chinese Medicine looks at how energy moves through the body and where imbalance begins to appear."
                >
                  <ReflectionCard title="Temperature + Rhythm">
                    <ChoicePills
                      prompt="Do you tend to feel more hot, cold, mixed, or changing?"
                      note="Book-derived logic: Huangdi Neijing material repeatedly separates cold, heat, sweating, dryness, and alternating states."
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

                  <ReflectionCard title="Flow + Body Location">
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

                  <ReflectionCard title="Digestion + Sleep + Elimination">
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
                  <ReflectionCard title="Constitution + Routine">
                    <ChoicePills
                      prompt="What happens when your schedule becomes irregular?"
                      note="Book-derived logic: Ashtanga Hridayam links dosha patterns with age, day, night, diet timing, and digestion."
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

                  <ReflectionCard title="Agni: Your Digestive Fire">
                    <ChoicePills
                      prompt="How would you describe your appetite?"
                      note="Book-derived logic: Sushruta and Ashtanga distinguish regular, variable, sharp, and dull digestive fire."
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

                  <ReflectionCard title="Grounding + Overstimulation">
                    <TextField
                      label="How overstimulation affects you"
                      value={form.mindFocus}
                      onChange={(value) => updateForm("mindFocus", value)}
                      placeholder="too much noise, screens, travel, people, pressure, or change..."
                      rows={3}
                    />
                    <TextField
                      label="What helps you feel settled"
                      value={form.goals}
                      onChange={(value) => updateForm("goals", value)}
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
                  <ReflectionCard title="Sensitivity + Response">
                    <ChoicePills
                      prompt="What happens when you feel emotionally overwhelmed?"
                      note="Book-derived logic: Organon case-taking looks for the person’s own words, mental state, and what is most individual."
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

                  <ReflectionCard title="What Changes Symptoms">
                    <p className="border-l-2 border-moss/35 pl-3 text-xs leading-5 text-ink/54">
                      Source basis: Organon 86-88 emphasizes each symptom’s timing, exact sensation, exact place, and what changes it, while avoiding yes/no leading questions.
                    </p>
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

                  <ReflectionCard title="Individual Details">
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField label="Exact sensation and place" value={form.pain} onChange={(value) => updateForm("pain", value)} placeholder="location, quality, timing, what changes it, what it reminds you of..." rows={3} />
                      <TextField label="Skin / surface patterns" value={form.skin} onChange={(value) => updateForm("skin", value)} placeholder="rash, dryness, itching, acne, sensitivity..." rows={3} />
                      <TextField label="Menstrual / reproductive patterns" value={form.reproductive} onChange={(value) => updateForm("reproductive", value)} rows={3} />
                      <TextField label="Preferences or avoidances" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="gentle first, avoid herbs, food-based, slow changes..." rows={3} />
                    </div>
                  </ReflectionCard>
                </TraditionIntakeSection>

                <IntakeSection title="Safety + Preferences" description="Keep herbs, remedies, formulas, and practices inside qualified professional review.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Cautions" value={form.cautions} onChange={(value) => updateForm("cautions", value)} placeholder="red flags, sensitivities, prior reactions..." rows={2} />
                    <TextField label="Preferences" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="gentle first, food only, avoid herbs..." rows={2} />
                    <TextField label="Medications / herbs" value={form.medications} onChange={(value) => updateForm("medications", value)} rows={2} />
                    <TextField label="Pregnancy status" value={form.pregnancyStatus} onChange={(value) => updateForm("pregnancyStatus", value)} rows={2} />
                    <TextField label="Known conditions" value={form.knownConditions} onChange={(value) => updateForm("knownConditions", value)} rows={2} />
                    <TextField label="Allergies" value={form.allergies} onChange={(value) => updateForm("allergies", value)} rows={2} />
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
                  When you finish, the system will build a wellness pattern insight from your symptoms, rhythms, constitution, sensitivities, goals, and safety context.
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
