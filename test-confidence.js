
// Quick test to see what confidence is calculated
const bot = require('./run-trading-bot-v13-simplified.js');

// Mock market data
const testMarketData = {
  price: 50000,
  rsi: 30,  // Oversold
  macd: 0.5,
  trend: 'uptrend',
  volume: 100000
};

// Try to calculate confidence
try {
  const confidence = bot.calculateTradingConfidence ? 
    bot.calculateTradingConfidence(testMarketData) :
    bot.calculateRealConfidence ? 
      bot.calculateRealConfidence(testMarketData) : 
      'NO METHOD FOUND';
      
  console.log('Calculated confidence:', confidence);
  
  if (confidence === 0.65) {
    console.log('❌ STILL RETURNING HARDCODED 0.65!');
  } else if (typeof confidence === 'number') {
    console.log('✅ Returns dynamic value:', confidence);
  }
} catch (error) {
  console.log('Error testing confidence:', error.message);
}
