# OGZ PRIME V13/14 - QUICK START GUIDE

## 🚀 LAUNCH SEQUENCE

### 1. First Time Setup
```bash
# Install dependencies
npm install

# Set environment variables
export POLYGON_API_KEY="your_key_here"
export TRADING_MODE=LIVE

# Configure Discord (optional)
export DISCORD_STATS_WEBHOOK_URL="your_webhook"
export DISCORD_STATUS_WEBHOOK_URL="your_webhook"
```

### 2. Start Trading
```bash
# Quick launch both bots
./daily-operations.sh start

# Or manually:
pm2 start ssl-advance  # Data feed
pm2 start v13-stable   # V13 bot
pm2 start valhalla-bot # Valhalla bot
```

### 3. Monitor Trading
- Dashboard: http://your-server:8080/ogz-ultimate-dashboard.html
- Launcher: http://your-server:8080/launcher.html
- Logs: `pm2 logs`

## 📊 DAILY OPERATIONS

```bash
# Check system status
./daily-operations.sh status

# View recent trades
./daily-operations.sh trades

# Backup system
./daily-operations.sh backup

# Monitor live prices
./daily-operations.sh prices
```

## ⚙️ CONFIGURATION

### Risk Settings (in bot files)
- `maxPosition`: 0.25 (25% of balance max)
- `stopLoss`: 0.015 (1.5% stop loss)
- `takeProfit`: 0.025 (2.5% take profit)

### Supported Assets (20+)
BTC, ETH, SOL, ADA, DOGE, XRP, LTC, MATIC, AVAX, LINK, UNI, DOT, ATOM, NEAR, APT, ARB, OP, INJ, SUI, SEI

## 🛑 EMERGENCY CONTROLS

### Kill Switch
```bash
pm2 stop all  # Stop everything immediately
```

### Manual Trade Override
- Use StreamDeck integration
- Or dashboard manual controls

## 🔧 TROUBLESHOOTING

### Bot Not Trading (Confidence = 0)
- Needs 50+ price points to calculate indicators
- Wait 5-10 minutes after startup

### WebSocket Disconnected
```bash
pm2 restart ssl-advance
```

### Check System Health
```bash
node /root/final-system-check.js
```

## 📱 MOBILE ACCESS
1. Setup Tailscale VPN (optional)
2. Access dashboard on mobile browser
3. Use Discord webhooks for notifications

## 💰 PROFIT TRACKING
- Daily summaries in logs
- Discord notifications for milestones
- Dashboard shows real-time P&L

## 🔒 SECURITY
- SSL certificates valid 73 days
- License system with hardware fingerprinting
- Encrypted API keys in .env

## 📞 SUPPORT
- GitHub Issues: [your-repo]/issues
- Discord: [your-discord]
- Email: support@ogzprime.com

---
Built with 💚 for the journey to Houston