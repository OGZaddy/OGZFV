// Minimal test of backtest functionality
const fs = require('fs');

// Import just the essential modules
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');
const OptimizedIndicators = require('./core/OptimizedIndicators');

console.log('Loading test data...');
const data = JSON.parse(fs.readFileSync('test-data.json', 'utf8'));

console.log('Initializing modules...');
const marketRegime = new MarketRegimeDetector();
const fibonacci = new FibonacciDetector();
const supportResistance = new SupportResistanceDetector();
const indicators = new OptimizedIndicators();

console.log('Running simplified backtest...');

let balance = 10000;
let trades = 0;
let position = null;

for (let i = 100; i < data.length; i++) {
  const priceData = data.slice(Math.max(0, i - 100), i);
  const currentPrice = data[i].close;
  
  // Calculate confidence
  let confidence = 0;
  
  // Market regime
  const regime = marketRegime.analyzeMarket(priceData);
  if (regime && regime.confidence > 0.5) {
    confidence += 0.2;
  }
  
  // RSI
  if (priceData.length > 30) {
    const rsi = indicators.calculateRSI(priceData);
    if (rsi < 30 || rsi > 70) {
      confidence += 0.15;
    }
  }
  
  // Fibonacci
  const fibLevels = fibonacci.update(priceData);
  if (fibLevels) {
    const nearest = fibonacci.getNearestLevel(currentPrice);
    if (nearest && nearest.distance < 0.5) {
      confidence += 0.1;
    }
  }
  
  // S/R levels
  const srLevels = supportResistance.update(priceData);
  if (srLevels && srLevels.length > 0) {
    const nearest = supportResistance.getNearestLevel(currentPrice);
    if (nearest && nearest.distance < 0.3) {
      confidence += 0.1;
    }
  }
  
  // Simple trading logic
  if (!position && confidence > 0.3) {
    // Open position
    position = {
      entry: currentPrice,
      size: balance * 0.1 / currentPrice,
      type: 'long'
    };
    trades++;
    console.log(`Trade ${trades}: BUY at ${currentPrice.toFixed(2)}, confidence=${confidence.toFixed(3)}`);
  } else if (position) {
    // Check exit
    const pnl = (currentPrice - position.entry) / position.entry;
    if (pnl > 0.02 || pnl < -0.01) {
      // Close position
      const profit = position.size * (currentPrice - position.entry);
      balance += profit;
      console.log(`  CLOSE at ${currentPrice.toFixed(2)}, PnL=${(pnl*100).toFixed(2)}%, Balance=${balance.toFixed(2)}`);
      position = null;
    }
  }
  
  // Progress
  if (i % 50 === 0) {
    console.log(`Progress: ${i}/${data.length}`);
  }
}

console.log('\n=== RESULTS ===');
console.log(`Final Balance: $${balance.toFixed(2)}`);
console.log(`Total Trades: ${trades}`);
console.log(`Return: ${((balance - 10000) / 10000 * 100).toFixed(2)}%`);