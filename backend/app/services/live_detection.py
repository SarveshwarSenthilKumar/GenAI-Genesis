from __future__ import annotations

import math
import random
import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Sequence


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value)


def avg_path_length(sample_size: int) -> float:
    if sample_size <= 1:
        return 0.0
    return 2.0 * (math.log(sample_size - 1) + 0.5772156649) - (
        2.0 * (sample_size - 1) / sample_size
    )


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def normalize_score(raw: float, min_val: float, max_val: float) -> float:
    if max_val == min_val:
        return 0.0
    return clamp((raw - min_val) / (max_val - min_val))


def geo_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius * (2 * math.atan2(math.sqrt(a), math.sqrt(max(1 - a, 1e-9))))


class IsolationTree:
    def __init__(self, max_depth: int = 8) -> None:
        self.max_depth = max_depth
        self.root: dict | None = None

    def fit(self, rows: Sequence[Sequence[float]]) -> None:
        self.root = self._build(list(rows), 0)

    def path_length(self, row: Sequence[float]) -> float:
        return self._walk(self.root, row, 0)

    def _build(self, rows: list[Sequence[float]], depth: int) -> dict:
        if depth >= self.max_depth or len(rows) <= 1:
            return {"size": len(rows), "leaf": True}

        feature_count = len(rows[0])
        feature_idx = random.randrange(feature_count)
        values = [row[feature_idx] for row in rows]
        low = min(values)
        high = max(values)
        if low == high:
            return {"size": len(rows), "leaf": True}

        split = random.uniform(low, high)
        left = [row for row in rows if row[feature_idx] < split]
        right = [row for row in rows if row[feature_idx] >= split]
        if not left or not right:
            return {"size": len(rows), "leaf": True}

        return {
            "leaf": False,
            "feature_idx": feature_idx,
            "split": split,
            "left": self._build(left, depth + 1),
            "right": self._build(right, depth + 1),
        }

    def _walk(self, node: dict | None, row: Sequence[float], depth: int) -> float:
        if node is None or node["leaf"]:
            return depth + avg_path_length(node["size"] if node else 0)
        branch = "left" if row[node["feature_idx"]] < node["split"] else "right"
        return self._walk(node[branch], row, depth + 1)


def isolation_forest_scores(
    rows: Sequence[Sequence[float]], tree_count: int = 80
) -> list[float]:
    if not rows:
        return []

    max_depth = max(4, math.ceil(math.log2(len(rows) + 1)))
    trees = []
    for _ in range(tree_count):
        tree = IsolationTree(max_depth=max_depth)
        sample = random.choices(rows, k=min(len(rows), 96))
        tree.fit(sample)
        trees.append(tree)

    cn = avg_path_length(len(rows))
    raw_scores = []
    for row in rows:
        avg_length = sum(tree.path_length(row) for tree in trees) / len(trees)
        raw_scores.append(pow(2.0, -avg_length / max(cn, 1e-6)))

    min_val = min(raw_scores)
    max_val = max(raw_scores)
    return [round(normalize_score(score, min_val, max_val), 3) for score in raw_scores]


@dataclass
class RuleHit:
    name: str
    triggered: bool
    points: float
    reason: str


@dataclass
class RingAlert:
    cluster_id: str
    accounts: list[str]
    total_amount: float
    cycle_length: int
    avg_hop_time_sec: float
    risk_score: float
    evidence: list[str]
    suspicious_funds_total: float


class RuleEngine:
    def evaluate(self, txn: dict, state: dict) -> list[RuleHit]:
        del state
        rules = [
            (
                "high_amount_vs_baseline",
                txn["amount_vs_sender_avg_30d"] >= 3.0,
                0.15,
                "amount is more than 3x sender baseline",
            ),
            (
                "new_device_high_amount",
                txn["is_new_device"] and txn["amount"] > 7000,
                0.20,
                "high-value transaction from unseen device",
            ),
            (
                "new_ip_new_country",
                txn["is_new_ip"] and txn["is_new_country"],
                0.15,
                "transaction originated from unseen IP and country",
            ),
            (
                "impossible_travel",
                txn["geo_velocity_kmh"] > 900,
                0.25,
                "impossible travel pattern detected",
            ),
            (
                "velocity_spike",
                txn["sender_txn_count_5m"] >= 5,
                0.20,
                "high transaction burst within 5 minutes",
            ),
            (
                "many_new_recipients",
                txn["sender_unique_receivers_24h"] >= 8,
                0.15,
                "sender transacted with unusually many recipients",
            ),
            (
                "shared_device",
                txn["accounts_per_device_24h"] >= 4,
                0.20,
                "device linked to multiple accounts",
            ),
            (
                "shared_ip",
                txn["accounts_per_ip_24h"] >= 5,
                0.20,
                "IP linked to multiple accounts",
            ),
            (
                "smurfing",
                txn["count_transfers_just_below_threshold_24h"] >= 3,
                0.25,
                "multiple transfers just below reporting threshold",
            ),
            (
                "dormant_activation",
                txn["dormant_days"] >= 90 and txn["sender_txn_count_1h"] >= 3,
                0.15,
                "previously dormant account became suddenly active",
            ),
            (
                "rapid_multi_hop",
                txn["hop_chain_length"] >= 3 and txn["time_to_cashout_sec"] <= 300,
                0.30,
                "funds moved rapidly through multiple accounts",
            ),
        ]
        return [
            RuleHit(name, triggered, points, reason)
            for name, triggered, points, reason in rules
            if triggered
        ]


def engineer_transaction_features(transactions: Sequence[dict]) -> list[dict]:
    sender_histories = defaultdict(list)
    receiver_histories = defaultdict(list)
    device_accounts = defaultdict(set)
    ip_accounts = defaultdict(set)
    last_sender_geo = {}

    enriched = []
    for tx in sorted(transactions, key=lambda item: item["timestamp"]):
        item = dict(tx)
        ts = parse_timestamp(item["timestamp"])
        sender = item["sender_account"]
        receiver = item["receiver_account"]

        sender_histories[sender] = [
            prev
            for prev in sender_histories[sender]
            if ts - parse_timestamp(prev["timestamp"]) <= timedelta(days=1)
        ]
        sender_history = sender_histories[sender]
        sender_5m = [
            prev
            for prev in sender_history
            if ts - parse_timestamp(prev["timestamp"]) <= timedelta(minutes=5)
        ]
        sender_1h = [
            prev
            for prev in sender_history
            if ts - parse_timestamp(prev["timestamp"]) <= timedelta(hours=1)
        ]
        sender_24h = sender_history
        receiver_24h = receiver_histories[receiver]

        last_geo = last_sender_geo.get(sender)
        if last_geo:
            distance = geo_distance_km(
                last_geo["geo_lat"],
                last_geo["geo_lon"],
                item["geo_lat"],
                item["geo_lon"],
            )
            gap_hours = max(
                (ts - last_geo["timestamp"]).total_seconds() / 3600.0,
                1 / 3600.0,
            )
            geo_velocity = distance / gap_hours
            time_since_last = (ts - last_geo["timestamp"]).total_seconds()
        else:
            distance = 0.0
            geo_velocity = 0.0
            time_since_last = 86400.0

        sender_devices_24h = {prev["device_id"] for prev in sender_24h}
        sender_ips_24h = {prev["ip_address"] for prev in sender_24h}
        sender_receivers_24h = {prev["receiver_account"] for prev in sender_24h}
        just_below = [
            prev
            for prev in sender_24h
            if 9000 <= prev["amount"] < 10000 and prev["transaction_type"] == "transfer"
        ]

        item["hour_of_day"] = ts.hour
        item["day_of_week"] = ts.weekday()
        item["log_amount"] = round(math.log1p(item["amount"]), 4)
        item["amount_vs_sender_avg_30d"] = round(
            item["amount"] / max(item["sender_avg_amount_30d"], 1.0), 3
        )
        item["sender_txn_count_5m"] = len(sender_5m) + 1
        item["sender_txn_count_1h"] = len(sender_1h) + 1
        item["sender_txn_count_24h"] = len(sender_24h) + 1
        item["sender_unique_receivers_24h"] = len(sender_receivers_24h | {receiver})
        item["sender_unique_devices_24h"] = len(sender_devices_24h | {item["device_id"]})
        item["sender_unique_ips_24h"] = len(sender_ips_24h | {item["ip_address"]})
        item["time_since_last_sender_txn_sec"] = round(time_since_last, 2)
        item["is_new_device"] = 0 if item["device_seen_before"] else 1
        item["is_new_ip"] = 0 if item["ip_seen_before"] else 1
        item["is_new_receiver"] = 0 if item["receiver_seen_before"] else 1
        item["is_new_country"] = 1 if item["ip_country"] != item["sender_home_country"] else 0
        item["geo_distance_from_last_txn_km"] = round(distance, 2)
        item["geo_velocity_kmh"] = round(geo_velocity, 2)
        item["accounts_per_device_24h"] = len(device_accounts[item["device_id"]] | {sender})
        item["accounts_per_ip_24h"] = len(ip_accounts[item["ip_address"]] | {sender})
        item["senders_to_receiver_24h"] = len(
            {prev["sender_account"] for prev in receiver_24h} | {sender}
        )
        item["count_transfers_just_below_threshold_24h"] = len(just_below)
        item["dormant_days"] = min(
            item["sender_account_age_days"], int(time_since_last / 86400.0)
        )
        item["hop_chain_length"] = 1
        item["time_to_cashout_sec"] = 999999.0

        enriched.append(item)
        sender_histories[sender].append(item)
        receiver_histories[receiver].append(item)
        device_accounts[item["device_id"]].add(sender)
        ip_accounts[item["ip_address"]].add(sender)
        last_sender_geo[sender] = {
            "geo_lat": item["geo_lat"],
            "geo_lon": item["geo_lon"],
            "timestamp": ts,
        }

    return enriched


def build_feature_rows(transactions: Sequence[dict]) -> list[list[float]]:
    rows = []
    for tx in transactions:
        rows.append(
            [
                clamp(tx["amount"] / 20000.0),
                clamp(tx["log_amount"] / 10.0),
                tx["hour_of_day"] / 23.0,
                tx["day_of_week"] / 6.0,
                clamp(tx["sender_account_age_days"] / 1500.0),
                clamp(tx["receiver_account_age_days"] / 1500.0),
                clamp(tx["amount_vs_sender_avg_30d"] / 8.0),
                clamp(tx["sender_txn_count_5m"] / 8.0),
                clamp(tx["sender_txn_count_1h"] / 20.0),
                clamp(tx["sender_txn_count_24h"] / 40.0),
                clamp(tx["sender_unique_receivers_24h"] / 15.0),
                clamp(tx["sender_unique_devices_24h"] / 10.0),
                clamp(tx["sender_unique_ips_24h"] / 10.0),
                clamp(tx["time_since_last_sender_txn_sec"] / 86400.0),
                float(tx["is_new_device"]),
                float(tx["is_new_ip"]),
                float(tx["is_new_receiver"]),
                float(tx["is_new_country"]),
                clamp(tx["geo_distance_from_last_txn_km"] / 5000.0),
                clamp(tx["geo_velocity_kmh"] / 1500.0),
                clamp(tx["accounts_per_device_24h"] / 8.0),
                clamp(tx["accounts_per_ip_24h"] / 8.0),
                clamp(tx["senders_to_receiver_24h"] / 10.0),
            ]
        )
    return rows


def detect_fraud_rings(transactions: Sequence[dict]) -> tuple[list[RingAlert], dict[str, dict]]:
    outgoing = defaultdict(list)
    incoming = defaultdict(list)
    device_to_accounts = defaultdict(set)
    ip_to_accounts = defaultdict(set)
    for tx in transactions:
        outgoing[tx["sender_account"]].append(tx)
        incoming[tx["receiver_account"]].append(tx)
        device_to_accounts[tx["device_id"]].add(tx["sender_account"])
        ip_to_accounts[tx["ip_address"]].add(tx["sender_account"])

    alerts: list[RingAlert] = []
    account_signals = defaultdict(
        lambda: {
            "shared_infra_score": 0.0,
            "cycle_score": 0.0,
            "flow_velocity_score": 0.0,
            "fan_in_out_score": 0.0,
            "smurfing_score": 0.0,
            "cashout_score": 0.0,
            "network_evidence": [],
            "cluster_id": None,
            "accounts_involved": set(),
            "suspicious_funds_total": 0.0,
        }
    )
    seen_cycles = set()

    def search(
        path_accounts: list[str], path_txs: list[dict], start: str, current: str
    ) -> None:
        if len(path_accounts) > 6:
            return
        for tx in outgoing.get(current, []):
            nxt = tx["receiver_account"]
            if nxt == start and len(path_accounts) >= 3:
                cycle_key = tuple(sorted(path_accounts))
                if cycle_key in seen_cycles:
                    continue
                seen_cycles.add(cycle_key)
                cycle_txs = path_txs + [tx]
                times = [parse_timestamp(item["timestamp"]) for item in cycle_txs]
                hop_seconds = [
                    max((right - left).total_seconds(), 0.0)
                    for left, right in zip(times, times[1:])
                ]
                avg_hop = sum(hop_seconds) / len(hop_seconds) if hop_seconds else 0.0
                total_amount = sum(item["amount"] for item in cycle_txs)
                cluster_id = f"cluster-{uuid.uuid4().hex[:8]}"
                evidence = ["circular transfer pattern detected"]
                if avg_hop <= 120:
                    evidence.append(
                        f"funds moved through {len(path_accounts)} accounts in {max(sum(hop_seconds), 1.0):.0f} seconds"
                    )
                if total_amount >= 20000:
                    evidence.append(f"high cumulative volume of ${total_amount:,.0f}")
                alert = RingAlert(
                    cluster_id=cluster_id,
                    accounts=path_accounts,
                    total_amount=round(total_amount, 2),
                    cycle_length=len(path_accounts),
                    avg_hop_time_sec=round(avg_hop, 2),
                    risk_score=round(
                        clamp(
                            0.6
                            + (0.18 if avg_hop <= 120 else 0.0)
                            + (0.16 if total_amount >= 20000 else 0.0)
                            + len(path_accounts) * 0.02
                        ),
                        2,
                    ),
                    evidence=evidence,
                    suspicious_funds_total=round(total_amount, 2),
                )
                alerts.append(alert)
                for account in path_accounts:
                    signal = account_signals[account]
                    signal["cycle_score"] = max(signal["cycle_score"], 1.0)
                    signal["flow_velocity_score"] = max(
                        signal["flow_velocity_score"],
                        clamp(
                            (len(path_accounts) / 5.0)
                            * min(300 / max(sum(hop_seconds), 1.0), 1.0)
                        ),
                    )
                    signal["network_evidence"].extend(evidence)
                    signal["cluster_id"] = cluster_id
                    signal["accounts_involved"].update(path_accounts)
                    signal["suspicious_funds_total"] = max(
                        signal["suspicious_funds_total"], total_amount
                    )
                continue
            if nxt in path_accounts:
                continue
            search(path_accounts + [nxt], path_txs + [tx], start, nxt)

    for account in list(outgoing.keys()):
        search([account], [], account, account)

    for account, signal in account_signals.items():
        device_shared = max(
            (
                len(accounts)
                for device, accounts in device_to_accounts.items()
                if account in accounts
            ),
            default=1,
        )
        ip_shared = max(
            (
                len(accounts)
                for ip, accounts in ip_to_accounts.items()
                if account in accounts
            ),
            default=1,
        )
        signal["shared_infra_score"] = clamp(max(device_shared / 5.0, ip_shared / 5.0))
        if signal["shared_infra_score"] >= 0.8:
            signal["network_evidence"].append(
                f"{max(device_shared, ip_shared)} linked accounts share the same device or IP"
            )

        fan_in = len(incoming.get(account, []))
        fan_out = len(outgoing.get(account, []))
        signal["fan_in_out_score"] = clamp(max(fan_in / 5.0, fan_out / 5.0))
        if signal["fan_in_out_score"] >= 0.6:
            signal["network_evidence"].append(
                "fan-in / fan-out transfer concentration detected"
            )

        smurf_count = sum(
            1
            for tx in incoming.get(account, []) + outgoing.get(account, [])
            if 9000 <= tx["amount"] < 10000
        )
        signal["smurfing_score"] = clamp(smurf_count / 4.0)
        if signal["smurfing_score"] >= 0.5:
            signal["network_evidence"].append(
                "structuring pattern detected with repeated transfers just below threshold"
            )

        cashout_hits = [
            tx for tx in outgoing.get(account, []) if tx["is_cashout_node"]
        ] + [tx for tx in incoming.get(account, []) if tx["is_cashout_node"]]
        signal["cashout_score"] = clamp(len(cashout_hits) / 2.0)
        if cashout_hits:
            signal["network_evidence"].append(
                "funds are converging on a likely cash-out node"
            )

    for signal in account_signals.values():
        signal["network_evidence"] = list(dict.fromkeys(signal["network_evidence"]))[:5]

    alerts.sort(key=lambda item: item.risk_score, reverse=True)
    return alerts[:6], account_signals


def build_network_risk(
    tx: dict, account_signals: dict[str, dict]
) -> tuple[float, list[str], str | None, list[str], float | None]:
    sender_signal = account_signals.get(tx["sender_account"], {})
    receiver_signal = account_signals.get(tx["receiver_account"], {})
    signals = [sender_signal, receiver_signal]

    def max_field(name: str) -> float:
        return max((signal.get(name, 0.0) for signal in signals), default=0.0)

    network_risk = (
        0.20 * max_field("shared_infra_score")
        + 0.20 * max_field("cycle_score")
        + 0.20 * max_field("flow_velocity_score")
        + 0.15 * max_field("fan_in_out_score")
        + 0.15 * max_field("smurfing_score")
        + 0.10 * max_field("cashout_score")
    )

    evidence = []
    accounts = set()
    cluster_id = None
    suspicious_funds_total = None
    for signal in signals:
        evidence.extend(signal.get("network_evidence", []))
        accounts.update(signal.get("accounts_involved", set()))
        if signal.get("cluster_id") and not cluster_id:
            cluster_id = signal["cluster_id"]
        if signal.get("suspicious_funds_total"):
            suspicious_funds_total = max(
                suspicious_funds_total or 0.0, signal["suspicious_funds_total"]
            )
    evidence = list(dict.fromkeys(evidence))[:5]

    return (
        round(clamp(network_risk), 2),
        evidence,
        cluster_id,
        sorted(accounts),
        suspicious_funds_total,
    )


def combine_scores(
    transaction_anomaly_score: float, rule_score: float, network_risk_score: float
) -> float:
    final_risk = (
        0.35 * transaction_anomaly_score
        + 0.25 * rule_score
        + 0.40 * network_risk_score
    )
    return round(clamp(final_risk), 2)


def classify_risk(final_risk: float) -> tuple[str, str]:
    if final_risk < 0.50:
        return "low", "allow"
    if final_risk < 0.70:
        return "medium", "review"
    if final_risk < 0.85:
        return "high", "hold"
    return "critical", "block"


def build_explanation(
    transaction: dict,
    final_risk: float,
    severity: str,
    action: str,
    transaction_anomaly_score: float,
    rule_score: float,
    network_risk_score: float,
    rule_reasons: Sequence[str],
    network_evidence: Sequence[str],
    accounts_involved: Sequence[str],
    suspicious_funds_total: float | None,
) -> str:
    del transaction
    facts = []
    if rule_reasons:
        facts.append(rule_reasons[0])
    if network_evidence:
        facts.append(network_evidence[0])
    if transaction_anomaly_score >= 0.75:
        facts.append("the transaction is a strong anomaly versus recent sender behavior")
    if suspicious_funds_total:
        facts.append(f"linked suspicious flow totals about ${suspicious_funds_total:,.0f}")

    summary = "; ".join(facts[:3]) if facts else "few strong indicators are currently present"
    accounts_text = (
        f" Linked accounts: {', '.join(accounts_involved[:5])}."
        if accounts_involved
        else ""
    )
    return (
        f"Risk {severity} at {final_risk:.2f}. Recommended action: {action}. "
        f"Transaction anomaly={transaction_anomaly_score:.2f}, rules={rule_score:.2f}, "
        f"network={network_risk_score:.2f}. Evidence: {summary}.{accounts_text}"
    )
