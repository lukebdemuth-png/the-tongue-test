import Link from "next/link";

import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { caseStudyEvidencePolicy, sourceCanonGroups, sourceCanonPolicy } from "@/lib/source-canon";

export const metadata = buildMetadata({
  title: `Closed Source Canon | ${siteConfig.formalName}`,
  description:
    "The public closed-loop book and case-study evidence list used to build the Patterns source-backed reasoning system.",
  path: "/source-canon",
});

export default function SourceCanonPage() {
  const totalBooks = sourceCanonGroups.reduce((count, group) => count + group.books.length, 0);

  return (
    <main className="bg-[#f6f2ea]">
      <section className="border-b border-ink/10 bg-[#eee7dc] py-16 md:py-24">
        <div className="container-shell">
          <p className="eyebrow">Closed-loop source canon</p>
          <h1 className="mt-5 max-w-5xl text-[3.1rem] leading-[0.96] sm:text-6xl lg:text-[5.7rem]">
            The sources allowed to shape the brain of Patterns.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink/72 md:text-xl">
            {sourceCanonPolicy}
          </p>
          <div className="mt-8 grid gap-4 border-y border-ink/10 py-6 sm:grid-cols-3">
            <div>
              <p className="text-4xl leading-none">{sourceCanonGroups.length}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
                source groups
              </p>
            </div>
            <div>
              <p className="text-4xl leading-none">{totalBooks}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
                listed core books
              </p>
            </div>
            <div>
              <p className="text-4xl leading-none">1</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
                case-study evidence layer
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-ink/62">
            Some modern books may be handled as metadata-only or private/local sources unless rights are
            clear. Public app outputs remain educational, citation-based, and for qualified practitioner
            review.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell space-y-12">
          <section className="border border-ink/10 bg-white/72 p-6 shadow-panel md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr]">
              <div>
                <p className="eyebrow">{caseStudyEvidencePolicy.title}</p>
                <p className="mt-4 text-sm leading-7 text-ink/66">
                  {caseStudyEvidencePolicy.description}
                </p>
              </div>
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {caseStudyEvidencePolicy.allowedUse.map((item) => (
                    <div key={item} className="border-t border-ink/12 pt-4">
                      <p className="text-sm leading-7 text-ink/70">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 border-t border-ink/12 pt-5 text-sm leading-7 text-ink/62">
                  {caseStudyEvidencePolicy.authorityRule}
                </p>
              </div>
            </div>
          </section>

          {sourceCanonGroups.map((group) => (
            <section key={group.tradition} className="border-t border-ink/12 pt-8">
              <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr]">
                <div>
                  <p className="eyebrow">{group.tradition}</p>
                  <p className="mt-4 text-sm leading-7 text-ink/66">{group.description}</p>
                </div>
                <div className="grid gap-4">
                  {group.books.map((book, index) => (
                    <article
                      key={`${group.tradition}-${book.title}`}
                      className="grid gap-4 border border-ink/10 bg-white/70 p-5 shadow-card sm:grid-cols-[3rem_1fr]"
                    >
                      <p className="font-serif text-3xl leading-none text-clay">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <div>
                        <h2 className="font-sans text-xl font-semibold tracking-normal text-ink">
                          {book.title}
                        </h2>
                        {book.author ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/48">
                            {book.author}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm leading-7 text-ink/68">{book.note}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-shell border-y border-ink/12 py-10">
          <p className="eyebrow">{siteConfig.formalName}</p>
          <h2 className="mt-4 max-w-4xl text-[2.2rem] leading-[1.05] sm:text-5xl">
            If a source is not on this page, it is not part of the core app brain.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-ink/68">
            New sources can be added later, but only as an intentional canon decision with rights,
            provenance, and source-role notes recorded first.
          </p>
          <Link href="/#newsletter" className="button-primary mt-8 inline-flex">
            Join the waitlist
          </Link>
        </div>
      </section>
    </main>
  );
}
