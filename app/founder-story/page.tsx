import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Founder Story",
  description:
    "Why Tongue Test TCM was created and how Traditional Chinese Medicine helped shape the app.",
  path: "/founder-story",
});

export default function FounderStoryPage() {
  return (
    <PageShell
      eyebrow="Founder Story"
      title="Why I created Tongue Test TCM."
      intro="A personal note on Traditional Chinese Medicine, tongue observation, herbs, and making this knowledge easier to understand."
    >
      <section className="section-space pt-0">
        <div className="container-shell max-w-4xl">
          <article className="surface-card">
            <p>
              I created this app because Traditional Chinese Medicine helped me
              understand my own body in a way I had never experienced before.
              For a long time, I had a coating on my tongue and did not know
              what it meant. When I discovered TCM, I began to understand how
              the tongue could reflect digestion, diet, internal balance, and
              overall well-being. That knowledge helped me make real changes in
              my health.
            </p>
            <p className="mt-5">
              As a registered nurse who became sick with long-term COVID while
              working during the pandemic, I also experienced how powerful
              Chinese herbal medicine could be. Certain traditional herbs deeply
              supported my lungs and recovery during that time. One of the main
              goals of this app is to help people better understand Chinese
              herbs, demystify them, and make these powerful traditional tools
              easier to access in a clear and practical way.
            </p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
