// Profitable Trading Strategies Backtest
// Based on quantitative research showing 74-89% win rates

const fs = require('fs');

// Load Polygon data - the ONLY data source we use
const dataFile = process.argv[2] || 'polygon-btc-1y.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('Testing with', data.length, 'candles');
console.log('Price range: $' + Math.min(...data.map(c => c.low)).toFixed(0) + ' - $' + Math.max(...data.map(c => c.high)).toFixed(0));

// === STRATEGY 1: RSI(2) Mean Reversion - 74% Win Rate ===
function calculateRSI(prices, period = 2) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Initial average
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i-1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Smooth the averages
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
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// === STRATEGY 2: MACD for trend confirmation ===
function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(prices.slice(-26), 12);
  const ema26 = calculateEMA(prices.slice(-26), 26);
  const macdLine = ema12 - ema26;
  
  // For simplicity, using current MACD as signal (would need history for proper signal)
  const signal = macdLine * 0.9; // Approximation
  const histogram = macdLine - signal;
  
  return { macd: macdLine, signal, histogram };
}

// === STRATEGY 3: Opening Range Breakout - 89% Win Rate ===
function getOpeningRange(candles, periods = 12) { // 12 * 5min = 60min range
  if (candles.length < periods) return null;
  
  const rangeCandles = candles.slice(0, periods);
  const high = Math.max(...rangeCandles.map(c => c.high));
  const low = Math.min(...rangeCandles.map(c => c.low));
  const range = high - low;
  
  return { high, low, range };
}

// === BACKTEST ENGINE ===
let balance = 10000;
let position = null;
let trades = [];
let wins = 0;
let losses = 0;

// Strategy parameters based on research
const RSI_OVERSOLD = 15;  // Not 30, research shows 15 is optimal
const RSI_OVERBOUGHT = 85; // Not 70, research shows 85 is optimal
const POSITION_SIZE = 0.1; // 10% per trade
const FRONT_LOAD = 1.01;  // 1% front-loading

// Track daily sessions for ORB
let currentDay = null;
let dailyRange = null;
let dailyCandles = [];

for (let i = 200; i < data.length; i++) {
  const currentCandle = data[i];
  const price = currentCandle.close;
  const timestamp = new Date(currentCandle.timestamp);
  const day = timestamp.toDateString();
  
  // Get price history for indicators
  const priceHistory = data.slice(Math.max(0, i - 200), i + 1).map(c => c.close);
  
  // Calculate indicators
  const rsi2 = calculateRSI(priceHistory.slice(-50), 2);
  const rsi14 = calculateRSI(priceHistory.slice(-50), 14);
  const macd = calculateMACD(priceHistory);
  
  // Calculate 200-day SMA for trend filter
  const sma200 = priceHistory.slice(-200).reduce((a, b) => a + b, 0) / Math.min(200, priceHistory.length);
  
  // Handle daily range for ORB strategy
  if (day !== currentDay) {
    currentDay = day;
    dailyCandles = [currentCandle];
    dailyRange = null;
  } else {
    dailyCandles.push(currentCandle);
    if (dailyCandles.length === 12 && !dailyRange) { // 60-minute range established
      dailyRange = getOpeningRange(dailyCandles, 12);
    }
  }
  
  // === ENTRY LOGIC ===
  if (!position) {
    // Strategy 1: RSI(2) Mean Reversion with trend filter
    // Research shows 74% win rate
    if (rsi2 < RSI_OVERSOLD && price > sma200) {
      const entryPrice = price * FRONT_LOAD;
      position = {
        entry: entryPrice,
        size: (balance * POSITION_SIZE) / entryPrice,
        strategy: 'RSI2',
        stopLoss: entryPrice * 0.98,  // 2% stop loss
        takeProfit: entryPrice * 1.02  // 2% take profit
      };
      trades.push({
        type: 'BUY',
        price: entryPrice,
        market: price,
        rsi2,
        strategy: 'RSI(2) Mean Reversion'
      });
      console.log(`Trade ${trades.length}: BUY at ${entryPrice.toFixed(2)} (RSI2=${rsi2.toFixed(1)}) - RSI(2) Mean Reversion`);
    }
    // Strategy 2: Opening Range Breakout
    // Research shows 89% win rate on 60-minute range
    else if (dailyRange && price > dailyRange.high * 1.001) {
      const entryPrice = price * FRONT_LOAD;
      position = {
        entry: entryPrice,
        size: (balance * POSITION_SIZE) / entryPrice,
        strategy: 'ORB',
        stopLoss: dailyRange.low,  // Stop at range low
        takeProfit: entryPrice + (dailyRange.range * 1.5)  // 1.5x range target
      };
      trades.push({
        type: 'BUY',
        price: entryPrice,
        market: price,
        strategy: 'Opening Range Breakout'
      });
      console.log(`Trade ${trades.length}: BUY at ${entryPrice.toFixed(2)} - Opening Range Breakout`);
    }
    // Strategy 3: RSI + MACD Combined
    // Research shows 73% win rate
    else if (rsi14 < 30 && macd.macd > macd.signal && macd.histogram > 0) {
      const entryPrice = price * FRONT_LOAD;
      position = {
        entry: entryPrice,
        size: (balance * POSITION_SIZE) / entryPrice,
        strategy: 'RSI_MACD',
        stopLoss: entryPrice * 0.97,  // 3% stop loss
        takeProfit: entryPrice * 1.03  // 3% take profit
      };
      trades.push({
        type: 'BUY',
        price: entryPrice,
        market: price,
        rsi14,
        strategy: 'RSI+MACD Combined'
      });
      console.log(`Trade ${trades.length}: BUY at ${entryPrice.toFixed(2)} (RSI14=${rsi14.toFixed(1)}) - RSI+MACD Combined`);
    }
  }
  
  // === EXIT LOGIC ===
  if (position) {
    const pnl = (price - position.entry) / position.entry;
    
    // Check stop loss or take profit
    if (price <= position.stopLoss || price >= position.takeProfit) {
      const profit = position.size * (price - position.entry);
      balance += profit;
      
      if (profit > 0) {
        wins++;
        console.log(`  ✓ SELL at ${price.toFixed(2)} PnL=+${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)}`);
      } else {
        losses++;
        console.log(`  ✗ SELL at ${price.toFixed(2)} PnL=${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)}`);
      }
      
      position = null;
    }
    // Alternative exit: RSI returns to neutral for mean reversion
    else if (position.strategy === 'RSI2' && rsi2 > 50) {
      const profit = position.size * (price - position.entry);
      balance += profit;
      
      if (profit > 0) {
        wins++;
        console.log(`  ✓ SELL at ${price.toFixed(2)} PnL=+${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)} (RSI normalized)`);
      } else {
        losses++;
        console.log(`  ✗ SELL at ${price.toFixed(2)} PnL=${(pnl*100).toFixed(2)}% Balance=$${balance.toFixed(2)}`);
      }
      
      position = null;
    }
  }
}

// Close any open position at end
if (position) {
  const finalPrice = data[data.length - 1].close;
  const profit = position.size * (finalPrice - position.entry);
  balance += profit;
  if (profit > 0) wins++;
  else losses++;
}

// === RESULTS ===
const totalTrades = wins + losses;
const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
const returnPct = ((balance - 10000) / 100);

console.log('\n=== RESULTS ===');
console.log('Final balance: $' + balance.toFixed(2));
console.log('Total trades:', totalTrades);
console.log('Wins:', wins);
console.log('Losses:', losses);
console.log('Win rate:', winRate.toFixed(1) + '%');
console.log('Return:', returnPct.toFixed(2) + '%');

// Strategy breakdown
const strategyStats = {};
trades.forEach(t => {
  if (!strategyStats[t.strategy]) {
    strategyStats[t.strategy] = { count: 0 };
  }
  strategyStats[t.strategy].count++;
});

console.log('\n=== STRATEGY BREAKDOWN ===');
Object.entries(strategyStats).forEach(([strategy, stats]) => {
  console.log(`${strategy}: ${stats.count} trades`);
});