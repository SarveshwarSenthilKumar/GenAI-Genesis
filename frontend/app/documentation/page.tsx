"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Shield, AlertTriangle, Network, Users, Eye, TrendingUp, Database, Cpu, Globe, Lock, Activity, Zap, Target, BarChart3, PieChart, LineChart } from "lucide-react";

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sentinel Documentation</h1>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              AI-Powered Fraud Detection System
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors border ${
                      activeSection === section.id
                        ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{section.title}</span>
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
            Sentinel is an advanced AI-powered fraud detection system that combines multiple detection methodologies 
            to identify suspicious financial activities in real-time. The system processes thousands of transactions 
            per second, analyzing patterns, behaviors, and network relationships to flag potentially fraudulent activities.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                <Activity className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Real-time Processing</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Processes transactions in milliseconds with sub-second detection latency
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
              Combines behavioral, network, and transactional analysis for comprehensive coverage
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                <Cpu className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI-Powered</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Machine learning models adapt to evolving fraud patterns automatically
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
                AI Risk Assessment
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
          Account Types & Classification
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-slate-700 dark:text-slate-300">
            Sentinel classifies accounts into different types based on their behavior patterns, 
            transaction history, and risk profiles. This classification helps in applying appropriate 
            detection rules and risk thresholds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Account */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Normal Account</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Low Risk Profile</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Consistent transaction patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Stable geographic locations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Regular device usage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Low transaction velocity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Established transaction history</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Risk Score: 0.1 - 0.3
              </p>
            </div>
          </div>

          {/* Suspicious Account */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Suspicious Account</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Medium Risk Profile</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Irregular transaction patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Multiple geographic locations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">New or unknown devices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">High transaction velocity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Unusual transaction amounts</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Risk Score: 0.4 - 0.7
              </p>
            </div>
          </div>

          {/* Fraud Account */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fraud Account</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">High Risk Profile</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Known fraudulent patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Multiple account takeover indicators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Suspicious network connections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Rapid transaction bursts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Blacklisted associations</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Risk Score: 0.8 - 1.0
              </p>
            </div>
          </div>

          {/* Mule Account */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                <Network className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mule Account</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Money Laundering</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Acts as money transfer intermediary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Part of fraud networks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Circular transaction patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Quick cash-out behavior</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Multiple suspicious connections</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Risk Score: 0.9 - 1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Classification Flow */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Account Classification Flow</h3>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="bg-slate-700 text-white px-4 py-2 rounded-lg text-center font-medium">
                New Account
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Initial Assessment</div>
              <div className="bg-slate-700 text-white px-4 py-2 rounded-lg text-center font-medium">
                Under Observation
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium mb-2">
                  Normal Pattern
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">→ Normal Account</div>
              </div>
              
              <div className="text-center">
                <div className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium mb-2">
                  Irregular Activity
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">→ Suspicious Account</div>
              </div>
              
              <div className="text-center">
                <div className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium mb-2">
                  Fraud Indicators
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">→ Fraud/Mule Account</div>
              </div>
            </div>
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
            Sentinel employs multiple detection methodologies working in concert to identify 
            various types of fraudulent activities. Each method focuses on different aspects 
            of transaction behavior and patterns.
          </p>
        </div>

        <div className="space-y-6">
          {/* Transaction Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Pattern Recognition in Transaction Data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Anomaly Detection</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Unusual transaction amounts</li>
                  <li>• Abnormal timing patterns</li>
                  <li>• Frequency deviations</li>
                  <li>• Geographic anomalies</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Rule-Based Detection</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Velocity checks</li>
                  <li>• Amount thresholds</li>
                  <li>• Blacklist screening</li>
                  <li>• Pattern matching</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Behavioral Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Behavioral Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">User Behavior Pattern Recognition</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Session Analysis</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Login patterns</li>
                  <li>• Navigation flow</li>
                  <li>• Time spent on pages</li>
                  <li>• Click patterns</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Device & Location</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Device fingerprinting</li>
                  <li>• IP geolocation</li>
                  <li>• Browser analysis</li>
                  <li>• Connection patterns</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Network Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Network className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Network Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Relationship & Connection Mapping</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Graph Analysis</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Account relationships</li>
                  <li>• Transaction flows</li>
                  <li>• Cluster detection</li>
                  <li>• Circular patterns</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Network Metrics</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Centrality measures</li>
                  <li>• Path analysis</li>
                  <li>• Community detection</li>
                  <li>• Anomaly scoring</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Machine Learning */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                <Cpu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Machine Learning</h3>
                <p className="text-slate-600 dark:text-slate-400">AI-Powered Pattern Recognition</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Supervised Learning</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Classification models</li>
                  <li>• Risk scoring algorithms</li>
                  <li>• Pattern recognition</li>
                  <li>• Anomaly detection</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Unsupervised Learning</h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Clustering algorithms</li>
                  <li>• Outlier detection</li>
                  <li>• Pattern discovery</li>
                  <li>• Feature extraction</li>
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
            Network analysis examines the relationships between accounts and transactions to identify 
            complex fraud patterns that might not be visible when looking at individual transactions 
            in isolation.
          </p>
        </div>

        {/* Network Visualization */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Transaction Network Visualization</h3>
          
          <div className="relative h-96 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            {/* Simplified network diagram */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Central node */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                  FRAUD
                </div>
                
                {/* Surrounding nodes */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  MULE
                </div>
                
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  MULE
                </div>
                
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-2 w-12 h-12 bg-slate-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  SAFE
                </div>
                
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-2 w-12 h-12 bg-slate-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  SAFE
                </div>
                
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="50%" y1="50%" x2="50%" y2="20%" stroke="#64748b" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#64748b" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="20%" y2="50%" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="#94a3b8" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Safe Account</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Mule Account</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Fraud Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Centrality</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Measures how central an account is in the transaction network
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Betweenness</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Identifies accounts that act as bridges between different groups
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Clustering</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Detects tightly connected groups of accounts
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Path Analysis</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Analyzes transaction paths and flow patterns
            </p>
          </div>
        </div>

        {/* Fraud Patterns */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Common Network Fraud Patterns</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Circular Transactions</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Money flows through multiple accounts in a circular pattern to obscure the origin and destination.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Fan-Out/Fan-In Patterns</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Single account distributes funds to multiple accounts (fan-out) which then consolidate to a final account (fan-in).
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Chain Transactions</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Sequential transactions through a chain of accounts to create distance between source and destination.
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
            Behavioral analysis focuses on understanding how users interact with the system, 
            identifying deviations from established patterns that might indicate account takeover 
            or fraudulent activity.
          </p>
        </div>

        {/* Behavioral Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Session Metrics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Login-to-Transfer Time</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">2.3s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Page Navigation Pattern</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Normal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Session Duration</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">5m 42s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Click Patterns</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Baseline</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Device & Location</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Device Fingerprint</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Match</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">IP Geolocation</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">US, NY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Browser Analysis</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Chrome</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-300">Connection Type</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">WiFi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Behavioral Anomalies</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Account Takeover Indicators</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>• Sudden login location change</li>
                <li>• New device fingerprint</li>
                <li>• Unusual access times</li>
                <li>• Rapid successive transactions</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Behavioral Drift</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>• Changed navigation patterns</li>
                <li>• Altered transaction timing</li>
                <li>• Different click behavior</li>
                <li>• Unusual session duration</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Risk Factors</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>• Multiple failed logins</li>
                <li>• VPN/Proxy usage</li>
                <li>• Suspicious user agent</li>
                <li>• High-risk IP ranges</li>
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
            Sentinel's risk scoring system combines multiple factors to generate a comprehensive 
            risk score for each transaction. This score determines the appropriate action to take.
          </p>
        </div>

        {/* Risk Score Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Risk Score Components</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Transaction Anomaly Score</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.35</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '35%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Rule-Based Score</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.20</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">Network Risk Score</span>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">0.45</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-500 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Final Risk Score</span>
                <span className="text-sm font-mono bg-slate-300 dark:bg-slate-600 px-2 py-1 rounded">0.67</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div className="bg-slate-600 h-3 rounded-full" style={{width: '67%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Low Risk</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">0.0 - 0.3</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Normal transaction patterns. Auto-approved.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">!</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Medium Risk</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">0.4 - 0.7</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Suspicious patterns detected. Manual review required.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✗</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">High Risk</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">0.8 - 1.0</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Clear fraud indicators. Auto-blocked.
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
            Sentinel provides comprehensive visualization tools to help analysts understand 
            fraud patterns, track system performance, and make informed decisions.
          </p>
        </div>

        {/* Chart Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Time Series Analysis</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Track transaction volumes and fraud rates over time
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">TX Volume • Fraud Rate • Risk Trends</div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Risk Distribution</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Visualize risk score distribution across transactions
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Low • Medium • High Risk</div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Network className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Network Graphs</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Interactive network analysis and relationship mapping
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Account Links • Transaction Flows</div>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Live Dashboard Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,247</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Transactions/Min</div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">98.7%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Detection Accuracy</div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">23ms</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Latency</div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">47</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active Alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
