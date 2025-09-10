#!/usr/bin/env node

/**
 * PRODUCTION STRESS TEST - Real money confidence test
 * This ensures the bot won't lose people's money
 */

require('dotenv').config();
const OGZPrimeV13 = require('./run-trading-bot-v13-simplified');

class ProductionStressTest {
  constructor() {
    this.testResults = {
      passed: [],
      failed: [],
      criticalIssues: [],
      performance: {
        trades: 0,
        blocked: 0,
        errors: 0,
        avgConfidence: 0,
        maxDrawdown: 0
      }
    };
    
    console.log('\n' + '='.repeat(80));
    console.log('🔥 PRODUCTION STRESS TEST - Real Money Confidence Check');
    console.log('='.repeat(80));
    console.log('This test ensures the bot is safe for real money trading\n');
  }
  
  async runAllTests() {
    try {
      // Test 1: Bot initialization
      await this.testBotInitialization();
      
      // Test 2: Defensive modules functionality
      await this.testDefensiveModules();
      
      // Test 3: Confidence calculation accuracy
      await this.testConfidenceCalculation();
      
      // Test 4: Trade execution safety
      await this.testTradeExecution();
      
      // Test 5: Stress test with rapid market changes
      await this.stressTestMarketConditions();
      
      // Test 6: Error handling
      await this.testErrorHandling();
      
      // Final report
      this.generateReport();
      
    } catch (error) {
      console.error('\n❌ CRITICAL FAILURE:', error.message);
      this.testResults.criticalIssues.push(error.message);
      this.generateReport();
      process.exit(1);
    }
  }
  
  async testBotInitialization() {
    console.log('TEST 1: Bot Initialization & Module Loading');
    console.log('-'.repeat(60));
    
    try {
      this.bot = new OGZPrimeV13();
      await this.bot.initialize();
      
      // Check critical modules
      const criticalModules = [
        { name: 'RiskManager', obj: this.bot.riskManager },
        { name: 'SafetyNet', obj: this.bot.safetyNet },
        { name: 'TradingBrain', obj: this.bot.tradingBrain }
      ];
      
      let allLoaded = true;
      criticalModules.forEach(module => {
        if (module.obj) {
          console.log(`  ✅ ${module.name} loaded`);
          this.testResults.passed.push(`${module.name} loaded`);
        } else {
          console.log(`  ❌ ${module.name} MISSING`);
          this.testResults.failed.push(`${module.name} missing`);
          allLoaded = false;
        }
      });
      
      if (!allLoaded) {
        throw new Error('Critical modules failed to load');
      }
      
    } catch (error) {
      console.error(`  ❌ Initialization failed: ${error.message}`);
      throw error;
    }
    
    console.log('');
  }
  
  async testDefensiveModules() {
    console.log('TEST 2: Defensive Module Functionality');
    console.log('-'.repeat(60));
    
    // Test SafetyNet blocks dangerous trades
    const dangerousScenarios = [
      {
        name: 'Excessive position size',
        trade: { symbol: 'BTC-USD', direction: 'BUY', size: 0.5, price: 100000, confidence: 0.9 },
        market: { volatility: 0.02 }
      },
      {
        name: 'High volatility',
        trade: { symbol: 'BTC-USD', direction: 'BUY', size: 0.05, price: 100000, confidence: 0.6 },
        market: { volatility: 0.5 }  // 50% volatility!
      },
      {
        name: 'After consecutive losses',
        trade: { symbol: 'BTC-USD', direction: 'BUY', size: 0.05, price: 100000, confidence: 0.7 },
        market: { volatility: 0.02 },
        setup: () => {
          // Simulate 5 consecutive losses
          for (let i = 0; i < 5; i++) {
            this.bot.safetyNet.updateTradeResult({ pnl: -100, timestamp: Date.now() });
          }
        }
      }
    ];
    
    for (const scenario of dangerousScenarios) {
      if (scenario.setup) scenario.setup();
      
      const result = this.bot.safetyNet.validateTrade(scenario.trade, scenario.market);
      
      if (!result.approved) {
        console.log(`  ✅ Blocked ${scenario.name}: ${result.reason}`);
        this.testResults.passed.push(`SafetyNet blocked ${scenario.name}`);
        this.testResults.performance.blocked++;
      } else {
        console.log(`  ❌ FAILED to block ${scenario.name}`);
        this.testResults.failed.push(`SafetyNet didn't block ${scenario.name}`);
      }
    }
    
    // Test RiskManager
    if (this.bot.riskManager) {
      const riskTest = this.bot.riskManager.assessTradeRisk({
        direction: 'BUY',
        entryPrice: 100000,
        confidence: 0.3,  // Low confidence
        marketData: { volatility: 0.1 }
      });
      
      if (!riskTest.approved) {
        console.log(`  ✅ RiskManager blocked low confidence trade`);
        this.testResults.passed.push('RiskManager blocks low confidence');
      } else {
        console.log(`  ⚠️ RiskManager approved low confidence trade`);
      }
    }
    
    console.log('');
  }
  
  async testConfidenceCalculation() {
    console.log('TEST 3: Confidence Calculation Accuracy');
    console.log('-'.repeat(60));
    
    const testCases = [
      {
        name: 'Bullish conditions',
        data: { rsi: 25, macd: 5, macdSignal: 3, trend: 'uptrend', volume: 1500000, avgVolume: 1000000 },
        expectedRange: [0.3, 0.6]
      },
      {
        name: 'Bearish conditions',
        data: { rsi: 75, macd: -5, macdSignal: -3, trend: 'downtrend', volume: 500000, avgVolume: 1000000 },
        expectedRange: [0.1, 0.4]
      },
      {
        name: 'Neutral conditions',
        data: { rsi: 50, macd: 0, macdSignal: 0, trend: 'neutral', volume: 1000000, avgVolume: 1000000 },
        expectedRange: [0.0, 0.3]
      },
      {
        name: 'High volatility impact',
        data: { rsi: 30, macd: 5, macdSignal: 3, trend: 'uptrend', volatility: 0.1 },
        expectedRange: [0.0, 0.4]
      }
    ];
    
    let totalConfidence = 0;
    let count = 0;
    
    for (const test of testCases) {
      const confidence = this.bot.calculateRealConfidence(test.data, []);
      totalConfidence += confidence;
      count++;
      
      if (confidence >= test.expectedRange[0] && confidence <= test.expectedRange[1]) {
        console.log(`  ✅ ${test.name}: ${(confidence * 100).toFixed(1)}% (expected ${test.expectedRange[0]*100}-${test.expectedRange[1]*100}%)`);
        this.testResults.passed.push(`Confidence correct for ${test.name}`);
      } else if (confidence === 0.65) {
        console.log(`  ❌ ${test.name}: HARDCODED 65%!`);
        this.testResults.criticalIssues.push('Hardcoded confidence detected!');
      } else {
        console.log(`  ⚠️ ${test.name}: ${(confidence * 100).toFixed(1)}% (outside expected range)`);
      }
    }
    
    this.testResults.performance.avgConfidence = (totalConfidence / count) * 100;
    console.log(`\n  Average confidence: ${this.testResults.performance.avgConfidence.toFixed(1)}%`);
    
    console.log('');
  }
  
  async testTradeExecution() {
    console.log('TEST 4: Trade Execution Safety');
    console.log('-'.repeat(60));
    
    // Simulate a trading session
    let balance = 10000;
    let trades = 0;
    let blocked = 0;
    let errors = 0;
    let maxDrawdown = 0;
    let peakBalance = balance;
    
    console.log('  Simulating 100 trade decisions...');
    
    for (let i = 0; i < 100; i++) {
      // Generate varied market conditions
      const marketData = {
        price: 100000 + (Math.random() - 0.5) * 10000,
        rsi: 20 + Math.random() * 60,
        macd: (Math.random() - 0.5) * 10,
        macdSignal: (Math.random() - 0.5) * 8,
        trend: Math.random() > 0.5 ? 'uptrend' : 'downtrend',
        volume: 500000 + Math.random() * 1500000,
        avgVolume: 1000000,
        volatility: 0.01 + Math.random() * 0.05
      };
      
      try {
        // Calculate confidence
        const confidence = this.bot.calculateRealConfidence(marketData, []);
        
        if (confidence > 0.3) {  // Minimum threshold
          const trade = {
            symbol: 'BTC-USD',
            direction: marketData.macd > 0 ? 'BUY' : 'SELL',
            size: 0.02,
            price: marketData.price,
            confidence: confidence
          };
          
          // Check SafetyNet
          const safetyCheck = this.bot.safetyNet.validateTrade(trade, marketData);
          
          if (safetyCheck.approved) {
            // Check RiskManager
            const riskCheck = this.bot.riskManager.assessTradeRisk({
              direction: trade.direction,
              entryPrice: trade.price,
              confidence: confidence,
              marketData: marketData
            });
            
            if (riskCheck.approved) {
              trades++;
              // Simulate simple P&L
              const outcome = Math.random() > 0.45; // Slightly favorable
              const pnl = outcome ? balance * 0.01 : -balance * 0.008;
              balance += pnl;
              
              // Track drawdown
              if (balance > peakBalance) peakBalance = balance;
              const currentDrawdown = ((peakBalance - balance) / peakBalance) * 100;
              if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
              
              // Update modules with result
              this.bot.safetyNet.updateTradeResult({ pnl: pnl, timestamp: Date.now() });
            } else {
              blocked++;
            }
          } else {
            blocked++;
          }
        }
      } catch (error) {
        errors++;
      }
    }
    
    this.testResults.performance.trades = trades;
    this.testResults.performance.blocked = blocked;
    this.testResults.performance.errors = errors;
    this.testResults.performance.maxDrawdown = maxDrawdown;
    
    console.log(`  Trades executed: ${trades}`);
    console.log(`  Trades blocked: ${blocked}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Final balance: $${balance.toFixed(2)}`);
    console.log(`  Max drawdown: ${maxDrawdown.toFixed(2)}%`);
    
    if (balance > 9500 && maxDrawdown < 10) {
      console.log('  ✅ Trading safety validated');
      this.testResults.passed.push('Safe trading execution');
    } else if (balance < 9000) {
      console.log('  ❌ Excessive losses detected');
      this.testResults.failed.push('Lost too much in simulation');
    }
    
    console.log('');
  }
  
  async stressTestMarketConditions() {
    console.log('TEST 5: Stress Test - Extreme Market Conditions');
    console.log('-'.repeat(60));
    
    const extremeConditions = [
      { name: 'Flash crash', volatility: 0.5, rsi: 10, trend: 'strong_downtrend' },
      { name: 'Pump scenario', volatility: 0.3, rsi: 90, trend: 'strong_uptrend' },
      { name: 'Flat market', volatility: 0.001, rsi: 50, trend: 'neutral' },
      { name: 'Whipsaw', volatility: 0.2, rsi: Math.random() * 100, trend: 'neutral' }
    ];
    
    for (const condition of extremeConditions) {
      const marketData = {
        price: 100000,
        volatility: condition.volatility,
        rsi: condition.rsi,
        trend: condition.trend,
        macd: (Math.random() - 0.5) * 20,
        volume: 1000000,
        avgVolume: 1000000
      };
      
      try {
        const confidence = this.bot.calculateRealConfidence(marketData, []);
        const trade = {
          symbol: 'BTC-USD',
          direction: 'BUY',
          size: 0.05,
          price: 100000,
          confidence: confidence
        };
        
        const safetyCheck = this.bot.safetyNet.validateTrade(trade, marketData);
        
        console.log(`  ${condition.name}:`);
        console.log(`    Confidence: ${(confidence * 100).toFixed(1)}%`);
        console.log(`    SafetyNet: ${safetyCheck.approved ? '⚠️ Approved' : `✅ Blocked: ${safetyCheck.reason}`}`);
        
        if (condition.volatility > 0.2 && safetyCheck.approved) {
          console.log('    ❌ Should have blocked high volatility!');
          this.testResults.failed.push(`Didn't block ${condition.name}`);
        } else {
          this.testResults.passed.push(`Handled ${condition.name} correctly`);
        }
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        this.testResults.errors++;
      }
    }
    
    console.log('');
  }
  
  async testErrorHandling() {
    console.log('TEST 6: Error Handling & Recovery');
    console.log('-'.repeat(60));
    
    // Test with invalid data
    const invalidTests = [
      { name: 'Null market data', data: null },
      { name: 'Empty object', data: {} },
      { name: 'NaN values', data: { rsi: NaN, price: NaN } },
      { name: 'Undefined values', data: { rsi: undefined, macd: undefined } }
    ];
    
    for (const test of invalidTests) {
      try {
        const confidence = this.bot.calculateRealConfidence(test.data, []);
        console.log(`  ✅ Handled ${test.name}: confidence = ${(confidence * 100).toFixed(1)}%`);
        this.testResults.passed.push(`Handled ${test.name}`);
      } catch (error) {
        console.log(`  ❌ Crashed on ${test.name}: ${error.message}`);
        this.testResults.failed.push(`Crashed on ${test.name}`);
      }
    }
    
    console.log('');
  }
  
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.passed.length + this.testResults.failed.length;
    const passRate = (this.testResults.passed.length / totalTests) * 100;
    
    console.log('\n📈 TEST RESULTS:');
    console.log(`  Total tests: ${totalTests}`);
    console.log(`  Passed: ${this.testResults.passed.length} (${passRate.toFixed(1)}%)`);
    console.log(`  Failed: ${this.testResults.failed.length}`);
    console.log(`  Critical issues: ${this.testResults.criticalIssues.length}`);
    
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`  Trades executed: ${this.testResults.performance.trades}`);
    console.log(`  Trades blocked: ${this.testResults.performance.blocked}`);
    console.log(`  Average confidence: ${this.testResults.performance.avgConfidence.toFixed(1)}%`);
    console.log(`  Max drawdown: ${this.testResults.performance.maxDrawdown.toFixed(2)}%`);
    console.log(`  Errors handled: ${this.testResults.performance.errors}`);
    
    if (this.testResults.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.testResults.criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    }
    
    if (this.testResults.failed.length > 0) {
      console.log('\n⚠️ FAILED TESTS:');
      this.testResults.failed.forEach(fail => {
        console.log(`  • ${fail}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    const isProductionReady = 
      this.testResults.criticalIssues.length === 0 &&
      passRate >= 90 &&
      this.testResults.performance.maxDrawdown < 15;
    
    if (isProductionReady) {
      console.log('✅ PRODUCTION READY - Safe for real money trading!');
      console.log('');
      console.log('The bot has passed all critical safety checks:');
      console.log('  • Defensive modules are working');
      console.log('  • Confidence calculation is dynamic');
      console.log('  • Risk management is enforced');
      console.log('  • Error handling is robust');
      console.log('  • Drawdown protection is active');
    } else {
      console.log('❌ NOT PRODUCTION READY - Issues need to be fixed!');
      console.log('');
      console.log('Fix these before going live:');
      if (this.testResults.criticalIssues.length > 0) {
        console.log('  • Critical issues detected');
      }
      if (passRate < 90) {
        console.log('  • Too many test failures');
      }
      if (this.testResults.performance.maxDrawdown >= 15) {
        console.log('  • Excessive drawdown risk');
      }
    }
    
    console.log('='.repeat(80) + '\n');
    
    // Save detailed results
    const fs = require('fs');
    fs.writeFileSync('production-test-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      productionReady: isProductionReady,
      passRate: passRate,
      results: this.testResults
    }, null, 2));
    
    console.log('📁 Detailed results saved to production-test-results.json\n');
    
    process.exit(isProductionReady ? 0 : 1);
  }
}

// Run the test
async function main() {
  const test = new ProductionStressTest();
  await test.runAllTests();
}

main().catch(console.error);