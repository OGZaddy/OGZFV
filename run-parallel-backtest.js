#!/usr/bin/env node

/**
 * PARALLEL BACKTEST RUNNER - Test all 3 tiers simultaneously
 * Uses all 16 CPU cores to run backtests in parallel
 */

const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the production backtester
const V13ProductionBacktest = require('./backtest-v13-production');

console.log('\n🚀 PARALLEL BACKTEST RUNNER');
console.log('═══════════════════════════════════════════════════════════');
console.log(`💻 CPU Cores Available: ${os.cpus().length}`);
console.log('📊 Testing all 3 tiers: STARTER, PRO, ELITE');
console.log('═══════════════════════════════════════════════════════════\n');

// Load historical data
async function loadHistoricalData() {
  console.log('📁 Loading historical BTC data...');
  
  try {
    // Try to load the 1 year BTC data
    const dataPath = path.join(__dirname, 'polygon-btc-1y.json');
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(rawData);
      console.log(`✅ Loaded ${data.length} data points from polygon-btc-1y.json`);
      return data;
    }
  } catch (error) {
    console.log('⚠️ Could not load polygon-btc-1y.json:', error.message);
  }
  
  // NO FAKE DATA - EXIT IF NO REAL DATA
  console.error('❌ CRITICAL: No real data found! This bot ONLY uses REAL market data.');
  process.exit(1);
}

// REMOVED: generateSyntheticData - NO FAKE DATA ALLOWED

// Run backtest for a specific tier
async function runTierBacktest(tier, historicalData) {
  const startTime = Date.now();
  console.log(`\n🔄 Starting ${tier.toUpperCase()} tier backtest...`);
  
  try {
    // Create backtester instance
    const backtester = new V13ProductionBacktest({ tier });
    
    // Run the backtest
    const results = await backtester.runBacktest(historicalData);
    
    // Calculate execution time
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${tier.toUpperCase()} tier complete in ${executionTime}s`);
    
    // Save results
    const filename = `backtest-results-${tier}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`📁 ${tier.toUpperCase()} results saved to ${filename}`);
    
    return results;
  } catch (error) {
    console.error(`❌ ${tier.toUpperCase()} tier failed:`, error.message);
    return null;
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  // Load historical data once
  const historicalData = await loadHistoricalData();
  
  // Define tiers to test
  const tiers = ['starter', 'pro', 'elite'];
  
  // Run all backtests in parallel
  console.log('\n🚀 Running all tiers in parallel...\n');
  const promises = tiers.map(tier => runTierBacktest(tier, historicalData));
  const results = await Promise.all(promises);
  
  // Process results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 BACKTEST COMPARISON:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const comparison = {};
  tiers.forEach((tier, index) => {
    if (results[index] && results[index].summary) {
      const summary = results[index].summary;
      comparison[tier] = {
        finalBalance: summary.finalBalance,
        totalReturn: summary.totalReturn,
        winRate: summary.winRate,
        totalTrades: summary.totalTrades,
        maxDrawdown: summary.maxDrawdown,
        profitFactor: summary.profitFactor
      };
      
      console.log(`\n${tier.toUpperCase()} TIER:`);
      console.log(`  💰 Final Balance: $${summary.finalBalance.toFixed(2)}`);
      console.log(`  📈 Total Return: ${summary.totalReturn.toFixed(2)}%`);
      console.log(`  🎯 Win Rate: ${summary.winRate.toFixed(1)}%`);
      console.log(`  📊 Total Trades: ${summary.totalTrades}`);
      console.log(`  📉 Max Drawdown: ${summary.maxDrawdown.toFixed(2)}%`);
      console.log(`  ⚖️ Profit Factor: ${summary.profitFactor.toFixed(2)}`);
    }
  });
  
  // Find the best performing tier
  const bestTier = Object.keys(comparison).reduce((best, tier) => {
    if (!best || comparison[tier].totalReturn > comparison[best].totalReturn) {
      return tier;
    }
    return best;
  }, null);
  
  if (bestTier) {
    console.log(`\n🏆 BEST PERFORMER: ${bestTier.toUpperCase()} tier with ${comparison[bestTier].totalReturn.toFixed(2)}% return`);
  }
  
  // Save comparison
  const comparisonFile = `backtest-comparison-${Date.now()}.json`;
  fs.writeFileSync(comparisonFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    dataPoints: historicalData.length,
    results: comparison,
    bestPerformer: bestTier
  }, null, 2));
  console.log(`\n📁 Comparison saved to ${comparisonFile}`);
  
  // Calculate total execution time
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️ Total execution time: ${totalTime}s`);
  console.log('✅ All backtests complete!\n');
}

// Run the parallel backtest
main().catch(console.error);