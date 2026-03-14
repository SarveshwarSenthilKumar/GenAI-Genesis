# GENAI GENESIS

This project (Sentinel) is a demo-first fraud analyst console for hackathon judging. It combines analyst case review with a live fraud-monitoring dashboard, fusing transaction anomaly, behavioral identity mismatch, and network intelligence to flag suspicious transfers in real time.

## Stack

- Frontend: Next.js, TypeScript, Tailwind, Cytoscape.js, Recharts
- Backend: FastAPI, Python, pandas, scikit-learn, networkx
- AI: OpenAI API for explanations only

## Project Layout

```text
sentinel/
├── backend/
├── frontend/
└── data/
    ├── demo_cases.json
    ├── sentinel_clean_transactions.csv
    └── synthetic_sessions.json
```

## What The App Includes

- Main analyst dashboard for deterministic demo cases
- Detailed case views with behavior and network risk explanations
- Graph investigation view for suspicious recipient paths
- Live monitor at `/live` with streaming synthetic transactions, rule scoring, anomaly scoring, and ring detection

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

Useful backend routes:

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/live/bootstrap`
- `GET /api/live/stream`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:3000`.

If hot reload gets stuck after route or component changes, use:

```bash
cd frontend
npm run dev:fresh
```

Useful frontend scripts:

- `npm run dev` for the normal live-reloading dev server
- `npm run dev:fresh` to clear `.next` and start a clean dev server
- `npm run reset` to clear `.next` without starting the server
- `npm run build` for a production build check
- `npm run start` to serve the production build

Main app pages:

- Landing: `http://127.0.0.1:3000`
- Dashboard: `http://127.0.0.1:3000/dashboard`
- Live monitor: `http://127.0.0.1:3000/live`
- Example case: `http://127.0.0.1:3000/cases/tx_blocked_001`
- Example graph: `http://127.0.0.1:3000/cases/tx_blocked_001/graph`

## Deploy

Recommended setup:

- Frontend on Vercel from the `frontend/` directory
- Backend on Render from the `backend/` directory

### Render Backend

This repo includes [render.yaml](/Users/johndev/Downloads/GenAI/GenAI-Genesis/render.yaml) for the API service.

Set these environment variables in Render:

- `FRONTEND_ORIGINS=https://your-vercel-app.vercel.app`
- `OPENAI_API_KEY=...` (optional)
- `OPENAI_MODEL=gpt-4o-mini` (optional)
- `OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1` (optional)
- `OPENAI_TIMEOUT_SECONDS=8` (optional)

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Vercel Frontend

Deploy the `frontend/` folder as a Next.js project.

Set this environment variable in Vercel:

- `NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com`

### Post-Deploy Wiring

1. Deploy the Render backend and copy its public URL.
2. Set `NEXT_PUBLIC_API_BASE_URL` in Vercel to that Render URL.
3. Set `FRONTEND_ORIGINS` in Render to your Vercel frontend URL.
4. Redeploy both if needed so the env vars are picked up.

## OpenAI

OpenAI is optional for local development. If `OPENAI_API_KEY` is not set, Sentinel falls back to deterministic explanations.

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-4o-mini
export OPENAI_BASE_URL=https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1
```

## Demo Cases

- `normal_case`: approved, trusted recipient, low behavior drift
- `review_case`: moderate behavior drift and one-hop exposure to suspicious network
- `blocked_case`: strong behavior mismatch and direct mule-cluster exposure
