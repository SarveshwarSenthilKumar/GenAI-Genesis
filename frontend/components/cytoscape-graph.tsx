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
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-wrap": "wrap",
            "text-max-width": "110px",
            "font-size": "12px",
            "font-family": "Avenir Next, Segoe UI, sans-serif",
            color: "#0e2433",
            "text-valign": "top",
            "text-halign": "center",
            "text-margin-y": -10,
            "text-background-color": "#fffdf9",
            "text-background-opacity": 0.92,
            "text-background-padding": "4px",
            "background-color": "#f3e7d6",
            "border-width": "2px",
            "border-color": "#dcc9af",
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
            color: "#6a7882",
            "text-background-color": "#fffdf9",
            "text-background-opacity": 0.9,
            "text-background-padding": "2px",
            "text-rotation": "autorotate",
            width: "3px",
            "line-color": "#bcc5ca",
            "target-arrow-color": "#bcc5ca",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.9,
            opacity: 0.9,
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
          selector: "node.highlighted",
          style: {
            "border-width": "4px",
            "border-color": "#b9382f",
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            width: "5px",
            "line-color": "#b9382f",
            "target-arrow-color": "#b9382f",
          },
        },
        {
          selector: "edge.branch",
          style: {
            width: "4px",
            "line-color": "#d98a1b",
            "target-arrow-color": "#d98a1b",
          },
        },
        {
          selector: "edge:not(.highlighted):not(.branch)",
          style: {
            opacity: 0.45,
            width: "2px",
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
