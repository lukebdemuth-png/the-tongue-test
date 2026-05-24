import Link from "next/link";
import Image from "next/image";

import { WaitlistForm } from "@/components/landing/waitlist-form";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Patterns / Three Traditions",
  description:
    "A source-backed pattern recognition app for practitioners working across Homeopathy, Ayurveda, and Chinese medicine.",
  path: "/",
});

const processSteps = [
  {
    label: "Intake",
    title: "Start with the whole case.",
    body: "Symptoms, context, constitution, cautions, medications, goals, and preferences are held together before any tradition-specific interpretation begins.",
  },
  {
    label: "Reasoning",
    title: "Keep each tradition distinct.",
    body: "Homeopathy, Ayurveda, and Chinese medicine are analyzed through their own pattern language first, with citations and uncertainty kept visible.",
  },
  {
    label: "Output",
    title: "Show what is useful next.",
    body: "The app returns likely directions, confidence, next questions, practical review categories, warnings, and source references.",
  },
];

const traditions = [
  {
    name: "Homeopathy",
    signal: "Rubrics + materia medica",
    body: "Modalities, generals, peculiar symptoms, repertory rubrics, and remedy differentials remain source-linked for practitioner review.",
  },
  {
    name: "Ayurveda",
    signal: "Dosha / agni / ama",
    body: "Dosha tendencies, agni, ama, dhatu, srotas, digestion, constitution, and routine are interpreted as traditional assessment categories.",
  },
  {
    name: "Chinese Medicine",
    signal: "Pattern / formula / points",
    body: "Hot/cold, excess/deficiency, qi, blood, fluids, organ-network language, formula categories, herbs, and points stay traceable.",
  },
];

const outputRows = [
  ["Safety status", "Caution: medication and pregnancy context missing"],
  ["Likely direction", "Exploratory pattern signals across digestion, sleep, and energy"],
  ["Confidence", "Possible match; needs more intake detail"],
  ["Next question", "What changes with heat, cold, food, time of day, stress, motion, rest, or pressure?"],
  ["Source trail", "Citations, locators, rights notes, and source limitations attached"],
];

const trustItems = [
  "Closed source library and provenance records",
  "Tradition-specific analysis before synthesis",
  "Confidence levels based on source support and missing data",
  "Warnings before herbs, formulas, remedies, diet, or practices",
  "Daily launch tests for single-word and messy symptom inputs",
  "Practitioner-facing language, not diagnosis or prescription",
];

export default function HomePage() {
  return (
    <main className="bg-[#f6f2ea]">
      <section className="relative overflow-hidden border-b border-ink/10 bg-[#eee7dc]">
        <Image
          src="/images/patterns-hero-still-life.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,242,234,0.98)_0%,rgba(246,242,234,0.9)_38%,rgba(246,242,234,0.56)_68%,rgba(246,242,234,0.22)_100%)]" />
        <div className="container-shell relative flex min-h-[calc(100vh-6rem)] flex-col justify-center py-16 md:min-h-[calc(100vh-7rem)] md:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">Patterns / Three Traditions</p>
            <h1 className="max-w-4xl text-[3.2rem] leading-[0.96] sm:text-6xl lg:text-[6.5rem]">
              Source-backed pattern intelligence for practitioners.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72 md:text-xl">
              A working app for entering symptoms and health context, analyzing
              them through Homeopathy, Ayurveda, and Chinese medicine, and
              producing careful next steps with citations and safety boundaries.
            </p>
            <div className="mt-8 max-w-2xl border border-ink/10 bg-white/82 p-4 shadow-card backdrop-blur md:p-5">
              <WaitlistForm compact source="hero" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a href="#how-it-works" className="button-primary">
                Learn how it works
              </a>
              <Link href="/pattern-app" className="button-secondary">
                View prototype
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-ink/58">
              Educational research support for qualified review. Not diagnosis,
              prescription, or a substitute for appropriate medical care.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-space">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">What it does</p>
              <h2 className="section-title">
                Turns intake into tradition-separated reasoning.
              </h2>
              <p className="section-copy mt-6">
                Patterns is being built as a practical research tool: less
                mystical guessing, more structured comparison, source trace,
                and clear boundaries around what still needs practitioner
                judgment.
              </p>
            </div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {processSteps.map((step) => (
                <article key={step.label} className="grid gap-4 py-7 sm:grid-cols-[9rem_1fr]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">
                    {step.label}
                  </p>
                  <div>
                    <h3 className="font-sans text-xl font-semibold tracking-normal text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-ink/68">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="traditions" className="border-y border-ink/10 bg-[#fcfaf5] py-20 md:py-28">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">Three traditions</p>
            <h2 className="section-title">Separate maps before synthesis.</h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {traditions.map((tradition) => (
              <article key={tradition.name} className="border-l border-ink/14 pl-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
                  {tradition.signal}
                </p>
                <h3 className="mt-4 text-3xl leading-8">{tradition.name}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/68">{tradition.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="section-space">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">Output preview</p>
            <h2 className="section-title">The useful answer starts cautiously.</h2>
            <p className="section-copy mt-6">
              The first version is designed to be honest with sparse input.
              If someone types “headace,” it normalizes the symptom, asks the
              next useful question, and keeps recommendations exploratory until
              enough safety and pattern detail exists.
            </p>
          </div>
          <div className="border border-ink/10 bg-[#20211f] p-5 text-white shadow-panel">
            <div className="border-b border-white/12 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">
                Practitioner view
              </p>
              <h3 className="mt-4 text-3xl leading-9 text-white">Single symptom: headache</h3>
            </div>
            <div className="divide-y divide-white/10">
              {outputRows.map(([label, value]) => (
                <div key={label} className="grid gap-3 py-4 sm:grid-cols-[10rem_1fr]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    {label}
                  </p>
                  <p className="text-sm leading-7 text-white/78">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sources" className="border-y border-ink/10 bg-[#20211f] py-20 text-white md:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">
              Source-backed trust
            </p>
            <h2 className="mt-5 max-w-3xl text-[2.3rem] leading-[1.04] text-white sm:text-5xl">
              Built for traceability before confidence.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
              The app is being organized around a closed library, source
              manifests, chunk-level citations, and daily test runs so weak
              outputs can be found and improved before launch.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="border-t border-white/14 pt-4">
                <p className="text-sm leading-7 text-white/76">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="newsletter" className="section-space">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Early access</p>
            <h2 className="section-title">Join the waitlist while the app is tested.</h2>
            <p className="section-copy mt-6">
              Get launch updates, short educational notes, and invitations to
              test Patterns as the source-backed reasoning gets sharper.
            </p>
          </div>
          <div className="border border-ink/10 bg-white/82 p-6 shadow-panel">
            <WaitlistForm source="newsletter" />
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-shell">
          <div className="border-y border-ink/12 py-10 lg:grid lg:grid-cols-[1fr_34rem] lg:items-center lg:gap-12">
            <div>
              <p className="eyebrow">Patterns / Three Traditions</p>
              <h2 className="max-w-3xl text-[2.3rem] leading-[1.04] sm:text-5xl">
                Help shape a careful tool for integrative pattern recognition.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink/68">
                The product is not trying to replace practitioners. It is being
                built to make reasoning, uncertainty, and source support easier
                to see.
              </p>
            </div>
            <div className="mt-8 lg:mt-0">
              <WaitlistForm compact source="final-cta" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
