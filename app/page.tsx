import Image from "next/image";
import Link from "next/link";

import { ShortResultDisclaimer } from "@/components/compliance/disclosures";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: siteConfig.formalName,
  description: siteConfig.description,
  path: "/",
});

const reportSections = [
  "Photo quality note",
  "Visible tongue observations",
  "TCM-style educational pattern language",
  "Clarifying questions",
  "Food and lifestyle reflections",
  "Follow-up comparison instructions",
];

const visibleFeatures = [
  "Tongue body color",
  "Coating color",
  "Coating thickness",
  "Moisture",
  "Shape",
  "Cracks or center line",
  "Scalloped edges",
  "Tip, center, sides, and root",
];

const pricing = [
  {
    name: "One Scan Report",
    price: "$4.99",
    note: "One full tongue photo report plus one follow-up comparison.",
    primary: true,
  },
  {
    name: "Tracking Plan",
    price: "$15/mo",
    note: "Up to 15 scans per month, history, comparisons, and deeper explanations.",
    primary: false,
  },
];

const sampleReports = [
  {
    title: "Sample PDF 01",
    pattern: "Heat / Irritation Pattern",
    focus: "Digestive center, sleep heat, stress response",
    bars: [
      ["Heat / Irritation", 92],
      ["Constraint / Tension", 61],
      ["Dryness / Fluids", 48],
    ],
    sections: ["Primary Pattern Insight", "Organ / System Focus", "Food Direction"],
  },
  {
    title: "Sample PDF 02",
    pattern: "Damp / Sluggish Digestion",
    focus: "Coating, meals, bloating, post-meal energy",
    bars: [
      ["Damp / Sluggish", 88],
      ["Cold / Low Transformation", 58],
      ["Constraint / Tension", 42],
    ],
    sections: ["Visible Signs", "What To Try First", "Follow-Up Questions"],
  },
  {
    title: "Sample PDF 03",
    pattern: "Dryness / Fluid Depletion",
    focus: "Moisture, thirst, stool dryness, recovery rhythm",
    bars: [
      ["Dryness / Fluids", 84],
      ["Heat / Irritation", 64],
      ["Digestive Center", 51],
    ],
    sections: ["Plain-English Meaning", "Lifestyle Direction", "Tracking Notes"],
  },
];

const screenshotConcepts = [
  "AI Tongue Photo Test",
  "Coating, Color, Shape",
  "TCM-Style Pattern Review",
  "Track Tongue Changes",
  "Clear Educational Results",
  "No TCM Knowledge Needed",
];

export default function HomePage() {
  return (
    <main className="bg-[#f6f2ea]">
      <section className="archival-texture border-b border-ink/10 bg-[#fbfaf6] py-16 md:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.92fr_0.78fr] lg:items-center">
          <div>
            <p className="eyebrow">Tongue Test TCM</p>
            <h1 className="max-w-4xl text-[3.1rem] leading-[0.98] sm:text-6xl lg:text-[5.8rem]">
              Take a clear tongue photo. Get a report you can keep.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72 md:text-xl">
              Take a clear tongue photo, review visible tongue features with TCM-style
              educational notes, and track changes over time.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/tongue-assessment" className="button-primary">
                Start Tongue Test TCM
              </Link>
              <Link href="/free-content/tongue-photo-guide" className="button-secondary">
                Free Photo Guide
              </Link>
            </div>
            <div className="mt-6 max-w-2xl">
              <ShortResultDisclaimer />
            </div>
          </div>

          <div className="border border-ink/10 bg-white p-5 shadow-panel">
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-center">
              <div className="overflow-hidden border border-ink/10 bg-[#f7f4ed]">
                <Image
                  src="/images/tongue-assessment/tongue-map-logo.png"
                  alt="Tongue Test TCM puzzle tongue logo"
                  width={1024}
                  height={1536}
                  priority
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">
                  What the report reviews
                </p>
                <div className="mt-4 grid gap-2">
                  {reportSections.map((section) => (
                    <div key={section} className="border border-ink/10 bg-fog/60 p-3 text-sm text-ink/66">
                      {section}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-ink/58">
              Photos are sent for AI-assisted visual review only when you choose to analyze them.
              Raw photos should stay out of analytics, and launch storage should be opt-in.
            </p>
          </div>
        </div>
      </section>

      <section id="report" className="section-space archival-texture bg-[#fcfaf5]">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">The paid report</p>
            <h2 className="section-title">What people are buying is the result PDF.</h2>
            <p className="section-copy mt-6">
              The tongue photo starts the process. The finished product is a clean, high-end report
              that organizes the visible signs into plain-English pattern insight, a signal graph,
              organ-system focus, food direction, lifestyle direction, and follow-up questions.
            </p>
            <Link href="/tongue-assessment" className="button-primary mt-8">
              Preview The Flow
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sampleReports.map((report) => (
              <article key={report.title} className="border border-ink/10 bg-white p-3 shadow-card">
                <div className="min-h-[25rem] border border-ink/10 bg-[#fffdf8] p-4 shadow-[0_12px_40px_rgba(33,31,26,0.08)]">
                  <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-4">
                    <div>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-moss">
                        {report.title}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl leading-[1.02] text-ink">{report.pattern}</h3>
                    </div>
                    <div className="h-9 w-9 border border-ink/10 bg-[#efe8dc]" />
                  </div>
                  <p className="mt-4 text-xs leading-5 text-ink/58">{report.focus}</p>
                  <div className="mt-5 border border-ink/10 bg-[#f8f7f1] p-3">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-moss">
                      Pattern Graph
                    </p>
                    <div className="mt-3 space-y-3">
                      {report.bars.map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between gap-3 text-[0.68rem] leading-4 text-ink/58">
                            <span>{label}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="mt-1 h-2 border border-ink/10 bg-[#eee8dc]">
                            <div className="h-full bg-moss" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {report.sections.map((section) => (
                      <div key={section} className="border border-ink/10 bg-fog/60 p-2 text-[0.68rem] text-ink/60">
                        {section}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-ink/10 pt-3 text-[0.62rem] leading-4 text-ink/42">
                    Informational only. Not medical advice.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="archival-texture border-y border-ink/10 bg-[#efe9df] py-20 md:py-28">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">Visible tongue features</p>
            <h2 className="section-title">Specific before it gets interpretive.</h2>
            <p className="section-copy mt-6">
              The app should first describe what can be seen: coating, color, moisture,
              shape, cracks, scallops, and photo reliability. TCM language comes after that.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleFeatures.map((feature) => (
              <div key={feature} className="border border-ink/10 bg-white/70 p-4 text-sm leading-6 text-ink/68">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section-space archival-texture">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.75fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 className="section-title">$4.99 first. Tracking second.</h2>
            <p className="section-copy mt-6">
              The launch offer stays simple: one report for curiosity users, then a monthly
              tracking plan for people who want to compare changes over time.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pricing.map((tier) => (
              <article
                key={tier.name}
                className={`border p-6 shadow-card ${tier.primary ? "border-moss/30 bg-white" : "border-ink/10 bg-white/70"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">{tier.name}</p>
                <p className="mt-5 font-serif text-5xl leading-none text-ink">{tier.price}</p>
                <p className="mt-5 text-sm leading-7 text-ink/64">{tier.note}</p>
                <Link href="/tongue-assessment" className={tier.primary ? "button-primary mt-6 w-full" : "button-secondary mt-6 w-full"}>
                  {tier.primary ? "Get One Report" : "Track Changes"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tracking" className="archival-texture border-y border-ink/10 bg-[#20211f] py-20 text-white md:py-28">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">Tracking</p>
            <h2 className="mt-5 max-w-3xl text-[2.4rem] leading-[1.04] text-white sm:text-5xl">
              The follow-up comparison is the reason to come back.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
              One scan can be interesting. Comparing this week to next week is more useful:
              photo quality, visible changes, context notes, and what to watch next.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {screenshotConcepts.map((concept, index) => (
              <div key={concept} className="border border-white/12 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/82">{concept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="section-space archival-texture bg-[#fcfaf5]">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="eyebrow">Privacy and safety</p>
            <h2 className="section-title">Educational tongue observation, not medical decision support.</h2>
          </div>
          <div className="grid gap-4">
            {[
              "Photo review starts with quality: light, focus, angle, crop, and color reliability.",
              "Photos are sent for AI review only when the user chooses to analyze.",
              "Raw photos, notes, names, emails, and reports should not be sent into analytics.",
              "Language stays educational: observation, visible features, pattern language, tracking, and clarifying questions.",
              "Results should not claim disease detection, cure, prescription, or medical advice.",
            ].map((item) => (
              <div key={item} className="border-l border-moss/35 bg-white/70 p-4 text-sm leading-7 text-ink/68">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="updates" className="border-t border-ink/10 bg-[#f6f2ea] py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Launch updates</p>
            <h2 className="section-title">Get the first report samples.</h2>
            <p className="section-copy mt-6">
              Join the list for sample reports, launch pricing, and the first live testing window.
            </p>
          </div>
          <div className="border border-ink/10 bg-white/80 p-5 shadow-card">
            <WaitlistForm
              source="tongue-test-landing"
              buttonLabel="Join Updates"
              successMessage="You are on the Tongue Test TCM launch list."
              interestPlaceholder="What would you want a tongue photo report to explain?"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
