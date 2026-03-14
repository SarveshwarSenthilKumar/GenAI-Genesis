from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
DATA_DIR = ROOT_DIR / "data"
CSV_PATH = DATA_DIR / "sentinel_clean_transactions.csv"
CASES_PATH = DATA_DIR / "demo_cases.json"
SESSIONS_PATH = DATA_DIR / "synthetic_sessions.json"

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")

CSV_SAMPLE_ROWS = 50_000

TRANSACTION_WEIGHT = 0.30
BEHAVIOR_WEIGHT = 0.35
NETWORK_WEIGHT = 0.35

APPROVE_THRESHOLD = 0.40
BLOCK_THRESHOLD = 0.70

SUSPICIOUS_CLUSTER_IDS = {
    "mule_A",
    "mule_B",
    "mule_C",
    "mule_D",
    "cashout_account",
}

MULE_EDGES = [
    ("victim_account", "mule_A"),
    ("mule_A", "mule_B"),
    ("mule_B", "mule_C"),
    ("mule_B", "mule_D"),
    ("mule_C", "cashout_account"),
]

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "8"))
OPENAI_BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1",
)
