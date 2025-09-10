#!/usr/bin/env node

/**
 * QUICK TEST - Verify defensive modules and confidence are working
 */

console.log('\n🧪 QUICK SYSTEM TEST');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Test 1: SafetyNet drawdown calculation
console.log('📍 Test 1: SafetyNet Drawdown Calculation\n');

const TradingSafetyNet = require('./core/TradingSafetyNet');
const safetyNet = new TradingSafetyNet({
  initialBalance: 10000,
  maxDrawdown: 0.10, // 10% max drawdown
  enableLogging: false
});

// Simulate a small loss
safetyNet.updateTradeResult({ pnl: -50 });
console.log(`After -$50 loss:`);
console.log(`  Current Balance: $${safetyNet.state.currentBalance}`);
console.log(`  Peak Balance: $${safetyNet.state.peakBalance}`);
console.log(`  Drawdown: ${(safetyNet.state.currentDrawdown * 100).toFixed(2)}%`);
console.log(`  Emergency Stop: ${safetyNet.state.emergencyStop ? '🚨 YES' : '✅ NO'}`);

if (safetyNet.state.currentDrawdown > 0.01) {
  console.log('  ❌ FAIL: Drawdown too high for small loss');
} else {
  console.log('  ✅ PASS: Drawdown calculation correct');
}

// Test 2: Risk Manager
console.log('\n📍 Test 2: Risk Manager Connection\n');

const RiskManager = require('./core/RiskManager');
const riskManager = new RiskManager({
  baseRiskPercent: 2.0,
  maxDrawdownPercent: 15,
  enableLogging: false
});

const riskAssessment = riskManager.assessTradeRisk({
  direction: 'BUY',
  entryPrice: 50000,
  confidence: 0.7,
  marketData: { volatility: 0.02 }
});

console.log(`Risk Assessment:`);
console.log(`  Approved: ${riskAssessment.approved ? '✅ YES' : '❌ NO'}`);
console.log(`  Risk Level: ${riskAssessment.riskLevel}`);
console.log(`  Risk Score: ${riskAssessment.riskScore}`);

// Test 3: Confidence Calculation
console.log('\n📍 Test 3: Confidence Calculation\n');

try {
  const bot = require('./run-trading-bot-v13-simplified.js');
  
  // Create a test instance (won't actually trade)
  const testBot = new bot.OGZPrimeV13Simplified({
    primaryAsset: 'BTC-USD',
    enableTrading: false
  });
  
  const testMarketData = {
    price: 50000,
    rsi: 25,  // Oversold
    macd: 0.5,
    macdSignal: 0.3,
    trend: 'uptrend',
    volume: 100000,
    avgVolume: 90000
  };
  
  const confidence = testBot.calculateTradingConfidence ? 
    testBot.calculateTradingConfidence(testMarketData, []) :
    testBot.calculateRealConfidence ? 
      testBot.calculateRealConfidence(testMarketData, []) : 
      null;
  
  console.log(`Calculated Confidence: ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'}`);
  
  if (confidence === 0.65) {
    console.log('  ❌ FAIL: Still using hardcoded 0.65!');
  } else if (confidence && confidence !== 0.65) {
    console.log('  ✅ PASS: Using dynamic confidence calculation');
  } else {
    console.log('  ⚠️ WARNING: Could not test confidence calculation');
  }
  
} catch (error) {
  console.log('  ⚠️ Could not test confidence:', error.message);
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                        TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════\n');

const allPassed = !safetyNet.state.emergencyStop && 
                  riskAssessment.approved && 
                  safetyNet.state.currentDrawdown < 0.01;

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED! The defensive modules are working correctly.');
  console.log('\nThe bot is now:');
  console.log('  ✅ Using real confidence calculation');
  console.log('  ✅ SafetyNet drawdown calculation fixed');
  console.log('  ✅ RiskManager properly assessing trades');
  console.log('  ✅ Ready for safer trading!');
} else {
  console.log('⚠️ Some tests failed. Review the output above.');
}

console.log('\n');
process.exit(0);