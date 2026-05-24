import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GatedResourceForm } from "@/components/landing/gated-resource-form";
import { freeContentResources, getFreeContentResource } from "@/lib/free-content";
import { siteConfig } from "@/lib/site";

type FreeContentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return freeContentResources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: FreeContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getFreeContentResource(slug);
  if (!resource) return {};

  return {
    title: `${resource.title} | ${siteConfig.name}`,
    description: resource.description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function FreeContentGatePage({ params }: FreeContentPageProps) {
  const { slug } = await params;
  const resource = getFreeContentResource(slug);
  if (!resource) notFound();

  return (
    <main className="bg-[#f6f2ea]">
      <section className="min-h-[calc(100vh-8rem)] border-b border-ink/10 py-16 md:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.95fr_0.75fr] lg:items-start">
          <div>
            <p className="eyebrow">{resource.eyebrow}</p>
            <h1 className="max-w-4xl text-[3rem] leading-[0.98] sm:text-6xl">
              {resource.title}
            </h1>
            <div className="mt-7 inline-flex border border-ink/10 bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-moss">
              {resource.format}
            </div>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/72">
              {resource.description}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
              {resource.promise}
            </p>
            <div className="mt-8 border-l border-moss/40 pl-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">
                Direct link only
              </p>
              <p className="mt-3 text-sm leading-7 text-ink/62">
                This page is not listed in the site navigation. Share this URL
                only when you want someone to access this specific free piece.
              </p>
            </div>
          </div>
          <GatedResourceForm
            slug={resource.slug}
            title={resource.title}
            assetHref={resource.assetHref}
            assetLabel={resource.assetLabel}
          />
        </div>
      </section>
    </main>
  );
}
