import Link from "next/link";

import { CytoscapeGraph } from "@/components/cytoscape-graph";
import { SectionCard } from "@/components/section-card";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getIncidentDetail, getIncidentGraph } from "@/lib/api";

export default async function IncidentGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let detail;
  let graph;

  try {
    [detail, graph] = await Promise.all([getIncidentDetail(id), getIncidentGraph(id)]);
  } catch {
    return (
      <ServiceUnavailable
        title="Network view unavailable"
        message="Sentinel could not load the investigation graph right now. The backend may be unavailable or the incident snapshot is no longer active."
      />
    );
  }

  return (
    <main className="space-y-8">
      <SectionCard
        title="Network exposure"
        eyebrow={`${detail.title} · ${detail.counterpart_label}`}
        action={
          <Link
            href="/dashboard"
            className="rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
          >
            Back to dashboard
          </Link>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-line/70 bg-paper/80 p-4">
            <CytoscapeGraph graph={graph} enableReplay />
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-line/70 bg-paper/75 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Graph interpretation
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                This graph is built from the incident’s related live-snapshot transactions.
                Highlighted nodes and edges mark the accounts directly involved in the
                alert, while filled red nodes are simulator-defined mule or cash-out
                entities that appear in the observed neighborhood.
              </p>
            </div>
            <Metric
              label="Distance to suspicious cluster"
              value={formatDistance(graph.metrics.distance_to_suspicious_cluster)}
            />
            <Metric label="Recipient fan-in" value={String(graph.metrics.recipient_fan_in)} />
            <Metric label="Recipient fan-out" value={String(graph.metrics.recipient_fan_out)} />
            <Metric
              label="Rapid chain detected"
              value={graph.metrics.rapid_chain_detected ? "Yes" : "No"}
            />
            <div className="rounded-[24px] border border-line/70 bg-panel/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Highlighted entities
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {graph.highlighted_node_ids.map((nodeId) => (
                  <li key={nodeId}>- {nodeId}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-line/70 bg-panel/90 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Suspicious entities present
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {graph.suspicious_cluster_ids.length ? (
                  graph.suspicious_cluster_ids.map((nodeId) => <li key={nodeId}>- {nodeId}</li>)
                ) : (
                  <li>- None in current snapshot slice</li>
                )}
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
