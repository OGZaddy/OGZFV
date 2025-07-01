// OptimizedTradingBrain.js - Enhanced Trading Engine with Comprehensive Logging
// ========================================================================
// 🧠 ADVANCED TRADING BRAIN - OGZ PRIME VALHALLA EDITION
// ========================================================================
//
// This is the core trading decision engine that:
// - Manages positions and executes trades
// - Integrates with MaxProfitManager for sophisticated exits
// - Captures comprehensive market data for analysis
// - Logs detailed trade information for performance tracking
// - Calculates real-time P&L and risk metrics
//
// Built for: Houston Fund Generation & Financial Freedom
// Author: Trey (OGZPrime Technologies)
// Version: 10.2 Enhanced with Comprehensive Logging
//
// Features:
// ✅ Advanced position management with trailing stops
// ✅ Comprehensive trade logging with all indicators
// ✅ Real-time profit/loss calculation and verification
// ✅ Pattern recognition integration
// ✅ Risk management with position sizing
// ✅ Houston fund progress tracking

const { logTrade } = require('../utils/tradeLogger');
const MaxProfitManager = require('./MaxProfitManager');

/**
 * Enhanced Trading Brain with comprehensive logging and analysis
 * Manages all trading decisions, position management, and performance tracking
 */
class OptimizedTradingBrain {
  /**
   * Initialize the trading brain with account balance and configuration
   * @param {number} balance - Starting account balance
   * @param {Object} config - Configuration options
   */
  constructor(balance = 10000, config = {}) {
    // Account management
    this.balance = balance;
    this.initialBalance = balance;
    this.position = null; // Current open position
    this.tradeHistory = []; // Historical trades
    this.lastTradeResult = null; // Last trade result for quick access
    
    
    // Configuration with intelligent defaults
    this.config = {
      // Risk management
      maxRiskPerTrade: 0.02,           // 2% max risk per trade
      stopLossPercent: 0.02,           // 2% stop loss
      takeProfitPercent: 0.04,         // 4% take profit
      enableTrailingStop: true,        // Enable trailing stops
      
      // Position sizing
      basePositionSize: 0.01,          // 1% base position size
      confidenceScaling: true,         // Scale size by confidence
      maxPositionSize: 0.05,           // 5% max position size
      
      // Performance tracking
      enablePerformanceTracking: true, // Track detailed performance
      enablePatternLearning: true,     // Learn from patterns
      
      // Houston fund tracking
      houstonFundTarget: 25000,        // $25k target for Houston move
      
      // Merge user config
      ...config
    };
    
    // Advanced profit management system
    this.maxProfitManager = new MaxProfitManager({
      enableTieredExits: true,         // Multi-tier profit taking
      enableDynamicTrailing: true,     // Dynamic trailing stops
      enableVolatilityAdaptation: true // Adapt to market volatility
    });
    
    // Performance tracking
    this.sessionStats = {
      tradesCount: 0,
      winsCount: 0,
      lossesCount: 0,
      totalPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      winStreak: 0,
      lossStreak: 0,
      currentStreak: 0,
      currentStreakType: null
    };
    
    // Pattern learning data
    this.patternMemory = new Map();
    this.currentPatternId = null;
    
    // Reference to parent OGZ Prime system for logging
    this.ogzPrime = null;
    
    console.log(`🧠 Enhanced Trading Brain initialized with $${balance.toLocaleString()} balance`);
    console.log(`🎯 Houston Fund Target: $${this.config.houstonFundTarget.toLocaleString()}`);
  }
  

  setCandles(candles) {
  this.candles = candles;
}

  /**
   * Set reference to parent OGZ Prime system for enhanced integration
   * @param {Object} ogzPrime - Reference to main OGZ Prime system
   */
  setOGZPrimeReference(ogzPrime) {
    this.ogzPrime = ogzPrime;
    console.log('🔗 Trading Brain linked to OGZ Prime system');
  }
  
  /**
   * Check if currently holding a position
   * @returns {boolean} True if in position, false otherwise
   */
  isInPosition() {
    return this.position !== null;
  }
  
  /**
   * Get current position information
   * @returns {Object|null} Current position or null if no position
   */
  getCurrentPosition() {
    return this.position;
  }
  
  /**
   * Get account balance
   * @returns {number} Current account balance
   */
  getBalance() {
    return this.balance;
  }
  
  /**
   * Get total number of trades executed
   * @returns {number} Total trades count
   */
  getTotalTrades() {
    return this.tradeHistory.length;
  }
  
  /**
   * Get number of decisions made today (placeholder - would need date tracking)
   * @returns {number} Decisions made today
   */
  getDecisionsToday() {
    // For now, return session trades count as a proxy for decisions
    // This could be enhanced to track actual decision timestamps
    return this.sessionStats.tradesCount;
  }
  
  /**
   * Get comprehensive account status
   * @returns {Object} Account status with performance metrics
   */
  getAccountStatus() {
    const totalReturn = ((this.balance - this.initialBalance) / this.initialBalance) * 100;
    const houstonProgress = (this.balance / this.config.houstonFundTarget) * 100;
    
    return {
      balance: this.balance,
      initialBalance: this.initialBalance,
      totalReturn: totalReturn,
      totalPnL: this.balance - this.initialBalance,
      houstonProgress: houstonProgress,
      houstonRemaining: this.config.houstonFundTarget - this.balance,
      isInPosition: this.isInPosition(),
      position: this.position,
      sessionStats: { ...this.sessionStats },
      tradeCount: this.tradeHistory.length
    };
  }
  
  /**
   * Open a new trading position with comprehensive data capture
   * @param {number} price - Entry price
   * @param {string} direction - 'buy' or 'sell'
   * @param {number} size - Position size
   * @param {number} confidence - Signal confidence (0-5)
   * @param {string} reason - Entry reason/signal description
   * @param {Object} analysisData - Complete market analysis data
   * @returns {boolean} True if position opened successfully
   */
  openPosition(price, direction, size, confidence, reason = '', analysisData = {}) {
    // Prevent multiple positions
    if (this.position) {
      console.log('⚠️ Cannot open position: Already in position');
      return false;
    }
    
    // Validate inputs
    if (!price || price <= 0) {
      console.log('❌ Invalid price for position entry');
      return false;
    }
    
    if (!['buy', 'sell'].includes(direction)) {
      console.log('❌ Invalid direction. Must be "buy" or "sell"');
      return false;
    }
    
    // Calculate position value and validate
    const positionValue = price * size;
    const maxPositionValue = this.balance * this.config.maxPositionSize;
    
    if (positionValue > maxPositionValue) {
      console.log(`⚠️ Position size too large. Max: $${maxPositionValue.toFixed(2)}, Requested: $${positionValue.toFixed(2)}`);
      size = maxPositionValue / price; // Adjust size to maximum allowed
    }
    
    // Create comprehensive position record
    this.position = {
      // Basic position data
      entryPrice: price,
      direction: direction,
      size: size,
      entryTime: new Date(),
      entryTimestamp: Date.now(),
      
      // Trading signals and confidence
      entryConfidence: confidence,
      entryReason: reason,
      
      // Comprehensive market analysis at entry
      entryAnalysis: {
        // Technical indicators
        rsi: analysisData.rsi || 0,
        rsiSignal: this.interpretRSI(analysisData.rsi || 0),
        macd: analysisData.macd || 0,
        macdSignal: analysisData.macdSignal || 0,
        macdHistogram: analysisData.macdHistogram || 0,
        macdCrossover: analysisData.macdCrossover || false,
        
        // Moving averages
        ema20: analysisData.ema20 || 0,
        ema50: analysisData.ema50 || 0,
        ema200: analysisData.ema200 || 0,
        sma20: analysisData.sma20 || 0,
        sma50: analysisData.sma50 || 0,
        
        // Bollinger Bands
        bollingerUpper: analysisData.bollingerUpper || 0,
        bollingerLower: analysisData.bollingerLower || 0,
        bollingerMiddle: analysisData.bollingerMiddle || 0,
        
        // Additional indicators
        stochastic: analysisData.stochastic || 0,
        atr: analysisData.atr || 0,
        adx: analysisData.adx || 0,
        volume: analysisData.volume || 0,
        
        // Market structure
        trend: analysisData.trend || 'unknown',
        trendStrength: analysisData.trendStrength || 0,
        confidence: confidence,
        volatility: analysisData.volatility || 0,
        marketRegime: analysisData.marketRegime || 'normal',
        
        // Support and resistance
        support: analysisData.support || 0,
        resistance: analysisData.resistance || 0,
        fibLevels: analysisData.fibLevels || [],
        keyLevel: analysisData.keyLevel || null,
        levelDistance: analysisData.levelDistance || 0,
        
        // Pattern recognition
        patternType: analysisData.patternType || null,
        patternId: analysisData.patternId || null,
        patternConfidence: analysisData.patternConfidence || 0,
        similarPatterns: analysisData.similarPatterns || 0,
        
        // Multi-timeframe analysis
        timeframeConcurrence: analysisData.timeframeConcurrence || false,
        primaryTimeframe: analysisData.primaryTimeframe || '1m',
        
        // Raw market data for analysis
        candles: analysisData.candles ? analysisData.candles.slice(-10) : [],
        features: analysisData.features || [],
        originalAnalysis: analysisData
      },
      
      // Risk management
      stopLossPrice: this.calculateStopLoss(price, direction),
      takeProfitPrice: this.calculateTakeProfit(price, direction),
      maxRisk: positionValue * this.config.maxRiskPerTrade,
      
      // Performance tracking
      highestPrice: price,  // Track highest price reached
      lowestPrice: price,   // Track lowest price reached
      maxProfitReached: 0,  // Track maximum profit reached
      maxDrawdown: 0,       // Track maximum drawdown
      
      // Profit management state
      profitTiers: [],      // Track which profit tiers have been hit
      partialExitsDone: 0,  // Count of partial exits executed
      
      // Position metadata
      positionId: `pos_${Date.now()}`, // Unique position identifier
      sessionTradeNumber: this.sessionStats.tradesCount + 1
    };
    
    // Start advanced profit management
    this.maxProfitManager.start(price, direction, {
      volatility: analysisData.volatility,
      confidence: confidence,
      marketRegime: analysisData.marketRegime
    });
    
    // Update session statistics
    this.sessionStats.tradesCount++;
    
    // Store pattern data for learning
    if (analysisData.patternType) {
      this.currentPatternId = analysisData.patternId;
      this.storePatternEntry(analysisData);
    }
    
    // Log position opening
    console.log(`🚀 POSITION OPENED:`);
    console.log(`   ${direction.toUpperCase()} @ $${price.toFixed(2)} | Size: ${size.toFixed(6)} | Value: $${positionValue.toFixed(2)}`);
    console.log(`   Confidence: ${confidence.toFixed(2)} | Reason: ${reason}`);
    console.log(`   RSI: ${(analysisData.rsi || 0).toFixed(1)} | Trend: ${analysisData.trend || 'unknown'}`);
    console.log(`   Stop Loss: $${this.position.stopLossPrice.toFixed(2)} | Take Profit: $${this.position.takeProfitPrice.toFixed(2)}`);
    
    return true;
  }
  
  /**
   * Close current position with comprehensive logging and analysis
   * @param {number} price - Exit price
   * @param {string} reason - Exit reason/trigger
   * @param {Object} currentAnalysis - Current market analysis at exit
   * @returns {Object|false} Trade result object or false if no position
   */
  closePosition(price, reason = 'Manual exit', currentAnalysis = {}) {
    // Ensure we have a position to close
    if (!this.position) {
      console.log('⚠️ No position to close');
      return false;
    }
    
    // Calculate comprehensive trade results
    const exitTime = new Date();
    const exitTimestamp = Date.now();
    const holdTime = exitTimestamp - this.position.entryTimestamp;
    
    // Calculate profit/loss with precise math
    const pnl = this.calculatePnL(price);
    const pnlPercent = ((price - this.position.entryPrice) / this.position.entryPrice) * 100;
    const realPercent = pnlPercent; // For verification
    
    // ⚠️ DEBUG: Verify profit calculation math
    console.log(`🔍 PROFIT CALCULATION VERIFICATION:`);
    console.log(`   Entry Price: $${this.position.entryPrice.toFixed(2)}`);
    console.log(`   Exit Price: $${price.toFixed(2)}`);
    console.log(`   Price Difference: $${(price - this.position.entryPrice).toFixed(2)}`);
    console.log(`   Calculated %: ${realPercent.toFixed(2)}%`);
    console.log(`   Raw PnL: $${pnl.toFixed(2)}`);
    
    // Update account balance
    const balanceBefore = this.balance;
    this.balance += pnl;
    const balanceAfter = this.balance;
    
    // Update performance tracking
    this.updateSessionStats(pnl);
    
    // Create comprehensive trade record for logging
    const tradeData = {
      // Basic trade information
      type: this.position.direction,
      entryPrice: this.position.entryPrice,
      exitPrice: price,
      currentPrice: price,
      size: this.position.size,
      
      // Financial results
      pnl: pnl,
      pnlPercent: pnlPercent,
      fees: 0, // Can be enhanced to include actual fees
      netPnl: pnl, // After fees
      
      // Timing information
      entryTime: this.position.entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      holdTime: holdTime,
      
      // Account status
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      
      // Technical indicators at entry (from stored analysis)
      rsi: this.position.entryAnalysis.rsi,
      macd: this.position.entryAnalysis.macd,
      macdSignal: this.position.entryAnalysis.macdSignal,
      macdHistogram: this.position.entryAnalysis.macdHistogram,
      macdCrossover: this.position.entryAnalysis.macdCrossover,
      ema20: this.position.entryAnalysis.ema20,
      ema50: this.position.entryAnalysis.ema50,
      ema200: this.position.entryAnalysis.ema200,
      sma20: this.position.entryAnalysis.sma20,
      sma50: this.position.entryAnalysis.sma50,
      bollingerUpper: this.position.entryAnalysis.bollingerUpper,
      bollingerLower: this.position.entryAnalysis.bollingerLower,
      bollingerMiddle: this.position.entryAnalysis.bollingerMiddle,
      stochastic: this.position.entryAnalysis.stochastic,
      volume: this.position.entryAnalysis.volume,
      atr: this.position.entryAnalysis.atr,
      adx: this.position.entryAnalysis.adx,
      
      // Market analysis
      trend: this.position.entryAnalysis.trend,
      trendStrength: this.position.entryAnalysis.trendStrength,
      confidence: this.position.entryAnalysis.confidence,
      volatility: this.position.entryAnalysis.volatility,
      marketRegime: this.position.entryAnalysis.marketRegime,
      support: this.position.entryAnalysis.support,
      resistance: this.position.entryAnalysis.resistance,
      fibLevels: this.position.entryAnalysis.fibLevels,
      keyLevel: this.position.entryAnalysis.keyLevel,
      levelDistance: this.position.entryAnalysis.levelDistance,
      
      // Entry signal analysis
      entryReason: this.position.entryReason,
      secondaryReasons: this.extractSecondaryReasons(this.position.entryAnalysis),
      signalStrength: this.position.entryConfidence,
      conflictingSignals: this.identifyConflictingSignals(this.position.entryAnalysis),
      patternMatch: this.position.entryAnalysis.patternType,
      patternConfidence: this.position.entryAnalysis.patternConfidence,
      timeframeConcurrence: this.position.entryAnalysis.timeframeConcurrence,
      
      // Exit signal analysis
      exitReason: reason,
      exitType: this.determineExitType(reason),
      profitTier: this.extractProfitTier(reason),
      stopLossPrice: this.position.stopLossPrice,
      takeProfitPrice: this.position.takeProfitPrice,
      trailingStopPrice: currentAnalysis.trailingStopPrice || 0,
      maxProfitReached: this.position.maxProfitReached,
      maxDrawdown: this.position.maxDrawdown,
      
      // Risk management metrics
      positionSize: this.position.size * this.position.entryPrice,
      riskPercent: (Math.abs(pnl) / balanceBefore) * 100,
      riskAmount: this.position.maxRisk,
      rewardRiskRatio: pnl > 0 ? Math.abs(pnl / this.position.maxRisk) : 0,
      maxRisk: this.position.maxRisk,
      actualRisk: Math.abs(Math.min(0, pnl)),
      
      // Pattern recognition data
      patternType: this.position.entryAnalysis.patternType,
      patternId: this.position.entryAnalysis.patternId,
      similarPatterns: this.position.entryAnalysis.similarPatterns,
      patternWinRate: this.getPatternWinRate(this.position.entryAnalysis.patternType),
      patternAvgReturn: this.getPatternAvgReturn(this.position.entryAnalysis.patternType),
      isNewPattern: this.currentPatternId ? false : true,
      
      // Session performance context
      winStreak: this.sessionStats.winStreak,
      lossStreak: this.sessionStats.lossStreak,
      dailyPnL: this.sessionStats.totalPnL + pnl,
      totalTrades: this.sessionStats.tradesCount,
      winRate: this.calculateCurrentWinRate(),
      
      // Houston fund progress
      houstonTarget: this.config.houstonFundTarget,
      houstonCurrent: balanceAfter,
      houstonProgress: (balanceAfter / this.config.houstonFundTarget) * 100,
      houstonRemaining: this.config.houstonFundTarget - balanceAfter,
      daysTrading: this.calculateTradingDays(),
      avgDailyGain: this.calculateAvgDailyGain(),
        
      // Raw analysis data for debugging
      candles: this.position.entryAnalysis.candles,
      features: this.position.entryAnalysis.features,
      originalAnalysis: this.position.entryAnalysis.originalAnalysis
    };
    
    // Store trade result for quick access
    this.lastTradeResult = {
      success: pnl > 0,
      pnl: pnl,
      pnlPercent: pnlPercent,
      entryTime: this.position.entryTime,
      exitTime: exitTime,
      entryPrice: this.position.entryPrice,
      exitPrice: price,
      holdTime: holdTime,
      reason: reason
    };


    // Add to trade history
    this.tradeHistory.push(tradeData);
    
    // Update pattern learning with trade result
    if (this.currentPatternId) {
      this.updatePatternLearning(this.currentPatternId, pnl > 0, pnl, tradeData);
      this.currentPatternId = null;
    }
    
    // Log trade to comprehensive logger
    try {
      logTrade(tradeData);
    } catch (error) {
      console.error('❌ Failed to log trade:', error.message);
    }
    
    // Reset position and profit manager
    this.position = null;
    this.maxProfitManager.reset();
    
    // Display comprehensive trade result
    console.log(`${pnl >= 0 ? '✅' : '❌'} POSITION CLOSED:`);
    console.log(`   Exit @ $${price.toFixed(2)} | P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    console.log(`   Hold Time: ${this.formatHoldTime(holdTime)} | Reason: ${reason}`);
    console.log(`   Balance: $${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)}`);
    console.log(`   Houston Progress: ${((balanceAfter / this.config.houstonFundTarget) * 100).toFixed(1)}%`);
    
    // Process trade with any connected systems
    if (this.ogzPrime) {
      // Update risk manager if available
      if (this.ogzPrime.riskManager) {
     //   this.ogzPrime.riskManager.processTrade(tradeData, balanceAfter);
      }
      
      // Update performance analyzer if available
      if (this.ogzPrime.performanceAnalyzer) {
        this.ogzPrime.performanceAnalyzer.processTrade(tradeData, currentAnalysis);
      }
      
      // Update daily stats in main system
      if (this.ogzPrime.updateDailyStats) {
        this.ogzPrime.updateDailyStats(pnl);
      }
    }
    
    return tradeData;
  }
  
  /**
   * Manage active position with price updates and profit management
   * @param {number} price - Current market price
   * @param {Object} currentAnalysis - Current market analysis
   */
  managePosition(price, currentAnalysis = {}) {
    // Only manage if we have an active position
    if (!this.position) return;
    
    // Update position tracking metrics
    this.updatePositionMetrics(price);
    
    // Update advanced profit management system
    const profitResult = this.maxProfitManager.update(price, {
      volatility: currentAnalysis.volatility,
      trend: currentAnalysis.trend,
      volume: currentAnalysis.volume
    });
    
    // Handle profit management signals
    if (profitResult.action === 'exit') {
      // Full position exit triggered
      this.closePosition(price, profitResult.reason, currentAnalysis);
    } else if (profitResult.action === 'partialExit') {
      // Partial exit triggered
      this.executePartialExit(price, profitResult, currentAnalysis);
    }
    
    // Check for manual stop loss or take profit
    this.checkBasicExitConditions(price, currentAnalysis);
  }
  
  /**
   * Execute partial exit of position
   * @param {number} price - Current price
   * @param {Object} exitResult - Exit result from profit manager
   * @param {Object} currentAnalysis - Current market analysis
   */
  executePartialExit(price, exitResult, currentAnalysis) {
    if (!this.position) return;
    
    // Calculate partial exit amount
    const partialSize = this.position.size * exitResult.exitSize;
    const partialPnl = (price - this.position.entryPrice) * partialSize;
    
    // Update balance and position size
    this.balance += partialPnl;
    this.position.size -= partialSize;
    this.position.partialExitsDone++;
    
    // Track which profit tier was hit
    if (exitResult.tier) {
      this.position.profitTiers.push({
        tier: exitResult.tier,
        price: price,
        size: partialSize,
        pnl: partialPnl,
        timestamp: Date.now()
      });
    }
    
    console.log(`🔹 PARTIAL EXIT: Tier ${exitResult.tier || 'unknown'} @ $${price.toFixed(2)}`);
    console.log(`   Size: ${partialSize.toFixed(6)} | P&L: +$${partialPnl.toFixed(2)}`);
    console.log(`   Remaining Position: ${this.position.size.toFixed(6)} | Balance: $${this.balance.toFixed(2)}`);
  }
  
  /**
   * Check basic exit conditions (stop loss, take profit)
   * @param {number} price - Current price
   * @param {Object} currentAnalysis - Current market analysis
   */
  checkBasicExitConditions(price, currentAnalysis) {
    if (!this.position) return;
    
    // Check stop loss
    if (this.position.direction === 'buy' && price <= this.position.stopLossPrice) {
      this.closePosition(price, 'Stop Loss triggered', currentAnalysis);
      return;
    }
    
    if (this.position.direction === 'sell' && price >= this.position.stopLossPrice) {
      this.closePosition(price, 'Stop Loss triggered', currentAnalysis);
      return;
    }
    
    // Check take profit
    if (this.position.direction === 'buy' && price >= this.position.takeProfitPrice) {
      this.closePosition(price, 'Take Profit triggered', currentAnalysis);
      return;
    }
    
    if (this.position.direction === 'sell' && price <= this.position.takeProfitPrice) {
      this.closePosition(price, 'Take Profit triggered', currentAnalysis);
      return;
    }
  }
  
  /**
   * Update position tracking metrics
   * @param {number} price - Current price
   */
  updatePositionMetrics(price) {
    if (!this.position) return;
    
    // Update highest and lowest prices reached
    this.position.highestPrice = Math.max(this.position.highestPrice, price);
    this.position.lowestPrice = Math.min(this.position.lowestPrice, price);
    
    // Calculate and update maximum profit reached
    const currentPnl = this.calculatePnL(price);
    this.position.maxProfitReached = Math.max(this.position.maxProfitReached, currentPnl);
    
    // Calculate and update maximum drawdown
    const drawdownFromPeak = this.position.maxProfitReached - currentPnl;
    this.position.maxDrawdown = Math.max(this.position.maxDrawdown, drawdownFromPeak);
  }
  
  // ========================================================================
  // CALCULATION AND UTILITY METHODS
  // ========================================================================
  
  /**
   * Calculate profit/loss for current position at given price
   * @param {number} price - Current/exit price
   * @returns {number} Calculated P&L
   */
  calculatePnL(price) {
    if (!this.position) return 0;
    
    const diff = this.position.direction === 'buy'
      ? price - this.position.entryPrice
      : this.position.entryPrice - price;
      
    return diff * this.position.size;
  }
  
  /**
   * Calculate position size based on risk parameters and confidence
   * @param {number} price - Entry price
   * @param {number} confidence - Signal confidence (0-5)
   * @param {Object} analysisData - Market analysis data
   * @returns {number} Calculated position size
   */
  calculatePositionSize(price, confidence = 1, analysisData = {}) {
    // Base risk amount
    const baseRisk = this.balance * this.config.basePositionSize;
    
    // Scale by confidence if enabled
    let scaledRisk = baseRisk;
    if (this.config.confidenceScaling) {
      const confidenceMultiplier = Math.max(0.1, Math.min(2.0, confidence / 2.5));
      scaledRisk = baseRisk * confidenceMultiplier;
    }
    
    // Adjust for volatility if available
    if (analysisData.volatility) {
      const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / analysisData.volatility));
      scaledRisk *= volatilityAdjustment;
    }
    
    // Ensure maximum position size limits
    const maxPositionValue = this.balance * this.config.maxPositionSize;
    const adjustedRisk = Math.min(scaledRisk, maxPositionValue);
    
    return adjustedRisk / price;
  }
  
  /**
   * Calculate stop loss price
   * @param {number} entryPrice - Entry price
   * @param {string} direction - Position direction
   * @returns {number} Stop loss price
   */
  calculateStopLoss(entryPrice, direction) {
    const stopDistance = entryPrice * this.config.stopLossPercent;
    return direction === 'buy' 
      ? entryPrice - stopDistance 
      : entryPrice + stopDistance;
  }
  
  /**
   * Calculate take profit price
   * @param {number} entryPrice - Entry price
   * @param {string} direction - Position direction
   * @returns {number} Take profit price
   */
  calculateTakeProfit(entryPrice, direction) {
    const profitDistance = entryPrice * this.config.takeProfitPercent;
    return direction === 'buy' 
      ? entryPrice + profitDistance 
      : entryPrice - profitDistance;
  }
  
  // ========================================================================
  // ANALYSIS AND LEARNING METHODS
  // ========================================================================
  
  /**
   * Interpret RSI value into signal category
   * @param {number} rsi - RSI value
   * @returns {string} RSI interpretation
   */
  interpretRSI(rsi) {
    if (rsi >= 70) return 'overbought';
    if (rsi <= 30) return 'oversold';
    if (rsi >= 60) return 'bullish';
    if (rsi <= 40) return 'bearish';
    return 'neutral';
  }
  
  /**
   * Determine exit type from reason string
   * @param {string} reason - Exit reason
   * @returns {string} Exit type category
   */
  determineExitType(reason) {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('stop')) return 'stop_loss';
    if (reasonLower.includes('profit') || reasonLower.includes('tier')) return 'take_profit';
    if (reasonLower.includes('trailing')) return 'trailing_stop';
    if (reasonLower.includes('signal')) return 'signal';
    return 'manual';
  }
  
  /**
   * Extract profit tier number from exit reason
   * @param {string} reason - Exit reason
   * @returns {number|null} Profit tier number
   */
  extractProfitTier(reason) {
    const tierMatch = reason.match(/tier\s*(\d+)/i);
    return tierMatch ? parseInt(tierMatch[1]) : null;
  }
  
  /**
   * Extract secondary reasons from analysis
   * @param {Object} analysis - Market analysis
   * @returns {Array} Array of secondary reasons
   */
  extractSecondaryReasons(analysis) {
    const reasons = [];
    
    if (analysis.macdCrossover) reasons.push('MACD crossover');
    if (analysis.rsi <= 30) reasons.push('RSI oversold');
    if (analysis.rsi >= 70) reasons.push('RSI overbought');
    if (analysis.trend === 'uptrend') reasons.push('Uptrend alignment');
    if (analysis.trend === 'downtrend') reasons.push('Downtrend alignment');
    if (analysis.keyLevel) reasons.push('Key level proximity');
    
    return reasons;
  }
  
  /**
   * Identify conflicting signals in analysis
   * @param {Object} analysis - Market analysis
   * @returns {Array} Array of conflicting signals
   */
  identifyConflictingSignals(analysis) {
    const conflicts = [];
    
    // RSI vs Trend conflicts
    if (analysis.rsi >= 70 && analysis.trend === 'uptrend') {
      conflicts.push('RSI overbought but trend bullish');
    }
    if (analysis.rsi <= 30 && analysis.trend === 'downtrend') {
      conflicts.push('RSI oversold but trend bearish');
    }
    
    // MACD vs Price action conflicts
    if (analysis.macd < 0 && analysis.trend === 'uptrend') {
      conflicts.push('MACD bearish but price uptrending');
    }
    
    return conflicts;
  }
  
  // ========================================================================
  // PERFORMANCE TRACKING METHODS
  // ========================================================================
  
  /**
   * Update session statistics with trade result
   * @param {number} pnl - Trade profit/loss
   */
  updateSessionStats(pnl) {
    this.sessionStats.totalPnL += pnl;
    
    if (pnl > 0) {
      this.sessionStats.winsCount++;
      this.sessionStats.bestTrade = Math.max(this.sessionStats.bestTrade, pnl);
      
      // Update win streak
      if (this.sessionStats.currentStreakType === 'win') {
        this.sessionStats.currentStreak++;
      } else {
        this.sessionStats.currentStreak = 1;
        this.sessionStats.currentStreakType = 'win';
      }
      this.sessionStats.winStreak = Math.max(this.sessionStats.winStreak, this.sessionStats.currentStreak);
      
    } else if (pnl < 0) {
      this.sessionStats.lossesCount++;
      this.sessionStats.worstTrade = Math.min(this.sessionStats.worstTrade, pnl);
      
      // Update loss streak
      if (this.sessionStats.currentStreakType === 'loss') {
        this.sessionStats.currentStreak++;
      } else {
        this.sessionStats.currentStreak = 1;
        this.sessionStats.currentStreakType = 'loss';
      }
      this.sessionStats.lossStreak = Math.max(this.sessionStats.lossStreak, this.sessionStats.currentStreak);
    }
  }
  
  /**
   * Calculate current win rate
   * @returns {number} Win rate percentage
   */
  calculateCurrentWinRate() {
    const totalTrades = this.sessionStats.winsCount + this.sessionStats.lossesCount;
    return totalTrades > 0 ? (this.sessionStats.winsCount / totalTrades) * 100 : 0;
  }
  
  /**
   * Calculate number of trading days
   * @returns {number} Number of trading days
   */
  calculateTradingDays() {
    // This would be enhanced to track actual trading start date
    return 1; // Placeholder - should track from session start
  }
  
  /**
   * Calculate average daily gain
   * @returns {number} Average daily gain
   */
  calculateAvgDailyGain() {
    const days = this.calculateTradingDays();
    return days > 0 ? this.sessionStats.totalPnL / days : 0;
  }
  
  /**
   * Format hold time in human readable format
   * @param {number} holdTimeMs - Hold time in milliseconds
   * @returns {string} Formatted hold time
   */
  formatHoldTime(holdTimeMs) {
    if (!holdTimeMs) return '0s';
    
    const seconds = Math.floor(holdTimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  // ========================================================================
  // PATTERN LEARNING METHODS (PLACEHOLDER FOR FUTURE ENHANCEMENT)
  // ========================================================================
  
  /**
   * Store pattern entry data for learning
   * @param {Object} analysisData - Analysis data with pattern information
   */
  storePatternEntry(analysisData) {
    // Placeholder for pattern learning system
    // This would store pattern data for machine learning
  }
  
  /**
   * Update pattern learning with trade result
   * @param {string} patternId - Pattern identifier
   * @param {boolean} wasWin - Whether trade was profitable
   * @param {number} pnl - Profit/loss amount
   * @param {Object} tradeData - Complete trade data
   */
  updatePatternLearning(patternId, wasWin, pnl, tradeData) {
    // Placeholder for pattern learning system
    // This would update pattern success rates and learning
  }
  
  /**
   * Get pattern win rate
   * @param {string} patternType - Pattern type
   * @returns {number} Pattern win rate percentage
   */
  getPatternWinRate(patternType) {
    // Placeholder - would query pattern learning database
    return 0;
  }
  
  /**
   * Get pattern average return
   * @param {string} patternType - Pattern type
   * @returns {number} Pattern average return percentage
   */
  getPatternAvgReturn(patternType) {
    // Placeholder - would query pattern learning database
    return 0;
  }
  
  // ========================================================================
  // LEGACY COMPATIBILITY METHODS
  // ========================================================================
  
  /**
   * Process analysis result (legacy compatibility)
   * @param {Object} analysis - Analysis result
   * @param {number} price - Current price
   */
  processAnalysis(analysis, price) {
    // Update position if we have one
    if (this.isInPosition()) {
      this.managePosition(price, analysis);
    }
    
    // Check for new position entry (AGGRESSIVE: lowered confidence threshold)
    if (!this.isInPosition() && analysis.decision !== 'hold' && analysis.confidence >= 0.3) {
      const direction = analysis.decision === 'buy' ? 'buy' : 'sell';
      const size = this.calculatePositionSize(price, analysis.confidence, analysis);
      this.openPosition(price, direction, size, analysis.confidence, analysis.reason, analysis);
    }
  }
}

// Export the enhanced trading brain
module.exports = { OptimizedTradingBrain };