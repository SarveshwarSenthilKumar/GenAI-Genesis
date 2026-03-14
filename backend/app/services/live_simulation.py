from __future__ import annotations

import random
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Sequence


COUNTRIES = ["CA", "US", "GB", "DE", "SG", "AE", "NG", "BR"]
CURRENCIES = ["USD", "CAD", "GBP"]
TX_TYPES = ["transfer", "purchase", "withdrawal", "deposit"]
MERCHANTS = ["MRC-100", "MRC-214", "MRC-330", "MRC-481", "MRC-590"]
BENEFICIARIES = [f"BEN-{idx:03d}" for idx in range(1, 41)]


class TransactionEngine:
    def __init__(self) -> None:
        self.random = random.Random(42)
        self.accounts = [f"ACC-{idx:04d}" for idx in range(1, 61)]
        self.mules = [f"MULE-{idx:03d}" for idx in range(1, 9)]
        self.cashout_nodes = {f"CASH-{idx:03d}" for idx in range(1, 5)}
        self.sequence = 0
        self.current_time = datetime.now().replace(microsecond=0) - timedelta(hours=3)

        self.account_country = {account: self.random.choice(COUNTRIES[:5]) for account in self.accounts}
        self.account_country.update({account: self.random.choice(COUNTRIES) for account in self.mules})
        self.account_country.update(
            {account: self.random.choice(COUNTRIES) for account in self.cashout_nodes}
        )

        self.account_age_days = {
            account: self.random.randint(7, 1500) for account in self.accounts
        }
        self.account_age_days.update(
            {account: self.random.randint(2, 120) for account in self.mules}
        )
        self.account_age_days.update(
            {account: self.random.randint(20, 240) for account in self.cashout_nodes}
        )

        self.account_devices = defaultdict(lambda: [self._device_id()])
        self.account_history = defaultdict(list)
        self.transactions: list[dict] = []

    def seed(self, count: int = 60) -> list[dict]:
        seeded: list[dict] = []
        while len(seeded) < count:
            seeded.extend(self.next_batch(count=6))
        return seeded[:count]

    def next_batch(self, count: int = 6) -> list[dict]:
        batch: list[dict] = []
        while len(batch) < count:
            scenario_roll = self.random.random()
            if scenario_roll < 0.08:
                batch.extend(self._generate_ring())
            elif scenario_roll < 0.16:
                batch.append(self._append_transaction(self._generate_suspicious_single()))
            else:
                batch.append(self._append_transaction(self._generate_normal_transaction()))
        return batch[:count]

    def recent_transactions(self, limit: int = 120) -> list[dict]:
        return self.transactions[-limit:]

    def _append_transaction(self, tx: dict) -> dict:
        self.transactions.append(tx)
        self.account_history[tx["sender_account"]].append(tx)
        return tx

    def _advance_time(self, seconds_min: int = 15, seconds_max: int = 80) -> datetime:
        self.current_time += timedelta(seconds=self.random.randint(seconds_min, seconds_max))
        return self.current_time

    def _device_id(self) -> str:
        return f"DEV-{self.random.randint(1000, 9999)}"

    def _ip_address(self) -> str:
        return ".".join(str(self.random.randint(1, 254)) for _ in range(4))

    def _geo_for_country(self, country: str) -> tuple[float, float]:
        bases = {
            "CA": (43.651, -79.383),
            "US": (40.713, -74.006),
            "GB": (51.507, -0.128),
            "DE": (52.520, 13.405),
            "SG": (1.352, 103.820),
            "AE": (25.204, 55.270),
            "NG": (6.524, 3.379),
            "BR": (-23.550, -46.633),
        }
        lat, lon = bases[country]
        return (
            round(lat + self.random.uniform(-0.25, 0.25), 5),
            round(lon + self.random.uniform(-0.25, 0.25), 5),
        )

    def _pick_normal_accounts(self) -> Sequence[str]:
        return self.random.sample(self.accounts, 2)

    def _sender_avg_amount_30d(self, sender: str) -> float:
        history = self.account_history[sender][-30:]
        if not history:
            return round(self.random.uniform(120.0, 1600.0), 2)
        return round(sum(tx["amount"] for tx in history) / len(history), 2)

    def _base_transaction(
        self,
        sender: str,
        receiver: str,
        amount: float,
        ip_country: str,
        transaction_type: str,
        tag: str,
        is_fraud: bool,
        force_new_device: bool = False,
        force_new_ip: bool = False,
        shared_device: str | None = None,
        shared_ip: str | None = None,
    ) -> dict:
        self.sequence += 1
        tx_time = self._advance_time()
        sender_devices = self.account_devices[sender]
        if shared_device:
            device_id = shared_device
        elif force_new_device or self.random.random() < 0.09:
            device_id = self._device_id()
            sender_devices.append(device_id)
        else:
            device_id = self.random.choice(sender_devices)

        if shared_ip:
            ip_address = shared_ip
        elif force_new_ip:
            ip_address = self._ip_address()
        else:
            ip_address = self._ip_address()

        geo_lat, geo_lon = self._geo_for_country(ip_country)
        sender_avg = self._sender_avg_amount_30d(sender)

        return {
            "transaction_id": f"TX-{self.sequence:05d}",
            "timestamp": tx_time.isoformat(),
            "sender_account": sender,
            "receiver_account": receiver,
            "amount": round(amount, 2),
            "currency": self.random.choice(CURRENCIES),
            "transaction_type": transaction_type,
            "merchant_id": self.random.choice(MERCHANTS) if transaction_type == "purchase" else None,
            "beneficiary_id": self.random.choice(BENEFICIARIES),
            "device_id": device_id,
            "ip_address": ip_address,
            "ip_country": ip_country,
            "geo_lat": geo_lat,
            "geo_lon": geo_lon,
            "sender_account_age_days": self.account_age_days[sender],
            "receiver_account_age_days": self.account_age_days.get(
                receiver, self.random.randint(1, 200)
            ),
            "sender_avg_amount_30d": sender_avg,
            "sender_txn_count_1h": None,
            "sender_txn_count_24h": None,
            "sender_unique_receivers_24h": None,
            "device_seen_before": device_id in sender_devices[:-1] if force_new_device else device_id in sender_devices,
            "ip_seen_before": not force_new_ip,
            "receiver_seen_before": any(
                item["receiver_account"] == receiver for item in self.account_history[sender]
            ),
            "is_cashout_node": receiver in self.cashout_nodes,
            "sender_home_country": self.account_country[sender],
            "is_fraud": is_fraud,
            "tag": tag,
        }

    def _generate_normal_transaction(self) -> dict:
        sender, receiver = self._pick_normal_accounts()
        return self._base_transaction(
            sender=sender,
            receiver=receiver,
            amount=self.random.uniform(18.0, 2200.0),
            ip_country=self.account_country[sender],
            transaction_type=self.random.choice(TX_TYPES[:2]),
            tag="normal",
            is_fraud=False,
        )

    def _generate_suspicious_single(self) -> dict:
        sender, receiver = self._pick_normal_accounts()
        foreign_country = self.random.choice(
            [country for country in COUNTRIES if country != self.account_country[sender]]
        )
        return self._base_transaction(
            sender=sender,
            receiver=receiver,
            amount=self.random.uniform(5000.0, 14500.0),
            ip_country=foreign_country,
            transaction_type="transfer",
            tag="single-risk",
            is_fraud=True,
            force_new_device=True,
            force_new_ip=True,
        )

    def _generate_ring(self) -> list[dict]:
        ring_size = self.random.randint(3, 5)
        ring_accounts = self.random.sample(self.mules, ring_size - 1) + [
            self.random.choice(self.accounts)
        ]
        self.random.shuffle(ring_accounts)
        if self.random.random() < 0.7:
            ring_accounts.append(self.random.choice(sorted(self.cashout_nodes)))

        base_amount = self.random.uniform(6000.0, 16000.0)
        shared_device = self._device_id()
        shared_ip = self._ip_address()
        start_time = self.current_time
        batch: list[dict] = []

        for index in range(len(ring_accounts) - 1):
            sender = ring_accounts[index]
            receiver = ring_accounts[index + 1]
            self.current_time = start_time + timedelta(seconds=35 * index)
            batch.append(
                self._append_transaction(
                    self._base_transaction(
                        sender=sender,
                        receiver=receiver,
                        amount=base_amount * (1 - 0.03 * index),
                        ip_country=self.account_country.get(
                            sender, self.random.choice(COUNTRIES)
                        ),
                        transaction_type="transfer",
                        tag="ring",
                        is_fraud=True,
                        shared_device=shared_device,
                        shared_ip=shared_ip,
                    )
                )
            )

        if ring_accounts[-1] not in self.cashout_nodes:
            sender = ring_accounts[-1]
            receiver = self.random.choice(sorted(self.cashout_nodes))
            self.current_time = start_time + timedelta(seconds=35 * len(ring_accounts))
            batch.append(
                self._append_transaction(
                    self._base_transaction(
                        sender=sender,
                        receiver=receiver,
                        amount=base_amount * 0.86,
                        ip_country=self.account_country.get(
                            sender, self.random.choice(COUNTRIES)
                        ),
                        transaction_type="withdrawal",
                        tag="cashout",
                        is_fraud=True,
                        shared_device=shared_device,
                        shared_ip=shared_ip,
                    )
                )
            )

        return batch
