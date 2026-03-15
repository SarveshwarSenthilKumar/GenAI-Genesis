import Link from "next/link";

import { CytoscapeGraph } from "@/components/cytoscape-graph";
import { SectionCard } from "@/components/section-card";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getIncidentDetail, getIncidentGraph } from "@/lib/api";

export default async function IncidentGraphPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
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

  const highlightedNodeIds = [...new Set(graph.highlighted_node_ids)];
  const suspiciousNodeIds = [...new Set(graph.suspicious_cluster_ids)];

  return (
    <main className="space-y-8">
      <SectionCard
        title="Network exposure"
        eyebrow={`${detail.title} · ${detail.counterpart_label}`}
        action={
          <div className="flex flex-wrap gap-3">
            {from === "investigation" ? (
              <Link
                href={`/incidents/${detail.incident_id}`}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
              >
                Back to investigation
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:bg-paper"
            >
              Back to dashboard
            </Link>
          </div>
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
            <div className="rounded-[24px] border border-line/70 bg-paper/75 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Network signals
              </p>
              <dl className="mt-4 divide-y divide-line/45">
                <SignalRow
                  label="Distance to suspicious cluster"
                  value={formatDistance(graph.metrics.distance_to_suspicious_cluster)}
                />
                <SignalRow
                  label="Recipient fan-in"
                  value={String(graph.metrics.recipient_fan_in)}
                />
                <SignalRow
                  label="Recipient fan-out"
                  value={String(graph.metrics.recipient_fan_out)}
                />
                <SignalRow
                  label="Rapid chain detected"
                  value={graph.metrics.rapid_chain_detected ? "Yes" : "No"}
                />
              </dl>
            </div>
            <div className="rounded-[24px] border border-line/70 bg-paper/75 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Entities</p>
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Highlighted
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {highlightedNodeIds.length ? (
                      highlightedNodeIds.map((nodeId, index) => (
                        <li key={`${nodeId}-${index}`}>- {nodeId}</li>
                      ))
                    ) : (
                      <li>- None highlighted in this view</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Suspicious
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {suspiciousNodeIds.length ? (
                      suspiciousNodeIds.map((nodeId, index) => (
                        <li key={`${nodeId}-${index}`}>- {nodeId}</li>
                      ))
                    ) : (
                      <li>- None in current graph</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function formatDistance(distance: number | null) {
  if (distance === null) {
    return "No path";
  }

  return `${distance} hop${distance === 1 ? "" : "s"}`;
}
