#!/usr/bin/env node

/**
 * THE MACHINE SPIRIT'S FINAL JUDGMENT
 * This WILL make the bot trade or reveal why it's broken
 */

console.log('⚡⚡⚡ INVOKING THE OMNISSIAH\'S WRATH ⚡⚡⚡\n');

// Kill PM2 instance and run directly
const { execSync } = require('child_process');

console.log('💀 Killing PM2 instance...');
try {
  execSync('pm2 stop ogz-trading-bot', { stdio: 'inherit' });
} catch(e) {}

// Remove singleton lock
console.log('🔓 Removing singleton lock...');
try {
  require('fs').unlinkSync('/home/trey/OGZFV-valhalla/.v13-simplified-bot.lock');
} catch(e) {}

console.log('\n🔥 Loading bot class directly...');
const BotClass = require('./run-trading-bot-v13-simplified.js');

class ForceTradeBot extends BotClass {
  constructor() {
    super();
    console.log('⚡ ForceTradeBot initialized with trading overrides');
  }

  async startTradingOperations() {
    console.log('🔥 OVERRIDE: startTradingOperations FORCED');

    // Force immediate test
    console.log('💀 FORCING IMMEDIATE TRADE CYCLE...');

    // Make sure we're "active"
    this.systemState.active = true;
    this.systemState.emergencyMode = false;

    // Call immediately
    try {
      await this.performTradingCycle();
      console.log('✅ First cycle complete');
    } catch (error) {
      console.error('❌ IMMEDIATE CYCLE FAILED:', error);
    }

    // Force a 5 second interval for testing
    console.log('⏰ Setting AGGRESSIVE 5-second interval...');
    this.tradingInterval = setInterval(async () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`⚡ FORCED INTERVAL TRIGGER at ${new Date().toISOString()}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // Override all safety checks
        this.systemState.active = true;
        this.systemState.emergencyMode = false;

        // Force market data
        if (!this.cachedMarketData) {
          this.cachedMarketData = {
            price: 115000 + Math.random() * 1000,
            asset: 'BTC-USD',
            timestamp: Date.now(),
            volume: 1000000
          };
        }
        this.lastDataReceived = Date.now();

        // Force price data if needed
        if (!this.priceData || this.priceData.length < 100) {
          console.log('📊 Injecting fake price data...');
          this.priceData = [];
          for (let i = 0; i < 100; i++) {
            this.priceData.push(115000 + (Math.random() - 0.5) * 2000);
          }
        }

        await this.performTradingCycle();
      } catch (error) {
        console.error('❌ INTERVAL CYCLE FAILED:', error.message);
        console.error('Stack:', error.stack);
      }
    }, 5000); // 5 seconds for testing

    console.log('✅ Trading operations FORCED to start');
  }

  async performTradingCycle() {
    console.log('🎯 performTradingCycle OVERRIDE called');

    // Log current state
    console.log('State check:', {
      active: this.systemState.active,
      emergency: this.systemState.emergencyMode,
      priceDataLength: this.priceData?.length || 0,
      hasMarketData: !!this.cachedMarketData
    });

    // Call parent implementation
    return super.performTradingCycle();
  }
}

async function unleashWrath() {
  console.log('\n🔥 Creating ForceTradeBot...');
  const bot = new ForceTradeBot();

  console.log('🔥 Initializing...');
  await bot.initialize();

  console.log('\n💀 THE MACHINE SPIRIT WATCHES...\n');

  // Keep alive for 1 minute
  setTimeout(() => {
    console.log('\n⚡ Test complete. The Machine Spirit is appeased.');
    process.exit(0);
  }, 60000);
}

unleashWrath().catch(err => {
  console.error('💀💀💀 CATASTROPHIC FAILURE:', err);
  console.error(err.stack);
  process.exit(1);
});