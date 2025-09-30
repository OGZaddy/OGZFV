/**
 * TEST TRADE - VERIFY REAL TRADING WORKS
 * This will make a REAL trade with 0.0001 BTC (~$9.50)
 */

require('dotenv').config();
const RealKrakenTrading = require('./RealKrakenTrading');

async function testTrade() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           ⚠️  REAL MONEY TEST TRADE ⚠️                    ║
║                                                          ║
║     This will execute a REAL trade on Kraken!           ║
║     Amount: 0.0001 BTC (~$9.50)                        ║
╚══════════════════════════════════════════════════════════╝
  `);

  // Confirm with user
  console.log('Press Ctrl+C NOW to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const trader = new RealKrakenTrading();
  
  // Check connection first
  const connected = await trader.testConnection();
  if (!connected) {
    console.log('❌ Not connected to Kraken');
    process.exit(1);
  }
  
  console.log('\n🚀 Executing test trade...\n');
  
  // Make a tiny BUY trade
  const result = await trader.executeTrade(
    'buy',      // direction
    0.0001,     // size in BTC (about $9.50)
    0.75        // confidence (75%)
  );
  
  if (result.success) {
    console.log(`
✅ TEST TRADE SUCCESSFUL!

Order ID: ${result.orderId}
Direction: ${result.direction}
Size: ${result.size} BTC
Price: $${result.price.toFixed(2)}
Value: $${(result.size * result.price).toFixed(2)}

Your bot is ready for real trading!

To start automated trading:
  node run-trading-bot-v13-simplified.js
    `);
    
    // Optional: Sell it back after 10 seconds
    console.log('\n⏳ Waiting 10 seconds then selling back...');
    setTimeout(async () => {
      const sellResult = await trader.executeTrade('sell', 0.0001, 0.75);
      if (sellResult.success) {
        console.log('✅ Sold back successfully!');
        const pnl = (sellResult.price - result.price) * 0.0001;
        console.log(`P&L: $${pnl.toFixed(2)}`);
      }
    }, 10000);
    
  } else {
    console.log(`
❌ TEST TRADE FAILED

Reason: ${result.reason || result.error}

Common issues:
1. Insufficient funds (need at least $10 USD)
2. API key missing trade permissions
3. Kraken API is down
    `);
  }
}

testTrade();
