"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function AppShellHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isQueue = pathname === "/dashboard";
  const isLive = pathname === "/live";
  const isDocumentation = pathname === "/documentation";

  if (isLanding) {
    return null;
  }

  return (
    <header className="mb-6 border-b border-line/35 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-serif text-[2rem] leading-none text-ink">
          Sentinel
        </Link>
        <span className="hidden rounded-full border border-line/45 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-muted sm:inline-flex">
          Unified analyst workspace
        </span>
      </div>
      <nav className="flex flex-wrap items-center gap-3 text-sm">
        {!isQueue && (
          <Link
            href="/dashboard"
            className="rounded-full border border-line/60 px-4 py-2 text-ink transition hover:bg-paper/50"
          >
            Dashboard
          </Link>
        )}
        {!isLive && (
          <Link
            href="/live"
            className="rounded-full border border-line/60 px-4 py-2 text-ink transition hover:bg-paper/50"
          >
            Live Monitor
          </Link>
        )}
        {!isDocumentation && (
          <Link
            href="/documentation"
            className="rounded-full border border-line/60 px-4 py-2 text-ink transition hover:bg-paper/50"
          >
            Documentation
          </Link>
        )}
        <ThemeToggle />
      </nav>
      </div>
    </header>
  );
}
