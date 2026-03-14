import Link from "next/link";

import { CytoscapeGraph } from "@/components/cytoscape-graph";
import { SectionCard } from "@/components/section-card";
import { getCaseDetail, getCaseGraph } from "@/lib/api";

export default async function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, graph] = await Promise.all([getCaseDetail(id), getCaseGraph(id)]);

  return (
    <main className="space-y-8">
      <SectionCard
        title="Network graph"
        eyebrow={`${detail.title} · ${detail.recipient_label}`}
        action={
          <Link
            href={`/cases/${detail.transaction_id}`}
            className="rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
          >
            Back to case
          </Link>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-line/70 bg-paper/80 p-4">
            <CytoscapeGraph graph={graph} />
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-line/70 bg-paper/75 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Graph interpretation
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Highlighted edges show the shortest suspicious route from the
                case recipient toward the mule cluster and cash-out path. The
                same graph contract is used by Cytoscape, so the demo remains
                deterministic every run.
              </p>
            </div>
            <Metric label="Distance to suspicious cluster" value={formatDistance(graph.metrics.distance_to_suspicious_cluster)} />
            <Metric label="Recipient fan-in" value={String(graph.metrics.recipient_fan_in)} />
            <Metric label="Recipient fan-out" value={String(graph.metrics.recipient_fan_out)} />
            <Metric
              label="Rapid chain detected"
              value={graph.metrics.rapid_chain_detected ? "Yes" : "No"}
            />
            <div className="rounded-[24px] border border-line/70 bg-panel/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Suspicious cluster
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {graph.suspicious_cluster_ids.map((nodeId) => (
                  <li key={nodeId}>- {nodeId}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-line/70 bg-paper/75 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 font-serif text-3xl text-ink">{value}</p>
    </div>
  );
}

function formatDistance(distance: number | null) {
  if (distance === null) {
    return "No path";
  }

  return `${distance} hop${distance === 1 ? "" : "s"}`;
}
