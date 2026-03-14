import Link from "next/link";

import { IncidentChat } from "@/components/incident-chat";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getIncidentDetail } from "@/lib/api";
import type { IncidentDetailResponse, LiveAction } from "@/lib/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decisionBadgeStyles: Record<LiveAction, string> = {
  allow: "border-safe/30 bg-safe/10 text-safe",
  review: "border-review/30 bg-review/10 text-review",
  hold: "border-block/30 bg-block/10 text-block",
  block: "border-block/30 bg-block/10 text-block",
};

const summaryAccentStyles: Record<LiveAction, string> = {
  allow: "bg-safe",
  review: "bg-review",
  hold: "bg-block",
  block: "bg-block",
};

type EvidenceGroup = {
  title: string;
  items: string[];
};

type TimelineItem = {
  label: string;
  timeLabel: string | null;
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let detail;

  try {
    detail = await getIncidentDetail(id);
  } catch {
    return (
      <ServiceUnavailable
        title="Investigation unavailable"
        message="Sentinel could not open this incident right now. The backend may be restarting, unreachable, or missing the current incident snapshot."
      />
    );
  }

  const severity = severityLabel(detail.overall_risk);
  const thesis = buildThesis(detail);
  const evidenceGroups = buildEvidenceGroups(detail);
  const actionSignals = evidenceGroups.flatMap((group) => group.items).slice(0, 2);
  const metadata = buildMetadata(detail);
  const behaviorSignals = buildBehaviorSignals(detail);
  const timeline = buildSessionTimeline(detail);
  const timestampLabel = extractTimestampLabel(detail.timeline_label);

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-line/80 bg-panel/95 shadow-frame">
        <div className={`h-1.5 w-full ${summaryAccentStyles[detail.decision]}`} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Incident summary
                </p>
                <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
                  {detail.title}
                </h1>
                {thesis ? (
                  <p className="max-w-2xl text-base leading-7 text-muted">{thesis}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end gap-4 sm:gap-5">
                <span
                  className={`inline-flex rounded-full border px-5 py-3 text-sm font-semibold uppercase tracking-[0.28em] ${decisionBadgeStyles[detail.decision]}`}
                >
                  {detail.decision}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Risk</p>
                  <p className="mt-1 font-serif text-5xl leading-none text-ink sm:text-6xl">
                    {Math.round(detail.overall_risk * 100)}%
                  </p>
                </div>
                <div className="pb-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Severity</p>
                  <p className="mt-1 text-base font-medium text-muted">{severity}</p>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 xl:max-w-xl">
              <div className="grid gap-x-6 gap-y-4 border-t border-line/70 pt-5 sm:grid-cols-3 xl:border-t-0 xl:border-l xl:pl-8 xl:pt-0">
                {metadata.map((item) => (
                  <MetadataRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-line/80 bg-panel/95 p-6 shadow-frame sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Recommended action
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {detail.recommended_action}
              </h2>
            </div>
            {actionSignals.length ? (
              <ul className="space-y-2 text-sm leading-7 text-muted">
                {actionSignals.map((signal) => (
                  <li key={signal}>- {signal}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Link
              href={`/incidents/${detail.incident_id}/graph`}
              className="rounded-full bg-ink px-5 py-3 text-sm text-paper transition hover:opacity-90"
            >
              Open network exposure
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-line px-5 py-3 text-sm text-ink transition hover:bg-paper"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-line/80 bg-panel/95 p-6 shadow-frame sm:p-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Risk drivers</p>
            <ScoreBreakdown
              items={[
                { label: "Transaction risk", value: detail.transaction_risk, tone: "review" },
                { label: "Behavior risk", value: detail.behavior_risk, tone: "block" },
                { label: "Network risk", value: detail.network_risk, tone: "block" },
              ]}
            />
          </div>

          <div className="border-t border-line/70 pt-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Evidence drivers</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-3">
              {evidenceGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <p className="text-sm font-semibold text-ink">{group.title}</p>
                  <ul className="space-y-2 text-sm leading-7 text-muted">
                    {group.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-line/80 bg-panel/95 p-6 shadow-frame sm:p-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Behavior analysis
            </p>
            <p className="mt-3 text-lg text-ink">{detail.behavior_profile.subject_label}</p>
          </div>

          <dl className="grid gap-x-6 gap-y-4 border-t border-line/70 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            {behaviorSignals.map((signal) => (
              <SignalRow key={signal.label} label={signal.label} value={signal.value} />
            ))}
          </dl>

          <div className="grid gap-6 border-t border-line/70 pt-6 lg:grid-cols-2">
            <PathBlock label="Expected path" path={detail.behavior_profile.expected_path} />
            <PathBlock label="Current path" path={detail.behavior_profile.current_path} />
          </div>

          <div className="border-t border-line/70 pt-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Session timeline</p>
            <ol className="mt-4 space-y-3">
              {timeline.map((item) => (
                <li
                  key={`${item.timeLabel ?? "no-time"}-${item.label}`}
                  className="grid grid-cols-[7rem_1fr] gap-4 text-sm leading-6"
                >
                  <span className="font-medium text-ink/75">
                    {item.timeLabel ?? "Session"}
                  </span>
                  <span className="text-ink">{item.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-7 text-muted">
              {buildTimingNote(
                detail.behavior_profile.baseline_login_to_transfer_sec,
                detail.behavior_profile.current_login_to_transfer_sec,
                timestampLabel,
              )}
            </p>
          </div>
        </div>
      </section>

      <IncidentChat incidentId={detail.incident_id} decision={detail.decision} />
    </main>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 break-words text-lg leading-8 text-ink">{value}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-2 text-lg text-ink">{value}</dd>
    </div>
  );
}

function PathBlock({ label, path }: { label: string; path: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-sm leading-7 text-ink">{path.join(" -> ")}</p>
    </div>
  );
}

function severityLabel(risk: number) {
  if (risk >= 0.8) {
    return "High";
  }

  if (risk >= 0.45) {
    return "Medium";
  }

  return "Low";
}

function buildThesis(detail: IncidentDetailResponse) {
  if (detail.behavior_risk >= 0.35 || detail.behavior_anomalies.length) {
    return "This transfer appears normal in isolation but becomes suspicious when combined with behavioral and device anomalies.";
  }

  if (detail.network_risk >= 0.35 || detail.network_anomalies.length) {
    return "This transfer becomes suspicious when network exposure is layered onto the payment pattern.";
  }

  return "This incident requires analyst review because multiple risk signals reinforce the same escalation path.";
}

function buildMetadata(detail: IncidentDetailResponse) {
  return [
    { label: "Amount", value: currency.format(detail.amount) },
    { label: "Account", value: detail.counterpart_label },
    { label: "Time", value: extractTimestampLabel(detail.timeline_label) },
  ];
}

function buildBehaviorSignals(detail: IncidentDetailResponse) {
  return [
    {
      label: "Baseline timing",
      value: `${detail.behavior_profile.baseline_login_to_transfer_sec}s`,
    },
    {
      label: "Current timing",
      value: `${detail.behavior_profile.current_login_to_transfer_sec}s`,
    },
    {
      label: "Path similarity",
      value: `${Math.round(detail.behavior_profile.path_similarity * 100)}%`,
    },
    {
      label: "New device",
      value: detail.behavior_profile.new_device ? "Yes" : "No",
    },
  ];
}

function buildEvidenceGroups(detail: IncidentDetailResponse): EvidenceGroup[] {
  const transactionItems = dedupeSignals(
    buildTransactionSignals(detail).slice(0, 2),
  );
  const deviceItems = dedupeSignals(buildDeviceSignals(detail).slice(0, 2));
  const behaviorItems = dedupeSignals(buildBehaviorSignalsList(detail).slice(0, 2));

  return [
    { title: "Transaction anomaly", items: transactionItems },
    { title: "Device anomaly", items: deviceItems },
    { title: "Behavior anomaly", items: behaviorItems },
  ].filter((group) => group.items.length);
}

function buildTransactionSignals(detail: IncidentDetailResponse) {
  const normalized = detail.transaction_anomalies.map((item) => item.trim());
  const signals: string[] = [];

  if (
    normalized.some((item) =>
      /outside.*profile|recent transfer profile|strong anomaly|outside.*behavior/i.test(item),
    )
  ) {
    signals.push("outside sender transfer profile");
  }

  if (
    normalized.some((item) =>
      /high-value|amount|baseline|unusually|value/i.test(item),
    ) || detail.amount >= 10000
  ) {
    signals.push("unusually high transaction value");
  }

  if (
    !signals.length &&
    detail.network_anomalies.some((item) => /circular|rapid|cluster|cash-out|volume/i.test(item))
  ) {
    signals.push(...compressNetworkSignals(detail.network_anomalies));
  }

  for (const item of normalized) {
    signals.push(shortenSignal(item));
  }

  return signals;
}

function buildDeviceSignals(detail: IncidentDetailResponse) {
  const joined = detail.behavior_anomalies.join(" ").toLowerCase();
  const signals: string[] = [];

  if (detail.behavior_profile.new_device || joined.includes("device")) {
    signals.push("new device fingerprint");
  }

  if (/ip|country|geography|location/.test(joined)) {
    signals.push("IP outside recent geography");
  }

  return signals.length ? signals : [];
}

function buildBehaviorSignalsList(detail: IncidentDetailResponse) {
  const joined = detail.behavior_anomalies.join(" ").toLowerCase();
  const signals: string[] = [];

  if (
    /timing|login-to-payment|login to payment/.test(joined) ||
    detail.behavior_profile.current_login_to_transfer_sec >
      detail.behavior_profile.baseline_login_to_transfer_sec
  ) {
    signals.push("login-to-payment timing deviation");
  }

  if (
    /path|navigation|flow|payee/.test(joined) ||
    detail.behavior_profile.path_similarity < 0.85
  ) {
    signals.push(
      detail.behavior_profile.payee_added
        ? "new payee added during session"
        : "navigation path deviates from baseline",
    );
  }

  if (!signals.length && detail.network_anomalies.length) {
    signals.push(...compressNetworkSignals(detail.network_anomalies));
  }

  return signals;
}

function compressNetworkSignals(items: string[]) {
  const joined = items.join(" ").toLowerCase();
  const signals: string[] = [];

  if (/circular|cycle/.test(joined)) {
    signals.push("circular transfer pattern detected");
  }
  if (/rapid|seconds|velocity/.test(joined)) {
    signals.push("rapid funds movement across accounts");
  }
  if (/volume|cumulative/.test(joined)) {
    signals.push("high cumulative movement volume");
  }

  return signals;
}

function dedupeSignals(items: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalized = normalizeSignal(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(item);
  }

  return deduped.slice(0, 2);
}

function normalizeSignal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shortenSignal(value: string) {
  const normalized = value.trim();

  if (/more than 3x sender baseline/i.test(normalized)) {
    return "more than 3x sender baseline";
  }
  if (/outside.*profile|recent transfer profile/i.test(normalized)) {
    return "outside sender transfer profile";
  }
  if (/unseen device/i.test(normalized)) {
    return "new device fingerprint";
  }
  if (/unseen ip|country|geography|location/i.test(normalized)) {
    return "IP outside recent geography";
  }
  if (/many recipients/i.test(normalized)) {
    return "recipient behavior drifted from baseline";
  }

  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

function extractTimestampLabel(timelineLabel: string) {
  const parts = timelineLabel.split("·");
  return parts.length > 1 ? parts[1].trim() : timelineLabel.trim();
}

function buildSessionTimeline(detail: IncidentDetailResponse): TimelineItem[] {
  const rawSteps = detail.behavior_profile.current_path;
  const eventTime = parseIncidentDate(detail.timeline_label);
  const totalDuration = Math.max(detail.behavior_profile.current_login_to_transfer_sec, 1);
  const intervalSeconds =
    rawSteps.length > 1 ? totalDuration / (rawSteps.length - 1) : totalDuration;
  const seen = new Map<string, number>();

  return rawSteps.map((step, index) => {
    const count = (seen.get(step) ?? 0) + 1;
    seen.set(step, count);

    const offsetSeconds = Math.round(intervalSeconds * (rawSteps.length - 1 - index));
    const stepTime =
      eventTime instanceof Date
        ? new Date(eventTime.getTime() - offsetSeconds * 1000)
        : null;

    return {
      label: describeTimelineStep(step, count),
      timeLabel: stepTime
        ? stepTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })
        : null,
    };
  });
}

function parseIncidentDate(timelineLabel: string) {
  const parsed = new Date(extractTimestampLabel(timelineLabel));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function describeTimelineStep(step: string, count: number) {
  if (step === "Login") {
    return "Login detected";
  }
  if (step === "Profile") {
    return "Profile accessed";
  }
  if (step === "Accounts") {
    return "Accounts viewed";
  }
  if (step === "Payments") {
    return "Payments opened";
  }
  if (step === "New Payee") {
    return "New payee added";
  }
  if (step === "Confirm") {
    return "Payment confirmed";
  }
  if (step === "Transfers") {
    return `Transfer hop ${count}`;
  }
  if (step === "Cash-out") {
    return "Cash-out route reached";
  }

  return `${step} accessed`;
}

function buildTimingNote(
  baselineSeconds: number,
  currentSeconds: number,
  timestampLabel: string,
) {
  return `Payment reached ${currentSeconds}s after login versus a ${baselineSeconds}s baseline, ending at ${timestampLabel}.`;
}
