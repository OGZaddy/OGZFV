# OGZPrime Valhalla Edition — Quantum Trading System

OGZPrime is a modular, production‑ready trading platform focused on reliability, risk management, and repeatable execution — built to fund the Houston mission.

## Features
- V13 Simplified Trading Engine (production‑matched backtester)
- Multi‑Directional Trading (long/short), regime‑aware decisions
- Risk Manager + Safety Net + Profit Manager (tiered exits)
- Enhanced Pattern Recognition with historical weighting
- Simple WebSocket Hub (one WS path, no flooding)
- Real‑data backtesting (Polygon), no synthetic fallbacks
- Quick mode for frictionless iteration

## Quick Start
1) Install
- Node 18+ recommended
- `npm install`

2) Configure
- `cp .env.example .env`
- Fill `POLYGON_API_KEY`, secrets, and toggles
- Leave `ENABLE_PRICE_BROADCAST=false` unless you need live ticks to dashboards

3) Run the WebSocket Hub
- `pm2 start ogzprime_ssl_server_advanced.js --name ssl`
- Verify: `curl -s http://localhost:3010/api/live-status | jq`

4) Download Real Data
- `POLYGON_API_KEY=YOUR_KEY node tools/download-polygon-range.js \
  --symbol=X:BTCUSD --span=minute --mult=5 \" 
--from=2024-09-01
--to=2024-09-14
\"
  --out=data/btc-5m-sept2024.json`

5) Backtest (frictionless)
- `npm run backtest:quick -- --file=data/btc-5m-sept2024.json --limit=2000`
  - safety gates OFF for iteration
- Stricter modes:
  - `npm run backtest:trai -- --file=... --limit=2000 --safety=relaxed`
  - `npm run backtest:trai -- --file=... --limit=2000` (normal)

## Live Trading (outline)
- TRAI runs locally; the VPS hub coordinates via `SSL_SERVER_URL`
- Keep `OLLAMA_ENABLED=false` on VPS; set `OLLAMA_ENABLED=true` only on your local box
- Broker integration goes in `run-trading-bot-v13-simplified.js` (Execution step)

## WebSocket Hub
- File: `ogzprime_ssl_server_advanced.js`
- Uses `core/SimpleWebSocketHub.js`
- Price broadcasts disabled by default (`ENABLE_PRICE_BROADCAST=false`)
- When enabled, ticks go to dashboards and bots only (never to backtests/TRAI)

## Security
- Never commit `.env` — use `.env.example`
- Rotate keys regularly (Polygon, Stripe, etc.)
- Restrict ports via NGINX + firewall; one WS path `/ws`

## DevOps
- PM2: `pm2 start ogzprime_ssl_server_advanced.js --name ssl && pm2 save`
- Final check: `node final-system-check.js`
- Package: `./pack.sh` (builds a clean tarball in `dist/`)

## Changelog
- `changelog/YYYY-MM-DD-c.md` (Codex)
- `changelog/YYYY-MM-DD-cc.md` (Claude)
- Each file includes: scope, changes, operations, Next Instance Prompt

## Notes
- No synthetic data in decision paths
- Backtests require real historical JSON
- Keep it simple. No re‑introducing the advanced broadcaster
