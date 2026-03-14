from __future__ import annotations

import json
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

import networkx as nx
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from ..config import (
    APPROVE_THRESHOLD,
    BEHAVIOR_WEIGHT,
    BLOCK_THRESHOLD,
    CASES_PATH,
    CSV_PATH,
    CSV_SAMPLE_ROWS,
    DATA_DIR,
    MULE_EDGES,
    NETWORK_WEIGHT,
    SESSIONS_PATH,
    SUSPICIOUS_CLUSTER_IDS,
    TRANSACTION_WEIGHT,
)
from ..models import (
    BehaviorProfile,
    BehaviorSignals,
    DashboardSummary,
    GraphResponse,
    GraphSignals,
    RiskDistributionItem,
    ScoredTransaction,
    TransactionChatResponse,
    TransactionFeedItem,
)
from .explanation import ExplanationService


@dataclass
class SessionProfile:
    user_id: str
    account_id: str
    customer_name: str
    baseline_login_to_transfer_sec: int
    expected_path: list[str]
    known_devices: list[str]


class SentinelService:
    def __init__(self) -> None:
        self.explanations = ExplanationService()
        self.df = self._load_dataframe()
        self.graph = self._build_graph()
        self.profiles, self.sessions = self._load_sessions()
        self.cases = self._load_cases()
        self.scaler = self._fit_scaler()

    def _load_dataframe(self) -> pd.DataFrame:
        if not CSV_PATH.exists():
            raise FileNotFoundError(
                f"Dataset not found at {CSV_PATH}. Copy sentinel_clean_transactions.csv into data/."
            )

        df = pd.read_csv(CSV_PATH, nrows=CSV_SAMPLE_ROWS)
        df["is_new_payee"] = (
            df.groupby("nameOrig")["nameDest"].transform(lambda x: ~x.duplicated()).astype(int)
        )
        df["balance_delta"] = df["oldbalanceOrg"] - df["newbalanceOrig"]
        df["balance_ratio"] = df["amount"] / (df["oldbalanceOrg"] + 1)
        return df

    def _build_graph(self) -> nx.DiGraph:
        graph = nx.from_pandas_edgelist(
            self.df,
            source="nameOrig",
            target="nameDest",
            edge_attr=["amount", "step"],
            create_using=nx.DiGraph(),
        )

        graph.add_edges_from(MULE_EDGES)
        for index, (source, target) in enumerate(MULE_EDGES, start=1):
            graph[source][target].update(
                {
                    "amount": float(4200 + index * 375),
                    "step": 900 + index,
                    "kind": "mule_path",
                }
            )

        extra_edges = [
            ("victim_account", "trusted_vendor_01", {"amount": 1840.0, "step": 215, "kind": "safe"}),
            ("trusted_vendor_01", "utility_pool", {"amount": 860.0, "step": 216, "kind": "safe"}),
            ("review_account", "bridge_account", {"amount": 9200.0, "step": 246, "kind": "review"}),
            ("bridge_account", "mule_B", {"amount": 9100.0, "step": 247, "kind": "review"}),
            ("peer_alpha", "bridge_account", {"amount": 2300.0, "step": 240, "kind": "context"}),
            ("peer_beta", "bridge_account", {"amount": 2100.0, "step": 241, "kind": "context"}),
        ]
        for source, target, attrs in extra_edges:
            graph.add_edge(source, target, **attrs)

        return graph

    def _load_sessions(self) -> tuple[dict[str, SessionProfile], dict[str, dict[str, Any]]]:
        raw = json.loads(SESSIONS_PATH.read_text())
        profiles = {
            item["user_id"]: SessionProfile(**item)
            for item in raw["profiles"]
        }
        sessions = {item["session_id"]: item for item in raw["sessions"]}
        return profiles, sessions

    def _load_cases(self) -> dict[str, dict[str, Any]]:
        raw = json.loads(CASES_PATH.read_text())
        return {item["transaction_id"]: item for item in raw["cases"]}

    def _fit_scaler(self) -> MinMaxScaler:
        sender_out_degree = self.df["nameOrig"].map(dict(self.graph.out_degree())).fillna(0)
        recipient_in_degree = self.df["nameDest"].map(dict(self.graph.in_degree())).fillna(0)
        frame = pd.DataFrame(
            {
                "amount": self.df["amount"],
                "balance_ratio": self.df["balance_ratio"],
                "sender_out_degree": sender_out_degree,
                "recipient_in_degree": recipient_in_degree,
            }
        )
        scaler = MinMaxScaler(clip=True)
        scaler.fit(frame)
        return scaler

    def get_dashboard_summary(self) -> DashboardSummary:
        cases = [self.get_case_detail(case_id) for case_id in sorted(self.cases, key=self._sort_key)]
        approved_count = sum(case.decision == "approve" for case in cases)
        review_count = sum(case.decision == "review" for case in cases)
        blocked_count = sum(case.decision == "block" for case in cases)
        blocked_amount = sum(case.amount for case in cases if case.decision == "block")

        feed_items = [
            TransactionFeedItem(
                transaction_id=case.transaction_id,
                scenario=case.scenario,
                title=case.title,
                timeline_label=case.timeline_label,
                user_id=case.user_id,
                recipient_label=case.recipient_label,
                amount=round(case.amount, 2),
                overall_risk=round(case.overall_risk, 2),
                decision=case.decision,
            )
            for case in cases
        ]

        return DashboardSummary(
            analyzed_transactions=len(self.df),
            total_cases=len(cases),
            approved_count=approved_count,
            review_count=review_count,
            blocked_count=blocked_count,
            blocked_amount=round(blocked_amount, 2),
            risk_distribution=[
                RiskDistributionItem(label="Approve", count=approved_count),
                RiskDistributionItem(label="Review", count=review_count),
                RiskDistributionItem(label="Block", count=blocked_count),
            ],
            cases=feed_items,
        )

    def get_case_detail(self, transaction_id: str) -> ScoredTransaction:
        case = self.cases[transaction_id]
        transaction_score, transaction_reasons = self._score_transaction(case)
        behavior_score, behavior_signals, behavior_reasons = self._score_behavior(case)
        network_score, graph_signals, network_reasons = self._score_network(case)

        overall = round(
            TRANSACTION_WEIGHT * transaction_score
            + BEHAVIOR_WEIGHT * behavior_score
            + NETWORK_WEIGHT * network_score,
            2,
        )
        decision = self._decision_for_score(overall)

        reasons = self._compose_reasons(transaction_reasons, behavior_reasons, network_reasons)
        fallback_explanation, fallback_bullets, fallback_action = self._fallback_copy(
            decision,
            reasons,
            behavior_reasons,
            network_reasons,
        )
        explanation = self.explanations.generate(
            payload={
                "transaction_id": transaction_id,
                "final_score": overall,
                "decision": decision,
                "transaction_reasons": transaction_reasons,
                "behavior_anomalies": behavior_reasons,
                "graph_anomalies": network_reasons,
            },
            fallback_explanation=fallback_explanation,
            fallback_bullets=fallback_bullets,
            fallback_action=fallback_action,
        )

        detail = ScoredTransaction(
            transaction_id=transaction_id,
            user_id=case["user_id"],
            scenario=case["scenario"],
            title=case["title"],
            timeline_label=case["timeline_label"],
            decision=decision,
            amount=round(case["amount"], 2),
            recipient_label=case["recipient_label"],
            overall_risk=overall,
            transaction_risk=round(transaction_score, 2),
            behavior_risk=round(behavior_score, 2),
            network_risk=round(network_score, 2),
            reasons=reasons,
            transaction_anomalies=transaction_reasons,
            behavior_anomalies=behavior_reasons,
            network_anomalies=network_reasons,
            behavior_signals=behavior_signals,
            graph_signals=graph_signals,
            openai_explanation=explanation.explanation,
            openai_summary_bullets=explanation.bullets,
            recommended_action=explanation.action,
            ai_mode=explanation.mode,
        )
        return detail

    def get_behavior_profile(self, user_id: str) -> BehaviorProfile:
        profile = self.profiles[user_id]
        recent_sessions = [
            self.sessions[case["session_id"]]
            for case in sorted(self.cases.values(), key=lambda item: item["sort_order"], reverse=True)
            if case["user_id"] == user_id
        ]
        return BehaviorProfile(
            user_id=user_id,
            customer_name=profile.customer_name,
            baseline_login_to_transfer_sec=profile.baseline_login_to_transfer_sec,
            expected_path=profile.expected_path,
            known_devices=profile.known_devices,
            recent_sessions=recent_sessions,
        )

    def get_graph(self, transaction_id: str) -> GraphResponse:
        detail = self.get_case_detail(transaction_id)
        case = self.cases[transaction_id]
        source = case["source_account"]
        recipient = case["recipient_account"]

        if case["scenario"] == "blocked_case":
            nodes = [
                self._graph_node(source, "Victim Account", "source"),
                self._graph_node("mule_A", "Recipient", "recipient suspicious"),
                self._graph_node("mule_B", "Splitter", "suspicious"),
                self._graph_node("mule_C", "Relay", "suspicious"),
                self._graph_node("mule_D", "Branch Mule", "suspicious"),
                self._graph_node("cashout_account", "Cash-out", "cashout suspicious"),
            ]
            edges = [
                self._graph_edge(
                    source,
                    "mule_A",
                    f"${case['amount']:,.0f}",
                    "highlighted",
                    amount=case["amount"],
                    timestamp=case["timeline_label"],
                ),
                self._graph_edge("mule_A", "mule_B", "Relay", "highlighted", timestamp=case["timeline_label"]),
                self._graph_edge("mule_B", "mule_C", "Relay", "highlighted", timestamp=case["timeline_label"]),
                self._graph_edge("mule_B", "mule_D", "Fan-out", "branch", timestamp=case["timeline_label"]),
                self._graph_edge(
                    "mule_C",
                    "cashout_account",
                    "Cash-out",
                    "highlighted",
                    timestamp=case["timeline_label"],
                ),
            ]
            highlighted_nodes = [source, "mule_A", "mule_B", "mule_C", "cashout_account"]
            highlighted_edges = [
                f"{source}->mule_A",
                "mule_A->mule_B",
                "mule_B->mule_C",
                "mule_C->cashout_account",
            ]
        elif case["scenario"] == "review_case":
            nodes = [
                self._graph_node(source, "Origin Account", "source"),
                self._graph_node(recipient, "Bridge Account", "recipient"),
                self._graph_node("mule_B", "Cluster Node", "suspicious"),
                self._graph_node("mule_C", "Relay", "suspicious"),
                self._graph_node("cashout_account", "Cash-out", "cashout suspicious"),
            ]
            edges = [
                self._graph_edge(
                    source,
                    recipient,
                    f"${case['amount']:,.0f}",
                    "highlighted",
                    amount=case["amount"],
                    timestamp=case["timeline_label"],
                ),
                self._graph_edge(
                    recipient,
                    "mule_B",
                    "One-hop link",
                    "highlighted",
                    timestamp=case["timeline_label"],
                ),
                self._graph_edge("mule_B", "mule_C", "Relay", "context", timestamp=case["timeline_label"]),
                self._graph_edge(
                    "mule_C",
                    "cashout_account",
                    "Cash-out",
                    "context",
                    timestamp=case["timeline_label"],
                ),
            ]
            highlighted_nodes = [source, recipient, "mule_B"]
            highlighted_edges = [f"{source}->{recipient}", f"{recipient}->mule_B"]
        else:
            nodes = [
                self._graph_node(source, "Customer Account", "source"),
                self._graph_node(recipient, "Trusted Vendor", "recipient safe"),
                self._graph_node("utility_pool", "Utility Pool", "safe"),
            ]
            edges = [
                self._graph_edge(
                    source,
                    recipient,
                    f"${case['amount']:,.0f}",
                    "highlighted",
                    amount=case["amount"],
                    timestamp=case["timeline_label"],
                ),
                self._graph_edge(
                    recipient,
                    "utility_pool",
                    "Settlement",
                    "context",
                    timestamp=case["timeline_label"],
                ),
            ]
            highlighted_nodes = [source, recipient]
            highlighted_edges = [f"{source}->{recipient}"]

        return GraphResponse(
            transaction_id=transaction_id,
            nodes=nodes,
            edges=edges,
            highlighted_node_ids=highlighted_nodes,
            highlighted_edge_ids=highlighted_edges,
            suspicious_cluster_ids=sorted(SUSPICIOUS_CLUSTER_IDS),
            metrics=detail.graph_signals,
        )

    def generate_explanation(self, payload: dict[str, Any]) -> dict[str, Any]:
        explanation = self.explanations.generate(
            payload=payload,
            fallback_explanation="Review the evidence and follow the decision band shown by Sentinel.",
            fallback_bullets=payload.get("transaction_reasons", [])[:1] + payload.get("behavior_anomalies", [])[:1],
            fallback_action=payload.get("decision", "review"),
        )
        return explanation.model_dump()

    def chat_about_transaction(
        self, transaction_id: str, message: str, history: list[dict[str, str]]
    ) -> TransactionChatResponse:
        detail = self.get_case_detail(transaction_id)
        profile = self.get_behavior_profile(detail.user_id)
        context = {
            "transaction_id": detail.transaction_id,
            "decision": detail.decision,
            "overall_risk": detail.overall_risk,
            "transaction_risk": detail.transaction_risk,
            "behavior_risk": detail.behavior_risk,
            "network_risk": detail.network_risk,
            "amount": detail.amount,
            "recipient_label": detail.recipient_label,
            "recommended_action": detail.recommended_action,
            "reasons": detail.reasons,
            "transaction_anomalies": detail.transaction_anomalies,
            "behavior_anomalies": detail.behavior_anomalies,
            "network_anomalies": detail.network_anomalies,
            "behavior_signals": detail.behavior_signals.model_dump(),
            "graph_signals": detail.graph_signals.model_dump(),
            "customer_name": profile.customer_name,
            "expected_path": profile.expected_path,
        }
        fallback_answer, fallback_follow_ups = self._fallback_chat_response(detail, message)
        return self.explanations.chat(
            transaction_context=context,
            message=message,
            history=history,
            fallback_answer=fallback_answer,
            fallback_follow_ups=fallback_follow_ups,
        )

    def _score_transaction(self, case: dict[str, Any]) -> tuple[float, list[str]]:
        source = case["source_account"]
        recipient = case["recipient_account"]
        amount = float(case["amount"])
        balance_ratio = amount / (float(case["oldbalanceOrg"]) + 1)
        sender_out_degree = float(self.graph.out_degree(source))
        recipient_in_degree = float(self.graph.in_degree(recipient))
        scaled = self.scaler.transform(
            pd.DataFrame(
                [
                    {
                        "amount": amount,
                        "balance_ratio": balance_ratio,
                        "sender_out_degree": sender_out_degree,
                        "recipient_in_degree": recipient_in_degree,
                    }
                ]
            )
        )[0]
        transfer_flag = 1.0 if case["type"] == "TRANSFER" else 0.35
        new_payee_flag = 0.0 if case["known_recipient"] else 1.0
        score = (
            0.35 * scaled[0]
            + 0.30 * scaled[1]
            + 0.10 * scaled[2]
            + 0.05 * scaled[3]
            + 0.10 * transfer_flag
            + 0.10 * new_payee_flag
        )
        if balance_ratio > 0.85:
            score += 0.16
        if new_payee_flag and amount > 2500:
            score += 0.06
        score = min(max(score, 0.0), 0.99)

        reason_candidates = [
            (scaled[1], "transfer amount consumed an unusually large share of the source balance"),
            (new_payee_flag, "recipient has not appeared in the sender's recent payment history"),
            (scaled[0], "transfer amount sits high relative to the sampled ledger range"),
            (scaled[3], "recipient already receives funds from several counterparties"),
        ]
        reasons = [reason for weight, reason in sorted(reason_candidates, reverse=True) if weight > 0.35][:3]
        return round(score, 4), reasons

    def _score_behavior(
        self, case: dict[str, Any]
    ) -> tuple[float, BehaviorSignals, list[str]]:
        profile = self.profiles[case["user_id"]]
        session = self.sessions[case["session_id"]]
        baseline = profile.baseline_login_to_transfer_sec
        current = int(session["login_to_transfer_sec"])
        path_similarity = SequenceMatcher(
            a=">".join(profile.expected_path),
            b=">".join(session["page_path"]),
        ).ratio()
        path_mismatch_score = max(0.0, 1 - path_similarity)
        time_deviation = min(abs(current - baseline) / max(baseline, 1), 1.0)
        new_device = session["device_id"] not in profile.known_devices
        payee_added = bool(session["payee_added"])

        score = 0.6 * time_deviation + 0.4 * path_mismatch_score
        if new_device:
            score += 0.05
        if payee_added:
            score += 0.03
        score = min(score, 0.99)

        reasons: list[str] = []
        if time_deviation > 0.25:
            reasons.append("session reached transfer confirmation much faster than the user baseline")
        if path_mismatch_score > 0.15:
            reasons.append("navigation flow diverged from the customer's normal transfer journey")
        if new_device:
            reasons.append("session originated from a previously unseen device")
        if payee_added:
            reasons.append("payee was added during the same session")

        behavior_signals = BehaviorSignals(
            baseline_login_to_transfer_sec=baseline,
            current_login_to_transfer_sec=current,
            page_path_mismatch=path_mismatch_score > 0.15,
            path_similarity=round(path_similarity, 2),
            new_device=new_device,
            payee_added=payee_added,
        )
        return round(score, 4), behavior_signals, reasons[:4]

    def _score_network(
        self, case: dict[str, Any]
    ) -> tuple[float, GraphSignals, list[str]]:
        recipient = case["recipient_account"]
        fan_in = int(self.graph.in_degree(recipient))
        fan_out = int(self.graph.out_degree(recipient))
        distance = self._nearest_suspicious_distance(recipient)
        rapid_chain_steps = self._path_to_cashout_steps(recipient)
        rapid_chain = rapid_chain_steps is not None and rapid_chain_steps <= 3
        cycle_detected = recipient in {"mule_B", "mule_C"}

        if recipient in SUSPICIOUS_CLUSTER_IDS:
            base = 0.78
        elif distance == 1:
            base = 0.48
        elif distance == 2:
            base = 0.32
        elif distance == 3:
            base = 0.20
        else:
            base = 0.03

        score = (
            base
            + min(fan_in / 6, 1.0) * 0.08
            + min(fan_out / 5, 1.0) * 0.05
            + (0.10 if rapid_chain else 0.0)
            + (0.03 if cycle_detected else 0.0)
        )
        score = min(score, 0.99)

        reasons: list[str] = []
        if recipient in SUSPICIOUS_CLUSTER_IDS:
            reasons.append("recipient sits inside a suspicious mule cluster")
        elif distance is not None:
            reasons.append(f"recipient is {distance} hop away from a suspicious mule cluster")
        if rapid_chain:
            reasons.append("funds can move from the recipient to a cash-out node in a short chain")
        if fan_in >= 3 or fan_out >= 2:
            reasons.append("recipient shows elevated fan-in or fan-out activity")
        if cycle_detected:
            reasons.append("recipient is embedded in a circular transfer pattern")

        graph_signals = GraphSignals(
            distance_to_suspicious_cluster=distance,
            recipient_fan_in=fan_in,
            recipient_fan_out=fan_out,
            rapid_chain_detected=rapid_chain,
            cycle_detected=cycle_detected,
        )
        return round(score, 4), graph_signals, reasons[:4]

    def _compose_reasons(
        self,
        transaction_reasons: list[str],
        behavior_reasons: list[str],
        network_reasons: list[str],
    ) -> list[str]:
        candidates = []
        if behavior_reasons:
            candidates.append(behavior_reasons[0])
        if network_reasons:
            candidates.append(network_reasons[0])
        if transaction_reasons:
            candidates.append(transaction_reasons[0])
        for extra in behavior_reasons[1:] + network_reasons[1:] + transaction_reasons[1:]:
            if extra not in candidates:
                candidates.append(extra)
        return candidates[:3]

    def _fallback_copy(
        self,
        decision: str,
        reasons: list[str],
        behavior_reasons: list[str],
        network_reasons: list[str],
    ) -> tuple[str, list[str], str]:
        if decision == "block":
            explanation = (
                "This transfer was blocked because the session behavior sharply diverged from the "
                "customer baseline and the recipient is tied to a suspicious mule-money path."
            )
            action = "Block transfer and escalate for analyst review."
        elif decision == "review":
            explanation = (
                "This transfer should be reviewed because behavior drift and network exposure both "
                "sit above the account's normal risk profile."
            )
            action = "Queue for manual review before releasing funds."
        else:
            explanation = (
                "This transfer aligns with the customer baseline and does not show material network "
                "risk."
            )
            action = "Approve and continue passive monitoring."
        bullets = []
        if behavior_reasons:
            bullets.append(behavior_reasons[0])
        if network_reasons:
            bullets.append(network_reasons[0])
        if not bullets:
            bullets = reasons[:2]
        return explanation, bullets[:2], action

    def _fallback_chat_response(
        self, detail: ScoredTransaction, message: str
    ) -> tuple[str, list[str]]:
        prompt = message.lower()
        if any(token in prompt for token in ["why", "decision", "flag", "block", "review", "approve"]):
            answer = (
                f"Sentinel marked this transfer as {detail.decision} with {int(detail.overall_risk * 100)}% overall risk. "
                f"The strongest evidence was behavior risk at {int(detail.behavior_risk * 100)}%, "
                f"network risk at {int(detail.network_risk * 100)}%, and these signals: {detail.reasons[0]}; {detail.reasons[1]}."
            )
            follow_ups = [
                "What behavior signals stand out most?",
                "Explain the recipient network risk.",
            ]
        elif any(token in prompt for token in ["behavior", "session", "device", "path", "login"]):
            signals = detail.behavior_signals
            answer = (
                f"The session reached transfer in {signals.current_login_to_transfer_sec}s versus a "
                f"{signals.baseline_login_to_transfer_sec}s baseline. Path similarity was "
                f"{int(signals.path_similarity * 100)}%, new device was "
                f"{'yes' if signals.new_device else 'no'}, and payee-added was "
                f"{'yes' if signals.payee_added else 'no'}. That drove behavior risk to "
                f"{int(detail.behavior_risk * 100)}%."
            )
            follow_ups = [
                "How different was the navigation flow?",
                "Would this still be risky on a known device?",
            ]
        elif any(token in prompt for token in ["network", "graph", "recipient", "mule", "cluster", "hop"]):
            signals = detail.graph_signals
            distance = (
                "inside the suspicious cluster"
                if signals.distance_to_suspicious_cluster == 0
                else f"{signals.distance_to_suspicious_cluster} hop away from it"
                if signals.distance_to_suspicious_cluster is not None
                else "not connected to it"
            )
            answer = (
                f"The recipient is {distance}, with fan-in {signals.recipient_fan_in} and fan-out "
                f"{signals.recipient_fan_out}. Rapid chain detection is "
                f"{'on' if signals.rapid_chain_detected else 'off'}, which pushed network risk to "
                f"{int(detail.network_risk * 100)}%."
            )
            follow_ups = [
                "Show the cash-out path in plain language.",
                "Why is this network suspicious?",
            ]
        elif any(token in prompt for token in ["amount", "balance", "transaction", "money"]):
            answer = (
                f"The transfer amount was ${detail.amount:,.0f}. Transaction risk reached "
                f"{int(detail.transaction_risk * 100)}%, mainly because {detail.transaction_anomalies[0] if detail.transaction_anomalies else detail.reasons[-1]}."
            )
            follow_ups = [
                "How much of the source balance was used?",
                "Was the recipient seen before?",
            ]
        else:
            answer = (
                f"This case is currently {detail.decision} with {int(detail.overall_risk * 100)}% overall risk. "
                f"The clearest evidence is {detail.reasons[0]} and {detail.reasons[1]}."
            )
            follow_ups = [
                "Why did Sentinel make this decision?",
                "Break down the behavior and network signals.",
            ]
        return answer, follow_ups

    def _nearest_suspicious_distance(self, node_id: str) -> int | None:
        if node_id in SUSPICIOUS_CLUSTER_IDS:
            return 0
        distances = []
        for target in SUSPICIOUS_CLUSTER_IDS:
            try:
                distances.append(nx.shortest_path_length(self.graph, source=node_id, target=target))
            except nx.NetworkXNoPath:
                continue
        return min(distances) if distances else None

    def _path_to_cashout_steps(self, node_id: str) -> int | None:
        try:
            return nx.shortest_path_length(self.graph, source=node_id, target="cashout_account")
        except nx.NetworkXNoPath:
            return None

    def _decision_for_score(self, score: float) -> str:
        if score >= BLOCK_THRESHOLD:
            return "block"
        if score >= APPROVE_THRESHOLD:
            return "review"
        return "approve"

    def _sort_key(self, transaction_id: str) -> int:
        return self.cases[transaction_id]["sort_order"]

    @staticmethod
    def _graph_node(node_id: str, label: str, classes: str) -> dict[str, Any]:
        return {
            "data": {"id": node_id, "label": label},
            "classes": classes,
        }

    @staticmethod
    def _graph_edge(
        source: str,
        target: str,
        label: str,
        classes: str,
        amount: float | None = None,
        timestamp: str | None = None,
    ) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": f"{source}->{target}",
            "source": source,
            "target": target,
            "label": label,
        }
        if amount is not None:
            data["amount"] = f"{amount:.2f}"
        if timestamp:
            data["timestamp"] = timestamp
        return {"data": data, "classes": classes}


service = SentinelService()
