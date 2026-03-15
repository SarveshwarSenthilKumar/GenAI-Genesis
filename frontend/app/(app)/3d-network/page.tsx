"use client";

import { useState, useEffect } from "react";
import { ThreeNetworkGraph } from "@/components/three-network-graph";
import { RefreshCw, Download, Eye, EyeOff, RotateCcw, Zap } from "lucide-react";
import type { GraphResponse, LiveMonitorGraph } from "@/lib/types";

export default function ThreeDNetworkPage() {
  const [graph, setGraph] = useState<GraphResponse | LiveMonitorGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"transaction" | "live">("transaction");
  const [selectedTransaction, setSelectedTransaction] = useState<string>("tx_blocked_001");
  const [showStats, setShowStats] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Sample transaction IDs from demo data
  const sampleTransactions = [
    { id: "tx_blocked_001", label: "Blocked Transaction" },
    { id: "tx_review_001", label: "Review Required" }, 
    { id: "tx_normal_001", label: "Normal Transaction" }
  ];

  const loadTransactionGraph = async (transactionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}/graph`);
      if (!response.ok) {
        throw new Error(`Failed to load graph: ${response.statusText}`);
      }
      const data = await response.json();
      setGraph(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveMonitorGraph = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/live/bootstrap");
      if (!response.ok) {
        throw new Error(`Failed to load live graph: ${response.statusText}`);
      }
      const data = await response.json();
      setGraph(data.graph);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "transaction") {
      loadTransactionGraph(selectedTransaction);
    } else {
      loadLiveMonitorGraph();
    }
  }, [viewMode, selectedTransaction]);

  const handleRefresh = () => {
    if (viewMode === "transaction") {
      loadTransactionGraph(selectedTransaction);
    } else {
      loadLiveMonitorGraph();
    }
  };

  const handleExport = () => {
    // Export current graph data as JSON
    if (graph) {
      const dataStr = JSON.stringify(graph, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `network-graph-${viewMode}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getGraphStats = () => {
    if (!graph) return null;
    
    if (viewMode === "live") {
      const liveGraph = graph as LiveMonitorGraph;
      return {
        nodes: liveGraph.nodes.length,
        edges: liveGraph.edges.length,
        highRiskNodes: liveGraph.nodes.filter(n => n.risk > 0.7).length,
        highRiskEdges: liveGraph.edges.filter(e => e.risk > 0.7).length,
      };
    } else {
      const graphResponse = graph as GraphResponse;
      return {
        nodes: graphResponse.nodes.length,
        edges: graphResponse.edges.length,
        suspiciousClusters: graphResponse.suspicious_cluster_ids?.length || 0,
        highlightedNodes: graphResponse.highlighted_node_ids?.length || 0,
      };
    }
  };

  const stats = getGraphStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            3D Network Intelligence
          </h1>
          <p className="text-slate-400 text-lg">
            Explore entity relationships in immersive 3D space
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("transaction")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "transaction"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Transaction View
              </button>
              <button
                onClick={() => setViewMode("live")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "live"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Monitor
              </button>
            </div>

            {/* Transaction Selector */}
            {viewMode === "transaction" && (
              <select
                value={selectedTransaction}
                onChange={(e) => setSelectedTransaction(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sampleTransactions.map(tx => (
                  <option key={tx.id} value={tx.id}>{tx.label}</option>
                ))}
              </select>
            )}

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showStats 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {showStats ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Stats
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRotate 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Auto Rotate
            </button>

            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
              <Zap className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-white text-sm">{animationSpeed.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Nodes</div>
              <div className="text-2xl font-bold text-white">{stats.nodes}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Edges</div>
              <div className="text-2xl font-bold text-white">{stats.edges}</div>
            </div>
            {viewMode === "live" ? (
              <>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="text-slate-400 text-sm mb-1">High Risk Nodes</div>
                  <div className="text-2xl font-bold text-red-400">{stats.highRiskNodes}</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="text-slate-400 text-sm mb-1">High Risk Edges</div>
                  <div className="text-2xl font-bold text-orange-400">{stats.highRiskEdges}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="text-slate-400 text-sm mb-1">Suspicious Clusters</div>
                  <div className="text-2xl font-bold text-red-400">{stats.suspiciousClusters}</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="text-slate-400 text-sm mb-1">Highlighted Nodes</div>
                  <div className="text-2xl font-bold text-blue-400">{stats.highlightedNodes}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3D Graph Container */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading 3D Network...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg z-10">
              <div className="text-center max-w-md">
                <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
                <p className="text-white text-lg mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && graph && (
            <ThreeNetworkGraph 
              graph={graph} 
              isLiveMonitor={viewMode === "live"}
              autoRotate={autoRotate}
              animationSpeed={animationSpeed}
            />
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">About 3D Network Visualization</h2>
          <div className="grid md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">🎯 Interactive Features</h3>
              <ul className="space-y-1 text-sm">
                <li>• Click and drag to rotate the camera around the network</li>
                <li>• Right-click and drag to pan the view</li>
                <li>• Scroll to zoom in and out</li>
                <li>• Click on nodes to select and highlight them</li>
                <li>• Hover over nodes for interactive effects</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">🔍 Visual Indicators</h3>
              <ul className="space-y-1 text-sm">
                <li>• Node size represents entity importance</li>
                <li>• Node color indicates entity type and risk level</li>
                <li>• Red indicators show high-risk entities</li>
                <li>• Edge thickness represents transaction volume</li>
                <li>• Animated effects highlight suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
