# Glossary

- Hub (VPS): The unified WebSocket + HTTP server on port 3010. Streams Polygon data, routes bot/TRAİ messages, injects the widget.
- TRAI Brain: The process that answers questions and analyzes trades. Can run on your desktop (recommended) or on a cloud GPU later.
- Ollama: Local model runner. We keep it disabled on the VPS by default; run it on your desktop.
- OLLAMA_ENABLED: Env flag. When false, no local LLM calls happen on that host.
- SSL_SERVER_URL: Where TRAI connects (e.g., `wss://your-domain.com/ws`). Set this on your desktop so TRAI can reach the hub.
- Knowledge Base: Local content (knowledge/, docs/, public/) that TRAI uses for support/onboarding answers.
- Persistent Memory: `trai/trai-memory.json`. Grows as TRAI learns; pruned/deduped automatically.
- Telemetry (opt‑in): Sanitized insights instances can upload to the hub for aggregated learning. Disabled by default.
- Lead Gate: The email modal before the live demo. Posts to Make.com for AI follow‑up and unlocks the demo on the device.

