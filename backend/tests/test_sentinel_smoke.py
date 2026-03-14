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
