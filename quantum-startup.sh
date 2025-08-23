#!/bin/bash

# QUANTUM SYSTEM STARTUP SCRIPT
# Launches all components in the correct order with PM2 monitoring

echo "🚀 STARTING OGZPRIME QUANTUM TRADING SYSTEM..."
echo "📡 Using REAL Polygon WebSocket data ONLY!"
echo "🎯 Houston Target: $25,000"
echo ""

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop all
pm2 delete all

# Start SSL server first (port 3010)
echo "1️⃣ Starting SSL WebSocket server..."
pm2 start trading-system/ogzprime_ssl_server_advanced.js --name "ssl-server" --log-date-format "YYYY-MM-DD HH:mm:ss"

# Wait for SSL server to be ready
sleep 3

# Start quantum system integration
echo "2️⃣ Starting quantum system integration..."
pm2 start quantum-system-integration.js --name "quantum-system" --log-date-format "YYYY-MM-DD HH:mm:ss"

# Wait for quantum system to initialize
sleep 5

# Start main quantum bot
echo "3️⃣ Starting quantum bot (main trading engine)..."
pm2 start run-trading-bot-v13-quantum.js --name "quantum-bot" --log-date-format "YYYY-MM-DD HH:mm:ss"

# Start all bot tiers
echo "4️⃣ Starting bot tier system..."
pm2 start trading-system/bot-elite-tier.js --name "elite-bot" --log-date-format "YYYY-MM-DD HH:mm:ss"
pm2 start trading-system/bot-pro-tier.js --name "pro-bot" --log-date-format "YYYY-MM-DD HH:mm:ss"
pm2 start trading-system/bot-starter-tier.js --name "starter-bot" --log-date-format "YYYY-MM-DD HH:mm:ss"

echo ""
echo "✅ ALL SYSTEMS LAUNCHED!"
echo ""
echo "📊 Monitor with: pm2 logs"
echo "📈 Dashboard: https://ogzprime.com/ogz-ultimate-dashboard.html"
echo "🔧 Status: pm2 status"
echo ""

# Show status
pm2 status

echo ""
echo "🎯 HOUSTON, WE HAVE LIFTOFF! 🚀"
echo "📡 All bots connected to unified WebSocket (port 3010)"
echo "💰 Real Polygon data feeding all trading decisions"
echo "🧠 Quantum system aggregating signals from all sources"
echo ""
echo "🔥 NO FAKE DATA - ONLY REAL MARKET DATA! 🔥"