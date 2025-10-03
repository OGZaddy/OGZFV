/**
 * DynamicEntryAnalysis.js - BACKEND MODULE FOR VALHALLA BOT
 * Calculates Fibonacci, Support/Resistance, and Targets on trade entry
 * Sends to dashboard via WebSocket on UNIFIED PORT 3010
 */

class DynamicEntryAnalysis {
  constructor(bot) {
    this.bot = bot;
    this.config = {
      fibonacciLevels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618],
      lookbackPeriod: 200,
      supportResistanceTouches: 2,
      atrPeriod: 14
    };
    
    console.log('📊 DynamicEntryAnalysis initialized - Ready for trade entry calculations');
    
    // Hook into the bot's trade execution
    this.hookIntoTradeExecution();
  }
  
  /**
   * 🎯 Hook into bot's executeTrade method to trigger analysis
   */
  hookIntoTradeExecution() {
    if (this.bot.executeTrade) {
      const originalExecuteTrade = this.bot.executeTrade.bind(this.bot);
      
      this.bot.executeTrade = async (direction, positionSize, confidence, marketData) => {
        // Call original method
        const result = await originalExecuteTrade(direction, positionSize, confidence, marketData);
        
        if (result && marketData && marketData.price) {
          // Calculate and broadcast dynamic levels
          const levels = await this.calculateAllLevels(marketData.price, direction, marketData);
          
          // Send to dashboard via WebSocket on UNIFIED PORT 3010
          if (this.bot.wsServer) {
            this.bot.wsServer.clients.forEach(client => {
              if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify({
                  type: 'dynamic_levels',
                  data: levels
                }));
              }
            });
            console.log('📊 Dynamic levels sent to dashboard clients');
          }
        }
        
        return result;
      };
    }
  }
  
  /**
   * 🧮 Calculate all dynamic levels for trade entry
   */
  async calculateAllLevels(entryPrice, direction, marketData) {
    console.log(`🧮 CALCULATING DYNAMIC LEVELS: ${direction.toUpperCase()} @ $${entryPrice.toFixed(2)}`);
    
    try {
      // Get price history for calculations
      const priceHistory = this.getPriceHistory();
      
      // Calculate all levels
      const fibonacci = this.calculateFibonacci(priceHistory, entryPrice, direction);
      const support = this.calculateSupport(priceHistory, entryPrice);
      const resistance = this.calculateResistance(priceHistory, entryPrice);
      const targets = this.calculateTargets(priceHistory, entryPrice, direction);
      const keyLevels = this.calculateKeyLevels(entryPrice, direction, fibonacci, targets);
      
      const analysis = {
        entryPrice,
        direction,
        timeframe: '5m',
        timestamp: Date.now(),
        fibonacci,
        support,
        resistance,
        targets,
        keyLevels,
        stops: targets.stops
      };
      
      console.log('✅ Dynamic levels calculated successfully');
      return analysis;
      
    } catch (error) {
      console.error('❌ Error calculating dynamic levels:', error);
      return null;
    }
  }
  
  /**
   * 📈 Get price history from bot's cached data
   */
  getPriceHistory() {
    // Try to get price history from various bot sources
    if (this.bot.priceHistory && this.bot.priceHistory.length > 0) {
      return this.bot.priceHistory;
    }
    
    if (this.bot.candles && this.bot.candles.length > 0) {
      return this.bot.candles.map(c => ({
        price: c.close,
        high: c.high,
        low: c.low,
        timestamp: c.timestamp
      }));
    }
    
    // Fallback: create synthetic history from current price
    const currentPrice = this.bot.cachedMarketData?.price || 50000;
    const syntheticHistory = [];
    
    for (let i = 100; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = currentPrice * (1 + variation);
      syntheticHistory.push({
        price: price,
        high: price * 1.005,
        low: price * 0.995,
        timestamp: Date.now() - (i * 60000) // 1 minute intervals
      });
    }
    
    return syntheticHistory;
  }
  
  /**
   * 🌟 Calculate Fibonacci retracement levels
   */
  calculateFibonacci(priceHistory, entryPrice, direction) {
    if (priceHistory.length < 50) return {};
    
    // Find swing high/low from recent price action
    const recentPrices = priceHistory.slice(-100);
    const highs = recentPrices.map(p => p.high || p.price);
    const lows = recentPrices.map(p => p.low || p.price);
    
    const swingHigh = Math.max(...highs);
    const swingLow = Math.min(...lows);
    const range = swingHigh - swingLow;
    
    const fibonacci = {};
    
    this.config.fibonacciLevels.forEach(ratio => {
      const price = direction === 'buy'
        ? swingLow + (range * ratio)
        : swingHigh - (range * ratio);
        
      fibonacci[ratio] = {
        price: price,
        distance: Math.abs(price - entryPrice),
        color: ratio === 0.618 ? '#ffd700' : '#00ff88' // Golden ratio special
      };
    });
    
    return fibonacci;
  }
  
  /**
   * 🛡️ Calculate support levels
   */
  calculateSupport(priceHistory, entryPrice) {
    const supports = [];
    const lookback = Math.min(this.config.lookbackPeriod, priceHistory.length);
    const recentPrices = priceHistory.slice(-lookback);
    
    // Find price levels with multiple touches below entry
    const priceLevels = {};
    
    recentPrices.forEach(candle => {
      const roundedLow = Math.round((candle.low || candle.price) / 10) * 10;
      priceLevels[roundedLow] = (priceLevels[roundedLow] || 0) + 1;
    });
    
    Object.entries(priceLevels).forEach(([price, touches]) => {
      const priceNum = parseFloat(price);
      if (priceNum < entryPrice && touches >= this.config.supportResistanceTouches) {
        supports.push({
          price: priceNum,
          touches: touches,
          strength: Math.min(touches * 10, 100) // Cap at 100
        });
      }
    });
    
    return supports.sort((a, b) => b.price - a.price).slice(0, 5);
  }
  
  /**
   * ⚡ Calculate resistance levels
   */
  calculateResistance(priceHistory, entryPrice) {
    const resistances = [];
    const lookback = Math.min(this.config.lookbackPeriod, priceHistory.length);
    const recentPrices = priceHistory.slice(-lookback);
    
    // Find price levels with multiple touches above entry
    const priceLevels = {};
    
    recentPrices.forEach(candle => {
      const roundedHigh = Math.round((candle.high || candle.price) / 10) * 10;
      priceLevels[roundedHigh] = (priceLevels[roundedHigh] || 0) + 1;
    });
    
    Object.entries(priceLevels).forEach(([price, touches]) => {
      const priceNum = parseFloat(price);
      if (priceNum > entryPrice && touches >= this.config.supportResistanceTouches) {
        resistances.push({
          price: priceNum,
          touches: touches,
          strength: Math.min(touches * 10, 100) // Cap at 100
        });
      }
    });
    
    return resistances.sort((a, b) => a.price - b.price).slice(0, 5);
  }
  
  /**
   * 🎯 Calculate profit targets and stop losses
   */
  calculateTargets(priceHistory, entryPrice, direction) {
    // Calculate ATR for dynamic targets
    const atr = this.calculateATR(priceHistory.slice(-this.config.atrPeriod));
    
    if (direction === 'buy') {
      return {
        target1: entryPrice + (atr * 1),
        target2: entryPrice + (atr * 2),
        target3: entryPrice + (atr * 3),
        stops: {
          tight: entryPrice - (atr * 0.5),
          normal: entryPrice - (atr * 1),
          wide: entryPrice - (atr * 1.5)
        }
      };
    } else {
      return {
        target1: entryPrice - (atr * 1),
        target2: entryPrice - (atr * 2),
        target3: entryPrice - (atr * 3),
        stops: {
          tight: entryPrice + (atr * 0.5),
          normal: entryPrice + (atr * 1),
          wide: entryPrice + (atr * 1.5)
        }
      };
    }
  }
  
  /**
   * 🔑 Calculate key levels for display
   */
  calculateKeyLevels(entryPrice, direction, fibonacci, targets) {
    return [
      { type: 'Entry', price: entryPrice, color: '#ffffff' },
      { type: 'Target 1', price: targets.target1, color: '#00ff88' },
      { type: 'Target 2', price: targets.target2, color: '#00ffff' },
      { type: 'Target 3', price: targets.target3, color: '#ffd700' },
      { type: 'Stop Loss', price: targets.stops.normal, color: '#ff4444' },
      { type: 'Fib 61.8%', price: fibonacci[0.618]?.price, color: '#ffd700' }
    ].filter(level => level.price !== undefined);
  }
  
  /**
   * 📊 Calculate Average True Range (ATR)
   */
  calculateATR(priceHistory) {
    if (priceHistory.length < 2) return 100; // Fallback ATR
    
    let atr = 0;
    for (let i = 1; i < priceHistory.length; i++) {
      const current = priceHistory[i];
      const previous = priceHistory[i - 1];
      
      const high = current.high || current.price;
      const low = current.low || current.price;
      const prevClose = previous.price;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      atr += tr;
    }
    
    return atr / (priceHistory.length - 1);
  }
}

module.exports = DynamicEntryAnalysis;
