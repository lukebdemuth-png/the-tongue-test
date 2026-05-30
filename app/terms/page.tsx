import Link from "next/link";

import {
  EmergencyWarning,
  FullMedicalDisclaimer,
  ShortResultDisclaimer,
} from "@/components/compliance/disclosures";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Terms and Educational Disclaimer",
  description:
    "Terms and educational disclaimer for Tongue Test TCM, including non-medical use, emergency warnings, and herb safety.",
  path: "/terms",
});

const terms = [
  {
    title: "Educational Wellness Use Only",
    body: "Tongue Test TCM provides wellness education, self-reflection, and traditional Chinese medicine-inspired pattern exploration. It does not provide medical diagnosis, treatment, prescription, emergency evaluation, or medical decision support.",
  },
  {
    title: "No Medical Device Claims",
    body: "The app does not diagnose, treat, cure, prevent, monitor, or predict any disease or medical condition. Results are based on user-submitted information, visible photo features, traditional wellness frameworks, and app logic.",
  },
  {
    title: "Herbs, Foods, And Lifestyle Notes",
    body: "Any herbs, formulas, foods, breath practices, movement, rest, or lifestyle ideas are educational possibilities from traditional wellness frameworks. They are not instructions to self-treat or replace professional care.",
  },
  {
    title: "Medication And Medical Care",
    body: "Do not stop, start, or change prescribed medication or medical care because of an app result. Speak with a qualified healthcare professional or licensed practitioner before using herbs, formulas, supplements, or major diet changes, especially if pregnant, nursing, on medication, or managing a health condition.",
  },
  {
    title: "Photo And AI Limits",
    body: "Tongue photos can be affected by light, camera color, hydration, food, coffee, brushing, angle, and image quality. AI-assisted photo review can be wrong or incomplete and should be treated as educational pattern reflection only.",
  },
];

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Terms"
      title="Educational pattern reflection, not medical advice."
      intro="These terms keep the app clear, calm, and honest about what it does and does not provide."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-6 lg:grid-cols-[0.72fr_1fr]">
          <aside className="surface-card">
            <FullMedicalDisclaimer compact />
            <div className="mt-5">
              <EmergencyWarning />
            </div>
            <p className="mt-6 text-sm leading-7 text-ink/64">
              By using the app, you agree to use the report as educational information only and to seek qualified care for medical questions or urgent symptoms.
            </p>
          </aside>

          <div className="grid gap-4">
            {terms.map((term) => (
              <article key={term.title} className="border border-ink/10 bg-white/78 p-5 shadow-card">
                <h2 className="font-serif text-3xl leading-tight text-ink">{term.title}</h2>
                <p className="mt-4 text-sm leading-7 text-ink/68">{term.body}</p>
              </article>
            ))}

            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">Privacy And Deletion</h2>
              <p className="mt-4 text-sm leading-7 text-ink/68">
                Review the{" "}
                <Link href="/privacy" className="underline decoration-moss/45 underline-offset-4">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/data-deletion" className="underline decoration-moss/45 underline-offset-4">
                  Data Deletion
                </Link>{" "}
                page for information about photos, reports, email records, and deletion requests.
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
