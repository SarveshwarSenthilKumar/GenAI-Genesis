from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Decision = Literal["approve", "review", "block"]
LiveAction = Literal["allow", "review", "hold", "block"]
LiveAlertType = Literal["transaction", "ring"]


class RiskDistributionItem(BaseModel):
    label: str
    count: int


class TransactionFeedItem(BaseModel):
    transaction_id: str
    scenario: str
    title: str
    timeline_label: str
    user_id: str
    recipient_label: str
    amount: float
    overall_risk: float
    decision: Decision


class DashboardSummary(BaseModel):
    analyzed_transactions: int
    total_cases: int
    approved_count: int
    review_count: int
    blocked_count: int
    blocked_amount: float
    risk_distribution: list[RiskDistributionItem]
    cases: list[TransactionFeedItem]


class BehaviorSignals(BaseModel):
    baseline_login_to_transfer_sec: int
    current_login_to_transfer_sec: int
    page_path_mismatch: bool
    path_similarity: float
    new_device: bool
    payee_added: bool


class GraphSignals(BaseModel):
    distance_to_suspicious_cluster: int | None = None
    recipient_fan_in: int
    recipient_fan_out: int
    rapid_chain_detected: bool
    cycle_detected: bool


class ScoredTransaction(BaseModel):
    transaction_id: str
    user_id: str
    scenario: str
    title: str
    timeline_label: str
    decision: Decision
    amount: float
    recipient_label: str
    overall_risk: float
    transaction_risk: float
    behavior_risk: float
    network_risk: float
    reasons: list[str]
    transaction_anomalies: list[str]
    behavior_anomalies: list[str]
    network_anomalies: list[str]
    behavior_signals: BehaviorSignals
    graph_signals: GraphSignals
    gemini_explanation: str
    gemini_summary_bullets: list[str]
    recommended_action: str
    ai_mode: Literal["gemini", "fallback"]


class BehaviorProfile(BaseModel):
    user_id: str
    customer_name: str
    baseline_login_to_transfer_sec: int
    expected_path: list[str]
    known_devices: list[str]
    recent_sessions: list[dict[str, Any]]


class GraphResponse(BaseModel):
    transaction_id: str
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    highlighted_node_ids: list[str]
    highlighted_edge_ids: list[str]
    suspicious_cluster_ids: list[str]
    metrics: GraphSignals


class ExplanationRequest(BaseModel):
    transaction_id: str | None = None
    final_score: float = Field(..., ge=0, le=1)
    decision: Decision
    transaction_reasons: list[str]
    behavior_anomalies: list[str]
    graph_anomalies: list[str]


class ExplanationResponse(BaseModel):
    explanation: str
    bullets: list[str]
    action: str
    mode: Literal["gemini", "fallback"] = "fallback"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TransactionChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list)


class TransactionChatResponse(BaseModel):
    answer: str
    follow_ups: list[str] = Field(default_factory=list)
    mode: Literal["gemini", "fallback"] = "fallback"


class LiveMonitorStats(BaseModel):
    transactions_monitored: int
    flagged_alerts: int
    suspicious_volume: float
    ring_clusters: int
    rules_triggered: int
    hot_country: str
    blocked_count: int
    held_count: int
    review_count: int
    allow_count: int
    transaction_scoring_latency_ms: float
    graph_update_latency_ms: float
    total_latency_ms: float


class LiveMonitorBreakdownItem(BaseModel):
    label: str
    value: float


class LiveMonitorWhyFlagged(BaseModel):
    transaction_anomaly_score: float
    rule_score: float
    network_risk_score: float
    final_risk: float
    severity: str
    action: LiveAction
    breakdown: list[LiveMonitorBreakdownItem] = Field(default_factory=list)
    top_rule_reasons: list[str] = Field(default_factory=list)
    top_network_evidence: list[str] = Field(default_factory=list)


class LiveMonitorAlert(BaseModel):
    type: LiveAlertType
    alert_title: str
    transaction_id: str | None = None
    cluster_id: str | None = None
    sender_account: str | None = None
    receiver_account: str | None = None
    amount: float
    severity: str
    action: LiveAction
    final_risk: float
    transaction_anomaly_score: float = 0.0
    rule_score: float = 0.0
    network_risk_score: float = 0.0
    rule_reasons: list[str] = Field(default_factory=list)
    network_evidence: list[str] = Field(default_factory=list)
    accounts_involved: list[str] = Field(default_factory=list)
    suspicious_funds_total: float | None = None
    why_flagged: LiveMonitorWhyFlagged
    explanation: str


class LiveMonitorTransactionRow(BaseModel):
    transaction_id: str
    timestamp: str
    sender_account: str
    receiver_account: str
    amount: float
    ip_country: str
    sender_txn_count_5m: int
    transaction_anomaly_score: float
    rule_score: float
    network_risk_score: float
    final_risk: float
    severity: str
    action: LiveAction
    transaction_type: str


class LiveMonitorGraphNode(BaseModel):
    id: str
    label: str
    kind: str
    risk: float


class LiveMonitorGraphEdge(BaseModel):
    source: str
    target: str
    amount: float
    risk: float
    label: str


class LiveMonitorGraph(BaseModel):
    nodes: list[LiveMonitorGraphNode] = Field(default_factory=list)
    edges: list[LiveMonitorGraphEdge] = Field(default_factory=list)


class LiveMonitorPayload(BaseModel):
    generated_at: str | None = None
    stats: LiveMonitorStats
    transactions: list[LiveMonitorTransactionRow] = Field(default_factory=list)
    alerts: list[LiveMonitorAlert] = Field(default_factory=list)
    graph: LiveMonitorGraph
