"use client";

import Link from "next/link";
import Image from "next/image";

import { navItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/6 bg-fog/88 backdrop-blur-2xl">
      <div className="container-shell flex items-center justify-between gap-6 py-4 md:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden border border-ink/10 bg-[#e4a207] shadow-card">
            <Image
              src={siteConfig.logo}
              alt=""
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-[1.4rem] tracking-tight text-ink md:text-[1.55rem]">
              {siteConfig.name}
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss/90">
              {siteConfig.tagline}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-ink/48">
              {siteConfig.traditionsLine}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link relative pb-1">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/#newsletter" className="button-secondary hidden sm:inline-flex">
          Join Waitlist
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
