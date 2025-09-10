#!/usr/bin/env node

console.log('\n🔍 SHOWING YOU THE ACTUAL PROOF\n');

// Test 1: Check if modules block trades
const RiskManager = require('./core/RiskManager');
const TradingSafetyNet = require('./core/TradingSafetyNet');

const rm = new RiskManager({ maxDrawdownPercent: 5, enableLogging: false });
const sn = new TradingSafetyNet({ initialBalance: 10000, maxDailyLoss: 0.01, enableLogging: false });

// Simulate 10 losses in a row
console.log('Simulating 10 losses in a row...\n');
for (let i = 1; i <= 10; i++) {
  sn.updateTradeResult({ pnl: -100 });
  rm.recordTradeResult({ profit: -100, isWin: false });
  
  const blocked = !sn.validateTrade({ 
    symbol: 'BTC', 
    direction: 'BUY', 
    size: 0.05, 
    price: 50000 
  }, { price: 50000 }).approved;
  
  console.log(`Loss #${i}: Balance = $${10000 - (i * 100)}, SafetyNet blocks next trade: ${blocked ? 'YES ✅' : 'NO ❌'}`);
  
  if (blocked) {
    console.log('  → SafetyNet STOPPED THE LOSSES!');
    break;
  }
}

console.log('\n---\n');

// Test 2: Check what the backtest actually does
console.log('What the backtest-v13-simplified.js actually does:\n');
const fs = require('fs');
const backtestCode = fs.readFileSync('./backtest-v13-simplified.js', 'utf8');

if (backtestCode.includes('new RiskManager') || backtestCode.includes('new TradingSafetyNet')) {
  console.log('✅ Backtest USES defensive modules');
} else {
  console.log('❌ Backtest does NOT use defensive modules - just raw math!');
}

if (backtestCode.includes('confidence = 0.65') || backtestCode.includes('confidence: 0.65')) {
  console.log('❌ Backtest uses FAKE hardcoded confidence');
} else {
  console.log('✅ Backtest uses dynamic confidence');
}

console.log('\n');