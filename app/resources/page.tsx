import Link from "next/link";

import { CtaPanel } from "@/components/sections/cta-panel";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Creator Resources",
  description:
    "Practical resources for planning YouTube and Instagram content in a yoga and spiritual teaching niche.",
  path: "/resources",
});

const resources = [
  {
    title: "Yoga class to content kit generator",
    description:
      "Paste a yoga class transcript and turn it into a carousel, Reel package, Stories, lead magnet structure, thumbnail ideas, and reusable JSON.",
    href: "/resources/yoga-content-kit",
    label: "Open generator",
  },
  {
    title: "Competitor tracking sheet",
    description:
      "A weekly sheet for logging creator name, platform, video length, hook, title, posting day, topic, and visible engagement.",
    href: "#",
    label: "Placeholder resource",
  },
  {
    title: "Content lane planner",
    description:
      "A simple planning framework for balancing hatha practice, spiritual talks, and Sri Suktam group practice.",
    href: "#",
    label: "Placeholder resource",
  },
  {
    title: "Clip extraction checklist",
    description:
      "A guide for turning one long lecture or class into multiple Reels, quote clips, and invitation posts.",
    href: "#",
    label: "Placeholder resource",
  },
  {
    title: "Title and hook library",
    description:
      "A reusable bank of title formats and opening lines designed for calm, spiritually grounded content.",
    href: "#",
    label: "Placeholder resource",
  },
];

export default function ResourcesPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Planning tools for a more intentional creator workflow."
      intro="These resources are aimed at helping you study public creator patterns and convert them into a clear weekly system for YouTube and Instagram."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 md:grid-cols-2">
          {resources.map((resource) => (
            <article key={resource.title} className="surface-card">
              <h3 className="text-3xl">{resource.title}</h3>
              <p className="mt-4">{resource.description}</p>
              <Link href={resource.href} className="button-secondary mt-6">
                {resource.label}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-space bg-white/45">
        <div className="container-shell">
          <div className="surface-card">
            <h2 className="text-3xl">Want future planning tools and updates?</h2>
            <p className="mt-4 max-w-2xl">
              Join the list to receive new creator planning templates, content
              frameworks, and feature updates for the dashboard.
            </p>
            <form action="#" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="resources-email" className="sr-only">
                Email address
              </label>
              <input
                id="resources-email"
                type="email"
                placeholder="Email address"
                className="min-h-12 flex-1 rounded-full border border-ink/10 bg-white px-4 text-sm outline-none placeholder:text-ink/35 focus:border-moss/45"
              />
              <button type="submit" className="button-primary">
                Join the list
              </button>
            </form>
          </div>
        </div>
      </section>

      <CtaPanel
        title="Turn the resources into a repeatable publishing plan."
        copy="Once the research and planning pieces are clear, the next step is using them to shape your weekly content rhythm and refine the app around your real workflow."
        primaryLabel="Go to dashboard"
        primaryHref="/"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </PageShell>
  );
}
