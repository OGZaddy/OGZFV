
const fs = require('fs');
const path = require('path');

console.log('🎯 MANUAL TRADE TRIGGER ACTIVATED!');

// Simulate a high-confidence trade signal
const tradeSignal = {
  action: 'buy',
  confidence: 0.85,
  reasoning: 'Manual trigger - 70% bearish patterns detected, contrarian trade',
  price: 95308,
  timestamp: Date.now(),
  positionSize: 0.02,
  patterns: ['oversold_rsi', 'bearish_divergence', 'support_level'],
  manualTrigger: true
};

// Write trade signal
const signalPath = path.join(__dirname, 'manual-trade-signal.json');
fs.writeFileSync(signalPath, JSON.stringify(tradeSignal, null, 2));

console.log('🚀 MANUAL TRADE SIGNAL CREATED!');
console.log(`📊 Action: ${tradeSignal.action.toUpperCase()}`);
console.log(`💰 Confidence: ${tradeSignal.confidence * 100}%`);
console.log(`💵 Price: $${tradeSignal.price}`);
console.log(`📈 Position: ${tradeSignal.positionSize * 100}%`);
console.log('');
console.log('🎯 The bot should pick up this signal and execute!');
