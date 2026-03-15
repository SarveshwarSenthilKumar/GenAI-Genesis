"use client";

import Link from "next/link";
import { SectionCard } from "@/components/section-card";

export default function CallToAction() {
  return (
    <main className="space-y-8">
      <SectionCard
        title="Sentinel Fraud Detection System"
        eyebrow="Real-time fraud analysis platform"
      >
        <div className="space-y-6">
          <p className="text-lg leading-8 text-muted">
            A comprehensive fraud detection console that combines rule engines, graph network analysis, 
            and machine learning to identify suspicious financial activities in real-time.
          </p>
          
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <h1 className="font-serif text-5xl leading-tight text-ink">
                Advanced fraud detection for modern financial systems
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted">
                Process millions of transactions with explainable AI, network pattern detection, 
                and real-time alerting. Built for fraud analysts and security teams.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/dashboard"
                  className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/documentation"
                  className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
                >
                  Technical Documentation
                </Link>
                <Link
                  href="/live"
                  className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
                >
                  Live Monitor
                </Link>
              </div>
            </div>
            
            <div className="grid gap-4 rounded-[24px] border border-line/70 bg-paper/80 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">System Statistics</p>
                <p className="mt-2 font-serif text-4xl text-ink">22.5B+</p>
                <p className="mt-2 text-sm text-muted">
                  Annual transactions processed
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MiniMetric label="Detection Rate" value="95%" tone="safe" />
                <MiniMetric label="Response Time" value="150ms" tone="review" />
                <MiniMetric label="Global Impact" value="$4T" tone="block" />
                <MiniMetric label="Daily Volume" value="61M" tone="ink" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Detection Capabilities" eyebrow="Multi-layered analysis">
        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureCard
            title="Explainable AI"
            description="Every alert includes clear reasoning and evidence from multiple detection methods."
            features={["Rule-based detection", "Anomaly scoring", "Network analysis"]}
          />
          <FeatureCard
            title="Network Pattern Detection"
            description="Identify sophisticated fraud rings through advanced graph analysis."
            features={["Relationship mapping", "Cluster detection", "Flow analysis"]}
          />
          <FeatureCard
            title="Real-Time Processing"
            description="Detect and respond to fraud as it happens with sub-second latency."
            features={["Live monitoring", "Instant alerts", "Automated actions"]}
          />
        </div>
      </SectionCard>

      <SectionCard title="System Architecture" eyebrow="Technology stack">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">Frontend</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Next.js 14+ with App Router</li>
              <li>• TypeScript for type safety</li>
              <li>• Tailwind CSS styling</li>
              <li>• Cytoscape.js for network visualization</li>
              <li>• Recharts for data visualization</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">Backend</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• FastAPI with Python</li>
              <li>• Pandas for data processing</li>
              <li>• NetworkX for graph analysis</li>
              <li>• Scikit-learn for ML models</li>
              <li>• OpenAI for explainable AI</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Key Features" eyebrow="What makes Sentinel different">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5">
            <h3 className="text-lg font-semibold text-ink mb-3">Multi-Layered Detection</h3>
            <p className="text-sm text-muted mb-4">
              Combines rule engines, graph analysis, and machine learning for comprehensive fraud detection.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Anomaly Detection</span>
                <span className="text-safe">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rule Engine</span>
                <span className="text-safe">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Analysis</span>
                <span className="text-safe">Active</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5">
            <h3 className="text-lg font-semibold text-ink mb-3">Real-Time Monitoring</h3>
            <p className="text-sm text-muted mb-4">
              Process transactions in real-time with instant alerting and automated risk scoring.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Speed</span>
                <span>150ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Alert Generation</span>
                <span>Instant</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Auto-Actions</span>
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Get Started" eyebrow="Choose your path">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5 text-center">
            <h3 className="text-lg font-semibold text-ink mb-3">View Dashboard</h3>
            <p className="text-sm text-muted mb-4">
              See the incident queue and review flagged transactions
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
            >
              Open Dashboard
            </Link>
          </div>
          
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5 text-center">
            <h3 className="text-lg font-semibold text-ink mb-3">Live Monitor</h3>
            <p className="text-sm text-muted mb-4">
              Watch real-time fraud detection in action
            </p>
            <Link
              href="/live"
              className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
            >
              Start Monitoring
            </Link>
          </div>
          
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5 text-center">
            <h3 className="text-lg font-semibold text-ink mb-3">Documentation</h3>
            <p className="text-sm text-muted mb-4">
              Deep dive into algorithms and architecture
            </p>
            <Link
              href="/documentation"
              className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "safe" | "review" | "block" | "ink";
}) {
  const toneMap = {
    safe: "text-safe",
    review: "text-review",
    block: "text-block",
    ink: "text-ink",
  };

  return (
    <div className="rounded-[20px] border border-line/70 bg-panel/90 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={`mt-3 font-serif text-3xl ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5">
      <h3 className="text-xl font-semibold text-ink mb-3">{title}</h3>
      <p className="text-sm text-muted mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted">
            <div className="w-2 h-2 bg-ink rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
