#!/usr/bin/env node

/**
 * ACTUAL EXECUTION TEST - No cheating!
 * This actually runs the code to verify it works
 */

console.log('\n🔬 REAL EXECUTION TEST - No BS, just facts\n');

// Actually load and test the bot
try {
  // Import the bot
  const OGZPrimeV13 = require('./run-trading-bot-v13-simplified');
  
  // Create an instance
  console.log('1️⃣ Creating bot instance...');
  const bot = new OGZPrimeV13();
  
  // Test 1: Check if methods exist
  console.log('\n2️⃣ Checking if methods exist...');
  console.log(`  calculateTradingConfidence: ${typeof bot.calculateTradingConfidence === 'function' ? '✅' : '❌'}`);
  console.log(`  calculateRealConfidence: ${typeof bot.calculateRealConfidence === 'function' ? '✅' : '❌'}`);
  
  // Test 2: Actually CALL the confidence calculation
  console.log('\n3️⃣ Testing confidence calculation with REAL data...');
  
  const testMarketData = {
    price: 100000,
    rsi: 30,  // Oversold
    macd: 5,
    macdSignal: 3,
    volume: 1500000,
    avgVolume: 1000000,
    trend: 'uptrend',
    volatility: 0.02
  };
  
  const testPatterns = [
    { type: 'bullish_flag', strength: 0.8, confidence: 0.7 }
  ];
  
  try {
    // Call the actual method
    const confidence = bot.calculateTradingConfidence(testMarketData, testPatterns);
    
    console.log(`  Called calculateTradingConfidence: ✅`);
    console.log(`  Returned confidence: ${(confidence * 100).toFixed(1)}%`);
    
    // Verify it's NOT hardcoded 65%
    if (confidence === 0.65) {
      console.log(`  ❌ FAIL: Still returning hardcoded 65%!`);
    } else {
      console.log(`  ✅ PASS: Not hardcoded (${(confidence * 100).toFixed(1)}% != 65%)`);
    }
    
    // Test with different data to ensure it changes
    const testData2 = {
      price: 100000,
      rsi: 70,  // Overbought (different from first test)
      macd: -5,
      macdSignal: -3,
      volume: 500000,
      avgVolume: 1000000,
      trend: 'downtrend',
      volatility: 0.08
    };
    
    const confidence2 = bot.calculateTradingConfidence(testData2, []);
    console.log(`  Second test confidence: ${(confidence2 * 100).toFixed(1)}%`);
    
    if (confidence === confidence2) {
      console.log(`  ⚠️ WARNING: Same confidence for different data`);
    } else {
      console.log(`  ✅ PASS: Confidence changes with different data`);
    }
    
  } catch (error) {
    console.log(`  ❌ FAIL: Error calling method - ${error.message}`);
  }
  
  // Test 3: Check defensive modules
  console.log('\n4️⃣ Testing defensive modules...');
  
  console.log(`  RiskManager exists: ${bot.riskManager ? '✅' : '❌'}`);
  console.log(`  SafetyNet exists: ${bot.safetyNet ? '✅' : '❌'}`);
  
  if (bot.riskManager && typeof bot.riskManager.assessTradeRisk === 'function') {
    console.log(`  RiskManager.assessTradeRisk callable: ✅`);
  } else {
    console.log(`  RiskManager.assessTradeRisk callable: ❌`);
  }
  
  if (bot.safetyNet && typeof bot.safetyNet.validateTrade === 'function') {
    console.log(`  SafetyNet.validateTrade callable: ✅`);
  } else {
    console.log(`  SafetyNet.validateTrade callable: ❌`);
  }
  
  // Test 4: Simulate a trade decision
  console.log('\n5️⃣ Simulating trade decision flow...');
  
  if (bot.safetyNet) {
    const tradeRequest = {
      symbol: 'BTC-USD',
      direction: 'BUY',
      size: 0.05,
      price: 100000,
      confidence: 0.7
    };
    
    try {
      const safetyResult = bot.safetyNet.validateTrade(tradeRequest, testMarketData);
      console.log(`  SafetyNet validation: ${safetyResult.approved ? '✅ Approved' : `❌ Blocked: ${safetyResult.reason}`}`);
    } catch (error) {
      console.log(`  ❌ SafetyNet error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXECUTION TEST COMPLETE');
  console.log('This is what ACTUALLY happens when the code runs!');
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('\n❌ CRITICAL ERROR: Bot won\'t even load!');
  console.error(error.message);
  console.error('\nThis needs to be fixed before shipping!');
  process.exit(1);
}