// TimeframeManager.js - Stub for backtester compatibility
class TimeframeManager {
  constructor() {
    this.timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
    this.currentTimeframe = '5m';
  }

  setTimeframe(tf) {
    if (this.timeframes.includes(tf)) {
      this.currentTimeframe = tf;
      return true;
    }
    return false;
  }

  getTimeframe() {
    return this.currentTimeframe;
  }

  aggregateCandles(candles, targetTimeframe) {
    // Simple stub - just return the candles
    return candles;
  }

  getTimeframeInMinutes(tf) {
    const map = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    return map[tf] || 5;
  }
}

module.exports = TimeframeManager;