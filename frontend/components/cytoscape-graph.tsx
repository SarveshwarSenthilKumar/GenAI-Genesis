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
        "background-color": "#f59e0b",
        "border-color": "#d97706",
        color: "#ffffff",
        "text-outline-color": "#f59e0b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".safe",
      style: {
        "background-color": "#10b981",
        "border-color": "#059669",
        color: "#ffffff",
        "text-outline-color": "#10b981",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".suspicious",
      style: {
        "background-color": "#ef4444",
        "border-color": "#dc2626",
        color: "#ffffff",
        "text-outline-color": "#ef4444",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".cashout",
      style: {
        shape: "diamond",
        "background-color": "#7c3aed",
        "border-color": "#6d28d9",
        color: "#ffffff",
        "text-outline-color": "#7c3aed",
        "text-outline-width": 2,
      },
    },
    {
      selector: "node.highlighted",
      style: {
        "border-width": "4px",
        "border-color": "#ef4444",
        "overlay-opacity": 0,
        "box-shadow": "0 0 12px rgba(239, 68, 68, 0.4)",
      },
    },
    {
      selector: "edge.highlighted",
      style: {
        width: "5px",
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
      },
    },
    {
      selector: "edge.branch",
      style: {
        width: "4px",
        "line-color": "#f59e0b",
        "target-arrow-color": "#f59e0b",
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
        "background-color": "#f59e0b",
        "border-color": "#d97706",
        color: "#f8fafc",
        "text-outline-color": "#f59e0b",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".safe",
      style: {
        "background-color": "#10b981",
        "border-color": "#059669",
        color: "#f8fafc",
        "text-outline-color": "#10b981",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".suspicious",
      style: {
        "background-color": "#ef4444",
        "border-color": "#dc2626",
        color: "#f8fafc",
        "text-outline-color": "#ef4444",
        "text-outline-width": 2,
      },
    },
    {
      selector: ".cashout",
      style: {
        shape: "diamond",
        "background-color": "#7c3aed",
        "border-color": "#6d28d9",
        color: "#f8fafc",
        "text-outline-color": "#7c3aed",
        "text-outline-width": 2,
      },
    },
    {
      selector: "node.highlighted",
      style: {
        "border-width": "4px",
        "border-color": "#ef4444",
        "overlay-opacity": 0,
        "box-shadow": "0 0 12px rgba(239, 68, 68, 0.6)",
      },
    },
    {
      selector: "edge.highlighted",
      style: {
        width: "5px",
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
      },
    },
    {
      selector: "edge.branch",
      style: {
        width: "4px",
        "line-color": "#f59e0b",
        "target-arrow-color": "#f59e0b",
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
      <div ref={containerRef} className="h-[520px] w-full rounded-[24px] bg-[#fffdf9] dark:bg-[#1e293b]" />
      <button
        onClick={handleRefocus}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas/70 text-ink transition-colors hover:bg-paper dark:bg-surface/70 dark:text-ink dark:hover:bg-surface"
        aria-label="Refocus graph"
        title="Refocus graph"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
