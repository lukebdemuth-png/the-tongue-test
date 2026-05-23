import Link from "next/link";

import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pattern App",
  description:
    "A practitioner-facing holistic medicine research system for tradition-separated reasoning, citation traceability, and safety-first review.",
  path: "/",
});

const traditions = [
  {
    name: "Ayurveda",
    focus: "Dosha, agni, ama, constitution, and classical pattern language.",
    signal: "Vata/Pitta/Kapha context",
  },
  {
    name: "Traditional Chinese Medicine",
    focus: "Pattern differentials, tongue and pulse notes, temperature, fluids, and organ-system relationships.",
    signal: "Qi, Blood, Yin/Yang, fluids",
  },
  {
    name: "Homeopathy",
    focus: "Rubrics, modalities, generals, peculiar symptoms, and remedy-direction differentials.",
    signal: "Modalities and rubrics",
  },
];

const capabilities = [
  {
    title: "Tradition-separated reasoning",
    body: "Each view keeps its own vocabulary, evidence, uncertainty, and practitioner questions before any cross-tradition synthesis appears.",
  },
  {
    title: "Citation traceability",
    body: "Source support is designed to carry titles, locators, access notes, and confidence language so practitioners can review the evidence trail.",
  },
  {
    title: "Safety-first review",
    body: "Red flags, contraindications, medications, pregnancy context, and missing safety information stay ahead of pattern matching.",
  },
  {
    title: "Workflow-ready output",
    body: "The app frames findings as educational research notes, with confidence levels, contradictions, and the next best question for intake.",
  },
];

const workflow = [
  "Enter symptoms, signs, constitution/context, modalities, medications, and practitioner notes.",
  "Review separate Ayurveda, TCM, and Homeopathy interpretations with source-backed confidence.",
  "Compare agreement, conflict, missing information, and safety cautions before considering next steps.",
];

const evidenceRows = [
  ["Safety gate", "Red flags and cautions", "Review first"],
  ["Pattern match", "Matched features and contradictions", "Ranked by support"],
  ["Source trail", "Classical texts, studies, rubrics", "Citation-linked"],
  ["Next question", "Missing details that may change ranking", "Intake-guided"],
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-ink/6 bg-fog">
        <div className="container-shell grid min-h-[calc(100vh-6.5rem)] gap-12 py-12 md:min-h-[calc(100vh-7.5rem)] md:grid-cols-[1fr_0.9fr] md:items-center md:py-16 lg:gap-16">
          <div className="max-w-4xl">
            <span className="eyebrow">Holistic medicine research system</span>
            <h1 className="max-w-5xl text-[3.2rem] leading-[0.98] sm:text-6xl lg:text-[5.7rem]">
              Pattern reasoning for qualified practitioner review.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72 md:text-xl">
              Pattern App helps practitioners compare Ayurveda, Traditional
              Chinese Medicine, and Homeopathy perspectives without collapsing
              them into a single claim. It is citation-based, educational, and
              built to preserve uncertainty.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/pattern-app" className="button-primary">
                Open Pattern App
              </Link>
              <a href="#reasoning" className="button-secondary">
                View reasoning model
              </a>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-ink/58">
              For practitioner research support only. Not a diagnostic,
              prescribing, or patient-specific treatment engine.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-soft-radial opacity-80" />
            <div className="relative overflow-hidden rounded-lg border border-ink/8 bg-white/82 shadow-panel">
              <div className="border-b border-ink/8 px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-moss">
                  Practitioner case trace
                </p>
              </div>
              <div className="grid divide-y divide-ink/8">
                {evidenceRows.map(([stage, evidence, status]) => (
                  <div
                    key={stage}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[0.55fr_1fr_0.55fr] sm:items-center"
                  >
                    <p className="text-sm font-semibold text-ink">{stage}</p>
                    <p className="text-sm leading-6 text-ink/66">{evidence}</p>
                    <p className="justify-self-start rounded-full border border-moss/18 bg-sage/10 px-3 py-1 text-xs font-medium text-moss sm:justify-self-end">
                      {status}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid border-t border-ink/8 md:grid-cols-3">
                {traditions.map((tradition) => (
                  <div
                    key={tradition.name}
                    className="border-t border-ink/8 px-5 py-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0"
                  >
                    <p className="font-serif text-2xl leading-7 text-ink">
                      {tradition.name}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink/66">
                      {tradition.signal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="reasoning" className="section-space">
        <div className="container-shell">
          <div className="max-w-3xl">
            <span className="eyebrow">Reasoning architecture</span>
            <h2 className="section-title">
              Separate the traditions first. Synthesize only after evidence is visible.
            </h2>
            <p className="section-copy mt-6">
              Pattern App is organized around traditional-system relevance, not
              medical certainty. The goal is to help a practitioner see what
              each source-supported framework suggests, where the record is
              thin, and what might need review before moving forward.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {traditions.map((tradition) => (
              <article
                key={tradition.name}
                className="rounded-lg border border-ink/8 bg-white/72 p-6 shadow-card"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-moss">
                  {tradition.signal}
                </p>
                <h3 className="mt-5 text-3xl leading-8">{tradition.name}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/68">
                  {tradition.focus}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/6 bg-white/54 py-16 md:py-20">
        <div className="container-shell">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((capability) => (
              <article
                key={capability.title}
                className="rounded-lg border border-ink/8 bg-fog/78 p-6"
              >
                <h3 className="font-sans text-base font-semibold tracking-normal text-ink">
                  {capability.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink/68">
                  {capability.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="section-space">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <span className="eyebrow">Practitioner workflow</span>
            <h2 className="section-title">From intake notes to reviewable research trace.</h2>
            <p className="section-copy mt-6">
              The interface is built for clinical-style thinking while staying
              inside educational, citation-based boundaries: gather context,
              compare traditional interpretations, then identify cautions,
              contradictions, and the next useful question.
            </p>
          </div>

          <div className="space-y-3">
            {workflow.map((item, index) => (
              <div
                key={item}
                className="grid gap-4 rounded-lg border border-ink/8 bg-white/76 p-5 shadow-card sm:grid-cols-[3rem_1fr]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss/18 bg-sage/10 text-sm font-semibold text-moss">
                  {index + 1}
                </div>
                <p className="self-center text-base leading-7 text-ink/72">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-shell">
          <div className="rounded-lg border border-ink/8 bg-ink px-6 py-10 text-white shadow-panel sm:px-8 md:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sage">
                Prototype available
              </p>
              <h2 className="mt-4 max-w-3xl text-[2.2rem] leading-[1.05] text-white sm:text-5xl">
                Try the current Pattern App reasoning surface.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                Use the prototype to test structured practitioner intake,
                inspect tradition-specific outputs, and review the citation and
                safety trace behind a first-pass interpretation.
              </p>
            </div>
            <Link href="/pattern-app" className="button-primary mt-8 border-white bg-white text-ink hover:border-sage hover:bg-sage lg:mt-0">
              Launch prototype
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
