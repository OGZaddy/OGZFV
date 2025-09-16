// 🚀 CRYPTO KILLER STRATEGIES - OPTIMIZED FOR 24/7 VOLATILITY
// Based on crypto-specific research with proper volatility adjustments

const fs = require('fs');

// Load Polygon data - REAL crypto data only
const dataFile = process.argv[2] || 'polygon-btc-1y.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('🔥 CRYPTO KILLER BACKTEST');
console.log('Testing with', data.length, 'candles');
console.log('Price range: $' + Math.min(...data.map(c => c.low)).toFixed(0) + ' - $' + Math.max(...data.map(c => c.high)).toFixed(0));

// === INDICATOR CALCULATIONS ===

// RSI(2) - The crypto mean reversion monster
function calculateRSI(prices, period = 2) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i-1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period || 0.001;
  
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i-1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// OBV - Whale detection
function calculateOBV(candles) {
  let obv = 0;
  const obvValues = [0];
  
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i-1].close) {
      obv += candles[i].volume;
    } else if (candles[i].close < candles[i-1].close) {
      obv -= candles[i].volume;
    }
    obvValues.push(obv);
  }
  
  return obvValues;
}

// Bollinger Bands for squeeze detection
function calculateBollingerBands(prices, period = 20, stdDev = 2.5) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0, bandwidth: 100 };
  
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDeviation = Math.sqrt(variance);
  
  const upper = sma + (stdDev * stdDeviation);
  const lower = sma - (stdDev * stdDeviation);
  const bandwidth = ((upper - lower) / sma) * 100;
  
  return { upper, middle: sma, lower, bandwidth };
}

// Z-Score for mean reversion
function calculateZScore(prices, period = 20) {
  if (prices.length < period) return 0;
  
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const currentPrice = prices[prices.length - 1];
  return stdDev === 0 ? 0 : (currentPrice - mean) / stdDev;
}

// ATR for volatility-adjusted stops
function calculateATR(candles, period = 14) {
  if (candles.length < period) return 0;
  
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i-1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// === BACKTEST ENGINE ===
let balance = 10000;
let position = null;
let trades = [];
let wins = 0;
let losses = 0;

// CRYPTO-SPECIFIC PARAMETERS (from research)
const RSI2_OVERSOLD = 10;   // NOT 30! Crypto needs extreme levels
const RSI2_OVERBOUGHT = 90; // NOT 70! Crypto can stay overbought
const POSITION_SIZE = 0.1;  // 10% per trade
const FRONT_LOAD = 1.01;    // 1% front-loading

// Track performance by strategy
const strategies = {
  'RSI2_MEAN_REVERSION': { wins: 0, losses: 0, pnl: 0 },
  'BOLLINGER_SQUEEZE': { wins: 0, losses: 0, pnl: 0 },
  'WHALE_OBV': { wins: 0, losses: 0, pnl: 0 },
  'TRIPLE_THREAT': { wins: 0, losses: 0, pnl: 0 }
};

// Opening range tracking for 24/7 markets
let hourlyRanges = {};
let currentHour = null;

for (let i = 200; i < data.length; i++) {
  const candle = data[i];
  const price = candle.close;
  const timestamp = new Date(candle.timestamp);
  const hour = timestamp.getUTCHours();
  
  // Track hourly ranges (crypto "opening range")
  if (hour !== currentHour) {
    currentHour = hour;
    hourlyRanges[hour] = { high: candle.high, low: candle.low, start: i };
  } else if (hourlyRanges[hour] && i - hourlyRanges[hour].start < 12) {
    hourlyRanges[hour].high = Math.max(hourlyRanges[hour].high, candle.high);
    hourlyRanges[hour].low = Math.min(hourlyRanges[hour].low, candle.low);
  }
  
  // Calculate all indicators
  const priceHistory = data.slice(Math.max(0, i - 200), i + 1).map(c => c.close);
  const candleHistory = data.slice(Math.max(0, i - 200), i + 1);
  
  const rsi2 = calculateRSI(priceHistory.slice(-50), 2);
  const rsi9 = calculateRSI(priceHistory.slice(-50), 9);
  const obvValues = calculateOBV(candleHistory.slice(-50));
  const bb = calculateBollingerBands(priceHistory, 20, 2.5); // 2.5 SD for crypto!
  const zScore = calculateZScore(priceHistory, 20);
  const atr = calculateATR(candleHistory.slice(-14), 14);
  const sma200 = priceHistory.slice(-200).reduce((a, b) => a + b, 0) / Math.min(200, priceHistory.length);
  
  // Volume analysis
  const avgVolume = candleHistory.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  const volumeRatio = candle.volume / avgVolume;
  
  // OBV divergence detection
  let obvDivergence = false;
  if (i > 250) {
    const recentLows = [];
    const recentOBVs = [];
    for (let j = i - 50; j < i; j++) {
      if (data[j].low < data[j-1].low && data[j].low < data[j+1].low) {
        recentLows.push({ price: data[j].low, index: j });
        recentOBVs.push(obvValues[j - (i - 50)]);
      }
    }
    if (recentLows.length >= 2) {
      const lastTwo = recentLows.slice(-2);
      const lastTwoOBV = recentOBVs.slice(-2);
      obvDivergence = lastTwo[1].price < lastTwo[0].price && lastTwoOBV[1] > lastTwoOBV[0];
    }
  }
  
  // === ENTRY LOGIC ===
  if (!position) {
    let entrySignal = null;
    
    // STRATEGY 1: RSI(2) Mean Reversion (74% win rate on crypto)
    if (rsi2 < RSI2_OVERSOLD && price > sma200 && zScore < -1.5) {
      entrySignal = 'RSI2_MEAN_REVERSION';
    }
    
    // STRATEGY 2: Bollinger Squeeze Breakout (65-70% success)
    else if (bb.bandwidth < 5 && price > bb.upper && volumeRatio > 2) {
      entrySignal = 'BOLLINGER_SQUEEZE';
    }
    
    // STRATEGY 3: Whale OBV Accumulation
    else if (obvDivergence && volumeRatio > 3 && rsi9 < 40) {
      entrySignal = 'WHALE_OBV';
    }
    
    // STRATEGY 4: Triple Threat (Multiple confirmations)
    else if (rsi2 < 15 && price < bb.lower && zScore < -2 && obvDivergence) {
      entrySignal = 'TRIPLE_THREAT';
    }
    
    if (entrySignal) {
      const entryPrice = price * FRONT_LOAD;
      
      // CRYPTO-ADJUSTED STOPS (wider for volatility)
      let stopLoss, takeProfit;
      
      switch(entrySignal) {
        case 'RSI2_MEAN_REVERSION':
          stopLoss = entryPrice * 0.93; // 7% stop for bullish mean reversion
          takeProfit = bb.middle; // Exit at middle band
          break;
        
        case 'BOLLINGER_SQUEEZE':
          stopLoss = entryPrice * 0.93; // 7% stop for breakouts
          takeProfit = entryPrice * 1.15; // 15% target for squeeze plays
          break;
        
        case 'WHALE_OBV':
          stopLoss = entryPrice * 0.93; // 7% stop minimum
          takeProfit = entryPrice * 1.15; // 15% target
          break;
        
        case 'TRIPLE_THREAT':
          stopLoss = entryPrice * 0.965; // 3.5% stop (bearish/conservative)
          takeProfit = entryPrice * 1.07; // 7% target
          break;
      }
      
      position = {
        entry: entryPrice,
        size: (balance * POSITION_SIZE) / entryPrice,
        strategy: entrySignal,
        stopLoss,
        takeProfit,
        entryRSI: rsi2,
        entryTime: timestamp
      };
      
      trades.push({
        type: 'BUY',
        price: entryPrice,
        strategy: entrySignal,
        rsi2,
        zScore,
        bandwidth: bb.bandwidth
      });
      
      console.log(`Trade ${trades.length}: BUY at ${entryPrice.toFixed(2)} [${entrySignal}] RSI2=${rsi2.toFixed(1)} Z=${zScore.toFixed(2)}`);
    }
  }
  
  // === EXIT LOGIC ===
  if (position) {
    let exitSignal = false;
    let exitPrice = price;
    
    // Check stop loss
    if (price <= position.stopLoss) {
      exitSignal = 'STOP_LOSS';
      exitPrice = position.stopLoss;
    }
    // Check take profit
    else if (price >= position.takeProfit) {
      exitSignal = 'TAKE_PROFIT';
      exitPrice = position.takeProfit;
    }
    // RSI2 mean reversion exit (RSI normalizes)
    else if (position.strategy === 'RSI2_MEAN_REVERSION' && rsi2 > 50) {
      exitSignal = 'RSI_NORMALIZED';
    }
    // Bollinger band walk complete
    else if (position.strategy === 'BOLLINGER_SQUEEZE' && price < bb.middle) {
      exitSignal = 'BB_WALK_COMPLETE';
    }
    
    if (exitSignal) {
      const pnl = (exitPrice - position.entry) / position.entry;
      const profit = position.size * (exitPrice - position.entry);
      balance += profit;
      
      // Track strategy performance
      const strategy = strategies[position.strategy];
      strategy.pnl += pnl * 100;
      
      if (profit > 0) {
        wins++;
        strategy.wins++;
        console.log(`  ✓ SELL at ${exitPrice.toFixed(2)} PnL=+${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)} [${exitSignal}]`);
      } else {
        losses++;
        strategy.losses++;
        console.log(`  ✗ SELL at ${exitPrice.toFixed(2)} PnL=${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)} [${exitSignal}]`);
      }
      
      position = null;
    }
  }
}

// Close any open position
if (position) {
  const finalPrice = data[data.length - 1].close;
  const profit = position.size * (finalPrice - position.entry);
  balance += profit;
  if (profit > 0) {
    wins++;
    strategies[position.strategy].wins++;
  } else {
    losses++;
    strategies[position.strategy].losses++;
  }
}

// === RESULTS ===
const totalTrades = wins + losses;
const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
const returnPct = ((balance - 10000) / 100);

console.log('\n' + '='.repeat(60));
console.log('💎 FINAL RESULTS');
console.log('='.repeat(60));
console.log('Final balance: $' + balance.toFixed(2));
console.log('Total return: ' + returnPct.toFixed(2) + '%');
console.log('Total trades: ' + totalTrades);
console.log('Winners: ' + wins + ' (' + winRate.toFixed(1) + '%)');
console.log('Losers: ' + losses);

console.log('\n📊 STRATEGY BREAKDOWN:');
console.log('-'.repeat(60));

Object.entries(strategies).forEach(([name, stats]) => {
  const total = stats.wins + stats.losses;
  if (total > 0) {
    const winRate = (stats.wins / total * 100).toFixed(1);
    const avgPnL = (stats.pnl / total).toFixed(2);
    console.log(`${name}:`);
    console.log(`  Trades: ${total} | Win Rate: ${winRate}% | Avg P&L: ${avgPnL}%`);
  }
});

console.log('\n🚀 READY FOR HOUSTON! 🚀');