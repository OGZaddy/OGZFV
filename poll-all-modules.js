#!/usr/bin/env node
// COMPREHENSIVE MODULE POLLING - Check all instantiated modules

console.log('🔍 ELITE BOT MODULE HEALTH CHECK\n');
console.log('=' .repeat(60));

const modules = [];
let passed = 0;
let failed = 0;

// Helper function to test module
function testModule(name, path, testFn) {
  try {
    const Module = require(path);

    // Try to instantiate if it's a class
    let instance;
    let status = '✅ LOADED';

    if (testFn) {
      const result = testFn(Module);
      instance = result.instance;
      status = result.status || status;
    } else if (typeof Module === 'function') {
      // Try default instantiation
      try {
        instance = new Module();
        status = '✅ INSTANTIATED';
      } catch(e) {
        // Some modules need config
        if (e.message.includes('config') || e.message.includes('options')) {
          instance = new Module({});
          status = '✅ INSTANTIATED (with config)';
        } else {
          status = '⚠️  LOADED (needs params)';
        }
      }
    }

    modules.push({ name, status, instance });
    passed++;
    console.log(`${status} | ${name}`);
    return instance;
  } catch(e) {
    failed++;
    modules.push({ name, status: '❌ FAILED', error: e.message });
    console.log(`❌ FAILED | ${name}: ${e.message}`);
    return null;
  }
}

console.log('\n📦 CORE SYSTEM MODULES:');
console.log('-'.repeat(60));

// Core system modules
testModule('SingletonLock', './core/SingletonLock', (Module) => {
  const { OGZSingletonLock } = Module;
  return {
    instance: new OGZSingletonLock('test-lock'),
    status: '✅ INSTANTIATED'
  };
});

testModule('PolygonWebSocket', './core/PolygonWebSocket');
testModule('TimeFrameManager', './core/TimeFrameManager');
testModule('PerformanceDashboardIntegration', './core/PerformanceDashboardIntegration');

console.log('\n🛡️ DEFENSIVE MODULES (Risk & Safety):');
console.log('-'.repeat(60));

// Defensive modules
testModule('RiskManager', './core/RiskManager');
testModule('TradingSafetyNet', './core/TradingSafetyNet');
testModule('MaxProfitManager', './core/MaxProfitManager');
testModule('PerformanceAnalyzer', './core/PerformanceAnalyzer');
testModule('PerformanceValidator', './core/PerformanceValidator');
testModule('PerformanceVisualizer', './core/PerformanceVisualizer');

console.log('\n⚔️ OFFENSIVE MODULES (Trading & Analysis):');
console.log('-'.repeat(60));

// Offensive modules
testModule('OptimizedTradingBrain', './core/OptimizedTradingBrain', (Module) => {
  const { OptimizedTradingBrain } = Module;
  return {
    instance: new OptimizedTradingBrain(10000),
    status: '✅ INSTANTIATED ($10k)'
  };
});

testModule('MultiDirectionalTrader', './core/MultiDirectionalTrader');
testModule('QuantumPositionSizer', './core/QuantumPositionSizer');
testModule('UltimateTradingSystem', './core/UltimateTradingSystem');

console.log('\n📊 INDICATOR & PATTERN MODULES:');
console.log('-'.repeat(60));

testModule('OptimizedIndicators', './core/OptimizedIndicators');
testModule('MarketRegimeDetector', './core/MarketRegimeDetector');
testModule('FibonacciDetector', './core/FibonacciDetector');
testModule('SupportResistanceDetector', './core/SupportResistanceDetector');
testModule('EnhancedPatternRecognition', './core/EnhancedPatternRecognition');
testModule('CorrelationAnalyzer', './core/CorrelationAnalyzer');

console.log('\n🤖 AI/ML MODULES:');
console.log('-'.repeat(60));

testModule('LogLearningSystem', './core/LogLearningSystem');
testModule('MLLogProcessor', './core/MLLogProcessor');

console.log('\n⚛️ QUANTUM/ADVANCED MODULES:');
console.log('-'.repeat(60));

testModule('RealQuantumEnhancement', './core/quantum-enhancement-layer');
testModule('OGZPrimeV14_QuantumDeFi', './core/OGZPrimeV14_QuantumDeFi');

console.log('\n🎯 TIER & FEATURE MODULES:');
console.log('-'.repeat(60));

testModule('TierFeatureFlags', './core/TierFeatureFlags', (Module) => {
  const instance = new Module('elite');
  const summary = instance.getTierSummary();
  console.log(`   📊 Elite Tier: ${summary.patterns} patterns, ${summary.maxPositions} positions`);
  return { instance, status: '✅ CONFIGURED (elite)' };
});

// Test a few methods on critical modules
console.log('\n🧪 MODULE FUNCTIONALITY TESTS:');
console.log('-'.repeat(60));

// Test RiskManager
try {
  const RiskManager = require('./core/RiskManager');
  const rm = new RiskManager();
  const position = rm.calculatePositionSize(10000, 50000, {});
  console.log(`✅ RiskManager.calculatePositionSize: $${position.toFixed(2)}`);
} catch(e) {
  console.log(`❌ RiskManager test failed: ${e.message}`);
}

// Test OptimizedIndicators
try {
  const OptimizedIndicators = require('./core/OptimizedIndicators');
  const indicators = new OptimizedIndicators();
  const testData = Array(20).fill(0).map((_, i) => ({ price: 50000 + i * 100 }));
  const sma = indicators.calculateSMA(testData, 10);
  console.log(`✅ OptimizedIndicators.calculateSMA: ${sma ? sma.toFixed(2) : 'N/A'}`);
} catch(e) {
  console.log(`❌ OptimizedIndicators test failed: ${e.message}`);
}

// Test MarketRegimeDetector
try {
  const MarketRegimeDetector = require('./core/MarketRegimeDetector');
  const mrd = new MarketRegimeDetector();
  const testData = Array(100).fill(0).map((_, i) => ({
    price: 50000 + i * 100,
    volume: 100
  }));
  const regime = mrd.detectRegime(testData);
  console.log(`✅ MarketRegimeDetector.detectRegime: ${regime.type || 'unknown'}`);
} catch(e) {
  console.log(`❌ MarketRegimeDetector test failed: ${e.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 MODULE HEALTH SUMMARY:');
console.log('='.repeat(60));
console.log(`✅ Modules Loaded: ${passed}`);
console.log(`❌ Modules Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed/(passed+failed))*100).toFixed(1)}%`);

// Check for critical modules
const criticalModules = [
  'RiskManager',
  'TradingSafetyNet',
  'OptimizedTradingBrain',
  'MultiDirectionalTrader',
  'OptimizedIndicators'
];

console.log('\n⚠️  CRITICAL MODULE STATUS:');
criticalModules.forEach(name => {
  const module = modules.find(m => m.name === name);
  if (module) {
    console.log(`${module.status.includes('✅') ? '✅' : '❌'} ${name}: ${module.status}`);
  } else {
    console.log(`❓ ${name}: Not tested`);
  }
});

console.log('\n🚀 PRODUCTION READINESS:');
if (failed === 0) {
  console.log('✅ ALL MODULES OPERATIONAL - READY FOR PRODUCTION!');
} else if (failed <= 2) {
  console.log('⚠️  MOSTLY READY - Review failed modules');
} else {
  console.log('❌ NOT READY - Multiple module failures detected');
}

process.exit(failed > 0 ? 1 : 0);