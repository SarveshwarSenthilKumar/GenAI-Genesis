from datetime import timedelta
from types import SimpleNamespace

from app.services.incidents import IncidentService
from app.services.live_detection import RuleEngine, detect_fraud_rings, engineer_transaction_features
from app.services.live_monitor import LiveMonitorService
from app.services.sentinel import service


def test_dashboard_summary_has_three_cases():
    summary = service.get_dashboard_summary()
    assert summary.total_cases == 3
    assert summary.blocked_count == 1
    assert summary.review_count == 1
    assert summary.approved_count == 1


def test_blocked_case_crosses_threshold():
    detail = service.get_case_detail("tx_blocked_001")
    assert detail.decision == "block"
    assert detail.overall_risk >= 0.70


def test_graph_contains_highlighted_path():
    graph = service.get_graph("tx_blocked_001")
    assert "victim_account->mule_A" in graph.highlighted_edge_ids
    assert "mule_A" in graph.highlighted_node_ids


def test_transaction_chat_returns_grounded_answer():
    response = service.chat_about_transaction(
        "tx_blocked_001",
        "Why was this blocked?",
        [],
    )
    assert response.answer
    assert len(response.follow_ups) <= 2


def test_live_monitor_bootstrap_returns_graph_and_alerts():
    live_service = LiveMonitorService()
    payload = live_service.bootstrap()

    assert payload.stats.transactions_monitored >= 60
    assert len(payload.transactions) <= 18
    assert payload.graph.nodes
    assert payload.graph.edges


def test_live_monitor_stream_advances_latest_transaction():
    live_service = LiveMonitorService()
    initial_payload = live_service.bootstrap()
    next_payload = live_service.stream(batch_size=6)

    assert initial_payload.generated_at is not None
    assert next_payload.generated_at is not None
    assert next_payload.generated_at >= initial_payload.generated_at
    assert next_payload.transactions[0].transaction_id != initial_payload.transactions[0].transaction_id


def test_persist_snapshot_from_transactions_updates_latest_snapshot():
    live_service = LiveMonitorService()
    live_service.bootstrap()
    transactions = live_service.engine.recent_transactions(12)[-6:]

    persisted = live_service.persist_snapshot_from_transactions(transactions)
    current_snapshot = live_service.current_snapshot()

    assert persisted.payload.generated_at == transactions[-1]["timestamp"]
    assert current_snapshot is persisted
    assert current_snapshot.payload.active_scenario is None


def test_incident_queue_is_repeatable_and_non_empty():
    incident_service = IncidentService()
    queue = incident_service.get_queue()

    assert queue.incidents
    assert queue.stats.total_incidents == len(queue.incidents)


def test_incident_panel_and_detail_share_same_id():
    incident_service = IncidentService()
    incident_id = incident_service.get_queue().incidents[0].incident_id

    panel = incident_service.get_incident_panel(incident_id)
    detail = incident_service.get_incident_detail(incident_id)

    assert panel.incident_id == detail.incident_id == incident_id
    assert detail.reasons


def test_ring_cluster_ids_are_stable_for_same_transactions():
    live_service = LiveMonitorService()
    transactions = live_service.engine.recent_transactions(120)

    first_alerts, _ = detect_fraud_rings(transactions)
    second_alerts, _ = detect_fraud_rings(transactions)

    assert [alert.cluster_id for alert in first_alerts] == [
        alert.cluster_id for alert in second_alerts
    ]


def test_velocity_signal_detects_short_transfer_bursts():
    live_service = LiveMonitorService()
    engine = live_service.engine
    sender, receiver = engine.accounts[0], engine.accounts[1]
    base_time = engine.current_time
    transactions = []

    for index, offset in enumerate([0, 20, 40, 70, 90]):
        transactions.append(
            engine._base_transaction(
                sender=sender,
                receiver=receiver,
                amount=250.0 + index,
                ip_country=engine.account_country[sender],
                transaction_type="transfer",
                tag="velocity-test",
                is_fraud=True,
                timestamp_override=base_time + timedelta(seconds=offset),
            )
        )

    enriched = engineer_transaction_features(transactions)
    suspicious_hits = RuleEngine().evaluate(enriched[2], {})
    high_risk_hits = RuleEngine().evaluate(enriched[-1], {})

    assert any(
        hit.name == "transfer_velocity_suspicious"
        and "3 transfers within 40 seconds" in hit.reason
        for hit in suspicious_hits
    )
    assert any(
        hit.name == "transfer_velocity_high"
        and "5 transfers within 90 seconds" in hit.reason
        for hit in high_risk_hits
    )

    alert = SimpleNamespace(
        rule_reasons=[hit.reason for hit in high_risk_hits],
        type="transaction",
    )
    behavior_anomalies = IncidentService()._behavior_anomalies(alert)

    assert "rapid transfer velocity detected" in behavior_anomalies
    assert "5 transfers within 90 seconds" in behavior_anomalies
