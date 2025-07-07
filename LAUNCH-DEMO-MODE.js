// ===================================================================
// OGZ AUTONOMOUS TRADER - DEMO MODE LAUNCHER
// ===================================================================
// Perfect for testing while waiting for API subscription renewal
// All trading algorithms work normally with realistic simulated data

const OGZAutonomousTrader = require('./OGZ-AutonomousTrader-3Day');

console.log('🎮 ===== OGZ DEMO MODE LAUNCHER =====');
console.log('💡 Testing autonomous trading with simulated BTC data');
console.log('📊 All algorithms work normally - perfect for validation');
console.log('');

async function launchDemoMode() {
  try {
    // Create trader instance
    const trader = new OGZAutonomousTrader({
      symbol: 'BTC-USD',
      initialBalance: 10000, // $10k simulated balance
      operationMode: 'SEMI_AGGRESSIVE',
      maxOperationDays: 3
    });
    
    console.log('🔧 Initializing demo trading systems...');
    await trader.initialize();
    
    console.log('🚀 Starting autonomous demo trading...');
    await trader.startAutonomousTrading();
    
    // Status updates every 30 seconds
    setInterval(() => {
      const status = trader.getStatus();
      console.log(`📊 DEMO STATUS | Runtime: ${Math.floor(status.runtime/60)}m | Balance: $${status.currentBalance.toFixed(2)} | Trades: ${status.totalTrades} | Price: $${status.currentPrice.toFixed(2)}`);
    }, 30000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down demo mode...');
      await trader.stopAutonomousTrading('Demo stopped by user');
      process.exit(0);
    });
    
    console.log('✅ Demo mode active! Press Ctrl+C to stop');
    console.log('💰 Watch your simulated profits grow while you wait for API renewal!');
    
  } catch (error) {
    console.error('❌ Demo launch failed:', error);
    process.exit(1);
  }
}

// Launch it!
launchDemoMode();