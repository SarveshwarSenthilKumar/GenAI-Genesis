"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import cytoscape from "cytoscape";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useTheme } from "next-themes";

import type { GraphResponse } from "@/lib/types";

type CytoscapeGraphProps = {
  graph: GraphResponse;
  enableReplay?: boolean;
};

type GraphSelection =
  {
    kind: "edge";
    id: string;
    source: string;
    target: string;
    amount: string;
    timestamp: string;
    relationship: string;
  };

type EdgeHoverState = {
  id: string;
  amount: string;
  timestamp: string;
  left: number;
  top: number;
};

export function CytoscapeGraph({ graph, enableReplay = false }: CytoscapeGraphProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const replayPanelRef = useRef<HTMLDivElement | null>(null);
  const cytoscapeRef = useRef<any>(null);
  const clampViewportRef = useRef<(() => void) | null>(null);
  const hoveredEdgeIdRef = useRef<string | null>(null);
  const replayTimerRef = useRef<number | null>(null);
  const replayResizeRafRef = useRef<number | null>(null);
  const isResizingReplayPanelRef = useRef(false);
  const isClampingRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties | null>(null);
  const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(null);
  const [selection, setSelection] = useState<GraphSelection | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<EdgeHoverState | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isReplayPanelOpen, setIsReplayPanelOpen] = useState(false);
  const [replayPanelWidth, setReplayPanelWidth] = useState(544);

  const TRANSITION_MS = 320;
  const REPLAY_STEP_MS = 600;
  const replaySteps = useMemo(() => buildReplaySteps(graph), [graph]);
  const replayEnabled = Boolean(enableReplay && replaySteps.length >= 3);
  const currentReplayStep =
    replayEnabled && activeStepIndex >= 0 ? replaySteps[activeStepIndex] : null;
  const replayStatusLabel = replayEnabled
    ? `${Math.max(activeStepIndex + 1, 0)} of ${replaySteps.length} transfers`
    : null;

  useEffect(() => {
    if (!enableReplay) {
      setIsReplayPanelOpen(false);
    }
  }, [enableReplay]);

  const handleRefocus = () => {
    if (cytoscapeRef.current) {
      cytoscapeRef.current.fit(undefined, 50);
      clampViewportRef.current?.();
    }
  };

  const startReplay = () => {
    if (!replayEnabled) {
      return;
    }

    setIsPaused(false);
    setIsReplaying(true);
    setActiveStepIndex((current) => {
      if (current >= replaySteps.length - 1) {
        return 0;
      }

      return current < 0 ? 0 : current;
    });
  };

  const pauseReplay = () => {
    setIsReplaying(false);
    setIsPaused(true);
  };

  const stepReplay = () => {
    if (!replayEnabled) {
      return;
    }

    setIsReplaying(false);
    setIsPaused(true);
    setActiveStepIndex((current) => Math.min(current + 1, replaySteps.length - 1));
  };

  const resetReplay = () => {
    setIsReplaying(false);
    setIsPaused(false);
    setActiveStepIndex(-1);
  };

  const fitGraphSoon = () => {
    window.setTimeout(() => {
      if (cytoscapeRef.current) {
        cytoscapeRef.current.resize();
        cytoscapeRef.current.fit(undefined, isFullscreen ? 90 : 50);
        clampViewportRef.current?.();
      }
    }, TRANSITION_MS + 20);
  };

  const handleReplayResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!replayPanelRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    isResizingReplayPanelRef.current = true;
    const panelRect = replayPanelRef.current.getBoundingClientRect();

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!replayPanelRef.current) {
        return;
      }

      const wrapperWidth = wrapperRef.current?.clientWidth ?? window.innerWidth;
      const minimumWidth = 360;
      const maximumWidth = Math.min(760, wrapperWidth - 32);
      const nextWidth = clampNumber(moveEvent.clientX - panelRect.left, minimumWidth, maximumWidth);

      if (replayResizeRafRef.current) {
        window.cancelAnimationFrame(replayResizeRafRef.current);
      }

      replayResizeRafRef.current = window.requestAnimationFrame(() => {
        setReplayPanelWidth(nextWidth);
      });
    };

    const onPointerUp = () => {
      isResizingReplayPanelRef.current = false;
      if (replayResizeRafRef.current) {
        window.cancelAnimationFrame(replayResizeRafRef.current);
        replayResizeRafRef.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const enterFullscreen = () => {
    if (!wrapperRef.current || isTransitioning || isFullscreen) {
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    setPlaceholderHeight(rect.height);
    setIsTransitioning(true);
    setIsFullscreen(true);
    setOverlayStyle({
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 60,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOverlayStyle({
          position: "fixed",
          top: 16,
          left: 16,
          width: window.innerWidth - 32,
          height: window.innerHeight - 32,
          zIndex: 60,
        });
      });
    });

    fitGraphSoon();
    window.setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_MS);
  };

  const exitFullscreen = () => {
    if (!isFullscreen || isTransitioning) {
      return;
    }

    const targetRect = placeholderRef.current?.getBoundingClientRect();
    if (!targetRect) {
      setIsFullscreen(false);
      setOverlayStyle(null);
      setPlaceholderHeight(null);
      return;
    }

    setIsTransitioning(true);
    setOverlayStyle({
      position: "fixed",
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      zIndex: 60,
    });

    window.setTimeout(() => {
      setIsFullscreen(false);
      setIsTransitioning(false);
      setOverlayStyle(null);
      setPlaceholderHeight(null);
      if (cytoscapeRef.current) {
        cytoscapeRef.current.resize();
        cytoscapeRef.current.fit(undefined, 50);
        clampViewportRef.current?.();
      }
    }, TRANSITION_MS);
  };

  const getLightStyles = () => [
    {
      selector: "node",
      style: {
        label: isFullscreen ? "data(label)" : "",
        "background-color": "#f8fafc",
        "border-width": "2px",
        "border-color": "#cbd5e1",
        width: isFullscreen ? 106 : 56,
        height: isFullscreen ? 106 : 56,
        "font-size": isFullscreen ? "15px" : "0px",
        "font-weight": 700,
        color: isFullscreen ? "#e2e8f0" : "#0f172a",
        "text-wrap": isFullscreen ? "wrap" : "none",
        "text-max-width": isFullscreen ? 88 : 0,
        "text-valign": "center",
        "text-halign": "center",
        "text-outline-width": 0,
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "font-size": "12px",
        "font-weight": 700,
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#334155",
        "text-background-color": "#ffffff",
        "text-background-opacity": 0.96,
        "text-background-padding": "4px",
        "text-background-shape": "roundrectangle",
        "text-rotation": "autorotate",
        "text-margin-y": -12,
        width: "3px",
        "line-color": "#94a3b8",
        "target-arrow-color": "#94a3b8",
        "target-arrow-shape": "triangle",
        "target-distance-from-node": 6,
        "source-distance-from-node": 4,
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
        color: "#7c2d12",
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
    {
      selector: "node:selected",
      style: {
        "border-width": "4px",
        "border-color": "#60a5fa",
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: "6px",
        "line-color": "#60a5fa",
        "target-arrow-color": "#60a5fa",
      },
    },
    {
      selector: "edge.replay-traversed-low",
      style: {
        width: "4px",
        opacity: 0.82,
        "line-color": "#60a5fa",
        "target-arrow-color": "#60a5fa",
      },
    },
    {
      selector: "edge.replay-traversed-medium",
      style: {
        width: "4px",
        opacity: 0.82,
        "line-color": "#fb923c",
        "target-arrow-color": "#fb923c",
      },
    },
    {
      selector: "edge.replay-traversed-high",
      style: {
        width: "4px",
        opacity: 0.9,
        "line-color": "#f43f5e",
        "target-arrow-color": "#f43f5e",
      },
    },
    {
      selector: "edge.replay-active-low",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#2563eb",
        "target-arrow-color": "#2563eb",
      },
    },
    {
      selector: "edge.replay-active-medium",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#f97316",
        "target-arrow-color": "#f97316",
      },
    },
    {
      selector: "edge.replay-active-high",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
      },
    },
    {
      selector: "node.replay-node-active",
      style: {
        "border-width": "4px",
        "border-color": "#ea580c",
      },
    },
    {
      selector: "node.replay-node-target",
      style: {
        "border-width": "5px",
        "border-color": "#2563eb",
      },
    },
  ];

  const getDarkStyles = () => [
    {
      selector: "node",
      style: {
        label: isFullscreen ? "data(label)" : "",
        "background-color": "#334155",
        "border-width": "2px",
        "border-color": "#475569",
        width: isFullscreen ? 106 : 56,
        height: isFullscreen ? 106 : 56,
        "font-size": isFullscreen ? "15px" : "0px",
        "font-weight": 700,
        color: "#f8fafc",
        "text-wrap": isFullscreen ? "wrap" : "none",
        "text-max-width": isFullscreen ? 88 : 0,
        "text-valign": "center",
        "text-halign": "center",
        "text-outline-width": 0,
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "font-size": "12px",
        "font-weight": 700,
        "font-family": "Avenir Next, Segoe UI, sans-serif",
        color: "#f8fafc",
        "text-background-color": "#0f172a",
        "text-background-opacity": 0.94,
        "text-background-padding": "4px",
        "text-background-shape": "roundrectangle",
        "text-rotation": "autorotate",
        "text-margin-y": -12,
        width: "3px",
        "line-color": "#475569",
        "target-arrow-color": "#475569",
        "target-arrow-shape": "triangle",
        "target-distance-from-node": 6,
        "source-distance-from-node": 4,
        "curve-style": "bezier",
        "arrow-scale": 0.9,
        opacity: 0.9,
        "text-outline-color": "#0f172a",
        "text-outline-width": 2,
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
        color: "#fef3c7",
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
    {
      selector: "node:selected",
      style: {
        "border-width": "4px",
        "border-color": "#93c5fd",
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: "6px",
        "line-color": "#93c5fd",
        "target-arrow-color": "#93c5fd",
      },
    },
    {
      selector: "edge.replay-traversed-low",
      style: {
        width: "4px",
        opacity: 0.82,
        "line-color": "#93c5fd",
        "target-arrow-color": "#93c5fd",
      },
    },
    {
      selector: "edge.replay-traversed-medium",
      style: {
        width: "4px",
        opacity: 0.82,
        "line-color": "#fb923c",
        "target-arrow-color": "#fb923c",
      },
    },
    {
      selector: "edge.replay-traversed-high",
      style: {
        width: "4px",
        opacity: 0.92,
        "line-color": "#fb7185",
        "target-arrow-color": "#fb7185",
      },
    },
    {
      selector: "edge.replay-active-low",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#60a5fa",
        "target-arrow-color": "#60a5fa",
      },
    },
    {
      selector: "edge.replay-active-medium",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#fb923c",
        "target-arrow-color": "#fb923c",
      },
    },
    {
      selector: "edge.replay-active-high",
      style: {
        width: "7px",
        opacity: 1,
        "line-color": "#f87171",
        "target-arrow-color": "#f87171",
      },
    },
    {
      selector: "node.replay-node-active",
      style: {
        "border-width": "4px",
        "border-color": "#fb923c",
      },
    },
    {
      selector: "node.replay-node-target",
      style: {
        "border-width": "5px",
        "border-color": "#60a5fa",
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
      minZoom: 0.45,
      maxZoom: 2.2,
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
    const buildEdgeHoverState = (edge: any): EdgeHoverState | null => {
      const container = containerRef.current;
      if (!container) {
        return null;
      }

      const midpoint = edge.renderedMidpoint();
      const tooltipWidth = isFullscreen ? 288 : 260;
      const tooltipHeight = 86;
      const gap = 12;
      const inset = 12;

      const left = clampNumber(
        midpoint.x - tooltipWidth / 2,
        inset,
        Math.max(inset, container.clientWidth - tooltipWidth - inset),
      );

      const preferredTop = midpoint.y - tooltipHeight - gap;
      const fallbackTop = midpoint.y + gap;
      const top =
        preferredTop >= inset
          ? preferredTop
          : clampNumber(
              fallbackTop,
              inset,
              Math.max(inset, container.clientHeight - tooltipHeight - inset),
            );

      return {
        id: String(edge.id()),
        amount: formatEdgeAmount(edge.data("amount"), edge.data("label")),
        timestamp: String(edge.data("timestamp") ?? "Time unavailable"),
        left,
        top,
      };
    };

    const syncHoveredEdge = () => {
      if (!hoveredEdgeIdRef.current) {
        return;
      }

      const edge = instance.getElementById(hoveredEdgeIdRef.current);
      if (!edge || edge.empty()) {
        hoveredEdgeIdRef.current = null;
        setHoveredEdge(null);
        return;
      }

      setHoveredEdge(buildEdgeHoverState(edge));
    };

    const selectEdge = (edge: any) => {
      instance.$(":selected").unselect();
      edge.select();
      setSelection({
        kind: "edge",
        id: String(edge.id()),
        source: String(edge.data("source")),
        target: String(edge.data("target")),
        amount: formatEdgeAmount(edge.data("amount"), edge.data("label")),
        timestamp: String(edge.data("timestamp") ?? "Time unavailable"),
        relationship: String(edge.data("label") ?? "Transfer"),
      });
    };

    instance.on("tap", "edge", (event) => {
      selectEdge(event.target);
    });

    instance.on("click", "edge", (event) => {
      selectEdge(event.target);
    });

    instance.on("tap", (event) => {
      if (event.target === instance) {
        instance.$(":selected").unselect();
        setSelection(null);
      }
    });

    instance.on("mousemove", (event) => {
      const target = event.target;

      if (target === instance) {
        hoveredEdgeIdRef.current = null;
        setHoveredEdge(null);
        return;
      }

      if (typeof target?.isEdge === "function" && target.isEdge()) {
        hoveredEdgeIdRef.current = String(target.id());
        setHoveredEdge(buildEdgeHoverState(target));
        return;
      }
    });

    instance.on("mouseout", () => {
      hoveredEdgeIdRef.current = null;
      setHoveredEdge(null);
    });

    const clampToViewport = () => {
      const container = containerRef.current;
      if (!container || instance.destroyed() || isClampingRef.current) {
        return;
      }

      const padding = isFullscreen ? 72 : 40;
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;
      const renderedBounds = instance.elements().renderedBoundingBox({
        includeLabels: true,
        includeOverlays: false,
      });

      if (!Number.isFinite(renderedBounds.w) || !Number.isFinite(renderedBounds.h)) {
        return;
      }

      const usableWidth = Math.max(viewportWidth - padding * 2, 0);
      const usableHeight = Math.max(viewportHeight - padding * 2, 0);
      const pan = instance.pan();
      let nextPanX = pan.x;
      let nextPanY = pan.y;

      if (renderedBounds.w <= usableWidth) {
        const graphCenterX = renderedBounds.x1 + renderedBounds.w / 2;
        nextPanX += viewportWidth / 2 - graphCenterX;
      } else {
        if (renderedBounds.x1 > padding) {
          nextPanX -= renderedBounds.x1 - padding;
        }
        if (renderedBounds.x2 < viewportWidth - padding) {
          nextPanX += viewportWidth - padding - renderedBounds.x2;
        }
      }

      if (renderedBounds.h <= usableHeight) {
        const graphCenterY = renderedBounds.y1 + renderedBounds.h / 2;
        nextPanY += viewportHeight / 2 - graphCenterY;
      } else {
        if (renderedBounds.y1 > padding) {
          nextPanY -= renderedBounds.y1 - padding;
        }
        if (renderedBounds.y2 < viewportHeight - padding) {
          nextPanY += viewportHeight - padding - renderedBounds.y2;
        }
      }

      const deltaX = nextPanX - pan.x;
      const deltaY = nextPanY - pan.y;

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        isClampingRef.current = true;
        instance.pan({ x: nextPanX, y: nextPanY });
        requestAnimationFrame(() => {
          isClampingRef.current = false;
        });
      }
    };

    clampViewportRef.current = clampToViewport;
    instance.on("pan", () => {
      if (isFullscreen) {
        clampToViewport();
      }
      syncHoveredEdge();
    });

    instance.on("zoom resize", () => {
      clampToViewport();
      syncHoveredEdge();
    });
    requestAnimationFrame(() => {
      clampToViewport();
      syncHoveredEdge();
    });

    return () => {
      clampViewportRef.current = null;
      hoveredEdgeIdRef.current = null;
      isClampingRef.current = false;
      setSelection(null);
      setHoveredEdge(null);
      instance.destroy();
    };
  }, [graph, isFullscreen, resolvedTheme]);

  useEffect(() => {
    const instance = cytoscapeRef.current;
    if (!instance) {
      return;
    }

    applyReplayClasses(instance, replayEnabled ? replaySteps : [], replayEnabled ? activeStepIndex : -1);
  }, [activeStepIndex, replayEnabled, replaySteps]);

  useEffect(() => {
    if (!replayEnabled) {
      setIsReplaying(false);
      setIsPaused(false);
      setActiveStepIndex(-1);
      return;
    }

    if (!isReplaying) {
      if (replayTimerRef.current) {
        window.clearTimeout(replayTimerRef.current);
        replayTimerRef.current = null;
      }
      return;
    }

    if (activeStepIndex < 0) {
      setActiveStepIndex(0);
      return;
    }

    if (activeStepIndex >= replaySteps.length - 1) {
      setIsReplaying(false);
      setIsPaused(false);
      return;
    }

    replayTimerRef.current = window.setTimeout(() => {
      setActiveStepIndex((current) => Math.min(current + 1, replaySteps.length - 1));
    }, REPLAY_STEP_MS);

    return () => {
      if (replayTimerRef.current) {
        window.clearTimeout(replayTimerRef.current);
        replayTimerRef.current = null;
      }
    };
  }, [activeStepIndex, isReplaying, replayEnabled, replaySteps.length]);

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) {
        window.clearTimeout(replayTimerRef.current);
      }
      if (replayResizeRafRef.current) {
        window.cancelAnimationFrame(replayResizeRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen, isTransitioning]);

  return (
    <>
      {isFullscreen && placeholderHeight ? (
        <div ref={placeholderRef} style={{ height: placeholderHeight }} />
      ) : null}

      {isFullscreen ? (
        <div
          className={`fixed inset-0 z-50 bg-[rgba(6,16,31,0.58)] backdrop-blur-[4px] transition-opacity duration-300 ${
            isFullscreen ? "opacity-100" : "opacity-0"
          }`}
          onClick={exitFullscreen}
        />
      ) : null}

      <div
        ref={wrapperRef}
        style={isFullscreen ? overlayStyle ?? undefined : undefined}
        className={`relative overflow-hidden transition-[top,left,width,height,border-radius,box-shadow,border-color,background-color] duration-300 ease-out ${
          isFullscreen
            ? "z-[60] rounded-[28px] border-transparent bg-transparent shadow-none"
            : ""
        }`}
      >
        <div
          ref={containerRef}
          className={`w-full ${isFullscreen ? "h-full min-h-[calc(100vh-2rem)]" : "h-[520px]"}`}
        />
        {enableReplay ? (
          <div className="absolute top-4 left-4 z-20 max-w-[min(calc(100%-6rem),42rem)]">
            <div
              className={`group inline-flex items-center gap-3 rounded-full border border-line/80 bg-canvas/88 px-4 py-3 text-left shadow-frame backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-canvas ${
                isReplayPanelOpen ? "pointer-events-none opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <button
                type="button"
                onClick={startReplay}
                disabled={!replayEnabled}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isPaused ? "Resume replay" : "Start replay"}
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsReplayPanelOpen(true)}
                className="min-w-0 text-left"
              >
                <span className="block text-xs uppercase tracking-[0.16em] text-muted">
                  Replay money flow
                </span>
                <span className="mt-1 block text-sm text-ink">
                  {replayEnabled ? replayStatusLabel : "Timeline unavailable"}
                </span>
              </button>
            </div>

            <div
              ref={replayPanelRef}
              className={`relative origin-top-left rounded-[22px] border border-line/80 bg-canvas/92 p-4 shadow-frame backdrop-blur transition-all duration-300 ease-out ${
                isReplayPanelOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-3 scale-95 opacity-0"
              }`}
              style={{
                width: `min(${Math.round(replayPanelWidth)}px, calc(100vw - 4rem), calc(100% - 1rem))`,
                transitionProperty: isResizingReplayPanelRef.current
                  ? "transform, opacity"
                  : "width, transform, opacity",
              }}
            >
              {replayEnabled ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Replay money flow</p>
                      <p className="mt-1 text-sm text-muted">
                        {replayStatusLabel} · {currentReplayStep ? currentReplayStep.timestamp : "Static graph"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReplayPanelOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                    >
                      <Minimize2 className="h-4 w-4" />
                      Minimize
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={startReplay}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                    >
                      <Play className="h-4 w-4" />
                      {isPaused ? "Resume" : "Replay"}
                    </button>
                    <button
                      type="button"
                      onClick={pauseReplay}
                      disabled={!isReplaying}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={stepReplay}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                    >
                      <StepForward className="h-4 w-4" />
                      Step
                    </button>
                    <button
                      type="button"
                      onClick={resetReplay}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(replaySteps.length - 1, 0)}
                      step={1}
                      value={Math.max(activeStepIndex, 0)}
                      onChange={(event) => {
                        setIsReplaying(false);
                        setIsPaused(true);
                        setActiveStepIndex(Number(event.target.value));
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-[#2563eb]"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                      <span>{replaySteps[0]?.timestamp}</span>
                      <span>{currentReplayStep?.timestamp ?? replaySteps[0]?.timestamp}</span>
                      <span>{replaySteps[replaySteps.length - 1]?.timestamp}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Replay money flow</p>
                      <p className="mt-1 text-sm text-muted">
                        Replay becomes available when this graph has at least 3 timestamped transfers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReplayPanelOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                    >
                      <Minimize2 className="h-4 w-4" />
                      Minimize
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onPointerDown={handleReplayResizeStart}
                className="absolute bottom-2 right-2 h-5 w-5 cursor-ew-resize rounded-full border border-line/70 bg-paper/90 text-transparent shadow-sm transition hover:bg-canvas"
                aria-label="Resize replay panel"
                title="Drag to resize"
              />
            </div>
          </div>
        ) : null}
        {hoveredEdge ? (
          <div
            className="pointer-events-none absolute z-20 w-64 rounded-[14px] border border-line/80 bg-canvas/92 px-3 py-2 text-xs text-ink shadow-frame backdrop-blur sm:w-[17rem]"
            style={{
              left: hoveredEdge.left,
              top: hoveredEdge.top,
            }}
          >
            <p className="font-semibold text-ink">{hoveredEdge.amount}</p>
            <p className="mt-1 text-muted">{hoveredEdge.timestamp}</p>
          </div>
        ) : null}
        {selection ? (
          <div className="absolute bottom-4 left-4 z-20 max-w-[20rem] rounded-[18px] border border-line/80 bg-canvas/92 p-4 text-sm shadow-frame backdrop-blur">
            <>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Selected edge</p>
              <p className="mt-2 font-semibold text-ink">
                {selection.source} {"->"} {selection.target}
              </p>
              <p className="mt-1 text-muted">{selection.relationship}</p>
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Amount</dt>
                  <dd className="text-ink">{selection.amount}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Time</dt>
                  <dd className="text-ink">{selection.timestamp}</dd>
                </div>
              </dl>
            </>
          </div>
        ) : null}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isFullscreen ? (
            <button
              onClick={exitFullscreen}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-canvas/82 px-4 text-sm text-ink transition-colors hover:bg-paper dark:bg-surface/82 dark:hover:bg-surface"
              aria-label="Exit full screen"
              title="Exit full screen"
            >
              <Minimize2 className="h-4 w-4" />
              Exit full screen
              <span className="rounded-full border border-line/70 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">
                Esc
              </span>
            </button>
          ) : (
            <button
              onClick={enterFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas/70 text-ink transition-colors hover:bg-paper dark:bg-surface/70 dark:text-ink dark:hover:bg-surface"
              aria-label="Open full screen"
              title="Open full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

type ReplayStep = {
  edgeId: string;
  source: string;
  target: string;
  timestamp: string;
  parsedTime: number;
  replayLevel: "low" | "medium" | "high";
};

function buildReplaySteps(graph: GraphResponse): ReplayStep[] {
  return graph.edges
    .map((edge, index) => {
      const data = edge.data ?? {};
      const timestamp = String(data.timestamp ?? "");
      const parsedTime = Date.parse(timestamp);

      return {
        edgeId: String(data.id ?? `edge-${index}`),
        source: String(data.source ?? ""),
        target: String(data.target ?? ""),
        timestamp,
        parsedTime,
        replayLevel: replayLevelForClasses(String(edge.classes ?? "")),
        index,
      };
    })
    .filter((edge) => edge.source && edge.target && edge.timestamp && Number.isFinite(edge.parsedTime))
    .sort((left, right) =>
      left.parsedTime === right.parsedTime ? left.index - right.index : left.parsedTime - right.parsedTime,
    )
    .map(({ index: _index, ...edge }) => edge);
}

function applyReplayClasses(instance: any, replaySteps: ReplayStep[], activeStepIndex: number) {
  instance
    .elements()
    .removeClass(
      "replay-active-low replay-active-medium replay-active-high replay-traversed-low replay-traversed-medium replay-traversed-high replay-node-active replay-node-target",
    );

  if (activeStepIndex < 0 || !replaySteps.length) {
    return;
  }

  replaySteps.slice(0, activeStepIndex + 1).forEach((step, index) => {
    const edge = instance.getElementById(step.edgeId);
    if (!edge || edge.empty()) {
      return;
    }

    edge.addClass(
      index === activeStepIndex
        ? `replay-active-${step.replayLevel}`
        : `replay-traversed-${step.replayLevel}`,
    );

    const sourceNode = instance.getElementById(step.source);
    const targetNode = instance.getElementById(step.target);

    if (sourceNode && !sourceNode.empty()) {
      sourceNode.addClass("replay-node-active");
    }
    if (targetNode && !targetNode.empty()) {
      targetNode.addClass("replay-node-active");
      if (index === activeStepIndex) {
        targetNode.addClass("replay-node-target");
      }
    }
  });
}

function replayLevelForClasses(classes: string): "low" | "medium" | "high" {
  if (classes.includes("highlighted") || classes.includes("suspicious")) {
    return "high";
  }
  if (classes.includes("branch") || classes.includes("recipient")) {
    return "medium";
  }
  return "low";
}

function formatEdgeAmount(amount: unknown, fallbackLabel: unknown) {
  if (typeof amount === "string" && amount.length) {
    const parsed = Number(amount);
    if (Number.isFinite(parsed)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(parsed);
    }
  }

  if (typeof fallbackLabel === "string" && fallbackLabel.length) {
    return fallbackLabel;
  }

  return "Transfer";
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
