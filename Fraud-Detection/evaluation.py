from argparse import ArgumentParser
from collections import Counter

from detection import (
    RuleEngine,
    build_feature_rows,
    build_network_risk,
    classify_risk,
    combine_scores,
    detect_fraud_rings,
    engineer_transaction_features,
    isolation_forest_scores,
)
from simulation import TransactionEngine


def evaluate(sample_size: int, seed_count: int, batch_size: int) -> None:
    engine = TransactionEngine()
    engine.seed(seed_count)

    while len(engine.transactions) < sample_size:
        engine.next_batch(batch_size)

    transactions = engine.recent_transactions(sample_size)
    enriched = engineer_transaction_features(transactions)
    feature_rows = build_feature_rows(enriched)
    anomaly_scores = isolation_forest_scores(feature_rows)
    ring_alerts, account_signals = detect_fraud_rings(enriched)
    rule_engine = RuleEngine()

    results = []
    for tx, anomaly_score in zip(enriched, anomaly_scores):
        rule_hits = rule_engine.evaluate(tx, {})
        rule_score = round(min(sum(hit.points for hit in rule_hits), 1.0), 2)
        network_score, _, _, _, _ = build_network_risk(tx, account_signals)
        final_risk = combine_scores(anomaly_score, rule_score, network_score)
        severity, action = classify_risk(final_risk)
        results.append(
            {
                "transaction_id": tx["transaction_id"],
                "is_fraud": tx["is_fraud"],
                "tag": tx["tag"],
                "final_risk": final_risk,
                "severity": severity,
                "action": action,
            }
        )

    fraud_total = sum(item["is_fraud"] for item in results)
    print(f"Evaluated {len(results)} transactions")
    print(f"Fraud-labelled transactions: {fraud_total}")
    print(f"Detected ring clusters: {len(ring_alerts)}")
    print()

    for threshold in (0.50, 0.70, 0.85):
        predicted = [item for item in results if item["final_risk"] >= threshold]
        tp = sum(1 for item in predicted if item["is_fraud"])
        fp = sum(1 for item in predicted if not item["is_fraud"])
        fn = sum(1 for item in results if item["is_fraud"] and item["final_risk"] < threshold)
        precision = tp / len(predicted) if predicted else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        print(
            f"Threshold >= {threshold:.2f}: "
            f"predicted={len(predicted)} tp={tp} fp={fp} "
            f"precision={precision:.3f} recall={recall:.3f}"
        )

    print()
    for action in ("review", "hold", "block"):
        predicted = [item for item in results if item["action"] == action]
        tp = sum(1 for item in predicted if item["is_fraud"])
        fp = sum(1 for item in predicted if not item["is_fraud"])
        precision = tp / len(predicted) if predicted else 0.0
        print(f"Action {action:>6}: count={len(predicted)} tp={tp} fp={fp} precision={precision:.3f}")

    print()
    print("Fraud labels by scenario:")
    for tag, count in Counter(item["tag"] for item in results if item["is_fraud"]).most_common():
        print(f"- {tag}: {count}")


def main() -> None:
    parser = ArgumentParser(description="Evaluate synthetic fraud detection precision and recall.")
    parser.add_argument("--sample-size", type=int, default=300, help="Number of recent transactions to score.")
    parser.add_argument("--seed-count", type=int, default=60, help="Initial seeded transactions before streaming.")
    parser.add_argument("--batch-size", type=int, default=6, help="Streaming batch size while generating data.")
    args = parser.parse_args()
    evaluate(sample_size=args.sample_size, seed_count=args.seed_count, batch_size=args.batch_size)


if __name__ == "__main__":
    main()
