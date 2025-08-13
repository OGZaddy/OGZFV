// core/AggressiveTradingMode.js - AGGRESSIVE TRADING MODE for OGZ Prime
// ========================================================================
// 🔥 AGGRESSIVE TRADING MODE - FORCE THE BOT TO TRADE IMMEDIATELY!
// ========================================================================
//
// This module FORCES the trading bot to be more aggressive and start trading
// immediately instead of waiting forever for perfect conditions.
//
// Key Features:
// ✅ Lower confidence thresholds (0.25 instead of 0.65)
// ✅ Reduced candle requirements (3 instead of 30)
// ✅ Force first trade in simulation mode
// ✅ Random trade chance to ensure activity
// ✅ Aggressive technical indicator sensitivity
// ✅ Emergency trading triggers
//
// Built for: Getting the bot to ACTUALLY TRADE!
// Author: Trey (OGZPrime Technologies)
// Version: 1.0 - FIRE MODE

const indicators = require('./OptimizedIndicators');

/**
 * Aggressive Trading Mode - Forces the bot to trade aggressively
 * Overrides conservative settings to ensure immediate trading activity
 */
class AggressiveTradingMode {
  /**
   * Initialize Aggressive Trading Mode
   * @param {Object} config - Aggressive mode configuration
   */
  constructor(config = {}) {
    this.config = {
      // AGGRESSIVE THRESHOLDS - Much lower than conservative mode
      minCandlesRequired: 3,              // DOWN from 30!
      minConfidenceThreshold: 0.25,       // VERY LOW - take more trades
      
      // FORCE TRADING FEATURES
      forceFirstTrade: true,              // Force a trade in first 30 seconds
      forceTradeTimeout: 30000,           // 30 seconds max before forcing trade
      randomTradeChance: 0.15,            // 15% chance of random trade
      emergencyTradeTimer: 120000,        // 2 minutes max without trade
      
      // AGGRESSIVE TECHNICAL SETTINGS
      aggressiveRSI: {
        oversoldThreshold: 45,            // Higher than normal 30
        overboughtThreshold: 55,          // Lower than normal 70
        neutralBias: 0.3                  // Trade even in neutral RSI
      },
      
      aggressiveMACD: {
        minimumDivergence: 0.001,         // Very small MACD movements
        crossoverSensitivity: 0.8,        // Detect weak crossovers
        trendBias: 0.25                   // Trade against weak trends
      },
      
      // SIMULATION MODE AGGRESSION - ENHANCED SAFETY
      simulationAggression: {
        forceFirstTrade: true,            // Force a trade in first 30 seconds
        randomTradeChance: 0.05,          // REDUCED: 5% chance of random trade (was 15% - too high!)
        maxWaitTime: 120000,              // INCREASED: 2 minutes max wait (was 1 minute)
        debugOutput: true                 // Show all decision making
      },
      
      // 🛡️ SAFETY MECHANISMS
      safetyLimits: {
        maxDailyLoss: 0.05,               // 5% max daily loss
        maxConsecutiveLosses: 3,          // Stop forcing after 3 losses
        minTimeBetweenTrades: 30000,      // Min 30s between forced trades
        volatilityThreshold: 2.0,         // Don't force trades if volatility > 200% (crypto-friendly)
        enableSafetyChecks: true          // Master safety switch
      },
      
      // PATTERN OVERRIDE
      ignorePatternRequirements: true,    // Skip pattern matching delays
      allowLowConfidencePatterns: true,   // Accept weak patterns
      
      // Merge user config
      ...config
    };
    
    // State tracking - ENHANCED WITH SAFETY
    this.state = {
      isActive: false,
      startTime: null,
      lastTradeTime: null,
      forcedTrades: 0,
      randomTrades: 0,
      totalDecisions: 0,
      aggressionLevel: 1.0,
      // 🛡️ SAFETY STATE TRACKING
      consecutiveLosses: 0,
      dailyLoss: 0,
      lastLossTime: null,
      safetyBlocked: false,
      lastSafetyCheck: Date.now()
    };
    
    // Force trade timer
    this.forceTradeTimer = null;
    this.emergencyTimer = null;
    
    console.log('🔥 AGGRESSIVE TRADING MODE INITIALIZED!');
    console.log(`   ⚡ Min Candles: ${this.config.minCandlesRequired} (was 30+)`);
    console.log(`   🎯 Min Confidence: ${this.config.minConfidenceThreshold} (was 0.65+)`);
    console.log(`   🎲 Random Trade Chance: ${(this.config.randomTradeChance * 100).toFixed(1)}%`);
    console.log(`   ⏰ Force Trade Timer: ${this.config.forceTradeTimeout / 1000}s`);
  }
  
  /**
   * Activate aggressive trading mode
   * @param {Object} tradingBrain - Trading brain instance
   */
  activate(tradingBrain) {
    this.state.isActive = true;
    this.state.startTime = Date.now();
    this.tradingBrain = tradingBrain;
    
    console.log('🚀 AGGRESSIVE TRADING MODE ACTIVATED!');
    console.log('   🔥 BOT WILL NOW TRADE AGGRESSIVELY!');
    
    // Start force trade timer if enabled
    if (this.config.forceFirstTrade) {
      this.startForceTradeTimer();
    }
    
    // Start emergency timer
    this.startEmergencyTimer();
  }
  
  /**
   * Deactivate aggressive trading mode
   */
  deactivate() {
    this.state.isActive = false;
    
    // Clear timers
    if (this.forceTradeTimer) {
      clearTimeout(this.forceTradeTimer);
      this.forceTradeTimer = null;
    }
    
    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer);
      this.emergencyTimer = null;
    }
    
    console.log('⏹️ Aggressive trading mode deactivated');
  }
  
  /**
   * Check if aggressive mode is currently active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.state.isActive;
  }
  
  /**
   * Get minimum candles required for aggressive analysis
   * @returns {number} Minimum candles needed
   */
  getMinCandlesRequired() {
    return this.config.minCandlesRequired;
  }
  
  /**
   * Check if we have enough candles for aggressive analysis
   * @param {Array} candles - Candle data
   * @returns {boolean} True if enough candles
   */
  hasEnoughCandles(candles) {
    const hasEnough = candles && candles.length >= this.config.minCandlesRequired;
    
    if (this.config.simulationAggression.debugOutput) {
      console.log(`🔍 AGGRESSIVE: Candle check - Have ${candles?.length || 0}, Need ${this.config.minCandlesRequired}: ${hasEnough ? 'PASS' : 'FAIL'}`);
    }
    
    return hasEnough;
  }
  
  /**
   * 🛡️ SAFETY CHECK: Determine if it's safe to make aggressive trades
   * @param {Object} currentAnalysis - Current market analysis
   * @returns {boolean} True if safe to trade aggressively
   */
  isSafeToTrade(currentAnalysis) {
    if (!this.config.safetyLimits.enableSafetyChecks) return true;
    
    const currentTime = Date.now();
    
    // Check market volatility
    if (currentAnalysis.volatility > this.config.safetyLimits.volatilityThreshold) {
      console.log(`🛡️ SAFETY BLOCK: Market volatility too high (${(currentAnalysis.volatility * 100).toFixed(1)}%)`);
      return false;
    }
    
    // Check consecutive losses
    if (this.state.consecutiveLosses >= this.config.safetyLimits.maxConsecutiveLosses) {
      console.log(`🛡️ SAFETY BLOCK: Too many consecutive losses (${this.state.consecutiveLosses})`);
      return false;
    }
    
    // Check daily loss limit
    if (this.state.dailyLoss >= this.config.safetyLimits.maxDailyLoss) {
      console.log(`🛡️ SAFETY BLOCK: Daily loss limit reached (${(this.state.dailyLoss * 100).toFixed(1)}%)`);
      return false;
    }
    
    // Check minimum time between trades
    if (this.state.lastTradeTime &&
        currentTime - this.state.lastTradeTime < this.config.safetyLimits.minTimeBetweenTrades) {
      console.log(`🛡️ SAFETY BLOCK: Minimum time between trades not met`);
      return false;
    }
    
    return true;
  }

  /**
   * Perform aggressive analysis to force trading decisions
   * @param {Array} candles - Market candles
   * @param {Object} currentAnalysis - Current analysis
   * @returns {Object} Enhanced analysis with aggressive decisions
   */
  performAggressiveAnalysis(candles, currentAnalysis) {
    if (!this.state.isActive || !candles || candles.length < this.config.minCandlesRequired) {
      return currentAnalysis;
    }
    
    // 🛡️ SAFETY: Check if it's safe to trade before proceeding
    if (!this.isSafeToTrade(currentAnalysis)) {
      this.state.safetyBlocked = true;
      return currentAnalysis; // Return original analysis without aggressive modifications
    }
    
    this.state.safetyBlocked = false;
    this.state.totalDecisions++;
    const currentTime = Date.now();
    
    if (this.config.simulationAggression.debugOutput) {
      console.log(`🔥 AGGRESSIVE ANALYSIS #${this.state.totalDecisions}:`);
      console.log(`   📊 Candles: ${candles.length}`);
      console.log(`   🎯 Original Confidence: ${(currentAnalysis.confidence || 0).toFixed(3)}`);
      console.log(`   💭 Original Decision: ${currentAnalysis.decision || 'none'}`);
    }
    
    // Calculate aggressive indicators
    const rsi = indicators.calculateRSI(candles);
    const macdResult = indicators.calculateMACD(candles);
    const trend = indicators.determineTrend(candles);
    
    // Start with current analysis
    const aggressiveAnalysis = { ...currentAnalysis };
    
    // AGGRESSIVE DECISION LOGIC - Much more sensitive
    let decision = 'hold';
    let confidence = currentAnalysis.confidence || 0;
    let reason = currentAnalysis.reason || 'No signals';
    
    // 1. FORCE FIRST TRADE if enabled
    if (this.config.forceFirstTrade && !this.state.lastTradeTime && 
        currentTime - this.state.startTime >= 5000) { // After 5 seconds
      decision = Math.random() > 0.5 ? 'buy' : 'sell';
      confidence = 0.35;
      reason = 'FORCED FIRST TRADE - Aggressive mode startup';
      this.state.forcedTrades++;
      
      console.log('🚨 FORCING FIRST TRADE - Bot needs to start trading!');
    }
    
    // 2. SAFER RANDOM TRADE CHANCE
    else if (Math.random() < this.config.randomTradeChance && this.shouldAllowRandomTrade()) {
      decision = Math.random() > 0.5 ? 'buy' : 'sell';
      confidence = 0.3 + Math.random() * 0.2; // 0.3-0.5
      reason = 'RANDOM AGGRESSIVE TRADE - Keeping bot active';
      this.state.randomTrades++;
      
      console.log('🎲 RANDOM AGGRESSIVE TRADE triggered (safety validated)!');
    }
    
    // 3. AGGRESSIVE RSI SIGNALS
    else if (rsi > this.config.aggressiveRSI.oversoldThreshold && rsi < 55) {
      decision = 'buy';
      confidence = Math.max(0.3, 0.25 + (50 - rsi) / 100);
      reason = `AGGRESSIVE RSI Buy: ${rsi.toFixed(1)} (relaxed oversold)`;
    }
    else if (rsi < this.config.aggressiveRSI.overboughtThreshold && rsi > 45) {
      decision = 'sell';
      confidence = Math.max(0.3, 0.25 + (rsi - 50) / 100);
      reason = `AGGRESSIVE RSI Sell: ${rsi.toFixed(1)} (relaxed overbought)`;
    }
    
    // 4. AGGRESSIVE MACD SIGNALS
    else if (macdResult.macdLine > macdResult.signalLine && 
             Math.abs(macdResult.macdLine - macdResult.signalLine) > this.config.aggressiveMACD.minimumDivergence) {
      decision = 'buy';
      confidence = Math.max(0.3, 0.25 + Math.abs(macdResult.macdLine) * 10);
      reason = `AGGRESSIVE MACD Buy: Bullish crossover detected`;
    }
    else if (macdResult.macdLine < macdResult.signalLine && 
             Math.abs(macdResult.macdLine - macdResult.signalLine) > this.config.aggressiveMACD.minimumDivergence) {
      decision = 'sell';
      confidence = Math.max(0.3, 0.25 + Math.abs(macdResult.macdLine) * 10);
      reason = `AGGRESSIVE MACD Sell: Bearish crossover detected`;
    }
    
    // 5. TREND-BASED AGGRESSIVE SIGNALS
    else if (trend === 'uptrend') {
      decision = 'buy';
      confidence = 0.35;
      reason = `AGGRESSIVE Trend Buy: Following uptrend`;
    }
    else if (trend === 'downtrend') {
      decision = 'sell';
      confidence = 0.35;
      reason = `AGGRESSIVE Trend Sell: Following downtrend`;
    }
    
    // 6. EMERGENCY TRADE if too long without action
    else if (this.state.lastTradeTime && 
             currentTime - this.state.lastTradeTime > this.config.emergencyTradeTimer) {
      decision = Math.random() > 0.5 ? 'buy' : 'sell';
      confidence = 0.4;
      reason = 'EMERGENCY TRADE - Too long without activity';
      
      console.log('🚨 EMERGENCY TRADE - Bot has been idle too long!');
    }
    
    // 7. CONFIDENCE BOOST - Make sure trades happen
    if (decision !== 'hold' && confidence < this.config.minConfidenceThreshold) {
      const oldConfidence = confidence;
      confidence = this.config.minConfidenceThreshold + 0.05; // Boost above threshold
      reason += ` (confidence boosted from ${oldConfidence.toFixed(3)} to ${confidence.toFixed(3)})`;
    }
    
    // Update analysis with aggressive results
    aggressiveAnalysis.decision = decision;
    aggressiveAnalysis.confidence = confidence;
    aggressiveAnalysis.reason = reason;
    aggressiveAnalysis.rsi = rsi;
    aggressiveAnalysis.macd = macdResult.macdLine;
    aggressiveAnalysis.signal = macdResult.signalLine;
    aggressiveAnalysis.trend = trend;
    aggressiveAnalysis.aggressiveMode = true;
    aggressiveAnalysis.aggressionLevel = this.state.aggressionLevel;
    
    if (this.config.simulationAggression.debugOutput) {
      console.log(`🔥 AGGRESSIVE RESULT:`);
      console.log(`   💭 Decision: ${decision}`);
      console.log(`   🎯 Confidence: ${confidence.toFixed(3)}`);
      console.log(`   📝 Reason: ${reason}`);
      console.log(`   📊 RSI: ${rsi.toFixed(1)} | MACD: ${macdResult.macdLine.toFixed(4)} | Trend: ${trend}`);
    }
    
    return aggressiveAnalysis;
  }
  
  /**
   * Start force trade timer for first trade
   */
  startForceTradeTimer() {
    if (this.forceTradeTimer) return;
    
    console.log(`⏰ Starting force trade timer: ${this.config.forceTradeTimeout / 1000}s`);
    
    this.forceTradeTimer = setTimeout(() => {
      if (this.state.isActive && !this.state.lastTradeTime) {
        console.log('🚨 FORCE TRADE TIMER EXPIRED - Bot must trade now!');
        this.state.aggressionLevel = 2.0; // Double aggression
      }
    }, this.config.forceTradeTimeout);
  }
  
  /**
   * Start emergency timer for trade activity
   */
  startEmergencyTimer() {
    if (this.emergencyTimer) return;
    
    this.emergencyTimer = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastTrade = this.state.lastTradeTime ? 
        currentTime - this.state.lastTradeTime : 
        currentTime - this.state.startTime;
        
      if (timeSinceLastTrade > this.config.emergencyTradeTimer) {
        console.log('🚨 EMERGENCY: Bot idle too long - increasing aggression!');
        this.state.aggressionLevel = Math.min(3.0, this.state.aggressionLevel + 0.5);
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * 🛡️ SAFETY: Check if random trades should be allowed
   * @returns {boolean} True if random trade is safe
   */
  shouldAllowRandomTrade() {
    // Don't allow random trades if we have recent losses
    if (this.state.consecutiveLosses > 0) {
      console.log('🛡️ Random trade blocked due to recent losses');
      return false;
    }
    
    // Don't allow if we're near daily loss limit
    if (this.state.dailyLoss > this.config.safetyLimits.maxDailyLoss * 0.8) {
      console.log('🛡️ Random trade blocked - approaching daily loss limit');
      return false;
    }
    
    return true;
  }

  /**
   * Record that a trade was executed
   * @param {Object} tradeResult - Optional trade result for safety tracking
   */
  recordTrade(tradeResult = null) {
    this.state.lastTradeTime = Date.now();
    this.state.aggressionLevel = Math.max(1.0, this.state.aggressionLevel - 0.2); // Reduce aggression after trade
    
    // 🛡️ SAFETY: Track trade results for safety limits
    if (tradeResult) {
      if (tradeResult.pnl < 0) {
        this.state.consecutiveLosses++;
        this.state.dailyLoss += Math.abs(tradeResult.pnl / tradeResult.balance);
        this.state.lastLossTime = Date.now();
        console.log(`🛡️ Loss recorded: ${this.state.consecutiveLosses} consecutive, ${(this.state.dailyLoss * 100).toFixed(2)}% daily`);
      } else {
        this.state.consecutiveLosses = 0; // Reset on win
        console.log(`✅ Win recorded - consecutive losses reset`);
      }
    }
    
    console.log(`✅ Trade recorded - Aggression level: ${this.state.aggressionLevel.toFixed(1)}`);
  }

  /**
   * 🛡️ SAFETY: Reset daily tracking at start of new day
   */
  resetDailyTracking() {
    const now = new Date();
    const today = now.toDateString();
    
    if (!this.lastResetDate || this.lastResetDate !== today) {
      this.state.dailyLoss = 0;
      this.lastResetDate = today;
      console.log('🛡️ Daily loss tracking reset for new day');
    }
  }
  
  /**
   * Get current aggressive mode status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isActive: this.state.isActive,
      aggressionLevel: this.state.aggressionLevel,
      totalDecisions: this.state.totalDecisions,
      forcedTrades: this.state.forcedTrades,
      randomTrades: this.state.randomTrades,
      timeSinceStart: this.state.startTime ? Date.now() - this.state.startTime : 0,
      timeSinceLastTrade: this.state.lastTradeTime ? Date.now() - this.state.lastTradeTime : null,
      config: this.config
    };
  }
}

module.exports = AggressiveTradingMode;