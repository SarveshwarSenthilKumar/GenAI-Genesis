import Link from "next/link";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { SectionCard } from "@/components/section-card";
import { TransactionChat } from "@/components/transaction-chat";
import { getBehaviorProfile, getCaseDetail } from "@/lib/api";

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

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCaseDetail(id);
  const profile = await getBehaviorProfile(detail.user_id);
  const currentSession =
    profile.recent_sessions.find((session) => session.login_to_transfer_sec === detail.behavior_signals.current_login_to_transfer_sec) ??
    profile.recent_sessions[0];

  return (
    <main className="space-y-8">
      <SectionCard
        title={detail.title}
        eyebrow={detail.scenario.replace("_", " ")}
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
              {detail.openai_explanation}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {detail.timeline_label}
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {currency.format(detail.amount)}
              </span>
              <span className="rounded-full bg-paper px-4 py-2 text-muted">
                {detail.recipient_label}
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
                  detail.ai_mode === "openai"
                    ? "bg-safe/10 text-safe"
                    : "bg-review/10 text-review"
                }`}
              >
                {detail.ai_mode === "openai" ? "Live OpenAI" : "Fallback copy"}
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl text-ink">
              {detail.recommended_action}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {detail.openai_summary_bullets.map((bullet) => (
                <li key={bullet}>- {bullet}</li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/cases/${detail.transaction_id}/graph`}
                className="rounded-full bg-ink px-5 py-3 text-paper transition hover:opacity-90"
              >
                Open graph view
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-line px-5 py-3 text-ink transition hover:bg-paper"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Score breakdown" eyebrow="Fusion model">
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

        <SectionCard title="Behavior panel" eyebrow={profile.customer_name}>
          <div className="grid gap-4 md:grid-cols-2">
            <BehaviorMetric
              label="Baseline login-to-transfer"
              value={`${detail.behavior_signals.baseline_login_to_transfer_sec}s`}
            />
            <BehaviorMetric
              label="Current session"
              value={`${detail.behavior_signals.current_login_to_transfer_sec}s`}
            />
            <BehaviorMetric
              label="Path similarity"
              value={`${Math.round(detail.behavior_signals.path_similarity * 100)}%`}
            />
            <BehaviorMetric
              label="New device"
              value={detail.behavior_signals.new_device ? "Yes" : "No"}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Expected path
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {profile.expected_path.join(" -> ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Current path
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {currentSession.page_path.join(" -> ")}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-line/70 bg-paper/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Session anomalies
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {detail.behavior_anomalies.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </section>

      <TransactionChat
        transactionId={detail.transaction_id}
        decision={detail.decision}
      />
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
