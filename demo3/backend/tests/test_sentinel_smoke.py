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
