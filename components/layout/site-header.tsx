"use client";

import Link from "next/link";

import { navItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/6 bg-fog/88 backdrop-blur-2xl">
      <div className="container-shell flex items-center justify-between gap-6 py-4 md:py-5">
        <Link href="/" className="min-w-0">
          <span className="block font-serif text-[1.4rem] tracking-tight text-ink md:text-[1.55rem]">
            {siteConfig.name}
          </span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss/90">
            Practitioner research reasoning
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link relative pb-1">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/pattern-app" className="button-secondary hidden sm:inline-flex">
          Open App
        </Link>
      </div>

      <nav
        aria-label="Mobile"
        className="container-shell flex gap-4 overflow-x-auto pb-4 lg:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-transparent px-3 py-2 text-sm text-ink/62"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
