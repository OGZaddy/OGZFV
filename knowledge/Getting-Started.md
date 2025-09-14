# Getting Started

This guide shows how to bring up the hub (VPS), the dashboard, and the TRAI brain on your desktop.

## 1) Server (VPS) — Unified Hub
- Set env in `.env`:
  - `POLYGON_API_KEY=<your_polygon_key>`
  - `STRIPE_SECRET_KEY=<your_stripe_secret>`
  - Leave `OLLAMA_ENABLED` unset/false (no local LLM on VPS)
- Start hub: `npm run dashboard`
- Health: `curl http://127.0.0.1:3010/api/live-status`

## 2) Dashboard
- Open: `http://<your-domain-or-ip>:3010/`
- Click “Watch Live Demo”. Fill the email form once, then it will auto-bypass.
- You should see WS + Feed dots green and live ticks on the chart.

## 3) TRAI Brain (Desktop)
- Install and run Ollama locally.
- Pull a lightweight model: `ollama pull qwen2:7b` (or llama3:8b, mistral:7b)
- Copy `trai/local-trai.env.example` to `.env`, edit:
  - `SSL_SERVER_URL=wss://<your-domain-or-ip>/ws`
  - `OLLAMA_ENABLED=true`
- Start TRAI: `npm run trai`
- Logs: look for “Connected to SSL server” and “Ollama connected”.

## 4) Verify
- On any page, click the 🧠 widget and ask a question:
  - If desktop LLM is enabled, you’ll get full replies.
  - If not, TRAI answers from memory/knowledge.
- Run `npm run smoke:security` on the VPS to check health, widget, gate, and LLM disabled.

## 5) Expand Knowledge
- Add onboarding/support docs to `knowledge/`, `docs/`, or `public/`.
- Build index for faster answers: `npm run build:kb`.

## 6) Optional: Aggregated Learning
- On VPS: set `INSIGHT_API_TOKEN=<token>`
- On instances (opt-in): set `TRAI_TELEMETRY_ENABLED=true` and `TRAI_AGGREGATOR_URL` + `TRAI_TELEMETRY_TOKEN`.
- Aggregate nightly: `npm run aggregate:insights` → writes `trai/advise.json`.

