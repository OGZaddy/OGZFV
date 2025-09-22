// ========================================================================
// PROFILE OPTIMIZATION FRAMEWORK WITH TRAI INTEGRATION
// ========================================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ProfileOptimizer {
  constructor() {
    this.profiles = [];
    this.results = new Map();
    this.dataFiles = [];

    // Optimization parameters to test
    this.parameterRanges = {
      riskPerTrade: [1, 1.5, 2, 2.5, 3],
      stopLoss: [2, 3, 4, 5],
      takeProfit: [3, 4, 5, 6, 8],
      minConfidence: [50, 60, 70, 80],
      maxPositions: [1, 3, 5, 7, 10],
      entryFrontLoading: [0.5, 1, 1.5, 2]
    };
  }

  async loadDataFiles() {
    const dataDir = path.join(__dirname, 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);

      if (stats.size > 1000) { // Ensure file has data
        this.dataFiles.push(filePath);
        console.log(`✅ Loaded data file: ${file}`);
      }
    }

    console.log(`\n📊 Total data files loaded: ${this.dataFiles.length}`);
  }

  generateProfileVariations(baseProfile) {
    const variations = [];
    const keys = Object.keys(this.parameterRanges);

    // Generate all combinations
    const generateCombinations = (index = 0, current = {}) => {
      if (index === keys.length) {
        variations.push({ ...baseProfile, ...current });
        return;
      }

      const key = keys[index];
      for (const value of this.parameterRanges[key]) {
        current[key] = value;
        generateCombinations(index + 1, { ...current });
      }
    };

    // Generate limited set of combinations for testing
    for (const risk of this.parameterRanges.riskPerTrade) {
      for (const sl of this.parameterRanges.stopLoss) {
        for (const tp of this.parameterRanges.takeProfit) {
          if (tp > sl) { // Take profit should be greater than stop loss
            for (const conf of this.parameterRanges.minConfidence) {
              variations.push({
                ...baseProfile,
                riskPerTrade: risk,
                stopLoss: sl,
                takeProfit: tp,
                minConfidence: conf
              });
            }
          }
        }
      }
    }

    return variations;
  }

  async runBacktest(profile, dataFile, tier = 'elite') {
    return new Promise((resolve) => {
      const profileName = `temp_profile_${Date.now()}.json`;
      const profilePath = path.join(__dirname, 'profiles', profileName);

      // Save temporary profile
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));

      // Run backtest with TRAI
      const backtest = spawn('node', [
        'backtest-v13-with-trai.js',
        `--file=${dataFile}`,
        `--tier=${tier}`,
        `--profile=${profilePath}`
      ]);

      let output = '';
      let results = null;

      backtest.stdout.on('data', (data) => {
        output += data.toString();
      });

      backtest.stderr.on('data', (data) => {
        console.error(`Error in backtest: ${data}`);
      });

      backtest.on('close', (code) => {
        // Parse results from output
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('Final PnL:')) {
            const pnl = parseFloat(line.match(/[\d.-]+/)[0]);
            results = { pnl };
          }
          if (line.includes('Win Rate:')) {
            const winRate = parseFloat(line.match(/[\d.]+/)[0]);
            if (results) results.winRate = winRate;
          }
          if (line.includes('Total Trades:')) {
            const trades = parseInt(line.match(/\d+/)[0]);
            if (results) results.totalTrades = trades;
          }
          if (line.includes('Sharpe Ratio:')) {
            const sharpe = parseFloat(line.match(/[\d.-]+/)[0]);
            if (results) results.sharpe = sharpe;
          }
        }

        // Clean up temp profile
        fs.unlinkSync(profilePath);

        resolve(results || { pnl: 0, winRate: 0, totalTrades: 0 });
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        backtest.kill();
        fs.unlinkSync(profilePath);
        resolve({ pnl: 0, winRate: 0, totalTrades: 0, timeout: true });
      }, 60000);
    });
  }

  async optimizeProfile(baseProfilePath, tier = 'elite') {
    console.log('🚀 Starting Profile Optimization');
    console.log('═══════════════════════════════════════════════════════');

    // Load base profile
    const baseProfile = JSON.parse(fs.readFileSync(baseProfilePath));
    console.log(`\n📋 Base Profile: ${path.basename(baseProfilePath)}`);

    // Load data files
    await this.loadDataFiles();

    if (this.dataFiles.length === 0) {
      console.error('❌ No data files found! Please download historical data first.');
      return;
    }

    // Generate profile variations
    const variations = this.generateProfileVariations(baseProfile);
    console.log(`\n🧬 Generated ${variations.length} profile variations`);

    // Test each variation
    const results = [];
    let bestProfile = null;
    let bestScore = -Infinity;

    for (let i = 0; i < Math.min(variations.length, 20); i++) { // Limit to 20 for testing
      const profile = variations[i];
      console.log(`\n📊 Testing variation ${i + 1}/${Math.min(variations.length, 20)}...`);
      console.log(`   Risk: ${profile.riskPerTrade}%, SL: ${profile.stopLoss}%, TP: ${profile.takeProfit}%`);

      let totalPnL = 0;
      let totalWinRate = 0;
      let totalSharpe = 0;
      let validTests = 0;

      // Test on each data file
      for (const dataFile of this.dataFiles.slice(0, 2)) { // Test on first 2 files
        const result = await this.runBacktest(profile, dataFile, tier);

        if (!result.timeout && result.totalTrades > 0) {
          totalPnL += result.pnl || 0;
          totalWinRate += result.winRate || 0;
          totalSharpe += result.sharpe || 0;
          validTests++;
        }
      }

      if (validTests > 0) {
        const avgPnL = totalPnL / validTests;
        const avgWinRate = totalWinRate / validTests;
        const avgSharpe = totalSharpe / validTests;

        // Calculate composite score
        const score = (avgPnL * 0.4) + (avgWinRate * 0.3) + (avgSharpe * 0.3);

        results.push({
          profile,
          avgPnL,
          avgWinRate,
          avgSharpe,
          score
        });

        if (score > bestScore) {
          bestScore = score;
          bestProfile = profile;
        }

        console.log(`   📈 Avg PnL: ${avgPnL.toFixed(2)}%, Win Rate: ${avgWinRate.toFixed(1)}%, Score: ${score.toFixed(2)}`);
      }
    }

    // Sort results by score
    results.sort((a, b) => b.score - a.score);

    // Save optimization results
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsPath = path.join(__dirname, `optimization-results-${timestamp}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify({
      baseProfile: path.basename(baseProfilePath),
      tier,
      timestamp,
      topResults: results.slice(0, 10),
      bestProfile
    }, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ OPTIMIZATION COMPLETE!');
    console.log(`\n🏆 Best Profile Found:`);
    console.log(`   Risk: ${bestProfile.riskPerTrade}%`);
    console.log(`   Stop Loss: ${bestProfile.stopLoss}%`);
    console.log(`   Take Profit: ${bestProfile.takeProfit}%`);
    console.log(`   Min Confidence: ${bestProfile.minConfidence}%`);
    console.log(`   Score: ${bestScore.toFixed(2)}`);
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    // Save optimized profile
    const optimizedPath = path.join(__dirname, 'profiles', `optimized-${tier}-${Date.now()}.json`);
    fs.writeFileSync(optimizedPath, JSON.stringify(bestProfile, null, 2));
    console.log(`💎 Optimized profile saved to: ${optimizedPath}`);

    return bestProfile;
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node optimize-profiles.js <profile-path> [tier]');
    console.log('Example: node optimize-profiles.js profiles/elite-btc.json elite');
    process.exit(1);
  }

  const profilePath = args[0];
  const tier = args[1] || 'elite';

  if (!fs.existsSync(profilePath)) {
    console.error(`❌ Profile not found: ${profilePath}`);
    process.exit(1);
  }

  const optimizer = new ProfileOptimizer();
  optimizer.optimizeProfile(profilePath, tier).catch(console.error);
}

module.exports = ProfileOptimizer;