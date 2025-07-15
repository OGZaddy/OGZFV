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
      // Risk management - ENHANCED WITH BREAKEVEN WITHDRAWAL + LOOSE TRAILING
      maxRiskPerTrade: 0.02,           // 2% max risk per trade
      stopLossPercent: 0.02,           // 2% stop loss
      takeProfitPercent: 0.04,         // 4% take profit
      enableTrailingStop: true,        // Enable trailing stops
      trailingStopPercent: 0.035,      // 3.5% trailing stop distance (MUCH LOOSER)
      trailingStopActivation: 0.025,   // Activate trailing after 2.5% profit
      profitProtectionLevel: 0.015,    // Lock in 1.5% profit minimum
      dynamicTrailingAdjustment: true, // Adjust trailing based on volatility
      
      // 💰 BREAKEVEN WITHDRAWAL SYSTEM
      enableBreakevenWithdrawal: true, // Auto-withdraw at breakeven
      breakevenTrigger: 0.005,         // 0.5% profit triggers breakeven withdrawal
      breakevenPercentage: 0.50,       // Withdraw 50% of position at breakeven
      postBreakevenTrailing: 0.05,     // 5% trailing after breakeven withdrawal (VERY LOOSE)
      freeProfitMode: false,           // Track if position is in "free profit" mode
      
      // Position sizing - VOLATILITY ENHANCED
      basePositionSize: 0.01,          // 1% base position size
      confidenceScaling: true,         // Scale size by confidence
      maxPositionSize: 0.05,           // 5% max position size
      volatilityScaling: true,         // Scale size based on volatility
      lowVolatilityMultiplier: 1.5,    // Increase size in low volatility
      highVolatilityMultiplier: 0.6,   // Reduce size in high volatility
      volatilityThresholds: {
        low: 0.015,                    // 1.5% volatility threshold
        high: 0.035                    // 3.5% volatility threshold
      },
      
      // 🛡️ ENHANCED CONFIDENCE THRESHOLDS (Win Rate Optimized)
      minConfidenceThreshold: 0.45,   // ADJUSTED: 45% minimum confidence for live trading
      maxConfidenceThreshold: 0.95,   // ENHANCED: 95% maximum confidence for high-quality signals
      dynamicConfidenceAdjustment: true, // Enable dynamic confidence based on performance
      confidencePenalty: 0.1,         // Reduce confidence after losses
      confidenceBoost: 0.05,          // Increase confidence after wins
      enableSafetyValidation: true,    // Enable safety net validation
      enablePerformanceTracking: true, // Enable performance validator
      
      // Performance tracking
      enablePatternLearning: true,     // Learn from patterns
      
      // Houston fund tracking
      houstonFundTarget: 25000,        // $25k target for Houston move
      
      // Multi-asset support - PRODUCTION READY
      supportedAssets: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'],
      currentAsset: 'BTC-USD',         // Default asset
      assetSpecificConfidence: {
        'BTC-USD': 0.65,               // Standard confidence for BTC
        'ETH-USD': 0.70,               // Slightly higher for ETH volatility
        'SOL-USD': 0.75,               // Higher for SOL volatility
        'ADA-USD': 0.68                // Standard for ADA
      },
      assetSpecificRisk: {
        'BTC-USD': 0.02,               // 2% risk for BTC
        'ETH-USD': 0.018,              // 1.8% risk for ETH
        'SOL-USD': 0.015,              // 1.5% risk for SOL (more volatile)
        'ADA-USD': 0.022               // 2.2% risk for ADA
      },
      
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
    
    // 🚀 SCALPER-SPECIFIC: FEE-AWARE Micro-profit and quick exit system
    this.scalperConfig = {
      microProfitThreshold: 0.005,     // 0.5% FEE-AWARE micro-profit target
      quickProfitThreshold: 0.008,     // 0.8% FEE-AWARE quick profit target
      momentumShiftThreshold: 0.15,    // 15% momentum loss triggers exit
      tightStopMultiplier: 0.5,        // 50% tighter stops for scalping
      maxHoldTime: 300000,             // 5 minutes max hold time (300 seconds)
      entryMomentum: null,             // Track entry momentum for comparison
      lastMomentumCheck: 0,            // Throttle momentum checks to every 5 seconds
      scalperModeActive: false         // Track if scalper mode is active
    };
    
    // 💰 FEE-AWARE TRADING: Critical for profitability
    this.feeConfig = {
      maker: 0.0010,                   // 0.10% maker fee
      taker: 0.0015,                   // 0.15% taker fee
      slippage: 0.0005,                // 0.05% estimated slippage
      totalRoundTrip: 0.0035,          // 0.35% total cost per round trip
      safetyBuffer: 0.001              // 0.10% safety buffer
    };
    
    // Reference to parent OGZ Prime system for logging
    this.ogzPrime = null;
    
    // Quantum Position Sizer reference (set by OGZ Prime)
    this.quantumPositionSizer = null;
    
    // 🛡️ SAFETY SYSTEMS: References to new safety components
    this.tradingSafetyNet = null;     // Emergency circuit breakers
    this.performanceValidator = null; // Component profitability tracking
    
    // 🛡️ ENHANCED RISK MANAGEMENT - Loss Limits & Emergency Controls
    this.riskLimits = {
      dailyLossLimit: balance * 0.05,    // 5% daily loss limit
      weeklyLossLimit: balance * 0.15,   // 15% weekly loss limit
      monthlyLossLimit: balance * 0.30,  // 30% monthly loss limit
      maxDrawdownLimit: balance * 0.20,  // 20% maximum drawdown
      emergencyStopTrigger: balance * 0.10, // 10% loss triggers emergency stop
      
      // Loss tracking
      dailyLosses: 0,
      weeklyLosses: 0,
      monthlyLosses: 0,
      currentDrawdown: 0,
      peakBalance: balance,
      
      // Time tracking for limits
      dayStartTime: new Date().setHours(0,0,0,0),
      weekStartTime: this.getWeekStart(),
      monthStartTime: new Date().setDate(1),
      
      // Emergency controls
      emergencyStopActive: false,
      emergencyStopReason: null,
      tradingHalted: false,
      haltReason: null,
      
      // Recovery mechanisms
      accountRecoveryMode: false,
      recoveryStartBalance: 0,
      recoveryTargetReached: false
    };
    
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
   * Set reference to Quantum Position Sizer for advanced position sizing
   * @param {QuantumPositionSizer} quantumPositionSizer - Quantum position sizer instance
   */
  setQuantumPositionSizer(quantumPositionSizer) {
    this.quantumPositionSizer = quantumPositionSizer;
    console.log('⚛️ Trading Brain linked to Quantum Position Sizer');
  }
  
  /**
   * 🛡️ Set reference to Trading Safety Net for emergency circuit breakers
   * @param {TradingSafetyNet} tradingSafetyNet - Trading safety net instance
   */
  setTradingSafetyNet(tradingSafetyNet) {
    this.tradingSafetyNet = tradingSafetyNet;
    console.log('🛡️ Trading Brain linked to Safety Net');
  }
  
  /**
   * 📊 Set reference to Performance Validator for component tracking
   * @param {PerformanceValidator} performanceValidator - Performance validator instance
   */
  setPerformanceValidator(performanceValidator) {
    this.performanceValidator = performanceValidator;
    console.log('📊 Trading Brain linked to Performance Validator');
  }
  
  /**
   * 🚀 SCALPER-SPECIFIC: Activate FEE-AWARE scalper mode with profile settings
   * @param {Object} profileSettings - Scalper profile configuration
   */
  activateScalperMode(profileSettings = {}) {
    this.scalperConfig.scalperModeActive = true;
    
    // Load fee-aware settings from profile
    if (profileSettings.feeAwareProfitTargets) {
      this.scalperConfig.microProfitThreshold = profileSettings.feeAwareProfitTargets.microProfitThreshold || 0.005;
      this.scalperConfig.quickProfitThreshold = profileSettings.feeAwareProfitTargets.quickProfitThreshold || 0.008;
    }
    
    // Load fee configuration
    if (profileSettings.fees) {
      this.feeConfig = { ...this.feeConfig, ...profileSettings.fees };
    }
    
    // Override with specific settings if provided
    if (profileSettings.enableMicroProfits) {
      this.scalperConfig.microProfitThreshold = profileSettings.microProfitTarget || this.scalperConfig.microProfitThreshold;
    }
    if (profileSettings.enableQuickExits) {
      this.scalperConfig.quickProfitThreshold = profileSettings.quickProfitTarget || this.scalperConfig.quickProfitThreshold;
    }
    if (profileSettings.maxHoldTimeSeconds) {
      this.scalperConfig.maxHoldTime = profileSettings.maxHoldTimeSeconds * 1000;
    }
    
    console.log('🚀 FEE-AWARE SCALPER MODE ACTIVATED!');
    console.log(`   💰 Micro-Profit: ${(this.scalperConfig.microProfitThreshold * 100).toFixed(1)}% (was 0.3% - DEATH TRAP!)` );
    console.log(`   ⚡ Quick-Profit: ${(this.scalperConfig.quickProfitThreshold * 100).toFixed(1)}% (was 0.5% - BARELY SAFE!)`);
    console.log(`   💸 Total Fees: ${(this.feeConfig.totalRoundTrip * 100).toFixed(2)}% per round trip`);
    console.log(`   🛡️ Net Profit: ${((this.scalperConfig.microProfitThreshold - this.feeConfig.totalRoundTrip) * 100).toFixed(2)}% micro, ${((this.scalperConfig.quickProfitThreshold - this.feeConfig.totalRoundTrip) * 100).toFixed(2)}% quick`);
    console.log(`   🕒 Max Hold: ${this.scalperConfig.maxHoldTime / 1000}s`);
    console.log(`   🔴 Tight Stops: ${this.scalperConfig.tightStopMultiplier * 100}% of normal`);
  }
  
  /**
   * 🚀 SCALPER-SPECIFIC: Deactivate scalper mode
   */
  deactivateScalperMode() {
    this.scalperConfig.scalperModeActive = false;
    this.scalperConfig.entryMomentum = null;
    console.log('⏹️ Scalper mode deactivated');
  }
  
  /**
   * 💰 BREAKEVEN WITHDRAWAL: Check if breakeven withdrawal should be executed
   * @param {number} price - Current market price
   * @param {Object} currentAnalysis - Current market analysis
   * @returns {Object|null} Breakeven action result
   */
  checkBreakevenWithdrawal(price, currentAnalysis) {
    if (!this.position || this.position.breakevenWithdrawn) return null;
    
    const currentPnL = this.calculatePnL(price);
    const pnlPercent = Math.abs(currentPnL / (this.position.entryPrice * this.position.size));
    
    // Check if we've hit the breakeven trigger threshold
    if (currentPnL > 0 && pnlPercent >= this.config.breakevenTrigger) {
      console.log(`💰 BREAKEVEN TRIGGER ACTIVATED: ${(pnlPercent * 100).toFixed(2)}% profit reached`);
      
      return {
        action: 'withdraw',
        currentPnL: currentPnL,
        pnlPercent: pnlPercent,
        withdrawalSize: this.position.size * this.config.breakevenPercentage,
        remainingSize: this.position.size * (1 - this.config.breakevenPercentage),
        withdrawalValue: currentPnL * this.config.breakevenPercentage,
        reason: `Breakeven withdrawal at ${(pnlPercent * 100).toFixed(2)}% profit`
      };
    }
    
    return null;
  }
  
  /**
   * 💰 BREAKEVEN WITHDRAWAL: Execute the breakeven withdrawal
   * @param {number} price - Current market price
   * @param {Object} breakevenAction - Breakeven action from check
   * @param {Object} currentAnalysis - Current market analysis
   */
  executeBreakevenWithdrawal(price, breakevenAction, currentAnalysis) {
    if (!this.position || this.position.breakevenWithdrawn) return;
    
    // Calculate withdrawal details
    const withdrawalSize = breakevenAction.withdrawalSize;
    const withdrawalPnL = (price - this.position.entryPrice) * withdrawalSize;
    const withdrawalFees = withdrawalSize * this.position.entryPrice * this.feeConfig.totalRoundTrip;
    const netWithdrawal = withdrawalPnL - withdrawalFees;
    
    // Update account balance with withdrawal
    this.balance += netWithdrawal;
    
    // Update position to reflect partial exit
    this.position.size = breakevenAction.remainingSize;
    this.position.breakevenWithdrawn = true;
    this.position.breakevenWithdrawalPrice = price;
    this.position.breakevenWithdrawalAmount = netWithdrawal;
    this.position.freeProfitMode = true;
    
    // Adjust stop loss to breakeven for remaining position
    this.position.stopLossPrice = this.position.entryPrice;
    
    // Switch to MUCH LOOSER trailing stops for the free profit portion
    this.position.postBreakevenTrailing = true;
    
    console.log(`💰 BREAKEVEN WITHDRAWAL EXECUTED!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`💸 WITHDRAWAL: $${netWithdrawal.toFixed(2)} (${(this.config.breakevenPercentage * 100).toFixed(0)}% of position)`);
    console.log(`🎯 REMAINING SIZE: ${this.position.size.toFixed(6)} shares (NOW 100% FREE PROFIT)`);
    console.log(`🛡️ STOP LOSS: Moved to breakeven at $${this.position.entryPrice.toFixed(2)}`);
    console.log(`📈 TRAILING STOPS: Now ${(this.config.postBreakevenTrailing * 100).toFixed(1)}% (VERY LOOSE for max profit)`);
    console.log(`💳 BALANCE: +$${netWithdrawal.toFixed(2)} → $${this.balance.toFixed(2)}`);
    console.log(`🚀 FREE PROFIT MODE: Everything from here is pure profit!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // Record partial exit in trade history for tracking
    this.tradeHistory.push({
      type: 'partial_exit_breakeven',
      exitPrice: price,
      size: withdrawalSize,
      pnl: netWithdrawal,
      timestamp: new Date().toISOString(),
      reason: 'Breakeven withdrawal - securing initial capital',
      balanceAfter: this.balance,
      remainingPositionSize: this.position.size
    });
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
    
    // 🛡️ ENHANCED SAFETY: Validate confidence thresholds
    if (confidence < this.config.minConfidenceThreshold) {
      console.log(`🛡️ Position blocked: Confidence ${(confidence * 100).toFixed(1)}% below minimum ${(this.config.minConfidenceThreshold * 100).toFixed(1)}%`);
      return false;
    }
    
    if (confidence > this.config.maxConfidenceThreshold) {
      console.log(`🛡️ Confidence capped: ${(confidence * 100).toFixed(1)}% reduced to ${(this.config.maxConfidenceThreshold * 100).toFixed(1)}% to prevent overconfidence`);
      confidence = this.config.maxConfidenceThreshold;
    }
    
    // 🛡️ SAFETY NET: Validate trade with safety systems
    if (this.config.enableSafetyValidation && this.tradingSafetyNet) {
      const tradeRequest = {
        price,
        direction,
        size,
        confidence,
        reason
      };
      
      const safetyResult = this.tradingSafetyNet.validateTrade(tradeRequest, analysisData);
      if (!safetyResult.approved) {
        console.log(`🛡️ TRADE BLOCKED by Safety Net: ${safetyResult.reason}`);
        return false;
      }
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
      sessionTradeNumber: this.sessionStats.tradesCount + 1,
      
      // 💰 BREAKEVEN WITHDRAWAL TRACKING
      breakevenWithdrawn: false,        // Track if breakeven withdrawal was executed
      breakevenWithdrawalPrice: 0,      // Price at which breakeven withdrawal occurred
      breakevenWithdrawalAmount: 0,     // Amount withdrawn at breakeven
      originalSize: size,               // Original position size before any withdrawals
      freeProfitMode: false            // Track if position is now in "free profit" mode
    };
    
    // 🚀 SCALPER-SPECIFIC: Capture entry momentum for shift detection
    if (this.scalperConfig.scalperModeActive) {
      this.scalperConfig.entryMomentum = {
        rsi: analysisData.rsi || 50,
        macd: analysisData.macd || 0,
        volume: analysisData.volume || 0,
        trend: analysisData.trend || 'neutral',
        capturedAt: Date.now()
      };
    }
    
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
    
    // 🔥 AGGRESSIVE MODE: Notify that a trade was executed to stop infinite "FORCE FIRST TRADE" loop
    if (this.ogzPrime && this.ogzPrime.aggressiveTradingMode && this.ogzPrime.aggressiveTradingMode.isActive()) {
      this.ogzPrime.aggressiveTradingMode.recordTrade();
      console.log('🔥 AGGRESSIVE MODE: Trade recorded - stopping force trade loop');
    }
    
    // 📊 PERFORMANCE TRACKING: Record trade initiation
    if (this.config.enablePerformanceTracking && this.performanceValidator) {
      const involvedComponents = this.extractInvolvedComponents(reason, analysisData);
      // Note: We'll record the full trade result in closePosition
      console.log(`📊 Trade initiated - Components: [${involvedComponents.join(', ')}]`);
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
    
    // Removed: High-frequency profit calculation verification logs
    
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
    
    // 🛡️ SAFETY NET: Update trade result for safety tracking
    if (this.tradingSafetyNet) {
      this.tradingSafetyNet.updateTradeResult({
        pnl: pnl,
        balance: balanceAfter,
        timestamp: exitTimestamp,
        holdTime: holdTime,
        direction: this.position.direction
      });
    }
    
    // 📊 PERFORMANCE VALIDATOR: Record trade performance by component
    if (this.performanceValidator) {
      const involvedComponents = this.extractInvolvedComponents(this.position.entryReason, this.position.entryAnalysis);
      this.performanceValidator.recordTrade({
        pnl: pnl,
        size: this.position.size,
        duration: holdTime,
        fees: 0, // Can be enhanced with actual fees
        strategy: this.position.entryReason,
        timeframe: this.position.entryAnalysis.primaryTimeframe || '1m',
        marketCondition: this.classifyMarketCondition(this.position.entryAnalysis),
        metadata: {
          entryPrice: this.position.entryPrice,
          exitPrice: price,
          confidence: this.position.entryConfidence,
          reason: reason
        }
      }, involvedComponents);
    }
    
    // Reset position and profit manager
    this.position = null;
    this.maxProfitManager.reset();
    
    // Display comprehensive trade result with enhanced PnL tracking
    console.log(`\n${pnl >= 0 ? '✅ PROFIT' : '❌ LOSS'} TRADE COMPLETED:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`💰 TRADE P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`);
    console.log(`📈 Entry: $${this.position.entryPrice.toFixed(2)} → Exit: $${price.toFixed(2)}`);
    console.log(`⏰ Hold Time: ${this.formatHoldTime(holdTime)} | Exit Reason: ${reason}`);
    console.log(`💳 Account Balance: $${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)}`);
    console.log(`📊 Session P&L: $${this.sessionStats.totalPnL.toFixed(2)} | Total Trades: ${this.sessionStats.tradesCount}`);
    console.log(`🎯 Houston Progress: ${((balanceAfter / this.config.houstonFundTarget) * 100).toFixed(1)}% ($${(this.config.houstonFundTarget - balanceAfter).toFixed(0)} remaining)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
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
    
    // 🚀 SCALPER-SPECIFIC: Check for micro-profits and quick exits FIRST
    if (this.scalperConfig.scalperModeActive) {
      const scalperAction = this.checkScalperExitConditions(price, currentAnalysis);
      if (scalperAction) {
        this.closePosition(price, scalperAction.reason, currentAnalysis);
        return; // Exit early - scalper takes priority
      }
    }
    
    // 💰 BREAKEVEN WITHDRAWAL: Check for breakeven withdrawal opportunity
    if (this.config.enableBreakevenWithdrawal && !this.position.breakevenWithdrawn) {
      const breakevenAction = this.checkBreakevenWithdrawal(price, currentAnalysis);
      if (breakevenAction) {
        this.executeBreakevenWithdrawal(price, breakevenAction, currentAnalysis);
        return; // Continue managing the remaining position
      }
    }
    
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
    
    // Check for manual stop loss or take profit with FREE PROFIT ADJUSTMENTS
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
    
    // Removed: High-frequency partial exit logging
  }
  
  /**
   * 🚀 SCALPER-SPECIFIC: Check FEE-AWARE scalper exit conditions (micro-profits, quick exits)
   * @param {number} price - Current price
   * @param {Object} currentAnalysis - Current market analysis
   * @returns {Object|null} Exit action or null
   */
  checkScalperExitConditions(price, currentAnalysis) {
    if (!this.position) return null;
    
    const currentTime = Date.now();
    const holdTime = currentTime - this.position.entryTimestamp;
    const currentPnL = this.calculatePnL(price);
    const pnlPercent = Math.abs(currentPnL / (this.position.entryPrice * this.position.size));
    
    // 💰 FEE-AWARE MICRO-PROFIT TAKING: 0.5%+ profits (after 0.35% fees = 0.15% net)
    if (this.isProfitTargetMet(pnlPercent, this.scalperConfig.microProfitThreshold) && currentPnL > 0) {
      const netProfit = this.calculateNetProfit(currentPnL);
      return {
        action: 'exit',
        reason: `FEE-AWARE Micro-Profit: ${(pnlPercent * 100).toFixed(2)}% gross, ${((netProfit / (this.position.entryPrice * this.position.size)) * 100).toFixed(2)}% net in ${this.formatHoldTime(holdTime)}`
      };
    }
    
    // ⚡ FEE-AWARE QUICK PROFIT TAKING: 0.8%+ profits (after 0.35% fees = 0.45% net)
    if (this.isProfitTargetMet(pnlPercent, this.scalperConfig.quickProfitThreshold) && currentPnL > 0) {
      const netProfit = this.calculateNetProfit(currentPnL);
      return {
        action: 'exit',
        reason: `FEE-AWARE Quick-Profit: ${(pnlPercent * 100).toFixed(2)}% gross, ${((netProfit / (this.position.entryPrice * this.position.size)) * 100).toFixed(2)}% net FAST EXIT`
      };
    }
    
    // 🕒 MAX HOLD TIME: 5 minutes maximum
    if (holdTime >= this.scalperConfig.maxHoldTime) {
      return {
        action: 'exit',
        reason: `Scalper Max-Hold: ${this.formatHoldTime(holdTime)} limit reached`
      };
    }
    
    // 📉 MOMENTUM SHIFT DETECTION: Check every 5 seconds
    if (currentTime - this.scalperConfig.lastMomentumCheck >= 5000) {
      this.scalperConfig.lastMomentumCheck = currentTime;
      
      const momentumShift = this.detectMomentumShift(currentAnalysis);
      if (momentumShift) {
        return {
          action: 'exit',
          reason: `Scalper Momentum-Shift: ${momentumShift.reason}`
        };
      }
    }
    
    // 🔴 TIGHT STOP LOSS: 50% tighter than normal
    const tightStopDistance = this.position.entryPrice * this.config.stopLossPercent * this.scalperConfig.tightStopMultiplier;
    const tightStopPrice = this.position.direction === 'buy'
      ? this.position.entryPrice - tightStopDistance
      : this.position.entryPrice + tightStopDistance;
      
    if ((this.position.direction === 'buy' && price <= tightStopPrice) ||
        (this.position.direction === 'sell' && price >= tightStopPrice)) {
      return {
        action: 'exit',
        reason: `Scalper Tight-Stop: ${(this.scalperConfig.tightStopMultiplier * 100)}% tighter stop triggered`
      };
    }
    
    return null; // No scalper exit conditions met
  }
  
  /**
   * 📊 SCALPER-SPECIFIC: Detect momentum shifts for quick exits
   * @param {Object} currentAnalysis - Current market analysis
   * @returns {Object|null} Momentum shift detection result
   */
  detectMomentumShift(currentAnalysis) {
    if (!this.position || !this.scalperConfig.entryMomentum) return null;
    
    // Compare current momentum vs entry momentum
    const currentMomentum = {
      rsi: currentAnalysis.rsi || 50,
      macd: currentAnalysis.macd || 0,
      volume: currentAnalysis.volume || 0,
      trend: currentAnalysis.trend || 'neutral'
    };
    
    // RSI momentum shift (15% threshold)
    const rsiShift = Math.abs(currentMomentum.rsi - this.scalperConfig.entryMomentum.rsi) / this.scalperConfig.entryMomentum.rsi;
    if (rsiShift >= this.scalperConfig.momentumShiftThreshold) {
      return { reason: `RSI shifted ${(rsiShift * 100).toFixed(1)}%` };
    }
    
    // MACD momentum shift
    if (this.scalperConfig.entryMomentum.macd !== 0) {
      const macdShift = Math.abs(currentMomentum.macd - this.scalperConfig.entryMomentum.macd) / Math.abs(this.scalperConfig.entryMomentum.macd);
      if (macdShift >= this.scalperConfig.momentumShiftThreshold) {
        return { reason: `MACD shifted ${(macdShift * 100).toFixed(1)}%` };
      }
    }
    
    // Trend reversal
    if (this.scalperConfig.entryMomentum.trend !== currentMomentum.trend &&
        currentMomentum.trend !== 'neutral') {
      return { reason: `Trend reversed: ${this.scalperConfig.entryMomentum.trend} → ${currentMomentum.trend}` };
    }
    
    return null;
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
  // 🛡️ RISK MANAGEMENT UTILITY METHODS
  // ========================================================================
  
  /**
   * Get the start of the current week (Monday)
   * @returns {number} Week start timestamp
   */
  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }
  
  /**
   * Check if trading should be halted due to risk limits
   * @returns {Object} Risk check result
   */
  checkRiskLimits() {
    const currentLoss = this.initialBalance - this.balance;
    const currentTime = Date.now();
    
    // Check emergency stop
    if (currentLoss >= this.riskLimits.emergencyStopTrigger) {
      this.activateEmergencyStop('Emergency loss limit reached');
      return { halt: true, reason: 'Emergency stop triggered' };
    }
    
    // Check daily limits
    if (this.riskLimits.dailyLosses >= this.riskLimits.dailyLossLimit) {
      return { halt: true, reason: 'Daily loss limit exceeded' };
    }
    
    // Check weekly limits
    if (this.riskLimits.weeklyLosses >= this.riskLimits.weeklyLossLimit) {
      return { halt: true, reason: 'Weekly loss limit exceeded' };
    }
    
    // Check monthly limits
    if (this.riskLimits.monthlyLosses >= this.riskLimits.monthlyLossLimit) {
      return { halt: true, reason: 'Monthly loss limit exceeded' };
    }
    
    // Check drawdown
    if (this.riskLimits.currentDrawdown >= this.riskLimits.maxDrawdownLimit) {
      return { halt: true, reason: 'Maximum drawdown exceeded' };
    }
    
    return { halt: false, reason: null };
  }
  
  /**
   * Activate emergency stop mechanism
   * @param {string} reason - Reason for emergency stop
   */
  activateEmergencyStop(reason) {
    this.riskLimits.emergencyStopActive = true;
    this.riskLimits.emergencyStopReason = reason;
    this.riskLimits.tradingHalted = true;
    this.riskLimits.haltReason = reason;
    
    console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
    console.log(`📊 Account Status: $${this.balance.toFixed(2)} (${((this.balance/this.initialBalance-1)*100).toFixed(1)}%)`);
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
   * 💰 FEE-AWARE: Calculate NET profit after all fees and costs
   * @param {number} grossProfit - Gross profit before fees
   * @returns {number} Net profit after fees
   */
  calculateNetProfit(grossProfit) {
    if (!this.position) return 0;
    
    const positionValue = this.position.entryPrice * this.position.size;
    const totalFees = positionValue * this.feeConfig.totalRoundTrip;
    
    return grossProfit - totalFees;
  }
  
  /**
   * 🎯 FEE-AWARE: Check if profit target is met AFTER accounting for fees
   * @param {number} grossProfitPercent - Gross profit percentage
   * @param {number} targetPercent - Target profit percentage
   * @returns {boolean} True if target is met after fees
   */
  isProfitTargetMet(grossProfitPercent, targetPercent) {
    // Ensure gross profit exceeds target + fees + safety buffer
    const requiredGross = targetPercent + this.feeConfig.totalRoundTrip + this.feeConfig.safetyBuffer;
    return grossProfitPercent >= requiredGross;
  }
  
  /**
   * Calculate position size based on risk parameters and confidence
   * Uses Quantum Position Sizer when available, falls back to traditional sizing
   * @param {number} price - Entry price
   * @param {number} confidence - Signal confidence (0-5)
   * @param {Object} analysisData - Market analysis data
   * @returns {number} Calculated position size
   */
  calculatePositionSize(price, confidence = 1, analysisData = {}) {
    // Use Quantum Position Sizer if available
    if (this.quantumPositionSizer) {
      try {
        const volatility = analysisData.volatility || analysisData.atr || 0.01;
        // 🎯 KELLY FIX: Ensure minimum pattern strength for Kelly calculation (need >0.5 for positive Kelly)
        const patternStrength = Math.max(0.6, analysisData.patternConfidence || confidence || 0.7);
        
        // Prepare market data for quantum analysis
        const marketData = {
          rsi: analysisData.rsi || 50,
          macd: analysisData.macd || 0,
          volume: analysisData.volume || 0,
          trend: analysisData.trend || 'neutral',
          trendStrength: analysisData.trendStrength || 0,
          support: analysisData.support || price * 0.98,
          resistance: analysisData.resistance || price * 1.02,
          fibLevels: analysisData.fibLevels || [],
          timeframeConcurrence: analysisData.timeframeConcurrence || false,
          marketRegime: analysisData.marketRegime || 'normal'
        };
        
        const quantumResult = this.quantumPositionSizer.calculateOptimalPosition(
          price,
          volatility,
          patternStrength,
          this.balance,
          marketData
        );
        
        console.log(`⚛️ Quantum Position Size: ${quantumResult.optimalShares.toFixed(6)} (${(quantumResult.positionSizePercent * 100).toFixed(2)}%)`);
        console.log(`   Kelly Score: ${quantumResult.kellyScore.toFixed(4)} | Quantum State: ${quantumResult.quantumState}`);
        
        return quantumResult.optimalShares;
        
      } catch (error) {
        console.log(`⚠️ Quantum Position Sizer error: ${error.message}, falling back to traditional sizing`);
        // Fall through to traditional sizing
      }
    }
    
    // Traditional position sizing (fallback)
    console.log('📊 Using traditional position sizing');
    
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
    // 🧠 PROFILE-SPECIFIC PATTERN STORAGE: Store pattern with ProfilePatternManager
    if (this.ogzPrime && this.ogzPrime.profilePatternManager && analysisData.patternType) {
      try {
        const profile = this.ogzPrime.getCurrentProfile();
        if (profile) {
          console.log(`🧠 Storing pattern entry for profile: ${profile.name}`);
          
          // Create comprehensive pattern data
          const patternData = {
            type: analysisData.patternType,
            id: analysisData.patternId || `pattern_${Date.now()}`,
            confidence: analysisData.patternConfidence || analysisData.confidence || 0,
            features: {
              rsi: analysisData.rsi || 0,
              macd: analysisData.macd || 0,
              macdSignal: analysisData.macdSignal || 0,
              macdHistogram: analysisData.macdHistogram || 0,
              trend: analysisData.trend || 'unknown',
              trendStrength: analysisData.trendStrength || 0,
              volatility: analysisData.volatility || 0,
              volume: analysisData.volume || 0,
              support: analysisData.support || 0,
              resistance: analysisData.resistance || 0
            },
            marketConditions: {
              timeframe: analysisData.primaryTimeframe || '1m',
              marketRegime: analysisData.marketRegime || 'normal',
              timeframeConcurrence: analysisData.timeframeConcurrence || false
            },
            metadata: {
              entryPrice: this.position ? this.position.entryPrice : 0,
              timestamp: new Date().toISOString(),
              sessionTradeNumber: this.sessionStats.tradesCount
            }
          };
          
          // Add pattern to ProfilePatternManager
          this.ogzPrime.profilePatternManager.addPattern(profile.name, patternData);
          
          console.log(`✅ Pattern ${analysisData.patternType} stored for ${profile.name}`);
        } else {
          console.log('⚠️ No active profile found for pattern storage');
        }
      } catch (error) {
        console.error('❌ Failed to store pattern entry:', error.message);
      }
    } else {
      console.log('⚠️ ProfilePatternManager not available or no pattern type specified');
    }
  }
  
  /**
   * Update pattern learning with trade result
   * @param {string} patternId - Pattern identifier
   * @param {boolean} wasWin - Whether trade was profitable
   * @param {number} pnl - Profit/loss amount
   * @param {Object} tradeData - Complete trade data
   */
  updatePatternLearning(patternId, wasWin, pnl, tradeData) {
    // 🧠 PROFILE-SPECIFIC PATTERN LEARNING: Record trade result with ProfilePatternManager
    if (this.ogzPrime && this.ogzPrime.profilePatternManager) {
      try {
        const profile = this.ogzPrime.getCurrentProfile();
        if (profile) {
          console.log(`🧠 Recording trade result for pattern ${patternId} in profile: ${profile.name}`);
          
          // Record the trade result with comprehensive data
          this.ogzPrime.profilePatternManager.recordTradeResult(profile.name, patternId, {
            successful: wasWin,
            pnl: pnl,
            pnlPercent: tradeData.pnlPercent || 0,
            entryPrice: tradeData.entryPrice,
            exitPrice: tradeData.exitPrice,
            holdTime: tradeData.holdTime,
            exitReason: tradeData.exitReason,
            marketConditions: {
              rsi: tradeData.rsi,
              macd: tradeData.macd,
              trend: tradeData.trend,
              volatility: tradeData.volatility,
              volume: tradeData.volume,
              confidence: tradeData.confidence
            },
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Pattern learning updated for ${profile.name}: ${wasWin ? 'WIN' : 'LOSS'} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
        } else {
          console.log('⚠️ No active profile found for pattern learning');
        }
      } catch (error) {
        console.error('❌ Failed to update pattern learning:', error.message);
      }
    } else {
      console.log('⚠️ ProfilePatternManager not available for pattern learning');
    }
    
    // Legacy pattern memory (keep for compatibility)
    if (patternId && this.patternMemory) {
      if (!this.patternMemory.has(patternId)) {
        this.patternMemory.set(patternId, { wins: 0, losses: 0, totalPnl: 0, count: 0 });
      }
      
      const pattern = this.patternMemory.get(patternId);
      pattern.count++;
      pattern.totalPnl += pnl;
      
      if (wasWin) {
        pattern.wins++;
      } else {
        pattern.losses++;
      }
    }
  }
  
  /**
   * Get pattern win rate
   * @param {string} patternType - Pattern type
   * @returns {number} Pattern win rate percentage
   */
  getPatternWinRate(patternType) {
    // 🧠 PROFILE-SPECIFIC PATTERN QUERY: Get win rate from ProfilePatternManager
    if (this.ogzPrime && this.ogzPrime.profilePatternManager) {
      try {
        const profile = this.ogzPrime.getCurrentProfile();
        if (profile) {
          const patterns = this.ogzPrime.profilePatternManager.getPatterns(profile.name);
          const typePatterns = patterns.filter(p => p.type === patternType);
          
          if (typePatterns.length === 0) return 0;
          
          let wins = 0;
          let total = 0;
          
          typePatterns.forEach(pattern => {
            if (pattern.tradeResults && pattern.tradeResults.length > 0) {
              pattern.tradeResults.forEach(result => {
                total++;
                if (result.successful) wins++;
              });
            }
          });
          
          return total > 0 ? (wins / total) * 100 : 0;
        }
      } catch (error) {
        console.error('❌ Failed to get pattern win rate:', error.message);
      }
    }
    
    // Fallback to legacy pattern memory
    if (this.patternMemory && this.patternMemory.has(patternType)) {
      const pattern = this.patternMemory.get(patternType);
      const total = pattern.wins + pattern.losses;
      return total > 0 ? (pattern.wins / total) * 100 : 0;
    }
    
    return 0;
  }
  
  /**
   * Get pattern average return
   * @param {string} patternType - Pattern type
   * @returns {number} Pattern average return percentage
   */
  getPatternAvgReturn(patternType) {
    // 🧠 PROFILE-SPECIFIC PATTERN QUERY: Get average return from ProfilePatternManager
    if (this.ogzPrime && this.ogzPrime.profilePatternManager) {
      try {
        const profile = this.ogzPrime.getCurrentProfile();
        if (profile) {
          const patterns = this.ogzPrime.profilePatternManager.getPatterns(profile.name);
          const typePatterns = patterns.filter(p => p.type === patternType);
          
          if (typePatterns.length === 0) return 0;
          
          let totalReturn = 0;
          let count = 0;
          
          typePatterns.forEach(pattern => {
            if (pattern.tradeResults && pattern.tradeResults.length > 0) {
              pattern.tradeResults.forEach(result => {
                totalReturn += result.pnlPercent || 0;
                count++;
              });
            }
          });
          
          return count > 0 ? totalReturn / count : 0;
        }
      } catch (error) {
        console.error('❌ Failed to get pattern average return:', error.message);
      }
    }
    
    // Fallback to legacy pattern memory
    if (this.patternMemory && this.patternMemory.has(patternType)) {
      const pattern = this.patternMemory.get(patternType);
      return pattern.count > 0 ? (pattern.totalPnl / pattern.count) : 0;
    }
    
    return 0;
  }
  
  // ========================================================================
  // 🛡️ SAFETY INTEGRATION METHODS
  // ========================================================================
  
  /**
   * 📊 Extract involved components from trade reason and analysis
   * @param {string} reason - Trade reason
   * @param {Object} analysisData - Analysis data
   * @returns {Array} Array of involved component names
   */
  extractInvolvedComponents(reason, analysisData) {
    const components = ['OptimizedTradingBrain']; // Always involved
    
    // Check for specific components mentioned in reason
    if (reason.includes('RANDOM') || reason.includes('Random')) {
      components.push('RandomTrades');
    }
    if (reason.includes('AGGRESSIVE') || reason.includes('Aggressive')) {
      components.push('AggressiveTradingMode');
    }
    if (reason.includes('COSMIC') || reason.includes('Cosmic')) {
      components.push('CosmicAnalysis');
    }
    if (reason.includes('QUANTUM') || reason.includes('Quantum')) {
      components.push('QuantumAnalysis');
    }
    if (reason.includes('SCALPER') || reason.includes('Scalper')) {
      components.push('ScalperMode');
    }
    
    // Check analysis data for component involvement
    if (analysisData && analysisData.patternType) {
      components.push('MultiTimeframeAnalysis');
    }
    if (this.quantumPositionSizer) {
      components.push('QuantumPositionSizer');
    }
    
    return [...new Set(components)]; // Remove duplicates
  }
  
  /**
   * 🌍 Classify market condition for performance tracking
   * @param {Object} analysisData - Market analysis data
   * @returns {string} Market condition classification
   */
  classifyMarketCondition(analysisData) {
    if (!analysisData) return 'unknown';
    
    // Determine market condition based on analysis
    if (analysisData.trend === 'uptrend') return 'trending_up';
    if (analysisData.trend === 'downtrend') return 'trending_down';
    if (analysisData.volatility > 0.03) return 'volatile';
    if (analysisData.volume && analysisData.volume < 1000) return 'low_volume';
    if (analysisData.volume && analysisData.volume > 10000) return 'high_volume';
    
    return 'sideways';
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
    console.log('🧠 TRADING BRAIN: Processing analysis...');
    console.log('🧠 Analysis Data:', {
      decision: analysis.decision,
      confidence: analysis.confidence,
      reason: analysis.reason,
      price: price,
      trend: analysis.trend,
      rsi: analysis.rsi,
      macd: analysis.macd
    });
    console.log('🧠 Current State:', {
      inPosition: this.isInPosition(),
      balance: this.balance,
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      position: this.position
    });
    
    // Update position if we have one
    if (this.isInPosition()) {
      console.log('🧠 Managing existing position...');
      this.managePosition(price, analysis);
      return; // Exit early if managing position
    }
    
    // Check for new position entry (ENHANCED SAFETY: Increased confidence threshold)
    console.log('🧠 Checking new position entry criteria...');
    console.log('🧠 Entry Checks:', {
      inPosition: this.isInPosition(),
      decision: analysis.decision,
      decisionNotHold: analysis.decision !== 'hold',
      confidence: analysis.confidence,
      minThreshold: this.config.minConfidenceThreshold,
      confidenceMet: analysis.confidence >= this.config.minConfidenceThreshold
    });
    
    if (!this.isInPosition() && analysis.decision !== 'hold' && analysis.confidence >= this.config.minConfidenceThreshold) {
      console.log('🧠 All entry criteria met! Proceeding with trade...');
      
      const direction = analysis.decision === 'buy' ? 'buy' : 'sell';
      console.log(`🧠 Trade Direction: ${direction}`);
      
      console.log('🧠 Calculating position size...');
      const size = this.calculatePositionSize(price, analysis.confidence, analysis);
      console.log(`🧠 Calculated Position Size: ${size} shares`);
      
      if (size > 0) {
        console.log('🧠 Position size valid, opening position...');
        const opened = this.openPosition(price, direction, size, analysis.confidence, analysis.reason, analysis);
        console.log(`🧠 Position opened: ${opened ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log('🧠 TRADE BLOCKED: Position size is 0 or invalid');
      }
    } else {
      console.log('🧠 Entry criteria NOT met - trade blocked');
      if (this.isInPosition()) {
        console.log('   - Already in position');
      }
      if (analysis.decision === 'hold') {
        console.log('   - Decision is HOLD');
      }
      if (analysis.confidence < this.config.minConfidenceThreshold) {
        console.log(`   - Confidence too low: ${analysis.confidence} < ${this.config.minConfidenceThreshold}`);
      }
    }
  }
}

// Export the enhanced trading brain
module.exports = { OptimizedTradingBrain };
