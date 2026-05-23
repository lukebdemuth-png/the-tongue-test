import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, intro, children }: PageShellProps) {
  return (
    <main>
      <section className="section-space pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="container-shell">
          <div className="surface-panel overflow-hidden bg-soft-radial">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <div className="section-divider max-w-sm" />
              {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
              <h1 className="max-w-5xl text-[2.4rem] leading-[1.04] sm:text-6xl lg:text-[4.5rem]">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70 md:text-xl">
                {intro}
              </p>
            </div>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
