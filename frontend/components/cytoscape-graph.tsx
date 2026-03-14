"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";

import type { GraphResponse } from "@/lib/types";

type CytoscapeGraphProps = {
  graph: GraphResponse;
};

export function CytoscapeGraph({ graph }: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cytoscapeRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();

  const handleRefocus = () => {
    if (cytoscapeRef.current) {
      cytoscapeRef.current.fit(undefined, 50);
    }
  };

  const getLightStyles = () => [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-wrap": "wrap",
        "text-max-width": "110px",
        "font-size": "12px",
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#1e293b",
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-y": -10,
        "text-background-color": "#ffffff",
        "text-background-opacity": 0.95,
        "text-background-padding": "4px",
        "background-color": "#f8fafc",
        "border-width": "2px",
        "border-color": "#cbd5e1",
        width: 56,
        height: 56,
        "text-outline-color": "#ffffff",
        "text-outline-width": 2,
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "font-size": "10px",
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#475569",
        "text-background-color": "#ffffff",
        "text-background-opacity": 0.9,
        "text-background-padding": "2px",
        "text-rotation": "autorotate",
        width: "3px",
        "line-color": "#94a3b8",
        "target-arrow-color": "#94a3b8",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 0.9,
        opacity: 0.9,
        "text-outline-color": "#ffffff",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".source",
      style: {
        "background-color": "#1e293b",
        color: "#ffffff",
        "border-color": "#334155",
        "text-outline-color": "#1e293b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".recipient",
      style: {
        "background-color": "#64748b",
        "border-color": "#475569",
        color: "#ffffff",
        "text-outline-color": "#64748b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".safe",
      style: {
        "background-color": "#64748b",
        "border-color": "#475569",
        color: "#ffffff",
        "text-outline-color": "#64748b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".suspicious",
      style: {
        "background-color": "#475569",
        "border-color": "#334155",
        color: "#ffffff",
        "text-outline-color": "#475569",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".cashout",
      style: {
        shape: "diamond",
        "background-color": "#334155",
        "border-color": "#1e293b",
        color: "#ffffff",
        "text-outline-color": "#334155",
        "text-outline-width": 2,
      },
    },
    {
      selector: "node.highlighted",
      style: {
        "border-width": "4px",
        "border-color": "#475569",
        "overlay-opacity": 0,
        "box-shadow": "0 0 12px rgba(71, 85, 105, 0.4)",
      },
    },
    {
      selector: "edge.highlighted",
      style: {
        width: "5px",
        "line-color": "#475569",
        "target-arrow-color": "#475569",
      },
    },
    {
      selector: "edge.branch",
      style: {
        width: "4px",
        "line-color": "#64748b",
        "target-arrow-color": "#64748b",
      },
    },
    {
      selector: "edge:not(.highlighted):not(.branch)",
      style: {
        opacity: 0.6,
        width: "2px",
      },
    },
  ];

  const getDarkStyles = () => [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-wrap": "wrap",
        "text-max-width": "110px",
        "font-size": "12px",
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#f8fafc",
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-y": -10,
        "text-background-color": "#1e293b",
        "text-background-opacity": 0.92,
        "text-background-padding": "4px",
        "background-color": "#334155",
        "border-width": "2px",
        "border-color": "#475569",
        width: 56,
        height: 56,
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "font-size": "10px",
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#94a3b8",
        "text-background-color": "#1e293b",
        "text-background-opacity": 0.9,
        "text-background-padding": "2px",
        "text-rotation": "autorotate",
        width: "3px",
        "line-color": "#475569",
        "target-arrow-color": "#475569",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 0.9,
        opacity: 0.9,
      },
    },
    {
      selector: ".source",
      style: {
        "background-color": "#0f172a",
        color: "#f8fafc",
        "border-color": "#1e293b",
        "text-outline-color": "#0f172a",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".recipient",
      style: {
        "background-color": "#94a3b8",
        "border-color": "#64748b",
        color: "#f8fafc",
        "text-outline-color": "#94a3b8",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".safe",
      style: {
        "background-color": "#94a3b8",
        "border-color": "#64748b",
        color: "#f8fafc",
        "text-outline-color": "#94a3b8",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".suspicious",
      style: {
        "background-color": "#64748b",
        "border-color": "#475569",
        color: "#f8fafc",
        "text-outline-color": "#64748b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".cashout",
      style: {
        shape: "diamond",
        "background-color": "#475569",
        "border-color": "#334155",
        color: "#f8fafc",
        "text-outline-color": "#475569",
        "text-outline-width": 2,
      },
    },
    {
      selector: "node.highlighted",
      style: {
        "border-width": "4px",
        "border-color": "#64748b",
        "overlay-opacity": 0,
        "box-shadow": "0 0 12px rgba(100, 163, 184, 0.6)",
      },
    },
    {
      selector: "edge.highlighted",
      style: {
        width: "5px",
        "line-color": "#64748b",
        "target-arrow-color": "#64748b",
      },
    },
    {
      selector: "edge.branch",
      style: {
        width: "4px",
        "line-color": "#94a3b8",
        "target-arrow-color": "#94a3b8",
      },
    },
    {
      selector: "edge:not(.highlighted):not(.branch)",
      style: {
        opacity: 0.45,
        width: "2px",
      },
    },
  ];

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const styles = resolvedTheme === "dark" ? getDarkStyles() : getLightStyles();

    const instance = cytoscape({
      container: containerRef.current,
      elements: [...graph.nodes, ...graph.edges],
      layout: {
        name: "cose",
        padding: 36,
        animate: false,
        fit: true,
        nodeRepulsion: 160000,
        idealEdgeLength: 140,
        edgeElasticity: 90,
        nestingFactor: 0.7,
        gravity: 0.45,
      },
      style: styles as any,
    });

    cytoscapeRef.current = instance;

    return () => {
      instance.destroy();
    };
  }, [graph, resolvedTheme]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[520px] w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      <button
        onClick={handleRefocus}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Refocus graph"
        title="Refocus graph"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
