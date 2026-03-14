import Link from "next/link";

import { IncidentChat } from "@/components/incident-chat";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { SectionCard } from "@/components/section-card";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getIncidentDetail } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decisionStyles = {
  allow: "bg-safe/10 text-safe",
  review: "bg-review/10 text-review",
  hold: "bg-block/10 text-block",
  block: "bg-block/10 text-block",
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

  return (
    <main className="space-y-8">
      <SectionCard
        title={detail.title}
        eyebrow="Incident investigation"
        action={
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-medium capitalize ${decisionStyles[detail.decision]}`}
          >
            {detail.decision}
          </span>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <p className="font-serif text-6xl text-ink">
              {Math.round(detail.overall_risk * 100)}%
            </p>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              {detail.explanation}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {detail.timeline_label}
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {currency.format(detail.amount)}
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {detail.counterpart_label}
              </span>
            </div>
          </div>
          <div className="rounded-[24px] border border-line/70 bg-paper/80 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Recommended action
            </p>
            <div className="mt-3">
              <span
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                  detail.ai_mode === "gemini"
                    ? "bg-safe/10 text-safe"
                    : "bg-review/10 text-review"
                }`}
              >
                {detail.ai_mode === "gemini" ? "Live Gemini" : "Fallback copy"}
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl text-ink">
              {detail.recommended_action}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {detail.summary_bullets.map((bullet) => (
                <li key={bullet}>- {bullet}</li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/incidents/${detail.incident_id}/graph`}
                className="rounded-full bg-ink px-5 py-3 text-paper transition hover:opacity-90"
              >
                Open network exposure
              </Link>
              <Link
                href="/"
                className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
              >
                Back to queue
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Score breakdown" eyebrow="Escalation drivers">
          <ScoreBreakdown
            items={[
              { label: "Transaction risk", value: detail.transaction_risk, tone: "review" },
              { label: "Behavior risk", value: detail.behavior_risk, tone: "block" },
              { label: "Network risk", value: detail.network_risk, tone: "block" },
            ]}
          />
          <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
            {detail.reasons.map((reason) => (
              <li key={reason}>- {reason}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Behavior panel" eyebrow={detail.behavior_profile.subject_label}>
          <div className="grid gap-4 md:grid-cols-2">
            <BehaviorMetric
              label="Baseline login-to-payment"
              value={`${detail.behavior_profile.baseline_login_to_transfer_sec}s`}
            />
            <BehaviorMetric
              label="Current session"
              value={`${detail.behavior_profile.current_login_to_transfer_sec}s`}
            />
            <BehaviorMetric
              label="Path similarity"
              value={`${Math.round(detail.behavior_profile.path_similarity * 100)}%`}
            />
            <BehaviorMetric
              label="New device"
              value={detail.behavior_profile.new_device ? "Yes" : "No"}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Expected path
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {detail.behavior_profile.expected_path.join(" -> ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Current path
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {detail.behavior_profile.current_path.join(" -> ")}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-line/70 bg-paper/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Behavior anomalies
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {detail.behavior_anomalies.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </section>

      <IncidentChat incidentId={detail.incident_id} decision={detail.decision} />
    </main>
  );
}

function BehaviorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-line/70 bg-paper/70 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 font-serif text-3xl text-ink">{value}</p>
    </div>
  );
}
