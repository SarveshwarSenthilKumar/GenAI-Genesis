"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";

import { getLiveMonitorStream, triggerLiveMonitorScenario } from "@/lib/api";
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
  enableStreaming = true,
}: {
  initialData: LiveMonitorPayload;
  enableStreaming?: boolean;
}) {
  const [payload, setPayload] = useState(initialData);
  const [polling, setPolling] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInjectingScenario, setIsInjectingScenario] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minimumRisk, setMinimumRisk] = useState(65);
  const [actionFilter, setActionFilter] = useState<"all" | LiveAction>("all");
  const [lastScenario, setLastScenario] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const scenarios = [
    { key: "normal", label: "Normal flow" },
    { key: "account_takeover", label: "Account takeover" },
    { key: "laundering_ring", label: "Laundering ring" },
    { key: "smurfing_burst", label: "Smurfing burst" },
    { key: "vpn_takeover", label: "VPN/IP takeover" },
    { key: "mule_fanout", label: "Mule fan-out" },
    { key: "merchant_fraud", label: "Merchant fraud" },
    { key: "dormant_reactivation", label: "Dormant reactivation" },
    { key: "cross_border_travel", label: "Cross-border travel" },
  ];

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

  async function injectScenario(name: string) {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsInjectingScenario(true);

    try {
      const next = await triggerLiveMonitorScenario(name);
      setPayload(next);
      setLastScenario(name);
      setError(null);
    } catch {
      setError("Scenario injection failed. Keep the backend running and try again.");
    } finally {
      inFlightRef.current = false;
      setIsInjectingScenario(false);
    }
  }

  useEffect(() => {
    if (!polling || !enableStreaming) {
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
  }, [enableStreaming, polling]);

  const filteredAlerts = payload.alerts.filter((alert) => {
    const matchesThreshold = alert.final_risk * 100 >= minimumRisk;
    const matchesAction = actionFilter === "all" || alert.action === actionFilter;

    return matchesThreshold && matchesAction;
  });
  const topAlerts = filteredAlerts.slice(0, 5);

  const filteredTransactions = payload.transactions.filter((transaction) => {
    const matchesThreshold = transaction.final_risk * 100 >= minimumRisk;
    const matchesAction = actionFilter === "all" || transaction.action === actionFilter;

    return matchesThreshold && matchesAction;
  });

  const highestVisibleRisk = filteredAlerts.reduce(
    (maxRisk, alert) => Math.max(maxRisk, alert.final_risk),
    0,
  );
  const visibleSuspiciousVolume = filteredAlerts.reduce(
    (total, alert) => total + (alert.suspicious_funds_total ?? alert.amount),
    0,
  );
  const actionOptions: Array<{ label: string; value: "all" | LiveAction }> = [
    { label: "All actions", value: "all" },
    { label: "Hold", value: "hold" },
    { label: "Block", value: "block" },
    { label: "Review", value: "review" },
    { label: "Allow", value: "allow" },
  ];

  return (
    <div className="space-y-8">
      <SectionCard
        title="Real-time fraud operations"
        eyebrow="Merged live monitor"
        action={
          enableStreaming ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPolling((current) => !current)}
                className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition hover:bg-[#efe4d1]"
              >
                {polling ? "Pause live stream" : "Resume live stream"}
              </button>
              {(isInjectingScenario || lastScenario) && (
                <span className="rounded-full border border-line bg-paper px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted">
                  {isInjectingScenario
                    ? "Injecting..."
                    : `Last: ${lastScenario.replace(/_/g, " ")}`}
                </span>
              )}
            </div>
          ) : (
            <span className="rounded-full border border-line bg-paper px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
              Upload snapshot
            </span>
          )
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl leading-tight text-ink">
              Fast screening for suspicious transfers, anomaly spikes, and coordinated rings.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted">
              Keep the live queue focused on what needs action first, then drill into
              the strongest transaction, rules, and network signals behind each alert.
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
                {enableStreaming
                  ? isRefreshing
                    ? "Refreshing..."
                    : polling
                      ? "Auto-refresh on"
                      : "Paused"
                  : "Static snapshot"}
              </span>
              {payload.active_scenario ? (
                <span className="rounded-full bg-[#E6EEFF] px-4 py-3 font-medium text-[#2563EB]">
                  Scenario: {payload.active_scenario.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
            {error ? (
              <p className="rounded-[18px] border border-block/20 bg-block/5 px-4 py-3 text-sm text-block">
                {error}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-[24px] border border-line/70 bg-paper/80 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Screening snapshot</p>
              <p className="mt-2 font-serif text-4xl text-ink">{filteredAlerts.length}</p>
              <p className="mt-2 text-sm text-muted">
                alerts currently visible at or above your screening threshold
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniMetric label="Threshold" value={`${minimumRisk}%`} tone="review" />
              <MiniMetric
                label="Highest visible risk"
                value={`${Math.round(highestVisibleRisk * 100)}%`}
                tone="block"
              />
              <MiniMetric
                label="Visible suspicious volume"
                value={currency.format(visibleSuspiciousVolume)}
                tone="block"
              />
              <MiniMetric
                label="Refresh latency"
                value={`${payload.stats.total_latency_ms} ms`}
                tone="safe"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Screening controls" eyebrow="Tune what gets surfaced first">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Minimum risk to flag
                </p>
                <p className="mt-2 font-serif text-4xl text-ink">{minimumRisk}%</p>
              </div>
              <button
                type="button"
                onClick={() => setMinimumRisk(65)}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
              >
                Reset to 65%
              </button>
            </div>
            <input
              type="range"
              min={40}
              max={95}
              step={5}
              value={minimumRisk}
              onChange={(event) => setMinimumRisk(Number(event.target.value))}
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-[#b6432c]"
            />
            <div className="mt-3 flex justify-between text-xs uppercase tracking-[0.14em] text-muted">
              <span>40% wider net</span>
              <span>95% highest risk only</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-line/70 bg-paper/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Action filter</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {actionOptions.map((option) => {
                const isActive = option.value === actionFilter;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActionFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      isActive
                        ? "bg-ink text-paper"
                        : "border border-line bg-paper text-ink hover:bg-[#efe4d1]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">
              Keep the queue focused on the actions your team is handling right now.
            </p>
          </div>
        </div>
        {enableStreaming ? (
          <div className="mt-6 rounded-[22px] border border-line/70 bg-paper/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Demo scenarios</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Trigger a specific fraud story on demand so the detection flow is reproducible
                  during your demo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.key}
                    type="button"
                    disabled={isInjectingScenario}
                    onClick={() => {
                      startTransition(() => {
                        void injectScenario(scenario.key);
                      });
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      payload.active_scenario === scenario.key
                        ? "bg-ink text-paper"
                        : "border border-line bg-paper text-ink hover:bg-[#efe4d1]"
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Transactions monitored"
          value={payload.stats.transactions_monitored.toLocaleString()}
          detail="current scoring window"
          progress={1}
          tone="ink"
        />
        <MetricCard
          label="Flagged alerts"
          value={payload.stats.flagged_alerts.toString()}
          detail={`${filteredAlerts.length} visible now`}
          progress={payload.stats.flagged_alerts / Math.max(payload.stats.transactions_monitored, 1)}
          tone="review"
        />
        <MetricCard
          label="Ring clusters"
          value={payload.stats.ring_clusters.toString()}
          detail={`${currency.format(payload.stats.suspicious_volume)} suspicious volume`}
          progress={payload.stats.ring_clusters / Math.max(payload.stats.flagged_alerts, 1)}
          tone="block"
        />
        <MetricCard
          label="Rules triggered"
          value={payload.stats.rules_triggered.toString()}
          detail={`${payload.stats.total_latency_ms} ms end-to-end`}
          progress={payload.stats.rules_triggered / Math.max(payload.stats.transactions_monitored, 1)}
          tone="ink"
        />
      </section>

      <section>
        <SectionCard title="Priority alerts" eyebrow={`Hot origin ${payload.stats.hot_country}`}>
          <div className="space-y-4">
            {topAlerts.length ? (
              topAlerts.map((alert, index) => (
                <article
                  key={`${alert.type}-${alert.transaction_id ?? alert.cluster_id ?? index}`}
                  className="rounded-[24px] border border-line/70 bg-paper/70 p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
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

                      <p className="mt-4 text-sm leading-7 text-muted">{alert.explanation}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <SignalBar
                          label="Transaction"
                          value={alert.transaction_anomaly_score}
                          tone="review"
                        />
                        <SignalBar label="Rules" value={alert.rule_score} tone="review" />
                        <SignalBar label="Network" value={alert.network_risk_score} tone="block" />
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-line/70 bg-panel/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Screening summary
                      </p>
                      <div className="mt-4">
                        <RiskMeter value={alert.final_risk} tone={alert.action} />
                      </div>
                      <dl className="mt-5 grid gap-3 text-sm">
                        <SummaryStat label="Amount" value={currency.format(alert.amount)} />
                        <SummaryStat
                          label="Linked flow"
                          value={currency.format(alert.suspicious_funds_total ?? alert.amount)}
                        />
                        <SummaryStat
                          label="Accounts linked"
                          value={alert.accounts_involved.length.toString()}
                        />
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <EvidenceList title="Top triggers" items={alert.rule_reasons} />
                    <EvidenceList title="Network evidence" items={alert.network_evidence} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-panel px-3 py-2 text-muted">
                      {currency.format(alert.amount)}
                    </span>
                    {alert.accounts_involved.slice(0, 5).map((account) => (
                      <span key={account} className="rounded-full bg-panel px-3 py-2 text-muted">
                        {account}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-line/70 bg-paper/70 p-5 text-sm text-muted">
                No active alerts match the current screening controls. Lower the minimum
                risk or broaden the action filter to review more activity.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section>
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
            {topAlerts.length ? (
              topAlerts.map((alert) => (
                <article
                  key={`explain-${alert.transaction_id ?? alert.cluster_id ?? alert.alert_title}`}
                  className="rounded-[22px] border border-line/70 bg-paper/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{alert.alert_title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{alert.explanation}</p>
                    </div>
                    <RiskBadge value={alert.final_risk} tone={alert.action} />
                  </div>
                  <div className="mt-4 space-y-3">
                    {alert.why_flagged.breakdown.map((item) => (
                      <SignalBar
                        key={`${alert.alert_title}-${item.label}`}
                        label={item.label}
                        value={item.value}
                        tone={item.label.toLowerCase().includes("network") ? "block" : "review"}
                      />
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

        <SectionCard title="Recent transaction stream" eyebrow="Transactions that meet your current filter">
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
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.45fr_0.6fr_0.55fr] gap-3 px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{transaction.transaction_id}</p>
                    <p className="mt-1 text-xs text-muted">
                      {Math.round(transaction.final_risk * 100)}% risk
                    </p>
                    <div className="mt-2">
                      <InlineProgress value={transaction.final_risk} tone={transaction.action} />
                    </div>
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
              {!filteredTransactions.length ? (
                <div className="px-4 py-6 text-sm text-muted">
                  No transactions match the current screening controls.
                </div>
              ) : null}
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
  detail,
  progress,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  progress: number;
  tone: "safe" | "review" | "block" | "ink";
}) {
  const toneMap = {
    safe: "text-safe",
    review: "text-review",
    block: "text-block",
    ink: "text-ink",
  };
  const barMap = {
    safe: "bg-safe",
    review: "bg-review",
    block: "bg-block",
    ink: "bg-ink",
  };

  return (
    <div className="rounded-[24px] border border-line/70 bg-panel/90 p-5 shadow-frame">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className={`mt-4 font-serif text-5xl ${toneMap[tone]}`}>{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line/60">
        <div
          className={`h-full rounded-full ${barMap[tone]}`}
          style={{ width: `${Math.max(Math.min(progress, 1), 0.08) * 100}%` }}
        />
      </div>
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

function SignalBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "review" | "block";
}) {
  const barTone = tone === "block" ? "bg-block" : "bg-review";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-ink">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line/60">
        <div
          className={`h-full rounded-full ${barTone}`}
          style={{ width: `${Math.max(value * 100, 8)}%` }}
        />
      </div>
    </div>
  );
}

function InlineProgress({
  value,
  tone,
}: {
  value: number;
  tone: LiveAction;
}) {
  const barMap: Record<LiveAction, string> = {
    allow: "bg-safe",
    review: "bg-review",
    hold: "bg-block",
    block: "bg-block",
  };

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
      <div
        className={`h-full rounded-full ${barMap[tone]}`}
        style={{ width: `${Math.max(value * 100, 8)}%` }}
      />
    </div>
  );
}

function RiskMeter({ value, tone }: { value: number; tone: LiveAction }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <p className="font-serif text-5xl text-ink">{Math.round(value * 100)}%</p>
        <RiskBadge value={value} tone={tone} />
      </div>
      <InlineProgress value={value} tone={tone} />
      <p className="text-sm text-muted">Overall fraud risk for this alert</p>
    </div>
  );
}

function RiskBadge({ value, tone }: { value: number; tone: LiveAction }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${alertStyles[tone]}`}
    >
      {Math.round(value * 100)}% {tone}
    </span>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] bg-paper/70 px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  const displayItems = (items.length ? items : ["No additional evidence surfaced yet."]).slice(
    0,
    3,
  );

  return (
    <div className="rounded-[18px] border border-line/70 bg-panel/70 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {displayItems.map((item) => (
          <li key={`${title}-${item}`}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
