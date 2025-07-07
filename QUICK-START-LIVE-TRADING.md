# 🚀 OGZ AUTONOMOUS TRADER - LIVE TRADING SETUP

## Quick Start Guide for Live Trading

### Step 1: Get Your Polygon API Key
1. Go to [Polygon.io](https://polygon.io/)
2. Sign up for an account (Free tier available)
3. Navigate to Dashboard → API Keys
4. Copy your API key

### Step 2: Configure API Key
**Option A: Use the Setup Script (Recommended)**
```cmd
setup-api-key.bat
```
- Double-click the file or run from command prompt
- Enter your Polygon API key when prompted
- The script will automatically configure everything

**Option B: Manual Setup**
1. Create a `.env` file in the project root
2. Add: `POLYGON_API_KEY=your_api_key_here`
3. Save the file

### Step 3: Launch Autonomous Trading
```cmd
node LAUNCH-AUTONOMOUS-3DAY.js
```
or
```cmd
LAUNCH-3DAY-AUTONOMOUS.bat
```

## 🎯 Trading Configuration

### Current Settings (Semi-Aggressive Mode)
- **Starting Balance**: $10,000
- **Risk per Trade**: 1.5% - 3.5%
- **Max Drawdown**: 18%
- **Max Daily Trades**: 25
- **Operation Duration**: 3 days maximum
- **Confidence Threshold**: 65%
- **Trading Pair**: BTC-USD

### 🛡️ Safety Features
- ✅ Adaptive risk management with Kelly Criterion
- ✅ Circuit breakers for emergency stops
- ✅ Market regime detection and adaptation
- ✅ Pattern learning with persistent memory
- ✅ Multi-directional trading (Long/Short/Hedge/Arbitrage)
- ✅ Real-time monitoring and health checks

## 🔧 Troubleshooting

### API Key Issues
- **Error**: "POLYGON_API_KEY not set"
  - **Solution**: Run `setup-api-key.bat` or manually create `.env` file

- **Error**: "Authentication failed"
  - **Solution**: Verify your API key is correct and active

### Connection Issues
- **Error**: "WebSocket connection failed"
  - **Solution**: Check internet connection and firewall settings

### Performance Issues
- **Issue**: High memory usage
  - **Solution**: The system includes automatic memory cleanup every hour

## 📊 Monitoring Your Bot

The autonomous trader provides real-time status updates every 5 minutes showing:
- Runtime and remaining time
- Current balance and P&L
- Total trades and win rate
- Current BTC price
- Open positions
- System health status

## 🛑 Stopping the Bot

- **Graceful Stop**: Press `Ctrl+C` in the terminal
- **Emergency Stop**: The bot includes automatic circuit breakers
- **Manual Override**: Kill the process if needed

## 💡 Tips for Success

1. **Start Small**: Begin with a smaller balance to test the system
2. **Monitor Initially**: Watch the first few hours of operation
3. **Check Logs**: Review `./logs/autonomous/` for detailed progress
4. **Backup Learning**: The bot saves pattern learning data automatically
5. **Network Stability**: Ensure stable internet connection for 3-day operation

## 📈 Expected Performance

**Semi-Aggressive Mode Targets:**
- Daily trades: 10-25 (market dependent)
- Win rate: 60-75% target
- Daily return: 0.5-2% target
- Maximum risk: 18% drawdown protection

## 🚨 Important Notes

- This bot trades with REAL MONEY when using a live API key
- Always review and understand the risk settings before launching
- The bot will run autonomously for up to 3 days
- Learning data is saved and will improve performance over time
- All trades are logged for analysis and tax purposes

## 📞 Support

If you encounter issues:
1. Check the logs in `./logs/` directory
2. Review the console output for error messages
3. Ensure all prerequisites are met
4. Verify API key permissions and limits

---

**Ready to make money? Run `setup-api-key.bat` and let's go! 🚀💰**