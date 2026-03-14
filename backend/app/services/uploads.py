from __future__ import annotations

import hashlib
import io
import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

import pandas as pd
from openai import OpenAI

from ..config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
from ..services.live_monitor import live_monitor_service


REQUIRED_FIELDS = [
    "transaction_id",
    "timestamp",
    "sender_account",
    "receiver_account",
    "amount",
]

OPTIONAL_FIELDS = [
    "currency",
    "transaction_type",
    "ip_country",
    "device_id",
    "ip_address",
    "beneficiary_id",
    "geo_lat",
    "geo_lon",
]

COUNTRY_BASES = {
    "CA": (43.651, -79.383),
    "US": (40.713, -74.006),
    "GB": (51.507, -0.128),
    "DE": (52.520, 13.405),
    "SG": (1.352, 103.820),
    "AE": (25.204, 55.270),
    "NG": (6.524, 3.379),
    "BR": (-23.550, -46.633),
}


class UploadService:
    def __init__(self) -> None:
        self._client = (
            OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
            if OPENAI_API_KEY
            else None
        )

    @staticmethod
    def _extract_json_object(text: str) -> dict[str, Any]:
        cleaned = text.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise json.JSONDecodeError("No JSON object found.", cleaned, 0)

    @staticmethod
    def _normalize_column(name: str) -> str:
        return name.strip().lower().replace(" ", "_")

    def _heuristic_mapping(self, columns: list[str]) -> dict[str, str | None]:
        normalized = {self._normalize_column(col): col for col in columns}

        def pick(candidates: list[str]) -> str | None:
            for candidate in candidates:
                for normalized_name, original in normalized.items():
                    if candidate in normalized_name:
                        return original
            return None

        return {
            "transaction_id": pick(["transaction_id", "txn_id", "tx_id", "transaction", "txn", "tx"]),
            "timestamp": pick(["timestamp", "time", "date", "created_at", "event_time"]),
            "sender_account": pick(["sender", "from", "origin", "source", "payer", "debit"]),
            "receiver_account": pick(["receiver", "to", "dest", "destination", "payee", "beneficiary", "credit"]),
            "amount": pick(["amount", "amt", "value", "payment"]),
            "currency": pick(["currency", "ccy"]),
            "transaction_type": pick(["transaction_type", "txn_type", "type"]),
            "ip_country": pick(["ip_country", "country", "nation", "geo"]),
            "device_id": pick(["device", "device_id"]),
            "ip_address": pick(["ip_address", "ip"]),
            "beneficiary_id": pick(["beneficiary", "beneficiary_id"]),
            "geo_lat": pick(["geo_lat", "latitude", "lat"]),
            "geo_lon": pick(["geo_lon", "longitude", "lon", "lng"]),
        }

    def _llm_mapping(self, columns: list[str], sample_rows: list[dict[str, Any]]) -> dict[str, str | None]:
        if not self._client:
            return self._heuristic_mapping(columns)

        prompt = (
            "Map dataset columns to the required fraud schema fields. "
            f"Required: {REQUIRED_FIELDS}. Optional: {OPTIONAL_FIELDS}. "
            "Return JSON only with a top-level object where keys are schema fields and values are column names or null. "
            f"Columns: {columns}\n"
            f"Sample rows: {json.dumps(sample_rows, indent=2)}"
        )

        try:
            response = self._client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Return JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=400,
            )
            content = response.choices[0].message.content or ""
            parsed = self._extract_json_object(content)
            if not isinstance(parsed, dict):
                return self._heuristic_mapping(columns)
            mapping = {key: parsed.get(key) for key in REQUIRED_FIELDS + OPTIONAL_FIELDS}
            return mapping
        except Exception:
            return self._heuristic_mapping(columns)

    @staticmethod
    def _stable_hash(value: str) -> int:
        digest = hashlib.sha1(value.encode("utf-8")).hexdigest()
        return int(digest[:8], 16)

    def _fill_defaults(self, df: pd.DataFrame) -> pd.DataFrame:
        if "transaction_id" not in df.columns:
            df["transaction_id"] = [f"upload_{idx}" for idx in range(len(df))]

        if "timestamp" not in df.columns:
            start = datetime.now().replace(microsecond=0) - timedelta(minutes=len(df))
            df["timestamp"] = [
                (start + timedelta(seconds=30 * idx)).isoformat() for idx in range(len(df))
            ]

        if "currency" not in df.columns:
            df["currency"] = "USD"

        if "transaction_type" not in df.columns:
            df["transaction_type"] = "transfer"

        if "ip_country" not in df.columns:
            df["ip_country"] = "US"

        if "device_id" not in df.columns:
            df["device_id"] = df["sender_account"].apply(
                lambda value: f"DEV-{self._stable_hash(str(value)) % 10000:04d}"
            )

        if "ip_address" not in df.columns:
            df["ip_address"] = df["sender_account"].apply(
                lambda value: f"10.{self._stable_hash(str(value)) % 240}.{(self._stable_hash(str(value)) // 97) % 240}.1"
            )

        if "beneficiary_id" not in df.columns:
            df["beneficiary_id"] = df["receiver_account"].apply(
                lambda value: f"BEN-{self._stable_hash(str(value)) % 1000:03d}"
            )

        if "geo_lat" not in df.columns or "geo_lon" not in df.columns:
            def geo_for_country(country: str) -> tuple[float, float]:
                base = COUNTRY_BASES.get(country, COUNTRY_BASES["US"])
                jitter = (self._stable_hash(country) % 50) / 100.0
                return round(base[0] + jitter, 5), round(base[1] + jitter, 5)

            coords = df["ip_country"].apply(geo_for_country)
            df["geo_lat"] = coords.apply(lambda item: item[0])
            df["geo_lon"] = coords.apply(lambda item: item[1])

        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

        return df

    def _enrich_required_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        df["sender_avg_amount_30d"] = df.groupby("sender_account")["amount"].transform("mean")

        receiver_first_seen = df.groupby("receiver_account").cumcount()
        df["receiver_seen_before"] = receiver_first_seen > 0

        sender_devices = defaultdict(set)
        sender_ips = defaultdict(set)
        device_seen_before = []
        ip_seen_before = []
        for sender, device, ip in zip(df["sender_account"], df["device_id"], df["ip_address"]):
            device_seen_before.append(device in sender_devices[sender])
            ip_seen_before.append(ip in sender_ips[sender])
            sender_devices[sender].add(device)
            sender_ips[sender].add(ip)

        df["device_seen_before"] = device_seen_before
        df["ip_seen_before"] = ip_seen_before

        df["sender_home_country"] = df.groupby("sender_account")["ip_country"].transform(
            lambda values: values.mode().iloc[0] if not values.mode().empty else "US"
        )

        df["sender_account_age_days"] = df["sender_account"].apply(
            lambda value: 30 + (self._stable_hash(str(value)) % 1500)
        )
        df["receiver_account_age_days"] = df["receiver_account"].apply(
            lambda value: 20 + (self._stable_hash(str(value)) % 1200)
        )

        df["sender_txn_count_1h"] = 0
        df["sender_txn_count_24h"] = 0
        df["sender_unique_receivers_24h"] = 0
        df["is_cashout_node"] = df["receiver_account"].astype(str).str.startswith("CASH")
        df["is_fraud"] = False
        df["tag"] = "upload"

        return df

    def _normalize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        columns = list(df.columns)
        sample_rows = df.head(50).to_dict(orient="records")
        mapping = self._llm_mapping(columns, sample_rows)
        rename_map = {
            source: target
            for target, source in mapping.items()
            if source and source in df.columns
        }
        df = df.rename(columns=rename_map)

        missing = [field for field in REQUIRED_FIELDS if field not in df.columns]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        df = self._fill_defaults(df)
        df = self._enrich_required_fields(df)

        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            df = df.sort_values("timestamp", na_position="last")
            missing_ts = df["timestamp"].isna()
            if missing_ts.any():
                fallback = datetime.now().replace(microsecond=0)
                df.loc[missing_ts, "timestamp"] = [
                    fallback + timedelta(seconds=30 * idx) for idx in range(missing_ts.sum())
                ]
            df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")

        return df

    def payload_from_bytes(self, contents: bytes) -> dict:
        df = pd.read_csv(io.BytesIO(contents))
        df = self._normalize_dataframe(df)
        transactions = df.to_dict(orient="records")
        snapshot = live_monitor_service.build_snapshot_from_transactions(transactions)
        return snapshot.payload.model_dump()


upload_service = UploadService()
