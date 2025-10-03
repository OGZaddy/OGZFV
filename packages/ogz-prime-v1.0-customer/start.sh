#!/bin/bash
echo "🚀 LAUNCHING OGZPRIME TRADING BOT"
echo "=================================="
echo ""
echo "📊 OPTIMIZECEPTION™ CONFIG LOADED:"
echo "   Risk/Reward: 1:96"
echo "   Stop Loss: 0.5%"
echo "   Take Profit: 48%"
echo "   Target Win Rate: 70%"
echo ""
echo "Starting Docker container..."
cd docker
docker-compose up -d
echo ""
echo "✅ Bot is running!"
echo "📊 Dashboard: http://localhost:3008"
echo "📡 WebSocket: ws://localhost:8001"
echo ""
echo "To view logs: docker-compose logs -f"
