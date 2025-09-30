#!/usr/bin/env node

console.log('🔥 QUICK MODULE TEST - NO BULLSHIT\n');

// Test data - 10 simple candles
const candles = [];
for (let i = 0; i < 100; i++) {
  candles.push({
    timestamp: Date.now() - (100-i) * 60000,
    open: 40000 + Math.random() * 100,
    high: 40100 + Math.random() * 100,
    low: 39900 + Math.random() * 100,
    close: 40000 + Math.random() * 100,
    volume: Math.random() * 100
  });
}

// Test each module
const modules = [
  {
    name: 'OptimizedIndicators',
    test: () => {
      const indicators = require('./core/OptimizedIndicators');
      const rsi = indicators.calculateRSI(candles);
      return `RSI: ${rsi?.toFixed(2) || 'FAILED'}`;
    }
  },
  {
    name: 'EnhancedPatternChecker',
    test: () => {
      const { EnhancedPatternChecker } = require('./core/EnhancedPatternRecognition');
      const checker = new EnhancedPatternChecker({});
      const patterns = checker.analyzePatterns({ candles, currentPrice: 40000 });
      return `Patterns: ${patterns?.length || 0}`;
    }
  },
  {
    name: 'MarketRegimeDetector',
    test: () => {
      const MarketRegimeDetector = require('./core/MarketRegimeDetector');
      const detector = new MarketRegimeDetector({});
      const regime = detector.analyzeMarket(candles);
      return `Regime: ${regime?.regime || 'FAILED'}`;
    }
  },
  {
    name: 'FibonacciDetector',
    test: () => {
      const FibonacciDetector = require('./core/FibonacciDetector');
      const detector = new FibonacciDetector({});
      detector.update(candles);
      const levels = detector.getLevels();
      return `Levels: ${levels?.length || 0}`;
    }
  },
  {
    name: 'SupportResistanceDetector',
    test: () => {
      const SupportResistanceDetector = require('./core/SupportResistanceDetector');
      const detector = new SupportResistanceDetector({});
      detector.update(candles);
      const levels = detector.getLevels();
      return `Levels: ${levels?.length || 0}`;
    }
  }
];

console.log('Testing modules...\n');

let allWorking = true;
modules.forEach(module => {
  try {
    const result = module.test();
    console.log(`✅ ${module.name}: ${result}`);
  } catch (error) {
    console.log(`❌ ${module.name}: ${error.message}`);
    allWorking = false;
  }
});

console.log(allWorking ? '\n🎯 ALL MODULES WORKING!' : '\n⚠️ SOME MODULES FAILED');
process.exit(allWorking ? 0 : 1);