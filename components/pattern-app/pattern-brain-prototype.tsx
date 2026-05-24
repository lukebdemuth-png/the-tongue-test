"use client";

import { useMemo, useState } from "react";

const sampleIntake = {
  case_id: "browser-test-sleep-digestion",
  patient_context: {
    age_range: "adult",
    sex: "",
    pregnancy_status: "",
    known_conditions: [],
    current_medications: [],
    allergies: [],
    clinical_setting: "practitioner research review",
  },
  symptoms: {
    chief_complaint: "Poor sleep with digestive discomfort",
    primary_symptoms: ["sleep disturbance", "digestive discomfort"],
    secondary_symptoms: ["low energy"],
    duration: "several weeks",
    onset: "",
    severity: "moderate",
    frequency: "",
    better_from: [],
    worse_from: ["worse at night"],
    time_patterns: ["worse at night"],
    temperature_patterns: [],
    digestion: "variable appetite and digestion with bloating",
    sleep: "difficulty staying asleep",
    energy: "low morning energy",
    mood: "",
    pain_location: "",
    pain_quality: "",
  },
  tradition_specific_inputs: {
    ayurveda: {
      prakriti: "",
      vikriti: "",
      agni: "",
      ama_signs: [],
      bowel_pattern: "",
      tongue_notes: "",
      pulse_notes: "",
    },
    tcm: {
      tongue: "",
      pulse: "",
      temperature: "",
      sweating: "",
      thirst: "",
      appetite: "",
      bowel_urine: "",
      emotional_pattern: "",
    },
    homeopathy: {
      modalities: ["worse at night"],
      mental_emotional_state: "",
      generals: ["low morning energy"],
      peculiar_symptoms: [],
      food_cravings_aversions: [],
      thermal_state: "",
    },
  },
  practitioner_notes: "Compare traditional source relevance for sleep, digestion, appetite, bloating, and low energy.",
  requested_output_depth: "standard",
};

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
      tradition_directions: Array<{
        tradition: string;
        direction: string;
        confidence_score: number;
        priority: string;
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
  safety_notes: string[];
};

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
      digestion: form.digestion,
      sleep: form.sleep,
      energy: form.energy,
      mood: form.mood,
      pain_location: "",
      pain_quality: "",
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
        temperature: form.temperature,
        sweating: "",
        thirst: "",
        appetite: form.digestion,
        bowel_urine: "",
        emotional_pattern: form.tcmNotes,
      },
      homeopathy: {
        modalities: [...splitList(form.betterFrom), ...splitList(form.worseFrom)],
        mental_emotional_state: form.mood,
        generals: splitList(form.homeopathyNotes),
        peculiar_symptoms: [],
        food_cravings_aversions: [],
        thermal_state: form.temperature,
      },
    },
    practitioner_notes: [
      form.practitionerNotes,
      form.goals ? `Goals: ${form.goals}` : "",
      form.cautions ? `Cautions: ${form.cautions}` : "",
      form.preferences ? `Preferences: ${form.preferences}` : "",
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

function TreatmentPlanSection({ title, items }: { title: string; items: TreatmentDirection[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white/75 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <article key={`${title}-${item.category}-${item.direction}-${index}`} className="rounded-md bg-fog/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{item.category.replaceAll("_", " ")}</p>
              <span className="rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/60">
                {item.confidence_score} · {item.review_priority}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/78">{item.practitioner_action}</p>
            {item.why_this_matches?.length ? (
              <div className="mt-2 rounded-md border border-ink/10 bg-white/65 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Why surfaced</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/68">
                  {item.why_this_matches.slice(0, 4).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.text_preview ? (
              <p className="mt-2 rounded-md bg-white/60 p-3 text-sm leading-6 text-ink/62">{item.text_preview}</p>
            ) : null}
            {item.kent_supporting_rubrics?.length ? (
              <div className="mt-2 rounded-md border border-ink/10 bg-white/65 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Kent Cross-Support</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/68">
                  {item.kent_supporting_rubrics.slice(0, 3).map((support) => (
                    <li key={`${support.rubric}-${support.citation}`}>
                      {support.rubric} · {support.matched_abbreviations.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.contraindications.length ? (
              <div className="mt-2 rounded-md border border-ink/10 bg-white/65 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Contraindication Review</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/68">
                  {item.contraindications.slice(0, 4).map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-ink/62">{item.client_facing_language}</p>
            <p className="mt-2 text-xs text-ink/50">
              Citation: {item.citations.join(", ") || "pending stronger source support"}
              {item.source_url ? <> · <a className="underline" href={item.source_url} target="_blank" rel="noreferrer">source</a></> : null}
            </p>
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

function RecommendationList({ title, items }: { title: string; items: PracticalRecommendation[] }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{title}</p>
      <div className="mt-3 space-y-2">
        {items.slice(0, 6).map((item, index) => (
          <article key={`${title}-${item.tradition}-${item.category}-${index}`} className="rounded-md bg-fog/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{item.tradition} · {item.category.replaceAll("_", " ")}</p>
              <span className="rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/60">
                {item.confidence_score} · {item.review_priority}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/72">{item.practitioner_action}</p>
            <p className="mt-2 text-xs text-ink/50">Citations: {item.citations.join(", ") || "pending"}</p>
          </article>
        ))}
        {!items.length ? <p className="text-sm leading-6 text-ink/62">No source-backed items surfaced yet.</p> : null}
      </div>
    </div>
  );
}

function PracticalOutput({ trace }: { trace: BrainTrace }) {
  const output = trace.practical_output;
  return (
    <section className="rounded-lg border border-moss/25 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Working Prototype Output</p>
          <h2 className="text-2xl font-semibold leading-tight">Patterns</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/68">{output.scope}</p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1.5 text-sm text-white">
          Confidence {output.confidence.score}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-fog/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Likely pattern summary</p>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          {output.likely_pattern_summary.case_snapshot || "No case snapshot yet."}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {output.likely_pattern_summary.tradition_directions.map((direction) => (
            <div key={`${direction.tradition}-${direction.direction}`} className="rounded-md bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{direction.tradition}</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">{direction.direction}</p>
              <p className="mt-2 text-xs text-ink/50">{direction.confidence_score} · {direction.priority}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/62">
          {output.confidence.label}. {output.confidence.basis}
        </p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <RecommendationList title="Herbs / formulas / remedies to consider" items={output.herbs_formulas_remedies_to_consider} />
        <RecommendationList title="Lifestyle / diet / practice actions" items={output.lifestyle_diet_practice_actions} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Questions still needed</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/70">
            {output.questions_still_needed.slice(0, 8).map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-ink/10 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Warnings and boundaries</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/70">
            {output.warnings_and_professional_boundaries.slice(0, 8).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-white/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Cited source references</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {output.cited_source_references.slice(0, 6).map((citation) => (
            <p key={citation.citation_id} className="text-xs leading-5 text-ink/62">
              <span className="font-semibold text-ink/78">{citation.tradition}</span> · {citation.source} · {citation.locator} · pages {citation.pages}
            </p>
          ))}
        </div>
      </div>
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
  const [intakeMode, setIntakeMode] = useState<"simple" | "json">("simple");
  const [form, setForm] = useState<IntakeForm>(sampleForm);
  const [intakeText, setIntakeText] = useState(JSON.stringify(sampleIntake, null, 2));
  const [trace, setTrace] = useState<BrainTrace | null>(null);
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
      const parsed = intakeMode === "simple" ? intakeFromForm(form) : JSON.parse(intakeText);
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

  function updateForm<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="container-shell py-10 md:py-14">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Patterns Prototype</p>
          <h1 className="text-3xl leading-tight md:text-5xl">Brain trace tester</h1>
          <p className="mt-3 max-w-3xl text-ink/70">
            Enter as little as a chief complaint and a few symptoms, or add modalities, safety context, and tradition-specific notes for a stronger trace.
          </p>
        </div>
        <button className="button-primary w-full md:w-auto" onClick={analyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Case"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-lg border border-ink/10 bg-white/80 p-4 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Practitioner Intake</h2>
            <div className="flex rounded-full border border-ink/10 bg-fog p-1">
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${intakeMode === "simple" ? "bg-ink text-white" : "text-ink/65"}`}
                onClick={() => setIntakeMode("simple")}
              >
                Simple
              </button>
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${intakeMode === "json" ? "bg-ink text-white" : "text-ink/65"}`}
                onClick={() => setIntakeMode("json")}
              >
                JSON
              </button>
            </div>
          </div>
          {intakeMode === "simple" ? (
            <div className="space-y-4">
              <TextField
                label="Chief complaint"
                value={form.chiefComplaint}
                onChange={(value) => updateForm("chiefComplaint", value)}
                placeholder="What is the main concern?"
              />
              <TextField
                label="Primary symptoms"
                value={form.primarySymptoms}
                onChange={(value) => updateForm("primarySymptoms", value)}
                placeholder="Comma-separated: insomnia, bloating, anxiety"
              />
              <TextField
                label="Secondary symptoms"
                value={form.secondarySymptoms}
                onChange={(value) => updateForm("secondarySymptoms", value)}
                placeholder="Energy, mood, pain, skin, digestion..."
                rows={2}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Duration" value={form.duration} onChange={(value) => updateForm("duration", value)} placeholder="days, weeks, months" />
                <Field label="Severity" value={form.severity} onChange={(value) => updateForm("severity", value)} placeholder="mild, moderate, severe, 0-10" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Better from" value={form.betterFrom} onChange={(value) => updateForm("betterFrom", value)} placeholder="heat, rest, pressure..." rows={2} />
                <TextField label="Worse from" value={form.worseFrom} onChange={(value) => updateForm("worseFrom", value)} placeholder="cold, night, motion..." rows={2} />
              </div>
              <TextField label="Digestion / appetite / stool" value={form.digestion} onChange={(value) => updateForm("digestion", value)} rows={2} />
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Sleep" value={form.sleep} onChange={(value) => updateForm("sleep", value)} rows={2} />
                <TextField label="Energy" value={form.energy} onChange={(value) => updateForm("energy", value)} rows={2} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Mood / mental-emotional" value={form.mood} onChange={(value) => updateForm("mood", value)} rows={2} />
                <TextField label="Temperature / thirst / dryness" value={form.temperature} onChange={(value) => updateForm("temperature", value)} rows={2} />
              </div>
              <TextField label="Goals" value={form.goals} onChange={(value) => updateForm("goals", value)} placeholder="What does the person want help understanding or improving?" rows={2} />
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Cautions" value={form.cautions} onChange={(value) => updateForm("cautions", value)} placeholder="Red flags, sensitivities, prior reactions, scope limits..." rows={2} />
                <TextField label="Preferences" value={form.preferences} onChange={(value) => updateForm("preferences", value)} placeholder="Gentle first, avoid herbs, diet focus, etc." rows={2} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Current medications / herbs" value={form.medications} onChange={(value) => updateForm("medications", value)} rows={2} />
                <TextField label="Pregnancy status" value={form.pregnancyStatus} onChange={(value) => updateForm("pregnancyStatus", value)} rows={2} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Known conditions" value={form.knownConditions} onChange={(value) => updateForm("knownConditions", value)} rows={2} />
                <TextField label="Allergies" value={form.allergies} onChange={(value) => updateForm("allergies", value)} rows={2} />
              </div>
              <TextField label="Ayurveda notes" value={form.ayurvedaNotes} onChange={(value) => updateForm("ayurvedaNotes", value)} placeholder="prakriti, vikriti, agni, ama, tongue, pulse..." rows={2} />
              <TextField label="TCM notes" value={form.tcmNotes} onChange={(value) => updateForm("tcmNotes", value)} placeholder="tongue, pulse, thirst, sweating, bowel/urine..." rows={2} />
              <TextField label="Homeopathy notes" value={form.homeopathyNotes} onChange={(value) => updateForm("homeopathyNotes", value)} placeholder="modalities, generals, peculiar symptoms, cravings..." rows={2} />
              <TextField label="Practitioner notes" value={form.practitionerNotes} onChange={(value) => updateForm("practitionerNotes", value)} rows={3} />
              <div className="flex flex-wrap gap-2">
                <button className="button-secondary min-h-9 px-3 py-2 text-xs" onClick={() => setForm(sampleForm)}>
                  Reset Sample
                </button>
                <button
                  className="button-secondary min-h-9 px-3 py-2 text-xs"
                  onClick={() => {
                    const next = JSON.stringify(intakeFromForm(form), null, 2);
                    setIntakeText(next);
                    setIntakeMode("json");
                  }}
                >
                  View JSON
                </button>
              </div>
            </div>
              ) : (
            <>
              <div className="mb-3 flex justify-end">
                <button className="button-secondary min-h-9 px-3 py-2 text-xs" onClick={() => setIntakeText(JSON.stringify(sampleIntake, null, 2))}>
                  Reset Sample
                </button>
              </div>
              <textarea
                className="min-h-[38rem] w-full resize-y rounded-md border border-ink/10 bg-fog/70 p-3 font-mono text-xs leading-5 text-ink outline-none focus:border-moss"
                value={intakeText}
                onChange={(event) => setIntakeText(event.target.value)}
                spellCheck={false}
              />
            </>
          )}
          {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </section>

        <section className="space-y-5">
          {!trace ? (
            <div className="rounded-lg border border-ink/10 bg-white/75 p-8 text-ink/70">
              Run the sample case to see the first transparent brain trace.
            </div>
          ) : (
            <>
              <section className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Safety Gate: {trace.safety_gate.status}</h2>
                    <p className="mt-1 text-sm text-ink/65">{trace.safety_gate.notes.join(" ")}</p>
                  </div>
                  <span className="rounded-full border border-ink/10 px-3 py-1.5 text-sm text-ink/65">
                    Case: {trace.case_id || "untitled"}
                  </span>
                </div>
              </section>

              <section className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Intake State</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/68">
                      {trace.intake_state.minimum_complete ? "Minimum intake is complete." : "Minimum intake still needs details."}{" "}
                      Stage: {trace.intake_state.stage.replaceAll("_", " ")}.
                    </p>
                  </div>
                  <span className="rounded-full border border-ink/10 px-3 py-1.5 text-sm text-ink/65">
                    {trace.intake_state.can_generate_first_pass ? "First pass ready" : "Hold first pass"}
                  </span>
                </div>
                {trace.intake_state.deepening_missing.length || trace.intake_state.minimum_missing.length ? (
                  <p className="mt-3 text-xs leading-5 text-ink/55">
                    Missing next: {[...trace.intake_state.minimum_missing, ...trace.intake_state.deepening_missing].slice(0, 7).join(", ")}
                  </p>
                ) : null}
              </section>

              <CrossTraditionOutcome trace={trace} />
              <PracticalOutput trace={trace} />

              <section className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <h2 className="text-lg font-semibold">Treatment Plan Draft</h2>
                <p className="mt-2 text-sm text-ink/65">{trace.treatment_plan_draft.scope}</p>
                <div className="mt-4 grid gap-4">
                  <TreatmentPlanSection title="Ayurveda Plan Categories" items={trace.treatment_plan_draft.ayurveda} />
                  <TreatmentPlanSection title="TCM Plan Categories" items={trace.treatment_plan_draft.tcm} />
                  <TreatmentPlanSection title="Homeopathy Plan Categories" items={trace.treatment_plan_draft.homeopathy} />
                </div>
              </section>

              <details className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <summary className="cursor-pointer text-lg font-semibold">How This Outcome Was Built</summary>
                <div className="mt-4 space-y-4">
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
                </div>
              </details>

              <section className="rounded-lg border border-ink/10 bg-white/80 p-4">
                <h2 className="text-lg font-semibold">Client Teaching Sequence</h2>
                <div className="mt-3 space-y-3">
                  {trace.client_teaching_sequence.map((item, index) => (
                    <article key={`${item.step}-${index}`} className="rounded-md bg-fog/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">{index + 1}. {item.step}</p>
                      <p className="mt-2 text-sm leading-6 text-ink/72">{item.teaching}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-ink/10 bg-white/80 p-4">
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

              <p className="rounded-lg border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">{trace.prototype_warning}</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
