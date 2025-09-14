# Changelog — September 14, 2025 (valhalla)

Scope: Backtesting reliability, strict real-data enforcement, TRAI/backtest isolation, and WebSocket hub simplification. Zero synthetic data in decision paths. Safer defaults.

## Added
- Simple WebSocket Hub:
  - `core/SimpleWebSocketHub.js` — minimal hub with `connections` Map, filterable `broadcast()`, `sendDirect()`, `getStatistics()`, and `shutdown()`.
- Polygon downloader:
  - `tools/download-polygon-range.js` — generic range downloader for aggregates (minute/day) with output formatted for backtests.
- Quick backtest script:
  - `package.json` — `backtest:quick` for one-command backtests with safety gates off and easy flags.

## Changed
- Backtest engine (production-matched):
  - `backtest-v13-production.js`
    - MDT signal mapping: derive `buy/sell` from top pattern (`bullish/bearish`).
    - Pattern detector compatibility: supports both `EnhancedPatternChecker` and `ComprehensivePatternDetector`.
    - Confidence: weight patterns using `quality/reliability` and cap cleanly.
    - MDT market context: pass `trend/volatility/momentum/volume` derived from `MarketRegimeDetector.metrics`.
    - Safety gating: add `safetyMode` = `normal|relaxed|off` to optionally override SafetyNet/RiskManager during backtests.
- Backtest with TRAI:
  - `backtest-v13-with-trai.js`
    - Arg parser with `--file/--limit/--symbol/--span/--mult/--from/--to/--safety/--tier/--quick`.
    - Auto-download when symbol/range provided (invokes the new downloader).
    - Quick mode: safety off, pro tier, low thresholds for frictionless runs.
    - Strict real-data: fail-fast if no historical file (no synthetic fallback).
- SSL server (WebSocket hub):
  - `ogzprime_ssl_server_advanced.js`
    - Replaced AdvancedWebSocketBroadcastSystem with `SimpleWebSocketHub` (per user directive to avoid the advanced layer).
    - Price broadcast filters: send ticks only to dashboards/bots (never to backtests/TRAI) to prevent floods/hangs.
    - `ENABLE_PRICE_BROADCAST` env gate (default off). Polygon WS becomes optional and disabled unless explicitly enabled.
    - Minor symbol/parsing hardening for Polygon crypto messages and status output.

## Removed/Disabled
- Synthetic data fallback in TRAI backtester: no fake candles generated; backtests require real historical files.
- Default live price broadcasting: disabled unless `ENABLE_PRICE_BROADCAST=true`.

## Fixed
- Zero-trade condition due to MDT expecting `patterns.signals` and missing detector API alignment.
- Confidence stuck low by not weighting `quality/reliability` correctly.
- Backtest hangs when connected to SSL due to price spam; filtered broadcasts by connection type.
- Pre-trade gating mismatch by using nonexistent `assessPreTradeRisk` — use `assessTradeRisk`.

## Files Modified
- `backtest-v13-production.js`
- `backtest-v13-with-trai.js`
- `ogzprime_ssl_server_advanced.js`
- `package.json`
- `core/SimpleWebSocketHub.js` (new)
- `tools/download-polygon-range.js` (new)

## Operations
- Restart hub after update: `pm2 restart ssl`
- Quick backtest on real data:
  - Existing file: `npm run backtest:quick -- --file=data/btc-5m-sept2024.json --limit=2000`
  - Auto-download + run: `npm run backtest:quick -- --symbol=X:BTCUSD --span=minute --mult=5 --from=2024-09-01 --to=2024-09-14 --limit=2000`
- Enable live price broadcast (dashboards only): set `ENABLE_PRICE_BROADCAST=true` and restart ssl.

## Security & Compliance
- No synthetic/paper/randomized paths are used in backtests or live decision code.
- Recommend rotating API keys present in `.env` (Polygon, Stripe, etc.).

## Notes
- Live trading behavior is unaffected by backtest safety overrides — these flags are scoped to backtest code paths.
- TRAI can run locally (with Ollama) and connect to the VPS hub via `SSL_SERVER_URL`; the hub no longer floods backtests/TRAI with live price ticks.

