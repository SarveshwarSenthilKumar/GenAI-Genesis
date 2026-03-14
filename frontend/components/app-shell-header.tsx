"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShellHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isQueue = pathname === "/dashboard";
  const isInvestigation = pathname.startsWith("/incidents/");

  if (isLanding) {
    return null;
  }

  return (
    <header className="mb-4 flex flex-col gap-4 rounded-[24px] border border-line/45 bg-surface/82 px-4 py-3 shadow-frame backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-serif text-[2rem] leading-none text-ink">
          Sentinel
        </Link>
        <span className="hidden rounded-full border border-line/45 bg-canvas/70 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-muted sm:inline-flex">
          Unified analyst workspace
        </span>
      </div>
      <nav className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/dashboard"
          className={`rounded-full border px-4 py-2 transition ${
            isQueue
              ? "border-ink bg-ink text-canvas"
              : "border-line bg-canvas/70 text-ink hover:bg-paper"
          }`}
        >
          Queue
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line bg-canvas/70 px-4 py-2 text-ink transition hover:bg-paper"
        >
          Landing
        </Link>
        {isInvestigation ? (
          <span className="rounded-full border border-line bg-canvas/70 px-4 py-2 text-ink">
            Investigation
          </span>
        ) : null}
      </nav>
    </header>
  );
}
