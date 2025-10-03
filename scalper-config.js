// SCALPER PROFILE CONFIGURATION
module.exports = {
  symbol: 'BTC-USD',
  initialBalance: 10000,
  maxPositionSize: 0.25,      // 25% per trade (aggressive for scalping)
  minTradeConfidence: 0.25,   // Lower threshold for more trades
  patternConfidence: 0.2,     // Lower pattern threshold
  tier: 'ELITE',              // Elite for multi-position
  enableQuantumSizing: true,  // Enable quantum sizing

  // Scalper-specific settings
  stopLoss: 0.005,           // 0.5% tight stop loss
  takeProfit: 0.01,          // 1% take profit
  maxHoldTime: 3600000,      // 1 hour max hold time (milliseconds)
  trailingStop: 0.003,       // 0.3% trailing stop

  // Indicator adjustments for scalping
  rsiPeriod: 7,             // Faster RSI
  macdFast: 8,              // Faster MACD
  macdSlow: 17,
  macdSignal: 9
};