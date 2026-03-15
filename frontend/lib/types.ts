export type Decision = "approve" | "review" | "block";

export type RiskDistributionItem = {
  label: string;
  count: number;
};

export type TransactionFeedItem = {
  transaction_id: string;
  scenario: string;
  title: string;
  timeline_label: string;
  user_id: string;
  recipient_label: string;
  amount: number;
  overall_risk: number;
  decision: Decision;
};

export type DashboardSummary = {
  analyzed_transactions: number;
  total_cases: number;
  approved_count: number;
  review_count: number;
  blocked_count: number;
  blocked_amount: number;
  risk_distribution: RiskDistributionItem[];
  cases: TransactionFeedItem[];
};

export type BehaviorSignals = {
  baseline_login_to_transfer_sec: number;
  current_login_to_transfer_sec: number;
  page_path_mismatch: boolean;
  path_similarity: number;
  new_device: boolean;
  payee_added: boolean;
};

export type GraphSignals = {
  distance_to_suspicious_cluster: number | null;
  recipient_fan_in: number;
  recipient_fan_out: number;
  rapid_chain_detected: boolean;
  cycle_detected: boolean;
};

export type ScoredTransaction = {
  transaction_id: string;
  user_id: string;
  scenario: string;
  title: string;
  timeline_label: string;
  decision: Decision;
  amount: number;
  recipient_label: string;
  overall_risk: number;
  transaction_risk: number;
  behavior_risk: number;
  network_risk: number;
  reasons: string[];
  transaction_anomalies: string[];
  behavior_anomalies: string[];
  network_anomalies: string[];
  behavior_signals: BehaviorSignals;
  graph_signals: GraphSignals;
  openai_explanation: string;
  openai_summary_bullets: string[];
  recommended_action: string;
  ai_mode: "openai" | "fallback";
};

export type BehaviorProfile = {
  user_id: string;
  customer_name: string;
  baseline_login_to_transfer_sec: number;
  expected_path: string[];
  known_devices: string[];
  recent_sessions: Array<{
    session_id: string;
    user_id: string;
    page_path: string[];
    login_to_transfer_sec: number;
    device_id: string;
    payee_added: boolean;
  }>;
};

export type GraphResponse = {
  transaction_id: string;
  nodes: Array<{ data: Record<string, string>; classes?: string }>;
  edges: Array<{ data: Record<string, string>; classes?: string }>;
  highlighted_node_ids: string[];
  highlighted_edge_ids: string[];
  suspicious_cluster_ids: string[];
  metrics: GraphSignals;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TransactionChatResponse = {
  answer: string;
  follow_ups: string[];
  mode: "openai" | "fallback";
};

export type IncidentQueueStats = {
  total_incidents: number;
  blocked_count: number;
  review_count: number;
  hold_count: number;
  monitored_transactions: number;
  suspicious_volume: number;
  average_latency_ms: number;
};

export type IncidentQueueItem = {
  incident_id: string;
  title: string;
  decision: LiveAction;
  severity: string;
  overall_risk: number;
  amount: number;
  counterpart_label: string;
  timeline_label: string;
  top_reasons: string[];
  summary: string;
  generated_at: string;
  type: "transaction" | "ring";
  manually_injected: boolean;
  injected_scenario: string | null;
};

export type IncidentQueueResponse = {
  generated_at: string | null;
  stats: IncidentQueueStats;
  incidents: IncidentQueueItem[];
};

export type IncidentPanelResponse = {
  incident_id: string;
  title: string;
  decision: LiveAction;
  severity: string;
  overall_risk: number;
  amount: number;
  counterpart_label: string;
  timeline_label: string;
  transaction_risk: number;
  behavior_risk: number;
  network_risk: number;
  top_reasons: string[];
  explanation: string;
  summary_bullets: string[];
  recommended_action: string;
  ai_mode: "openai" | "fallback";
};

export type IncidentBehaviorProfile = {
  subject_label: string;
  baseline_login_to_transfer_sec: number;
  current_login_to_transfer_sec: number;
  expected_path: string[];
  current_path: string[];
  path_similarity: number;
  new_device: boolean;
  payee_added: boolean;
};

export type IncidentDetailResponse = {
  incident_id: string;
  title: string;
  decision: LiveAction;
  severity: string;
  type: "transaction" | "ring";
  amount: number;
  counterpart_label: string;
  timeline_label: string;
  overall_risk: number;
  transaction_risk: number;
  behavior_risk: number;
  network_risk: number;
  reasons: string[];
  transaction_anomalies: string[];
  behavior_anomalies: string[];
  network_anomalies: string[];
  explanation: string;
  summary_bullets: string[];
  recommended_action: string;
  ai_mode: "openai" | "fallback";
  behavior_profile: IncidentBehaviorProfile;
};

export type IncidentChatResponse = {
  answer: string;
  follow_ups: string[];
  mode: "openai" | "fallback";
};

export type LiveAction = "allow" | "review" | "hold" | "block";

export type LiveMonitorStats = {
  transactions_monitored: number;
  flagged_alerts: number;
  suspicious_volume: number;
  suspicious_dollars_prevented: number;
  high_risk_accounts_isolated: number;
  analyst_hours_saved: number;
  false_positive_reduction_estimate: number;
  ring_clusters: number;
  rules_triggered: number;
  hot_country: string;
  blocked_count: number;
  held_count: number;
  review_count: number;
  allow_count: number;
  transaction_scoring_latency_ms: number;
  graph_update_latency_ms: number;
  total_latency_ms: number;
};

export type LiveMonitorBreakdownItem = {
  label: string;
  value: number;
};

export type LiveMonitorWhyFlagged = {
  transaction_anomaly_score: number;
  rule_score: number;
  network_risk_score: number;
  final_risk: number;
  severity: string;
  action: LiveAction;
  breakdown: LiveMonitorBreakdownItem[];
  top_rule_reasons: string[];
  top_network_evidence: string[];
  top_driver: string | null;
  tipping_point: string | null;
  counterfactuals: string[];
};

export type LiveMonitorAlert = {
  type: "transaction" | "ring";
  alert_title: string;
  transaction_id?: string | null;
  cluster_id?: string | null;
  sender_account?: string | null;
  receiver_account?: string | null;
  amount: number;
  severity: string;
  action: LiveAction;
  final_risk: number;
  transaction_anomaly_score: number;
  rule_score: number;
  network_risk_score: number;
  rule_reasons: string[];
  network_evidence: string[];
  accounts_involved: string[];
  suspicious_funds_total?: number | null;
  why_flagged: LiveMonitorWhyFlagged;
  explanation: string;
};

export type LiveMonitorTransactionRow = {
  transaction_id: string;
  timestamp: string;
  sender_account: string;
  receiver_account: string;
  amount: number;
  ip_country: string;
  sender_txn_count_5m: number;
  transaction_anomaly_score: number;
  rule_score: number;
  network_risk_score: number;
  final_risk: number;
  severity: string;
  action: LiveAction;
  transaction_type: string;
};

export type LiveMonitorGraphNode = {
  id: string;
  label: string;
  kind: string;
  risk: number;
};

export type LiveMonitorGraphEdge = {
  source: string;
  target: string;
  amount: number;
  risk: number;
  label: string;
};

export type LiveMonitorGraph = {
  nodes: LiveMonitorGraphNode[];
  edges: LiveMonitorGraphEdge[];
};

export type LiveMonitorPayload = {
  generated_at: string | null;
  active_scenario: string | null;
  stats: LiveMonitorStats;
  transactions: LiveMonitorTransactionRow[];
  alerts: LiveMonitorAlert[];
  graph: LiveMonitorGraph;
};

export type UploadSchemaField = {
  field: string;
  column: string | null;
  confidence: number;
  notes: string | null;
};

export type UploadSchemaInference = {
  fields: UploadSchemaField[];
  required_missing: string[];
};

export type UploadAlertItem = {
  transaction_id: string;
  sender_account: string | null;
  receiver_account: string | null;
  amount: number;
  currency: string | null;
  risk_score: number;
  decision: Decision;
  reasons: string[];
};

export type UploadReport = {
  total_transactions: number;
  flagged_count: number;
  suspicious_volume: number;
  alerts: UploadAlertItem[];
  mapping: UploadSchemaInference;
};
