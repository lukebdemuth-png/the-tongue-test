import Image from "next/image";

import { FullMedicalDisclaimer, ShortResultDisclaimer } from "@/components/compliance/disclosures";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { caseStudyEvidencePolicy } from "@/lib/source-canon";

export const metadata = buildMetadata({
  title: siteConfig.formalName,
  description: siteConfig.description,
  path: "/",
});

const processSteps = [
  {
    label: "Landing",
    title: "Understand the experience before entering.",
    body: "The homepage explains the three-tradition pattern system, the source canon, and what kind of result the user receives.",
  },
  {
    label: "Intake",
    title: "Move through the three lenses.",
    body: "The intake is the main experience: a self-understanding flow through Chinese Medicine, Ayurveda, and Homeopathy before interpretation begins.",
  },
  {
    label: "Results",
    title: "Receive a pattern interpretation.",
    body: "After completion, the user moves into a results page with a source-based pattern profile, reflection questions, suggested wellness directions, and safety boundaries.",
  },
];

const traditions = [
  {
    name: "Homeopathy",
    signal: "Rubrics + materia medica",
    body: "Modalities, generals, peculiar symptoms, repertory rubrics, and remedy differentials remain source-linked for educational pattern exploration.",
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

const producedOutputs = [
  {
    title: "Pattern Summary",
    body: "A structured overview of pattern signals identified across symptoms, constitutional tendencies, history, cautions, and current state.",
  },
  {
    title: "Cross-Tradition Interpretation",
    body: "See how Homeopathy, Ayurveda, and Chinese medicine each interpret the same presentation differently, then where those interpretations overlap.",
  },
  {
    title: "Suggested Wellness Directions",
    body: "The system organizes tradition-based educational possibilities that may mention herbs, remedies, formulas, dietary observations, lifestyle patterns, and supportive practices as topics to discuss with qualified professionals.",
  },
  {
    title: "Source References",
    body: "Each output remains connected to a closed-loop library of source texts and reviewed case-study evidence rather than broad generalized content.",
  },
  {
    title: "Refinement Questions",
    body: "The system continues narrowing the pattern through follow-up questions about modalities, relationships, timing, aggravations, relief, and missing safety context.",
  },
];

const futureApps = [
  {
    title: "Tongue Pattern Insight",
    tradition: "Chinese Medicine",
    body: "A focused visual reflection for tongue color, coat, shape, moisture, and traditional pattern clues.",
    status: "Coming soon",
  },
  {
    title: "Learn Your Dosha",
    tradition: "Ayurveda",
    body: "A lightweight constitution quiz that helps users notice elemental and routine tendencies.",
    status: "Coming soon",
  },
  {
    title: "Find Your Remedy Pattern",
    tradition: "Homeopathy",
    body: "A reflective quiz for sensitivities, modalities, emotional patterns, and remedy-direction clues for educational exploration.",
    status: "Coming soon",
  },
];

const sourceCanonSections = [
  {
    category: "Philosophy",
    note: "Texts that define the interpretive ground of a tradition.",
    books: [
      ["Organon of the Medical Art", "Homeopathy / Hahnemann / method"],
      ["The Science of Homeopathy", "Homeopathy / Vithoulkas / system framework"],
      ["The Soul of Remedies", "Homeopathy / Sankaran / remedy framework"],
      ["Prakriti: Your Ayurvedic Constitution", "Ayurveda / Svoboda / constitution"],
      ["The Web That Has No Weaver", "Chinese Medicine / Kaptchuk / conceptual bridge"],
    ],
  },
  {
    category: "Classical Canon",
    note: "Foundational source texts and classical medical architecture.",
    books: [
      ["Charaka Samhita", "Ayurveda / classical source text"],
      ["Sushruta Samhita", "Ayurveda / classical source text"],
      ["Vagbhata Samhita / Ashtanga Hridayam", "Ayurveda / classical pattern canon"],
      ["Huangdi Neijing / Yellow Emperor's Inner Classic", "Chinese Medicine / classical source text"],
    ],
  },
  {
    category: "Assessment Framework",
    note: "Modern tradition-based frameworks for assessment, case structure, and pattern relationships.",
    books: [
      ["Textbook of Ayurveda, Vol. 1", "Ayurveda / Vasant Lad / fundamentals"],
      ["Textbook of Ayurveda, Vol. 2", "Ayurveda / Vasant Lad / assessment"],
      ["Textbook of Ayurveda, Vol. 3", "Ayurveda / Vasant Lad / management principles"],
      ["Ayurvedic Medicine: The Principles of Traditional Practice", "Ayurveda / Sebastian Pole / practice reference"],
      ["Desktop Guide to Keynotes and Confirmatory Symptoms", "Homeopathy / Morrison / keynotes"],
      ["Desktop Companion to Physical Pathology", "Homeopathy / Morrison / pathology"],
    ],
  },
  {
    category: "Materia Medica / Repertory",
    note: "References for remedies, herbs, rubrics, and source-linked differentials.",
    books: [
      ["Boericke's New Manual of Homeopathic Materia Medica with Repertory", "Homeopathy / Boericke / materia medica"],
      ["Kent's Final General Repertory", "Homeopathy / Kent / repertory"],
      ["Lectures on Homeopathic Materia Medica", "Homeopathy / Kent / materia medica"],
      ["Homeopathic Medical Repertory, 3rd ed.", "Homeopathy / Murphy / repertory"],
      ["Chinese Herbal Medicine: Materia Medica", "Chinese Medicine / herb reference"],
      ["Chinese Herbal Medicine: Formulas and Strategies", "Chinese Medicine / formula reference"],
      ["Encyclopedia of Herbal Medicine", "General herbal / Chevallier / cross-checking"],
    ],
  },
];

const landingImages = {
  hero: {
    src: "/images/landing/hero-patterns-still-life.png",
    alt: "Editorial still life with reference books, botanical material, and an abstract three-column tablet interface.",
  },
  sourceLibrary: {
    src: "/images/landing/source-library-workflow.png",
    alt: "Archive desk with organized source folders, classical books, citation cards, and an abstract source map on a laptop.",
  },
  logo: {
    src: siteConfig.logo,
    alt: "Empirical Patterns logo mark.",
  },
};

const trustItems = [
  "Closed source library and provenance records",
  "Tradition-specific analysis before synthesis",
  "Confidence levels based on source support and missing data",
  "Warnings before herbs, formulas, remedies, diet, or practices",
  "Daily validation tests for single-word and messy symptom inputs",
  "Clear informational language, not diagnosis or prescription",
];

export default function HomePage() {
  return (
    <main className="bg-[#f6f2ea]">
      <section className="relative overflow-hidden border-b border-ink/10 bg-[#eee7dc]">
        <Image
          src={landingImages.hero.src}
          alt={landingImages.hero.alt}
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,242,234,0.86)_0%,rgba(246,242,234,0.7)_40%,rgba(246,242,234,0.34)_72%,rgba(246,242,234,0.1)_100%)]" />
        <div className="container-shell relative flex min-h-[calc(100vh-6rem)] flex-col justify-center py-20 md:min-h-[calc(100vh-7rem)] md:py-28">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="relative h-16 w-16 overflow-hidden border border-ink/10 bg-white/86 shadow-card">
                <Image
                  src={landingImages.logo.src}
                  alt={landingImages.logo.alt}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </span>
              <div>
                <p className="eyebrow mb-1">{siteConfig.formalName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/52">
                  {siteConfig.tagline}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink/46">
                  {siteConfig.traditionsLine}
                </p>
              </div>
            </div>
            <h1 className="max-w-4xl text-[3.2rem] leading-[0.96] sm:text-6xl lg:text-[6.5rem]">
              3 traditions one pattern.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72 md:text-xl">
              {siteConfig.description}
            </p>
            <div className="mt-6 max-w-2xl">
              <FullMedicalDisclaimer compact />
            </div>
            <div className="mt-8 max-w-2xl border border-ink/10 bg-white/82 p-4 shadow-card backdrop-blur md:p-5">
              <WaitlistForm compact source="hero" />
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-ink/58">
              Wellness education, self-reflection, and pattern exploration only.
            </p>
          </div>
        </div>
      </section>

      <section id="canon" className="archival-texture border-b border-ink/10 bg-[#f9f6ef] py-24 md:py-32 lg:py-36">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">Source canon</p>
              <h2 className="section-title">A closed library of source texts.</h2>
              <p className="section-copy mt-6">
                The app brain is organized around named source texts, reviewed
                case-study evidence, pattern recognition, constitutional
                tendencies, and traditional pattern relationships. Sources are grouped by
                their role in interpretation.
              </p>
              <a href="/source-canon" className="button-secondary mt-8">
                Full Canon
              </a>
            </div>
            <div className="grid gap-5">
              {sourceCanonSections.map((section) => (
                <article key={section.category} className="border border-ink/10 bg-white/72 p-5 shadow-card">
                  <div className="grid gap-4 md:grid-cols-[13rem_1fr]">
                    <div>
                      <h3 className="text-3xl leading-8">{section.category}</h3>
                      <p className="mt-3 text-sm leading-6 text-ink/58">{section.note}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.books.map(([title, metadata]) => (
                        <div key={title} className="border-t border-ink/10 pt-3">
                          <p className="font-serif text-[1.15rem] font-semibold leading-6 text-ink">
                            {title}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/44">
                            {metadata}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="section-space archival-texture bg-[#fcfaf5]">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">The experience</p>
              <h2 className="section-title">The intake is the doorway.</h2>
              <p className="section-copy mt-6">
                Patterns begins as a guided self-understanding process. The user
                moves through three traditions, watches a pattern profile begin
                to form, then completes the intake before seeing their results.
              </p>
              <div className="mt-6">
                <ShortResultDisclaimer />
              </div>
              <a href="/pattern-app" className="button-primary mt-8">
                Begin Intake
              </a>
            </div>
            <div className="grid gap-4">
              {processSteps.map((step, index) => (
                <article key={step.label} className="border border-ink/10 bg-white/76 p-5 shadow-card">
                  <div className="grid gap-4 sm:grid-cols-[4rem_1fr]">
                    <p className="font-serif text-4xl leading-none text-clay">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">{step.label}</p>
                      <h3 className="mt-3 font-sans text-xl font-semibold tracking-normal text-ink">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-ink/68">{step.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-space archival-texture">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">What it does</p>
              <h2 className="section-title">
                Turns intake into tradition-separated reasoning.
              </h2>
              <p className="section-copy mt-6">
                Patterns is being built as an interpretive source instrument:
                structured comparison, visible source trails, and clear
                boundaries around what still needs qualified professional judgment.
              </p>
            </div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {[
                {
                  label: "Source intake",
                  title: "Start with the whole person.",
                  body: "Symptoms, constitution, tendencies, cautions, goals, and preferences are held together before tradition-specific interpretation begins.",
                },
                {
                  label: "Distinct lenses",
                  title: "Keep each tradition distinct.",
                  body: "Homeopathy, Ayurveda, and Chinese medicine are read through their own pattern language first, with citations and uncertainty kept visible.",
                },
                {
                  label: "Interpretation",
                  title: "Show what is useful next.",
                  body: "The app returns a source-based pattern profile, confidence language, reflection questions, wellness direction categories, warnings, and source references.",
                },
              ].map((step) => (
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

      <section id="traditions" className="archival-texture border-y border-ink/10 bg-[#fcfaf5] py-24 md:py-32 lg:py-36">
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

      <section id="tools" className="archival-texture border-b border-ink/10 bg-[#f9f6ef] py-20 md:py-28">
        <div className="container-shell">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Focused tools</p>
              <h2 className="section-title">Three smaller apps will follow.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-ink/62">
              These stay small and clean on the homepage for now. They become
              separate experiences after the main Patterns app is dialed in.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {futureApps.map((app) => (
              <article key={app.title} className="border border-ink/10 bg-white/72 p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">{app.tradition}</p>
                  <span className="rounded-full border border-ink/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ink/46">
                    {app.status}
                  </span>
                </div>
                <h3 className="mt-5 font-sans text-xl font-semibold tracking-normal text-ink">{app.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink/66">{app.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="produces" className="section-space archival-texture bg-[#efe9df]">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">What the system produces</p>
              <h2 className="section-title">
                Symptoms become organized practical direction.
              </h2>
              <p className="section-copy mt-6">
                Multiple traditions read the same presentation independently, then
                the system organizes overlapping insights into a practical
                framework for qualified professional review.
              </p>
              <p className="mt-5 text-base leading-8 text-ink/68">
                The result is a source-connected map of likely pattern signals,
                suggested wellness directions, useful comparisons, traditional
                relationships to explore, and the next questions that would
                refine the case.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {producedOutputs.map((item, index) => (
                <article
                  key={item.title}
                  className={
                    index === 2
                      ? "border border-ink/10 bg-white/86 p-5 shadow-card sm:col-span-2"
                      : "border border-ink/10 bg-white/72 p-5 shadow-card"
                  }
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-sans text-xl font-semibold tracking-normal text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-ink/68">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-12 border-y border-ink/12 py-7">
            <p className="max-w-4xl text-2xl leading-9 text-ink md:text-3xl md:leading-10">
              This app helps organize symptoms into practical cross-tradition
              wellness directions rooted in traditional source systems, with source
              references, safety boundaries, and refinement questions kept
              visible.
            </p>
            <div className="mt-5 max-w-3xl">
              <ShortResultDisclaimer />
            </div>
          </div>
        </div>
      </section>

      <section id="preview" className="section-space archival-texture">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">Output preview</p>
            <h2 className="section-title">The useful answer starts cautiously.</h2>
            <p className="section-copy mt-6">
              The first version is designed to be honest with sparse input.
              If someone types “headace,” it normalizes the symptom, asks the
              next useful question, and keeps wellness directions exploratory until
              enough safety and pattern detail exists.
            </p>
            <div className="mt-5">
              <ShortResultDisclaimer />
            </div>
          </div>
          <div className="border border-ink/10 bg-[#20211f] p-5 text-white shadow-panel">
            <div className="border-b border-white/12 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">
                Pattern insight preview
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

      <section id="sources" className="border-y border-ink/10 bg-[#20211f] py-24 text-white md:py-32 lg:py-36">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.82fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">
              Source-backed trust
            </p>
            <h2 className="mt-5 max-w-3xl text-[2.3rem] leading-[1.04] text-white sm:text-5xl">
              Built for traceability before confidence.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
              The app is being organized around a closed-loop book canon,
              reviewed case-study evidence, source manifests, chunk-level
              citations, and validation runs so weak outputs can be identified
              and improved before public use.
            </p>
            <div className="relative mt-8 aspect-[16/10] overflow-hidden border border-white/12 bg-white/5">
              <Image
                src={landingImages.sourceLibrary.src}
                alt={landingImages.sourceLibrary.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="border-t border-white/14 pt-4">
                <p className="text-sm leading-7 text-white/76">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="container-shell mt-14">
          <div className="border-t border-white/14 pt-5">
            <p className="max-w-4xl text-sm leading-7 text-white/62">
              {caseStudyEvidencePolicy.title} supports applied reasoning,
              outcomes, limitations, safety notes, and confidence calibration.
              It sits below the source-text canon in authority and above broad
              summary content in applied value.
            </p>
          </div>
        </div>
      </section>

      <section id="newsletter" className="section-space">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Early Practitioner Access</p>
            <h2 className="section-title">
              The first 50 practitioners and advanced students get free early beta access.
            </h2>
            <p className="section-copy mt-6">
              The first 50 practitioners and advanced students who join the
              waitlist will receive free access to the early beta version of 3
              Patterns.
            </p>
            <p className="section-copy mt-4">
              Built for those interested in cross-tradition pattern recognition
              across Homeopathy, Ayurveda, and Chinese medicine.
            </p>
          </div>
          <div className="border border-ink/10 bg-white/82 p-6 shadow-panel">
            <WaitlistForm
              source="early-access"
              buttonLabel="Request Access"
              successMessage="You are on the early access list. I will send testing updates as Patterns develops."
              interestPlaceholder="What would make Patterns useful enough for you to test?"
            />
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-shell">
          <div className="border-y border-ink/12 py-10 lg:grid lg:grid-cols-[1fr_34rem] lg:items-center lg:gap-12">
            <div>
              <p className="eyebrow">{siteConfig.formalName}</p>
              <h2 className="max-w-3xl text-[2.3rem] leading-[1.04] sm:text-5xl">
                Help shape a careful tool for integrative pattern recognition.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink/68">
                The system is not trying to replace doctors, licensed clinicians, emergency care, or prescribed medication. It is being
                shaped to make reasoning, uncertainty, and source support easier
                to see.
              </p>
              <div className="mt-5">
                <FullMedicalDisclaimer compact />
              </div>
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
