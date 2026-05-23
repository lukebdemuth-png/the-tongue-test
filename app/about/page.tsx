import { CtaPanel } from "@/components/sections/cta-panel";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/sections/section-heading";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "About the Creator App",
  description:
    "Learn how this app helps yoga and spiritual creators study public competitor patterns and turn them into a clearer publishing strategy.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="A strategy app for spiritual creators who want clarity, not random content advice."
      intro="This project is built for channels centered on hatha yoga, spiritual lectures, satsang, mantra, and Sri Suktam-based group practice. The focus is simple: study public signals, find repeatable patterns, and build a channel identity that feels true to your work."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-6 lg:grid-cols-2">
          <article className="surface-card">
            <h2 className="text-3xl">Why this exists</h2>
            <p className="mt-5">
              Many creators in spiritual and yoga spaces post from intuition
              alone. Intuition matters, but it gets stronger when paired with a
              weekly system for studying titles, lengths, hooks, posting rhythm,
              and recurring themes from comparable public accounts.
            </p>
          </article>
          <article className="surface-card">
            <h2 className="text-3xl">What the app should do</h2>
            <p className="mt-5">
              Track public creator patterns across YouTube and Instagram, show
              what content formats repeat, surface practical recommendations, and
              help turn one long teaching into a full week of clips, posts, and
              future video ideas.
            </p>
          </article>
        </div>
      </section>

      <section className="section-space bg-white/45">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Core Principles"
            title="The app should stay grounded, ethical, and useful."
            copy="It should help you grow without pushing you toward noisy, generic creator tactics that do not fit your voice."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              "Use public data, not private competitor analytics",
              "Study repeatable patterns, not one-off viral exceptions",
              "Protect the spiritual tone while improving packaging",
            ].map((item) => (
              <div key={item} className="surface-card">
                <p className="text-xl font-medium text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaPanel
        title="See the research inputs and content workflow."
        copy="Browse the resources and planning pages to see what this app should track each week and how to turn that into a consistent publishing rhythm."
        primaryLabel="Explore resources"
        primaryHref="/resources"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </PageShell>
  );
}
