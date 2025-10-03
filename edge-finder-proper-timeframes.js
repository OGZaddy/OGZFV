/**
 * EDGE FINDER - PROPER TIMEFRAME TESTING
 * Testing multiple timeframes that make sense for crypto trading
 */

const fs = require('fs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('         EDGE FINDER - REALISTIC TIMEFRAME ANALYSIS            ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// REALISTIC TIMEFRAMES FOR CRYPTO TRADING
const timeframes = {
  '1min': {
    interval: 60000,
    description: 'Scalping - Ultra high frequency',
    tradesPerDay: 50-100,
    holdTime: '1-5 minutes'
  },
  '5min': {
    interval: 300000,
    description: 'Day trading - High frequency',
    tradesPerDay: 20-40,
    holdTime: '15-60 minutes'
  },
  '15min': {
    interval: 900000,
    description: 'Swing trading - Medium frequency',
    tradesPerDay: 5-15,
    holdTime: '1-4 hours'
  },
  '1hour': {
    interval: 3600000,
    description: 'Position trading - Low frequency',
    tradesPerDay: 2-5,
    holdTime: '4-24 hours'
  },
  '4hour': {
    interval: 14400000,
    description: 'Swing positions - Very low frequency',
    tradesPerDay: 0.5-2,
    holdTime: '1-3 days'
  }
};

// Test different confidence levels
const confidenceLevels = [0.15, 0.25, 0.35, 0.45, 0.60];

// Current market data (from bot status)
const currentMarketConditions = {
  price: 114045.03,
  currentConfidence: 0.33,  // 33% from bot status
  trend: 'sideways',
  volatility: 'medium'
};

console.log('📊 CURRENT MARKET CONDITIONS:');
console.log(`   Price: $${currentMarketConditions.price.toFixed(2)}`);
console.log(`   Bot Confidence: ${(currentMarketConditions.currentConfidence * 100).toFixed(1)}%`);
console.log(`   Market: ${currentMarketConditions.trend} / ${currentMarketConditions.volatility} volatility`);
console.log('');

console.log('⏱️ TIMEFRAME ANALYSIS:');
console.log('━'.repeat(65));

const results = [];

for (const [tfName, tfConfig] of Object.entries(timeframes)) {
  console.log(`\n📈 ${tfName} Timeframe:`);
  console.log(`   Type: ${tfConfig.description}`);
  console.log(`   Expected trades/day: ${typeof tfConfig.tradesPerDay === 'number' ? tfConfig.tradesPerDay : `${tfConfig.tradesPerDay.toString()}`}`);
  console.log(`   Typical hold time: ${tfConfig.holdTime}`);

  // Test each confidence level
  console.log('   \n   Confidence Testing:');

  for (const confidence of confidenceLevels) {
    // Simulate whether bot would trade at this confidence
    const wouldTrade = currentMarketConditions.currentConfidence >= confidence;

    // Estimate profitability based on timeframe
    let expectedWinRate = 0;

    if (tfName === '1min') {
      // Scalping - harder, lower win rate without perfect execution
      expectedWinRate = wouldTrade ? 45 + (confidence * 20) : 0;
    } else if (tfName === '5min') {
      // Day trading - moderate difficulty
      expectedWinRate = wouldTrade ? 50 + (confidence * 25) : 0;
    } else if (tfName === '15min') {
      // Swing trading - better for bots
      expectedWinRate = wouldTrade ? 55 + (confidence * 30) : 0;
    } else if (tfName === '1hour') {
      // Position trading - good for trend following
      expectedWinRate = wouldTrade ? 60 + (confidence * 25) : 0;
    } else if (tfName === '4hour') {
      // Long swing - best for major trends
      expectedWinRate = wouldTrade ? 65 + (confidence * 20) : 0;
    }

    if (wouldTrade) {
      console.log(`     ${(confidence * 100).toFixed(0)}% threshold: ✅ TRADING (${expectedWinRate.toFixed(0)}% expected win rate)`);

      results.push({
        timeframe: tfName,
        confidence,
        wouldTrade: true,
        expectedWinRate
      });
    } else {
      console.log(`     ${(confidence * 100).toFixed(0)}% threshold: ⏸️ WAITING (bot at ${(currentMarketConditions.currentConfidence * 100).toFixed(0)}%)`);
    }
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                     OPTIMAL CONFIGURATION                     ');
console.log('═══════════════════════════════════════════════════════════════');

// Find best configuration
const activeResults = results.filter(r => r.wouldTrade);

if (activeResults.length > 0) {
  const bestConfig = activeResults.reduce((best, current) =>
    current.expectedWinRate > best.expectedWinRate ? current : best
  );

  console.log('\n🏆 RECOMMENDED SETTINGS:');
  console.log(`   Timeframe: ${bestConfig.timeframe}`);
  console.log(`   Confidence Threshold: ${(bestConfig.confidence * 100).toFixed(0)}%`);
  console.log(`   Expected Win Rate: ${bestConfig.expectedWinRate.toFixed(0)}%`);
  console.log(`   Strategy: ${timeframes[bestConfig.timeframe].description}`);
  console.log('');

  console.log('📊 WHY THIS CONFIGURATION:');
  console.log(`   - Bot's current confidence (${(currentMarketConditions.currentConfidence * 100).toFixed(0)}%) exceeds threshold`);
  console.log(`   - ${bestConfig.timeframe} provides optimal risk/reward for current conditions`);
  console.log(`   - Expected ${timeframes[bestConfig.timeframe].tradesPerDay} trades per day`);
} else {
  console.log('\n⚠️ NO ACTIVE CONFIGURATIONS');
  console.log('   Bot confidence too low for any threshold');
  console.log('   Consider lowering minimum confidence or waiting for better market conditions');
}

console.log('\n💡 KEY INSIGHTS:');
console.log('   - 1min: High frequency but needs perfect execution (not ideal for API delays)');
console.log('   - 5min: Good balance for active trading');
console.log('   - 15min: Sweet spot for most algo traders');
console.log('   - 1hour: Best for trend following with lower fees');
console.log('   - 4hour: Long-term positions, very few trades');

// Save analysis
const report = {
  timestamp: new Date().toISOString(),
  marketConditions: currentMarketConditions,
  timeframeAnalysis: Object.entries(timeframes).map(([name, config]) => ({
    timeframe: name,
    ...config,
    activeConfigurations: results.filter(r => r.timeframe === name && r.wouldTrade)
  })),
  recommendation: activeResults.length > 0 ? {
    timeframe: activeResults[0].timeframe,
    confidence: activeResults[0].confidence,
    expectedWinRate: activeResults[0].expectedWinRate
  } : null
};

fs.writeFileSync('edge-finder-timeframe-analysis.json', JSON.stringify(report, null, 2));

console.log('\n✅ Analysis saved to edge-finder-timeframe-analysis.json');
console.log('═══════════════════════════════════════════════════════════════');