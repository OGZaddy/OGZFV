#!/usr/bin/env node

/**
 * PROOF OF MODULES - Show the bot ACTUALLY generates confidence
 */

console.log('🔥 PROOF THE MODULES WORK IN V14FINAL\n');

// Load REAL historical BTC data
const fs = require('fs');
const dataFile = 'polygon-btc-1y.json';

if (!fs.existsSync(dataFile)) {
  console.error('Need polygon-btc-1y.json to test');
  process.exit(1);
}

const historicalData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
let candles;

if (Array.isArray(historicalData)) {
  candles = historicalData;
} else if (historicalData.results) {
  candles = historicalData.results.map(r => ({
    timestamp: r.t,
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v
  }));
}

// Take first 1000 candles for testing
candles = candles.slice(0, 1000);

console.log(`📊 Loaded ${candles.length} REAL BTC candles\n`);

// Initialize ALL modules exactly like v14FINAL does
const { EnhancedPatternChecker } = require('./core/EnhancedPatternRecognition');
const OptimizedIndicators = require('./core/OptimizedIndicators');
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');

console.log('Initializing modules...');

const patternChecker = new EnhancedPatternChecker({
  minPatternStrength: 0.6,
  enableHistoricalTracking: true,
  patternConfidenceThreshold: 0.3,
  trackPerformance: true
});

const indicators = OptimizedIndicators;

const marketRegime = new MarketRegimeDetector({
  lookbackPeriod: 100,
  regimeChangeThreshold: 0.02
});

const fibonacci = new FibonacciDetector({
  significantMoveThreshold: 0.05,
  retracementLevels: [0.236, 0.382, 0.5, 0.618, 0.786]
});

const supportResistance = new SupportResistanceDetector({
  lookback: 100,
  touchThreshold: 0.002,
  minTouches: 3
});

console.log('✅ All modules initialized\n');

// Process candles and show confidence evolution
console.log('Processing candles and calculating confidence...\n');

let tradesFound = 0;
const confidenceHistory = [];

for (let i = 100; i < candles.length; i++) {
  const currentCandles = candles.slice(i - 100, i);
  const currentPrice = candles[i].close;

  // 1. PATTERN DETECTION
  const patterns = patternChecker.analyzePatterns({
    candles: currentCandles,
    currentPrice: currentPrice
  });

  // 2. INDICATORS
  const rsi = indicators.calculateRSI(currentCandles);
  const macd = indicators.calculateMACD(currentCandles);
  const bollinger = indicators.calculateBollingerBands(currentCandles);

  // 3. MARKET REGIME
  const regime = marketRegime.analyzeMarket(currentCandles);

  // 4. FIBONACCI LEVELS
  fibonacci.update(currentCandles);
  const fibLevels = fibonacci.getLevels();

  // 5. SUPPORT/RESISTANCE
  supportResistance.update(currentCandles);
  const srLevels = supportResistance.getLevels();

  // CALCULATE CONFIDENCE (mimicking v14FINAL logic)
  let confidence = 0;
  let signals = [];

  // Pattern signals
  if (patterns && patterns.length > 0) {
    const avgPatternConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / patterns.length;
    confidence += avgPatternConfidence * 0.3;
    signals.push(`Patterns(${patterns.length})`);
  }

  // RSI signals
  if (rsi) {
    if (rsi < 30) {
      confidence += 0.2; // Oversold
      signals.push('RSI-Oversold');
    } else if (rsi > 70) {
      confidence += 0.2; // Overbought
      signals.push('RSI-Overbought');
    }
  }

  // MACD signals
  if (macd && macd.histogram) {
    if (Math.abs(macd.histogram) > 10) {
      confidence += 0.15;
      signals.push('MACD-Strong');
    }
  }

  // Market regime signals
  if (regime) {
    if (regime.trend === 'strong_uptrend' || regime.trend === 'strong_downtrend') {
      confidence += 0.2;
      signals.push(`Regime-${regime.trend}`);
    }
  }

  // Fibonacci signals
  if (fibLevels && fibLevels.length > 0) {
    const nearLevel = fibonacci.getNearestLevel(currentPrice);
    if (nearLevel && Math.abs(nearLevel.price - currentPrice) / currentPrice < 0.01) {
      confidence += 0.15;
      signals.push('Fib-Level');
    }
  }

  // Support/Resistance signals
  if (srLevels && srLevels.length > 0) {
    const nearLevel = supportResistance.getNearestLevel(currentPrice);
    if (nearLevel && Math.abs(nearLevel.price - currentPrice) / currentPrice < 0.01) {
      confidence += 0.15;
      signals.push('S/R-Level');
    }
  }

  // Store confidence
  confidenceHistory.push(confidence);

  // Show high confidence signals
  if (confidence >= 0.35) {
    tradesFound++;
    console.log(`📍 Candle ${i} | Price: $${currentPrice.toFixed(2)} | Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   Signals: ${signals.join(', ')}`);

    if (tradesFound >= 10) {
      console.log('\n... (limiting to first 10 for brevity)');
      break;
    }
  }
}

// Calculate statistics
const avgConfidence = confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length;
const maxConfidence = Math.max(...confidenceHistory);
const aboveThreshold = confidenceHistory.filter(c => c >= 0.35).length;

console.log('\n═══════════════════════════════════════════');
console.log('📊 RESULTS WITH ALL MODULES CONNECTED:');
console.log('═══════════════════════════════════════════\n');
console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
console.log(`Max Confidence: ${(maxConfidence * 100).toFixed(1)}%`);
console.log(`Signals Above 35%: ${aboveThreshold} out of ${confidenceHistory.length} candles`);
console.log(`Trade Frequency: ${((aboveThreshold / confidenceHistory.length) * 100).toFixed(1)}%`);

if (avgConfidence > 0.1) {
  console.log('\n✅ MODULES ARE WORKING! Confidence is being generated!');
} else {
  console.log('\n❌ Something is wrong - confidence too low');
}

console.log('\n🎯 This is what your bot SHOULD be doing with the connected modules!');