"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";

import { getLiveMonitorStream } from "@/lib/api";
import type { LiveAction, LiveMonitorPayload } from "@/lib/types";

import { LiveNetworkGraph } from "./live-network-graph";
import { SectionCard } from "./section-card";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const alertStyles: Record<LiveAction, string> = {
  allow: "bg-safe/10 text-safe",
  review: "bg-review/10 text-review",
  hold: "bg-block/10 text-block",
  block: "bg-block/15 text-block",
};

export function LiveMonitorDashboard({
  initialData,
}: {
  initialData: LiveMonitorPayload;
}) {
  const [payload, setPayload] = useState(initialData);
  const [polling, setPolling] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function refresh(batch: number) {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsRefreshing(true);

    try {
      const next = await getLiveMonitorStream(batch);
      setPayload(next);
      setError(null);
    } catch {
      setError("Live stream refresh failed. Showing the latest successful snapshot.");
    } finally {
      inFlightRef.current = false;
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!polling) {
      return;
    }

    const handle = window.setInterval(() => {
      startTransition(() => {
        void refresh(6);
      });
    }, 3000);

    return () => {
      window.clearInterval(handle);
    };
  }, [polling]);

  const prioritizedAlerts = [
    ...payload.alerts.filter((alert) => alert.type === "transaction"),
    ...payload.alerts.filter((alert) => alert.type === "ring"),
  ].slice(0, 3);

  return (
    <div className="space-y-8">
      <SectionCard
        title="Real-time fraud operations"
        eyebrow="Merged live monitor"
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPolling((current) => !current)}
              className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition hover:bg-[#efe4d1]"
            >
              {polling ? "Pause live stream" : "Resume live stream"}
            </button>
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  void refresh(12);
                });
              }}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90"
            >
              Inject suspicious burst
            </button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl leading-tight text-ink">
              Streaming transactions, rules, anomaly scoring, and ring detection in one console.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted">
              This is the live dashboard from the legacy fraud demo, now folded into
              Sentinel so the real-time watchtower and the deep-dive analyst case
              views live in the same product.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/cases/tx_blocked_001"
                className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
              >
                Compare with flagged case
              </Link>
              <span className="rounded-full bg-paper px-4 py-3 text-muted">
                {payload.generated_at
                  ? `Updated ${new Date(payload.generated_at).toLocaleTimeString()}`
                  : "Waiting for stream"}
              </span>
              <span className="rounded-full bg-paper px-4 py-3 text-muted">
                {isRefreshing ? "Refreshing..." : polling ? "Auto-refresh on" : "Paused"}
              </span>
            </div>
            {error ? (
              <p className="rounded-[18px] border border-block/20 bg-block/5 px-4 py-3 text-sm text-block">
                {error}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-[24px] border border-line/70 bg-paper/80 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Transactions monitored
              </p>
              <p className="mt-2 font-serif text-4xl text-ink">
                {payload.stats.transactions_monitored.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted">
                rolling synthetic transfers included in the current scoring window
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniMetric
                label="Flagged alerts"
                value={payload.stats.flagged_alerts.toString()}
                tone="review"
              />
              <MiniMetric
                label="Ring clusters"
                value={payload.stats.ring_clusters.toString()}
                tone="block"
              />
              <MiniMetric
                label="Suspicious volume"
                value={currency.format(payload.stats.suspicious_volume)}
                tone="block"
              />
              <MiniMetric
                label="Total latency"
                value={`${payload.stats.total_latency_ms} ms`}
                tone="safe"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Blocked" value={payload.stats.blocked_count.toString()} tone="block" />
        <MetricCard label="Held" value={payload.stats.held_count.toString()} tone="block" />
        <MetricCard label="Review" value={payload.stats.review_count.toString()} tone="review" />
        <MetricCard label="Rules triggered" value={payload.stats.rules_triggered.toString()} tone="ink" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Priority alerts" eyebrow={`Hot origin ${payload.stats.hot_country}`}>
          <div className="space-y-4">
            {payload.alerts.length ? (
              payload.alerts.map((alert, index) => (
                <article
                  key={`${alert.type}-${alert.transaction_id ?? alert.cluster_id ?? index}`}
                  className="rounded-[24px] border border-line/70 bg-paper/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{alert.alert_title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {alert.type === "transaction"
                          ? `${alert.sender_account} -> ${alert.receiver_account}`
                          : alert.accounts_involved.join(" -> ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-3xl text-ink">
                        {Math.round(alert.final_risk * 100)}%
                      </p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${alertStyles[alert.action]}`}
                      >
                        {alert.action}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{alert.explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-panel px-3 py-2 text-muted">
                      {currency.format(alert.amount)}
                    </span>
                    {alert.rule_reasons.slice(0, 2).map((reason) => (
                      <span key={reason} className="rounded-full bg-panel px-3 py-2 text-muted">
                        {reason}
                      </span>
                    ))}
                    {alert.network_evidence.slice(0, 2).map((reason) => (
                      <span key={reason} className="rounded-full bg-panel px-3 py-2 text-muted">
                        {reason}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-line/70 bg-paper/70 p-5 text-sm text-muted">
                No active fraud alerts. The monitor is still building enough context to
                surface suspicious activity.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Entity graph"
          eyebrow="Accounts, devices, IPs, and beneficiaries"
        >
          <LiveNetworkGraph graph={payload.graph} />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Why the top alerts were flagged" eyebrow="Risk breakdown">
          <div className="space-y-4">
            {prioritizedAlerts.length ? (
              prioritizedAlerts.map((alert) => (
                <article
                  key={`explain-${alert.transaction_id ?? alert.cluster_id ?? alert.alert_title}`}
                  className="rounded-[22px] border border-line/70 bg-paper/70 p-5"
                >
                  <p className="font-semibold text-ink">{alert.alert_title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{alert.explanation}</p>
                  <div className="mt-4 space-y-3">
                    {alert.why_flagged.breakdown.map((item) => (
                      <div key={`${alert.alert_title}-${item.label}`}>
                        <div className="mb-1 flex items-center justify-between text-sm text-muted">
                          <span>{item.label}</span>
                          <span>{Math.round(item.value * 100)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-panel">
                          <div
                            className="h-full rounded-full bg-ink"
                            style={{ width: `${Math.round(item.value * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5 text-sm text-muted">
                The breakdown cards appear as soon as the stream produces medium-risk or
                higher events.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent transaction stream" eyebrow="Latest 18 scored events">
          <div className="overflow-hidden rounded-[24px] border border-line/70">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.45fr_0.6fr_0.55fr] gap-3 bg-paper/80 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted">
              <span>Transaction</span>
              <span>Sender</span>
              <span>Receiver</span>
              <span>Geo</span>
              <span>Amount</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-line/60 bg-panel/80">
              {payload.transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.45fr_0.6fr_0.55fr] gap-3 px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{transaction.transaction_id}</p>
                    <p className="mt-1 text-xs text-muted">
                      {Math.round(transaction.final_risk * 100)}% risk
                    </p>
                  </div>
                  <span className="text-ink">{transaction.sender_account}</span>
                  <span className="text-ink">{transaction.receiver_account}</span>
                  <span className="text-muted">{transaction.ip_country}</span>
                  <span className="text-ink">{currency.format(transaction.amount)}</span>
                  <span
                    className={`inline-flex h-fit rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${alertStyles[transaction.action]}`}
                  >
                    {transaction.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
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

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "safe" | "review" | "block";
}) {
  const toneMap = {
    safe: "text-safe",
    review: "text-review",
    block: "text-block",
  };

  return (
    <div className="rounded-[20px] border border-line/70 bg-panel/90 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={`mt-3 font-serif text-3xl ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}
