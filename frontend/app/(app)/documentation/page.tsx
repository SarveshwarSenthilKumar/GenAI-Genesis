"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Shield, Network, Users, Eye, TrendingUp, Cpu, Activity, Target, BarChart3 } from "lucide-react";

export default function DocumentationPage() {
  const { resolvedTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "System Overview", icon: Shield },
    { id: "accounts", title: "Account Types", icon: Users },
    { id: "detection", title: "Detection Methods", icon: Eye },
    { id: "network", title: "Network Analysis", icon: Network },
    { id: "behavioral", title: "Behavioral Analysis", icon: Activity },
    { id: "risk", title: "Risk Scoring", icon: TrendingUp },
    { id: "visualization", title: "Data Visualization", icon: BarChart3 },
  ];

  return (
    <div className="relative left-1/2 right-1/2 min-h-screen w-screen -translate-x-1/2 bg-slate-100 px-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 backdrop-blur-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sentinel Documentation</h1>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              AI-assisted fraud detection demo
            </div>
          </div>
        </div>
      </header>

      <div className="py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors border-l-4 ${
                      activeSection === section.id
                        ? "bg-slate-100 dark:bg-slate-800 border-l-slate-600 dark:border-l-slate-400 text-slate-900 dark:text-slate-100"
                        : "border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {activeSection === "overview" && <OverviewSection />}
            {activeSection === "accounts" && <AccountTypesSection />}
            {activeSection === "detection" && <DetectionMethodsSection />}
            {activeSection === "network" && <NetworkAnalysisSection />}
            {activeSection === "behavioral" && <BehavioralAnalysisSection />}
            {activeSection === "risk" && <RiskScoringSection />}
            {activeSection === "visualization" && <VisualizationSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          System Overview
        </h2>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Sentinel is a demo-first fraud analyst console that combines transaction anomaly scoring,
            deterministic rules, and network signals to surface suspicious activity. The live monitor
            uses a synthetic stream so you can see end-to-end detection behavior without connecting
            to production data sources.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                <Activity className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Live Demo Stream</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Refreshes a synthetic transaction window every few seconds for responsive demos
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                <Target className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Multi-layer Detection</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Combines anomaly scoring, rule evaluation, and network risk signals
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                <Cpu className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Explainable</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Deterministic signals drive decisions, with optional AI explanations
            </p>
          </div>
        </div>
      </div>

      {/* System Architecture Diagram */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">System Architecture</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            {/* Input Layer */}
            <div className="flex justify-center">
              <div className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold">
                Transaction Input
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {/* Processing Layer */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Behavioral Analysis
              </div>
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Network Analysis
              </div>
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Transaction Analysis
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {/* AI Layer */}
            <div className="flex justify-center">
              <div className="bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold">
                Risk Scoring
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {/* Output Layer */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Approve
              </div>
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Review
              </div>
              <div className="bg-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium">
                Block
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTypesSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Account Types (Demo Taxonomy)
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            The live monitor uses synthetic account personas to simulate realistic fraud patterns.
            These labels are not produced by a production classifier; they are used to generate
            the demo stream and drive network signals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Customer Accounts</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Regular user accounts in the synthetic stream.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- Normal transaction distribution</li>
              <li>- Stable device and IP history</li>
              <li>- Mixed transaction types</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mule Accounts</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Synthetic intermediaries used to model laundering paths.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- Higher fan-in and fan-out</li>
              <li>- Short hop chains</li>
              <li>- Ring participation</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cashout Nodes</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Endpoints representing cash-out risk in the demo graph.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- High-risk destinations</li>
              <li>- Short time-to-cashout</li>
              <li>- Used in ring evidence</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Bridge Accounts</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Accounts used to demonstrate review scenarios.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- One-hop exposure to mule clusters</li>
              <li>- Moderate risk signals</li>
              <li>- Highlighted in review cases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionMethodsSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Detection Methods
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            Sentinel combines anomaly scoring, deterministic rules, and network signals. The live
            monitor uses a synthetic stream; behavior scoring for sessions appears in the static
            case workflow.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Pattern recognition on amounts and timing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Anomaly Detection</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Unusual transaction amounts vs sender baseline</li>
                  <li>- Burst frequency (5m/1h/24h)</li>
                  <li>- Time since last transaction</li>
                  <li>- Geographic velocity anomalies</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Rule-Based Detection</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Velocity spikes</li>
                  <li>- New device + high amount</li>
                  <li>- Impossible travel patterns</li>
                  <li>- Smurfing and dormant reactivation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Behavioral Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Session and device context</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Session Signals (Cases)</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Login-to-transfer timing drift</li>
                  <li>- Navigation path similarity</li>
                  <li>- New device presence</li>
                  <li>- Payee added in session</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Device & Location (Live)</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- New device or IP</li>
                  <li>- Country mismatch vs sender home</li>
                  <li>- Shared device/IP across accounts</li>
                  <li>- Geo distance and velocity</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Network className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Network Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Relationship and flow risk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Graph Analysis</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Account relationships and flows</li>
                  <li>- Cycle and ring detection</li>
                  <li>- Shared infrastructure (device/IP)</li>
                  <li>- Cash-out exposure</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Network Metrics</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Fan-in and fan-out pressure</li>
                  <li>- Flow velocity scores</li>
                  <li>- Smurfing indicators</li>
                  <li>- Cluster size and evidence</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Cpu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Machine Learning</h3>
                <p className="text-slate-600 dark:text-slate-400">Unsupervised anomaly scoring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Unsupervised</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Isolation-forest style anomaly scoring</li>
                  <li>- Feature extraction from engineered signals</li>
                  <li>- Outlier detection on transaction vectors</li>
                  <li>- No supervised classifier in the demo</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">AI Explanations</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>- Optional LLM summaries for analysts</li>
                  <li>- Guardrails to avoid fabricated facts</li>
                  <li>- Uses deterministic signals as input</li>
                  <li>- Falls back to template explanations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkAnalysisSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Network Analysis
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            Network risk is computed from graph patterns observed in the transaction stream.
            The demo focuses on cycles, shared infrastructure, fan-in and fan-out, and cash-out
            exposure. It does not compute centrality or community detection scores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Graph Signals</h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- Circular transfer detection (rings)</li>
              <li>- Flow velocity across short hop chains</li>
              <li>- Shared device or IP infrastructure</li>
              <li>- Cash-out node exposure</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Network Metrics</h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>- Fan-in / fan-out pressure</li>
              <li>- Smurfing signal density</li>
              <li>- Cluster size and evidence</li>
              <li>- Network risk score aggregation</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Common Demo Patterns</h3>
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Circular Transfers</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Money moves through multiple accounts and returns to the origin within a short time window.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Fan-Out / Fan-In</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Funds branch out across several accounts and later converge on a cash-out destination.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Rapid Multi-Hop</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Transfers occur quickly across a short chain of accounts, increasing flow velocity risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BehavioralAnalysisSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Behavioral Analysis
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            Behavioral signals are derived from session context in the static case workflow, and
            from device/IP/country patterns in the live monitor. The demo does not capture click
            streams or full browser fingerprinting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Session Metrics (Cases)</h3>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span>Login-to-transfer time</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">baseline vs current</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Navigation path similarity</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">path match</span>
              </div>
              <div className="flex justify-between items-center">
                <span>New device</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">yes/no</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payee added in-session</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">yes/no</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Device & Location (Live)</h3>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span>New device or IP</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">seen before</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Country mismatch</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">home vs current</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Geo velocity</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">km/h</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shared infrastructure</span>
                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">device/IP overlap</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Behavioral Evidence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Account Takeover Signals</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>- New device with high value transfer</li>
                <li>- Country mismatch vs home profile</li>
                <li>- Rapid login-to-transfer timing</li>
                <li>- Multiple recipients in short window</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Behavior Drift</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>- Navigation flow divergence</li>
                <li>- Unusual transaction timing</li>
                <li>- New device/IP combinations</li>
                <li>- Elevated velocity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskScoringSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Risk Scoring System
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            The live monitor computes a final risk score by combining anomaly, rule, and network
            signals. These weights and thresholds are deterministic for the demo.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Risk Score Components</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Transaction Anomaly</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.35</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '35%'}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Rule Score</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.25</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '25%'}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Network Risk</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.40</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '40%'}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Decision Logic
          </h3>
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
            Sentinel now explains more than the final score. The live monitor highlights which
            signal family contributed the most, which signal changed the action the most, and what
            the outcome would have been if a key signal family were removed.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Top driver
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Identifies the strongest signal family for the alert, such as anomaly, rules, or
                network risk.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Tipping point
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Shows what moved the decision from one action band to another, such as from review
                to hold or from hold to block.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Counterfactuals
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Explains what would have happened without a signal family, for example:
                &quot;Without network evidence, this would be review.&quot;
              </p>
            </div>
          </div>

          <div className="mt-5 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Example
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Top driver:</span>{" "}
                Network
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Tipping point:</span>{" "}
                Network evidence moved this alert from review to block.
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Counterfactual:</span>{" "}
                Without network evidence, this would be review.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Business Impact
          </h3>
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
            Sentinel does more than flag risk. The live monitor translates screening results into
            business-facing outcomes so investigators, product teams, and judges can quickly see
            why the system matters operationally.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Suspicious dollars prevented
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Estimates the value of transfers Sentinel would have intercepted through hold or
                block recommendations in the current live window.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                High-risk accounts isolated
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Counts the accounts connected to severe incidents so analysts can understand how
                much exposure was contained, not just how many alerts were raised.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Analyst time saved
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Approximates how much manual triage time was reduced by prioritizing the queue and
                surfacing the strongest drivers automatically.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                False-positive reduction estimate
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Shows the expected improvement from combining anomaly, rules, and network evidence
                instead of relying on a one-dimensional threshold alone.
              </p>
            </div>
          </div>

          <div className="mt-5 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Why it matters
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              These metrics help Sentinel tell a stronger story than “we found fraud.” They show
              how much loss was potentially avoided, how much investigator effort was focused, and
              how much noise was reduced for the team reviewing live risk.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Allow</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">&lt; 0.50</p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              Low risk, auto-allow.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Review</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">0.50 - 0.69</p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              Medium risk, analyst review.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Hold</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">0.70 - 0.84</p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              High risk, hold pending verification.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Block</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">&gt;= 0.85</p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              Critical risk, block immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualizationSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          Data Visualization
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            The UI visualizes the live monitor snapshot: alerts, risk breakdowns, transaction
            stream, and the entity graph. Metrics are derived from the synthetic stream and are
            intended for demo storytelling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Risk Distribution</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Distribution of transaction risk scores in the current window.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Allow - Review - Hold - Block</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Alert Queue</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Prioritized alerts with evidence, actions, and risk breakdowns.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Severity - Action - Evidence</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Network className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Entity Graph</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Interactive graph of accounts, devices, IPs, and beneficiaries.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Nodes - Links - Risk</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Live Dashboard Metrics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Snapshot</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Synthetic stream</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alerts</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Current window count</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Latency</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Processing time per refresh</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Volume</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Suspicious flow total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
