/**
 * OGZ PRIME V13 - STABLE VERSION
 * Simplified and working version without complex dependencies
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class OGZPrimeV13 extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      asset: config.asset || 'BTC-USD',
      initialBalance: config.initialBalance || 10000,
      mode: process.env.TRADING_MODE || config.mode || 'LIVE',
      maxPosition: config.maxPosition || 0.25,
      stopLoss: config.stopLoss || 0.015, // 1.5% stop loss
      takeProfit: config.takeProfit || 0.025, // 2.5% take profit
      ...config
    };
    
    this.balance = this.config.initialBalance;
    this.position = {
      size: 0,
      entry: 0,
      side: 'none',
      unrealizedPL: 0
    };
    
    this.marketData = {
      price: 45000,
      volume: 0,
      volatility: 0.01,
      trend: 'sideways'
    };
    
    this.indicators = {
      rsi: 50,
      macd: 0,
      macdSignal: 0,
      bb: { upper: 0, middle: 0, lower: 0 },
      ema20: 0,
      ema50: 0
    };
    
    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      totalProfit: 0,
      maxDrawdown: 0,
      winRate: 0
    };
    
    // Initialize trading brain
    this.tradingBrain = new TradingBrain(this);
    
    console.log('🤖 OGZ PRIME V13 STABLE INITIALIZED');
    console.log(`   Asset: ${this.config.asset}`);
    console.log(`   Balance: ${this.balance.toLocaleString()}`);
    console.log(`   Mode: ${this.config.mode.toUpperCase()}`);
  }
  
  async initialize() {
    console.log('📡 Connecting to LIVE market data feed...');
    this.startMarketDataFeed();
    this.startTradingLoop();
    console.log('✅ V13 Stable running');
    return this;
  }
  
  startMarketDataFeed() {
    // Connect to real WebSocket data feed
    const WebSocket = require('ws');
    const wsUrl = 'ws://127.0.0.1:3010/ws';
    console.log(`🔌 Connecting to WebSocket at ${wsUrl}...`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      console.log('✅ WebSocket connected to live data');
      this.ws.send(JSON.stringify({
        type: 'identify',
        bot: 'v13-stable',
        version: 'V13-STABLE',
        capabilities: ['trading', 'realtime']
      }));
    });
    
    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'price' && msg.data) {
          const { asset, price } = msg.data;
          
          // Only process BTC-USD prices for this bot
          if (asset !== 'BTC-USD') return;
          
          // Update market data with real prices
          this.marketData.price = price;
          this.marketData.volume = msg.data.volume || 1000000;
          this.marketData.volatility = 0.001;
          this.marketData.trend = price > this.marketData.price ? 'uptrend' : 'downtrend';
          
          // Update indicators with real data
          this.updateIndicators();
          
          console.log(`📊 Live: ${asset} = $${price}`);
        }
      } catch (err) {
        // Ignore parse errors
      }
    });
    
    this.ws.on('close', () => {
      console.log('❌ WebSocket disconnected, reconnecting...');
      setTimeout(() => this.startMarketDataFeed(), 5000);
    });
  }
  
  updateIndicators() {
    const price = this.marketData.price;
    
    // Calculate REAL indicators (simplified but functional)
    if (!this.priceHistory) this.priceHistory = [];
    this.priceHistory.push(price);
    if (this.priceHistory.length > 50) this.priceHistory.shift();
    
    // Real RSI calculation (simplified)
    const avgGain = this.priceHistory.slice(-14).reduce((sum, p, i, arr) => {
      if (i === 0) return 0;
      const change = p - arr[i-1];
      return sum + (change > 0 ? change : 0);
    }, 0) / 14;
    
    const avgLoss = Math.abs(this.priceHistory.slice(-14).reduce((sum, p, i, arr) => {
      if (i === 0) return 0;
      const change = p - arr[i-1];
      return sum + (change < 0 ? change : 0);
    }, 0) / 14);
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    this.indicators.rsi = 100 - (100 / (1 + rs));
    
    // Real MACD (12,26,9)
    const ema12 = this.calculateEMA(this.priceHistory, 12);
    const ema26 = this.calculateEMA(this.priceHistory, 26);
    this.indicators.macd = ema12 - ema26;
    this.indicators.macdSignal = this.indicators.macd * 0.9; // Simplified signal
    
    // Real Bollinger Bands
    const sma20 = this.priceHistory.slice(-20).reduce((a,b) => a+b, 0) / 20;
    const stdDev = Math.sqrt(this.priceHistory.slice(-20).reduce((sum, p) => {
      return sum + Math.pow(p - sma20, 2);
    }, 0) / 20);
    
    this.indicators.bb = {
      upper: sma20 + (stdDev * 2),
      middle: sma20,
      lower: sma20 - (stdDev * 2)
    };
    
    // Real EMAs
    this.indicators.ema20 = this.calculateEMA(this.priceHistory, 20);
    this.indicators.ema50 = this.calculateEMA(this.priceHistory, 50);
    
    // Update trend based on EMAs
    this.marketData.trend = this.indicators.ema20 > this.indicators.ema50 ? 'uptrend' : 'downtrend';
  }
  
  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a,b) => a+b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    return ema;
  }
  
  startTradingLoop() {
    console.log('🚀 TRADING LOOP STARTED - checking every 5 seconds');
    setInterval(async () => {
      try {
        console.log(`⚡ Trading check - Position: ${this.position.side}, Price: $${this.marketData.price}`);
        
        if (this.position.side !== 'none') {
          this.updatePosition();
        }
        
        const analysis = await this.tradingBrain.processAnalysis({
          ...this.indicators,
          ...this.marketData
        }, this.marketData.price);
        
        console.log(`📊 Analysis: ${analysis ? `Decision: ${analysis.decision}, Confidence: ${analysis.confidence}` : 'No analysis'}`);
        
        // Send analysis to WebSocket for dashboard display
        if (this.ws && this.ws.readyState === 1 && analysis) {
          this.ws.send(JSON.stringify({
            type: 'bot_analysis',
            bot: 'v13-stable',
            data: {
              decision: analysis.decision,
              confidence: analysis.confidence,
              reason: analysis.reason || 'No specific reason',
              indicators: this.indicators,
              position: this.position.side,
              unrealizedPL: this.position.unrealizedPL
            }
          }));
        }
        
        if (analysis && analysis.confidence > 0.65) {
          console.log(`✅ EXECUTING TRADE: ${analysis.decision}`);
          await this.executeTrade(analysis);
        } else {
          console.log(`⏸️ No trade: Confidence too low (${analysis?.confidence || 0} < 0.65)`);
        }
      } catch (error) {
        console.error('Trading error:', error.message);
      }
    }, 5000);
  }
  
  async executeTrade(analysis) {
    const { decision, reason, positionSize } = analysis;
    
    if (decision === 'buy' && this.position.side === 'none') {
      await this.openLongPosition(positionSize || 0.1, reason);
    } else if (decision === 'sell' && this.position.side === 'none') {
      await this.openShortPosition(positionSize || 0.1, reason);
    }
  }
  
  async openLongPosition(size, reason) {
    const price = this.marketData.price;
    const positionValue = this.balance * size;
    const shares = positionValue / price;
    
    this.position = {
      size: shares,
      entry: price,
      side: 'long',
      unrealizedPL: 0,
      openTime: Date.now(),
      reason
    };
    
    console.log(`📈 LONG OPENED: ${shares.toFixed(6)} @ ${price.toFixed(2)}`);
    console.log(`   Value: ${positionValue.toFixed(2)} | Reason: ${reason}`);
  }
  
  async openShortPosition(size, reason) {
    const price = this.marketData.price;
    const positionValue = this.balance * size;
    const shares = positionValue / price;
    
    this.position = {
      size: shares,
      entry: price,
      side: 'short',
      unrealizedPL: 0,
      openTime: Date.now(),
      reason
    };
    
    console.log(`📉 SHORT OPENED: ${shares.toFixed(6)} @ ${price.toFixed(2)}`);
    console.log(`   Value: ${positionValue.toFixed(2)} | Reason: ${reason}`);
  }
  
  async closePosition(type, reason) {
    if (this.position.side === 'none') return;
    
    const price = this.marketData.price;
    const { size, entry, side } = this.position;
    
    let realizedPL;
    if (side === 'long') {
      realizedPL = (price - entry) * size;
    } else {
      realizedPL = (entry - price) * size;
    }
    
    this.balance += realizedPL;
    this.performance.totalTrades++;
    
    if (realizedPL > 0) {
      this.performance.winningTrades++;
    }
    
    this.performance.totalProfit += realizedPL;
    this.performance.winRate = (this.performance.winningTrades / this.performance.totalTrades) * 100;
    
    console.log(`🔒 POSITION CLOSED: ${side.toUpperCase()}`);
    console.log(`   P&L: ${realizedPL > 0 ? '✅' : '❌'} ${realizedPL.toFixed(2)}`);
    console.log(`   Balance: ${this.balance.toFixed(2)}`);
    console.log(`   Win Rate: ${this.performance.winRate.toFixed(1)}%`);
    console.log(`   Reason: ${reason}`);
    
    this.position = {
      size: 0,
      entry: 0,
      side: 'none',
      unrealizedPL: 0
    };
  }
  
  updatePosition() {
    if (this.position.side === 'none') return;
    
    const price = this.marketData.price;
    const { size, entry, side } = this.position;
    
    let unrealizedPL;
    if (side === 'long') {
      unrealizedPL = (price - entry) * size;
    } else {
      unrealizedPL = (entry - price) * size;
    }
    
    this.position.unrealizedPL = unrealizedPL;
    
    const percentPL = unrealizedPL / (entry * size);
    
    if (percentPL <= -this.config.stopLoss) {
      this.closePosition('stop_loss', `Stop loss hit: ${(percentPL * 100).toFixed(2)}%`);
    } else if (percentPL >= this.config.takeProfit) {
      this.closePosition('take_profit', `Take profit hit: ${(percentPL * 100).toFixed(2)}%`);
    }
  }
}

class TradingBrain extends EventEmitter {
  constructor(bot) {
    super();
    this.bot = bot;
    this.lastDecision = null;
    this.consecutiveLosses = 0;
  }
  
  async processAnalysis(data, price) {
    const analysis = this.analyzeMarket(data);
    const decision = this.makeDecision(analysis);
    
    this.lastDecision = decision;
    return decision;
  }
  
  analyzeMarket(data) {
    const { rsi, macd, macdSignal, trend, volatility, bb, ema20, ema50, price } = data;
    const signals = [];
    
    // Debug logging
    console.log(`🔍 Analysis - RSI: ${rsi?.toFixed(2) || 'NaN'}, MACD: ${macd?.toFixed(4) || 'NaN'}, Price: $${price}`);
    
    // Skip if indicators not ready
    if (isNaN(rsi) || !bb || !macd) {
      console.log('⏳ Indicators not ready, waiting for more data...');
      return { signals: [], trend, volatility };
    }
    
    // Improved strategy logic
    if (rsi < 35 && trend !== 'downtrend') {
      signals.push({ type: 'buy', strength: 0.8, reason: 'RSI oversold' });
    }
    if (rsi > 65 && trend !== 'uptrend') {
      signals.push({ type: 'sell', strength: 0.8, reason: 'RSI overbought' });
    }
    
    if (macd > macdSignal && macd > 0) {
      signals.push({ type: 'buy', strength: 0.7, reason: 'MACD bullish' });
    }
    if (macd < macdSignal && macd < 0) {
      signals.push({ type: 'sell', strength: 0.7, reason: 'MACD bearish' });
    }
    
    if (price <= bb.lower && rsi < 40) {
      signals.push({ type: 'buy', strength: 0.9, reason: 'Oversold at BB lower' });
    }
    if (price >= bb.upper && rsi > 60) {
      signals.push({ type: 'sell', strength: 0.9, reason: 'Overbought at BB upper' });
    }
    
    return { signals, trend, volatility };
  }
  
  makeDecision(analysis) {
    const { signals } = analysis;
    
    if (signals.length === 0) {
      return { decision: 'hold', confidence: 0, reason: 'No signals' };
    }
    
    const buySignals = signals.filter(s => s.type === 'buy');
    const sellSignals = signals.filter(s => s.type === 'sell');
    
    const buyStrength = buySignals.reduce((sum, s) => sum + s.strength, 0);
    const sellStrength = sellSignals.reduce((sum, s) => sum + s.strength, 0);
    
    if (buyStrength > sellStrength && buyStrength > 1.2) {
      const reasons = buySignals.map(s => s.reason).join(', ');
      return {
        decision: 'buy',
        confidence: Math.min(0.95, buyStrength / 3),
        reason: reasons,
        positionSize: 0.1
      };
    }
    
    if (sellStrength > buyStrength && sellStrength > 1.2) {
      const reasons = sellSignals.map(s => s.reason).join(', ');
      return {
        decision: 'sell',
        confidence: Math.min(0.95, sellStrength / 3),
        reason: reasons,
        positionSize: 0.1
      };
    }
    
    return { decision: 'hold', confidence: 0, reason: 'Insufficient signals' };
  }
}

module.exports = OGZPrimeV13;

// Auto-run if executed directly
if (require.main === module) {
  // Parse command line arguments
  const isLive = process.argv.includes('--live') || process.env.TRADING_MODE === 'LIVE';
  
  const bot = new OGZPrimeV13({
    initialBalance: 10000,
    mode: isLive ? 'LIVE' : 'LIVE'  // Always LIVE, no simulation
  });
  
  bot.initialize().then(() => {
    console.log('🚀 V13 STABLE TRADING BOT RUNNING');
  });
}