# Sentinel

Sentinel is a demo-first fraud analyst console for hackathon judging. It fuses transaction anomaly, behavioral identity mismatch, and network intelligence to flag suspicious transfers in real time.

## Stack

- Frontend: Next.js, TypeScript, Tailwind, Cytoscape.js, Recharts
- Backend: FastAPI, Python, pandas, scikit-learn, networkx
- AI: Gemini API for explanations only

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

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:3000`.

## Gemini

Gemini is optional for local development. If `GEMINI_API_KEY` is not set, Sentinel falls back to deterministic explanations.

```bash
export GEMINI_API_KEY=your_key_here
export GEMINI_MODEL=gemini-2.0-flash
```

## Demo Cases

- `normal_case`: approved, trusted recipient, low behavior drift
- `review_case`: moderate behavior drift and one-hop exposure to suspicious network
- `blocked_case`: strong behavior mismatch and direct mule-cluster exposure

