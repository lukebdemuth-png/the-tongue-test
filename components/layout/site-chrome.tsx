"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const appOnlyRoutes = new Set(["/tongue-assessment", "/pattern-app"]);

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const appOnly = appOnlyRoutes.has(pathname);

  if (appOnly) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
