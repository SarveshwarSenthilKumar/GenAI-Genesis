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
  gemini_explanation: string;
  gemini_summary_bullets: string[];
  recommended_action: string;
  ai_mode: "gemini" | "fallback";
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
  mode: "gemini" | "fallback";
};
