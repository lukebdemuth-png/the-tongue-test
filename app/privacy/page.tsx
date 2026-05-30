import Link from "next/link";

import { FullMedicalDisclaimer, ShortResultDisclaimer } from "@/components/compliance/disclosures";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Privacy details for Tongue Test TCM, including tongue photos, AI-assisted review, email reports, and data deletion.",
  path: "/privacy",
});

const sections = [
  {
    title: "Information You Provide",
    items: [
      "Tongue photos you choose to upload or take inside the app.",
      "Intake answers, notes, feedback, and optional email addresses.",
      "Report details such as visible tongue observations, pattern scores, and organ-system summaries.",
    ],
  },
  {
    title: "How Photos Are Used",
    items: [
      "Photos are prepared in the browser and sent for AI-assisted visual review only when you choose to analyze them.",
      "The app uses the photo to describe visible tongue features for an educational TCM-style wellness report.",
      "Raw tongue photos are not added to generated PDF reports and should not be sent to analytics tools.",
    ],
  },
  {
    title: "Service Providers",
    items: [
      "OpenAI may process submitted photos and prompts to generate the educational tongue observation.",
      "Supabase may store waitlist, feedback, report metadata, and launch records.",
      "Resend may send requested report emails.",
      "Stripe may process web checkout payments for the web version of the app.",
    ],
  },
  {
    title: "Your Choices",
    items: [
      "You can delete the current tongue photo from the session before analysis.",
      "You can avoid email delivery and download the report instead where available.",
      "You can request deletion of stored email, feedback, and report records through the data deletion page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Your tongue photo and report data should be handled carefully."
      intro="Tongue Test TCM is designed as an educational wellness tool. This page explains what the app collects, why it is used, and how to request deletion."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-6 lg:grid-cols-[0.72fr_1fr]">
          <aside className="surface-card">
            <p className="eyebrow">Health Data Notice</p>
            <p className="mt-4 text-sm leading-7 text-ink/68">
              Tongue photos, intake answers, and wellness notes can be personal and sensitive. Use the app only if you are comfortable sending this information for educational review.
            </p>
            <div className="mt-6">
              <FullMedicalDisclaimer compact />
            </div>
          </aside>

          <div className="grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="border border-ink/10 bg-white/78 p-5 shadow-card">
                <h2 className="font-serif text-3xl leading-tight text-ink">{section.title}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-ink/68">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}

            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">Data Deletion</h2>
              <p className="mt-4 text-sm leading-7 text-ink/68">
                To request deletion of stored report, waitlist, feedback, or email records, use the{" "}
                <Link href="/data-deletion" className="underline decoration-moss/45 underline-offset-4">
                  data deletion page
                </Link>
                . Include the email address used in the app so the record can be located.
              </p>
            </article>

            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">Contact</h2>
              <p className="mt-4 text-sm leading-7 text-ink/68">
                Privacy questions can be sent to {siteConfig.email}. This policy may be updated as the app moves from web launch to app store release.
              </p>
              <div className="mt-4 border-t border-ink/10 pt-4">
                <ShortResultDisclaimer />
              </div>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
