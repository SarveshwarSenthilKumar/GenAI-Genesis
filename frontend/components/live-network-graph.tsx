"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, Move } from "lucide-react";
import type { LiveMonitorGraph } from "@/lib/types";

const WIDTH = 1200;
const HEIGHT = 640;
const DEFAULT_ZOOM = 1.1;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 2.4;
const KIND_FILL: Record<string, string> = {
  account: "#16805d",
  mule: "#d98a1b",
  cashout: "#b9382f",
  device: "#355c7d",
  ip: "#6c5b7b",
  beneficiary: "#7c8b39",
};

const KIND_BORDER: Record<string, string> = {
  account: "#0f4f3a",
  mule: "#b87310",
  cashout: "#8d2a1f",
  device: "#2a4258",
  ip: "#5a4860",
  beneficiary: "#5a6a2a",
};

export function LiveNetworkGraph({ graph }: { graph: LiveMonitorGraph }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  if (!graph.nodes.length) {
    return (
      <div className="flex h-[640px] items-center justify-center rounded-[24px] border border-line/70 bg-paper/70 text-sm text-muted">
        Waiting for enough suspicious activity to build a focused entity graph.
      </div>
    );
  }

  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const radius = Math.min(WIDTH, HEIGHT) * 0.39;

  const positionedNodes = graph.nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(graph.nodes.length, 1);
    const squash =
      node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary"
        ? 0.58
        : 0.8;

    // Ensure consistent precision to avoid hydration mismatches
    const x = Math.round((centerX + Math.cos(angle) * radius) * 100) / 100;
    const y = Math.round((centerY + Math.sin(angle) * radius * squash) * 100) / 100;

    return {
      ...node,
      x,
      y,
    };
  });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.15, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev * 0.9, MIN_ZOOM));
  };

  const handleRefocus = () => {
    setZoomLevel(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  };

  const togglePanning = () => {
    setIsPanning(!isPanning);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta)));
  };

  const nodeMap = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));
  const centeredPan = {
    x: pan.x + (WIDTH - WIDTH * zoomLevel) / 2,
    y: pan.y + (HEIGHT - HEIGHT * zoomLevel) / 2,
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[640px] w-full rounded-[24px] border border-line/70 bg-paper/70"
        role="img"
        aria-label="Live entity graph"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
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
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.1"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g transform={`translate(${centeredPan.x}, ${centeredPan.y}) scale(${zoomLevel})`}>
          <rect width={WIDTH} height={HEIGHT} fill="url(#monitor-grid)" />

      {graph.edges.map((edge, index) => {
        const source = nodeMap[edge.source];
        const target = nodeMap[edge.target];
        if (!source || !target) {
          return null;
        }

            const isHighRisk = edge.risk > 0.8;
            const strokeWidth = isHighRisk ? 3 : 2;
            const strokeColor = isHighRisk ? "#b9382f" : "#7a8a7d";

            return (
              <g key={`${edge.source}-${edge.target}-${index}`}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity="0.8"
                  strokeLinecap="round"
                />
                {(edge.amount || edge.label) && (
                  <g>
                    <rect
                      x={(source.x + target.x) / 2 - 30}
                      y={(source.y + target.y) / 2 - 10}
                      width="60"
                      height="20"
                      fill="white"
                      fillOpacity="0.9"
                      stroke={strokeColor}
                      strokeWidth="0.5"
                      rx="4"
                    />
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 + 4}
                      textAnchor="middle"
                      className="fill-slate-700 text-[10px] font-medium"
                    >
                      {edge.amount ? formatMoney(edge.amount) : edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
      })}

          {positionedNodes.map((node) => {
            const isMetaNode =
              node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary";
            const nodeRadius = isMetaNode ? 16 : 22;
            const outerRadius = nodeRadius + 6;
            
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={outerRadius}
                  fill="none"
                  stroke={KIND_BORDER[node.kind] ?? "#0f4f3a"}
                  strokeWidth="2"
                  strokeOpacity="0.3"
                />
                
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={KIND_FILL[node.kind] ?? "#16805d"}
                  fillOpacity={Math.max(node.risk, 0.6)}
                  stroke={KIND_BORDER[node.kind] ?? "#0f4f3a"}
                  strokeWidth="2"
                  filter="url(#node-shadow)"
                />
                
                {node.risk > 0.7 && (
                  <circle
                    cx={node.x + nodeRadius * 0.7}
                    cy={node.y - nodeRadius * 0.7}
                    r="4"
                    fill="#b9382f"
                    stroke="white"
                    strokeWidth="1"
                  />
                )}
                
                <g>
                  <rect
                    x={node.x - 40}
                    y={node.y + nodeRadius + 8}
                    width="80"
                    height="18"
                    fill="white"
                    fillOpacity="0.95"
                    stroke="rgba(14, 36, 51, 0.1)"
                    strokeWidth="0.5"
                    rx="3"
                  />
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 20}
                    textAnchor="middle"
                    className="fill-slate-700 text-[11px] font-medium"
                  >
                    {node.label.length > 12 ? node.label.substring(0, 12) + "..." : node.label}
                  </text>
                </g>
                
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className="fill-white text-[9px] font-bold uppercase"
                >
                  {node.kind.charAt(0)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-3 w-3" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-3 w-3" />
        </button>
        <button
          onClick={togglePanning}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            isPanning 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label="Toggle panning"
          title={isPanning ? 'Panning enabled' : 'Enable panning'}
        >
          <Move className="h-3 w-3" />
        </button>
        <button
          onClick={handleRefocus}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Center graph"
          title="Center graph"
        >
          <Maximize2 className="h-3 w-3" />
          <span className="text-xs font-medium">Center</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        Zoom: {Math.round(zoomLevel * 100)}%
      </div>

      <div className="absolute bottom-4 left-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        Scroll page normally. Hold Ctrl/Cmd + wheel to zoom graph.
      </div>
      
      <div className="absolute top-4 left-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        {graph.nodes.length} nodes • {graph.edges.length} edges
      </div>

      <div className="absolute bottom-4 right-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 p-2">
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Entity Types</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(KIND_FILL).map(([kind, color]) => (
            <div key={kind} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full border border-slate-400"
                style={{ backgroundColor: color as string }}
              />
              <span className="text-slate-600 dark:text-slate-400 capitalize">{kind}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
