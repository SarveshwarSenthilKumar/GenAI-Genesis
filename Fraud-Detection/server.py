import json
import os
import time
from collections import Counter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, List
from urllib.parse import parse_qs, urlparse

from detection import (
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
from simulation import TransactionEngine


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


class FraudDemoService:
    def __init__(self) -> None:
        self.engine = TransactionEngine()
        self.rule_engine = RuleEngine()
        self.engine.seed(60)

    def bootstrap(self) -> Dict:
        return self._build_payload()

    def stream(self, batch_size: int = 6) -> Dict:
        self.engine.next_batch(batch_size)
        return self._build_payload()

    def _build_payload(self) -> Dict:
        started = time.perf_counter()
        transactions = self.engine.recent_transactions(120)

        feature_start = time.perf_counter()
        enriched = engineer_transaction_features(transactions)
        feature_rows = build_feature_rows(enriched)
        anomaly_scores = isolation_forest_scores(feature_rows)
        feature_latency_ms = (time.perf_counter() - feature_start) * 1000

        graph_start = time.perf_counter()
        ring_alerts, account_signals = detect_fraud_rings(enriched)
        graph_latency_ms = (time.perf_counter() - graph_start) * 1000

        alerts = []
        transaction_rows = []
        rules_triggered = 0
        action_counts = Counter()

        for tx, anomaly_score in zip(enriched, anomaly_scores):
            rule_hits = self.rule_engine.evaluate(tx, {})
            rules_triggered += len(rule_hits)
            rule_score = round(min(sum(hit.points for hit in rule_hits), 1.0), 2)
            network_score, network_evidence, cluster_id, accounts_involved, suspicious_funds_total = build_network_risk(tx, account_signals)
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

            row = {
                "transaction_id": tx["transaction_id"],
                "timestamp": tx["timestamp"],
                "sender_account": tx["sender_account"],
                "receiver_account": tx["receiver_account"],
                "amount": tx["amount"],
                "ip_country": tx["ip_country"],
                "sender_txn_count_5m": tx["sender_txn_count_5m"],
                "transaction_anomaly_score": anomaly_score,
                "rule_score": rule_score,
                "network_risk_score": network_score,
                "final_risk": final_risk,
                "severity": severity,
                "action": action,
                "transaction_type": tx["transaction_type"],
            }
            transaction_rows.append(row)

            if final_risk >= 0.5:
                alerts.append(
                    {
                        "type": "transaction",
                        "alert_title": "Suspicious transaction pattern" if final_risk < 0.85 else "Critical fraud escalation",
                        "transaction_id": tx["transaction_id"],
                        "sender_account": tx["sender_account"],
                        "receiver_account": tx["receiver_account"],
                        "amount": tx["amount"],
                        "severity": severity,
                        "action": action,
                        "final_risk": final_risk,
                        "transaction_anomaly_score": anomaly_score,
                        "rule_score": rule_score,
                        "network_risk_score": network_score,
                        "rule_reasons": [hit.reason for hit in rule_hits][:4],
                        "network_evidence": network_evidence,
                        "cluster_id": cluster_id,
                        "accounts_involved": accounts_involved,
                        "suspicious_funds_total": suspicious_funds_total,
                        "why_flagged": {
                            "transaction_anomaly_score": anomaly_score,
                            "rule_score": rule_score,
                            "network_risk_score": network_score,
                            "final_risk": final_risk,
                            "severity": severity,
                            "action": action,
                            "breakdown": [
                                {"label": "Anomaly", "value": anomaly_score},
                                {"label": "Rules", "value": rule_score},
                                {"label": "Network", "value": network_score},
                            ],
                            "top_rule_reasons": [hit.reason for hit in rule_hits][:3],
                            "top_network_evidence": network_evidence[:3],
                        },
                        "explanation": explanation,
                    }
                )

        for alert in ring_alerts:
            severity, action = classify_risk(alert.risk_score)
            alerts.append(
                {
                    "type": "ring",
                    "alert_title": "Potential laundering ring detected",
                    "cluster_id": alert.cluster_id,
                    "accounts_involved": alert.accounts,
                    "amount": alert.total_amount,
                    "severity": severity,
                    "action": action,
                    "final_risk": alert.risk_score,
                    "rule_reasons": [],
                    "network_evidence": alert.evidence,
                    "suspicious_funds_total": alert.suspicious_funds_total,
                    "why_flagged": {
                        "transaction_anomaly_score": 0.0,
                        "rule_score": 0.0,
                        "network_risk_score": alert.risk_score,
                        "final_risk": alert.risk_score,
                        "severity": severity,
                        "action": action,
                        "breakdown": [
                            {"label": "Cycle", "value": 1.0},
                            {"label": "Flow Velocity", "value": min(alert.avg_hop_time_sec and 300.0 / max(alert.avg_hop_time_sec * alert.cycle_length, 1.0), 1.0)},
                            {"label": "Cluster Size", "value": min(alert.cycle_length / 5.0, 1.0)},
                            {"label": "Volume", "value": min(alert.total_amount / 50000.0, 1.0)},
                        ],
                        "top_rule_reasons": [],
                        "top_network_evidence": alert.evidence[:3],
                    },
                    "explanation": f"Cluster {alert.cluster_id} shows circular transfers across {alert.cycle_length} accounts with average hop time of {alert.avg_hop_time_sec:.0f} seconds.",
                }
            )

        alerts.sort(key=lambda item: item["final_risk"], reverse=True)
        top_alerts = alerts[:10]
        top_transactions = list(reversed(sorted(transaction_rows, key=lambda item: item["timestamp"])[-18:]))
        graph = self._build_graph(enriched, top_alerts)
        total_latency_ms = (time.perf_counter() - started) * 1000
        stats = self._build_stats(enriched, top_alerts, ring_alerts, rules_triggered, action_counts, feature_latency_ms, graph_latency_ms, total_latency_ms)

        return {
            "generated_at": enriched[-1]["timestamp"] if enriched else None,
            "stats": stats,
            "transactions": top_transactions,
            "alerts": top_alerts,
            "graph": graph,
        }

    def _build_stats(
        self,
        transactions: List[Dict],
        alerts: List[Dict],
        ring_alerts: List[Dict],
        rules_triggered: int,
        action_counts: Counter,
        feature_latency_ms: float,
        graph_latency_ms: float,
        total_latency_ms: float,
    ) -> Dict:
        suspicious_volume = sum(
            alert.get("amount", 0.0)
            for alert in alerts
            if alert.get("action") in {"hold", "block"}
        )
        countries = Counter(tx["ip_country"] for tx in transactions[-30:])
        return {
            "transactions_monitored": len(transactions),
            "flagged_alerts": len(alerts),
            "suspicious_volume": round(suspicious_volume, 2),
            "ring_clusters": len(ring_alerts),
            "rules_triggered": rules_triggered,
            "hot_country": countries.most_common(1)[0][0] if countries else "--",
            "blocked_count": action_counts["block"],
            "held_count": action_counts["hold"],
            "review_count": action_counts["review"],
            "allow_count": action_counts["allow"],
            "transaction_scoring_latency_ms": round(feature_latency_ms, 1),
            "graph_update_latency_ms": round(graph_latency_ms, 1),
            "total_latency_ms": round(total_latency_ms, 1),
        }

    def _build_graph(self, transactions: List[Dict], alerts: List[Dict]) -> Dict:
        focus_accounts = set()
        for alert in alerts[:6]:
            focus_accounts.update(alert.get("accounts_involved", []))
            if alert["type"] == "transaction":
                focus_accounts.update([alert["sender_account"], alert["receiver_account"]])

        relevant = [
            tx for tx in transactions
            if tx["sender_account"] in focus_accounts or tx["receiver_account"] in focus_accounts
        ][-22:]

        nodes = {}
        edges = []
        for tx in relevant:
            for account in (tx["sender_account"], tx["receiver_account"]):
                if account not in nodes:
                    nodes[account] = {
                        "id": account,
                        "label": account,
                        "kind": "cashout" if account.startswith("CASH") else ("mule" if account.startswith("MULE") else "account"),
                        "risk": 0.9 if account in focus_accounts else 0.35,
                    }
            for entity_id, entity_kind in ((tx["device_id"], "device"), (tx["ip_address"], "ip"), (tx["beneficiary_id"], "beneficiary")):
                key = f"{entity_kind}:{entity_id}"
                if key not in nodes:
                    nodes[key] = {
                        "id": key,
                        "label": entity_id,
                        "kind": entity_kind,
                        "risk": 0.55 if tx["sender_account"] in focus_accounts else 0.25,
                    }
                edges.append({"source": tx["sender_account"], "target": key, "amount": 0, "risk": nodes[key]["risk"], "label": entity_kind})
            edges.append(
                {
                    "source": tx["sender_account"],
                    "target": tx["receiver_account"],
                    "amount": tx["amount"],
                    "risk": 0.92 if tx["sender_account"] in focus_accounts or tx["receiver_account"] in focus_accounts else 0.35,
                    "label": tx["transaction_type"],
                }
            )

        return {"nodes": list(nodes.values()), "edges": edges}


service = FraudDemoService()


class FraudRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self._send_json({"status": "ok"})
        if parsed.path == "/api/bootstrap":
            return self._send_json(service.bootstrap())
        if parsed.path == "/api/stream":
            batch = int(parse_qs(parsed.query).get("batch", ["6"])[0])
            return self._send_json(service.stream(batch_size=max(1, min(batch, 12))))
        if parsed.path in {"/", "/index.html"}:
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args):
        return

    def _send_json(self, payload: Dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run() -> None:
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FraudRequestHandler)
    print(f"Fraud Detection dashboard running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
