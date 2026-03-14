"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";

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
    <main ref={rootRef} className="pb-8">
      <section className="relative overflow-hidden rounded-[40px] border border-white/80 bg-[#E8EDF3] shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
        <div
          data-landing-glow
          className="absolute -left-16 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_66%)] opacity-0 blur-2xl"
        />
        <div
          data-landing-glow
          className="absolute right-[-5rem] top-[-2rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.8),transparent_66%)] opacity-0 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1160px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div data-landing-reveal className="opacity-0">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-slate-500">
                AI-native fraud defense
              </p>
              <p className="mt-3 font-serif text-[2.85rem] leading-none text-[#0B1324]">
                Sentinel
              </p>
            </div>
          </div>

          <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
            <div className="max-w-[34rem]">
              <p
                data-landing-reveal
                className="text-xs uppercase tracking-[0.36em] text-slate-500 opacity-0"
              >
                Triage faster, investigate deeper
              </p>
              <h1
                data-landing-reveal
                className="mt-5 font-serif text-[3.5rem] leading-[0.92] text-[#0B1324] opacity-0 sm:text-[4.5rem] lg:text-[5.4rem]"
              >
                Sentinel detects fraud beyond transactions.
              </h1>
              <p
                data-landing-reveal
                className="mt-6 max-w-xl text-lg leading-8 text-[#334155] opacity-0"
              >
                Behavioral identity and network intelligence in one analyst workflow.
              </p>

              <div data-landing-reveal className="mt-7 flex flex-col items-start opacity-0">
                <Link
                  data-landing-cta
                  href="/dashboard"
                  className="inline-flex min-w-[18rem] items-center justify-center rounded-full bg-[#0B1324] px-10 py-5 text-lg font-medium text-[#F8FAFC] shadow-[0_16px_36px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#111C33] hover:shadow-[0_22px_46px_rgba(15,23,42,0.18)]"
                >
                  Open the analyst console
                </Link>
              </div>
            </div>

            <div data-landing-reveal className="opacity-0 lg:justify-self-end">
              <InvestigationTrace />
            </div>
          </div>

          <div className="grid gap-8 pt-24 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-landing-reveal className="space-y-3 opacity-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                How Sentinel works
              </p>
              <h2 className="max-w-md font-serif text-4xl leading-tight text-[#0F172A] sm:text-[3.35rem]">
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
                    <p className="mt-1 text-base font-medium text-[#0F172A]">
                      {step.title}
                    </p>
                  </div>
                  <p className="max-w-xl text-base leading-7 text-[#334155]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}

function InvestigationTrace() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0">
      <div className="absolute left-8 top-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_70%)] blur-3xl" />
      <div className="absolute right-0 bottom-8 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12),transparent_68%)] blur-3xl" />

      <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.22),transparent_24%),radial-gradient(circle_at_82%_78%,rgba(245,158,11,0.16),transparent_22%),linear-gradient(180deg,#0B1324_0%,#111C33_100%)] p-6 shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%,transparent_65%,rgba(255,255,255,0.03))]" />

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-300">
            Investigation trace
          </p>
          <p className="mt-2 text-sm text-slate-100">
            Suspicious money movement across a network
          </p>
        </div>

        <div className="relative mt-5">
          <svg
            viewBox="0 0 420 300"
            className="h-[20.75rem] w-full overflow-visible"
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

            <g opacity="0.2">
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
                  stroke={id === "E" ? "rgba(245,158,11,0.22)" : "rgba(148,163,184,0.18)"}
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
                  stroke={id === "E" ? "#60A5FA" : "#60A5FA"}
                  strokeWidth={id === "E" ? 3 : 2.6}
                  style={{
                    filter:
                      id === "E"
                        ? "drop-shadow(0 0 12px rgba(251,146,60,0.16))"
                        : "drop-shadow(0 0 10px rgba(125,211,252,0.12))",
                  }}
                />
                {id !== "E" ? (
                  <circle
                    r={id === "B" || id === "D" ? 3.25 : 3}
                    fill="rgba(15,23,42,0.88)"
                  />
                ) : null}
                {id === "E" ? <circle r="4" fill="rgba(255,248,235,0.95)" /> : null}
              </g>
            ))}

            <g
              data-trace-label="endpoint"
              transform={`translate(${traceNodes.E.x + 34}, ${traceNodes.E.y - 6})`}
              opacity="0"
            >
              <text
                fontSize="10"
                fill="rgba(226,232,240,0.86)"
                style={{ letterSpacing: "0.18em" }}
              >
                MULE CLUSTER
              </text>
              <text
                y="18"
                fontSize="12"
                fill="#F59E0B"
                style={{ letterSpacing: "0.18em" }}
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
              style={{ filter: "drop-shadow(0 0 12px rgba(125,211,252,0.9))" }}
            />
            <circle
              data-trace-signal="branch"
              cx={traceNodes.B.x}
              cy={traceNodes.B.y}
              r="6"
              fill="#FCD34D"
              opacity="0"
              style={{ filter: "drop-shadow(0 0 12px rgba(252,211,77,0.9))" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
