# Sentinel

Sentinel is an AI-assisted fraud analyst workspace for detecting suspicious transfers, triaging high-risk alerts, and investigating connected money movement in real time.

It combines:

- a live fraud monitor with scenario injection
- an analyst incident queue for triage
- interactive network exposure graphs
- explainable decision logic
- business-impact metrics for demo storytelling
- CSV upload analysis for ad hoc datasets

The goal is simple: help analysts understand not just that something is risky, but why it was flagged, what pushed it from review to block, and what value was protected.

## Why Sentinel

Traditional fraud tools are often strong at scoring individual transactions but weak at showing:

- how fraud signals interact
- where network exposure changes the decision
- what a human analyst should do next
- what business value the detection system created

Sentinel addresses that by combining anomaly scoring, deterministic rule scoring, and network analysis in one analyst-focused product.

## What The App Includes

- `Incident dashboard` for triage, queue filtering, scenario injection, and investigation
- `Live monitor` for streaming synthetic transactions and real-time fraud alerts
- `Decision logic` that explains top driver, tipping point, and counterfactual outcomes
- `Business impact` metrics such as suspicious dollars prevented and analyst time saved
- `Network exposure graphs` for graph-based investigation and replay
- `Case review flows` for deterministic fraud demo cases
- `Upload flow` that turns a CSV into a live-style fraud report
- `Documentation page` that explains the product and scoring logic in-app

## Core Demo Story

Sentinel is strongest when shown as a full analyst workflow:

1. Inject a fraud scenario in the live monitor.
2. Watch the alert enter the queue with scoring and explanation.
3. Open the decision logic and show what pushed the alert into `hold` or `block`.
4. Use the graph view to explain the network exposure.
5. Show business-impact metrics to answer the “so what?” question.

## Tech Stack

### Frontend

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Cytoscape.js`
- `Recharts`
- `React Three Fiber`

### Backend

- `FastAPI`
- `Python`
- `pandas`
- `scikit-learn`
- `networkx`
- `python-dotenv`

### AI

- OpenAI-compatible chat/explanation integration
- deterministic fallback flows when no model is configured

## Repository Layout

```text
GenAI-Genesis/
├── backend/
├── frontend/
├── data/
├── PROJECT_INFO.md
└── README.md
```

## Important Routes

- `/` landing page
- `/dashboard` incident queue and triage workspace
- `/live` real-time fraud monitoring
- `/incidents/[id]` incident detail
- `/incidents/[id]/graph` incident network graph
- `/cases/[id]` case review
- `/cases/[id]/graph` case network graph
- `/upload` CSV upload and instant report generation
- `/documentation` in-app documentation
- `/3d-network` experimental graph visualization

## Local Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If you use Fish:

```fish
cd backend
python3 -m venv .venv
source .venv/bin/activate.fish
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`.

Useful frontend scripts:

- `npm run dev` starts the dev server
- `npm run dev:fresh` clears `.next` and starts fresh
- `npm run reset` clears `.next`
- `npm run build` runs a production build
- `npm run start` serves the production build

## Environment Variables

The backend reads from either the repo root `.env` or `backend/.env`.

### Backend

```env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=
OPENAI_TIMEOUT_SECONDS=8
```

### Frontend

Set this in `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

If unset, the frontend defaults to `http://127.0.0.1:8000`.

## API Endpoints

- `GET /api/health`
- `GET /api/incidents/queue`
- `GET /api/incidents/refresh`
- `GET /api/incidents/{incident_id}/panel`
- `GET /api/incidents/{incident_id}`
- `GET /api/incidents/{incident_id}/graph`
- `GET /api/live/bootstrap`
- `GET /api/live/stream`
- `GET /api/live/scenario`
- `POST /api/uploads/transactions/live`

## Differentiators

What makes Sentinel stand out:

- `Multi-layer scoring`: anomaly + rules + network
- `Decision transparency`: top driver, tipping point, and counterfactuals
- `Investigation UX`: queue, graph, replay, and detail views in one workflow
- `Business framing`: protected dollars, isolated accounts, analyst time saved
- `Demo reliability`: reproducible fraud scenarios on demand

## Notes

- Sentinel works without a live LLM for core scoring and demo flows.
- AI explanations enhance the experience but are not required for the main product.
- The 3D network page is experimental and should be treated as an optional demo surface.
