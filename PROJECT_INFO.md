# Project Inspiration
Traditional fraud detection services are strong at flagging single transaction and account as fraudulent, but they often have major pain points, such as not being explanable for a human analysts and failing to detect subtle patterns of network relationships among fraudelent rings.
Our product Sentinel aims to enhance fraud detection by combining multiple fraud detection approaches such as a rule engine, graph network pattern-based analysis, and feature-based anomoly classification. This product also aims to provide an optimized experience for analysts. It brings suspicious incidents, statistics, fraudulent patterns, explnation, and AI-powered actionable insights into a single console for comprehensive review.

# Technology Stack
Languages:
- TypeScript
- Python

Frameworks and Libraries:
- Next.js
- Tailwind CSS
- Cytoscape.js
- Recharts
- FastAPI
- pandas
- scikit-learn
- networkx

Platforms:
- Vercel (frontend deployment)
- Render (backend deployment)

Tools:
- OpenAI API
- uvicorn
- npm

# Product Summary
Sentinel is a demo-first fraud analyst console that unifies case review and live monitoring to help analysts quickly understand why a transfer was flagged. Aside from the sophisticated approach of an ensemble detection algorithm, the experience centers on a dashboard of prioritized cases, drill‑down views that surface behavior drift and anomaly signals, and an interactive network graph for tracing suspicious recipient paths. A live monitor streams synthetic transactions, applies rule scoring and anomaly scoring, and highlights ring‑like activity in real time, giving analysts a continuous sense of risk. An LLM assistant is also availble for further explanation for a specific case, building user's trust in our product with explanability and transparency.

# Additional Note
A more detailed documentation for Sentinel is included at the top-right corner of the analyst console.