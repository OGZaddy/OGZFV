#!/usr/bin/env node

/**
 * BACKTEST SUITE V14FINAL - COMPREHENSIVE TESTING
 *
 * Tests the bot with:
 * - Different timeframes (1m, 5m, 15m, 1h)
 * - Different confidence thresholds
 * - Different market conditions
 * - With and without offensive modules
 *
 * This will help find the OPTIMAL configuration
 */

const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CONFIGS = [
  {
    name: "Conservative 1min",
    timeframe: "1m",
    minConfidence: 0.50,
    maxPositionSize: 0.05,
    description: "Original conservative settings on 1-minute candles"
  },
  {
    name: "Moderate 1min",
    timeframe: "1m",
    minConfidence: 0.35,
    maxPositionSize: 0.10,
    description: "Moderate risk with 35% confidence threshold"
  },
  {
    name: "Aggressive 1min",
    timeframe: "1m",
    minConfidence: 0.25,
    maxPositionSize: 0.15,
    description: "Aggressive trading with 25% threshold"
  },
  {
    name: "Scalper 1min",
    timeframe: "1m",
    minConfidence: 0.20,
    maxPositionSize: 0.20,
    description: "Ultra-aggressive scalping mode"
  },
  {
    name: "Moderate 5min",
    timeframe: "5m",
    minConfidence: 0.35,
    maxPositionSize: 0.10,
    description: "5-minute timeframe for less noise"
  },
  {
    name: "Moderate 15min",
    timeframe: "15m",
    minConfidence: 0.35,
    maxPositionSize: 0.10,
    description: "15-minute for trend following"
  },
  {
    name: "Swing 1hr",
    timeframe: "1h",
    minConfidence: 0.40,
    maxPositionSize: 0.15,
    description: "Hourly for swing trading"
  }
];

class BacktestSuiteV14FINAL {
  constructor() {
    this.results = [];
    this.dataCache = {};
  }

  /**
   * Load and prepare data for different timeframes
   */
  async loadData(dataFile, timeframe) {
    // Check cache
    const cacheKey = `${dataFile}-${timeframe}`;
    if (this.dataCache[cacheKey]) {
      return this.dataCache[cacheKey];
    }

    // Load raw 1-minute data
    console.log(`📁 Loading ${dataFile} for ${timeframe} timeframe...`);
    const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    let candles;
    if (Array.isArray(rawData)) {
      candles = rawData;
    } else if (rawData.results) {
      candles = rawData.results.map(r => ({
        timestamp: r.t,
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v
      }));
    }

    // Convert to desired timeframe
    const aggregated = this.aggregateCandles(candles, timeframe);
    this.dataCache[cacheKey] = aggregated;

    return aggregated;
  }

  /**
   * Aggregate 1-minute candles to higher timeframes
   */
  aggregateCandles(candles, timeframe) {
    const multipliers = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    const multiplier = multipliers[timeframe] || 1;
    if (multiplier === 1) return candles;

    const aggregated = [];
    for (let i = 0; i < candles.length; i += multiplier) {
      const batch = candles.slice(i, i + multiplier);
      if (batch.length === 0) continue;

      aggregated.push({
        timestamp: batch[0].timestamp,
        open: batch[0].open,
        high: Math.max(...batch.map(c => c.high)),
        low: Math.min(...batch.map(c => c.low)),
        close: batch[batch.length - 1].close,
        volume: batch.reduce((sum, c) => sum + c.volume, 0)
      });
    }

    return aggregated;
  }

  /**
   * Run a single backtest configuration
   */
  async runBacktest(config, data) {
    console.log(`\n🏃 Running: ${config.name}`);
    console.log(`   ${config.description}`);
    console.log(`   Timeframe: ${config.timeframe} | Confidence: ${config.minConfidence * 100}% | Position: ${config.maxPositionSize * 100}%`);

    // Create backtester instance
    const ProductionBacktesterV14FINAL = require('./production-backtester-v14FINAL');
    const backtester = new ProductionBacktesterV14FINAL({
      symbol: 'BTC-USD',
      initialBalance: 10000,
      maxPositionSize: config.maxPositionSize,
      minTradeConfidence: config.minConfidence,
      patternConfidence: config.minConfidence * 0.8, // Pattern threshold slightly lower
      tier: 'ELITE' // Use elite to test all modules
    });

    // Run backtest
    const startTime = Date.now();
    const report = await backtester.runBacktest(data);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Store results
    const result = {
      config: config,
      metrics: {
        totalReturn: report.summary.totalReturn,
        totalPnL: report.summary.totalPnL,
        totalTrades: report.metrics.totalTrades,
        winRate: report.metrics.winRate,
        maxDrawdown: report.metrics.maxDrawdown,
        profitFactor: report.metrics.profitFactor,
        sharpeRatio: report.metrics.sharpeRatio || 0,
        executionTime: duration
      },
      tradesPerDay: report.metrics.totalTrades / (data.length / 1440), // Assuming 1440 minutes per day
      report: report
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run all test configurations
   */
  async runAllTests(dataFile) {
    console.log('\n🚀 BACKTEST SUITE V14FINAL - COMPREHENSIVE TESTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Testing with newly connected offensive modules:\n');
    console.log('✅ EnhancedPatternChecker');
    console.log('✅ OptimizedIndicators');
    console.log('✅ MarketRegimeDetector');
    console.log('✅ FibonacciDetector');
    console.log('✅ SupportResistanceDetector');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const config of TEST_CONFIGS) {
      try {
        // Load data for this timeframe
        const data = await this.loadData(dataFile, config.timeframe);
        console.log(`   📊 ${data.length} candles prepared`);

        // Run backtest
        await this.runBacktest(config, data);

      } catch (error) {
        console.error(`❌ Failed ${config.name}: ${error.message}`);
      }
    }

    // Generate summary report
    this.generateSummaryReport();
  }

  /**
   * Generate comprehensive summary report
   */
  generateSummaryReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('                   BACKTEST SUITE RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Sort by total return
    const sorted = this.results.sort((a, b) => b.metrics.totalReturn - a.metrics.totalReturn);

    // Display top 3
    console.log('🏆 TOP 3 CONFIGURATIONS:\n');
    sorted.slice(0, 3).forEach((result, index) => {
      console.log(`${index + 1}. ${result.config.name}`);
      console.log(`   Return: ${result.metrics.totalReturn >= 0 ? '+' : ''}${result.metrics.totalReturn.toFixed(2)}%`);
      console.log(`   Trades: ${result.metrics.totalTrades} (${result.tradesPerDay.toFixed(1)}/day)`);
      console.log(`   Win Rate: ${(result.metrics.winRate * 100).toFixed(1)}%`);
      console.log(`   Drawdown: ${result.metrics.maxDrawdown.toFixed(1)}%`);
      console.log(`   Profit Factor: ${result.metrics.profitFactor.toFixed(2)}`);
      console.log();
    });

    // Display comparison table
    console.log('📊 FULL COMPARISON TABLE:\n');
    console.log('Config            | Return  | Trades | Win%  | DD%   | PF    |');
    console.log('------------------|---------|--------|-------|-------|-------|');

    sorted.forEach(result => {
      const name = result.config.name.padEnd(17);
      const ret = `${result.metrics.totalReturn >= 0 ? '+' : ''}${result.metrics.totalReturn.toFixed(1)}%`.padStart(7);
      const trades = result.metrics.totalTrades.toString().padStart(6);
      const winRate = `${(result.metrics.winRate * 100).toFixed(0)}%`.padStart(5);
      const dd = `${result.metrics.maxDrawdown.toFixed(1)}%`.padStart(5);
      const pf = result.metrics.profitFactor.toFixed(2).padStart(5);

      console.log(`${name} | ${ret} | ${trades} | ${winRate} | ${dd} | ${pf} |`);
    });

    // Find optimal configuration
    console.log('\n🎯 OPTIMAL CONFIGURATION ANALYSIS:\n');

    // Best return
    const bestReturn = sorted[0];
    console.log(`Highest Return: ${bestReturn.config.name} (${bestReturn.metrics.totalReturn.toFixed(2)}%)`);

    // Most trades
    const mostTrades = this.results.sort((a, b) => b.metrics.totalTrades - a.metrics.totalTrades)[0];
    console.log(`Most Active: ${mostTrades.config.name} (${mostTrades.metrics.totalTrades} trades)`);

    // Best win rate
    const bestWinRate = this.results.sort((a, b) => b.metrics.winRate - a.metrics.winRate)[0];
    console.log(`Best Win Rate: ${bestWinRate.config.name} (${(bestWinRate.metrics.winRate * 100).toFixed(1)}%)`);

    // Lowest drawdown
    const lowestDD = this.results.sort((a, b) => a.metrics.maxDrawdown - b.metrics.maxDrawdown)[0];
    console.log(`Lowest Drawdown: ${lowestDD.config.name} (${lowestDD.metrics.maxDrawdown.toFixed(1)}%)`);

    // Best profit factor
    const bestPF = this.results.sort((a, b) => b.metrics.profitFactor - a.metrics.profitFactor)[0];
    console.log(`Best Risk/Reward: ${bestPF.config.name} (PF: ${bestPF.metrics.profitFactor.toFixed(2)})`);

    // Calculate score for each config
    console.log('\n📈 WEIGHTED SCORE ANALYSIS:');
    console.log('(Return*0.3 + WinRate*0.2 + PF*0.2 - DD*0.2 + Trades*0.1)\n');

    const scored = this.results.map(r => {
      const score = (
        (r.metrics.totalReturn / 100) * 30 +
        r.metrics.winRate * 20 +
        (r.metrics.profitFactor / 10) * 20 -
        (r.metrics.maxDrawdown / 100) * 20 +
        (Math.min(r.metrics.totalTrades, 100) / 100) * 10
      );
      return { ...r, score };
    }).sort((a, b) => b.score - a.score);

    console.log('Top 3 by Weighted Score:');
    scored.slice(0, 3).forEach((result, index) => {
      console.log(`${index + 1}. ${result.config.name} (Score: ${result.score.toFixed(2)})`);
    });

    // Save detailed report
    const reportPath = path.join(__dirname, `backtest-suite-results-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        bestReturn: bestReturn.config.name,
        mostActive: mostTrades.config.name,
        bestWinRate: bestWinRate.config.name,
        lowestDrawdown: lowestDD.config.name,
        bestProfitFactor: bestPF.config.name,
        optimalByScore: scored[0].config.name
      }
    }, null, 2));

    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const dataFile = process.argv[2] || 'polygon-btc-1y.json';

  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Data file not found: ${dataFile}`);
    console.log('Usage: node backtest-suite-v14FINAL.js [datafile.json]');
    process.exit(1);
  }

  const suite = new BacktestSuiteV14FINAL();
  await suite.runAllTests(dataFile);

  console.log('\n✅ BACKTEST SUITE COMPLETE!');
  console.log('\n💡 RECOMMENDATION: Use the configuration with the best weighted score');
  console.log('   for optimal balance between return, risk, and activity.\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = BacktestSuiteV14FINAL;