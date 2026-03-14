from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_ORIGINS
from .models import (
    ExplanationRequest,
    ExplanationResponse,
    IncidentChatResponse,
    IncidentDetailResponse,
    IncidentPanelResponse,
    IncidentQueueResponse,
    LiveMonitorPayload,
    TransactionChatRequest,
    TransactionChatResponse,
)
from .services.incidents import incident_service
from .services.live_monitor import live_monitor_service
from .services.sentinel import service
from .services.uploads import upload_service


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


@app.get("/api/incidents/queue", response_model=IncidentQueueResponse)
def incidents_queue():
    return incident_service.get_queue()


@app.get("/api/incidents/refresh", response_model=IncidentQueueResponse)
def incidents_refresh(batch: int = Query(default=4, ge=1, le=12)):
    return incident_service.refresh_queue(batch_size=batch)


@app.get("/api/incidents/{incident_id}/panel", response_model=IncidentPanelResponse)
def incident_panel(incident_id: str):
    try:
        return incident_service.get_incident_panel(incident_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@app.get("/api/incidents/{incident_id}", response_model=IncidentDetailResponse)
def incident_detail(incident_id: str):
    try:
        return incident_service.get_incident_detail(incident_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@app.get("/api/incidents/{incident_id}/graph")
def incident_graph(incident_id: str):
    try:
        return incident_service.get_incident_graph(incident_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@app.post("/api/incidents/{incident_id}/chat", response_model=IncidentChatResponse)
def incident_chat(incident_id: str, payload: TransactionChatRequest):
    try:
        return incident_service.chat_about_incident(
            incident_id=incident_id,
            message=payload.message,
            history=[item.model_dump() for item in payload.history],
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Incident not found.") from exc


@app.get("/api/transactions/feed")
def transactions_feed():
    return service.get_dashboard_summary().cases


@app.get("/api/live/bootstrap", response_model=LiveMonitorPayload)
def live_monitor_bootstrap():
    return live_monitor_service.bootstrap()


@app.get("/api/live/stream", response_model=LiveMonitorPayload)
def live_monitor_stream(batch: int = Query(default=6, ge=1, le=12)):
    return live_monitor_service.stream(batch_size=batch)


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


@app.post("/api/uploads/transactions/live", response_model=LiveMonitorPayload)
async def upload_transactions_report(
    transactions: UploadFile = File(...),
    accounts: UploadFile | None = File(default=None),
):
    if not transactions.filename:
        raise HTTPException(status_code=400, detail="No transactions file uploaded.")

    try:
        contents = await transactions.read()
        payload = upload_service.payload_from_bytes(contents)
    except Exception as exc:  # pragma: no cover - upload parsing errors
        raise HTTPException(status_code=400, detail="Failed to parse transactions file.") from exc

    return payload
