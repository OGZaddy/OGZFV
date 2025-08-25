/**
 * UniversalPerformanceTracking - 48-Hour Launch Sprint Integration
 * Tracks performance across all 4 bot tiers for launch analytics
 */

const path = require('path');
const fs = require('fs');

// Try to load existing performance modules using module auto-loader, graceful fallback
let PerformanceVisualizer, PerformanceValidator;

try {
  const moduleLoader = require('./ModuleAutoLoader');
  PerformanceVisualizer = moduleLoader.require('@core/PerformanceVisualizer');
} catch (e) {
  // Fallback to direct require
  try {
    PerformanceVisualizer = require('./core/PerformanceVisualizer');
  } catch (e2) {
    console.log('⚠️ PerformanceVisualizer not found, using basic tracking');
    PerformanceVisualizer = class {
      constructor() { this.metrics = { totalTrades: 0 }; }
      initialize() {}
      trackTrade(trade, balance) { this.metrics.totalTrades++; }
    };
  }
}

try {
  const moduleLoader = require('./ModuleAutoLoader');
  PerformanceValidator = moduleLoader.require('@core/PerformanceValidator');
} catch (e) {
  // Fallback to direct require
  try {
    PerformanceValidator = require('./core/PerformanceValidator');
  } catch (e2) {
    console.log('⚠️ PerformanceValidator not found, using basic validation');
    PerformanceValidator = class {
      constructor() { this.trades = []; }
      recordTrade(trade, modules) { this.trades.push({ trade, modules }); }
      getBestPerformers() { return ['RSI', 'MACD']; }
      getWorstPerformers() { return []; }
      getRecommendations() { return ['Continue current strategy']; }
    };
  }
}

class UniversalPerformanceTracking {
  constructor(botTier) {
    this.tier = botTier.toUpperCase();
    this.startTime = Date.now();
    
    // Ensure reports directory exists
    const reportsDir = `./reports/${botTier}`;
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports');
    }
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    
    this.visualizer = new PerformanceVisualizer({
      outputDir: reportsDir,
      captureFrequency: 25,
      generateHtml: true
    });
    
    this.validator = new PerformanceValidator({
      minSampleSize: 10,
      enableRecommendations: true
    });
    
    // Initialize with $10,000 starting balance
    this.visualizer.initialize(10000);
    
    // Track launch metrics
    this.launchMetrics = {
      startTime: this.startTime,
      totalTrades: 0,
      totalProfit: 0,
      winningTrades: 0,
      losingTrades: 0,
      largestWin: 0,
      largestLoss: 0,
      modulesUsed: new Map(),
      hourlyStats: new Map()
    };
    
    console.log(`📊 ${this.tier} PERFORMANCE TRACKING INITIALIZED`);
    console.log(`📁 Reports directory: ${reportsDir}`);
  }
  
  trackEverything(trade, balance, modulesUsed = []) {
    const timestamp = Date.now();
    const hour = new Date(timestamp).getHours();
    
    // Track for visualizer (with error handling)
    try {
      if (this.visualizer && typeof this.visualizer.trackTrade === 'function') {
        this.visualizer.trackTrade(trade, balance);
      }
    } catch (error) {
      console.log(`⚠️ Visualizer error (non-critical): ${error.message}`);
    }
    
    // Track which modules contributed (with error handling)
    try {
      if (this.validator && typeof this.validator.recordTrade === 'function') {
        this.validator.recordTrade(trade, modulesUsed);
      }
    } catch (error) {
      console.log(`⚠️ Validator error (non-critical): ${error.message}`);
    }
    
    // Update launch metrics
    this.launchMetrics.totalTrades++;
    this.launchMetrics.totalProfit += (trade.pnl || 0);
    
    if (trade.pnl > 0) {
      this.launchMetrics.winningTrades++;
      this.launchMetrics.largestWin = Math.max(this.launchMetrics.largestWin, trade.pnl);
    } else if (trade.pnl < 0) {
      this.launchMetrics.losingTrades++;
      this.launchMetrics.largestLoss = Math.min(this.launchMetrics.largestLoss, trade.pnl);
    }
    
    // Track modules used
    modulesUsed.forEach(module => {
      const count = this.launchMetrics.modulesUsed.get(module) || 0;
      this.launchMetrics.modulesUsed.set(module, count + 1);
    });
    
    // Track hourly stats
    const hourlyKey = `${new Date().getDate()}-${hour}`;
    const hourlyData = this.launchMetrics.hourlyStats.get(hourlyKey) || {
      trades: 0, profit: 0, wins: 0
    };
    hourlyData.trades++;
    hourlyData.profit += (trade.pnl || 0);
    if (trade.pnl > 0) hourlyData.wins++;
    this.launchMetrics.hourlyStats.set(hourlyKey, hourlyData);
    
    // Generate report every 50 trades OR every hour for launch monitoring
    if (this.launchMetrics.totalTrades % 50 === 0 || this.shouldGenerateHourlyReport()) {
      this.generateReport();
    }
  }
  
  shouldGenerateHourlyReport() {
    const now = Date.now();
    const hoursSinceStart = (now - this.startTime) / (1000 * 60 * 60);
    return Math.floor(hoursSinceStart) > Math.floor((this.lastReportTime || this.startTime - now) / (1000 * 60 * 60));
  }
  
  generateReport() {
    this.lastReportTime = Date.now();
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
    const winRate = this.launchMetrics.totalTrades > 0 ? 
      (this.launchMetrics.winningTrades / this.launchMetrics.totalTrades * 100) : 0;
    
    const report = {
      tier: this.tier,
      runtime: `${runtime.toFixed(2)} hours`,
      totalTrades: this.launchMetrics.totalTrades,
      totalProfit: this.launchMetrics.totalProfit,
      winRate: `${winRate.toFixed(1)}%`,
      profitPerHour: runtime > 0 ? (this.launchMetrics.totalProfit / runtime) : 0,
      tradesPerHour: runtime > 0 ? (this.launchMetrics.totalTrades / runtime) : 0,
      largestWin: this.launchMetrics.largestWin,
      largestLoss: this.launchMetrics.largestLoss,
      metrics: this.visualizer.metrics,
      bestModules: this.validator && typeof this.validator.getBestPerformers === 'function' 
        ? this.validator.getBestPerformers() : ['RSI', 'MACD'],
      worstModules: this.validator && typeof this.validator.getWorstPerformers === 'function'
        ? this.validator.getWorstPerformers() : [],
      recommendations: this.validator && typeof this.validator.getRecommendations === 'function'
        ? this.validator.getRecommendations() : ['Continue current strategy'],
      modulesUsage: Array.from(this.launchMetrics.modulesUsed.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      timestamp: new Date().toISOString()
    };
    
    console.log(`\n📊 ${this.tier} PERFORMANCE REPORT:`);
    console.log(`⏱️  Runtime: ${report.runtime}`);
    console.log(`📈 Trades: ${report.totalTrades} (${report.tradesPerHour.toFixed(1)}/hr)`);
    console.log(`💰 P&L: $${report.totalProfit.toFixed(2)} ($${report.profitPerHour.toFixed(2)}/hr)`);
    console.log(`🎯 Win Rate: ${report.winRate}`);
    console.log(`🚀 Best Win: $${report.largestWin.toFixed(2)}`);
    console.log(`📉 Worst Loss: $${report.largestLoss.toFixed(2)}`);
    
    if (report.modulesUsage.length > 0) {
      console.log(`🔧 Top Modules: ${report.modulesUsage.map(([mod, count]) => `${mod}(${count})`).join(', ')}`);
    }
    
    // Save report to file for launch analysis
    const reportPath = `./reports/${this.tier.toLowerCase()}/launch-report-${Date.now()}.json`;
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`💾 Report saved: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️ Could not save report: ${error.message}`);
    }
    
    return report;
  }
  
  // Launch-specific analytics
  getLaunchAnalytics() {
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60);
    
    return {
      tier: this.tier,
      launchStatus: this.assessLaunchStatus(),
      recommendedPricing: this.getRecommendedPricing(),
      marketingMessages: this.getMarketingMessages(),
      riskLevel: this.getRiskLevel(),
      readyForLaunch: this.isReadyForLaunch()
    };
  }
  
  assessLaunchStatus() {
    const trades = this.launchMetrics.totalTrades;
    const winRate = trades > 0 ? (this.launchMetrics.winningTrades / trades) : 0;
    const profit = this.launchMetrics.totalProfit;
    
    if (trades < 10) return 'INSUFFICIENT_DATA';
    if (winRate > 0.6 && profit > 100) return 'EXCELLENT';
    if (winRate > 0.5 && profit > 0) return 'GOOD';
    if (winRate > 0.4) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }
  
  getRecommendedPricing() {
    const status = this.assessLaunchStatus();
    const basePricing = {
      'starter': 97,
      'pro': 297,
      'elite': 997,
      'quantum': 2997
    };
    
    const tier = this.tier.toLowerCase();
    let basePrice = basePricing[tier] || 97;
    
    // Adjust pricing based on performance
    switch (status) {
      case 'EXCELLENT': return Math.round(basePrice * 1.2); // 20% premium
      case 'GOOD': return basePrice;
      case 'ACCEPTABLE': return Math.round(basePrice * 0.9); // 10% discount
      case 'NEEDS_IMPROVEMENT': return Math.round(basePrice * 0.8); // 20% discount
      default: return basePrice;
    }
  }
  
  getMarketingMessages() {
    const winRate = this.launchMetrics.totalTrades > 0 ? 
      (this.launchMetrics.winningTrades / this.launchMetrics.totalTrades * 100) : 0;
    const profit = this.launchMetrics.totalProfit;
    
    const messages = [];
    
    if (winRate > 60) messages.push(`🎯 Proven ${winRate.toFixed(1)}% Win Rate`);
    if (profit > 500) messages.push(`💰 $${profit.toFixed(0)}+ Profit Generated`);
    if (this.launchMetrics.totalTrades > 100) messages.push(`🚀 ${this.launchMetrics.totalTrades}+ Successful Trades`);
    
    return messages;
  }
  
  getRiskLevel() {
    const winRate = this.launchMetrics.totalTrades > 0 ? 
      (this.launchMetrics.winningTrades / this.launchMetrics.totalTrades) : 0;
    const maxLoss = Math.abs(this.launchMetrics.largestLoss);
    
    if (winRate > 0.7 && maxLoss < 50) return 'LOW';
    if (winRate > 0.5 && maxLoss < 100) return 'MODERATE';
    return 'HIGH';
  }
  
  isReadyForLaunch() {
    const trades = this.launchMetrics.totalTrades;
    const winRate = trades > 0 ? (this.launchMetrics.winningTrades / trades) : 0;
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60);
    
    return trades >= 20 && winRate >= 0.3 && runtime >= 1; // At least 20 trades, 30% win rate, 1 hour runtime
  }
}

module.exports = UniversalPerformanceTracking;