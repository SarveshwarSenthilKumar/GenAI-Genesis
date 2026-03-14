from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_ORIGINS
from .models import (
    ExplanationRequest,
    ExplanationResponse,
    TransactionChatRequest,
    TransactionChatResponse,
)
from .services.sentinel import service


app = FastAPI(title="Sentinel API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard/summary")
def dashboard_summary():
    return service.get_dashboard_summary()


@app.get("/api/transactions/feed")
def transactions_feed():
    return service.get_dashboard_summary().cases


@app.get("/api/transactions/{transaction_id}")
def transaction_detail(transaction_id: str):
    try:
        return service.get_case_detail(transaction_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Transaction not found.") from exc


@app.get("/api/transactions/{transaction_id}/graph")
def transaction_graph(transaction_id: str):
    try:
        return service.get_graph(transaction_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Transaction not found.") from exc


@app.get("/api/users/{user_id}/behavior-profile")
def behavior_profile(user_id: str):
    try:
        return service.get_behavior_profile(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="User not found.") from exc


@app.post("/api/explanations/generate", response_model=ExplanationResponse)
def generate_explanation(payload: ExplanationRequest):
    return service.generate_explanation(payload.model_dump())


@app.post("/api/transactions/{transaction_id}/chat", response_model=TransactionChatResponse)
def transaction_chat(transaction_id: str, payload: TransactionChatRequest):
    try:
        return service.chat_about_transaction(
            transaction_id=transaction_id,
            message=payload.message,
            history=[item.model_dump() for item in payload.history],
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Transaction not found.") from exc
