from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Decision = Literal["approve", "review", "block"]


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
