/**
 * QUANTUM PERFORMANCE TRACKER
 * Real-time P&L, win rate, and performance metrics for EVERYTHING
 * 
 * This tracks:
 * - Every trade from every bot tier
 * - Module performance
 * - Strategy effectiveness
 * - Risk metrics
 * - Houston progress!
 * 
 * MISSION CRITICAL: Shows you're winning in real-time!
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class QuantumPerformanceTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      houstonTarget: config.houstonTarget || 25000, // Your goal!
      initialBalance: config.initialBalance || 10000,
      saveInterval: config.saveInterval || 60000, // Save every minute
      metricsWindow: config.metricsWindow || 86400000, // 24 hours
      alertThresholds: {
        drawdown: config.maxDrawdown || 0.10, // 10% max drawdown
        dailyLoss: config.maxDailyLoss || 0.05, // 5% daily loss
        winRate: config.minWinRate || 0.40, // 40% minimum win rate
        profit: config.dailyProfitTarget || 0.02 // 2% daily target
      },
      ...config
    };
    
    // Core metrics
    this.metrics = {
      // Account metrics
      currentBalance: this.config.initialBalance,
      startingBalance: this.config.initialBalance,
      peakBalance: this.config.initialBalance,
      
      // Trade metrics
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      
      // P&L metrics
      totalProfit: 0,
      totalLoss: 0,
      netPnL: 0,
      
      // Performance metrics
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      
      // Time metrics
      startTime: Date.now(),
      lastTradeTime: null,
      sessionDuration: 0,
      
      // Houston metrics!
      houstonProgress: 0,
      estimatedDaysToHouston: Infinity,
      dailyAverage: 0
    };
    
    // Bot-specific tracking
    this.botMetrics = new Map();
    this.initializeBotMetrics();
    
    // Module tracking
    this.moduleMetrics = new Map();
    
    // Strategy tracking
    this.strategyMetrics = new Map();
    
    // Trade history
    this.tradeHistory = [];
    this.dailyHistory = [];
    
    // Performance snapshots
    this.snapshots = {
      minute: [],
      hourly: [],
      daily: []
    };
    
    // Alerts
    this.alerts = [];
    
    // Auto-save timer
    this.saveTimer = null;
    
    console.log('📊 QUANTUM PERFORMANCE TRACKER INITIALIZED');
    console.log(`🎯 HOUSTON TARGET: $${this.config.houstonTarget}`);
    this.startAutoSave();
  }
  
  /**
   * INITIALIZE BOT METRICS
   */
  initializeBotMetrics() {
    const bots = ['starter', 'pro', 'elite', 'quantum'];
    
    bots.forEach(tier => {
      this.botMetrics.set(tier, {
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastTrade: null
      });
    });
  }
  
  /**
   * RECORD TRADE - The Main Event
   */
  recordTrade(trade) {
    // Validate trade object
    if (!trade.action || trade.pnl === undefined) {
      console.error('Invalid trade object:', trade);
      return;
    }
    
    const pnl = parseFloat(trade.pnl) || 0;
    const isWin = pnl > 0;
    
    // Update core metrics
    this.metrics.totalTrades++;
    this.metrics.currentBalance += pnl;
    this.metrics.netPnL += pnl;
    
    if (isWin) {
      this.metrics.winningTrades++;
      this.metrics.totalProfit += pnl;
    } else {
      this.metrics.losingTrades++;
      this.metrics.totalLoss += Math.abs(pnl);
    }
    
    // Update win rate
    this.metrics.winRate = this.metrics.winningTrades / this.metrics.totalTrades;
    
    // Update profit factor
    this.metrics.profitFactor = this.metrics.totalLoss > 0 
      ? this.metrics.totalProfit / this.metrics.totalLoss 
      : this.metrics.totalProfit || 0;
    
    // Update peak and drawdown
    if (this.metrics.currentBalance > this.metrics.peakBalance) {
      this.metrics.peakBalance = this.metrics.currentBalance;
      this.metrics.currentDrawdown = 0;
    } else {
      this.metrics.currentDrawdown = 
        (this.metrics.peakBalance - this.metrics.currentBalance) / this.metrics.peakBalance;
      
      if (this.metrics.currentDrawdown > this.metrics.maxDrawdown) {
        this.metrics.maxDrawdown = this.metrics.currentDrawdown;
      }
    }
    
    // Update Houston progress!
    this.updateHoustonProgress();
    
    // Update bot-specific metrics
    if (trade.botTier) {
      this.updateBotMetrics(trade.botTier, trade);
    }
    
    // Update module metrics
    if (trade.module) {
      this.updateModuleMetrics(trade.module, trade);
    }
    
    // Update strategy metrics
    if (trade.strategy) {
      this.updateStrategyMetrics(trade.strategy, trade);
    }
    
    // Add to history
    this.tradeHistory.push({
      ...trade,
      timestamp: trade.timestamp || Date.now(),
      balance: this.metrics.currentBalance,
      drawdown: this.metrics.currentDrawdown
    });
    
    // Keep only last 1000 trades in memory
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory.shift();
    }
    
    // Update last trade time
    this.metrics.lastTradeTime = Date.now();
    
    // Check for alerts
    this.checkAlerts();
    
    // Log the trade
    const emoji = isWin ? '💰' : '💸';
    console.log(`${emoji} Trade #${this.metrics.totalTrades}: ${trade.action} ${isWin ? 'WIN' : 'LOSS'} $${pnl.toFixed(2)}`);
    console.log(`   Balance: $${this.metrics.currentBalance.toFixed(2)} | Win Rate: ${(this.metrics.winRate * 100).toFixed(1)}%`);
    
    // Emit trade event
    this.emit('trade', {
      trade: trade,
      metrics: this.getSnapshot(),
      isWin: isWin
    });
    
    return this.metrics;
  }
  
  /**
   * UPDATE HOUSTON PROGRESS
   */
  updateHoustonProgress() {
    const needed = this.config.houstonTarget - this.metrics.startingBalance;
    const gained = this.metrics.currentBalance - this.metrics.startingBalance;
    
    this.metrics.houstonProgress = (gained / needed) * 100;
    
    // Calculate estimated days to Houston
    const daysElapsed = (Date.now() - this.metrics.startTime) / 86400000;
    if (daysElapsed > 0 && gained > 0) {
      const dailyRate = gained / daysElapsed;
      const remaining = this.config.houstonTarget - this.metrics.currentBalance;
      this.metrics.estimatedDaysToHouston = remaining / dailyRate;
      this.metrics.dailyAverage = dailyRate;
    }
    
    // Celebrate milestones!
    const milestones = [25, 50, 75, 90, 95, 99, 100];
    const currentMilestone = Math.floor(this.metrics.houstonProgress / 5) * 5;
    
    if (milestones.includes(currentMilestone) && 
        !this.alerts.find(a => a.type === 'milestone' && a.value === currentMilestone)) {
      
      console.log(`🎉🎉🎉 HOUSTON MILESTONE: ${currentMilestone}% COMPLETE! 🎉🎉🎉`);
      console.log(`💰 Current: $${this.metrics.currentBalance.toFixed(2)}`);
      console.log(`🎯 Target: $${this.config.houstonTarget}`);
      console.log(`📅 ETA: ${this.metrics.estimatedDaysToHouston.toFixed(1)} days`);
      
      this.alerts.push({
        type: 'milestone',
        value: currentMilestone,
        timestamp: Date.now()
      });
      
      this.emit('houston_milestone', {
        progress: this.metrics.houstonProgress,
        balance: this.metrics.currentBalance,
        eta: this.metrics.estimatedDaysToHouston
      });
    }
  }
  
  /**
   * UPDATE BOT METRICS
   */
  updateBotMetrics(tier, trade) {
    const bot = this.botMetrics.get(tier);
    if (!bot) return;
    
    const pnl = parseFloat(trade.pnl) || 0;
    const isWin = pnl > 0;
    
    bot.trades++;
    bot.pnl += pnl;
    
    if (isWin) {
      bot.wins++;
      bot.avgWin = ((bot.avgWin * (bot.wins - 1)) + pnl) / bot.wins;
      bot.currentStreak = Math.max(0, bot.currentStreak) + 1;
      bot.bestStreak = Math.max(bot.bestStreak, bot.currentStreak);
    } else {
      bot.losses++;
      bot.avgLoss = ((bot.avgLoss * (bot.losses - 1)) + Math.abs(pnl)) / bot.losses;
      bot.currentStreak = Math.min(0, bot.currentStreak) - 1;
    }
    
    bot.winRate = bot.wins / bot.trades;
    bot.bestTrade = Math.max(bot.bestTrade, pnl);
    bot.worstTrade = Math.min(bot.worstTrade, pnl);
    bot.lastTrade = Date.now();
  }
  
  /**
   * UPDATE MODULE METRICS
   */
  updateModuleMetrics(moduleId, trade) {
    if (!this.moduleMetrics.has(moduleId)) {
      this.moduleMetrics.set(moduleId, {
        trades: 0,
        wins: 0,
        pnl: 0,
        winRate: 0,
        avgPnl: 0
      });
    }
    
    const module = this.moduleMetrics.get(moduleId);
    const pnl = parseFloat(trade.pnl) || 0;
    
    module.trades++;
    module.pnl += pnl;
    if (pnl > 0) module.wins++;
    module.winRate = module.wins / module.trades;
    module.avgPnl = module.pnl / module.trades;
  }
  
  /**
   * UPDATE STRATEGY METRICS
   */
  updateStrategyMetrics(strategy, trade) {
    if (!this.strategyMetrics.has(strategy)) {
      this.strategyMetrics.set(strategy, {
        trades: 0,
        wins: 0,
        pnl: 0,
        winRate: 0,
        avgPnl: 0,
        bestDay: 0,
        worstDay: 0
      });
    }
    
    const strat = this.strategyMetrics.get(strategy);
    const pnl = parseFloat(trade.pnl) || 0;
    
    strat.trades++;
    strat.pnl += pnl;
    if (pnl > 0) strat.wins++;
    strat.winRate = strat.wins / strat.trades;
    strat.avgPnl = strat.pnl / strat.trades;
  }
  
  /**
   * CHECK ALERTS
   */
  checkAlerts() {
    const alerts = [];
    
    // Drawdown alert
    if (this.metrics.currentDrawdown > this.config.alertThresholds.drawdown) {
      alerts.push({
        type: 'drawdown',
        severity: 'high',
        message: `⚠️ HIGH DRAWDOWN: ${(this.metrics.currentDrawdown * 100).toFixed(1)}%`,
        value: this.metrics.currentDrawdown
      });
    }
    
    // Win rate alert
    if (this.metrics.totalTrades > 20 && 
        this.metrics.winRate < this.config.alertThresholds.winRate) {
      alerts.push({
        type: 'winRate',
        severity: 'medium',
        message: `⚠️ LOW WIN RATE: ${(this.metrics.winRate * 100).toFixed(1)}%`,
        value: this.metrics.winRate
      });
    }
    
    // Daily loss alert
    const todaysPnL = this.getTodaysPnL();
    const dailyLossPercent = Math.abs(todaysPnL) / this.metrics.startingBalance;
    
    if (todaysPnL < 0 && dailyLossPercent > this.config.alertThresholds.dailyLoss) {
      alerts.push({
        type: 'dailyLoss',
        severity: 'high',
        message: `🚨 DAILY LOSS LIMIT: $${todaysPnL.toFixed(2)}`,
        value: todaysPnL
      });
    }
    
    // Profit target achieved
    if (todaysPnL > 0) {
      const dailyProfitPercent = todaysPnL / this.metrics.startingBalance;
      if (dailyProfitPercent >= this.config.alertThresholds.profit) {
        alerts.push({
          type: 'profitTarget',
          severity: 'info',
          message: `🎯 DAILY TARGET ACHIEVED: $${todaysPnL.toFixed(2)}`,
          value: todaysPnL
        });
      }
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      if (!this.alerts.find(a => a.type === alert.type && 
          Math.abs(Date.now() - (a.timestamp || 0)) < 300000)) { // 5 min cooldown
        
        this.alerts.push({
          ...alert,
          timestamp: Date.now()
        });
        
        console.log(alert.message);
        this.emit('alert', alert);
      }
    });
  }
  
  /**
   * GET TODAY'S P&L
   */
  getTodaysPnL() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todaysTrades = this.tradeHistory.filter(t => 
      t.timestamp >= startOfDay.getTime()
    );
    
    return todaysTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  }
  
  /**
   * TAKE SNAPSHOT
   */
  takeSnapshot(interval = 'minute') {
    const snapshot = this.getSnapshot();
    
    this.snapshots[interval].push(snapshot);
    
    // Keep limited history
    const limits = {
      minute: 60,  // 1 hour
      hourly: 24,  // 1 day
      daily: 30    // 1 month
    };
    
    if (this.snapshots[interval].length > limits[interval]) {
      this.snapshots[interval].shift();
    }
    
    return snapshot;
  }
  
  /**
   * GET CURRENT SNAPSHOT
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      balance: this.metrics.currentBalance,
      pnl: this.metrics.netPnL,
      trades: this.metrics.totalTrades,
      winRate: this.metrics.winRate,
      profitFactor: this.metrics.profitFactor,
      drawdown: this.metrics.currentDrawdown,
      houstonProgress: this.metrics.houstonProgress
    };
  }
  
  /**
   * GET FULL REPORT
   */
  getReport() {
    const report = {
      overview: {
        balance: this.metrics.currentBalance,
        totalPnL: this.metrics.netPnL,
        roi: ((this.metrics.currentBalance - this.metrics.startingBalance) / 
               this.metrics.startingBalance * 100).toFixed(2) + '%',
        houstonProgress: this.metrics.houstonProgress.toFixed(1) + '%',
        estimatedDaysToHouston: this.metrics.estimatedDaysToHouston
      },
      
      performance: {
        totalTrades: this.metrics.totalTrades,
        winRate: (this.metrics.winRate * 100).toFixed(1) + '%',
        profitFactor: this.metrics.profitFactor.toFixed(2),
        avgWin: this.metrics.winningTrades > 0 
          ? (this.metrics.totalProfit / this.metrics.winningTrades).toFixed(2)
          : 0,
        avgLoss: this.metrics.losingTrades > 0
          ? (this.metrics.totalLoss / this.metrics.losingTrades).toFixed(2)
          : 0,
        maxDrawdown: (this.metrics.maxDrawdown * 100).toFixed(1) + '%',
        currentDrawdown: (this.metrics.currentDrawdown * 100).toFixed(1) + '%'
      },
      
      bots: Object.fromEntries(this.botMetrics),
      modules: Object.fromEntries(this.moduleMetrics),
      strategies: Object.fromEntries(this.strategyMetrics),
      
      recent: {
        todaysPnL: this.getTodaysPnL(),
        last10Trades: this.tradeHistory.slice(-10),
        alerts: this.alerts.slice(-5)
      }
    };
    
    return report;
  }
  
  /**
   * SAVE METRICS TO FILE
   */
  async saveMetrics() {
    try {
      const data = {
        metrics: this.metrics,
        bots: Object.fromEntries(this.botMetrics),
        modules: Object.fromEntries(this.moduleMetrics),
        strategies: Object.fromEntries(this.strategyMetrics),
        history: this.tradeHistory.slice(-100), // Last 100 trades
        snapshots: this.snapshots,
        savedAt: Date.now()
      };
      
      const filepath = path.join(
        process.cwd(), 
        'output',
        'performance_reports',
        `metrics_${new Date().toISOString().split('T')[0]}.json`
      );
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      console.log(`💾 Metrics saved to ${filepath}`);
      
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }
  
  /**
   * START AUTO-SAVE
   */
  startAutoSave() {
    this.saveTimer = setInterval(() => {
      this.saveMetrics();
      this.takeSnapshot('hourly');
      
      // Daily snapshot at midnight
      const hour = new Date().getHours();
      if (hour === 0) {
        this.takeSnapshot('daily');
      }
    }, this.config.saveInterval);
    
    // Minute snapshots
    setInterval(() => {
      this.takeSnapshot('minute');
    }, 60000);
  }
  
  /**
   * SHUTDOWN
   */
  async shutdown() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    
    await this.saveMetrics();
    
    console.log('📊 Performance tracker shutdown');
    console.log(`Final Balance: $${this.metrics.currentBalance.toFixed(2)}`);
    console.log(`Total P&L: $${this.metrics.netPnL.toFixed(2)}`);
    console.log(`Houston Progress: ${this.metrics.houstonProgress.toFixed(1)}%`);
  }
}

module.exports = QuantumPerformanceTracker;

/**
 * USAGE:
 * 
 * const tracker = new QuantumPerformanceTracker({
 *   houstonTarget: 25000,
 *   initialBalance: 10000
 * });
 * 
 * // Record trades
 * tracker.recordTrade({
 *   action: 'BUY',
 *   pnl: 150,
 *   botTier: 'quantum',
 *   module: 'quantum-gan',
 *   strategy: 'momentum'
 * });
 * 
 * // Get report
 * const report = tracker.getReport();
 * console.log('Performance:', report);
 * 
 * // Listen for alerts
 * tracker.on('alert', (alert) => {
 *   console.log('ALERT:', alert);
 * });
 * 
 * // Listen for Houston milestones!
 * tracker.on('houston_milestone', (data) => {
 *   console.log('HOUSTON MILESTONE!', data);
 * });
 */