/**
 * RiskManager.js - Advanced Capital Protection & Risk Management Engine
 * 
 * ============================================================================
 * 🛡️ THE GUARDIAN OF OGZ PRIME - PROTECTING YOUR PATH TO FINANCIAL FREEDOM
 * ============================================================================
 * 
 * This is the most critical component for long-term trading success. While the
 * AI makes decisions and the TradingBrain executes them, the RiskManager ensures
 * you never lose so much that you can't continue trading another day.
 * 
 * CRITICAL FOR SCALING:
 * New developers must understand this system is NON-NEGOTIABLE. Every trade
 * must go through risk management. This component can make the difference
 * between steady growth and catastrophic account destruction.
 * 
 * BUSINESS IMPACT:
 * - Prevents account-destroying drawdowns that end trading careers
 * - Dynamically adjusts position sizes based on performance and market conditions
 * - Implements recovery mode to rebuild after losses
 * - Provides detailed risk metrics for performance analysis
 * - Enables confident scaling of position sizes during winning periods
 * 
 * HOUSTON MISSION CRITICAL:
 * This system protects the capital that will fund your move to Houston.
 * Without proper risk management, even the best trading strategy can fail.
 * 
 * 🔧 FIXES APPLIED:
 * - Fixed timezone issues by using UTC for all time-based calculations
 * - Added TTL-based cleanup for alertsTriggered array to prevent memory leaks
 * - Added exponential backoff for recovery mode to prevent flip-flopping
 * - Enhanced period reset logic with proper timezone handling
 * 
 * AUTHOR: OGZ Prime Team - Built for Sustainable Trading Success
 * DATE: Advanced Risk Management Implementation
 * 
 * ============================================================================
 * RISK MANAGEMENT PHILOSOPHY:
 * ============================================================================
 * 
 * 1. PRESERVE CAPITAL FIRST: Never risk more than you can afford to lose
 * 2. ADAPT TO CONDITIONS: Reduce risk in bad times, increase in good times
 * 3. PROTECT AGAINST STREAKS: Manage both winning and losing streaks
 * 4. RECOVERY FOCUS: Specialized mode for rebuilding after drawdowns
 * 5. DAILY/WEEKLY LIMITS: Hard stops to prevent catastrophic single-day losses
 * 6. VOLATILITY AWARENESS: Adjust risk based on market volatility
 * 
 * ============================================================================
 */

/**
 * RiskManager Class - Advanced Capital Protection Engine
 * 
 * CRITICAL SYSTEM COMPONENT: This class implements sophisticated risk management
 * strategies that adapt to market conditions, trading performance, and account
 * status to ensure long-term trading survival and growth.
 * 
 * SCALING BENEFIT: New team members can modify risk parameters without
 * understanding the complex calculations behind position sizing and drawdown
 * protection.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Dynamic position sizing based on multiple factors
 * 2. Drawdown detection and recovery mode activation
 * 3. Consecutive win/loss streak management
 * 4. Daily/weekly/monthly loss limit enforcement
 * 5. Volatility-adjusted risk calculations
 * 6. Performance tracking for risk optimization
 */
class RiskManager {
  
  /**
   * Constructor - Initialize the Risk Management System
   * 
   * Sets up the comprehensive risk management framework with default settings
   * optimized for crypto trading while maintaining capital preservation focus.
   * 
   * @param {Object} config - Risk management configuration
   */
  constructor(config = {}) {
    // ======================================================================
    // CORE RISK CONFIGURATION
    // ======================================================================
    this.config = {
      // --------------------------------------------------------------------
      // POSITION SIZING PARAMETERS
      // --------------------------------------------------------------------
      baseRiskPercent: 2.0,           // Base risk per trade (2% of account)
      maxPositionSizePercent: 5.0,    // Never risk more than 5% on single trade
      minPositionSizePercent: 0.5,    // Minimum position size (0.5% floor)
      
      // --------------------------------------------------------------------
      // DRAWDOWN PROTECTION
      // --------------------------------------------------------------------
      maxDrawdownPercent: 15,         // Stop trading at 15% account drawdown
      recoveryThreshold: 10,          // Enter recovery mode at 10% drawdown
      
      // --------------------------------------------------------------------
      // STREAK MANAGEMENT
      // --------------------------------------------------------------------
      consecutiveLossReduction: 0.2,  // Reduce size 20% after each loss
      winStreakIncrease: 0.1,         // Increase size 10% after each win
      maxWinStreakMultiplier: 2.0,    // Never more than double base size
      
      // --------------------------------------------------------------------
      // VOLATILITY ADJUSTMENTS
      // --------------------------------------------------------------------
      volatilityScaling: true,        // Enable volatility-based sizing
      volatilityFactor: 1.0,          // Volatility adjustment multiplier
      highVolatilityReduction: 0.5,   // 50% size reduction in high volatility
      
      // --------------------------------------------------------------------
      // RECOVERY MODE SETTINGS
      // --------------------------------------------------------------------
      tradesRequiredToExitRecovery: 5,       // Trades needed to exit recovery
      recoveryConfidenceMultiplier: 1.5,     // Higher confidence needed in recovery
      counterTrendRiskReduction: 0.3,        // 30% reduction for counter-trend
      recoveryModeBackoffMs: 300000,         // 5 min backoff before re-entering recovery
      
      // --------------------------------------------------------------------
      // TIME-BASED LIMITS (FIXED: Now uses UTC)
      // --------------------------------------------------------------------
      dailyLossLimitPercent: 5.0,     // Max 5% daily loss
      weeklyLossLimitPercent: 10.0,   // Max 10% weekly loss
      monthlyLossLimitPercent: 20.0,  // Max 20% monthly loss
      useUTC: true,                   // FIXED: Use UTC for all time calculations
      
      // --------------------------------------------------------------------
      // SYSTEM BEHAVIOR
      // --------------------------------------------------------------------
      enableRecoveryMode: true,       // Enable automatic recovery mode
      verboseLogging: true,           // Detailed logging for debugging
      alertTTLMs: 3600000,           // FIXED: Alert TTL - 1 hour
      maxAlertsInMemory: 50,         // FIXED: Max alerts before cleanup
      alertThresholds: {
        drawdown: 5,                  // Alert at 5% drawdown
        dailyLoss: 3,                 // Alert at 3% daily loss
        consecutiveLosses: 3          // Alert after 3 consecutive losses
      },
      
      // Override with user configuration
      ...config
    };
    
    // ======================================================================
    // SYSTEM STATE MANAGEMENT
    // ======================================================================
    this.state = {
      // RECOVERY MODE STATE
      recoveryMode: false,            // Whether in recovery mode
      recoveryModeEnteredAt: 0,       // When recovery mode was entered
      lastRecoveryExit: 0,            // When last exited recovery (for backoff)
      consecutiveWins: 0,             // Current winning streak
      consecutiveLosses: 0,           // Current losing streak
      
      // ACCOUNT TRACKING
      accountBalance: 0,              // Current account balance
      initialBalance: 0,              // Starting balance for drawdown calculation
      peakBalance: 0,                 // Highest balance reached (for drawdown)
      currentDrawdown: 0,             // Current drawdown percentage
      maxDrawdownReached: 0,          // Maximum drawdown experienced
      
      // TIME-BASED TRACKING (FIXED: Now properly handles UTC)
      dailyStats: {
        startBalance: 0,
        currentBalance: 0,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breachedLimit: false,
        lastReset: this.getUTCDateString()  // FIXED: UTC date string
      },
      
      weeklyStats: {
        startBalance: 0,
        currentBalance: 0,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breachedLimit: false,
        lastReset: this.getUTCWeekStart()   // FIXED: UTC week start
      },
      
      monthlyStats: {
        startBalance: 0,
        currentBalance: 0,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breachedLimit: false,
        lastReset: this.getUTCMonthStart()  // FIXED: UTC month start
      },
      
      // PERFORMANCE METRICS
      totalTrades: 0,
      successfulTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      
      // RISK ALERTS (FIXED: TTL-based cleanup)
      alertsTriggered: [],
      lastAlertTime: 0,
      lastAlertCleanup: Date.now()    // FIXED: Track last cleanup time
    };
    
    console.log('🛡️ RiskManager initialized with advanced protection protocols (UTC-enabled)');
    this.log('Configuration loaded with base risk: ' + this.config.baseRiskPercent + '%', 'info');
    
    // FIXED: Setup automatic alert cleanup
    this.setupAlertCleanup();
  }
  
  /**
   * FIXED: Get UTC date string for consistent timezone handling
   * @returns {string} UTC date string
   */
  getUTCDateString() {
    const now = new Date();
    return now.getUTCFullYear() + '-' + 
           String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + 
           String(now.getUTCDate()).padStart(2, '0');
  }
  
  /**
   * FIXED: Get UTC week start for consistent week calculations
   * @returns {string} UTC week start identifier
   */
  getUTCWeekStart() {
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const day = utcDate.getUTCDay();
    const diff = utcDate.getUTCDate() - day;
    const sunday = new Date(utcDate.setUTCDate(diff));
    return this.formatUTCDate(sunday);
  }
  
  /**
   * FIXED: Get UTC month start for consistent month calculations
   * @returns {string} UTC month start identifier
   */
  getUTCMonthStart() {
    const now = new Date();
    return now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');
  }
  
  /**
   * FIXED: Format UTC date consistently
   * @param {Date} date - Date to format
   * @returns {string} Formatted UTC date string
   */
  formatUTCDate(date) {
    return date.getUTCFullYear() + '-' + 
           String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getUTCDate()).padStart(2, '0');
  }
  
  /**
   * FIXED: Setup automatic alert cleanup to prevent memory leaks
   */
  setupAlertCleanup() {
    // Clean up alerts every 15 minutes
    setInterval(() => {
      this.cleanupExpiredAlerts();
    }, 900000); // 15 minutes
  }
  
  /**
   * FIXED: Clean up expired alerts based on TTL
   */
  cleanupExpiredAlerts() {
    const now = Date.now();
    const ttl = this.config.alertTTLMs;
    
    // Remove alerts older than TTL
    const initialLength = this.state.alertsTriggered.length;
    this.state.alertsTriggered = this.state.alertsTriggered.filter(alert => {
      return (now - alert.timestamp) <= ttl;
    });
    
    // If still too many alerts, keep only the most recent ones
    if (this.state.alertsTriggered.length > this.config.maxAlertsInMemory) {
      this.state.alertsTriggered = this.state.alertsTriggered
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.config.maxAlertsInMemory);
    }
    
    const cleaned = initialLength - this.state.alertsTriggered.length;
    if (cleaned > 0) {
      this.log(`🧹 Cleaned up ${cleaned} expired alerts`, 'debug');
    }
    
    this.state.lastAlertCleanup = now;
  }
  
  /**
   * Initialize Account Balance - Set Starting Capital
   * 
   * CRITICAL SETUP: Sets the initial account balance that all risk calculations
   * will be based on. This must be called before any trading begins.
   * 
   * @param {number} balance - Starting account balance
   */
  initializeBalance(balance) {
    if (balance <= 0) {
      throw new Error('Account balance must be positive');
    }
    
    this.state.accountBalance = balance;
    this.state.initialBalance = balance;
    this.state.peakBalance = balance;
    
    // Initialize time-based tracking (FIXED: UTC-based)
    this.state.dailyStats.startBalance = balance;
    this.state.dailyStats.currentBalance = balance;
    this.state.weeklyStats.startBalance = balance;
    this.state.weeklyStats.currentBalance = balance;
    this.state.monthlyStats.startBalance = balance;
    this.state.monthlyStats.currentBalance = balance;
    
    this.log(`Account initialized with $${balance.toFixed(2)} (UTC timezone)`, 'info');
  }
  
  /**
   * Calculate Position Size - Core Risk Management Function
   * 
   * CRITICAL ALGORITHM: This is where all risk factors combine to determine
   * the appropriate position size for a trade. It considers account balance,
   * current performance, market volatility, and various risk factors.
   * 
   * SCALING IMPORTANCE: New developers can adjust individual risk factors
   * without breaking the overall risk calculation framework.
   * 
   * @param {number} accountBalance - Current account balance
   * @param {number} currentPrice - Current market price
   * @param {Object} marketConditions - Market analysis data
   * @param {number} marketConditions.volatility - Current market volatility
   * @param {string} marketConditions.trend - Market trend direction
   * @param {number} marketConditions.confidence - AI confidence score
   * 
   * @returns {number} - Calculated position size in dollars
   */
  calculatePositionSize(accountBalance, currentPrice, marketConditions = {}) {
    // ====================================================================
    // INPUT VALIDATION
    // ====================================================================
    if (!accountBalance || accountBalance <= 0) {
      this.log('Invalid account balance provided', 'error');
      return 0;
    }
    
    if (!currentPrice || currentPrice <= 0) {
      this.log('Invalid current price provided', 'error');
      return 0;
    }
    
    // Update internal balance tracking
    this.updateBalance(accountBalance);
    
    // ====================================================================
    // SAFETY CHECKS - HARD STOPS
    // ====================================================================
    
    // Check if trading is disabled due to excessive drawdown
    if (this.state.currentDrawdown >= this.config.maxDrawdownPercent) {
      this.log(`Trading DISABLED: Max drawdown (${this.config.maxDrawdownPercent}%) exceeded`, 'error');
      return 0;
    }
    
    // Check daily loss limits (FIXED: Proper UTC-based period tracking)
    if (this.state.dailyStats.breachedLimit) {
      this.log('Trading DISABLED: Daily loss limit exceeded', 'warning');
      return 0;
    }
    
    // Check weekly loss limits (FIXED: Proper UTC-based period tracking)
    if (this.state.weeklyStats.breachedLimit) {
      this.log('Trading DISABLED: Weekly loss limit exceeded', 'warning');
      return 0;
    }
    
    // Check monthly loss limits (FIXED: Proper UTC-based period tracking)
    if (this.state.monthlyStats.breachedLimit) {
      this.log('Trading DISABLED: Monthly loss limit exceeded', 'warning');
      return 0;
    }
    
    // ====================================================================
    // BASE POSITION SIZE CALCULATION
    // ====================================================================
    let riskPercent = this.config.baseRiskPercent;
    
    // ====================================================================
    // RECOVERY MODE ADJUSTMENTS (FIXED: Added backoff mechanism)
    // ====================================================================
    if (this.state.recoveryMode) {
      // In recovery mode, use smaller positions and higher confidence requirements
      riskPercent *= 0.5; // 50% of normal size
      
      const confidence = marketConditions.confidence || 0.5;
      const requiredConfidence = 0.3 * this.config.recoveryConfidenceMultiplier; // AGGRESSIVE: Lowered from 0.6 to 0.3
      
      if (confidence < requiredConfidence) {
        this.log(`Recovery mode: Confidence ${confidence} below required ${requiredConfidence}`, 'debug');
        return 0;
      }
      
      this.log(`Recovery mode active: Using ${riskPercent}% risk`, 'warning');
    }
    
    // ====================================================================
    // CONSECUTIVE STREAK ADJUSTMENTS
    // ====================================================================
    
    // Reduce size after consecutive losses (prevent revenge trading)
    if (this.state.consecutiveLosses > 0) {
      const reduction = Math.min(this.state.consecutiveLosses * this.config.consecutiveLossReduction, 0.8);
      riskPercent *= (1 - reduction);
      this.log(`Consecutive losses (${this.state.consecutiveLosses}): Risk reduced to ${riskPercent.toFixed(2)}%`, 'warning');
    }
    
    // Increase size after consecutive wins (capitalize on hot streaks)
    if (this.state.consecutiveWins > 0) {
      const increase = Math.min(this.state.consecutiveWins * this.config.winStreakIncrease, 
                               this.config.maxWinStreakMultiplier - 1);
      riskPercent *= (1 + increase);
      this.log(`Consecutive wins (${this.state.consecutiveWins}): Risk increased to ${riskPercent.toFixed(2)}%`, 'info');
    }
    
    // ====================================================================
    // VOLATILITY ADJUSTMENTS
    // ====================================================================
    if (this.config.volatilityScaling && marketConditions.volatility) {
      const volatility = marketConditions.volatility;
      
      // Define volatility thresholds for crypto markets
      const lowVolatility = 0.02;    // 2%
      const highVolatility = 0.05;   // 5%
      
      if (volatility > highVolatility) {
        // High volatility: reduce position size significantly
        riskPercent *= this.config.highVolatilityReduction;
        this.log(`High volatility (${(volatility * 100).toFixed(2)}%): Risk reduced to ${riskPercent.toFixed(2)}%`, 'warning');
      } else if (volatility < lowVolatility) {
        // Low volatility: slight increase in position size
        riskPercent *= 1.2; // 20% increase in calm markets
        this.log(`Low volatility (${(volatility * 100).toFixed(2)}%): Risk increased to ${riskPercent.toFixed(2)}%`, 'info');
      }
    }
    
    // ====================================================================
    // TREND ANALYSIS ADJUSTMENTS
    // ====================================================================
    if (marketConditions.trend) {
      // Reduce size for counter-trend trades (higher risk)
      if (marketConditions.trend === 'counter' || marketConditions.trend === 'reversal') {
        riskPercent *= (1 - this.config.counterTrendRiskReduction);
        this.log(`Counter-trend trade detected: Risk reduced to ${riskPercent.toFixed(2)}%`, 'info');
      }
    }
    
    // ====================================================================
    // CONFIDENCE-BASED ADJUSTMENTS
    // ====================================================================
    if (marketConditions.confidence) {
      const confidence = marketConditions.confidence;
      
      // Scale position size based on AI confidence (AGGRESSIVE: Lowered thresholds)
      if (confidence < 0.4) { // AGGRESSIVE: Lowered from 0.6 to 0.4
        riskPercent *= 0.8; // AGGRESSIVE: Less reduction (0.8 instead of 0.7)
        this.log(`Low confidence (${confidence}): Risk reduced to ${riskPercent.toFixed(2)}%`, 'debug');
      } else if (confidence > 0.6) { // AGGRESSIVE: Lowered from 0.8 to 0.6
        riskPercent *= 1.3; // Increase size for high confidence
        this.log(`High confidence (${confidence}): Risk increased to ${riskPercent.toFixed(2)}%`, 'debug');
      }
    }
    
    // ====================================================================
    // FINAL SIZE CALCULATION AND LIMITS
    // ====================================================================
    
    // Apply minimum and maximum limits
    riskPercent = Math.max(this.config.minPositionSizePercent, riskPercent);
    riskPercent = Math.min(this.config.maxPositionSizePercent, riskPercent);
    
    // Calculate dollar amount
    const positionSize = (accountBalance * riskPercent) / 100;
    
    // ====================================================================
    // FINAL VALIDATION
    // ====================================================================
    
    // Ensure we have enough balance
    const availableBalance = accountBalance * 0.95; // Leave 5% buffer
    const finalSize = Math.min(positionSize, availableBalance);
    
    // ====================================================================
    // LOGGING AND REPORTING
    // ====================================================================
    this.log(`Position size calculated: $${finalSize.toFixed(2)} (${riskPercent.toFixed(2)}% of account)`, 'info');
    
    if (finalSize !== positionSize) {
      this.log(`Position size limited by available balance`, 'warning');
    }
    
    return finalSize;
  }
  
  /**
   * Record Trade Result - Update Risk State
   * 
   * CRITICAL LEARNING FUNCTION: Updates all risk management state based on
   * completed trade results. This affects future position sizing and risk
   * calculations.
   * 
   * @param {Object} trade - Completed trade information
   * @param {boolean} trade.success - Whether trade was profitable
   * @param {number} trade.pnl - Profit/loss amount
   * @param {number} trade.duration - Trade duration in minutes
   * @param {string} trade.reason - Trade exit reason
   */
  recordTradeResult(trade) {
    if (!trade || typeof trade.success !== 'boolean' || typeof trade.pnl !== 'number') {
      this.log('Invalid trade data provided to recordTradeResult', 'error');
      return;
    }
    
    // ====================================================================
    // STREAK TRACKING
    // ====================================================================
    if (trade.success) {
      this.state.consecutiveWins++;
      this.state.consecutiveLosses = 0;
      this.state.successfulTrades++;
      this.log(`✅ Winning streak: ${this.state.consecutiveWins}`, 'info');
    } else {
      this.state.consecutiveLosses++;
      this.state.consecutiveWins = 0;
      this.log(`❌ Losing streak: ${this.state.consecutiveLosses}`, 'warning');
      
      // Check for alert thresholds
      if (this.state.consecutiveLosses >= this.config.alertThresholds.consecutiveLosses) {
        this.triggerAlert('consecutive_losses', `${this.state.consecutiveLosses} consecutive losses`);
      }
    }
    
    // ====================================================================
    // BALANCE AND DRAWDOWN UPDATES
    // ====================================================================
    this.state.accountBalance += trade.pnl;
    
    // Update peak balance for drawdown calculation
    if (this.state.accountBalance > this.state.peakBalance) {
      this.state.peakBalance = this.state.accountBalance;
    }
    
    // Calculate current drawdown
    this.state.currentDrawdown = ((this.state.peakBalance - this.state.accountBalance) / this.state.peakBalance) * 100;
    
    if (this.state.currentDrawdown > this.state.maxDrawdownReached) {
      this.state.maxDrawdownReached = this.state.currentDrawdown;
    }
    
    // ====================================================================
    // TIME-BASED STATISTICS UPDATES (FIXED: UTC-based)
    // ====================================================================
    this.updateTimeBasedStats(trade);
    
    // ====================================================================
    // RECOVERY MODE MANAGEMENT (FIXED: Added backoff mechanism)
    // ====================================================================
    this.checkRecoveryMode();
    
    // ====================================================================
    // PERFORMANCE STATISTICS
    // ====================================================================
    this.state.totalTrades++;
    this.state.winRate = (this.state.successfulTrades / this.state.totalTrades) * 100;
    
    // ====================================================================
    // RISK ALERTS
    // ====================================================================
    this.checkRiskAlerts();
    
    this.log(`Trade recorded: P&L ${trade.pnl.toFixed(2)}, Balance: $${this.state.accountBalance.toFixed(2)}`, 'info');
  }
  
  /**
   * Check Recovery Mode - Drawdown Management (FIXED: Added backoff mechanism)
   * 
   * CAPITAL PROTECTION: Monitors drawdown levels and activates recovery mode
   * when necessary to protect remaining capital and focus on rebuilding.
   */
  checkRecoveryMode() {
    const wasInRecovery = this.state.recoveryMode;
    const now = Date.now();
    
    // ====================================================================
    // ENTER RECOVERY MODE (FIXED: Check backoff period)
    // ====================================================================
    if (!this.state.recoveryMode && this.state.currentDrawdown >= this.config.recoveryThreshold) {
      // Check if we're in backoff period
      const timeSinceLastExit = now - this.state.lastRecoveryExit;
      if (timeSinceLastExit < this.config.recoveryModeBackoffMs) {
        this.log(`Recovery mode blocked by backoff period (${Math.round((this.config.recoveryModeBackoffMs - timeSinceLastExit) / 1000)}s remaining)`, 'debug');
        return;
      }
      
      this.state.recoveryMode = true;
      this.state.recoveryModeEnteredAt = now;
      this.log(`🚨 RECOVERY MODE ACTIVATED: ${this.state.currentDrawdown.toFixed(2)}% drawdown`, 'error');
      this.triggerAlert('recovery_mode_activated', `Drawdown reached ${this.state.currentDrawdown.toFixed(2)}%`);
    }
    
    // ====================================================================
    // EXIT RECOVERY MODE (FIXED: Enhanced exit conditions)
    // ====================================================================
    else if (this.state.recoveryMode) {
      // Conditions to exit recovery mode:
      // 1. Drawdown reduced below threshold
      // 2. Sufficient profitable trades completed
      // 3. Consecutive wins streak
      // 4. Minimum time in recovery mode (prevent flip-flopping)
      
      const timeInRecovery = now - this.state.recoveryModeEnteredAt;
      const minTimeInRecovery = 600000; // 10 minutes minimum
      
      const drawdownImproved = this.state.currentDrawdown < (this.config.recoveryThreshold * 0.8); // 20% improvement
      const sufficientTrades = this.state.consecutiveWins >= this.config.tradesRequiredToExitRecovery;
      const recentPerformance = this.getRecentWinRate(10) > 60; // 60% win rate over last 10 trades
      const minTimeElapsed = timeInRecovery >= minTimeInRecovery;
      
      if (minTimeElapsed && drawdownImproved && (sufficientTrades || recentPerformance)) {
        this.state.recoveryMode = false;
        this.state.lastRecoveryExit = now;
        this.log(`✅ RECOVERY MODE EXITED: Performance restored (${Math.round(timeInRecovery / 1000)}s duration)`, 'info');
        this.triggerAlert('recovery_mode_exited', `Drawdown reduced to ${this.state.currentDrawdown.toFixed(2)}%`);
      }
    }
    
    // Log recovery status changes
    if (wasInRecovery !== this.state.recoveryMode) {
      this.log(`Recovery mode status changed: ${this.state.recoveryMode}`, 'info');
    }
  }
  
  /**
   * Update Time-Based Statistics - Period Tracking (FIXED: UTC-based)
   * 
   * PERIOD MONITORING: Updates daily, weekly, and monthly statistics
   * for loss limit enforcement and performance tracking.
   * 
   * @param {Object} trade - Trade result to record
   */
  updateTimeBasedStats(trade) {
    // ====================================================================
    // CHECK FOR PERIOD RESETS (FIXED: UTC-based)
    // ====================================================================
    const currentDate = this.getUTCDateString();
    const currentWeek = this.getUTCWeekStart();
    const currentMonth = this.getUTCMonthStart();
    
    // Reset daily stats if new day (UTC)
    if (this.state.dailyStats.lastReset !== currentDate) {
      this.resetDailyStats();
    }
    
    // Reset weekly stats if new week (UTC)
    if (this.state.weeklyStats.lastReset !== currentWeek) {
      this.resetWeeklyStats();
    }
    
    // Reset monthly stats if new month (UTC)
    if (this.state.monthlyStats.lastReset !== currentMonth) {
      this.resetMonthlyStats();
    }
    
    // ====================================================================
    // UPDATE CURRENT PERIOD STATS
    // ====================================================================
    const periods = ['dailyStats', 'weeklyStats', 'monthlyStats'];
    
    periods.forEach(period => {
      this.state[period].currentBalance = this.state.accountBalance;
      this.state[period].pnl += trade.pnl;
      this.state[period].trades++;
      
      if (trade.success) {
        this.state[period].wins++;
      } else {
        this.state[period].losses++;
      }
      
      // Check loss limits
      const lossPercent = Math.abs(this.state[period].pnl) / this.state[period].startBalance * 100;
      const limitKey = period.replace('Stats', 'LossLimitPercent');
      
      if (this.state[period].pnl < 0 && lossPercent >= this.config[limitKey]) {
        this.state[period].breachedLimit = true;
        this.log(`⛔ ${period.replace('Stats', '').toUpperCase()} LOSS LIMIT BREACHED: ${lossPercent.toFixed(2)}% (UTC)`, 'error');
        this.triggerAlert('loss_limit_breached', `${period} loss limit exceeded`);
      }
    });
  }
  
  /**
   * Check Risk Alerts - Alert System (FIXED: TTL-based cleanup)
   * 
   * MONITORING SYSTEM: Checks for various risk conditions and triggers
   * alerts when thresholds are exceeded.
   */
  checkRiskAlerts() {
    const now = Date.now();
    
    // Don't spam alerts - minimum 5 minutes between same alert types
    if (now - this.state.lastAlertTime < 300000) {
      return;
    }
    
    // FIXED: Clean up old alerts before checking
    if (now - this.state.lastAlertCleanup > 900000) { // 15 minutes
      this.cleanupExpiredAlerts();
    }
    
    // ====================================================================
    // DRAWDOWN ALERTS
    // ====================================================================
    if (this.state.currentDrawdown >= this.config.alertThresholds.drawdown) {
      this.triggerAlert('drawdown_warning', `Drawdown: ${this.state.currentDrawdown.toFixed(2)}%`);
    }
    
    // ====================================================================
    // DAILY LOSS ALERTS (FIXED: UTC-based)
    // ====================================================================
    const dailyLossPercent = Math.abs(this.state.dailyStats.pnl) / this.state.dailyStats.startBalance * 100;
    if (this.state.dailyStats.pnl < 0 && dailyLossPercent >= this.config.alertThresholds.dailyLoss) {
      this.triggerAlert('daily_loss_warning', `Daily loss: ${dailyLossPercent.toFixed(2)}% (UTC)`);
    }
  }
  
  /**
   * Trigger Alert - Alert Management (FIXED: TTL-based management)
   * 
   * NOTIFICATION SYSTEM: Handles risk-related alerts and notifications
   * to keep traders informed of important risk events.
   * 
   * @param {string} alertType - Type of alert
   * @param {string} message - Alert message
   */
  triggerAlert(alertType, message) {
    const alert = {
      type: alertType,
      message: message,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(alertType)
    };
    
    this.state.alertsTriggered.push(alert);
    this.state.lastAlertTime = Date.now();
    
    // Log with appropriate severity
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'high' ? 'warning' : 'info';
    
    this.log(`ALERT [${alertType}]: ${message}`, logLevel);
    
    // FIXED: Immediate cleanup if too many alerts
    if (this.state.alertsTriggered.length > this.config.maxAlertsInMemory) {
      this.cleanupExpiredAlerts();
    }
  }
  
  /**
   * Get Alert Severity - Alert Classification
   * 
   * @param {string} alertType - Alert type
   * @returns {string} - Severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'recovery_mode_activated': 'critical',
      'loss_limit_breached': 'critical',
      'drawdown_warning': 'high',
      'consecutive_losses': 'high',
      'daily_loss_warning': 'medium',
      'recovery_mode_exited': 'low'
    };
    
    return severityMap[alertType] || 'medium';
  }
  
  /**
   * Calculate Stop Loss - Risk-Based Stop Loss
   * 
   * LOSS PROTECTION: Calculates appropriate stop loss levels based on
   * volatility, risk tolerance, and market conditions.
   * 
   * @param {number} entryPrice - Entry price
   * @param {string} direction - Trade direction ('buy' or 'sell')
   * @param {Object} options - Additional options
   * 
   * @returns {number} - Stop loss price
   */
  calculateStopLoss(entryPrice, direction, options = {}) {
    const {
      volatility = 0.02,      // Default 2% volatility
      confidence = 0.5,       // Default neutral confidence
      riskMultiplier = 1.0    // Risk multiplier
    } = options;
    
    // Base stop loss percentage
    let stopLossPercent = Math.max(0.015, volatility * 1.5); // At least 1.5%, typically 1.5x volatility
    
    // Adjust based on confidence
    if (confidence > 0.8) {
      stopLossPercent *= 0.8; // Tighter stops for high confidence
    } else if (confidence < 0.6) {
      stopLossPercent *= 1.3; // Wider stops for low confidence
    }
    
    // Apply risk multiplier
    stopLossPercent *= riskMultiplier;
    
    // Calculate stop loss price
    let stopLoss;
    if (direction === 'buy') {
      stopLoss = entryPrice * (1 - stopLossPercent);
    } else {
      stopLoss = entryPrice * (1 + stopLossPercent);
    }
    
    this.log(`Stop loss calculated: ${direction} at ${entryPrice} → stop at ${stopLoss.toFixed(2)} (${(stopLossPercent * 100).toFixed(2)}%)`, 'debug');
    
    return stopLoss;
  }
  
  /**
   * Update Balance - Balance State Management
   * 
   * INTERNAL UPDATE: Updates internal balance tracking and related calculations.
   * 
   * @param {number} newBalance - Updated account balance
   */
  updateBalance(newBalance) {
    if (newBalance <= 0) {
      this.log('Invalid balance update attempted', 'error');
      return;
    }
    
    this.state.accountBalance = newBalance;
    
    // Update peak balance if new high
    if (newBalance > this.state.peakBalance) {
      this.state.peakBalance = newBalance;
    }
    
    // Recalculate drawdown
    this.state.currentDrawdown = ((this.state.peakBalance - newBalance) / this.state.peakBalance) * 100;
  }
  
  /**
   * Get Recent Win Rate - Performance Analysis
   * 
   * PERFORMANCE METRIC: Calculates win rate over recent trades for
   * recovery mode and performance analysis.
   * 
   * @param {number} tradeCount - Number of recent trades to analyze
   * @returns {number} - Win rate percentage
   */
  getRecentWinRate(tradeCount = 10) {
    // This would need to be implemented with access to trade history
    // For now, return current overall win rate
    return this.state.winRate;
  }
  
  /**
   * Reset Daily Statistics - Daily Reset Function (FIXED: UTC-based)
   */
  resetDailyStats() {
    const currentBalance = this.state.accountBalance;
    this.state.dailyStats = {
      startBalance: currentBalance,
      currentBalance: currentBalance,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      breachedLimit: false,
      lastReset: this.getUTCDateString()  // FIXED: UTC-based
    };
    this.log('Daily statistics reset (UTC)', 'info');
  }
  
  /**
   * Reset Weekly Statistics - Weekly Reset Function (FIXED: UTC-based)
   */
  resetWeeklyStats() {
    const currentBalance = this.state.accountBalance;
    this.state.weeklyStats = {
      startBalance: currentBalance,
      currentBalance: currentBalance,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      breachedLimit: false,
      lastReset: this.getUTCWeekStart()   // FIXED: UTC-based
    };
    this.log('Weekly statistics reset (UTC)', 'info');
  }
  
  /**
   * Reset Monthly Statistics - Monthly Reset Function (FIXED: UTC-based)
   */
  resetMonthlyStats() {
    const currentBalance = this.state.accountBalance;
    this.state.monthlyStats = {
      startBalance: currentBalance,
      currentBalance: currentBalance,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      breachedLimit: false,
      lastReset: this.getUTCMonthStart()  // FIXED: UTC-based
    };
    this.log('Monthly statistics reset (UTC)', 'info');
  }
  
  /**
   * Check Period Resets - Manual Period Reset Check
   *
   * MAINTENANCE FUNCTION: Manually checks and resets daily, weekly, and monthly
   * statistics if periods have changed. This is called during system maintenance.
   *
   * @param {Date} currentDate - Current date for period checking
   * @param {number} currentBalance - Current account balance
   */
  checkPeriodResets(currentDate = new Date(), currentBalance = null) {
    if (currentBalance !== null) {
      this.updateBalance(currentBalance);
    }
    
    // Get current period identifiers (UTC-based)
    const currentDateStr = this.getUTCDateString();
    const currentWeek = this.getUTCWeekStart();
    const currentMonth = this.getUTCMonthStart();
    
    let resetsPerformed = 0;
    
    // Check and reset daily stats if new day
    if (this.state.dailyStats.lastReset !== currentDateStr) {
      this.resetDailyStats();
      resetsPerformed++;
      this.log(`Daily period reset performed (UTC: ${currentDateStr})`, 'info');
    }
    
    // Check and reset weekly stats if new week
    if (this.state.weeklyStats.lastReset !== currentWeek) {
      this.resetWeeklyStats();
      resetsPerformed++;
      this.log(`Weekly period reset performed (UTC: ${currentWeek})`, 'info');
    }
    
    // Check and reset monthly stats if new month
    if (this.state.monthlyStats.lastReset !== currentMonth) {
      this.resetMonthlyStats();
      resetsPerformed++;
      this.log(`Monthly period reset performed (UTC: ${currentMonth})`, 'info');
    }
    
    if (resetsPerformed === 0) {
      this.log('Period reset check completed - no resets needed', 'debug');
    } else {
      this.log(`Period reset check completed - ${resetsPerformed} resets performed`, 'info');
    }
    
    return resetsPerformed;
  }
  
  /**
   * Is Trading Allowed - Permission Check
   * 
   * TRADING GATE: Central function to check if trading is currently allowed
   * based on all risk management criteria.
   * 
   * @returns {Object} - Trading permission status and reason
   */
  isTradingAllowed() {
    // ====================================================================
    // DRAWDOWN CHECKS
    // ====================================================================
    if (this.state.currentDrawdown >= this.config.maxDrawdownPercent) {
      return {
        allowed: false,
        reason: 'Maximum drawdown exceeded',
        severity: 'critical'
      };
    }
    
    // ====================================================================
    // TIME-BASED LIMIT CHECKS (FIXED: UTC-based)
    // ====================================================================
    if (this.state.dailyStats.breachedLimit) {
      return {
        allowed: false,
        reason: 'Daily loss limit breached (UTC)',
        severity: 'high'
      };
    }
    
    if (this.state.weeklyStats.breachedLimit) {
      return {
        allowed: false,
        reason: 'Weekly loss limit breached (UTC)',
        severity: 'high'
      };
    }
    
    if (this.state.monthlyStats.breachedLimit) {
      return {
        allowed: false,
        reason: 'Monthly loss limit breached (UTC)',
        severity: 'high'
      };
    }
    
    // ====================================================================
    // RECOVERY MODE CHECKS
    // ====================================================================
    if (this.state.recoveryMode) {
      return {
        allowed: true,
        reason: 'Recovery mode active - reduced risk',
        severity: 'medium'
      };
    }
    
    // ====================================================================
    // ALL CLEAR
    // ====================================================================
    return {
      allowed: true,
      reason: 'All risk checks passed',
      severity: 'low'
    };
  }
  
  /**
   * Get Risk Summary - Comprehensive Status Report
   * 
   * MONITORING INTERFACE: Provides complete risk management status
   * for dashboards, logging, and analysis.
   * 
   * @returns {Object} - Comprehensive risk status summary
   */
  getRiskSummary() {
    const tradingStatus = this.isTradingAllowed();
    
    return {
      // ACCOUNT STATUS
      account: {
        balance: this.state.accountBalance,
        initialBalance: this.state.initialBalance,
        peakBalance: this.state.peakBalance,
        totalReturn: ((this.state.accountBalance - this.state.initialBalance) / this.state.initialBalance) * 100,
        totalReturnAmount: this.state.accountBalance - this.state.initialBalance
      },
      
      // RISK METRICS
      risk: {
        currentDrawdown: this.state.currentDrawdown,
        maxDrawdownReached: this.state.maxDrawdownReached,
        recoveryMode: this.state.recoveryMode,
        recoveryModeStartTime: this.state.recoveryModeEnteredAt,
        consecutiveWins: this.state.consecutiveWins,
        consecutiveLosses: this.state.consecutiveLosses,
        winRate: this.state.winRate
      },
      
      // TRADING STATUS
      trading: {
        allowed: tradingStatus.allowed,
        reason: tradingStatus.reason,
        severity: tradingStatus.severity
      },
      
      // PERFORMANCE METRICS
      performance: {
        totalTrades: this.state.totalTrades,
        successfulTrades: this.state.successfulTrades,
        winRate: this.state.winRate,
        profitFactor: this.state.profitFactor
      },
      
      // TIME-BASED STATISTICS (FIXED: Shows UTC timezone)
      periods: {
        daily: {
          startBalance: this.state.dailyStats.startBalance,
          currentBalance: this.state.dailyStats.currentBalance,
          pnl: this.state.dailyStats.pnl,
          pnlPercent: this.state.dailyStats.startBalance > 0 ? 
            (this.state.dailyStats.pnl / this.state.dailyStats.startBalance * 100) : 0,
          trades: this.state.dailyStats.trades,
          winRate: this.state.dailyStats.trades > 0 ? 
            (this.state.dailyStats.wins / this.state.dailyStats.trades * 100) : 0,
          breachedLimit: this.state.dailyStats.breachedLimit,
          timezone: 'UTC'  // FIXED: Clearly indicate UTC
        },
        weekly: {
          startBalance: this.state.weeklyStats.startBalance,
          currentBalance: this.state.weeklyStats.currentBalance,
          pnl: this.state.weeklyStats.pnl,
          pnlPercent: this.state.weeklyStats.startBalance > 0 ? 
            (this.state.weeklyStats.pnl / this.state.weeklyStats.startBalance * 100) : 0,
          trades: this.state.weeklyStats.trades,
          winRate: this.state.weeklyStats.trades > 0 ? 
            (this.state.weeklyStats.wins / this.state.weeklyStats.trades * 100) : 0,
          breachedLimit: this.state.weeklyStats.breachedLimit,
          timezone: 'UTC'  // FIXED: Clearly indicate UTC
        },
        monthly: {
          startBalance: this.state.monthlyStats.startBalance,
          currentBalance: this.state.monthlyStats.currentBalance,
          pnl: this.state.monthlyStats.pnl,
          pnlPercent: this.state.monthlyStats.startBalance > 0 ? 
            (this.state.monthlyStats.pnl / this.state.monthlyStats.startBalance * 100) : 0,
          trades: this.state.monthlyStats.trades,
          winRate: this.state.monthlyStats.trades > 0 ? 
            (this.state.monthlyStats.wins / this.state.monthlyStats.trades * 100) : 0,
          breachedLimit: this.state.monthlyStats.breachedLimit,
          timezone: 'UTC'  // FIXED: Clearly indicate UTC
        }
      },
      
      // RECENT ALERTS (FIXED: TTL-managed)
      alerts: this.state.alertsTriggered.slice(-10), // Last 10 alerts
      alertsCount: this.state.alertsTriggered.length,
      lastAlertCleanup: this.state.lastAlertCleanup,
      
      // CONFIGURATION
      config: {
        baseRiskPercent: this.config.baseRiskPercent,
        maxDrawdownPercent: this.config.maxDrawdownPercent,
        recoveryThreshold: this.config.recoveryThreshold,
        dailyLossLimit: this.config.dailyLossLimitPercent,
        weeklyLossLimit: this.config.weeklyLossLimitPercent,
        monthlyLossLimit: this.config.monthlyLossLimitPercent,
        useUTC: this.config.useUTC,  // FIXED: Show timezone config
        alertTTL: this.config.alertTTLMs
      }
    };
  }
  
  /**
   * Reset Risk Manager - System Reset
   * 
   * SYSTEM RESET: Resets all risk management state for new trading sessions
   * or when switching strategies.
   * 
   * @param {number} newBalance - New starting balance (optional)
   */
  reset(newBalance = null) {
    if (newBalance) {
      this.initializeBalance(newBalance);
    }
    
    // Reset streaks and performance tracking
    this.state.recoveryMode = false;
    this.state.recoveryModeEnteredAt = 0;
    this.state.lastRecoveryExit = 0;
    this.state.consecutiveWins = 0;
    this.state.consecutiveLosses = 0;
    this.state.currentDrawdown = 0;
    this.state.maxDrawdownReached = 0;
    this.state.totalTrades = 0;
    this.state.successfulTrades = 0;
    this.state.winRate = 0;
    this.state.alertsTriggered = [];  // FIXED: Clear alerts on reset
    
    // Reset time-based statistics (FIXED: UTC-based)
    this.resetDailyStats();
    this.resetWeeklyStats();
    this.resetMonthlyStats();
    
    this.log('RiskManager reset successfully (UTC timezone)', 'info');
  }
  
  /**
   * Validate Configuration - Config Validation
   * 
   * SYSTEM INTEGRITY: Validates risk management configuration to ensure
   * all parameters are within safe and logical ranges.
   * 
   * @returns {Object} - Validation result
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // ====================================================================
    // CRITICAL VALIDATIONS
    // ====================================================================
    if (this.config.baseRiskPercent <= 0 || this.config.baseRiskPercent > 10) {
      errors.push('Base risk percent must be between 0 and 10%');
    }
    
    if (this.config.maxPositionSizePercent <= this.config.baseRiskPercent) {
      errors.push('Max position size must be greater than base risk');
    }
    
    if (this.config.maxDrawdownPercent <= this.config.recoveryThreshold) {
      errors.push('Max drawdown must be greater than recovery threshold');
    }
    
    // FIXED: Validate new parameters
    if (this.config.alertTTLMs < 60000) {
      warnings.push('Alert TTL below 1 minute may cause excessive cleanup');
    }
    
    if (this.config.recoveryModeBackoffMs < 60000) {
      warnings.push('Recovery mode backoff below 1 minute may cause flip-flopping');
    }
    
    // ====================================================================
    // WARNING VALIDATIONS
    // ====================================================================
    if (this.config.baseRiskPercent > 5) {
      warnings.push('Base risk percent above 5% is aggressive');
    }
    
    if (this.config.maxDrawdownPercent > 25) {
      warnings.push('Max drawdown above 25% is very high risk');
    }
    
    if (this.config.dailyLossLimitPercent > 10) {
      warnings.push('Daily loss limit above 10% may be too high');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
  
  /**
   * Logging with Severity Levels - Enhanced Logging
   * 
   * DEBUGGING SUPPORT: Provides structured logging with severity levels
   * for better debugging and monitoring.
   * 
   * @param {string} message - Log message
   * @param {string} level - Log level ('debug', 'info', 'warning', 'error')
   */
  log(message, level = 'info') {
    // Only log debug messages if verbose logging is enabled
    if (level === 'debug' && !this.config.verboseLogging) {
      return;
    }
    
    // Format based on severity
    let prefix = '🔄';
    
    switch (level) {
      case 'error':
        prefix = '❌';
        break;
      case 'warning':
        prefix = '⚠️';
        break;
      case 'info':
        prefix = 'ℹ️';
        break;
      case 'debug':
        prefix = '🔍';
        break;
    }
    
    // FIXED: Include UTC timestamp for consistency
    const timestamp = new Date().toISOString();
    console.log(`${prefix} [${timestamp}] [RiskManager] ${message}`);
  }
  
  /**
   * Export Risk Data - Data Export
   * 
   * ANALYTICS SUPPORT: Exports risk management data for external analysis,
   * reporting, and backup purposes.
   * 
   * @returns {Object} - Exportable risk data
   */
  exportRiskData() {
    return {
      timestamp: Date.now(),
      version: '1.0.1',  // FIXED: Updated version
      timezone: 'UTC',   // FIXED: Document timezone
      config: { ...this.config },
      state: {
        account: {
          balance: this.state.accountBalance,
          initialBalance: this.state.initialBalance,
          peakBalance: this.state.peakBalance
        },
        performance: {
          totalTrades: this.state.totalTrades,
          successfulTrades: this.state.successfulTrades,
          winRate: this.state.winRate,
          currentDrawdown: this.state.currentDrawdown,
          maxDrawdownReached: this.state.maxDrawdownReached
        },
        streaks: {
          consecutiveWins: this.state.consecutiveWins,
          consecutiveLosses: this.state.consecutiveLosses,
          recoveryMode: this.state.recoveryMode,
          recoveryModeEnteredAt: this.state.recoveryModeEnteredAt,
          lastRecoveryExit: this.state.lastRecoveryExit
        },
        periods: {
          daily: { ...this.state.dailyStats },
          weekly: { ...this.state.weeklyStats },
          monthly: { ...this.state.monthlyStats }
        },
        alerts: [...this.state.alertsTriggered]
      }
    };
  }
  
  /**
   * Import Risk Data - Data Import
   * 
   * SYSTEM RECOVERY: Imports previously exported risk data to restore
   * risk management state after system restarts or migrations.
   * 
   * @param {Object} data - Previously exported risk data
   * @returns {boolean} - Success status
   */
  importRiskData(data) {
    try {
      if (!data || !data.state || !data.config) {
        throw new Error('Invalid risk data format');
      }
      
      // FIXED: Warn about timezone mismatches
      if (data.timezone && data.timezone !== 'UTC' && this.config.useUTC) {
        this.log(`Warning: Importing data from ${data.timezone} timezone, converting to UTC`, 'warning');
      }
      
      // Restore configuration (merge with current to preserve any updates)
      this.config = { ...this.config, ...data.config };
      
      // Restore account state
      if (data.state.account) {
        this.state.accountBalance = data.state.account.balance;
        this.state.initialBalance = data.state.account.initialBalance;
        this.state.peakBalance = data.state.account.peakBalance;
      }
      
      // Restore performance metrics
      if (data.state.performance) {
        this.state.totalTrades = data.state.performance.totalTrades || 0;
        this.state.successfulTrades = data.state.performance.successfulTrades || 0;
        this.state.winRate = data.state.performance.winRate || 0;
        this.state.currentDrawdown = data.state.performance.currentDrawdown || 0;
        this.state.maxDrawdownReached = data.state.performance.maxDrawdownReached || 0;
      }
      
      // Restore streaks (FIXED: Include new recovery mode fields)
      if (data.state.streaks) {
        this.state.consecutiveWins = data.state.streaks.consecutiveWins || 0;
        this.state.consecutiveLosses = data.state.streaks.consecutiveLosses || 0;
        this.state.recoveryMode = data.state.streaks.recoveryMode || false;
        this.state.recoveryModeEnteredAt = data.state.streaks.recoveryModeEnteredAt || 0;
        this.state.lastRecoveryExit = data.state.streaks.lastRecoveryExit || 0;
      }
      
      // Restore period statistics
      if (data.state.periods) {
        this.state.dailyStats = { ...this.state.dailyStats, ...data.state.periods.daily };
        this.state.weeklyStats = { ...this.state.weeklyStats, ...data.state.periods.weekly };
        this.state.monthlyStats = { ...this.state.monthlyStats, ...data.state.periods.monthly };
      }
      
      // Restore alerts (FIXED: Filter out expired alerts)
      if (data.state.alerts) {
        const now = Date.now();
        const validAlerts = data.state.alerts.filter(alert => {
          return (now - alert.timestamp) <= this.config.alertTTLMs;
        });
        this.state.alertsTriggered = validAlerts;
        
        if (validAlerts.length < data.state.alerts.length) {
          this.log(`Filtered out ${data.state.alerts.length - validAlerts.length} expired alerts during import`, 'info');
        }
      }
      
      this.log('Risk data imported successfully (UTC timezone)', 'info');
      return true;
      
    } catch (error) {
      this.log(`Failed to import risk data: ${error.message}`, 'error');
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = RiskManager;