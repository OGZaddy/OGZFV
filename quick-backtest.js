// Quick backtest with real Polygon data
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('polygon-btc-1y.json', 'utf8'));
const testData = data.slice(-2000); // Last 2000 candles for more trades

console.log('Testing with', testData.length, 'candles');
console.log('Price range: $' + Math.min(...testData.map(c => c.low)).toFixed(0) + ' - $' + Math.max(...testData.map(c => c.high)).toFixed(0));

// Simple backtest
let balance = 10000;
let position = null;
let trades = 0;
let wins = 0;
let losses = 0;

for (let i = 100; i < testData.length; i++) {
  const price = testData[i].close;
  const priceData = testData.slice(i-100, i);
  
  // Simple RSI calculation
  const gains = [];
  const losses_arr = [];
  for (let j = 1; j < priceData.length; j++) {
    const change = priceData[j].close - priceData[j-1].close;
    if (change > 0) gains.push(change);
    else losses_arr.push(Math.abs(change));
  }
  const avgGain = gains.length > 0 ? gains.reduce((a,b) => a+b, 0) / 14 : 0;
  const avgLoss = losses_arr.length > 0 ? losses_arr.reduce((a,b) => a+b, 0) / 14 : 1;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Simple momentum strategy
  const momentum = (price - priceData[priceData.length - 10].close) / priceData[priceData.length - 10].close;
  
  if (!position && momentum > 0.005 && rsi < 60) { // Buy on upward momentum
    const entryPrice = price * 1.01; // Front-load 1%
    position = { entry: entryPrice, size: balance * 0.1 / entryPrice };
    trades++;
    console.log('Trade', trades + ': BUY at', entryPrice.toFixed(2), '(market=' + price.toFixed(2) + ', +1%) RSI=' + rsi.toFixed(1));
  } else if (position) {
    const pnl = (price - position.entry) / position.entry;
    if (pnl > 0.05 || pnl < -0.03) { // 5% TP / 3% SL to account for 1% entry cost
      const profit = position.size * (price - position.entry);
      balance += profit;
      console.log('  SELL at', price.toFixed(2), 'PnL=' + (pnl*100).toFixed(2) + '%', 'Balance=$' + balance.toFixed(2));
      
      if (pnl > 0) wins++;
      else losses++;
      
      position = null;
    }
  }
}

console.log('\n=== RESULTS ===');
console.log('Final balance: $' + balance.toFixed(2));
console.log('Total trades:', trades);
console.log('Wins:', wins);
console.log('Losses:', losses);
console.log('Win rate:', (wins / trades * 100).toFixed(1) + '%');
console.log('Return:', ((balance - 10000) / 100).toFixed(2) + '%');