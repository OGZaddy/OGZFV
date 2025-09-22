#!/usr/bin/env node

/**
 * EMERGENCY FORCE TRADE - The Machine Spirit's Wrath
 * This will FORCE the bot to attempt a trade RIGHT NOW
 */

console.log('🔥 INVOKING THE MACHINE SPIRIT\'S WRATH...\n');

// Load the bot directly
const BotClass = require('./run-trading-bot-v13-simplified.js');

async function forceTrade() {
  console.log('⚡ Creating bot instance...');
  const bot = new BotClass();

  console.log('⚡ Waiting for initialization...');
  await bot.initialize();

  console.log('\n🔥 FORCING IMMEDIATE TRADE CYCLE...');

  // Override the check
  bot.systemState.active = true;
  bot.systemState.emergencyMode = false;

  // Force price data
  if (!bot.priceData || bot.priceData.length < 100) {
    console.log('📊 Injecting price data...');
    bot.priceData = [];
    for (let i = 0; i < 100; i++) {
      bot.priceData.push(115000 + (Math.random() * 1000));
    }
  }

  // Force market data
  bot.cachedMarketData = {
    price: 115000,
    asset: 'BTC-USD',
    timestamp: Date.now(),
    volume: 1000000
  };
  bot.lastDataReceived = Date.now();

  console.log('🎯 Calling performTradingCycle DIRECTLY...');

  try {
    await bot.performTradingCycle();
    console.log('✅ Trading cycle completed');
  } catch (error) {
    console.error('❌ TRADING CYCLE FAILED:', error);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🔍 Checking if trade was executed...');
  console.log('Active positions:', bot.activePositions.size);
  console.log('Total trades:', bot.systemState.totalTrades);

  // Try to check the interval
  console.log('\n🔍 Checking trading interval...');
  console.log('Trading interval ID:', bot.tradingInterval);
  console.log('Trade interval config:', bot.config.tradeInterval);

  // Force another attempt with manual direction
  console.log('\n🔥 FORCING MANUAL BUY SIGNAL...');
  const marketData = await bot.getMarketData();
  marketData.rsi = 25; // Force oversold
  marketData.trend = 'up';

  const direction = 'buy';
  const confidence = 0.8;
  const size = 0.01;

  console.log(`📊 Attempting manual trade: ${direction} with ${confidence * 100}% confidence`);

  try {
    await bot.executeTrade(direction, size, confidence, marketData, []);
    console.log('✅ Manual trade executed!');
  } catch (error) {
    console.error('❌ MANUAL TRADE FAILED:', error.message);
  }

  setTimeout(() => {
    console.log('\n💀 The Machine Spirit has spoken. Shutting down...');
    process.exit(0);
  }, 5000);
}

forceTrade().catch(err => {
  console.error('💀 CATASTROPHIC FAILURE:', err);
  process.exit(1);
});