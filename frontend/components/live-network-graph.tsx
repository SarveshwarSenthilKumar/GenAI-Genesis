import type { LiveMonitorGraph } from "@/lib/types";

const WIDTH = 800;
const HEIGHT = 420;
const KIND_FILL: Record<string, string> = {
  account: "#16805d",
  mule: "#d98a1b",
  cashout: "#b9382f",
  device: "#355c7d",
  ip: "#6c5b7b",
  beneficiary: "#7c8b39",
};

export function LiveNetworkGraph({ graph }: { graph: LiveMonitorGraph }) {
  if (!graph.nodes.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-[24px] border border-line/70 bg-paper/70 text-sm text-muted">
        Waiting for enough suspicious activity to build a focused entity graph.
      </div>
    );
  }

  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const radius = Math.min(WIDTH, HEIGHT) * 0.33;

  const positionedNodes = graph.nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(graph.nodes.length, 1);
    const squash =
      node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary"
        ? 0.58
        : 0.8;

    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * squash,
    };
  });

  const nodeMap = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-[420px] w-full rounded-[24px] border border-line/70 bg-paper/70"
      role="img"
      aria-label="Live entity graph"
    >
      <defs>
        <pattern id="monitor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(14, 36, 51, 0.06)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#monitor-grid)" />

      {graph.edges.map((edge, index) => {
        const source = nodeMap[edge.source];
        const target = nodeMap[edge.target];
        if (!source || !target) {
          return null;
        }

        return (
          <g key={`${edge.source}-${edge.target}-${index}`}>
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={edge.risk > 0.8 ? "#b9382f" : "#7a8a7d"}
              strokeWidth={edge.risk > 0.8 ? 3 : 1.5}
              strokeOpacity="0.72"
            />
            <text
              x={(source.x + target.x) / 2}
              y={(source.y + target.y) / 2 - 4}
              textAnchor="middle"
              className="fill-muted text-[11px]"
            >
              {edge.amount ? formatMoney(edge.amount) : edge.label}
            </text>
          </g>
        );
      })}

      {positionedNodes.map((node) => {
        const isMetaNode =
          node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary";
        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={isMetaNode ? 14 : 19}
              fill={KIND_FILL[node.kind] ?? "#16805d"}
              fillOpacity={Math.max(node.risk, 0.45)}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={isMetaNode ? 19 : 26}
              fill="none"
              stroke="rgba(14, 36, 51, 0.12)"
            />
            <text
              x={node.x}
              y={node.y + 36}
              textAnchor="middle"
              className="fill-ink text-[11px]"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
