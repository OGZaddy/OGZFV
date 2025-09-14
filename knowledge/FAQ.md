# OGZ Prime — FAQ

## Why do I see a form before the live demo?
We gate the demo with a short email form to send you onboarding and performance updates. After submitting once, you won’t be prompted again on this device (we set `ogz_lead_demo_ok`).

## Is the dashboard using real data?
Yes. The dashboard connects to the unified WebSocket hub and streams live Polygon crypto ticks. No fake or simulated data is used.

## Why doesn’t TRAI answer with long, conversational replies?
On the production VPS we keep local LLMs disabled to avoid GPU/RAM costs. TRAI still answers from his saved memory and local knowledge base (docs/ + knowledge/ + public/). For full LLM replies, run TRAI’s brain on your machine or point to a remote LLM.

## How do I enable TRAI’s brain on my desktop?
1. Ensure Ollama is running locally and pull a 7–8B model (e.g. `qwen2:7b`).
2. Copy `trai/local-trai.env.example` to `.env` on your desktop and set `SSL_SERVER_URL` to your VPS hub.
3. Run `npm run trai` on your desktop. TRAI connects outbound to the hub and starts answering everywhere.

## How do I ensure the VPS never runs LLMs?
Leave `OLLAMA_ENABLED` unset/false on the VPS. We also guard availability checks behind that flag.

## Why is the TRAI voice/video page blocked?
Voice/video is disabled by default (cost control). It’s gated by `TRAI_VOICE_ENABLED=true` and `VOICE_ACCESS_TOKEN`. We only enable this for top‑tier subscriptions.

## Where are TRAI’s memories stored?
- Training data (optional): `trai/conversations.json`
- Persistent memory (auto): `trai/trai-memory.json`
- Knowledge index (optional, built): `trai/knowledge-index.json`

## How do I expand TRAI’s knowledge?
- Drop markdown files into `knowledge/` (FAQ, Getting Started, Troubleshooting).
- Optionally add docs to `docs/` or content under `public/`.
- Run `npm run build:kb` to prebuild an index for faster answers.

## Can customer instances contribute to aggregated learning?
Yes, opt-in only. Instances can upload sanitized insights to your hub. The hub stores JSON Lines per day for later aggregation.

## How do I verify security quickly?
Run `npm run smoke:security`. It checks `/api/live-status`, demo lead gate markup, widget injection, and verifies no local LLM is responding.

## Payments not working?
Ensure `STRIPE_SECRET_KEY` is set on the server and routes are accessible. If Stripe returns an error, check server logs for `/create-checkout-session` failures.

---

If anything fails, see `knowledge/Troubleshooting.md`.

