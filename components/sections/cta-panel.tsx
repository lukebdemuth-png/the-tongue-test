import { ButtonLink } from "@/components/ui/button-link";

type CtaPanelProps = {
  title: string;
  copy: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CtaPanel({
  title,
  copy,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaPanelProps) {
  return (
    <section className="section-space pt-0">
      <div className="container-shell">
        <div className="surface-panel overflow-hidden bg-ink text-white">
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.45fr_0.85fr] lg:items-end lg:px-12 lg:py-12">
            <div>
              <div className="h-px w-24 bg-white/12" />
              <span className="eyebrow border-white/10 bg-white/5 text-sand">
                Next Step
              </span>
              <h2 className="max-w-2xl text-[2rem] leading-[1.08] text-white sm:text-[2.5rem]">
                {title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/74 md:text-lg">
                {copy}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start">
              <ButtonLink
                href={primaryHref}
                className="bg-white text-ink hover:bg-sand hover:text-ink"
              >
                {primaryLabel}
              </ButtonLink>
              {secondaryLabel && secondaryHref ? (
                <ButtonLink
                  href={secondaryHref}
                  variant="secondary"
                  className="border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  {secondaryLabel}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
