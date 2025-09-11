// ========================================================================
// 🚀 SIMPLE PRODUCTION BACKTEST - NO TIERS, JUST CORE LOGIC
// ========================================================================
// Matches production bot's trading logic without tier complexity
// ========================================================================

const fs = require('fs');

// Core modules
const RiskManager = require('./core/RiskManager');
const { OptimizedTradingBrain } = require('./core/OptimizedTradingBrain');
const MaxProfitManager = require('./core/MaxProfitManager');
const TradingSafetyNet = require('./core/TradingSafetyNet');
const PerformanceAnalyzer = require('./core/PerformanceAnalyzer');

// Offensive modules (for signal generation)
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');
const OptimizedIndicators = require('./core/OptimizedIndicators');
const ComprehensivePatternDetector = require('./core/ComprehensivePatternDetector');

class SimpleProductionBacktest {
  constructor(config = {}) {
    console.log('\n🚀 SIMPLE PRODUCTION BACKTEST ENGINE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('NO TIERS - Just core trading logic with all modules');
    console.log('════════════════════════════════════════════════════════════\n');
    
    // Configuration
    this.config = {
      initialBalance: config.initialBalance || 10000,
      maxPositions: 3,
      maxPositionSize: 0.25,
      minTradeConfidence: 0.3,
      stopLossPercent: 0.03,  // 3% stop loss (after 1% entry cost)
      takeProfitPercent: 0.05, // 5% take profit (to cover 1% entry + decent profit)
      maxLeverage: 1,
      enablePatterns: true,
      ...config
    };
    
    // Initialize state
    this.balance = this.config.initialBalance;
    this.activePositions = new Map();
    this.tradingHistory = [];
    this.priceData = [];
    this.priceHistory = [];
    
    // System state
    this.systemState = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      balance: this.config.initialBalance,
      currentDrawdown: 0,
      maxDrawdown: 0,
      peakBalance: this.config.initialBalance
    };
    
    // Results tracking
    this.results = {
      trades: [],
      wins: 0,
      losses: 0,
      totalProfit: 0,
      totalLoss: 0,
      maxDrawdown: 0,
      totalFees: 0
    };
    
    this.initializeModules();
  }
  
  initializeModules() {
    console.log('📦 Initializing production modules...\n');
    
    // DEFENSIVE MODULES
    this.riskManager = new RiskManager({
      baseRiskPercent: 2,
      maxRiskPercent: 5,
      maxDailyLoss: 10,
      maxWeeklyLoss: 20,
      maxDrawdown: 15,
      cooldownPeriod: 900000
    });
    
    this.tradingBrain = new OptimizedTradingBrain({
      initialBalance: this.config.initialBalance,
      aggressiveness: 0.5,
      maxPositions: this.config.maxPositions,
      minConfidence: this.config.minTradeConfidence
    });
    
    this.maxProfitManager = new MaxProfitManager({
      tierExitEnabled: true,
      trailingStopEnabled: true,
      dynamicExitEnabled: true
    });
    
    this.tradingSafetyNet = new TradingSafetyNet({
      emergencyStopEnabled: true,
      maxLossPerTrade: 5,
      maxDailyLoss: 10,
      cooldownAfterLoss: 300000
    });
    
    this.performanceAnalyzer = new PerformanceAnalyzer({
      alertThresholds: {
        winRate: 0.35,
        profitFactor: 0.8,
        sharpeRatio: 0.5
      }
    });
    
    // OFFENSIVE MODULES
    this.marketRegimeDetector = new MarketRegimeDetector({
      lookbackPeriod: 100,
      volatilityThreshold: 0.02,
      trendStrengthThreshold: 0.6
    });
    
    this.fibonacciDetector = new FibonacciDetector({
      levels: [0.236, 0.382, 0.5, 0.618, 0.786],
      minSwingSize: 0.02,
      lookbackCandles: 50
    });
    
    this.supportResistanceDetector = new SupportResistanceDetector({
      minStrength: 3,
      mergeThresholdPercent: 0.5,
      maxLevels: 8
    });
    
    this.optimizedIndicators = new OptimizedIndicators({
      rsiPeriod: 14,
      emaPeriods: [9, 21, 50, 200],
      bbPeriod: 20,
      bbStdDev: 2
    });
    
    if (this.config.enablePatterns) {
      this.patternDetector = new ComprehensivePatternDetector();
      console.log('   ✅ Pattern detector initialized with 94 patterns');
    }
    
    console.log('✅ All modules initialized successfully!\n');
  }
  
  /**
   * Calculate trading confidence using BOOSTED weights - enables 60-80% confidence
   */
  calculateConfidence(marketData) {
    let confidence = 0;
    const price = marketData.price || this.priceData[this.priceData.length - 1].close;
    
    // Market Regime (BOOSTED: 15-25%)
    if (this.marketRegimeDetector && this.priceData.length > 100) {
      const regimeAnalysis = this.marketRegimeDetector.analyzeMarket(this.priceData);
      if (regimeAnalysis) {
        if (regimeAnalysis.regime === 'trending_up' && regimeAnalysis.confidence > 0.7) {
          confidence += 0.25; // BOOSTED from 0.20
        } else if (regimeAnalysis.regime === 'trending_down' && regimeAnalysis.confidence > 0.7) {
          confidence += 0.20; // BOOSTED from 0.15
        } else if (regimeAnalysis.regime === 'ranging') {
          confidence += 0.15; // BOOSTED from 0.05
        }
        marketData.marketRegime = regimeAnalysis;
      }
    }
    
    // Fibonacci Levels (10-15%)
    if (this.fibonacciDetector && this.priceData.length > 50) {
      const fibLevels = this.fibonacciDetector.update(this.priceData);
      if (fibLevels) {
        const nearestLevel = this.fibonacciDetector.getNearestLevel(price);
        if (nearestLevel && nearestLevel.distance < 0.5) {
          confidence += 0.15; // BOOSTED from 0.10
        } else if (nearestLevel && nearestLevel.distance < 1.0) {
          confidence += 0.10; // Additional tier
        }
        marketData.fibLevels = fibLevels;
      }
    }
    
    // Support/Resistance (15-20%)
    if (this.supportResistanceDetector && this.priceData.length > 50) {
      const levels = this.supportResistanceDetector.update(this.priceData);
      if (levels && levels.length > 0) {
        const nearestLevel = this.supportResistanceDetector.getNearestLevel(price);
        if (nearestLevel) {
          if (nearestLevel.type === 'support' && nearestLevel.distance < 0.3) {
            confidence += 0.20; // BOOSTED from 0.15
          } else if (nearestLevel.type === 'resistance' && nearestLevel.distance < 0.3) {
            confidence += 0.15; // BOOSTED from 0.08
          } else if (nearestLevel.distance < 0.5) {
            confidence += 0.10; // Additional tier
          }
        }
        marketData.srLevels = levels;
      }
    }
    
    // Technical Indicators (RSI/MACD with BOOSTED weights)
    if (this.optimizedIndicators && this.priceData.length > 30) {
      const rsi = this.optimizedIndicators.calculateRSI(this.priceData);
      const macd = this.optimizedIndicators.calculateMACD(this.priceData);
      const bb = this.optimizedIndicators.calculateBollingerBands(this.priceData);
      
      // RSI Signals (20-25% for strong signals)
      if (rsi) {
        if (rsi < 25) {
          confidence += 0.25; // STRONG oversold - BOOSTED
        } else if (rsi < 30) {
          confidence += 0.20; // Oversold - BOOSTED from 0.15
        } else if (rsi > 75) {
          confidence += 0.25; // STRONG overbought - BOOSTED
        } else if (rsi > 70) {
          confidence += 0.20; // Overbought - BOOSTED from 0.15
        } else if (rsi >= 45 && rsi <= 55) {
          confidence += 0.08; // Neutral zone - slight boost
        }
        marketData.rsi = rsi;
      }
      
      // MACD Signals (15-20% for strong signals)  
      if (macd) {
        if (macd.macd > 0 && macd.signal > 0 && macd.histogram > 0) {
          confidence += 0.20; // Strong bullish - BOOSTED
        } else if (macd.macd > 0 && macd.signal > 0) {
          confidence += 0.15; // Bullish
        } else if (macd.macd < 0 && macd.signal < 0 && macd.histogram < 0) {
          confidence += 0.18; // Strong bearish - BOOSTED
        } else if (macd.macd < 0 && macd.signal < 0) {
          confidence += 0.12; // Bearish
        }
        marketData.macd = macd.macd;
        marketData.macdSignal = macd.signal;
        marketData.macdHistogram = macd.histogram;
      }
      
      // Bollinger Bands (10% for band touches)
      if (bb && price) {
        if (price <= bb.lower) {
          confidence += 0.10; // Price at lower band
        } else if (price >= bb.upper) {
          confidence += 0.10; // Price at upper band
        }
        marketData.bbUpper = bb.upper;
        marketData.bbMiddle = bb.middle;
        marketData.bbLower = bb.lower;
      }
    }
    
    // Patterns (BOOSTED: up to 35% for strong patterns)
    if (this.patternDetector && this.config.enablePatterns && this.priceData.length > 50) {
      const patterns = this.patternDetector.detectPatterns(this.priceData);
      if (patterns && patterns.length > 0) {
        // Base pattern bonus
        const basePatternBonus = Math.min(0.25, patterns.length * 0.08); // BOOSTED from 0.05
        confidence += basePatternBonus;
        
        // Additional confidence for high-quality patterns
        patterns.forEach(pattern => {
          if (pattern.reliability === 'high') {
            confidence += 0.15; // BOOSTED from 0.10
          } else if (pattern.reliability === 'medium') {
            confidence += 0.08; // BOOSTED from 0.05
          }
        });
        marketData.patterns = patterns;
      }
    }
    
    // Log significant confidence
    if (confidence > 0.30) {
      console.log(`🔥 BOOSTED Confidence: ${(confidence * 100).toFixed(1)}%`);
      if (confidence > 0.50) {
        console.log(`   ✅ HIGH CONFIDENCE - RSI: ${marketData.rsi?.toFixed(0)}, MACD: ${marketData.macd?.toFixed(2)}`);
      }
    }
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }
  
  /**
   * Run backtest on historical data
   */
  async runBacktest(historicalData) {
    console.log(`📊 Running backtest on ${historicalData.length} data points...\n`);
    
    for (let i = 100; i < historicalData.length; i++) {
      // Progress logging
      if (i % 100 === 0) {
        const progress = ((i / historicalData.length) * 100).toFixed(1);
        console.log(`Progress: ${i}/${historicalData.length} (${progress}%)`);
      }
      
      // Build price history
      this.priceData = historicalData.slice(Math.max(0, i - 200), i);
      this.priceHistory = this.priceData.map(d => d.close);
      
      const currentData = historicalData[i];
      const marketData = {
        price: currentData.close,
        high: currentData.high,
        low: currentData.low,
        volume: currentData.volume,
        timestamp: currentData.timestamp
      };
      
      // Calculate confidence
      const confidence = this.calculateConfidence(marketData);
      marketData.confidence = confidence;
      
      // Check for trade opportunity
      if (confidence >= this.config.minTradeConfidence && 
          this.activePositions.size < this.config.maxPositions) {
        this.executeTrade(marketData);
      }
      
      // Check exits for active positions
      this.checkExits(marketData);
    }
    
    // Close any remaining positions
    this.closeAllPositions(historicalData[historicalData.length - 1].close);
    
    // Generate report
    return this.generateReport();
  }
  
  /**
   * Execute a trade
   */
  executeTrade(marketData) {
    const positionSize = this.calculatePositionSize(marketData);
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Front-load 1% to account for REAL COSTS:
    // - Slippage (price movement during execution)
    // - Gas fees (blockchain transaction costs)  
    // - Broker fees (exchange maker/taker fees)
    // - Spread (bid/ask difference)
    const entryPrice = marketData.price * 1.01; // Add 1% to market price
    
    const position = {
      id: tradeId,
      entry: entryPrice, // Use front-loaded price
      size: positionSize,
      value: positionSize * entryPrice, // Calculate value with front-loaded price
      stopLoss: entryPrice * (1 - this.config.stopLossPercent), // Stop loss from actual entry
      takeProfit: entryPrice * (1 + this.config.takeProfitPercent), // Take profit from actual entry
      timestamp: marketData.timestamp,
      confidence: marketData.confidence,
      marketRegime: marketData.marketRegime?.regime
    };
    
    // Deduct from balance (simplified - no fees for now)
    this.balance -= position.value;
    this.activePositions.set(tradeId, position);
    this.systemState.totalTrades++;
    
    console.log(`📈 Trade ${this.systemState.totalTrades}: BUY at ${position.entry.toFixed(2)}, confidence=${position.confidence.toFixed(3)}`);
  }
  
  /**
   * Calculate position size
   */
  calculatePositionSize(marketData) {
    const baseSize = this.config.maxPositionSize;
    const confidenceMultiplier = Math.min(1.5, marketData.confidence * 2);
    return baseSize * confidenceMultiplier;
  }
  
  /**
   * Check exits for all positions
   */
  checkExits(marketData) {
    for (const [id, position] of this.activePositions) {
      const currentPrice = marketData.price;
      const pnl = (currentPrice - position.entry) / position.entry;
      
      // Check stop loss
      if (currentPrice <= position.stopLoss) {
        this.closePosition(id, currentPrice, 'stop_loss');
      }
      // Check take profit
      else if (currentPrice >= position.takeProfit) {
        this.closePosition(id, currentPrice, 'take_profit');
      }
      // Dynamic exit based on MaxProfitManager
      else if (this.maxProfitManager && this.maxProfitManager.shouldExitPosition) {
        const shouldExit = this.maxProfitManager.shouldExitPosition(currentPrice, pnl * 100);
        
        if (shouldExit) {
          this.closePosition(id, currentPrice, 'dynamic_exit');
        }
      }
    }
  }
  
  /**
   * Close a position
   */
  closePosition(positionId, exitPrice, reason) {
    const position = this.activePositions.get(positionId);
    if (!position) return;
    
    const pnl = position.size * (exitPrice - position.entry);
    const pnlPercent = ((exitPrice - position.entry) / position.entry) * 100;
    
    // Update balance
    this.balance += position.value + pnl;
    
    // Update stats
    if (pnl > 0) {
      this.systemState.winningTrades++;
      this.results.wins++;
      this.results.totalProfit += pnl;
    } else {
      this.systemState.losingTrades++;
      this.results.losses++;
      this.results.totalLoss += Math.abs(pnl);
    }
    
    // Record trade
    this.results.trades.push({
      entry: position.entry,
      exit: exitPrice,
      pnl: pnl,
      pnlPercent: pnlPercent,
      reason: reason
    });
    
    // Remove position
    this.activePositions.delete(positionId);
    
    console.log(`  📊 CLOSE at ${exitPrice.toFixed(2)}, PnL=${pnlPercent.toFixed(2)}%, Reason=${reason}`);
  }
  
  /**
   * Close all positions at market price
   */
  closeAllPositions(marketPrice) {
    for (const [id, position] of this.activePositions) {
      this.closePosition(id, marketPrice, 'backtest_end');
    }
  }
  
  /**
   * Generate backtest report
   */
  generateReport() {
    const totalReturn = ((this.balance - this.config.initialBalance) / this.config.initialBalance) * 100;
    const winRate = this.results.wins / (this.results.wins + this.results.losses) * 100 || 0;
    const avgWin = this.results.wins > 0 ? this.results.totalProfit / this.results.wins : 0;
    const avgLoss = this.results.losses > 0 ? this.results.totalLoss / this.results.losses : 0;
    const profitFactor = this.results.totalLoss > 0 ? this.results.totalProfit / this.results.totalLoss : 0;
    
    const report = {
      finalBalance: this.balance,
      totalReturn: totalReturn,
      winRate: winRate,
      totalTrades: this.systemState.totalTrades,
      wins: this.results.wins,
      losses: this.results.losses,
      avgWin: avgWin,
      avgLoss: avgLoss,
      profitFactor: profitFactor,
      trades: this.results.trades
    };
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('📊 BACKTEST COMPLETE - RESULTS:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`💰 Final Balance: $${this.balance.toFixed(2)}`);
    console.log(`📈 Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`🎯 Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`📊 Total Trades: ${this.systemState.totalTrades}`);
    console.log(`✅ Wins: ${this.results.wins}`);
    console.log(`❌ Losses: ${this.results.losses}`);
    console.log(`💵 Avg Win: $${avgWin.toFixed(2)}`);
    console.log(`💸 Avg Loss: $${avgLoss.toFixed(2)}`);
    console.log(`⚖️ Profit Factor: ${profitFactor.toFixed(2)}`);
    console.log('════════════════════════════════════════════════════════════\n');
    
    return report;
  }
}

// Generate test data
function generateTestData(days) {
  const data = [];
  let price = 50000;
  const baseVolume = 1000000;
  
  for (let i = 0; i < days * 24; i++) { // Hourly data
    const trend = Math.sin(i / 100) * 0.2;
    const noise = (Math.random() - 0.5) * 0.05;
    const change = trend + noise;
    
    price = price * (1 + change);
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const volume = baseVolume * (0.5 + Math.random());
    
    data.push({
      timestamp: Date.now() - (days * 24 - i) * 3600000,
      open: price,
      high: high,
      low: low,
      close: price,
      volume: volume
    });
  }
  
  return data;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 30;
  
  console.log(`\n🚀 Starting Simple Production Backtest...`);
  
  // Load real Polygon data
  let historicalData;
  try {
    const polygonData = JSON.parse(fs.readFileSync('polygon-btc-1y.json', 'utf8'));
    console.log(`📊 Loaded ${polygonData.length} candles from Polygon (1 year of BTC data)`);
    
    // Use specified days or all data
    const candlesPerDay = 1440; // Use all 1-minute candles for full accuracy
    const maxCandles = days * candlesPerDay;
    historicalData = polygonData.slice(-Math.min(maxCandles, polygonData.length));
    console.log(`📅 Using ${historicalData.length} candles (${(historicalData.length/1440).toFixed(1)} days)\n`);
  } catch (error) {
    console.log(`⚠️ Could not load Polygon data, using synthetic data instead`);
    historicalData = generateTestData(days);
  }
  
  // Create backtester
  const backtester = new SimpleProductionBacktest({
    initialBalance: 10000,
    minTradeConfidence: 0.40, // Require 40% confidence minimum (achievable now)
    enablePatterns: false // Disable patterns for speed
  });
  
  // Run backtest
  const results = await backtester.runBacktest(historicalData);
  
  // Save results
  const filename = `backtest-results-simple-${days}d.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`📁 Results saved to ${filename}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleProductionBacktest;