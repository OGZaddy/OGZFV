// ===================================================================
// SELF-LEARNING LOG ANALYSIS SYSTEM - COMPLETE FEEDBACK LOOP!
// ===================================================================
// Not just compression - REAL-TIME LEARNING AND ADAPTATION!

const EventEmitter = require('events');
const MLLogProcessor = require('./MLLogProcessor');

class LogLearningSystem extends EventEmitter {
  constructor(tradingBot) {
    super();
    
    this.bot = tradingBot;
    this.processor = new MLLogProcessor();
    
    // Learning accumulators
    this.insights = {
      profitablePatterns: new Map(),
      failurePatterns: new Map(),
      optimalTimes: new Map(),
      dangerSignals: new Set(),
      successSequences: [],
      cosmicCorrelations: new Map()
    };
    
    // Real-time metrics
    this.realtimeMetrics = {
      last5MinWinRate: 0,
      currentHotPatterns: [],
      dangerLevel: 0,
      confidenceMultiplier: 1.0,
      suggestedProfile: null
    };
    
    // Analysis intervals
    this.startRealtimeAnalysis();
    
    console.log('🧠 LOG LEARNING SYSTEM ACTIVATED - Bot will learn from itself!');
  }
  
  /**
   * Process log with learning extraction
   */
  async processLogWithLearning(logEntry) {
    // Let ML processor handle compression
    await this.processor.processLog(logEntry);
    
    // Extract learning insights
    await this.extractInsights(logEntry);
    
    // Check for immediate feedback opportunities
    const feedback = this.checkImmediateFeedback(logEntry);
    if (feedback) {
      await this.applyFeedback(feedback);
    }
  }
  
  /**
   * Extract insights from log patterns
   */
  async extractInsights(logEntry) {
    const message = logEntry.message.toLowerCase();
    
    // PROFIT PATTERN DETECTION
    if (message.includes('profit') && message.includes('+')) {
      const profitMatch = message.match(/\+(\d+\.?\d*)%/);
      if (profitMatch) {
        const profit = parseFloat(profitMatch[1]);
        
        // Look back at last 10 logs to find what led to this profit
        const recentLogs = await this.processor.queryLogs({
          endTime: Date.now(),
          startTime: Date.now() - 60000, // Last minute
          logType: 'decisions'
        });
        
        // Find patterns that preceded profit
        for (const log of recentLogs) {
          const pattern = this.extractTradingPattern(log);
          if (pattern) {
            const stats = this.insights.profitablePatterns.get(pattern) || {
              count: 0,
              totalProfit: 0,
              avgProfit: 0
            };
            
            stats.count++;
            stats.totalProfit += profit;
            stats.avgProfit = stats.totalProfit / stats.count;
            
            this.insights.profitablePatterns.set(pattern, stats);
            
            // HOT PATTERN ALERT!
            if (stats.count > 5 && stats.avgProfit > 0.5) {
              console.log(`🔥 HOT PATTERN DETECTED: ${pattern} → Avg ${stats.avgProfit.toFixed(2)}%`);
              this.realtimeMetrics.currentHotPatterns.push(pattern);
            }
          }
        }
      }
    }
    
    // FAILURE PATTERN DETECTION
    if (message.includes('loss') || message.includes('-')) {
      const lossMatch = message.match(/-(\d+\.?\d*)%/);
      if (lossMatch) {
        const loss = parseFloat(lossMatch[1]);
        
        // Find what led to this loss
        const recentLogs = await this.processor.queryLogs({
          endTime: Date.now(),
          startTime: Date.now() - 60000,
          logType: 'decisions'
        });
        
        for (const log of recentLogs) {
          const pattern = this.extractTradingPattern(log);
          if (pattern) {
            const stats = this.insights.failurePatterns.get(pattern) || {
              count: 0,
              totalLoss: 0,
              avgLoss: 0
            };
            
            stats.count++;
            stats.totalLoss += loss;
            stats.avgLoss = stats.totalLoss / stats.count;
            
            this.insights.failurePatterns.set(pattern, stats);
            
            // DANGER PATTERN ALERT!
            if (stats.count > 3 && stats.avgLoss > 0.3) {
              console.log(`⚠️ DANGER PATTERN: ${pattern} → Avg -${stats.avgLoss.toFixed(2)}%`);
              this.insights.dangerSignals.add(pattern);
              this.realtimeMetrics.dangerLevel++;
            }
          }
        }
      }
    }
    
    // TIME-BASED SUCCESS TRACKING
    if (message.includes('trade executed')) {
      const hour = new Date().getHours();
      const timeStats = this.insights.optimalTimes.get(hour) || {
        trades: 0,
        profitable: 0,
        winRate: 0
      };
      
      timeStats.trades++;
      this.insights.optimalTimes.set(hour, timeStats);
    }
    
    // COSMIC CORRELATION TRACKING
    if (message.includes('cosmic') || message.includes('moon')) {
      const cosmicMatch = message.match(/moon phase: (\w+)/i);
      if (cosmicMatch) {
        const phase = cosmicMatch[1];
        const correlation = this.insights.cosmicCorrelations.get(phase) || {
          trades: 0,
          profits: 0
        };
        
        correlation.trades++;
        this.insights.cosmicCorrelations.set(phase, correlation);
      }
    }
  }
  
  /**
   * Extract trading pattern from log
   */
  extractTradingPattern(log) {
    const patterns = [];
    
    // RSI patterns
    const rsiMatch = log.message.match(/rsi[:\s]+(\d+)/i);
    if (rsiMatch) {
      const rsi = parseInt(rsiMatch[1]);
      if (rsi < 30) patterns.push('RSI_OVERSOLD');
      else if (rsi > 70) patterns.push('RSI_OVERBOUGHT');
    }
    
    // MACD patterns
    if (log.message.includes('macd cross')) {
      patterns.push(log.message.includes('up') ? 'MACD_BULL_CROSS' : 'MACD_BEAR_CROSS');
    }
    
    // Aggressive mode patterns
    if (log.message.includes('aggressive')) {
      patterns.push('AGGRESSIVE_TRADE');
    }
    
    // Cosmic patterns
    if (log.message.includes('cosmic aligned')) {
      patterns.push('COSMIC_ALIGNMENT');
    }
    
    return patterns.join('_') || null;
  }
  
  /**
   * Check for immediate feedback opportunities
   */
  checkImmediateFeedback(logEntry) {
    const feedback = [];
    
    // CHECK 1: Too many losses in a row
    if (this.realtimeMetrics.dangerLevel > 5) {
      feedback.push({
        type: 'EMERGENCY',
        action: 'SWITCH_PROFILE',
        value: 'conservative',
        reason: 'Multiple danger patterns detected'
      });
    }
    
    // CHECK 2: Hot pattern detected
    if (this.realtimeMetrics.currentHotPatterns.length > 0) {
      feedback.push({
        type: 'OPPORTUNITY',
        action: 'BOOST_CONFIDENCE',
        patterns: this.realtimeMetrics.currentHotPatterns,
        multiplier: 1.2
      });
    }
    
    // CHECK 3: Optimal trading time
    const hour = new Date().getHours();
    const timeStats = this.insights.optimalTimes.get(hour);
    if (timeStats && timeStats.trades > 10 && timeStats.winRate > 0.7) {
      feedback.push({
        type: 'TIME_ADVANTAGE',
        action: 'INCREASE_AGGRESSION',
        reason: `Historical ${(timeStats.winRate * 100).toFixed(0)}% win rate at ${hour}:00`
      });
    }
    
    return feedback.length > 0 ? feedback : null;
  }
  
  /**
   * Apply feedback to bot in real-time
   */
  async applyFeedback(feedbackArray) {
    for (const feedback of feedbackArray) {
      console.log(`🔄 APPLYING FEEDBACK: ${feedback.type} - ${feedback.action}`);
      
      switch (feedback.action) {
        case 'SWITCH_PROFILE':
          if (this.bot.hitch) {
            await this.bot.hitch.processCommand(`activate ${feedback.value} profile`);
          }
          console.log(`⚡ LEARNED: Switched to ${feedback.value} due to ${feedback.reason}`);
          break;
          
        case 'BOOST_CONFIDENCE':
          this.realtimeMetrics.confidenceMultiplier = feedback.multiplier;
          // Inject into bot's decision making
          if (this.bot.config) {
            this.bot.config.minConfidenceThreshold *= 0.9; // Lower threshold for hot patterns
          }
          console.log(`🔥 LEARNED: Boosting confidence for patterns: ${feedback.patterns.join(', ')}`);
          break;
          
        case 'INCREASE_AGGRESSION':
          if (this.bot.aggressiveTradingMode) {
            this.bot.aggressiveTradingMode.randomTradeChance *= 1.5;
          }
          console.log(`⏰ LEARNED: ${feedback.reason} - Increasing aggression!`);
          break;
      }
    }
  }
  
  /**
   * Start real-time analysis loops
   */
  startRealtimeAnalysis() {
    // Every minute: Calculate win rate
    setInterval(() => {
      this.calculateRealtimeMetrics();
    }, 60000);
    
    // Every 5 minutes: Deep pattern analysis
    setInterval(() => {
      this.performDeepAnalysis();
    }, 5 * 60000);
    
    // Every hour: Generate learning report
    setInterval(() => {
      this.generateLearningReport();
    }, 60 * 60000);
  }
  
  /**
   * Calculate real-time metrics
   */
  async calculateRealtimeMetrics() {
    const recentTrades = await this.processor.queryLogs({
      logType: 'trades',
      startTime: Date.now() - 5 * 60000 // Last 5 minutes
    });
    
    const wins = recentTrades.filter(log => log.message.includes('profit')).length;
    const total = recentTrades.length;
    
    this.realtimeMetrics.last5MinWinRate = total > 0 ? wins / total : 0;
    
    // Alert if win rate drops
    if (total > 5 && this.realtimeMetrics.last5MinWinRate < 0.3) {
      console.log('⚠️ LEARNING ALERT: Win rate dropped to', 
        (this.realtimeMetrics.last5MinWinRate * 100).toFixed(0) + '%');
      
      // Auto-adjust
      await this.applyFeedback([{
        type: 'POOR_PERFORMANCE',
        action: 'SWITCH_PROFILE',
        value: 'conservative',
        reason: 'Win rate below 30%'
      }]);
    }
  }
  
  /**
   * Deep pattern analysis
   */
  async performDeepAnalysis() {
    console.log('🔍 Performing deep pattern analysis...');
    
    // Find pattern combinations that work together
    const successSequences = [];
    
    for (const [pattern1, stats1] of this.insights.profitablePatterns) {
      for (const [pattern2, stats2] of this.insights.profitablePatterns) {
        if (pattern1 !== pattern2) {
          // Check if these patterns appear together
          const combinedAvg = (stats1.avgProfit + stats2.avgProfit) / 2;
          if (combinedAvg > 1.0) {
            successSequences.push({
              patterns: [pattern1, pattern2],
              expectedProfit: combinedAvg
            });
          }
        }
      }
    }
    
    this.insights.successSequences = successSequences
      .sort((a, b) => b.expectedProfit - a.expectedProfit)
      .slice(0, 10);
    
    if (successSequences.length > 0) {
      console.log('🎯 TOP PATTERN COMBINATIONS FOUND:');
      this.insights.successSequences.forEach((seq, i) => {
        console.log(`${i + 1}. ${seq.patterns.join(' + ')} → ${seq.expectedProfit.toFixed(2)}% avg`);
      });
    }
  }
  
  /**
   * Generate learning report
   */
  generateLearningReport() {
    console.log('\n📊 HOURLY LEARNING REPORT:');
    console.log('========================');
    
    // Profitable patterns
    console.log('\n✅ TOP PROFITABLE PATTERNS:');
    const topPatterns = Array.from(this.insights.profitablePatterns.entries())
      .sort((a, b) => b[1].avgProfit - a[1].avgProfit)
      .slice(0, 5);
    
    topPatterns.forEach(([pattern, stats]) => {
      console.log(`  ${pattern}: ${stats.count} trades, avg +${stats.avgProfit.toFixed(2)}%`);
    });
    
    // Danger patterns
    console.log('\n❌ DANGER PATTERNS TO AVOID:');
    this.insights.dangerSignals.forEach(pattern => {
      console.log(`  ${pattern}`);
    });
    
    // Optimal times
    console.log('\n⏰ BEST TRADING HOURS:');
    const bestHours = Array.from(this.insights.optimalTimes.entries())
      .filter(([hour, stats]) => stats.trades > 5)
      .sort((a, b) => b[1].winRate - a[1].winRate)
      .slice(0, 3);
    
    bestHours.forEach(([hour, stats]) => {
      console.log(`  ${hour}:00 - Win rate: ${(stats.winRate * 100).toFixed(0)}%`);
    });
    
    // Cosmic correlations
    if (this.insights.cosmicCorrelations.size > 0) {
      console.log('\n🌙 COSMIC CORRELATIONS:');
      this.insights.cosmicCorrelations.forEach((stats, phase) => {
        console.log(`  ${phase}: ${stats.trades} trades`);
      });
    }
    
    console.log('\n💡 SUGGESTED ACTION:');
    if (this.realtimeMetrics.suggestedProfile) {
      console.log(`  Switch to ${this.realtimeMetrics.suggestedProfile} profile`);
    }
    
    console.log('========================\n');
  }
  
  /**
   * Get current learning state
   */
  getLearningState() {
    return {
      insights: {
        profitablePatterns: Array.from(this.insights.profitablePatterns.entries()),
        dangerPatterns: Array.from(this.insights.dangerSignals),
        optimalHours: Array.from(this.insights.optimalTimes.entries()),
        successCombos: this.insights.successSequences
      },
      metrics: this.realtimeMetrics,
      recommendation: this.generateRecommendation()
    };
  }
  
  /**
   * Generate trading recommendation based on learning
   */
  generateRecommendation() {
    const hour = new Date().getHours();
    const timeStats = this.insights.optimalTimes.get(hour);
    
    let recommendation = {
      action: 'CONTINUE',
      confidence: 'NORMAL',
      reason: 'Standard operating conditions'
    };
    
    // Check if it's a good hour
    if (timeStats && timeStats.winRate > 0.7) {
      recommendation = {
        action: 'INCREASE_ACTIVITY',
        confidence: 'HIGH',
        reason: `Historical ${(timeStats.winRate * 100).toFixed(0)}% win rate at this hour`
      };
    }
    
    // Check if we have hot patterns
    if (this.realtimeMetrics.currentHotPatterns.length > 2) {
      recommendation = {
        action: 'AGGRESSIVE_MODE',
        confidence: 'VERY_HIGH',
        reason: `${this.realtimeMetrics.currentHotPatterns.length} hot patterns active`
      };
    }
    
    // Check danger level
    if (this.realtimeMetrics.dangerLevel > 3) {
      recommendation = {
        action: 'REDUCE_RISK',
        confidence: 'LOW',
        reason: 'Multiple danger patterns detected'
      };
    }
    
    return recommendation;
  }
  
  /**
   * Reset danger level periodically
   */
  resetDangerLevel() {
    this.realtimeMetrics.dangerLevel = Math.max(0, this.realtimeMetrics.dangerLevel - 1);
    this.realtimeMetrics.currentHotPatterns = this.realtimeMetrics.currentHotPatterns.slice(-5); // Keep last 5
  }
  
  /**
   * Get ML processor stats
   */
  getProcessorStats() {
    return this.processor.getStats();
  }
  
  /**
   * Force learning analysis
   */
  async forceLearningAnalysis() {
    await this.performDeepAnalysis();
    this.generateLearningReport();
    return this.getLearningState();
  }
  
  /**
   * Export learning data for backup
   */
  exportLearningData() {
    return {
      insights: {
        profitablePatterns: Array.from(this.insights.profitablePatterns.entries()),
        failurePatterns: Array.from(this.insights.failurePatterns.entries()),
        optimalTimes: Array.from(this.insights.optimalTimes.entries()),
        dangerSignals: Array.from(this.insights.dangerSignals),
        successSequences: this.insights.successSequences,
        cosmicCorrelations: Array.from(this.insights.cosmicCorrelations.entries())
      },
      metrics: this.realtimeMetrics,
      timestamp: Date.now(),
      version: '1.0'
    };
  }
  
  /**
   * Import learning data from backup
   */
  importLearningData(data) {
    if (data.insights) {
      this.insights.profitablePatterns = new Map(data.insights.profitablePatterns || []);
      this.insights.failurePatterns = new Map(data.insights.failurePatterns || []);
      this.insights.optimalTimes = new Map(data.insights.optimalTimes || []);
      this.insights.dangerSignals = new Set(data.insights.dangerSignals || []);
      this.insights.successSequences = data.insights.successSequences || [];
      this.insights.cosmicCorrelations = new Map(data.insights.cosmicCorrelations || []);
    }
    
    if (data.metrics) {
      this.realtimeMetrics = { ...this.realtimeMetrics, ...data.metrics };
    }
    
    console.log('🧠 Learning data imported successfully!');
  }
  
  /**
   * Stop learning system
   */
  stop() {
    this.processor.stop();
    console.log('🛑 Learning System stopped');
  }
}

module.exports = LogLearningSystem;