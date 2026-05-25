"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

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
        ama_signs: [],
        bowel_pattern: "",
        tongue_notes: "",
        pulse_notes: "",
      },
      tcm: {
        tongue: "",
        pulse: "",
        temperature: [form.temperature, form.circulation].filter(Boolean).join("\n"),
        sweating: "",
        thirst: "",
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
        peculiar_symptoms: [],
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
    <details className="group rounded-lg border border-ink/10 bg-white/70 p-4" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink/55">{description}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/10 text-sm text-ink/55 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-4 grid gap-3">{children}</div>
    </details>
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
    <div className="rounded-xl border border-ink/10 bg-white/78 p-5 shadow-card">
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
              className={`rounded-full border px-3.5 py-2 text-sm transition ${
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

function sourceLabel(citationIds: string[], references: CitationReference[]) {
  if (!citationIds.length) return "Book source: current on-file canon, stronger citation pending.";
  const labels = citationIds.slice(0, 3).map((id) => {
    const reference = references.find((item) => item.citation_id === id);
    if (!reference) return id;
    return `${reference.source}${reference.locator ? `, ${reference.locator}` : ""}${reference.pages ? `, p. ${reference.pages}` : ""}`;
  });
  return `Book source: ${labels.join(" | ")}`;
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
    practitioner_follow_up: "Practitioner Follow-Up",
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
          <p className="mt-1 text-sm leading-6 text-ink/76">{item.direction}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">What To Do With It</p>
          <p className="mt-1 text-sm leading-6 text-ink/76">{item.practitioner_action}</p>
        </div>
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
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Working practical direction</h2>
        </div>
        <span className="rounded-full border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-ink/62">
          {output.confidence.label}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-moss/20 bg-[#f8f7f1] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Working Interpretation</p>
        <p className="mt-3 text-base leading-7 text-ink/78">{summary}</p>
      </div>

      {bookDirections.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {bookDirections.map((item) => (
            <article key={`${item.tradition}-${item.direction}`} className="rounded-lg border border-ink/10 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{item.tradition}</p>
              <p className="mt-3 text-sm leading-6 text-ink/76">{item.direction}</p>
              {item.citations?.length ? (
                <p className="mt-3 text-xs leading-5 text-ink/45">{sourceLabel(item.citations, references)}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-ink/10 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Do First</p>
          {doFirst.length ? (
            <ol className="mt-3 space-y-3 text-sm leading-6 text-ink/76">
              {doFirst.map((item, index) => (
                <li key={`${item.category}-${item.practitioner_action}`} className="grid grid-cols-[1.6rem_1fr] gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white">{index + 1}</span>
                  <span>
                    {item.practitioner_action}
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
            <p className="mt-3 text-sm leading-6 text-ink/76">{nextQuestion}</p>
          </article>
          <article className="rounded-lg border border-amber-200/70 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Safety Boundary</p>
            <p className="mt-3 text-sm leading-6 text-ink/76">{safetyBoundary}</p>
          </article>
        </div>
      </div>

      <article className="mt-4 rounded-lg border border-ink/10 bg-white/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Hold For Practitioner Review</p>
        {holdForReview.length ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/72">
            {holdForReview.map((item) => (
              <li key={`${item.category}-${item.practitioner_action}`}>
                {item.practitioner_action}
                <span className="mt-1 block text-xs leading-5 text-ink/45">
                  {item.tradition} · {sourceLabel(item.citations, references)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink/60">
            Herbs, formulas, remedies, and supplements remain held until safety context and pattern details are clearer.
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
            This is the front-door synthesis: where Ayurveda, TCM, and Homeopathy appear to overlap, where they need to stay distinct, and what a practitioner should review first.
          </p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1.5 text-sm text-white">
          Synthesis {trace.synthesis_trace.confidence_score}
        </span>
      </div>

      <p className="mt-4 rounded-md bg-fog/70 p-3 text-sm leading-6 text-ink/72">{trace.synthesis_trace.note}</p>
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
              <p className="mt-1.5 text-xs text-ink/50">Use as {direction.priority.toLowerCase()} guidance</p>
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
              <p className="mt-2 text-sm leading-6 text-ink/72">{direction.direction}</p>
              <p className="mt-2 text-xs text-ink/50">{direction.confidence_score} · {direction.priority}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-white/75 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Practitioner Review Focus</p>
        <p className="mt-2 text-sm leading-6 text-ink/72">{trace.next_best_question}</p>
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
          <p className="eyebrow mb-2">Organized Outcome Boxes</p>
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Full source-based outcomes</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/68">
            Each box below is written as a usable outcome from the books currently on file. Missing modern books will sharpen the details later, but these boxes should stand on the current canon.
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
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="mt-5 text-xs leading-5 text-ink/50">
        Educational, source-based traditional-system output for qualified practitioner review. Not a diagnosis or prescription.
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze this intake");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasAutoGenerated) return;
    setHasAutoGenerated(true);
    void analyze();
  }, [hasAutoGenerated]);

  function updateForm<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6]">
      <div className="container-shell py-10 md:py-14">
        <section className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">3 Patterns</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] md:text-6xl">
              Tell us what is happening.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              Select a few symptoms, add the case notes you already have, and generate organized practical guidance.
            </p>
          </div>
          <button className="button-primary w-full md:w-auto" onClick={analyze} disabled={loading}>
            {loading ? "Generating..." : "Generate Guidance"}
          </button>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(22rem,0.92fr)_minmax(0,1.08fr)]">
          <section className="space-y-4">
            <SymptomPicker selected={selectedSymptoms} onToggle={toggleSymptom} />

            <section className="rounded-xl border border-ink/10 bg-white/80 p-5 shadow-card">
              <p className="eyebrow mb-2">Describe Your Symptoms</p>
              <h2 className="text-2xl font-semibold leading-tight">Just tell us what is going on.</h2>
              <textarea
                className="mt-5 min-h-[13rem] w-full resize-y rounded-lg border border-ink/10 bg-fog/60 p-4 text-base leading-7 text-ink outline-none transition focus:border-moss focus:bg-white"
                value={form.practitionerNotes}
                onChange={(event) => updateForm("practitionerNotes", event.target.value)}
                placeholder="Symptoms, emotional state, history, timeline, practitioner notes, odd details, client language, shorthand..."
              />
            </section>

            <section className="rounded-xl border border-ink/10 bg-white/80 p-5 shadow-card">
              <div className="mb-4">
                <p className="eyebrow mb-2">Intake</p>
                <h2 className="text-2xl font-semibold leading-tight">Add only what matters.</h2>
              </div>
              <div className="space-y-3">
                <IntakeSection title="Main Concern" description="A few basics are enough for a first pass." defaultOpen>
                  <TextField label="Main concern" value={form.chiefComplaint} onChange={(value) => updateForm("chiefComplaint", value)} rows={2} />
                  <TextField label="Other symptoms" value={form.secondarySymptoms} onChange={(value) => updateForm("secondarySymptoms", value)} placeholder="Anything not covered by the symptom taps" rows={2} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Duration" value={form.duration} onChange={(value) => updateForm("duration", value)} placeholder="days, weeks, months" />
                    <Field label="Severity" value={form.severity} onChange={(value) => updateForm("severity", value)} placeholder="mild, moderate, severe, 0-10" />
                  </div>
                </IntakeSection>

                <IntakeSection title="Patterns Around Symptoms" description="Timing, triggers, better/worse, temperature, and pain qualities.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Better from" value={form.betterFrom} onChange={(value) => updateForm("betterFrom", value)} placeholder="rest, heat, pressure, food, motion..." rows={2} />
                    <TextField label="Worse from" value={form.worseFrom} onChange={(value) => updateForm("worseFrom", value)} placeholder="night, cold, stress, movement..." rows={2} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Temperature" value={form.temperature} onChange={(value) => updateForm("temperature", value)} placeholder="cold, hot, chills, thirst, dryness..." rows={2} />
                    <TextField label="Pain" value={form.pain} onChange={(value) => updateForm("pain", value)} placeholder="location, quality, movement, timing..." rows={2} />
                  </div>
                </IntakeSection>

                <IntakeSection title="Body Systems" description="Compact notes for digestion, elimination, sleep, skin, circulation, and reproductive context.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Digestion" value={form.digestion} onChange={(value) => updateForm("digestion", value)} rows={2} />
                    <TextField label="Elimination" value={form.elimination} onChange={(value) => updateForm("elimination", value)} placeholder="bowel, urine, frequency, consistency..." rows={2} />
                    <TextField label="Sleep" value={form.sleep} onChange={(value) => updateForm("sleep", value)} rows={2} />
                    <TextField label="Energy" value={form.energy} onChange={(value) => updateForm("energy", value)} rows={2} />
                    <TextField label="Skin" value={form.skin} onChange={(value) => updateForm("skin", value)} rows={2} />
                    <TextField label="Circulation" value={form.circulation} onChange={(value) => updateForm("circulation", value)} placeholder="cold hands, flushing, swelling..." rows={2} />
                    <TextField label="Cravings" value={form.cravings} onChange={(value) => updateForm("cravings", value)} placeholder="sweet, salty, sour, aversions..." rows={2} />
                    <TextField label="Menstrual / reproductive" value={form.reproductive} onChange={(value) => updateForm("reproductive", value)} rows={2} />
                  </div>
                </IntakeSection>

                <IntakeSection title="Mind, Stress, Goals" description="Emotional tone, focus, preferences, and what the practitioner is trying to clarify.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Emotions" value={form.mood} onChange={(value) => updateForm("mood", value)} rows={2} />
                    <TextField label="Stress" value={form.stress} onChange={(value) => updateForm("stress", value)} rows={2} />
                    <TextField label="Mind / focus" value={form.mindFocus} onChange={(value) => updateForm("mindFocus", value)} rows={2} />
                    <TextField label="Goals" value={form.goals} onChange={(value) => updateForm("goals", value)} rows={2} />
                  </div>
                </IntakeSection>

                <IntakeSection title="Safety + Preferences" description="Keep herbs, remedies, formulas, and practices inside practitioner review.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Cautions" value={form.cautions} onChange={(value) => updateForm("cautions", value)} placeholder="red flags, sensitivities, prior reactions..." rows={2} />
                    <TextField label="Preferences" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="gentle first, food only, avoid herbs..." rows={2} />
                    <TextField label="Medications / herbs" value={form.medications} onChange={(value) => updateForm("medications", value)} rows={2} />
                    <TextField label="Pregnancy status" value={form.pregnancyStatus} onChange={(value) => updateForm("pregnancyStatus", value)} rows={2} />
                    <TextField label="Known conditions" value={form.knownConditions} onChange={(value) => updateForm("knownConditions", value)} rows={2} />
                    <TextField label="Allergies" value={form.allergies} onChange={(value) => updateForm("allergies", value)} rows={2} />
                  </div>
                </IntakeSection>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="button-secondary min-h-9 px-3 py-2 text-xs"
                  onClick={() => {
                    setForm(sampleForm);
                    setSelectedSymptoms(["poor sleep", "bloating", "low energy"]);
                  }}
                >
                  Reset Sample
                </button>
                <button
                  className="button-secondary min-h-9 px-3 py-2 text-xs"
                  onClick={() => setTrace(null)}
                >
                  Clear Output
                </button>
              </div>
              {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            </section>
          </section>

          <section className="space-y-5">
          {!trace ? (
            <section className="flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-ink/15 bg-white/65 p-8 text-center shadow-card">
              <div>
                <p className="eyebrow mb-3">Output</p>
                <h2 className="text-3xl font-semibold leading-tight">
                  {loading ? "Generating the first outcome..." : "Outcome appears here."}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-ink/60">
                  {loading
                    ? "The app is reading the selected symptoms and intake notes through the current source-backed brain."
                    : "Press Generate Guidance to see a working interpretation, do-first steps, what to hold, the next question, and safety boundaries."}
                </p>
                {error ? (
                  <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>
          ) : (
            <>
              <OutcomePanel trace={trace} />
              <PracticalOutput trace={trace} />

              <details className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <summary className="cursor-pointer text-lg font-semibold">How We Arrived Here</summary>
                <div className="mt-4 space-y-4">
                  <section className="rounded-lg border border-ink/10 bg-white/70 p-4">
                    <h2 className="text-lg font-semibold">Safety + Intake State</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/68">
                      Safety gate: {trace.safety_gate.status}. {trace.safety_gate.notes.join(" ")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink/68">
                      {trace.intake_state.minimum_complete ? "Minimum intake is complete." : "Minimum intake still needs details."} Next question: {trace.next_best_question}
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
                    <h2 className="text-lg font-semibold">Practitioner Summary</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/75">{trace.practitioner_summary.case_snapshot}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {trace.practitioner_summary.primary_traditional_directions.map((direction) => (
                        <div key={direction.tradition} className="rounded-md bg-fog/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{direction.tradition}</p>
                          <p className="mt-2 text-sm leading-6 text-ink/70">{direction.direction}</p>
                          <p className="mt-2 text-xs text-ink/50">{direction.confidence_score} · {direction.priority}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-ink/60">{trace.practitioner_summary.confidence_summary}</p>
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
            </>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}
