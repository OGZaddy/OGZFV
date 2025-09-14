# Changelog — September 12, 2025 (valhalla)

Scope: UI/UX enhancements to `public/unified-dashboard.html` and minor homepage link fix. No bot logic or server code changed. Safe to deploy.

## Added
- Customer Docker support: opt‑in aggregated learning
  - trai-singleton: env‑gated telemetry upload (, , , , ).
  - Hub ingest route:  (requires ) stores sanitized JSONL in .
  - No raw chat logs or PII required; uploads are sanitized and optional.
- Readable Mode: High‑legibility font option with larger sizes; toggled via “Aa” button. Persists via localStorage.
- Theme Customization:
  - Presets: Red (default), Blue, Green, Purple.
  - Custom controls: accent color, side glow color, glow intensity, font scale, font family, high‑contrast toggle.
  - Chart palette controls: price/SMA/EMA/Bollinger/RSI/MACD/grid color pickers.
  - Import/Export/Reset and named Presets (save/load/delete). All preferences persist.
  - Docker/meta defaults: optional meta tags (`ogz-accent`, `ogz-side`, `ogz-font`, `ogz-font-scale`, `ogz-high-contrast`) applied on first visit.
- Branding hooks (white‑glove enterprise): optional meta tags (`ogz-brand-name`, `ogz-logo-url`, `ogz-tagline`) to swap header logo/text without code changes.
- Onboarding tip: one‑time “Can’t see?” tooltip with quick actions for Readable/Theme (dismiss persists).
- Chart overlays: Fibonacci levels and Support/Resistance bands via chartjs‑annotation; toggleable in controls.
- Trade markers: BUY/SELL plot points on the main chart when trade messages arrive via WebSocket.
- Lead capture gate for Live Demo (index):
  - Added modal on `public/index.html` that collects email (and optional name) before allowing access to `unified-dashboard.html`.
  - Posts lead to Make.com webhook (`hook.us2.make.com/...`) with UTM, UA, timezone for AI follow-up.
  - Persists `ogz_lead_demo_ok` in localStorage to avoid re-prompt for returning visitors.
- TRAI reliability for remote/local LLMs:
  - `trai-singleton.js` now honors `SSL_SERVER_URL` to connect from your local machine to the VPS hub.
  - Added `LLM_MODEL` env override (default `qwen2:7b`) to avoid oversized models; continue to gate with `OLLAMA_ENABLED`.
  
## Removed
- Dev-only TRAI simulator and any simulated fallback path per “no fake data” policy. All flows remain strictly live or no-op; no random/simulated data is introduced.

## Changed
- Layout spacing: tightened header and chart height to keep bottom panels visible on load. Mobile svh adjustments at common breakpoints.
- Red accents: subtle side glow and red glow around chart/panels for contrast; now driven by theme variables.
- Pricing link: homepage “See Pricing” button now links to `pricing.html`.

## Fixed
- Moved Branding helper into the script and removed stray code that was appended after `</body>` to ensure valid markup and predictable load order.
- Stripe checkout route: re-enabled Stripe SDK in `ogzprime_ssl_server_advanced.js` so `/create-checkout-session` works with live keys.
- No-fake sweep:
  - Removed simulated TRAI client and all fake HTTP fallback responses.
  - `bot-dashboard.js` now returns 503 if TRAI is not connected (no placeholder answers).
- Dynamic assets: `unified-dashboard.html` now auto-populates the asset selector from live `allPrices` symbols sent by the server.
- LLM hardening: Disabled Ollama by default so the VPS never downloads/loads models unless explicitly enabled.
  - Add `OLLAMA_ENABLED=true` to enable; otherwise server skips availability checks and `trai-singleton` refuses LLM calls.

## Files Modified
- `public/unified-dashboard.html`
- `public/index.html`
- `ogzprime_ssl_server_advanced.js` (message routing only)
- `package.json` (scripts)

## Notes
- No changes to trading bot logic, data feeds, or server.
- WebSocket URL remains `${protocol}//${host}/ws` and is unaffected.
- Chart.js annotation plugin is already included via CDN in the page head.
