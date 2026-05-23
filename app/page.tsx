import Link from "next/link";

import { WaitlistForm } from "@/components/landing/waitlist-form";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Patterns / Three Traditions",
  description:
    "A premium waitlist for a source-backed pattern recognition app across Homeopathy, Ayurveda, and Chinese medicine.",
  path: "/",
});

const steps = [
  {
    title: "Enter the whole picture",
    body: "Symptoms, constitution, current state, history, goals, cautions, medications, preferences, and the details that make a case particular.",
  },
  {
    title: "Analyze through three traditions",
    body: "Homeopathy, Ayurveda, and Chinese medicine stay separate first, each using its own pattern language and source trail.",
  },
  {
    title: "Receive practical guidance",
    body: "The output highlights likely patterns, confidence, questions, practical actions, cautions, and cited references for qualified review.",
  },
];

const traditions = [
  {
    name: "Homeopathy",
    detail: "Repertory rubrics, modalities, generals, peculiar symptoms, and materia medica differentials.",
    signal: "Rubrics + materia medica",
  },
  {
    name: "Ayurveda",
    detail: "Dosha, agni, ama, dhatu, srotas, constitution, digestion, routine, and source-backed categories.",
    signal: "Dosha / agni / ama",
  },
  {
    name: "Chinese Medicine",
    detail: "Pattern, formula, herb, point-reference, temperature, fluids, deficiency/excess, and organ-network maps.",
    signal: "Pattern / formula / points",
  },
];

const previewCards = [
  ["Pattern summary", "Vata-agni irregularity, shen/sleep involvement, and homeopathic night-worse rubric clusters appear relevant."],
  ["Practical actions", "Review meal timing, sleep rhythm, gentle grounding practice, and follow-up tracking before stronger interventions."],
  ["Considerations", "Herb, formula, remedy, and rubric directions remain practitioner-review items with contraindication checks."],
  ["Follow-up questions", "What changes with heat, cold, food, time of day, stress, motion, rest, and pressure?"],
  ["Source-backed reasoning", "Each surfaced direction carries citations, locator notes, confidence language, and source limitations."],
];

const trustSignals = [
  "Closed research library rather than open web guessing",
  "Tradition-specific reasoning before synthesis",
  "Citations and source-limit notes attached to outputs",
  "Safety boundaries before herbs, remedies, formulas, or practices",
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-ink/6 bg-[#f7f3eb]">
        <div className="absolute inset-0 gold-grid opacity-45" />
        <div className="absolute left-1/2 top-12 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-moss/10" />
        <div className="absolute left-1/2 top-24 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full border border-clay/10" />
        <div className="container-shell relative grid min-h-[calc(100vh-6.5rem)] gap-12 py-14 md:min-h-[calc(100vh-7.5rem)] md:grid-cols-[1fr_0.72fr] md:items-center md:py-20">
          <div className="max-w-4xl">
            <p className="eyebrow">Patterns / Three Traditions</p>
            <h1 className="max-w-5xl text-[3.25rem] leading-[0.94] sm:text-6xl lg:text-[6.2rem]">
              Pattern intelligence for integrative medicine.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/70 md:text-xl">
              A source-backed app for exploring symptoms through Homeopathy,
              Ayurveda, and Chinese medicine, then turning overlapping signals
              into practical, careful guidance for qualified review.
            </p>
            <div className="mt-9 max-w-2xl rounded-[2rem] border border-ink/8 bg-white/78 p-3 shadow-card backdrop-blur">
              <WaitlistForm compact source="hero" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a href="#how-it-works" className="button-secondary">
                Learn How It Works
              </a>
              <Link href="/pattern-app" className="text-sm font-medium text-ink/62 underline underline-offset-4 hover:text-moss">
                View current prototype
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-ink/54">
              Educational research support only. Not diagnosis, prescription,
              or a substitute for licensed medical care.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.25rem] border border-ink/8 bg-[#201f1d] p-5 text-white shadow-panel">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-sage">
                  Example output
                </p>
                <div className="mt-6 space-y-4">
                  {previewCards.slice(0, 3).map(([title, body]) => (
                    <div key={title} className="border-t border-white/10 pt-4">
                      <p className="font-serif text-2xl leading-7 text-white">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/66">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {traditions.map((tradition) => (
                  <div key={tradition.name} className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-sm font-medium text-white">{tradition.name}</p>
                    <p className="mt-2 text-xs leading-5 text-white/52">{tradition.signal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-space">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">What the app does</p>
            <h2 className="section-title">From intake to source-backed pattern guidance.</h2>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-[1.5rem] border border-ink/8 bg-white/74 p-6 shadow-card">
                <p className="text-sm font-medium text-moss">0{index + 1}</p>
                <h3 className="mt-8 text-3xl leading-8">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/66">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="traditions" className="border-y border-ink/6 bg-white/56 py-20 md:py-28">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">Three traditions</p>
              <h2 className="section-title">Three maps. One careful synthesis.</h2>
              <p className="section-copy mt-6">
                The app does not flatten traditions into a single universal
                answer. It keeps each map distinct, then compares where their
                pattern signals overlap or conflict.
              </p>
            </div>
            <div className="grid gap-3">
              {traditions.map((tradition) => (
                <article key={tradition.name} className="grid gap-4 rounded-[1.4rem] border border-ink/8 bg-fog/76 p-5 sm:grid-cols-[13rem_1fr]">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-moss">{tradition.signal}</p>
                    <h3 className="mt-3 text-3xl leading-8">{tradition.name}</h3>
                  </div>
                  <p className="self-center text-sm leading-7 text-ink/68">{tradition.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preview" className="section-space">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">Output preview</p>
            <h2 className="section-title">Practical, not vague. Careful, not overconfident.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {previewCards.map(([title, body]) => (
              <article key={title} className="rounded-[1.35rem] border border-ink/8 bg-white/74 p-5 shadow-card">
                <h3 className="font-sans text-base font-semibold tracking-normal text-ink">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/66">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sources" className="border-y border-ink/6 bg-[#201f1d] py-20 text-white md:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-sage">
              Source-backed trust
            </p>
            <h2 className="mt-5 max-w-3xl text-[2.25rem] leading-[1.05] text-white sm:text-5xl">
              Built around a closed library, not anonymous internet advice.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
              Patterns is designed to cite where outputs come from: classical
              texts, repertories, materia medica, source metadata, and curated
              research layers. Source limits and uncertainty remain visible.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustSignals.map((signal) => (
              <div key={signal} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm leading-7 text-white/76">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="newsletter" className="section-space">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Free education</p>
            <h2 className="section-title">Follow the build. Learn the pattern language.</h2>
            <p className="section-copy mt-6">
              Join for concise updates on integrative pattern recognition,
              herbs and remedies as source-backed research categories, and the
              process of building the Three Traditions app.
            </p>
          </div>
          <div className="rounded-[2rem] border border-ink/8 bg-white/78 p-6 shadow-panel">
            <WaitlistForm source="newsletter" />
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-shell">
          <div className="rounded-[2rem] border border-ink/8 bg-white/80 p-6 shadow-panel md:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="eyebrow">Early access</p>
              <h2 className="max-w-3xl text-[2.25rem] leading-[1.05] sm:text-5xl">
                Join the waitlist for Patterns / Three Traditions.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink/68">
                Get launch updates, educational notes, and invitations to test
                the app as the prototype becomes more useful.
              </p>
            </div>
            <div className="mt-8 min-w-[min(100%,34rem)] lg:mt-0">
              <WaitlistForm compact source="final-cta" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
