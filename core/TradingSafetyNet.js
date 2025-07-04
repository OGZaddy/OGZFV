eh/**
 * 🛡️ TradingSafetyNet - Emergency Circuit Breakers and Risk Management
 * 
 * Based on Expert Analysis: "CONSISTENT PROFITS, not cosmic complexity"
 * 
 * This class provides emergency circuit breakers and real-time risk monitoring
 * to prevent catastrophic losses during live trading.
 */

class TradingSafetyNet {
  constructor(config = {}) {
    this.config = {
      // 🚨 EMERGENCY CIRCUIT BREAKERS
      maxDailyLoss: config.maxDailyLoss || 0.05,           // 5% max daily loss
      maxWeeklyLoss: config.maxWeeklyLoss || 0.15,         // 15% max weekly loss
      maxConsecutiveLosses: config.maxConsecutiveLosses || 5, // Stop after 5 consecutive losses
      maxDrawdown: config.maxDrawdown || 0.10,             // 10% max drawdown from peak
      
      // ⏱️ TIME-BASED LIMITS
      maxTradesPerHour: config.maxTradesPerHour || 10,     // Max 10 trades per hour
      maxTradesPerDay: config.maxTradesPerDay || 50,       // Max 50 trades per day
      minTimeBetweenTrades: config.minTimeBetweenTrades || 15000, // Min 15s between trades
      
      // 💰 POSITION LIMITS
      maxPositionSize: config.maxPositionSize || 0.20,     // Max 20% of account per position
      maxTotalExposure: config.maxTotalExposure || 0.50,   // Max 50% total exposure
      
      // 🎯 VOLATILITY LIMITS (CRYPTO-OPTIMIZED FOR EXTREME MARKETS)
      maxVolatility: config.maxVolatility || 2.0,          // Don't trade if volatility > 200% (crypto can be extreme)
      marketHoursOnly: config.marketHoursOnly || false,    // Trade only during market hours
      
      // 🔧 SYSTEM HEALTH
      enableEmergencyStop: config.enableEmergencyStop !== false, // Default enabled
      enableLogging: config.enableLogging !== false        // Default enabled
    };
    
    // State tracking
    this.state = {
      isActive: true,
      emergencyStop: false,
      startTime: Date.now(),
      
      // 📊 PERFORMANCE TRACKING
      dailyPnL: 0,
      weeklyPnL: 0,
      totalPnL: 0,
      peakBalance: 0,
      currentDrawdown: 0,
      
      // 🔢 TRADE TRACKING
      consecutiveLosses: 0,
      tradesThisHour: 0,
      tradesThisDay: 0,
      lastTradeTime: null,
      hourlyTradeReset: Date.now(),
      dailyTradeReset: Date.now(),
      
      // 📈 POSITION TRACKING
      currentPositions: new Map(),
      totalExposure: 0,
      
      // ⚠️ VIOLATION TRACKING
      violations: [],
      warningCount: 0,
      lastViolationTime: null
    };
    
    // Set initial peak balance
    this.state.peakBalance = config.initialBalance || 10000;
    
    console.log('🛡️ TradingSafetyNet initialized with emergency protections');
  }
  
  /**
   * 🚨 MAIN SAFETY CHECK: Validate if a trade is safe to execute
   * @param {Object} tradeRequest - Proposed trade details
   * @param {Object} marketData - Current market conditions
   * @returns {Object} Safety result with approval/denial and reasons
   */
  validateTrade(tradeRequest, marketData) {
    // Emergency stop check
    if (this.state.emergencyStop) {
      return this.createSafetyResult(false, 'EMERGENCY_STOP', 'Trading halted by emergency stop');
    }
    
    // Run all safety checks
    const checks = [
      this.checkDailyLoss(),
      this.checkWeeklyLoss(),
      this.checkConsecutiveLosses(),
      this.checkDrawdown(),
      this.checkTradeFrequency(),
      this.checkPositionSize(tradeRequest),
      this.checkTotalExposure(tradeRequest),
      this.checkVolatility(marketData),
      this.checkMarketHours(),
      this.checkTimeBetweenTrades()
    ];
    
    // Find any failed checks
    const failedChecks = checks.filter(check => !check.passed);
    
    if (failedChecks.length > 0) {
      // Log violation
      this.logViolation(failedChecks);
      
      // Return denial with reasons
      return this.createSafetyResult(
        false, 
        failedChecks[0].code, 
        failedChecks.map(c => c.reason).join('; ')
      );
    }
    
    // All checks passed
    return this.createSafetyResult(true, 'APPROVED', 'All safety checks passed');
  }
  
  /**
   * 📊 UPDATE: Record trade result for safety tracking
   * @param {Object} tradeResult - Completed trade details
   */
  updateTradeResult(tradeResult) {
    const pnl = tradeResult.pnl || 0;
    const currentTime = Date.now();
    
    // Update PnL tracking
    this.state.totalPnL += pnl;
    this.state.dailyPnL += pnl;
    this.state.weeklyPnL += pnl;
    
    // Update peak and drawdown
    if (this.state.totalPnL > this.state.peakBalance) {
      this.state.peakBalance = this.state.totalPnL;
      this.state.currentDrawdown = 0;
    } else {
      this.state.currentDrawdown = (this.state.peakBalance - this.state.totalPnL) / this.state.peakBalance;
    }
    
    // Update consecutive losses
    if (pnl < 0) {
      this.state.consecutiveLosses++;
    } else {
      this.state.consecutiveLosses = 0;
    }
    
    // Update trade counters
    this.state.tradesThisHour++;
    this.state.tradesThisDay++;
    this.state.lastTradeTime = currentTime;
    
    // Check for emergency conditions
    this.checkEmergencyConditions();
    
    if (this.config.enableLogging) {
      console.log(`🛡️ Trade recorded: PnL=${pnl.toFixed(2)}, Consecutive losses=${this.state.consecutiveLosses}, Drawdown=${(this.state.currentDrawdown * 100).toFixed(1)}%`);
    }
  }
  
  /**
   * 🚨 EMERGENCY: Check for emergency stop conditions
   */
  checkEmergencyConditions() {
    // Auto emergency stop on severe conditions
    if (this.state.currentDrawdown >= this.config.maxDrawdown ||
        this.state.consecutiveLosses >= this.config.maxConsecutiveLosses ||
        this.state.dailyPnL <= -this.config.maxDailyLoss) {
      
      this.triggerEmergencyStop(`Critical safety threshold breached`);
    }
  }
  
  /**
   * 🔴 EMERGENCY STOP: Halt all trading immediately
   * @param {string} reason - Reason for emergency stop
   */
  triggerEmergencyStop(reason) {
    if (!this.config.enableEmergencyStop) return;
    
    this.state.emergencyStop = true;
    
    console.error(`🚨 EMERGENCY STOP TRIGGERED: ${reason}`);
    console.error(`📊 Current State:`);
    console.error(`   Daily PnL: ${this.state.dailyPnL.toFixed(2)}`);
    console.error(`   Drawdown: ${(this.state.currentDrawdown * 100).toFixed(1)}%`);
    console.error(`   Consecutive Losses: ${this.state.consecutiveLosses}`);
    console.error(`   Total Trades Today: ${this.state.tradesThisDay}`);
    
    // Could integrate with external alerting systems here
    // this.sendEmergencyAlert(reason);
  }
  
  /**
   * 🟢 RESET: Reset emergency stop (manual intervention required)
   * @param {string} authorization - Authorization code
   */
  resetEmergencyStop(authorization = null) {
    // Require manual authorization for safety
    if (authorization !== 'MANUAL_OVERRIDE') {
      console.warn('🛡️ Emergency stop reset requires manual authorization');
      return false;
    }
    
    this.state.emergencyStop = false;
    this.state.violations = [];
    this.state.warningCount = 0;
    
    console.log('🟢 Emergency stop reset - Trading resumed');
    return true;
  }
  
  // ============================================================================
  // INDIVIDUAL SAFETY CHECKS
  // ============================================================================
  
  checkDailyLoss() {
    const dailyLossPercent = Math.abs(this.state.dailyPnL) / this.state.peakBalance;
    return {
      passed: dailyLossPercent <= this.config.maxDailyLoss,
      code: 'DAILY_LOSS',
      reason: `Daily loss ${(dailyLossPercent * 100).toFixed(1)}% exceeds limit ${(this.config.maxDailyLoss * 100).toFixed(1)}%`
    };
  }
  
  checkWeeklyLoss() {
    const weeklyLossPercent = Math.abs(this.state.weeklyPnL) / this.state.peakBalance;
    return {
      passed: weeklyLossPercent <= this.config.maxWeeklyLoss,
      code: 'WEEKLY_LOSS',
      reason: `Weekly loss ${(weeklyLossPercent * 100).toFixed(1)}% exceeds limit ${(this.config.maxWeeklyLoss * 100).toFixed(1)}%`
    };
  }
  
  checkConsecutiveLosses() {
    return {
      passed: this.state.consecutiveLosses < this.config.maxConsecutiveLosses,
      code: 'CONSECUTIVE_LOSSES',
      reason: `${this.state.consecutiveLosses} consecutive losses exceeds limit ${this.config.maxConsecutiveLosses}`
    };
  }
  
  checkDrawdown() {
    return {
      passed: this.state.currentDrawdown <= this.config.maxDrawdown,
      code: 'MAX_DRAWDOWN',
      reason: `Drawdown ${(this.state.currentDrawdown * 100).toFixed(1)}% exceeds limit ${(this.config.maxDrawdown * 100).toFixed(1)}%`
    };
  }
  
  checkTradeFrequency() {
    this.resetCountersIfNeeded();
    
    const hourlyExceeded = this.state.tradesThisHour >= this.config.maxTradesPerHour;
    const dailyExceeded = this.state.tradesThisDay >= this.config.maxTradesPerDay;
    
    return {
      passed: !hourlyExceeded && !dailyExceeded,
      code: 'TRADE_FREQUENCY',
      reason: `Trade frequency exceeded: ${this.state.tradesThisHour}/hr, ${this.state.tradesThisDay}/day`
    };
  }
  
  checkPositionSize(tradeRequest) {
    const positionSize = tradeRequest.size || 0;
    return {
      passed: positionSize <= this.config.maxPositionSize,
      code: 'POSITION_SIZE',
      reason: `Position size ${(positionSize * 100).toFixed(1)}% exceeds limit ${(this.config.maxPositionSize * 100).toFixed(1)}%`
    };
  }
  
  checkTotalExposure(tradeRequest) {
    const newExposure = this.state.totalExposure + (tradeRequest.size || 0);
    return {
      passed: newExposure <= this.config.maxTotalExposure,
      code: 'TOTAL_EXPOSURE',
      reason: `Total exposure ${(newExposure * 100).toFixed(1)}% exceeds limit ${(this.config.maxTotalExposure * 100).toFixed(1)}%`
    };
  }
  
  checkVolatility(marketData) {
    const volatility = marketData?.volatility || 0;
    return {
      passed: volatility <= this.config.maxVolatility,
      code: 'HIGH_VOLATILITY',
      reason: `Market volatility ${(volatility * 100).toFixed(1)}% exceeds limit ${(this.config.maxVolatility * 100).toFixed(1)}%`
    };
  }
  
  checkMarketHours() {
    if (!this.config.marketHoursOnly) return { passed: true };
    
    const now = new Date();
    const hour = now.getHours();
    const isMarketHours = hour >= 9 && hour < 16; // 9 AM to 4 PM
    
    return {
      passed: isMarketHours,
      code: 'MARKET_HOURS',
      reason: 'Trading outside market hours not allowed'
    };
  }
  
  checkTimeBetweenTrades() {
    if (!this.state.lastTradeTime) return { passed: true };
    
    const timeSinceLastTrade = Date.now() - this.state.lastTradeTime;
    return {
      passed: timeSinceLastTrade >= this.config.minTimeBetweenTrades,
      code: 'TIME_BETWEEN_TRADES',
      reason: `Minimum time between trades not met (${timeSinceLastTrade}ms < ${this.config.minTimeBetweenTrades}ms)`
    };
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  createSafetyResult(approved, code, reason) {
    return {
      approved,
      code,
      reason,
      timestamp: Date.now(),
      state: { ...this.state }
    };
  }
  
  logViolation(failedChecks) {
    const violation = {
      timestamp: Date.now(),
      checks: failedChecks,
      state: { ...this.state }
    };
    
    this.state.violations.push(violation);
    this.state.warningCount++;
    this.state.lastViolationTime = Date.now();
    
    if (this.config.enableLogging) {
      console.warn(`🛡️ Safety violation: ${failedChecks.map(c => c.code).join(', ')}`);
    }
  }
  
  resetCountersIfNeeded() {
    const currentTime = Date.now();
    
    // Reset hourly counter
    if (currentTime - this.state.hourlyTradeReset > 3600000) { // 1 hour
      this.state.tradesThisHour = 0;
      this.state.hourlyTradeReset = currentTime;
    }
    
    // Reset daily counter
    if (currentTime - this.state.dailyTradeReset > 86400000) { // 24 hours
      this.state.tradesThisDay = 0;
      this.state.dailyPnL = 0;
      this.state.dailyTradeReset = currentTime;
    }
    
    // Reset weekly counter (simplified - every 7 days)
    if (currentTime - this.state.startTime > 604800000) { // 7 days
      this.state.weeklyPnL = 0;
    }
  }
  
  /**
   * 📊 GET STATUS: Current safety net status
   * @returns {Object} Current status and metrics
   */
  getStatus() {
    this.resetCountersIfNeeded();
    
    return {
      isActive: this.state.isActive,
      emergencyStop: this.state.emergencyStop,
      metrics: {
        dailyPnL: this.state.dailyPnL,
        weeklyPnL: this.state.weeklyPnL,
        totalPnL: this.state.totalPnL,
        currentDrawdown: this.state.currentDrawdown,
        consecutiveLosses: this.state.consecutiveLosses,
        tradesThisHour: this.state.tradesThisHour,
        tradesThisDay: this.state.tradesThisDay,
        totalExposure: this.state.totalExposure,
        violationCount: this.state.violations.length,
        warningCount: this.state.warningCount
      },
      limits: this.config
    };
  }
}

module.exports = TradingSafetyNet;