// 🎯 DYNAMIC STOP LOSS FRAMEWORK
// Stops adjust based on market conditions, not fixed percentages

class DynamicStopSystem {
  constructor() {
    // These will be populated with your thresholds after restart
    this.thresholds = {
      // MARKET REGIMES
      bullMarket: {
        supportBounce: { stop: 0.035, target: 0.15 },  // Placeholder
        breakout: { stop: 0.07, target: 0.25 },        // Placeholder
        volatile: { stop: 0.10, target: 0.30 },        // Placeholder
        nonVolatile: { stop: 0.05, target: 0.12 }      // Placeholder
      },
      bearMarket: {
        resistanceBounce: { stop: 0.035, target: 0.08 }, // Placeholder
        breakdown: { stop: 0.05, target: 0.15 },         // Placeholder
        volatile: { stop: 0.07, target: 0.20 },          // Placeholder
        nonVolatile: { stop: 0.035, target: 0.10 }       // Placeholder
      },
      accumulation: {
        supportTest: { stop: 0.04, target: 0.10 },       // Placeholder
        rangePlay: { stop: 0.03, target: 0.06 },         // Placeholder
        volatile: { stop: 0.06, target: 0.15 },          // Placeholder
        nonVolatile: { stop: 0.025, target: 0.05 }       // Placeholder
      }
    };
  }

  // Detect current market regime
  detectMarketRegime(price, sma50, sma200, btcDominance) {
    // Bull Market: Price > SMA50 > SMA200
    if (price > sma50 && sma50 > sma200) {
      return 'bullMarket';
    }
    // Bear Market: Price < SMA50 < SMA200
    else if (price < sma50 && sma50 < sma200) {
      return 'bearMarket';
    }
    // Accumulation: Mixed signals
    else {
      return 'accumulation';
    }
  }

  // Detect if we're at support or resistance
  detectSupportResistance(price, levels) {
    const threshold = 0.01; // Within 1% of level
    
    for (let level of levels.support) {
      if (Math.abs(price - level) / price < threshold) {
        return 'support';
      }
    }
    
    for (let level of levels.resistance) {
      if (Math.abs(price - level) / price < threshold) {
        return 'resistance';
      }
    }
    
    return 'none';
  }

  // Detect volatility environment
  detectVolatility(atr, price, historicalATR) {
    const atrPercent = atr / price;
    const avgATRPercent = historicalATR.reduce((a, b) => a + b, 0) / historicalATR.length / price;
    
    if (atrPercent > avgATRPercent * 1.5) {
      return 'volatile';
    } else if (atrPercent < avgATRPercent * 0.7) {
      return 'nonVolatile';
    } else {
      return 'normal';
    }
  }

  // Detect trade type (breakout vs bounce)
  detectTradeType(entry, levels, momentum) {
    const srLevel = this.detectSupportResistance(entry, levels);
    
    if (srLevel === 'support' && momentum < 0) {
      return 'supportBounce';
    } else if (srLevel === 'resistance' && momentum > 0) {
      return 'resistanceBounce';
    } else if (entry > levels.resistance[0] && momentum > 0.05) {
      return 'breakout';
    } else if (entry < levels.support[0] && momentum < -0.05) {
      return 'breakdown';
    } else {
      return 'rangePlay';
    }
  }

  // Get dynamic stops based on all conditions
  getDynamicStops(params) {
    const {
      price,
      sma50,
      sma200,
      atr,
      historicalATR,
      supportLevels,
      resistanceLevels,
      momentum,
      btcDominance
    } = params;

    // Detect all market conditions
    const regime = this.detectMarketRegime(price, sma50, sma200, btcDominance);
    const volatility = this.detectVolatility(atr, price, historicalATR);
    const tradeType = this.detectTradeType(price, {
      support: supportLevels,
      resistance: resistanceLevels
    }, momentum);

    // Get base thresholds
    let stopPercent, targetPercent;
    
    // Special handling for different scenarios
    if (tradeType === 'supportBounce' || tradeType === 'resistanceBounce') {
      // Tighter stops at S/R levels
      stopPercent = this.thresholds[regime][tradeType]?.stop || 0.035;
      targetPercent = this.thresholds[regime][tradeType]?.target || 0.10;
    } else if (tradeType === 'breakout' || tradeType === 'breakdown') {
      // Wider stops for momentum trades
      stopPercent = this.thresholds[regime][tradeType]?.stop || 0.07;
      targetPercent = this.thresholds[regime][tradeType]?.target || 0.20;
    } else {
      // Use volatility-based stops for range trades
      if (volatility === 'volatile') {
        stopPercent = this.thresholds[regime].volatile.stop;
        targetPercent = this.thresholds[regime].volatile.target;
      } else if (volatility === 'nonVolatile') {
        stopPercent = this.thresholds[regime].nonVolatile.stop;
        targetPercent = this.thresholds[regime].nonVolatile.target;
      } else {
        // Default middle ground
        stopPercent = 0.05;
        targetPercent = 0.12;
      }
    }

    // Additional adjustments based on specific conditions
    if (regime === 'bullMarket' && volatility === 'nonVolatile') {
      // In calm bull markets, can use tighter stops
      stopPercent *= 0.8;
    } else if (regime === 'bearMarket' && volatility === 'volatile') {
      // In volatile bear markets, need wider stops
      stopPercent *= 1.3;
    }

    // Never go below minimum stops
    const MIN_STOP_BEAR = 0.035;
    const MIN_STOP_BULL = 0.07;
    
    if (regime === 'bullMarket') {
      stopPercent = Math.max(stopPercent, MIN_STOP_BULL);
    } else {
      stopPercent = Math.max(stopPercent, MIN_STOP_BEAR);
    }

    return {
      stopLoss: price * (1 - stopPercent),
      takeProfit: price * (1 + targetPercent),
      stopPercent: stopPercent * 100,
      targetPercent: targetPercent * 100,
      regime,
      volatility,
      tradeType,
      reasoning: `${regime} + ${volatility} + ${tradeType}`
    };
  }

  // Find key support/resistance levels
  findSupportResistanceLevels(candles, lookback = 100) {
    const highs = candles.slice(-lookback).map(c => c.high);
    const lows = candles.slice(-lookback).map(c => c.low);
    const closes = candles.slice(-lookback).map(c => c.close);
    
    // Find local peaks and troughs
    const peaks = [];
    const troughs = [];
    
    for (let i = 2; i < highs.length - 2; i++) {
      // Peak: higher than 2 candles before and after
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        peaks.push(highs[i]);
      }
      
      // Trough: lower than 2 candles before and after
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        troughs.push(lows[i]);
      }
    }
    
    // Cluster nearby levels (within 1%)
    const clusterLevels = (levels) => {
      const clustered = [];
      const sorted = levels.sort((a, b) => a - b);
      
      for (let level of sorted) {
        const nearby = clustered.find(c => Math.abs(c - level) / c < 0.01);
        if (!nearby) {
          clustered.push(level);
        }
      }
      
      return clustered;
    };
    
    return {
      resistance: clusterLevels(peaks).slice(-3), // Top 3 resistance levels
      support: clusterLevels(troughs).slice(0, 3) // Bottom 3 support levels
    };
  }
}

// Export for use in backtests
module.exports = DynamicStopSystem;

/* 
USAGE EXAMPLE:

const DynamicStopSystem = require('./dynamic-stops-framework');
const stopSystem = new DynamicStopSystem();

// After you provide the real thresholds, update like this:
stopSystem.thresholds = {
  bullMarket: {
    supportBounce: { stop: YOUR_VALUE, target: YOUR_VALUE },
    // ... etc
  }
};

// Then use in trading logic:
const stops = stopSystem.getDynamicStops({
  price: currentPrice,
  sma50: sma50Value,
  sma200: sma200Value,
  atr: currentATR,
  historicalATR: last30ATRs,
  supportLevels: [64000, 62000, 60000],
  resistanceLevels: [68000, 70000, 72000],
  momentum: momentumValue,
  btcDominance: 0.52
});

console.log(`Dynamic stop: ${stops.stopPercent}% because ${stops.reasoning}`);
*/