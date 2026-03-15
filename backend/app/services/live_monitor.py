from __future__ import annotations

import time
from collections import Counter
from dataclasses import dataclass
from typing import Any

from ..models import (
    LiveMonitorAlert,
    LiveMonitorBreakdownItem,
    LiveMonitorGraph,
    LiveMonitorGraphEdge,
    LiveMonitorGraphNode,
    LiveMonitorPayload,
    LiveMonitorStats,
    LiveMonitorTransactionRow,
    LiveMonitorWhyFlagged,
)
from .live_detection import (
    RuleEngine,
    build_explanation,
    build_feature_rows,
    build_network_risk,
    classify_risk,
    combine_scores,
    detect_fraud_rings,
    engineer_transaction_features,
    isolation_forest_scores,
)
from .live_simulation import TransactionEngine


@dataclass
class LiveMonitorSnapshot:
    payload: LiveMonitorPayload
    enriched: list[dict[str, Any]]
    transaction_rows: list[LiveMonitorTransactionRow]


class LiveMonitorService:
    def __init__(self) -> None:
        self.engine = TransactionEngine()
        self.rule_engine = RuleEngine()
        self.active_scenario: str | None = None
        self.engine.seed(60)
        self._latest_snapshot: LiveMonitorSnapshot | None = None

    def bootstrap(self) -> LiveMonitorPayload:
        snapshot = self._build_snapshot()
        self._latest_snapshot = snapshot
        return snapshot.payload

    def stream(self, batch_size: int = 6) -> LiveMonitorPayload:
        self.active_scenario = None
        self.engine.next_batch(batch_size)
        snapshot = self._build_snapshot()
        self._latest_snapshot = snapshot
        return snapshot.payload

    def trigger_scenario(self, name: str) -> LiveMonitorPayload:
        """Inject a specific scenario and return the updated snapshot."""
        self.engine.inject_scenario(name)
        snapshot = self._build_snapshot()
        self._latest_snapshot = snapshot
        return snapshot.payload

    def trigger_scenario(self, name: str) -> LiveMonitorPayload:
        self.engine.inject_scenario(name)
        self.active_scenario = name
        return self._build_snapshot().payload

    def current_snapshot(self) -> LiveMonitorSnapshot:
        return self._latest_snapshot or self._build_snapshot()

    def _build_snapshot(self) -> LiveMonitorSnapshot:
        started = time.perf_counter()
        transactions = self.engine.recent_transactions(120)
        snapshot = self._build_snapshot_from_transactions(transactions, started=started)
        self._latest_snapshot = snapshot
        return snapshot

    def build_snapshot_from_transactions(
        self, transactions: list[dict]
    ) -> LiveMonitorSnapshot:
        return self._build_snapshot_from_transactions(transactions)

    def _build_snapshot_from_transactions(
        self, transactions: list[dict], started: float | None = None
    ) -> LiveMonitorSnapshot:
        started = started or time.perf_counter()

        feature_start = time.perf_counter()
        enriched = engineer_transaction_features(transactions)
        feature_rows = build_feature_rows(enriched)
        anomaly_scores = isolation_forest_scores(feature_rows)
        feature_latency_ms = (time.perf_counter() - feature_start) * 1000

        graph_start = time.perf_counter()
        ring_alerts, account_signals = detect_fraud_rings(enriched)
        graph_latency_ms = (time.perf_counter() - graph_start) * 1000
        injected_accounts = {
            tx["sender_account"]
            for tx in enriched
            if tx.get("injected_scenario")
        } | {
            tx["receiver_account"]
            for tx in enriched
            if tx.get("injected_scenario")
        }

        alerts: list[LiveMonitorAlert] = []
        transaction_rows: list[LiveMonitorTransactionRow] = []
        rules_triggered = 0
        action_counts: Counter[str] = Counter()

        for tx, anomaly_score in zip(enriched, anomaly_scores):
            rule_hits = self.rule_engine.evaluate(tx, {})
            rules_triggered += len(rule_hits)
            rule_score = round(min(sum(hit.points for hit in rule_hits), 1.0), 2)
            (
                network_score,
                network_evidence,
                cluster_id,
                accounts_involved,
                suspicious_funds_total,
            ) = build_network_risk(tx, account_signals)
            final_risk = combine_scores(anomaly_score, rule_score, network_score)
            severity, action = classify_risk(final_risk)
            action_counts[action] += 1

            explanation = build_explanation(
                transaction=tx,
                final_risk=final_risk,
                severity=severity,
                action=action,
                transaction_anomaly_score=anomaly_score,
                rule_score=rule_score,
                network_risk_score=network_score,
                rule_reasons=[hit.reason for hit in rule_hits],
                network_evidence=network_evidence,
                accounts_involved=accounts_involved,
                suspicious_funds_total=suspicious_funds_total,
            )

            transaction_rows.append(
                LiveMonitorTransactionRow(
                    transaction_id=tx["transaction_id"],
                    timestamp=tx["timestamp"],
                    sender_account=tx["sender_account"],
                    receiver_account=tx["receiver_account"],
                    amount=tx["amount"],
                    ip_country=tx["ip_country"],
                    sender_txn_count_5m=tx["sender_txn_count_5m"],
                    transaction_anomaly_score=anomaly_score,
                    rule_score=rule_score,
                    network_risk_score=network_score,
                    final_risk=final_risk,
                    severity=severity,
                    action=action,
                    transaction_type=tx["transaction_type"],
                )
            )

            if final_risk < 0.5:
                continue

            alerts.append(
                LiveMonitorAlert(
                    type="transaction",
                    alert_title=(
                        "Suspicious transaction pattern"
                        if final_risk < 0.85
                        else "Critical fraud escalation"
                    ),
                    transaction_id=tx["transaction_id"],
                    cluster_id=cluster_id,
                    sender_account=tx["sender_account"],
                    receiver_account=tx["receiver_account"],
                    amount=tx["amount"],
                    severity=severity,
                    action=action,
                    final_risk=final_risk,
                    transaction_anomaly_score=anomaly_score,
                    rule_score=rule_score,
                    network_risk_score=network_score,
                    rule_reasons=[hit.reason for hit in rule_hits][:4],
                    network_evidence=network_evidence,
                    accounts_involved=accounts_involved,
                    suspicious_funds_total=suspicious_funds_total,
                    manually_injected=bool(tx.get("injected_scenario")),
                    injected_scenario=tx.get("injected_scenario"),
                    why_flagged=LiveMonitorWhyFlagged(
                        transaction_anomaly_score=anomaly_score,
                        rule_score=rule_score,
                        network_risk_score=network_score,
                        final_risk=final_risk,
                        severity=severity,
                        action=action,
                        breakdown=[
                            LiveMonitorBreakdownItem(label="Anomaly", value=anomaly_score),
                            LiveMonitorBreakdownItem(label="Rules", value=rule_score),
                            LiveMonitorBreakdownItem(label="Network", value=network_score),
                        ],
                        top_rule_reasons=[hit.reason for hit in rule_hits][:3],
                        top_network_evidence=network_evidence[:3],
                        top_driver=self._top_driver(
                            {
                                "Anomaly": anomaly_score,
                                "Rules": rule_score,
                                "Network": network_score,
                            }
                        ),
                        tipping_point=self._tipping_point(
                            anomaly_score=anomaly_score,
                            rule_score=rule_score,
                            network_score=network_score,
                            current_action=action,
                        ),
                        counterfactuals=self._counterfactuals(
                            anomaly_score=anomaly_score,
                            rule_score=rule_score,
                            network_score=network_score,
                            current_action=action,
                        ),
                    ),
                    explanation=explanation,
                )
            )

        for alert in ring_alerts:
            severity, action = classify_risk(alert.risk_score)
            alerts.append(
                LiveMonitorAlert(
                    type="ring",
                    alert_title="Potential laundering ring detected",
                    cluster_id=alert.cluster_id,
                    amount=alert.total_amount,
                    severity=severity,
                    action=action,
                    final_risk=alert.risk_score,
                    network_risk_score=alert.risk_score,
                    network_evidence=alert.evidence,
                    accounts_involved=alert.accounts,
                    suspicious_funds_total=alert.suspicious_funds_total,
                    manually_injected=bool(set(alert.accounts) & injected_accounts),
                    injected_scenario=(
                        self.active_scenario
                        if self.active_scenario and set(alert.accounts) & injected_accounts
                        else None
                    ),
                    why_flagged=LiveMonitorWhyFlagged(
                        transaction_anomaly_score=0.0,
                        rule_score=0.0,
                        network_risk_score=alert.risk_score,
                        final_risk=alert.risk_score,
                        severity=severity,
                        action=action,
                        breakdown=[
                            LiveMonitorBreakdownItem(label="Cycle", value=1.0),
                            LiveMonitorBreakdownItem(
                                label="Flow Velocity",
                                value=min(
                                    (
                                        300.0
                                        / max(alert.avg_hop_time_sec * alert.cycle_length, 1.0)
                                    ),
                                    1.0,
                                ),
                            ),
                            LiveMonitorBreakdownItem(
                                label="Cluster Size",
                                value=min(alert.cycle_length / 5.0, 1.0),
                            ),
                            LiveMonitorBreakdownItem(
                                label="Volume",
                                value=min(alert.total_amount / 50000.0, 1.0),
                            ),
                        ],
                        top_network_evidence=alert.evidence[:3],
                        top_driver="Network",
                        tipping_point=self._tipping_point(
                            anomaly_score=0.0,
                            rule_score=0.0,
                            network_score=alert.risk_score,
                            current_action=action,
                        ),
                        counterfactuals=self._counterfactuals(
                            anomaly_score=0.0,
                            rule_score=0.0,
                            network_score=alert.risk_score,
                            current_action=action,
                        ),
                    ),
                    explanation=(
                        f"Cluster {alert.cluster_id} shows circular transfers across "
                        f"{alert.cycle_length} accounts with average hop time of "
                        f"{alert.avg_hop_time_sec:.0f} seconds."
                    ),
                )
            )

        alerts.sort(
            key=lambda item: (item.manually_injected, item.final_risk),
            reverse=True,
        )
        top_alerts = alerts[:10]
        top_transactions = list(
            reversed(sorted(transaction_rows, key=lambda item: item.timestamp)[-18:])
        )
        graph = self._build_graph(enriched, top_alerts)
        total_latency_ms = (time.perf_counter() - started) * 1000
        stats = self._build_stats(
            transactions=enriched,
            alerts=top_alerts,
            ring_alerts=ring_alerts,
            rules_triggered=rules_triggered,
            action_counts=action_counts,
            feature_latency_ms=feature_latency_ms,
            graph_latency_ms=graph_latency_ms,
            total_latency_ms=total_latency_ms,
        )

        return LiveMonitorSnapshot(
            payload=LiveMonitorPayload(
                generated_at=enriched[-1]["timestamp"] if enriched else None,
                active_scenario=self.active_scenario,
                stats=stats,
                transactions=top_transactions,
                alerts=top_alerts,
                graph=graph,
            ),
            enriched=enriched,
            transaction_rows=transaction_rows,
        )

    def _action_for_scores(
        self, anomaly_score: float, rule_score: float, network_score: float
    ) -> str:
        final_risk = combine_scores(anomaly_score, rule_score, network_score)
        return classify_risk(final_risk)[1]

    def _top_driver(self, scores: dict[str, float]) -> str | None:
        if not scores:
            return None
        label, value = max(scores.items(), key=lambda item: item[1])
        if value <= 0:
            return None
        return label

    def _tipping_point(
        self,
        anomaly_score: float,
        rule_score: float,
        network_score: float,
        current_action: str,
    ) -> str | None:
        scenarios = [
            (
                "Anomaly scoring",
                self._action_for_scores(0.0, rule_score, network_score),
            ),
            (
                "Rules",
                self._action_for_scores(anomaly_score, 0.0, network_score),
            ),
            (
                "Network evidence",
                self._action_for_scores(anomaly_score, rule_score, 0.0),
            ),
        ]
        current_rank = self._action_rank(current_action)
        best_shift: tuple[int, str, str] | None = None
        for signal_name, action_without_signal in scenarios:
            shift = current_rank - self._action_rank(action_without_signal)
            if shift <= 0:
                continue
            candidate = (shift, signal_name, action_without_signal)
            if best_shift is None or candidate[0] > best_shift[0]:
                best_shift = candidate

        if not best_shift:
            return None

        _, signal_name, action_without_signal = best_shift
        return f"{signal_name} moved this alert from {action_without_signal} to {current_action}."

    def _action_rank(self, action: str) -> int:
        order = {"allow": 0, "review": 1, "hold": 2, "block": 3}
        return order.get(action, 0)

    def _counterfactuals(
        self,
        anomaly_score: float,
        rule_score: float,
        network_score: float,
        current_action: str,
    ) -> list[str]:
        scenarios = [
            ("Without anomaly scoring", self._action_for_scores(0.0, rule_score, network_score)),
            ("Without rules", self._action_for_scores(anomaly_score, 0.0, network_score)),
            ("Without network evidence", self._action_for_scores(anomaly_score, rule_score, 0.0)),
        ]
        messages: list[str] = []
        for label, action in scenarios:
            if action == current_action:
                continue
            messages.append(f"{label}, this would be {action}.")
        return messages[:2]

    def _build_stats(
        self,
        transactions: list[dict],
        alerts: list[LiveMonitorAlert],
        ring_alerts: list,
        rules_triggered: int,
        action_counts: Counter[str],
        feature_latency_ms: float,
        graph_latency_ms: float,
        total_latency_ms: float,
    ) -> LiveMonitorStats:
        suspicious_volume = sum(
            alert.amount
            for alert in alerts
            if alert.action in {"hold", "block"}
        )
        countries = Counter(tx["ip_country"] for tx in transactions[-30:])
        return LiveMonitorStats(
            transactions_monitored=len(transactions),
            flagged_alerts=len(alerts),
            suspicious_volume=round(suspicious_volume, 2),
            ring_clusters=len(ring_alerts),
            rules_triggered=rules_triggered,
            hot_country=countries.most_common(1)[0][0] if countries else "--",
            blocked_count=action_counts["block"],
            held_count=action_counts["hold"],
            review_count=action_counts["review"],
            allow_count=action_counts["allow"],
            transaction_scoring_latency_ms=round(feature_latency_ms, 1),
            graph_update_latency_ms=round(graph_latency_ms, 1),
            total_latency_ms=round(total_latency_ms, 1),
        )

    def _build_graph(
        self, transactions: list[dict], alerts: list[LiveMonitorAlert]
    ) -> LiveMonitorGraph:
        focus_accounts = set()
        for alert in alerts[:6]:
            focus_accounts.update(alert.accounts_involved)
            if alert.type == "transaction":
                if alert.sender_account:
                    focus_accounts.add(alert.sender_account)
                if alert.receiver_account:
                    focus_accounts.add(alert.receiver_account)

        relevant = [
            tx
            for tx in transactions
            if tx["sender_account"] in focus_accounts
            or tx["receiver_account"] in focus_accounts
        ][-22:]

        nodes: dict[str, LiveMonitorGraphNode] = {}
        edges: list[LiveMonitorGraphEdge] = []

        for tx in relevant:
            for account in (tx["sender_account"], tx["receiver_account"]):
                if account not in nodes:
                    nodes[account] = LiveMonitorGraphNode(
                        id=account,
                        label=account,
                        kind=(
                            "cashout"
                            if account.startswith("CASH")
                            else "mule" if account.startswith("MULE") else "account"
                        ),
                        risk=0.9 if account in focus_accounts else 0.35,
                    )

            for entity_id, entity_kind in (
                (tx["device_id"], "device"),
                (tx["ip_address"], "ip"),
                (tx["beneficiary_id"], "beneficiary"),
            ):
                key = f"{entity_kind}:{entity_id}"
                if key not in nodes:
                    nodes[key] = LiveMonitorGraphNode(
                        id=key,
                        label=entity_id,
                        kind=entity_kind,
                        risk=0.55 if tx["sender_account"] in focus_accounts else 0.25,
                    )
                edges.append(
                    LiveMonitorGraphEdge(
                        source=tx["sender_account"],
                        target=key,
                        amount=0,
                        risk=nodes[key].risk,
                        label=entity_kind,
                    )
                )

            edges.append(
                LiveMonitorGraphEdge(
                    source=tx["sender_account"],
                    target=tx["receiver_account"],
                    amount=tx["amount"],
                    risk=(
                        0.92
                        if tx["sender_account"] in focus_accounts
                        or tx["receiver_account"] in focus_accounts
                        else 0.35
                    ),
                    label=tx["transaction_type"],
                )
            )

        return LiveMonitorGraph(nodes=list(nodes.values()), edges=edges)


live_monitor_service = LiveMonitorService()
