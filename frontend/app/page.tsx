import Link from "next/link";

import { RiskDistributionChart } from "@/components/risk-distribution-chart";
import { SectionCard } from "@/components/section-card";
import { getDashboardSummary, getLiveMonitorBootstrap } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decisionStyles = {
  approve: "bg-safe/10 text-safe",
  review: "bg-review/10 text-review",
  block: "bg-block/10 text-block",
};

export default async function DashboardPage() {
  const [summary, liveMonitor] = await Promise.all([
    getDashboardSummary(),
    getLiveMonitorBootstrap(),
  ]);

  return (
    <main className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <SectionCard title="Fraud cases that rules miss" eyebrow="Live console">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <h1 className="font-serif text-5xl leading-tight text-ink">
                Behavioral identity plus network intelligence.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                Traditional fraud detection analyzes transactions in isolation.
                Sentinel catches the same transfer from three angles: the money
                movement, the session behavior, and the recipient network.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/cases/tx_blocked_001"
                  className="rounded-full bg-ink px-5 py-3 text-paper transition hover:opacity-90"
                >
                  Open blocked case
                </Link>
                <Link
                  href="/live"
                  className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
                >
                  Open live monitor
                </Link>
                <Link
                  href="/cases/tx_blocked_001/graph"
                  className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
                >
                  Inspect graph path
                </Link>
              </div>
            </div>
            <div className="grid gap-4 rounded-[24px] border border-line/70 bg-paper/80 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Ledger sample
                </p>
                <p className="mt-2 font-serif text-4xl text-ink">
                  {summary.analyzed_transactions.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted">
                  transactions sampled from the CSV for real-time scoring and graph context
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Blocked amount
                </p>
                <p className="mt-2 font-serif text-4xl text-block">
                  {currency.format(summary.blocked_amount)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Decision mix" eyebrow="Risk distribution">
          <RiskDistributionChart data={summary.risk_distribution} />
        </SectionCard>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved" value={summary.approved_count.toString()} tone="safe" />
        <MetricCard label="Review" value={summary.review_count.toString()} tone="review" />
        <MetricCard label="Blocked" value={summary.blocked_count.toString()} tone="block" />
        <MetricCard
          label="Cases ready"
          value={summary.total_cases.toString()}
          tone="ink"
        />
      </section>

      <SectionCard title="Alert feed" eyebrow="Three deterministic demo cases">
        <div className="overflow-hidden rounded-[24px] border border-line/70">
          <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr] gap-4 bg-paper/70 px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted">
            <span>Case</span>
            <span>Decision</span>
            <span>Amount</span>
            <span>Risk</span>
          </div>
          <div className="divide-y divide-line/60 bg-panel/80">
            {summary.cases.map((item) => (
              <Link
                key={item.transaction_id}
                href={`/cases/${item.transaction_id}`}
                className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr] gap-4 px-5 py-4 transition hover:bg-paper/70"
              >
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.timeline_label} · {item.recipient_label}
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${decisionStyles[item.decision]}`}
                  >
                    {item.decision}
                  </span>
                </div>
                <div className="text-sm font-medium text-ink">
                  {currency.format(item.amount)}
                </div>
                <div className="text-sm font-medium text-ink">
                  {Math.round(item.overall_risk * 100)}%
                </div>
              </Link>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Unified operations lane" eyebrow="Merged from the legacy dashboard">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <p className="max-w-3xl text-lg leading-8 text-muted">
              Sentinel now includes the old streaming monitor as a first-class view,
              so you can move from live rule and ring alerts into the analyst case
              workflow without switching apps.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                synthetic transaction stream
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                anomaly plus rule scoring
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                entity graph watchtower
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Live alerts"
              value={liveMonitor.stats.flagged_alerts.toString()}
              tone="review"
            />
            <MetricCard
              label="Ring clusters"
              value={liveMonitor.stats.ring_clusters.toString()}
              tone="block"
            />
            <MetricCard
              label="Latency"
              value={`${liveMonitor.stats.total_latency_ms} ms`}
              tone="safe"
            />
          </div>
        </div>
      </SectionCard>
    </main>
  );
}

function MetricCard({
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
    <div className="rounded-[24px] border border-line/70 bg-panel/90 p-5 shadow-frame">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className={`mt-4 font-serif text-5xl ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}
