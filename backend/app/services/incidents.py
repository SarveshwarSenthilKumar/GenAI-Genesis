from __future__ import annotations

from datetime import datetime
from difflib import SequenceMatcher
from typing import Any
import networkx as nx

from ..models import (
    GraphResponse,
    GraphSignals,
    IncidentBehaviorProfile,
    IncidentChatResponse,
    IncidentDetailResponse,
    IncidentPanelResponse,
    IncidentQueueItem,
    IncidentQueueResponse,
    IncidentQueueStats,
)
from .explanation import ExplanationService
from .live_monitor import live_monitor_service


class IncidentService:
    def __init__(self) -> None:
        self.explanations = ExplanationService()
        self._feed_incident_ids: list[str] = []
        self._alert_cache: dict[str, Any] = {}
        self._transaction_cache: dict[str, dict[str, Any]] = {}
        self._incident_timestamps: dict[str, str] = {}
        self._max_feed_size = 24
        self._max_transaction_cache = 360

    def get_queue(self) -> IncidentQueueResponse:
        snapshot = live_monitor_service.current_snapshot()
        self._sync_from_snapshot(snapshot)
        incidents = [
            self._queue_item_from_alert(self._alert_cache[incident_id])
            for incident_id in self._feed_incident_ids
            if incident_id in self._alert_cache
        ]
        blocked_count = sum(1 for item in incidents if item.decision == "block")
        hold_count = sum(1 for item in incidents if item.decision == "hold")
        review_count = sum(1 for item in incidents if item.decision == "review")
        suspicious_volume = sum(
            item.amount for item in incidents if item.decision in {"hold", "block"}
        )
        stats = snapshot.payload.stats
        return IncidentQueueResponse(
            generated_at=snapshot.payload.generated_at,
            stats=IncidentQueueStats(
                total_incidents=len(incidents),
                blocked_count=blocked_count,
                review_count=review_count,
                hold_count=hold_count,
                monitored_transactions=stats.transactions_monitored,
                suspicious_volume=round(suspicious_volume, 2),
                average_latency_ms=stats.total_latency_ms,
            ),
            incidents=incidents,
        )

    def refresh_queue(self, batch_size: int = 4) -> IncidentQueueResponse:
        live_monitor_service.stream(batch_size=batch_size)
        return self.get_queue()

    def get_incident_panel(self, incident_id: str) -> IncidentPanelResponse:
        alert = self._find_alert(incident_id)
        explanation = self._generate_explanation(alert)
        counterpart = self._counterpart_label(alert)
        top_reasons = self._top_reasons(alert)

        return IncidentPanelResponse(
            incident_id=incident_id,
            title=alert.alert_title,
            decision=alert.action,
            severity=alert.severity,
            overall_risk=round(alert.final_risk, 2),
            amount=round(alert.amount, 2),
            counterpart_label=counterpart,
            timeline_label=self._timeline_label(alert),
            transaction_risk=round(alert.transaction_anomaly_score, 2),
            behavior_risk=round(self._behavior_risk(alert), 2),
            network_risk=round(alert.network_risk_score, 2),
            top_reasons=top_reasons,
            explanation=explanation.explanation,
            summary_bullets=explanation.bullets,
            recommended_action=explanation.action,
            ai_mode=explanation.mode,
        )

    def get_incident_detail(self, incident_id: str) -> IncidentDetailResponse:
        alert = self._find_alert(incident_id)
        tx = self._find_transaction(alert)
        transaction_anomalies = self._transaction_anomalies(alert)
        behavior_anomalies = self._behavior_anomalies(alert)
        network_anomalies = list(alert.network_evidence)
        reasons = self._combine_unique(
            transaction_anomalies, behavior_anomalies, network_anomalies
        )
        explanation = self._generate_explanation(alert)

        return IncidentDetailResponse(
            incident_id=incident_id,
            title=alert.alert_title,
            decision=alert.action,
            severity=alert.severity,
            type=alert.type,
            amount=round(alert.amount, 2),
            counterpart_label=self._counterpart_label(alert),
            timeline_label=self._timeline_label(alert),
            overall_risk=round(alert.final_risk, 2),
            transaction_risk=round(alert.transaction_anomaly_score, 2),
            behavior_risk=round(self._behavior_risk(alert), 2),
            network_risk=round(alert.network_risk_score, 2),
            reasons=reasons,
            transaction_anomalies=transaction_anomalies,
            behavior_anomalies=behavior_anomalies,
            network_anomalies=network_anomalies,
            explanation=explanation.explanation,
            summary_bullets=explanation.bullets,
            recommended_action=explanation.action,
            ai_mode=explanation.mode,
            behavior_profile=self._behavior_profile(alert, tx),
        )

    def get_incident_graph(self, incident_id: str) -> GraphResponse:
        alert = self._find_alert(incident_id)
        snapshot = live_monitor_service.current_snapshot()
        focus_accounts = set(alert.accounts_involved)
        if alert.sender_account:
            focus_accounts.add(alert.sender_account)
        if alert.receiver_account:
            focus_accounts.add(alert.receiver_account)

        relevant = [
            tx
            for tx in snapshot.enriched
            if tx["sender_account"] in focus_accounts
            or tx["receiver_account"] in focus_accounts
        ][-14:]

        nodes: dict[str, dict[str, Any]] = {}
        edges_by_id: dict[str, dict[str, Any]] = {}
        highlighted_nodes = set(focus_accounts)
        highlighted_edges: list[str] = []

        for tx in relevant:
            sender = tx["sender_account"]
            receiver = tx["receiver_account"]
            nodes.setdefault(
                sender,
                {
                    "data": {"id": sender, "label": sender},
                    "classes": self._graph_node_classes(sender, highlighted_nodes),
                },
            )
            nodes.setdefault(
                receiver,
                {
                    "data": {"id": receiver, "label": receiver},
                    "classes": self._graph_node_classes(receiver, highlighted_nodes),
                },
            )

            edge_id = f"{sender}->{receiver}"
            classes = self._graph_edge_classes(sender, receiver, focus_accounts)
            if classes == "highlighted":
                highlighted_edges.append(edge_id)
            existing = edges_by_id.get(edge_id)
            if existing and float(existing["data"]["amount"]) >= tx["amount"]:
                continue
            edges_by_id[edge_id] = {
                "data": {
                    "id": edge_id,
                    "source": sender,
                    "target": receiver,
                    "label": f"${tx['amount']:,.0f}",
                    "amount": f"{tx['amount']:.2f}",
                    "timestamp": self._format_timestamp(tx["timestamp"]),
                },
                "classes": classes,
            }

        recipient_fan_in = sum(1 for tx in relevant if tx["receiver_account"] == alert.receiver_account)
        recipient_fan_out = sum(1 for tx in relevant if tx["sender_account"] == alert.receiver_account)
        edges = list(edges_by_id.values())
        suspicious_nodes = sorted(
            node_id
            for node_id in nodes
            if node_id.startswith("MULE") or node_id.startswith("CASH")
        )
        metrics = self._incident_graph_metrics(
            relevant=relevant,
            recipient_account=alert.receiver_account,
            highlighted_nodes=highlighted_nodes,
            suspicious_nodes=suspicious_nodes,
        )

        return GraphResponse(
            transaction_id=incident_id,
            nodes=list(nodes.values()),
            edges=edges,
            highlighted_node_ids=sorted(highlighted_nodes),
            highlighted_edge_ids=highlighted_edges,
            suspicious_cluster_ids=suspicious_nodes,
            metrics=GraphSignals(
                distance_to_suspicious_cluster=metrics.distance_to_suspicious_cluster,
                recipient_fan_in=recipient_fan_in,
                recipient_fan_out=recipient_fan_out,
                rapid_chain_detected=metrics.rapid_chain_detected,
                cycle_detected=metrics.cycle_detected,
            ),
        )

    def chat_about_incident(
        self, incident_id: str, message: str, history: list[dict[str, str]]
    ) -> IncidentChatResponse:
        detail = self.get_incident_detail(incident_id)
        context = {
            "incident_id": detail.incident_id,
            "title": detail.title,
            "decision": detail.decision,
            "severity": detail.severity,
            "overall_risk": detail.overall_risk,
            "transaction_risk": detail.transaction_risk,
            "behavior_risk": detail.behavior_risk,
            "network_risk": detail.network_risk,
            "reasons": detail.reasons,
            "transaction_anomalies": detail.transaction_anomalies,
            "behavior_anomalies": detail.behavior_anomalies,
            "network_anomalies": detail.network_anomalies,
            "recommended_action": detail.recommended_action,
        }

        fallback_answer = (
            f"{detail.title} is marked {detail.decision} at {round(detail.overall_risk * 100)}% risk. "
            f"The strongest contributors are {', '.join(detail.reasons[:2])}."
        )
        response = self.explanations.chat(
            transaction_context=context,
            message=message,
            history=history,
            fallback_answer=fallback_answer,
            fallback_follow_ups=[
                "Which score contributed the most?",
                "What behavior signals stand out?",
            ],
        )
        return IncidentChatResponse(**response.model_dump())

    def _queue_item_from_alert(self, alert) -> IncidentQueueItem:
        return IncidentQueueItem(
            incident_id=self._incident_id(alert),
            title=alert.alert_title,
            decision=alert.action,
            severity=alert.severity,
            overall_risk=round(alert.final_risk, 2),
            amount=round(alert.amount, 2),
            counterpart_label=self._counterpart_label(alert),
            timeline_label=self._timeline_label(alert),
            top_reasons=self._top_reasons(alert),
            summary=alert.explanation,
            generated_at=self._generated_at(alert),
            type=alert.type,
            manually_injected=alert.manually_injected,
            injected_scenario=alert.injected_scenario,
        )

    def _incident_id(self, alert) -> str:
        anchor = alert.transaction_id or alert.cluster_id or "incident"
        return f"incident-{alert.type}-{anchor}"

    def _find_alert(self, incident_id: str):
        snapshot = live_monitor_service.current_snapshot()
        self._sync_from_snapshot(snapshot)
        if incident_id in self._alert_cache:
            return self._alert_cache[incident_id]
        raise KeyError(incident_id)

    def _find_transaction(self, alert) -> dict[str, Any] | None:
        if not alert.transaction_id:
            return None
        cached = self._transaction_cache.get(alert.transaction_id)
        if cached:
            return cached
        snapshot = live_monitor_service.current_snapshot()
        self._sync_from_snapshot(snapshot)
        cached = self._transaction_cache.get(alert.transaction_id)
        if cached:
            return cached
        for tx in snapshot.enriched:
            if tx["transaction_id"] == alert.transaction_id:
                return tx
        return None

    def _sync_from_snapshot(self, snapshot) -> None:
        for tx in snapshot.enriched[-120:]:
            transaction_id = tx["transaction_id"]
            self._transaction_cache[transaction_id] = tx

        while len(self._transaction_cache) > self._max_transaction_cache:
            oldest_transaction_id = next(iter(self._transaction_cache))
            self._transaction_cache.pop(oldest_transaction_id, None)

        alerts_by_time = sorted(
            snapshot.payload.alerts,
            key=lambda alert: (
                self._timestamp_for_alert(alert, snapshot),
                f"{alert.final_risk:.4f}",
            ),
            reverse=True,
        )

        for alert in alerts_by_time:
            incident_id = self._incident_id(alert)
            self._alert_cache[incident_id] = alert
            self._incident_timestamps[incident_id] = self._timestamp_for_alert(alert, snapshot)
            if incident_id in self._feed_incident_ids:
                self._feed_incident_ids.remove(incident_id)
            self._feed_incident_ids.insert(0, incident_id)

        if len(self._feed_incident_ids) > self._max_feed_size:
            self._feed_incident_ids = self._feed_incident_ids[: self._max_feed_size]

    def _generate_explanation(self, alert):
        transaction_anomalies = self._transaction_anomalies(alert)
        behavior_anomalies = self._behavior_anomalies(alert)
        network_anomalies = list(alert.network_evidence)
        fallback_action = self._action_copy(alert.action)
        return self.explanations.generate(
            payload={
                "incident_id": self._incident_id(alert),
                "decision": alert.action,
                "final_score": alert.final_risk,
                "transaction_reasons": transaction_anomalies,
                "behavior_anomalies": behavior_anomalies,
                "graph_anomalies": network_anomalies,
            },
            fallback_explanation=alert.explanation,
            fallback_bullets=self._top_reasons(alert)[:2],
            fallback_action=fallback_action,
        )

    def _top_reasons(self, alert) -> list[str]:
        return self._combine_unique(alert.rule_reasons, alert.network_evidence)[:2]

    def _transaction_anomalies(self, alert) -> list[str]:
        items = []
        if alert.transaction_anomaly_score >= 0.75:
            items.append("transaction pattern is a strong anomaly versus recent transfer behavior")
        if alert.transaction_anomaly_score >= 0.55:
            items.append("money movement falls outside the sender's recent transfer profile")
        if alert.rule_reasons:
            items.extend(alert.rule_reasons[:2])
        return self._combine_unique(items)

    def _behavior_anomalies(self, alert) -> list[str]:
        reasons = []
        joined = " ".join(alert.rule_reasons).lower()
        if "unseen device" in joined:
            reasons.append("session originated from a new device")
        if "unseen ip and country" in joined:
            reasons.append("session came from a new IP and geography")
        if "impossible travel" in joined:
            reasons.append("login-to-payment sequence implies impossible travel")
        if "many recipients" in joined:
            reasons.append("beneficiary behavior drifted from the usual payment pattern")
        if not reasons:
            reasons.append("behavior profile is elevated because the transfer context deviates from baseline")
        return self._combine_unique(reasons)

    def _behavior_risk(self, alert) -> float:
        score = 0.18
        joined = " ".join(alert.rule_reasons).lower()
        if "unseen device" in joined:
            score += 0.22
        if "unseen ip and country" in joined:
            score += 0.18
        if "impossible travel" in joined:
            score += 0.2
        if "many recipients" in joined:
            score += 0.1
        if alert.type == "ring":
            score += 0.06
        return min(score, 0.95)

    def _behavior_profile(self, alert, tx: dict[str, Any] | None) -> IncidentBehaviorProfile:
        subject = alert.sender_account or "cluster operator"
        baseline = 98 + (sum(ord(ch) for ch in subject) % 45)
        current = int(baseline * (1.15 + self._behavior_risk(alert)))
        expected_path = ["Login", "Accounts", "Payments", "Confirm"]
        current_path = (
            ["Login", "Profile", "Payments", "New Payee", "Confirm"]
            if alert.type == "transaction"
            else ["Login", "Transfers", "Transfers", "Transfers", "Cash-out"]
        )
        similarity = round(
            SequenceMatcher(None, " > ".join(expected_path), " > ".join(current_path)).ratio(),
            2,
        )
        return IncidentBehaviorProfile(
            subject_label=subject,
            baseline_login_to_transfer_sec=baseline,
            current_login_to_transfer_sec=current,
            expected_path=expected_path,
            current_path=current_path,
            path_similarity=similarity,
            new_device="unseen device" in " ".join(alert.rule_reasons).lower(),
            payee_added=bool(tx and tx.get("is_new_receiver")),
        )

    def _counterpart_label(self, alert) -> str:
        if alert.type == "ring":
            accounts = alert.accounts_involved[:3]
            suffix = "..." if len(alert.accounts_involved) > 3 else ""
            return " -> ".join(accounts) + suffix
        return alert.receiver_account or alert.cluster_id or "Unknown counterpart"

    def _timeline_label(self, alert) -> str:
        alert_type = "Network exposure" if alert.type == "ring" else "Payment anomaly"
        return f"{alert_type} · {self._format_timestamp(self._generated_at(alert))}"

    def _generated_at(self, alert) -> str:
        incident_id = self._incident_id(alert)
        if incident_id in self._incident_timestamps:
            return self._incident_timestamps[incident_id]
        return self._timestamp_for_alert(alert)

    def _timestamp_for_alert(self, alert, snapshot=None) -> str:
        if alert.transaction_id:
            cached = self._transaction_cache.get(alert.transaction_id)
            if cached:
                return cached["timestamp"]

        if snapshot is None:
            snapshot = live_monitor_service.current_snapshot()

        if alert.transaction_id:
            for tx in snapshot.enriched:
                if tx["transaction_id"] == alert.transaction_id:
                    return tx["timestamp"]

        return snapshot.payload.generated_at or ""

    def _format_timestamp(self, timestamp: str) -> str:
        if not timestamp:
            return "Unknown time"
        try:
            parsed = datetime.fromisoformat(timestamp)
        except ValueError:
            return timestamp
        return parsed.strftime("%b %d, %Y, %I:%M:%S %p")

    def _action_copy(self, action: str) -> str:
        mapping = {
            "allow": "Allow and monitor",
            "review": "Escalate for analyst review",
            "hold": "Hold payment pending verification",
            "block": "Block and investigate",
        }
        return mapping.get(action, "Escalate for analyst review")

    def _graph_node_classes(self, node_id: str, highlighted_nodes: set[str]) -> str:
        classes = []
        if node_id in highlighted_nodes:
            classes.append("highlighted")
        if node_id.startswith("MULE") or node_id.startswith("CASH"):
            classes.append("suspicious")
        return " ".join(classes)

    def _graph_edge_classes(
        self, sender: str, receiver: str, focus_accounts: set[str]
    ) -> str:
        if sender in focus_accounts and receiver in focus_accounts:
            return "highlighted"
        if sender in focus_accounts or receiver in focus_accounts:
            return "branch"
        return ""

    def _incident_graph_metrics(
        self,
        relevant: list[dict[str, Any]],
        recipient_account: str | None,
        highlighted_nodes: set[str],
        suspicious_nodes: list[str],
    ) -> GraphSignals:
        account_graph = nx.DiGraph()
        timestamps_by_edge: list[tuple[str, str, datetime]] = []

        for tx in relevant:
            sender = tx["sender_account"]
            receiver = tx["receiver_account"]
            account_graph.add_edge(sender, receiver)
            try:
                parsed = datetime.fromisoformat(tx["timestamp"])
            except (KeyError, TypeError, ValueError):
                continue
            timestamps_by_edge.append((sender, receiver, parsed))

        distance: int | None = None
        if recipient_account and recipient_account in account_graph and suspicious_nodes:
            undirected = account_graph.to_undirected()
            candidate_distances: list[int] = []
            for suspicious in suspicious_nodes:
                if suspicious not in undirected:
                    continue
                try:
                    candidate_distances.append(
                        nx.shortest_path_length(undirected, recipient_account, suspicious)
                    )
                except nx.NetworkXNoPath:
                    continue
            if candidate_distances:
                distance = min(candidate_distances)

        rapid_chain_detected = self._has_rapid_chain(timestamps_by_edge)
        cycle_detected = (
            len(list(nx.simple_cycles(account_graph))) > 0 if account_graph.number_of_edges() else False
        )

        return GraphSignals(
            distance_to_suspicious_cluster=distance,
            recipient_fan_in=0,
            recipient_fan_out=0,
            rapid_chain_detected=rapid_chain_detected,
            cycle_detected=cycle_detected,
        )

    def _has_rapid_chain(
        self, timestamps_by_edge: list[tuple[str, str, datetime]], max_gap_seconds: int = 300
    ) -> bool:
        if len(timestamps_by_edge) < 2:
            return False

        ordered = sorted(timestamps_by_edge, key=lambda item: item[2])
        for index, (sender_a, receiver_a, time_a) in enumerate(ordered):
            for sender_b, _receiver_b, time_b in ordered[index + 1 :]:
                if (time_b - time_a).total_seconds() > max_gap_seconds:
                    break
                if receiver_a == sender_b:
                    return True
                if sender_a == sender_b:
                    return True
        return False

    def _combine_unique(self, *groups: list[str]) -> list[str]:
        seen: list[str] = []
        for group in groups:
            for item in group:
                if item and item not in seen:
                    seen.append(item)
        return seen


incident_service = IncidentService()
