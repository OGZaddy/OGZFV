/**
 * TEST YOUR KRAKEN CONNECTION
 * Run this to verify everything is working
 */

require('dotenv').config();
const RealKrakenTrading = require('./RealKrakenTrading');

async function testConnection() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           KRAKEN CONNECTION TEST                          ║
║                                                          ║
║     Testing your API keys and connection...             ║
╚══════════════════════════════════════════════════════════╝
  `);

  const trader = new RealKrakenTrading();
  
  // Test connection
  const connected = await trader.testConnection();
  
  if (!connected) {
    console.log(`
❌ CONNECTION FAILED!

Check your .env file has:
KRAKEN_API_KEY=your_api_key_here
KRAKEN_API_SECRET=your_api_secret_here

Make sure API key has permissions for:
- Query Funds
- Query Orders
- Create Orders
    `);
    process.exit(1);
  }

  console.log(`
✅ CONNECTION SUCCESSFUL!

Your bot can now trade real money on Kraken!

To make a test trade (BE CAREFUL - REAL MONEY!):
  node test-trade.js

To start your bot with real trading:
  node run-trading-bot-v13-simplified.js

SAFETY FEATURES ACTIVE:
- Max order size: 0.001 BTC ($${(0.001 * 95000).toFixed(0)})
- Daily loss limit: $100
- Stop-loss on all trades: 3%

Good luck! May the profits be with you! 💰
  `);
}

testConnection();
