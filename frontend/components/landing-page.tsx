"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

export function LandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const revealTargets = rootRef.current.querySelectorAll("[data-landing-reveal]");
    const glowTargets = rootRef.current.querySelectorAll("[data-landing-glow]");

    const revealAnimation = animate(revealTargets, {
      opacity: [0, 1],
      translateY: [28, 0],
      delay: stagger(110, { start: 120 }),
      duration: 880,
      ease: "outExpo",
    });

    const glowAnimation = animate(glowTargets, {
      scale: [0.92, 1],
      opacity: [0, 1],
      delay: stagger(180),
      duration: 1400,
      ease: "outExpo",
    });

    return () => {
      revealAnimation.revert();
      glowAnimation.revert();
    };
  }, []);

  return (
    <main ref={rootRef} className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[36px] border border-line/45 bg-surface/88 px-6 py-8 shadow-frame backdrop-blur sm:px-8 sm:py-10 lg:px-10">
        <div
          data-landing-glow
          className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_65%)] opacity-0"
        />
        <div
          data-landing-glow
          className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.14),transparent_62%)] opacity-0"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-4xl">
            <p
              data-landing-reveal
              className="opacity-0 text-xs uppercase tracking-[0.3em] text-muted"
            >
              Triage faster, investigate deeper
            </p>
            <h1
              data-landing-reveal
              className="mt-4 opacity-0 font-serif text-[3.25rem] leading-[0.95] text-ink sm:text-[4.25rem] lg:text-[5.2rem]"
            >
              Fraud intelligence that thinks before your analysts have to.
            </h1>
            <p
              data-landing-reveal
              className="mt-5 max-w-2xl opacity-0 text-lg leading-8 text-muted"
            >
              Sentinel turns a constant stream of suspicious payments into a calm,
              prioritized queue with Gemini-assisted reasoning, behavioral context,
              and network exposure in one investigation workflow.
            </p>
            <div
              data-landing-reveal
              className="mt-8 flex flex-wrap items-center gap-4 opacity-0"
            >
              <Link
                href="/dashboard"
                className="rounded-full bg-ink px-6 py-3.5 text-base text-canvas transition hover:opacity-90"
              >
                Open analyst dashboard
              </Link>
              <span className="rounded-full border border-line/45 bg-canvas/72 px-4 py-2.5 text-sm text-muted">
                Queue-first review with AI assist
              </span>
            </div>
          </div>

          <div data-landing-reveal className="opacity-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <LandingMetric
                label="Signals fused"
                value="3"
                detail="Transaction, behavior, and network risk combine before review."
              />
              <LandingMetric
                label="Analyst mode"
                value="Live"
                detail="A dedicated triage workspace replaces the usual slide deck demo."
              />
              <LandingMetric
                label="AI assist"
                value="Gemini"
                detail="Grounded explanations and recommended next actions for each incident."
              />
              <LandingMetric
                label="Queue style"
                value="Calm"
                detail="A compact stream keeps investigators focused on what matters first."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <PitchCard
          eyebrow="How it works"
          title="Stream"
          body="Sentinel watches repeatable incoming transactions and keeps the riskiest incidents ready for review."
        />
        <PitchCard
          eyebrow="How it works"
          title="Reason"
          body="Gemini turns raw fraud evidence into analyst-ready context, risk framing, and suggested actions."
        />
        <PitchCard
          eyebrow="How it works"
          title="Decide"
          body="Investigators move from queue triage into detailed behavior and network views without leaving the product."
        />
      </section>

      <section className="grid gap-6 rounded-[32px] border border-line/45 bg-surface/82 px-6 py-7 shadow-frame backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-muted">Why it matters</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-ink">
            The pitch belongs here. The work belongs in the dashboard.
          </h2>
        </div>
        <div className="grid gap-4 text-sm leading-7 text-muted sm:grid-cols-2">
          <p>
            Traditional demos try to explain the product and operate it on the same screen.
            Sentinel splits those jobs cleanly so the story feels polished and the tool feels real.
          </p>
          <p>
            Once an analyst enters the dashboard, the queue becomes the primary surface:
            compact, reviewable, and free of landing-page clutter.
          </p>
        </div>
      </section>
    </main>
  );
}

function LandingMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-line/45 bg-canvas/74 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-3 font-serif text-4xl text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function PitchCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[28px] border border-line/45 bg-surface/78 p-5 shadow-frame backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
      <h3 className="mt-3 font-serif text-3xl text-ink">{title}</h3>
      <p className="mt-3 text-base leading-7 text-muted">{body}</p>
    </article>
  );
}
