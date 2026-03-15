"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";

import { HeroShaderBackground } from "./hero-shader-background";

const workflowSteps = [
  {
    index: "01",
    title: "Detect anomalous transactions",
    body: "Surface the activity that deserves human attention first.",
  },
  {
    index: "02",
    title: "Analyze behavioral identity",
    body: "Layer session drift and device changes onto the payment signal.",
  },
  {
    index: "03",
    title: "Expose network relationships",
    body: "Reveal suspicious money movement across a connected path.",
  },
];

const traceNodes = {
  A: { x: 74, y: 128 },
  B: { x: 184, y: 102 },
  C: { x: 328, y: 126 },
  D: { x: 188, y: 222 },
  E: { x: 330, y: 216 },
};

const tracePaths = {
  ab: "M90 126 C120 114 148 106 166 103",
  bc: "M202 102 C242 106 280 114 310 124",
  bd: "M186 120 C186 152 188 184 188 204",
  de: "M206 220 C248 216 286 214 312 214",
};

export function LandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const revealTargets = rootRef.current.querySelectorAll("[data-landing-reveal]");
    const glowTargets = rootRef.current.querySelectorAll("[data-landing-glow]");
    const ctaTarget = rootRef.current.querySelector("[data-landing-cta]");

    const pathAB = rootRef.current.querySelector<SVGPathElement>("[data-flow-path='ab']");
    const pathBC = rootRef.current.querySelector<SVGPathElement>("[data-flow-path='bc']");
    const pathBD = rootRef.current.querySelector<SVGPathElement>("[data-flow-path='bd']");
    const pathDE = rootRef.current.querySelector<SVGPathElement>("[data-flow-path='de']");
    const mainSignal = rootRef.current.querySelector<SVGCircleElement>("[data-trace-signal='main']");
    const branchSignal = rootRef.current.querySelector<SVGCircleElement>("[data-trace-signal='branch']");
    const blockedCore = rootRef.current.querySelector<SVGCircleElement>("[data-trace-core='E']");
    const blockedHalo = rootRef.current.querySelector<SVGCircleElement>("[data-trace-halo='E']");
    const endpointLabel = rootRef.current.querySelector<SVGGElement>("[data-trace-label='endpoint']");

    const revealAnimation = animate(revealTargets, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(150, { start: 120 }),
      duration: 980,
      ease: "outExpo",
    });

    const glowAnimation = animate(glowTargets, {
      opacity: [0, 1],
      scale: [0.92, 1],
      delay: stagger(180, { start: 100 }),
      duration: 1400,
      ease: "outExpo",
    });

    const ctaAnimation =
      ctaTarget
        ? animate(ctaTarget, {
            boxShadow: [
              "0 16px 36px rgba(15, 23, 42, 0.14)",
              "0 22px 46px rgba(15, 23, 42, 0.18)",
            ],
            duration: 2600,
            ease: "inOutSine",
            direction: "alternate",
            loop: true,
          })
        : null;

    const flowPaths = [pathAB, pathBC, pathBD, pathDE].filter(Boolean) as SVGPathElement[];

    const resetTraceState = () => {
      flowPaths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = "0";
      });

      if (mainSignal) {
        mainSignal.setAttribute("cx", String(traceNodes.A.x));
        mainSignal.setAttribute("cy", String(traceNodes.A.y));
        mainSignal.style.opacity = "0";
      }

      if (branchSignal) {
        branchSignal.setAttribute("cx", String(traceNodes.B.x));
        branchSignal.setAttribute("cy", String(traceNodes.B.y));
        branchSignal.style.opacity = "0";
      }

      if (blockedCore) {
        blockedCore.setAttribute("fill", "#F8FBFF");
        blockedCore.setAttribute("stroke", "#60A5FA");
      }

      if (blockedHalo) {
        blockedHalo.setAttribute("r", "22");
        blockedHalo.style.opacity = "0";
      }

      if (endpointLabel) {
        endpointLabel.style.opacity = "0";
      }
    };

    resetTraceState();

    let traceTimeline: ReturnType<typeof createTimeline> | null = null;

    if (
      pathAB &&
      pathBC &&
      pathBD &&
      pathDE &&
      mainSignal &&
      branchSignal &&
      blockedCore &&
      blockedHalo &&
      endpointLabel
    ) {
      traceTimeline = createTimeline({ autoplay: true, loop: true, loopDelay: 2200 });

      traceTimeline
        .call(() => resetTraceState(), 0)
        .add(
          pathAB,
          {
            opacity: [0, 1],
            strokeDashoffset: 0,
            duration: 420,
            ease: "outQuad",
          },
          180,
        )
        .add(
          mainSignal,
          {
            opacity: [0, 1],
            cx: [traceNodes.A.x, traceNodes.B.x],
            cy: [traceNodes.A.y, traceNodes.B.y],
            duration: 760,
            ease: "inOutSine",
          },
          180,
        )
        .add(
          pathBC,
          {
            opacity: [0, 1],
            strokeDashoffset: 0,
            duration: 420,
            ease: "outQuad",
          },
          700,
        )
        .add(
          mainSignal,
          {
            cx: [traceNodes.B.x, traceNodes.C.x],
            cy: [traceNodes.B.y, traceNodes.C.y],
            duration: 760,
            ease: "inOutSine",
          },
          820,
        )
        .add(
          mainSignal,
          {
            opacity: [1, 0],
            duration: 140,
            ease: "outQuad",
          },
          1480,
        )
        .add(
          pathBD,
          {
            opacity: [0, 1],
            strokeDashoffset: 0,
            duration: 420,
            ease: "outQuad",
          },
          1820,
        )
        .add(
          branchSignal,
          {
            opacity: [0, 1],
            cx: [traceNodes.B.x, traceNodes.D.x],
            cy: [traceNodes.B.y, traceNodes.D.y],
            duration: 760,
            ease: "inOutSine",
          },
          1880,
        )
        .add(
          pathDE,
          {
            opacity: [0, 1],
            strokeDashoffset: 0,
            duration: 420,
            ease: "outQuad",
          },
          2560,
        )
        .add(
          branchSignal,
          {
            cx: [traceNodes.D.x, traceNodes.E.x],
            cy: [traceNodes.D.y, traceNodes.E.y],
            duration: 760,
            ease: "inOutSine",
          },
          2640,
        )
        .add(
          blockedHalo,
          {
            opacity: [0, 0.3],
            r: [22, 38],
            duration: 680,
            ease: "outQuad",
          },
          3280,
        )
        .add(
          blockedCore,
          {
            fill: ["#F8FBFF", "#D97706"],
            stroke: ["#60A5FA", "#B45309"],
            duration: 380,
            ease: "outQuad",
          },
          3360,
        )
        .add(
          branchSignal,
          {
            opacity: [1, 0],
            duration: 140,
            ease: "outQuad",
          },
          3380,
        )
        .add(
          endpointLabel,
          {
            opacity: [0, 1],
            duration: 460,
            ease: "outExpo",
          },
          3640,
        )
        .add(
          blockedHalo,
          {
            opacity: [0.3, 0.08],
            r: [38, 46],
            duration: 900,
            ease: "outSine",
          },
          3760,
        )
        .add(
          flowPaths,
          {
            opacity: [1, 0],
            duration: 760,
            ease: "inOutSine",
          },
          4700,
        )
        .add(
          endpointLabel,
          {
            opacity: [1, 0],
            duration: 680,
            ease: "inOutSine",
          },
          4800,
        )
        .add(
          blockedHalo,
          {
            opacity: [0.08, 0],
            r: [46, 58],
            duration: 900,
            ease: "outSine",
          },
          4740,
        )
        .add(
          blockedCore,
          {
            fill: ["#D97706", "#F8FBFF"],
            stroke: ["#B45309", "#60A5FA"],
            duration: 760,
            ease: "inOutSine",
          },
          4860,
        );
    }

    return () => {
      revealAnimation.revert();
      glowAnimation.revert();
      ctaAnimation?.revert();
      traceTimeline?.revert();
    };
  }, []);

  return (
    <main
      ref={rootRef}
      className="dark relative left-1/2 min-h-screen w-screen -translate-x-1/2 -mt-5 overflow-hidden pb-16 text-slate-100 sm:-mt-5 lg:-mt-5"
    >
      <HeroShaderBackground className="pointer-events-none fixed inset-0 -z-20" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,8,20,0.18)_0%,rgba(2,8,20,0.36)_52%,rgba(2,8,20,0.78)_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_88%_12%,rgba(214,231,255,0.3),transparent_0%,transparent_26%),radial-gradient(circle_at_14%_82%,rgba(48,92,178,0.14),transparent_0%,transparent_26%)]" />

      <section className="relative flex min-h-screen overflow-hidden">
        <div
          data-landing-glow
          className="absolute -left-16 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_66%)] opacity-0 blur-2xl"
        />
        <div
          data-landing-glow
          className="absolute right-[-5rem] top-[-2rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.58),transparent_66%)] opacity-0 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-[1280px] flex-col px-6 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
          <div data-landing-reveal className="opacity-0">
            <div>
              <p className="font-serif font-bold text-[2rem] leading-none tracking-[-0.03em] text-white sm:text-[3.85rem]">
                Sentinel
              </p>
            </div>
          </div>

          <div className="grid flex-1 gap-10 pt-4 lg:grid-cols-[1.14fr_0.86fr] lg:items-center lg:gap-16 lg:pt-5">
            <div className="max-w-[56rem] self-center">
              <p
                data-landing-reveal
                className="text-[12px] uppercase tracking-[0.42em] text-slate-400 opacity-0"
              >
                AI-native fraud defense
              </p>
              <h1
                data-landing-reveal
                className="mt-4 max-w-[17.5ch] font-serif text-[4rem] leading-[1] tracking-[-0.018em] text-white opacity-0 sm:text-[5rem] lg:text-[6.7rem]"
              >
                Detect fraud beyond transactions.
              </h1>
              <p
                data-landing-reveal
                className="mt-7 max-w-[33rem] text-[1.08rem] leading-8 text-slate-200/88 opacity-0"
              >
                Behavioral identity and network intelligence in one analyst workflow,
                shaped for faster triage and more confident investigation.
              </p>

              <div data-landing-reveal className="mt-9 flex w-full flex-col items-start gap-3 opacity-0 sm:flex-row sm:flex-wrap">
                <Link
                  data-landing-cta
                  href="/dashboard"
                  className="inline-flex w-full max-w-[22rem] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-medium text-slate-950 shadow-[0_20px_50px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-200 sm:w-auto sm:min-w-[16rem]"
                >
                  Open the analyst console
                </Link>
                <Link
                  href="/upload"
                  className="inline-flex w-full max-w-[22rem] items-center justify-center rounded-full border border-white/14 bg-white/6 px-8 py-4 text-sm font-medium text-white transition hover:border-white/24 hover:bg-white/10 sm:w-auto sm:min-w-[16rem]"
                >
                  Upload transaction data
                </Link>
              </div>
            </div>

            <div data-landing-reveal className="opacity-0 lg:justify-self-end">
              <InvestigationTrace />
            </div>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-landing-reveal className="space-y-3 opacity-0">
              <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">
                How Sentinel works
              </p>
              <h2 className="max-w-md font-serif text-4xl leading-tight text-white sm:text-[3.35rem]">
                Fraud revealed through transaction networks.
              </h2>
            </div>

            <ol className="space-y-4">
              {workflowSteps.map((step) => (
                <li
                  key={step.index}
                  data-landing-reveal
                  className="grid gap-3 pb-4 opacity-0 sm:grid-cols-[7rem_1fr]"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                      {step.index}
                    </p>
                    <p className="mt-1 text-base font-medium text-white">
                      {step.title}
                    </p>
                  </div>
                  <p className="max-w-xl text-base leading-7 text-slate-300">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <SystemOverviewSection />
    </main>
  );
}

function InvestigationTrace() {
  return (
    <div className="relative mx-auto w-full max-w-[38rem] lg:mx-0">
      <div className="absolute left-8 top-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_70%)] blur-3xl opacity-60" />
      <div className="absolute right-0 bottom-8 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12),transparent_68%)] blur-3xl opacity-60" />

      <div className="relative overflow-hidden rounded-[34px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.16)] backdrop-blur-[8px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%,transparent_68%,rgba(255,255,255,0.02))] opacity-60" />

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300 drop-shadow-sm">
            Investigation trace
          </p>
          <p className="mt-2 text-sm text-slate-100 drop-shadow-sm">
            Suspicious money movement across a network
          </p>
        </div>

        <div className="relative mt-10">
          <svg
            viewBox="0 0 420 300"
            className="h-[22rem] w-full overflow-visible"
            aria-label="Animated investigation trace"
          >
            <defs>
              <linearGradient id="traceFlowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <linearGradient id="traceFlowAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>
            </defs>

            <g opacity="0.14">
              <path d={tracePaths.ab} fill="none" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
              <path d={tracePaths.bc} fill="none" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
              <path d={tracePaths.bd} fill="none" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
              <path d={tracePaths.de} fill="none" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
            </g>

            <path
              data-flow-path="ab"
              d={tracePaths.ab}
              fill="none"
              stroke="url(#traceFlowBlue)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(96,165,250,0.45))" }}
            />
            <path
              data-flow-path="bc"
              d={tracePaths.bc}
              fill="none"
              stroke="url(#traceFlowBlue)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(96,165,250,0.45))" }}
            />
            <path
              data-flow-path="bd"
              d={tracePaths.bd}
              fill="none"
              stroke="url(#traceFlowBlue)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(96,165,250,0.45))" }}
            />
            <path
              data-flow-path="de"
              d={tracePaths.de}
              fill="none"
              stroke="url(#traceFlowAmber)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(251,146,60,0.5))" }}
            />

            {Object.entries(traceNodes).map(([id, node]) => (
              <g key={id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={id === "E" ? 24 : 18}
                  fill="none"
                  stroke={id === "E" ? "rgba(245,158,11,0.18)" : "rgba(148,163,184,0.12)"}
                  strokeWidth="1.2"
                />
                {id === "E" ? (
                  <circle
                    data-trace-halo="E"
                    r="22"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    opacity="0"
                  />
                ) : null}
                <circle
                  data-trace-core={id}
                  r={id === "E" ? 16 : id === "B" || id === "D" ? 12 : 11}
                  fill="#F8FBFF"
                  stroke="#60A5FA"
                  strokeWidth={id === "E" ? 3 : 2.6}
                  style={{
                    filter:
                      id === "E"
                        ? "drop-shadow(0 0 16px rgba(251,146,60,0.18))"
                        : "drop-shadow(0 0 12px rgba(125,211,252,0.18))",
                  }}
                />
                {id !== "E" ? (
                  <circle r={id === "B" || id === "D" ? 3.25 : 3} fill="rgba(15,23,42,0.88)" />
                ) : null}
                {id === "E" ? <circle r="4" fill="rgba(255,248,235,0.95)" /> : null}
              </g>
            ))}

            <g
              data-trace-label="endpoint"
              transform={`translate(${traceNodes.E.x}, ${traceNodes.E.y - 50})`}
              opacity="0"
            >
              <text
                fontSize="10"
                fill="rgba(226,232,240,0.8)"
                style={{ letterSpacing: "0.18em" }}
                textAnchor="middle"
              >
                MULE CLUSTER
              </text>
              <text
                y="14"
                fontSize="12"
                fill="#F59E0B"
                style={{ letterSpacing: "0.18em" }}
                textAnchor="middle"
              >
                BLOCKED
              </text>
            </g>

            <circle
              data-trace-signal="main"
              cx={traceNodes.A.x}
              cy={traceNodes.A.y}
              r="6"
              fill="#7DD3FC"
              opacity="0"
              style={{ filter: "drop-shadow(0 0 16px rgba(125,211,252,0.95))" }}
            />
            <circle
              data-trace-signal="branch"
              cx={traceNodes.B.x}
              cy={traceNodes.B.y}
              r="6"
              fill="#FCD34D"
              opacity="0"
              style={{ filter: "drop-shadow(0 0 16px rgba(252,211,77,0.92))" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SystemOverviewSection() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
        <div data-landing-reveal className="opacity-0">
          <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">
            The Global Fraud Problem
          </p>
          <h2 className="mt-4 font-serif text-[3.5rem] leading-[1] tracking-[-0.018em] text-white sm:text-[4rem] lg:text-[5rem]">
            Financial crime affects everyone
          </h2>
          <p className="mt-7 max-w-[33rem] text-[1.08rem] leading-8 text-slate-200/88">
            Less than 1% of global financial crime is ever recovered. Sentinel helps protect the financial ecosystem with real-time detection.
          </p>
        </div>

        <div className="mt-16">
          <div data-landing-reveal className="opacity-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">Daily Transactions</p>
                <p className="mt-3 font-serif text-4xl text-white">61M</p>
                <p className="mt-2 text-sm text-slate-300">
                  transactions processed daily in Canada alone
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Based on 2024 data showing over 22.5 billion retail payment transactions annually
                </p>
              </div>
              
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">Global Impact</p>
                <p className="mt-3 font-serif text-4xl text-white">$4T</p>
                <p className="mt-2 text-sm text-slate-300">
                  laundered annually worldwide
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Approximately 2-5% of global GDP is laundered each year, with less than 1% recovered
                </p>
              </div>
              
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">Detection Gap</p>
                <p className="mt-3 font-serif text-4xl text-white">&lt;1%</p>
                <p className="mt-2 text-sm text-slate-300">
                  of financial crime is ever stopped
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Current systems miss the vast majority of sophisticated fraud patterns
                </p>
              </div>
              
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.38em] text-slate-500">Response Time</p>
                <p className="mt-3 font-serif text-4xl text-white">150ms</p>
                <p className="mt-2 text-sm text-slate-300">
                  real-time fraud analysis
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Sentinel processes transactions in sub-second time to stop fraud as it happens
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-[20px] border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-300 font-medium">
                Financial crimes affect everyone - not just institutions. Sentinel helps protect the global financial ecosystem.
              </p>
            </div>
            
            <div className="mt-8 space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-base font-medium text-slate-950 shadow-[0_20px_50px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-200"
              >
                Fight Fraud Now
              </Link>
              <Link
                href="/live"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-white/6 px-8 py-4 text-sm font-medium text-white transition hover:border-white/24 hover:bg-white/10"
              >
                See Real-Time Detection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
