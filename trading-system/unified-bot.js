// trading-system/unified-bot.js
// ONE BOT TO RULE THEM ALL - No more duplication!

const WebSocket = require('ws');
const EventEmitter = require('events');
const { getTierConfig, isFeatureEnabled, getIndicatorConfig, calculateFees } = require('../config/tier-configs');
const UnifiedTradingCore = require('../core/UnifiedTradingCore');

// 📊 Performance tracking for launch sprint
const UniversalPerformanceTracking = require('../performanceIntegration');

class UnifiedTradingBot extends EventEmitter {
  constructor(tierName) {
    super();
    
    // Get configuration for this tier
    this.tier = tierName.toLowerCase();
    this.config = getTierConfig(this.tier);
    
    console.log(`
╔════════════════════════════════════╗
║   ${this.config.name.toUpperCase().padEnd(34)} ║
║   ($${this.config.price}/mo)${' '.repeat(30 - this.config.price.toString().length)} ║
╚════════════════════════════════════╝
    `);
    
    // Initialize core components
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.lastPong = Date.now();
    
    // Trading state
    this.currentPrice = null;
    this.priceHistory = [];
    this.positions = [];
    this.lastTradeTime = 0;
    this.tradesCount = 0;
    
    // Account state
    this.balance = 10000;
    this.pnl = 0;
    this.wins = 0;
    this.losses = 0;
    
    // Initialize the unified trading core with proper profile
    this.tradingCore = new UnifiedTradingCore({
      name: this.tier,
      tier: this.tier,
      mode: this.config.features.paperTradingOnly ? 'PAPER' : 'LIVE',
      tiers: [this.tier], // Which modules to load
      config: this.config.indicatorConfig,
      weights: this.config.weights,
      featureFlags: this.config.features
    });
    
    // Performance tracker for launch sprint
    this.performanceTracker = new UniversalPerformanceTracking(this.tier);
    console.log(`📊 ${this.tier.toUpperCase()} BOT: Performance tracking enabled`);
    
    // Load indicator modules dynamically
    this.indicators = new Map();
    this.loadIndicators();
  }
  
  async loadIndicators() {
    // Load only the indicators this tier needs
    for (const indicatorName of this.config.indicators) {
      try {
        // Try to load from core modules first
        const indicatorPath = `../core/${indicatorName}.js`;
        const IndicatorModule = require(indicatorPath);
        const config = getIndicatorConfig(this.tier, indicatorName);
        
        this.indicators.set(indicatorName, new IndicatorModule(config));
        console.log(`✅ Loaded indicator: ${indicatorName}`);
      } catch (error) {
        // Fallback to basic implementation if module doesn't exist
        console.log(`⚠️ Using basic implementation for ${indicatorName}`);
        this.indicators.set(indicatorName, this.getBasicIndicator(indicatorName));
      }
    }
  }
  
  getBasicIndicator(name) {
    // Basic implementations that ALL tiers share
    // No more duplication of RSI/MACD calculations!
    const basicIndicators = {
      RSI: {
        calculate: (prices, config = {}) => this.calculateRSI(prices, config.period || 14)
      },
      MACD: {
        calculate: (prices, config = {}) => this.calculateMACD(prices, config)
      },
      BollingerBands: {
        calculate: (prices, config = {}) => this.calculateBollingerBands(prices, config)
      },
      VWAP: {
        calculate: (prices, volumes, config = {}) => this.calculateVWAP(prices, volumes)
      },
      PatternRecognition: {
        calculate: (prices, config = {}) => this.detectPattern(prices, config.patterns || [])
      }
    };
    
    return basicIndicators[name] || { calculate: () => ({ value: 50, signal: 'NEUTRAL' }) };
  }
  
  connect() {
    const WS_URL = 'ws://127.0.0.1:3010/ws'; // ALWAYS port 3010
    console.log(`🔌 Connecting to unified WebSocket: ${WS_URL}`);
    
    this.ws = new WebSocket(WS_URL);
    
    this.ws.on('open', () => {
      console.log(`✅ ${this.tier} bot connected to unified dashboard`);
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Identify ourselves with tier
      this.ws.send(JSON.stringify({
        type: 'identify',
        source: 'trading_bot',
        botTier: this.tier,
        version: '3.0.0-unified'
      }));
      
      // Start trading loop
      this.startTrading();
    });
    
    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleMessage(msg);
      } catch (error) {
        console.error('Message parse error:', error);
      }
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
    
    this.ws.on('close', (code, reason) => {
      console.log(`Disconnected (code: ${code}), reconnecting...`);
      this.connected = false;
      setTimeout(() => this.connect(), 5000);
    });
    
    // Heartbeat
    this.ws.on('pong', () => {
      this.lastPong = Date.now();
    });
    
    setInterval(() => {
      if (this.connected && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }
  
  handleMessage(msg) {
    // Handle price updates
    if (msg.type === 'price' && msg.data) {
      if (msg.data.asset && (msg.data.asset.includes('BTC') || msg.data.asset.includes('USD'))) {
        this.currentPrice = msg.data.price;
        this.priceHistory.push(this.currentPrice);
        
        // Keep history size based on tier needs
        const maxHistory = this.tier === 'quantum' ? 200 : 
                          this.tier === 'elite' ? 100 : 50;
        if (this.priceHistory.length > maxHistory) {
          this.priceHistory.shift();
        }
        
        console.log(`📊 ${this.tier.toUpperCase()}: Price update - ${msg.data.asset}: $${this.currentPrice}`);
      }
    }
    
    // Handle manual commands
    if (msg.type === 'manual_buy') this.executeBuy('Manual buy command');
    if (msg.type === 'manual_sell') this.executeSell('Manual sell command');
  }
  
  startTrading() {
    console.log(`🚀 Starting ${this.tier} trading loop...`);
    
    // Trading interval based on tier
    const intervals = {
      starter: 5000,  // 5 seconds
      pro: 4000,      // 4 seconds
      elite: 3000,    // 3 seconds
      quantum: 2000   // 2 seconds
    };
    
    setInterval(() => this.tradingLoop(), intervals[this.tier] || 5000);
  }
  
  async tradingLoop() {
    if (!this.connected || !this.currentPrice) return;
    
    // Check daily trade limit
    if (this.config.features.maxTradesPerDay > 0 && 
        this.tradesCount >= this.config.features.maxTradesPerDay) {
      console.log(`⚠️ Daily trade limit reached (${this.config.features.maxTradesPerDay})`);
      return;
    }
    
    // Check minimum time between trades
    if (Date.now() - this.lastTradeTime < this.config.features.tradingDelay) {
      return;
    }
    
    // Need minimum data for indicators
    const minDataPoints = this.tier === 'quantum' ? 50 : 
                         this.tier === 'elite' ? 30 : 
                         this.tier === 'pro' ? 20 : 14;
    
    if (this.priceHistory.length < minDataPoints) {
      console.log(`⏳ Gathering data... (${this.priceHistory.length}/${minDataPoints})`);
      return;
    }
    
    // Calculate all indicators for this tier
    const signals = await this.calculateSignals();
    
    // Make trading decision
    const decision = await this.makeDecision(signals);
    
    // Execute if confidence is high enough
    if (decision.confidence >= this.config.features.minConfidence) {
      await this.executeTrade(decision);
    }
  }
  
  async calculateSignals() {
    const signals = {};
    
    // Calculate each indicator this tier has access to
    for (const [name, indicator] of this.indicators) {
      try {
        const config = getIndicatorConfig(this.tier, name);
        const signal = await indicator.calculate(this.priceHistory, config);
        signals[name] = signal;
      } catch (error) {
        console.error(`Indicator ${name} error:`, error.message);
        signals[name] = { value: 50, signal: 'NEUTRAL' };
      }
    }
    
    return signals;
  }
  
  async makeDecision(signals) {
    let totalWeight = 0;
    let weightedScore = 0;
    const reasons = [];
    
    // Weight each signal according to tier configuration
    for (const [name, signal] of Object.entries(signals)) {
      const weight = this.config.weights[name] || 1.0;
      totalWeight += weight;
      
      // Normalize signal to -100 to +100 scale
      let score = 0;
      if (typeof signal === 'number') {
        score = signal - 50; // Assuming 0-100 scale with 50 neutral
      } else if (signal.value !== undefined) {
        score = signal.value - 50;
      } else if (signal.signal) {
        score = signal.signal === 'BUY' ? 50 : 
                signal.signal === 'SELL' ? -50 : 0;
      }
      
      weightedScore += score * weight;
      
      if (Math.abs(score) > 20) {
        reasons.push(`${name}: ${score > 0 ? 'Bullish' : 'Bearish'} (${Math.abs(score).toFixed(0)})`);
      }
    }
    
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const confidence = Math.min(100, Math.abs(finalScore) * 2);
    
    return {
      action: finalScore > 15 ? 'BUY' : finalScore < -15 ? 'SELL' : 'HOLD',
      confidence: confidence,
      score: finalScore,
      reasons: reasons,
      signals: signals
    };
  }
  
  async executeTrade(decision) {
    const { action, confidence, reasons, signals } = decision;
    
    if (action === 'HOLD') return;
    
    // Check position constraints
    if (action === 'BUY' && this.config.features.maxPositions > 0 && 
        this.positions.length >= this.config.features.maxPositions) {
      console.log(`⚠️ Max positions reached (${this.config.features.maxPositions})`);
      return;
    }
    
    if (action === 'SELL' && this.positions.length === 0) {
      console.log(`⚠️ No positions to sell`);
      return;
    }
    
    // Calculate P&L
    let pnl = 0;
    if (action === 'SELL' && this.positions.length > 0) {
      const position = this.positions.shift();
      const grossPnl = (this.currentPrice - position.price) * position.size;
      const fees = calculateFees(this.tier, Math.abs(grossPnl));
      pnl = grossPnl - fees;
      
      if (pnl > 0) this.wins++;
      else this.losses++;
    } else if (action === 'BUY') {
      this.positions.push({
        price: this.currentPrice,
        size: this.config.features.positionSize,
        time: Date.now(),
        tier: this.tier
      });
    }
    
    // Update state
    this.pnl += pnl;
    this.balance += pnl;
    this.tradesCount++;
    this.lastTradeTime = Date.now();
    
    // Track performance for launch sprint
    const tradeData = {
      tier: this.tier,
      action: action,
      price: this.currentPrice,
      pnl: pnl,
      confidence: confidence,
      reasons: reasons,
      balance: this.balance,
      timestamp: Date.now()
    };
    
    this.performanceTracker.trackEverything(
      tradeData, 
      this.balance, 
      Object.keys(signals)
    );
    
    // Send to dashboard
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'trade',
        source: 'trading_bot',
        botTier: this.tier,
        ...tradeData,
        indicators: signals
      }));
    }
    
    // Log the trade
    const winRate = this.tradesCount > 0 ? 
      (this.wins / this.tradesCount * 100).toFixed(1) : 0;
    
    console.log(`
📈 ${this.tier.toUpperCase()} TRADE EXECUTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action: ${action} @ $${this.currentPrice.toFixed(2)}
Confidence: ${confidence.toFixed(1)}%
P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
Total P&L: ${this.pnl >= 0 ? '+' : ''}$${this.pnl.toFixed(2)}
Win Rate: ${winRate}% (${this.wins}/${this.tradesCount})
Reasons: ${reasons.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
  
  // SHARED INDICATOR CALCULATIONS - No more duplication!
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  calculateMACD(prices, config = {}) {
    const fast = config.fast || 12;
    const slow = config.slow || 26;
    const signal = config.signal || 9;
    
    if (prices.length < slow) return { 
      macd: 0, 
      signal: 0, 
      histogram: 0, 
      crossover: false 
    };
    
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    const macdLine = emaFast - emaSlow;
    
    // Simplified signal line
    const signalLine = macdLine * (2 / (signal + 1));
    const histogram = macdLine - signalLine;
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram,
      crossover: this.lastMACDHistogram && 
        ((this.lastMACDHistogram <= 0 && histogram > 0) || 
         (this.lastMACDHistogram >= 0 && histogram < 0))
    };
  }
  
  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[prices.length - period];
    
    for (let i = prices.length - period + 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }
  
  calculateBollingerBands(prices, config = {}) {
    const period = config.period || 20;
    const stdDev = config.stdDev || 2;
    
    if (prices.length < period) return {
      upper: prices[prices.length - 1],
      middle: prices[prices.length - 1],
      lower: prices[prices.length - 1],
      width: 0
    };
    
    const slice = prices.slice(-period);
    const sma = slice.reduce((a, b) => a + b) / period;
    
    const variance = slice.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev),
      width: std * stdDev * 2
    };
  }
  
  calculateVWAP(prices, volumes) {
    if (!volumes || prices.length !== volumes.length) {
      return prices[prices.length - 1];
    }
    
    let cumVolume = 0;
    let cumPV = 0;
    
    for (let i = 0; i < prices.length; i++) {
      cumVolume += volumes[i];
      cumPV += prices[i] * volumes[i];
    }
    
    return cumVolume > 0 ? cumPV / cumVolume : prices[prices.length - 1];
  }
  
  detectPattern(prices, patterns) {
    // Basic pattern detection - can be enhanced per tier
    if (prices.length < 20) return null;
    
    const recent = prices.slice(-20);
    const avg = recent.reduce((a, b) => a + b) / recent.length;
    const high = Math.max(...recent);
    const low = Math.min(...recent);
    
    // Simplified pattern detection
    if (patterns.includes('Double Bottom') || patterns.includes('ALL')) {
      if (recent[5] < avg && recent[10] < avg && recent[15] > avg) {
        return 'Double Bottom';
      }
    }
    
    if (patterns.includes('Head & Shoulders') || patterns.includes('ALL')) {
      if (recent[10] > high * 0.98 && recent[5] < high * 0.95 && recent[15] < high * 0.95) {
        return 'Head & Shoulders';
      }
    }
    
    return null;
  }
  
  // Manual trade execution
  executeBuy(reason = 'Manual') {
    const decision = {
      action: 'BUY',
      confidence: 100,
      reasons: [reason],
      signals: {}
    };
    this.executeTrade(decision);
  }
  
  executeSell(reason = 'Manual') {
    const decision = {
      action: 'SELL',
      confidence: 100,
      reasons: [reason],
      signals: {}
    };
    this.executeTrade(decision);
  }
  
  // Cleanup
  async shutdown() {
    console.log(`🛑 Shutting down ${this.tier} bot...`);
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.tradingCore) {
      await this.tradingCore.shutdown();
    }
    
    // Save final performance report
    if (this.performanceTracker) {
      await this.performanceTracker.generateReport();
    }
  }
}

module.exports = UnifiedTradingBot;