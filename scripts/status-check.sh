#!/usr/bin/env bash
set -e
echo "=== OGZ PRIME SYSTEM STATUS ==="

echo "1) PM2 processes:"
pm2 status || true

echo "\n2) WebSocket Hub:"
curl -s http://localhost:3010/api/live-status | jq '.websocketStats' || true

echo "\n3) Recent trades (if any):"
ls -1t logs/trades 2>/dev/null | head -n 1 | xargs -I{} tail -n 10 "logs/trades/{}" 2>/dev/null || echo "No trades logged"

echo "\n4) Backtest quick help:"
echo "npm run backtest:quick -- --file=data/btc-5m-sept2024.json --limit=500"

