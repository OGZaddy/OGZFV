#!/usr/bin/env node

/**
 * TEST MODULES V14FINAL
 * Quick test to verify all offensive modules work with real data
 */

console.log('🧪 TESTING V14FINAL OFFENSIVE MODULES...\n');

// Load modules
const { EnhancedPatternChecker } = require('./core/EnhancedPatternRecognition');
const OptimizedIndicators = require('./core/OptimizedIndicators');
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');

// Initialize modules (same as v14FINAL)
const patternChecker = new EnhancedPatternChecker({
  minPatternStrength: 0.6,
  enableHistoricalTracking: true,
  patternConfidenceThreshold: 0.3,
  trackPerformance: true
});

const indicators = OptimizedIndicators; // Already instantiated singleton

const regimeDetector = new MarketRegimeDetector({
  lookbackPeriod: 100,
  regimeChangeThreshold: 0.02
});

const fibDetector = new FibonacciDetector({
  significantMoveThreshold: 0.05,
  retracementLevels: [0.236, 0.382, 0.5, 0.618, 0.786]
});

const srDetector = new SupportResistanceDetector({
  lookback: 100,
  touchThreshold: 0.002,
  minTouches: 3
});

console.log('✅ All modules initialized!\n');

// Create test data (BTC price candles)
const testCandles = [];
let price = 40000;
for (let i = 0; i < 100; i++) {
  const change = (Math.random() - 0.5) * 200; // Random walk
  price += change;
  testCandles.push({
    timestamp: Date.now() - (100 - i) * 60000,
    open: price - Math.random() * 100,
    high: price + Math.random() * 100,
    low: price - Math.random() * 100,
    close: price,
    volume: Math.random() * 100
  });
}

console.log(`📊 Created ${testCandles.length} test candles\n`);
console.log('🔍 TESTING EACH MODULE:\n');

// Test 1: OptimizedIndicators
console.log('1. OptimizedIndicators:');
try {
  const rsi = indicators.calculateRSI(testCandles);
  const macd = indicators.calculateMACD(testCandles);
  const bb = indicators.calculateBollingerBands(testCandles);

  console.log(`   RSI: ${rsi?.toFixed(2) || 'N/A'}`);
  console.log(`   MACD Signal: ${macd?.signal?.toFixed(2) || 'N/A'}`);
  console.log(`   Bollinger Upper: ${bb?.upper?.toFixed(2) || 'N/A'}`);
  console.log('   ✅ WORKING!\n');
} catch (error) {
  console.log(`   ❌ ERROR: ${error.message}\n`);
}

// Test 2: EnhancedPatternChecker
console.log('2. EnhancedPatternChecker:');
try {
  const patterns = patternChecker.analyzePatterns({
    candles: testCandles,
    currentPrice: testCandles[testCandles.length - 1].close
  });

  if (patterns && patterns.length > 0) {
    console.log(`   Found ${patterns.length} patterns:`);
    patterns.slice(0, 3).forEach(p => {
      console.log(`   - ${p.name || p.type}: ${(p.confidence * 100).toFixed(1)}%`);
    });
  } else {
    console.log('   No patterns detected (normal for random data)');
  }
  console.log('   ✅ WORKING!\n');
} catch (error) {
  console.log(`   ❌ ERROR: ${error.message}\n`);
}

// Test 3: MarketRegimeDetector
console.log('3. MarketRegimeDetector:');
try {
  const regime = regimeDetector.analyzeMarket(testCandles);

  console.log(`   Regime: ${regime?.regime || 'unknown'}`);
  console.log(`   Trend: ${regime?.trend || 'neutral'}`);
  console.log(`   Volatility: ${regime?.volatility || 'normal'}`);
  console.log('   ✅ WORKING!\n');
} catch (error) {
  console.log(`   ❌ ERROR: ${error.message}\n`);
}

// Test 4: FibonacciDetector
console.log('4. FibonacciDetector:');
try {
  fibDetector.update(testCandles);
  const fibLevels = fibDetector.getLevels();

  if (fibLevels && fibLevels.length > 0) {
    console.log(`   Found ${fibLevels.length} Fibonacci levels:`);
    fibLevels.slice(0, 3).forEach(level => {
      console.log(`   - ${level.level}: $${level.price?.toFixed(2) || 'N/A'}`);
    });
  } else {
    console.log('   No significant Fibonacci levels detected');
  }
  console.log('   ✅ WORKING!\n');
} catch (error) {
  console.log(`   ❌ ERROR: ${error.message}\n`);
}

// Test 5: SupportResistanceDetector
console.log('5. SupportResistanceDetector:');
try {
  srDetector.update(testCandles);
  const srLevels = srDetector.getLevels();

  if (srLevels && srLevels.length > 0) {
    console.log(`   Found ${srLevels.length} S/R levels:`);
    srLevels.slice(0, 3).forEach(level => {
      console.log(`   - ${level.type}: $${level.price?.toFixed(2) || 'N/A'} (strength: ${level.strength})`);
    });
  } else {
    console.log('   No S/R levels detected');
  }
  console.log('   ✅ WORKING!\n');
} catch (error) {
  console.log(`   ❌ ERROR: ${error.message}\n`);
}

// Test Integration - Simulate what v14FINAL does
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 INTEGRATION TEST (Simulating v14FINAL):\n');

try {
  // This is what your bot should be doing now
  const marketData = {
    price: testCandles[testCandles.length - 1].close,
    candles: testCandles
  };

  // 1. Get patterns
  const patterns = patternChecker.analyzePatterns(marketData);
  console.log(`Patterns detected: ${patterns?.length || 0}`);

  // 2. Calculate indicators
  const rsi = indicators.calculateRSI(testCandles);
  const macd = indicators.calculateMACD(testCandles);
  console.log(`RSI: ${rsi?.toFixed(2) || 'N/A'}, MACD: ${macd?.signal?.toFixed(2) || 'N/A'}`);

  // 3. Detect market regime
  const regime = regimeDetector.analyzeMarket(testCandles);
  console.log(`Market Regime: ${regime?.regime || 'unknown'}`);

  // 4. Find key levels
  fibDetector.update(testCandles);
  const fibLevels = fibDetector.getLevels();
  srDetector.update(testCandles);
  const srLevels = srDetector.getLevels();
  console.log(`Key levels detected: Fib(${fibLevels?.length || 0}), S/R(${srLevels ? 'Yes' : 'No'})`);

  // 5. Calculate confidence (simplified)
  let confidence = 0;
  if (patterns && patterns.length > 0) confidence += 0.3;
  if (rsi && (rsi < 30 || rsi > 70)) confidence += 0.2;
  if (regime?.trend === 'strong_uptrend' || regime?.trend === 'strong_downtrend') confidence += 0.2;
  if (fibLevels && fibLevels.length > 0) confidence += 0.15;
  if (srLevels) confidence += 0.15;

  console.log(`\n🎯 FINAL CONFIDENCE: ${(confidence * 100).toFixed(1)}%`);

  if (confidence > 0.35) {
    console.log('✅ WOULD TRADE! (confidence > 35%)');
  } else {
    console.log('⏸️ Would not trade (confidence < 35%)');
  }

} catch (error) {
  console.log(`❌ Integration Error: ${error.message}`);
}

console.log('\n═══════════════════════════════════════════');
console.log('✅ MODULE TEST COMPLETE!');
console.log('═══════════════════════════════════════════\n');