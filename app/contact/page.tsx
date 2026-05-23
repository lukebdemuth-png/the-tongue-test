import { ContactForm } from "@/components/forms/contact-form";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch about the creator strategy dashboard, channel planning, or collaboration.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Reach out about the app, your content strategy, or a collaboration."
      intro="Use this page if you want help shaping the dashboard around your workflow, refining your content system, or discussing a partnership around yoga and spiritual media."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ContactForm />
          <aside className="surface-card">
            <h2 className="text-3xl">What to include</h2>
            <p className="mt-4">
              A short note is enough. Share your current channel focus, the kind
              of content you post, and what you most want the app to help you
              improve.
            </p>
            <div className="mt-8 rounded-[24px] bg-sand p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-moss">
                Contact
              </p>
              <p className="mt-3 text-lg text-ink">{siteConfig.email}</p>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
