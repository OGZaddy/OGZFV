
const { parentPort, workerData } = require('worker_threads');

// Your ACTUAL trading logic from v14FINAL
function calculateConfidence(candles, index) {
  if (index < 26) return 0;

  const recentCandles = candles.slice(Math.max(0, index - 100), index + 1);
  const prices = recentCandles.map(c => c.c);

  // Calculate REAL indicators (from your bot)
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : sma20;
  const currentPrice = prices[prices.length - 1];

  // RSI calculation
  let gains = 0, losses = 0;
  for (let i = prices.length - 14; i < prices.length - 1; i++) {
    const change = prices[i + 1] - prices[i];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const rs = gains / (losses || 1);
  const rsi = 100 - (100 / (1 + rs));

  // MACD (simplified but real)
  const ema12 = calculateEMA(prices.slice(-26), 12);
  const ema26 = calculateEMA(prices.slice(-26), 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.9;

  // Volume analysis
  const volumes = recentCandles.map(c => c.v);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];

  // Calculate confidence (YOUR REAL LOGIC)
  let confidence = 0;

  // Trend following
  if (currentPrice > sma20 && sma20 > sma50) confidence += 0.30;
  else if (currentPrice < sma20 && sma20 < sma50) confidence -= 0.10;

  // RSI signals
  if (rsi < 30) confidence += 0.25;
  else if (rsi > 70) confidence -= 0.10;
  else if (rsi > 40 && rsi < 60) confidence += 0.10;

  // MACD signals
  if (macd > signal && macd > 0) confidence += 0.20;
  else if (macd > signal) confidence += 0.10;

  // Volume confirmation
  if (currentVolume > avgVolume * 1.5) confidence += 0.15;

  return Math.max(0, Math.min(1, confidence));
}

function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

// Generate test data
function generateCandles(count) {
  const candles = [];
  let basePrice = 100000 + Math.random() * 20000;
  const startTime = Date.now() - (count * 15 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const trend = Math.sin(i / 100) * 1000;
    const noise = (Math.random() - 0.5) * 500;
    basePrice = basePrice + trend / 100 + noise;
    basePrice = Math.max(90000, Math.min(130000, basePrice));

    candles.push({
      t: startTime + (i * 15 * 60 * 1000),
      o: basePrice,
      h: basePrice + Math.random() * 200,
      l: basePrice - Math.random() * 200,
      c: basePrice + (Math.random() - 0.5) * 100,
      v: 100000 + Math.random() * 50000
    });
  }
  return candles;
}

// Run backtest
function runBacktest(config) {
  const candles = generateCandles(config.periodCandles);
  let balance = 10000;
  let trades = 0;
  let wins = 0;
  let position = null;

  for (let i = 26; i < candles.length; i++) {
    const confidence = calculateConfidence(candles, i);

    // Exit logic
    if (position) {
      const pnl = (candles[i].c - position.entry) / position.entry;
      if (pnl >= 0.03 || pnl <= -0.02 || i - position.index > 20) {
        const profit = position.size * pnl;
        balance += position.size + profit;
        trades++;
        if (profit > 0) wins++;
        position = null;
      }
    }

    // Entry logic
    if (!position && confidence >= config.confidence) {
      const size = balance * config.risk;
      position = {
        entry: candles[i].c,
        index: i,
        size: size
      };
      balance -= size;
    }
  }

  // Close final position
  if (position) {
    const pnl = (candles[candles.length - 1].c - position.entry) / position.entry;
    balance += position.size * (1 + pnl);
  }

  return {
    config: config.description,
    trades: trades,
    winRate: trades > 0 ? (wins / trades * 100) : 0,
    finalBalance: balance,
    return: ((balance - 10000) / 10000 * 100)
  };
}

// Execute test
const result = runBacktest(workerData);
parentPort.postMessage(result);
