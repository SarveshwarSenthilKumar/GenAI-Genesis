# Sentinel

Sentinel is a fraud analyst workspace for screening suspicious transfers, triaging alerts, and investigating connected money movement. It combines a live monitoring console, an incident queue, case review flows, and interactive network graphs so analysts can move from detection to explanation in one product.

This repository contains the full stack behind Sentinel:

- a `Next.js` frontend for analyst workflows
- a `FastAPI` backend for scoring, incident generation, and graph data
- demo datasets for case review, live monitoring, and synthetic scenarios

Core product flows run locally without a live model connection. When `OPENAI_*` settings are configured, Sentinel can also support explanation and chat features for incidents and transactions.

## Product Highlights

- Prioritized incident queue designed for fast screening and review
- Live monitoring dashboard with synthetic transaction streaming
- Scenario injection for laundering rings, account takeover, smurfing, mule fan-out, and related fraud patterns
- Incident and case detail views with transaction, behavior, and network context
- Interactive investigation graphs, including replay controls on incident graphs
- CSV upload flow for live-style transaction analysis
- In-app documentation and an experimental 3D network view

## Stack

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
- `pandas`
- `scikit-learn`
- `networkx`
- `python-dotenv`

### AI Integration

- OpenAI-compatible client configuration through `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL`
- Deterministic scoring and fallback-friendly product flows when AI is not configured

## Repository Layout

```text
GenAI-Genesis/
├── backend/
├── frontend/
├── data/
├── PROJECT_INFO.md
└── README.md
```

## Architecture

- `frontend/` renders the landing page, dashboard, live monitor, case review, uploads, documentation, and graph experiences.
- `backend/app/services/live_monitor.py` powers the streaming demo feed, scenario injection, and live risk scoring.
- `backend/app/services/incidents.py` builds the incident queue, triage panel payloads, incident details, and incident graphs.
- `backend/app/services/sentinel.py` powers deterministic case analysis, transaction detail, behavior profiles, and supporting explanation flows.
- `data/` contains the CSV and JSON assets used by the demo product.

## Local Development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

The API reads environment variables from either the repo root `.env` or `backend/.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:3000`.

Useful scripts:

- `npm run dev` starts the local Next.js dev server
- `npm run dev:fresh` clears `.next` and starts a clean dev session
- `npm run reset` clears `.next` without starting the app
- `npm run build` creates a production build
- `npm run start` serves the production build

## Environment Configuration

### Backend variables

```env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://qyt7893blb71b5d3.us-east-2.aws.endpoints.huggingface.cloud/v1
OPENAI_TIMEOUT_SECONDS=8
```

### Frontend variable

Set this in `frontend/.env.local` when the frontend should point somewhere other than the default local API:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

If `NEXT_PUBLIC_API_BASE_URL` is unset, the frontend falls back to `http://127.0.0.1:8000`.

## Key Routes

- `/` landing page
- `/dashboard` incident queue and triage workspace
- `/live` live monitoring dashboard
- `/incidents/[id]` incident detail
- `/incidents/[id]/graph` incident network graph with replay controls
- `/cases/[id]` case review page
- `/cases/[id]/graph` case network graph
- `/upload` transaction upload flow
- `/documentation` in-app product documentation
- `/3d-network` experimental 3D visualization

## Useful API Endpoints

- `GET /api/health`
- `GET /api/incidents/queue`
- `GET /api/incidents/refresh`
- `GET /api/incidents/{incident_id}/panel`
- `GET /api/incidents/{incident_id}`
- `GET /api/incidents/{incident_id}/graph`
- `GET /api/live/bootstrap`
- `GET /api/live/stream`
- `POST /api/uploads/transactions/live`

## Notes

- Sentinel's core dashboards and scoring flows do not require a live LLM.
- The in-app documentation page provides additional product context from inside the analyst console.
- The 3D network page is exploratory and should be treated as a demo surface rather than the main investigation workflow.
