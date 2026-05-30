import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Data Deletion",
  description:
    "How to request deletion of stored Tongue Test TCM report, waitlist, feedback, and email records.",
  path: "/data-deletion",
});

const deletionSteps = [
  "Send a deletion request to the support email listed below.",
  "Include the email address you used for the waitlist, report delivery, feedback, or checkout.",
  "Write 'Data deletion request' in the subject line.",
  "If you only want one record type deleted, say whether it is waitlist, feedback, report email, report metadata, or checkout support data.",
];

export default function DataDeletionPage() {
  return (
    <PageShell
      eyebrow="Data Deletion"
      title="Request deletion of your Tongue Test TCM records."
      intro="If you used the app and want stored email, waitlist, feedback, or report records removed, use this page as the deletion request path."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-6 lg:grid-cols-[0.72fr_1fr]">
          <aside className="surface-card">
            <p className="eyebrow">Support Email</p>
            <p className="mt-4 break-words font-serif text-3xl text-ink">{siteConfig.email}</p>
            <p className="mt-5 text-sm leading-7 text-ink/64">
              The current session photo can be deleted inside the app before analysis. Stored backend records require a support deletion request.
            </p>
          </aside>

          <div className="grid gap-4">
            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">How To Request Deletion</h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-ink/68">
                {deletionSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>

            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">What Can Be Deleted</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-ink/68">
                <li>Waitlist and launch update email records.</li>
                <li>Feedback messages and optional feedback email addresses.</li>
                <li>Report delivery email records and report metadata stored for support or troubleshooting.</li>
                <li>Non-required app records that can reasonably be matched to the email address you provide.</li>
              </ul>
            </article>

            <article className="border border-ink/10 bg-white/78 p-5 shadow-card">
              <h2 className="font-serif text-3xl leading-tight text-ink">What May Need To Be Kept</h2>
              <p className="mt-4 text-sm leading-7 text-ink/68">
                Some payment, fraud-prevention, tax, security, or legal records may need to be retained by payment providers or service providers for required business, security, or legal reasons. If that applies, the response will explain what could not be removed and why.
              </p>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
