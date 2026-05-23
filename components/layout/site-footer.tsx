import Link from "next/link";

import { navItems, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/6 bg-white/55">
      <div className="container-shell grid gap-12 py-14 md:py-16 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="max-w-xl">
          <div className="section-divider max-w-md" />
          <p className="font-serif text-[1.9rem] text-ink">{siteConfig.name}</p>
          <p className="mt-5 text-ink/68">
            A source-backed pattern recognition app across Homeopathy,
            Ayurveda, and Chinese medicine.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-moss">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-moss">
              Principles
            </p>
            <ul className="mt-4 space-y-3 text-sm text-ink/75">
              <li>Keep Ayurveda, TCM, and Homeopathy distinct</li>
              <li>Preserve citations, uncertainty, and source limits</li>
              <li>Prioritize safety before pattern ranking</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
