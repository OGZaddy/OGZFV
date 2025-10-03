/**
 * EDGE FINDER TEST SUITE
 * Testing multiple confidence levels and timeframes
 * to find the most profitable trading configuration
 * USING REAL KRAKEN DATA - NO FAKE GENERATION
 */

const fs = require('fs');
const axios = require('axios');

// Load actual historical data from Kraken API
async function loadKrakenHistoricalData() {
  console.log('📊 Loading REAL Kraken BTC/USD historical data...');

  try {
    // Fetch real data from Kraken - 1 month of minute data
    const since = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 days ago
    const url = `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1&since=${since}`;

    console.log('🌐 Fetching from Kraken API...');
    const response = await axios.get(url);

    if (response.data && response.data.result && response.data.result.XXBTZUSD) {
      const rawData = response.data.result.XXBTZUSD;
      console.log(`✅ Loaded ${rawData.length} real BTC candles from Kraken`);

      // Convert to our format
      const data = rawData.map(candle => ({
        t: candle[0] * 1000, // timestamp
        o: parseFloat(candle[1]), // open
        h: parseFloat(candle[2]), // high
        l: parseFloat(candle[3]), // low
        c: parseFloat(candle[4]), // close
        v: parseFloat(candle[6])  // volume
      }));

      return data;
    } else {
      throw new Error('Invalid response from Kraken');
    }
  } catch (error) {
    console.log('⚠️ Kraken API error, loading from saved data file...');

    // Try to load from saved data file
    try {
      const savedData = JSON.parse(fs.readFileSync('kraken-historical-btc.json', 'utf8'));
      console.log(`✅ Loaded ${savedData.length} candles from saved file`);
      return savedData;
    } catch (fileError) {
      console.error('❌ No saved data available. Please ensure bot has run and collected data.');
      console.log('🔄 Attempting to use data from running bot...');

      // Last resort - read from bot's data store
      const botDataPath = '/home/trey/OGZFV-valhalla/market-data-cache.json';
      if (fs.existsSync(botDataPath)) {
        const botData = JSON.parse(fs.readFileSync(botDataPath, 'utf8'));
        console.log(`✅ Loaded ${botData.length} candles from bot cache`);
        return botData;
      }

      throw new Error('No historical data available');
    }
  }
}

// Run the async loading
let historicalData = [];
(async () => {
  historicalData = await loadKrakenHistoricalData();
  if (historicalData.length === 0) {
    console.error('❌ FATAL: No data to test with. Bot must collect real data first.');
    process.exit(1);
  }
  runTests();
})();

function runTests() {

// Simplified trading simulator
class TradingSimulator {
  constructor(config) {
    this.config = config;
    this.balance = 10000;
    this.startBalance = 10000;
    this.positions = [];
    this.trades = [];
    this.wins = 0;
    this.losses = 0;
  }

  calculateConfidence(data, index) {
    if (index < 26) return 0; // Need enough data for indicators

    const recentData = data.slice(Math.max(0, index - 100), index);

    // Simple trend detection
    const sma20 = this.calculateSMA(recentData.slice(-20));
    const sma50 = this.calculateSMA(recentData.slice(-50));
    const currentPrice = recentData[recentData.length - 1].c;

    // RSI calculation
    const rsi = this.calculateRSI(recentData.slice(-14));

    // MACD calculation
    const ema12 = this.calculateEMA(recentData.slice(-12), 12);
    const ema26 = this.calculateEMA(recentData.slice(-26), 26);
    const macd = ema12 - ema26;

    // Volume analysis
    const avgVolume = recentData.reduce((sum, d) => sum + d.v, 0) / recentData.length;
    const currentVolume = recentData[recentData.length - 1].v;
    const volumeRatio = currentVolume / avgVolume;

    // Calculate confidence score BASED ON REAL MARKET CONDITIONS
    let confidence = 0;

    // Trend alignment
    if (currentPrice > sma20 && sma20 > sma50) confidence += 0.15; // Uptrend
    else if (currentPrice < sma20 && sma20 < sma50) confidence -= 0.15; // Downtrend

    // RSI signals
    if (rsi < 30) confidence += 0.20; // Oversold
    else if (rsi > 70) confidence -= 0.10; // Overbought
    else if (rsi > 40 && rsi < 60) confidence += 0.10; // Neutral zone

    // MACD signals
    if (macd > 0) confidence += 0.15;
    else confidence -= 0.05;

    // Volume confirmation
    if (volumeRatio > 1.5) confidence += 0.10; // High volume
    else if (volumeRatio < 0.5) confidence -= 0.05; // Low volume

    // Volatility adjustment
    const volatility = this.calculateVolatility(recentData.slice(-20));
    if (volatility < 0.02) confidence += 0.10; // Low volatility
    else if (volatility > 0.05) confidence -= 0.10; // High volatility

    // NO RANDOM BULLSHIT - ONLY REAL CALCULATIONS

    return Math.max(0, Math.min(1, confidence));
  }

  calculateSMA(data) {
    return data.reduce((sum, d) => sum + d.c, 0) / data.length;
  }

  calculateEMA(data, period) {
    if (data.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = data[0].c;
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].c * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  calculateRSI(data) {
    if (data.length < 2) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i < data.length; i++) {
      const change = data[i].c - data[i - 1].c;
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / (data.length - 1);
    const avgLoss = losses / (data.length - 1);
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateVolatility(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].c - data[i - 1].c) / data[i - 1].c);
    }
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  executeTrade(price, confidence, timestamp) {
    const positionSize = Math.min(0.1 * this.balance, 1000); // 10% or $1000 max
    const stopLoss = price * 0.98; // 2% stop loss
    const takeProfit = price * 1.03; // 3% take profit

    this.positions.push({
      entryPrice: price,
      size: positionSize,
      confidence: confidence,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      timestamp: timestamp
    });

    this.balance -= positionSize;
  }

  checkPositions(currentPrice, timestamp) {
    const closedPositions = [];

    for (let i = this.positions.length - 1; i >= 0; i--) {
      const position = this.positions[i];
      const holdTime = timestamp - position.timestamp;

      // Check exit conditions
      if (currentPrice <= position.stopLoss ||
          currentPrice >= position.takeProfit ||
          holdTime > 3600000) { // 1 hour max hold

        const pnl = (currentPrice - position.entryPrice) / position.entryPrice * position.size;
        this.balance += position.size + pnl;

        if (pnl > 0) this.wins++;
        else this.losses++;

        this.trades.push({
          entry: position.entryPrice,
          exit: currentPrice,
          pnl: pnl,
          confidence: position.confidence,
          holdTime: holdTime
        });

        this.positions.splice(i, 1);
      }
    }
  }

  runBacktest(data, confidenceThreshold, timeframe) {
    const step = timeframe; // How many minutes between checks

    for (let i = 26; i < data.length; i += step) {
      const currentPrice = data[i].c;
      const confidence = this.calculateConfidence(data, i);

      // Check and close positions
      this.checkPositions(currentPrice, data[i].t);

      // Open new position if confident enough
      if (confidence >= confidenceThreshold && this.positions.length < 3) {
        this.executeTrade(currentPrice, confidence, data[i].t);
      }
    }

    // Close all remaining positions
    if (data.length > 0) {
      const lastPrice = data[data.length - 1].c;
      while (this.positions.length > 0) {
        this.checkPositions(lastPrice, data[data.length - 1].t);
      }
    }

    return this.getResults();
  }

  getResults() {
    const totalTrades = this.wins + this.losses;
    const winRate = totalTrades > 0 ? this.wins / totalTrades : 0;
    const totalPnL = this.balance - this.startBalance;
    const returnPct = (totalPnL / this.startBalance) * 100;

    const avgWin = this.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / Math.max(1, this.wins);
    const avgLoss = Math.abs(this.trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) / Math.max(1, this.losses));
    const profitFactor = this.wins > 0 && this.losses > 0 ? (avgWin * this.wins) / (avgLoss * this.losses) : 0;

    return {
      totalTrades,
      wins: this.wins,
      losses: this.losses,
      winRate,
      totalPnL,
      returnPct,
      avgWin,
      avgLoss,
      profitFactor,
      finalBalance: this.balance
    };
  }
}

  // TEST CONFIGURATIONS
  const confidenceLevels = [0.15, 0.40, 0.75]; // 15%, 40%, 75%
  const timeframes = [1, 5, 15]; // 1min, 5min, 15min candles
  const dataLengths = [1000, 5000]; // Short and long test periods

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('            EDGE FINDER TEST SUITE - REAL KRAKEN DATA          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = [];

  // Run all test combinations with REAL DATA
for (const confidence of confidenceLevels) {
  for (const timeframe of timeframes) {
    for (const dataLength of dataLengths) {
      const testData = historicalData.slice(0, dataLength);
      const simulator = new TradingSimulator({
        minConfidence: confidence,
        timeframe: timeframe
      });

      console.log(`\n🧪 Testing: Confidence=${(confidence * 100).toFixed(0)}%, Timeframe=${timeframe}min, Data=${dataLength} points`);
      console.log('─'.repeat(65));

      const result = simulator.runBacktest(testData, confidence, timeframe);

      // Display results
      console.log(`📊 Trades: ${result.totalTrades} (${result.wins}W/${result.losses}L)`);
      console.log(`📈 Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
      console.log(`💰 Total P&L: $${result.totalPnL.toFixed(2)} (${result.returnPct.toFixed(1)}%)`);
      console.log(`📊 Profit Factor: ${result.profitFactor.toFixed(2)}`);
      console.log(`💼 Final Balance: $${result.finalBalance.toFixed(2)}`);

      results.push({
        confidence,
        timeframe,
        dataLength,
        ...result
      });
    }
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                      EDGE ANALYSIS SUMMARY                    ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Find best performing configuration
const bestByReturn = results.reduce((best, current) =>
  current.returnPct > best.returnPct ? current : best
);

const bestByWinRate = results.reduce((best, current) =>
  current.winRate > best.winRate ? current : best
);

const bestByProfitFactor = results.reduce((best, current) =>
  current.profitFactor > best.profitFactor ? current : best
);

console.log('🏆 BEST CONFIGURATIONS:');
console.log('');

console.log('💰 Highest Return:');
console.log(`   Config: ${(bestByReturn.confidence * 100)}% confidence, ${bestByReturn.timeframe}min timeframe`);
console.log(`   Return: ${bestByReturn.returnPct.toFixed(2)}%`);
console.log(`   Trades: ${bestByReturn.totalTrades}`);
console.log('');

console.log('🎯 Best Win Rate:');
console.log(`   Config: ${(bestByWinRate.confidence * 100)}% confidence, ${bestByWinRate.timeframe}min timeframe`);
console.log(`   Win Rate: ${(bestByWinRate.winRate * 100).toFixed(1)}%`);
console.log(`   Trades: ${bestByWinRate.totalTrades}`);
console.log('');

console.log('📊 Best Profit Factor:');
console.log(`   Config: ${(bestByProfitFactor.confidence * 100)}% confidence, ${bestByProfitFactor.timeframe}min timeframe`);
console.log(`   Profit Factor: ${bestByProfitFactor.profitFactor.toFixed(2)}`);
console.log(`   Trades: ${bestByProfitFactor.totalTrades}`);

// Create detailed report
const report = {
  timestamp: new Date().toISOString(),
  testConfigurations: {
    confidenceLevels,
    timeframes,
    dataLengths
  },
  results: results.map(r => ({
    config: `${(r.confidence * 100)}% / ${r.timeframe}min / ${r.dataLength} points`,
    metrics: {
      trades: r.totalTrades,
      winRate: `${(r.winRate * 100).toFixed(1)}%`,
      return: `${r.returnPct.toFixed(2)}%`,
      profitFactor: r.profitFactor.toFixed(2),
      finalBalance: r.finalBalance.toFixed(2)
    }
  })),
  winners: {
    highestReturn: `${(bestByReturn.confidence * 100)}% / ${bestByReturn.timeframe}min`,
    bestWinRate: `${(bestByWinRate.confidence * 100)}% / ${bestByWinRate.timeframe}min`,
    bestProfitFactor: `${(bestByProfitFactor.confidence * 100)}% / ${bestByProfitFactor.timeframe}min`
  }
};

fs.writeFileSync('edge-finder-results.json', JSON.stringify(report, null, 2));

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                         RECOMMENDATIONS                       ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Analyze patterns in results
const lowConfResults = results.filter(r => r.confidence === 0.15);
const midConfResults = results.filter(r => r.confidence === 0.40);
const highConfResults = results.filter(r => r.confidence === 0.75);

const avgLowReturn = lowConfResults.reduce((sum, r) => sum + r.returnPct, 0) / lowConfResults.length;
const avgMidReturn = midConfResults.reduce((sum, r) => sum + r.returnPct, 0) / midConfResults.length;
const avgHighReturn = highConfResults.reduce((sum, r) => sum + r.returnPct, 0) / highConfResults.length;

console.log('📊 Confidence Level Analysis:');
console.log(`   15% Confidence: ${avgLowReturn.toFixed(2)}% avg return (high frequency)`);
console.log(`   40% Confidence: ${avgMidReturn.toFixed(2)}% avg return (balanced)`);
console.log(`   75% Confidence: ${avgHighReturn.toFixed(2)}% avg return (selective)`);
console.log('');

const tf1Results = results.filter(r => r.timeframe === 1);
const tf5Results = results.filter(r => r.timeframe === 5);
const tf15Results = results.filter(r => r.timeframe === 15);

const avgTf1Return = tf1Results.reduce((sum, r) => sum + r.returnPct, 0) / tf1Results.length;
const avgTf5Return = tf5Results.reduce((sum, r) => sum + r.returnPct, 0) / tf5Results.length;
const avgTf15Return = tf15Results.reduce((sum, r) => sum + r.returnPct, 0) / tf15Results.length;

console.log('⏱️ Timeframe Analysis:');
console.log(`   1-min: ${avgTf1Return.toFixed(2)}% avg return (scalping)`);
console.log(`   5-min: ${avgTf5Return.toFixed(2)}% avg return (day trading)`);
console.log(`   15-min: ${avgTf15Return.toFixed(2)}% avg return (swing trading)`);

console.log('\n📄 Full report saved to: edge-finder-results.json');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
} // End of runTests function