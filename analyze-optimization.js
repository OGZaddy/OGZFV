/**
 * DEEP ANALYSIS - EXTRACTING EVERY OUNCE OF OPTIMIZATION
 * Mining the 420 test results for MAXIMUM PERFORMANCE
 */

const fs = require('fs');

console.log('🔥🔥🔥 COOKING WITH GAS - DEEP OPTIMIZATION ANALYSIS 🔥🔥🔥\n');

// Load the massive test results
const results = JSON.parse(fs.readFileSync('massive-backtest-results.json', 'utf8'));

console.log(`📊 Analyzing ${results.results.length} test configurations...\n`);

// Group by performance tiers
const elite = results.results.filter(r => r.return > 0.5);
const good = results.results.filter(r => r.return > 0 && r.return <= 0.5);
const bad = results.results.filter(r => r.return <= 0);

console.log('═══════════════════════════════════════════════════════════════');
console.log('                    PERFORMANCE TIER ANALYSIS                  ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`🏆 ELITE TIER (>0.5% return): ${elite.length} configs`);
console.log(`✅ PROFITABLE TIER (0-0.5%): ${good.length} configs`);
console.log(`❌ LOSING TIER (<0%): ${bad.length} configs\n`);

// Find the common patterns in winning configs
console.log('🔍 WINNING PATTERNS DISCOVERED:\n');

// Analyze confidence levels
const confidenceAnalysis = {};
results.results.forEach(r => {
  const conf = r.config.split('/')[2];
  if (!confidenceAnalysis[conf]) {
    confidenceAnalysis[conf] = { total: 0, profitable: 0, totalReturn: 0 };
  }
  confidenceAnalysis[conf].total++;
  if (r.return > 0) confidenceAnalysis[conf].profitable++;
  confidenceAnalysis[conf].totalReturn += r.return;
});

console.log('📈 CONFIDENCE LEVEL ANALYSIS:');
Object.keys(confidenceAnalysis).sort().forEach(conf => {
  const data = confidenceAnalysis[conf];
  const winRate = (data.profitable / data.total * 100).toFixed(1);
  const avgReturn = (data.totalReturn / data.total).toFixed(3);
  console.log(`   ${conf}: ${winRate}% profitable, avg return ${avgReturn}%`);
});

// Analyze timeframes
const timeframeAnalysis = {};
results.results.forEach(r => {
  const tf = r.config.split('/')[1];
  if (!timeframeAnalysis[tf]) {
    timeframeAnalysis[tf] = { total: 0, profitable: 0, totalReturn: 0, bestReturn: -999 };
  }
  timeframeAnalysis[tf].total++;
  if (r.return > 0) timeframeAnalysis[tf].profitable++;
  timeframeAnalysis[tf].totalReturn += r.return;
  if (r.return > timeframeAnalysis[tf].bestReturn) {
    timeframeAnalysis[tf].bestReturn = r.return;
  }
});

console.log('\n⏱️ TIMEFRAME ANALYSIS:');
Object.keys(timeframeAnalysis).forEach(tf => {
  const data = timeframeAnalysis[tf];
  const winRate = (data.profitable / data.total * 100).toFixed(1);
  const avgReturn = (data.totalReturn / data.total).toFixed(3);
  console.log(`   ${tf.padEnd(6)}: ${winRate}% win rate, best ${data.bestReturn.toFixed(2)}%, avg ${avgReturn}%`);
});

// Risk level analysis
const riskAnalysis = {};
results.results.forEach(r => {
  const risk = r.config.split('/')[3];
  if (!riskAnalysis[risk]) {
    riskAnalysis[risk] = { total: 0, profitable: 0, totalReturn: 0 };
  }
  riskAnalysis[risk].total++;
  if (r.return > 0) riskAnalysis[risk].profitable++;
  riskAnalysis[risk].totalReturn += r.return;
});

console.log('\n💰 RISK LEVEL ANALYSIS:');
Object.keys(riskAnalysis).sort().forEach(risk => {
  const data = riskAnalysis[risk];
  const winRate = (data.profitable / data.total * 100).toFixed(1);
  const avgReturn = (data.totalReturn / data.total).toFixed(3);
  console.log(`   ${risk}: ${winRate}% profitable, avg return ${avgReturn}%`);
});

// Find the absolute best combinations
console.log('\n🎯 OPTIMAL SWEET SPOTS:\n');

// Best for each time period
const periods = ['day', 'week', 'month', 'year'];
periods.forEach(period => {
  const periodResults = results.results.filter(r => r.config.startsWith(period + '/'));
  if (periodResults.length > 0) {
    const best = periodResults.sort((a, b) => b.return - a.return)[0];
    console.log(`   ${period.padEnd(5)}: ${best.config} = ${best.return.toFixed(2)}% (${best.trades} trades)`);
  }
});

// Statistical confidence
console.log('\n📊 STATISTICAL CONFIDENCE:\n');
const profitableCount = results.results.filter(r => r.return > 0).length;
const avgReturn = results.results.reduce((sum, r) => sum + r.return, 0) / results.results.length;
const stdDev = Math.sqrt(
  results.results.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / results.results.length
);

console.log(`   Success Rate: ${(profitableCount / results.results.length * 100).toFixed(1)}%`);
console.log(`   Average Return: ${avgReturn.toFixed(3)}%`);
console.log(`   Standard Deviation: ${stdDev.toFixed(3)}%`);
console.log(`   Sharpe Ratio (simplified): ${(avgReturn / stdDev).toFixed(2)}`);

// Generate the ULTIMATE config
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               🔥 ULTIMATE OPTIMIZED CONFIG 🔥               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Find the most consistent performer across all periods
const configScores = {};
results.results.forEach(r => {
  const baseConfig = r.config.split('/').slice(1).join('/'); // Remove period
  if (!configScores[baseConfig]) {
    configScores[baseConfig] = { total: 0, count: 0, wins: 0 };
  }
  configScores[baseConfig].total += r.return;
  configScores[baseConfig].count++;
  if (r.return > 0) configScores[baseConfig].wins++;
});

// Find most consistent config
let bestConfig = null;
let bestScore = -999;
Object.keys(configScores).forEach(config => {
  const data = configScores[config];
  const consistency = data.wins / data.count; // Win rate across periods
  const avgReturn = data.total / data.count;
  const score = consistency * 0.7 + (avgReturn / 100) * 0.3; // 70% weight on consistency

  if (score > bestScore) {
    bestScore = score;
    bestConfig = {
      config: config,
      consistency: consistency,
      avgReturn: avgReturn,
      appearances: data.count
    };
  }
});

if (bestConfig) {
  console.log('   MOST CONSISTENT CONFIGURATION:');
  console.log(`   Settings: ${bestConfig.config}`);
  console.log(`   Consistency: ${(bestConfig.consistency * 100).toFixed(1)}% profitable across timeframes`);
  console.log(`   Average Return: ${bestConfig.avgReturn.toFixed(3)}%`);
  console.log(`   Tested in: ${bestConfig.appearances} scenarios`);
}

// Save optimization report
const optimization = {
  timestamp: new Date().toISOString(),
  totalTests: results.results.length,
  profitableConfigs: profitableCount,
  bestOverall: results.results[0],
  ultimateConfig: bestConfig,
  statistics: {
    avgReturn: avgReturn,
    stdDev: stdDev,
    sharpeRatio: avgReturn / stdDev,
    successRate: profitableCount / results.results.length
  },
  insights: {
    bestTimeframe: Object.keys(timeframeAnalysis).sort((a, b) =>
      timeframeAnalysis[b].totalReturn - timeframeAnalysis[a].totalReturn
    )[0],
    bestConfidence: Object.keys(confidenceAnalysis).sort((a, b) =>
      confidenceAnalysis[b].totalReturn - confidenceAnalysis[a].totalReturn
    )[0],
    bestRisk: Object.keys(riskAnalysis).sort((a, b) =>
      riskAnalysis[b].totalReturn - riskAnalysis[a].totalReturn
    )[0]
  }
};

fs.writeFileSync('ultimate-optimization.json', JSON.stringify(optimization, null, 2));

console.log('\n💾 Optimization analysis saved to ultimate-optimization.json');
console.log('\n🚀 BOT OPTIMIZATION COMPLETE - READY TO DOMINATE');
console.log('═══════════════════════════════════════════════════════════════');