# Troubleshooting

## “500: model requires more system memory than is available”
You’re trying to run an LLM locally on a machine that can’t fit it. On the VPS we keep LLMs off: ensure `OLLAMA_ENABLED` is not true. For full replies, run TRAI’s brain on your desktop with a 7–8B model (`qwen2:7b`, `llama3:8b`).

## Widget not showing on a page
We inject `<script defer src="trai-widget.js">` server-side for all `public/*.html`. If you’re serving files via a CDN that bypasses the Node server, add the tag directly into the page’s `<head>`.

## No price data / chart not moving
- Health: `curl http://127.0.0.1:3010/api/live-status`
- Ensure `POLYGON_API_KEY` is set.
- Check server logs for Polygon WebSocket auth.

## Demo gate doesn’t appear
Make sure you’re opening the homepage (`/`). If you modified the page, confirm the lead modal markup is present. The smoke check also validates it: `npm run smoke:security`.

## Stripe checkout fails
Confirm `STRIPE_SECRET_KEY` in `.env` on the server. Check logs for `/create-checkout-session` errors.

## TRAI not answering long-form
Likely LLM is disabled. 
- On VPS: that’s intentional (`OLLAMA_ENABLED` off). 
- On desktop: confirm Ollama is up and `OLLAMA_ENABLED=true`, `OLLAMA_URL=http://127.0.0.1:11434`.

## Voice/Video blocked
By design. Requires `TRAI_VOICE_ENABLED=true` and a valid `VOICE_ACCESS_TOKEN`.

## WebSocket reconnect loops
- Check that only one hub is listening on port 3010.
- If behind NGINX, confirm the `/ws` upgrade route is correctly proxied.

## Knowledge answers look generic
Seed `knowledge/` with more content and run `npm run build:kb`. TRAI answers memory → knowledge → LLM (if enabled).

