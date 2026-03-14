"use client";

import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

import type { GraphResponse } from "@/lib/types";

type CytoscapeGraphProps = {
  graph: GraphResponse;
};

export function CytoscapeGraph({ graph }: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const instance = cytoscape({
      container: containerRef.current,
      elements: [...graph.nodes, ...graph.edges],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 28,
        spacingFactor: 1.3,
        animate: false,
      },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-wrap": "wrap",
            "text-max-width": "90px",
            "font-size": "12px",
            "font-family": "Avenir Next, Segoe UI, sans-serif",
            color: "#0e2433",
            "background-color": "#f3e7d6",
            "border-width": "2px",
            "border-color": "#dcc9af",
            width: "56px",
            height: "56px",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "font-size": "10px",
            "font-family": "Avenir Next, Segoe UI, sans-serif",
            color: "#6a7882",
            width: "3px",
            "line-color": "#bcc5ca",
            "target-arrow-color": "#bcc5ca",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: ".source",
          style: {
            "background-color": "#0e2433",
            color: "#fffaf2",
            "border-color": "#0e2433",
          },
        },
        {
          selector: ".recipient",
          style: {
            "background-color": "#d98a1b",
            "border-color": "#c67912",
            color: "#fffaf2",
          },
        },
        {
          selector: ".safe",
          style: {
            "background-color": "#16805d",
            "border-color": "#116148",
            color: "#fffaf2",
          },
        },
        {
          selector: ".suspicious",
          style: {
            "background-color": "#b9382f",
            "border-color": "#8e2b24",
            color: "#fffaf2",
          },
        },
        {
          selector: ".cashout",
          style: {
            shape: "diamond",
            "background-color": "#6a1d1d",
            "border-color": "#4e1414",
            color: "#fffaf2",
          },
        },
        {
          selector: ".highlighted",
          style: {
            width: "5px",
            "line-color": "#b9382f",
            "target-arrow-color": "#b9382f",
          },
        },
        {
          selector: ".branch",
          style: {
            width: "4px",
            "line-color": "#d98a1b",
            "target-arrow-color": "#d98a1b",
          },
        },
      ],
    });

    return () => {
      instance.destroy();
    };
  }, [graph]);

  return <div ref={containerRef} className="h-[520px] w-full rounded-[24px] bg-[#fffdf9]" />;
}
