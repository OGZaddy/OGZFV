// ========================================================================
// 🚀 PRODUCTION BACKTEST WITH TRAI INTEGRATION
// ========================================================================
// This backtester includes TRAI analysis for every trade
// Connects to TRAI via SSL server for real-time analysis
// ========================================================================

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Import ALL the same modules as production bot
const TierFeatureFlags = require('./core/TierFeatureFlags');
const RiskManager = require('./core/RiskManager');
const { OptimizedTradingBrain } = require('./core/OptimizedTradingBrain');
const MaxProfitManager = require('./core/MaxProfitManager');
const TradingSafetyNet = require('./core/TradingSafetyNet');
const PerformanceAnalyzer = require('./core/PerformanceAnalyzer');
const QuantumPositionSizer = require('./core/QuantumPositionSizer');
const MultiDirectionalTrader = require('./core/MultiDirectionalTrader');
const { EnhancedPatternChecker } = require('./core/EnhancedPatternRecognition');
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');
const OptimizedIndicators = require('./core/OptimizedIndicators');

// Base on V13 Production Backtest
const V13ProductionBacktest = require('./backtest-v13-production');

class V13BacktestWithTRAI extends V13ProductionBacktest {
  constructor(config = {}) {
    super(config);
    
    console.log('\n🤖 TRAI INTEGRATION ENABLED');
    console.log('════════════════════════════════════════════════════════════');
    console.log('All trades will be sent to TRAI for analysis and learning');
    console.log('════════════════════════════════════════════════════════════\n');
    
    // TRAI connection
    this.traiConnected = false;
    this.traiWs = null;
    this.traiAnalysis = new Map();
    this.pendingAnalysis = new Map();
    
    // TRAI stats
    this.traiStats = {
      tradesAnalyzed: 0,
      insightsReceived: 0,
      averageResponseTime: 0,
      recommendations: []
    };
  }

  async initialize() {
    console.log('🔌 Connecting to TRAI via SSL server...');
    
    return new Promise((resolve) => {
      this.traiWs = new WebSocket('ws://127.0.0.1:3010/ws', {
        headers: {
          'X-Client-Type': 'Backtest',
          'User-Agent': 'V13-Backtest-TRAI'
        }
      });
      
      this.traiWs.on('open', () => {
        console.log('✅ Connected to TRAI via SSL server');
        this.traiConnected = true;
        
        // Identify as backtest system
        this.traiWs.send(JSON.stringify({
          type: 'identify',
          source: 'backtest_with_trai',
          purpose: 'historical_analysis',
          config: this.config
        }));
        
        resolve();
      });
      
      this.traiWs.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this.handleTRAIMessage(msg);
        } catch (error) {
          console.error('Failed to parse TRAI message:', error);
        }
      });
      
      this.traiWs.on('error', (error) => {
        console.error('❌ TRAI connection error:', error.message);
        this.traiConnected = false;
        resolve(); // Continue without TRAI
      });
      
      this.traiWs.on('close', () => {
        console.log('❌ TRAI connection closed');
        this.traiConnected = false;
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.traiConnected) {
          console.log('⚠️ TRAI connection timeout - continuing without analysis');
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Load historical data from file or fallback
   */
  loadHistoricalDataFromFile(filePath) {
    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) return null;
      const raw = fs.readFileSync(resolved, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📥 Loaded ${data.length} candles from ${resolved}`);
        return data;
      }
      return null;
    } catch (e) {
      console.error('Failed to load historical file:', e.message);
      return null;
    }
  }

  static parseArgs() {
    const args = process.argv.slice(2);
    const get = (k, d) => {
      const a = args.find(x => x.startsWith(`--${k}=`));
      return a ? a.split('=')[1] : d;
    };
    return {
      file: get('file', null),
      limit: parseInt(get('limit', '5000')) || 5000,
      symbol: get('symbol', null),
      span: get('span', 'minute'),
      mult: parseInt(get('mult', '1')) || 1,
      from: get('from', null),
      to: get('to', null),
      quick: args.includes('--quick'),
      safety: get('safety', null),
      tier: get('tier', null),
      minConf: get('min-confidence', null),
      patternConf: get('pattern-confidence', null)
    };
  }
  
  handleTRAIMessage(msg) {
    switch (msg.type) {
      case 'trade_analysis':
        this.processTRAIAnalysis(msg.data);
        break;
      
      case 'market_analysis':
        this.processTRAIMarketInsight(msg.data);
        break;
        
      case 'answer':
        if (msg.data.question && msg.data.question.includes('backtest')) {
          this.processTRAIRecommendation(msg.data);
        }
        break;
        
      default:
        console.log(`[TRAI] ${msg.type}:`, msg.data);
    }
  }
  
  processTRAIAnalysis(analysisData) {
    console.log('\n🧠 TRAI Analysis Received:');
    console.log(`   Trade: ${analysisData.trade.direction} @ $${analysisData.trade.price}`);
    console.log(`   Analysis: ${analysisData.analysis.substring(0, 100)}...`);
    
    this.traiStats.insightsReceived++;
    
    // Store analysis for trade ID
    if (analysisData.trade.id) {
      this.traiAnalysis.set(analysisData.trade.id, analysisData.analysis);
    }
    
    // Check if TRAI has recommendations
    if (analysisData.analysis.includes('suggest') || 
        analysisData.analysis.includes('recommend') ||
        analysisData.analysis.includes('optimal')) {
      this.traiStats.recommendations.push({
        timestamp: Date.now(),
        recommendation: analysisData.analysis
      });
    }
  }
  
  processTRAIMarketInsight(marketData) {
    console.log('\n📊 TRAI Market Insight:', marketData.analysis.substring(0, 150));
  }
  
  processTRAIRecommendation(data) {
    console.log('\n💡 TRAI Recommendation:', data.answer.substring(0, 200));
  }
  
  async sendToTRAI(type, data) {
    if (!this.traiConnected) return;
    
    try {
      this.traiWs.send(JSON.stringify({
        type: type,
        data: data,
        timestamp: Date.now(),
        source: 'backtest'
      }));
      
      this.traiStats.tradesAnalyzed++;
    } catch (error) {
      console.error('Failed to send to TRAI:', error.message);
    }
  }
  
  /**
   * Override executeTrade to send to TRAI
   */
  executeTrade(direction, confidence, marketData, patterns) {
    // Call parent implementation
    super.executeTrade(direction, confidence, marketData, patterns);
    
    // Get the last created position
    const positions = Array.from(this.activePositions.values());
    const latestPosition = positions[positions.length - 1];
    
    if (latestPosition) {
      // Send trade to TRAI for analysis
      const tradeData = {
        id: latestPosition.id,
        direction: direction,
        price: latestPosition.entryPrice,
        confidence: confidence,
        patterns: patterns.map(p => p.name),
        timestamp: marketData.timestamp,
        marketConditions: {
          volume: marketData.volume,
          volatility: this.calculateVolatility(),
          regime: this.marketRegime?.detectRegime?.(this.priceData) || 'UNKNOWN'
        },
        indicators: this.getIndicatorSnapshot()
      };
      
      this.sendToTRAI('trade', tradeData);
      
      // Also ask TRAI for optimization suggestions periodically
      if (this.systemState.totalTrades % 10 === 0) {
        this.sendToTRAI('question', 
          `Based on the last 10 trades in this backtest, what optimizations would you suggest? Current win rate: ${(this.systemState.winRate * 100).toFixed(1)}%`
        );
      }
    }
  }
  
  /**
   * Override closePosition to send results to TRAI
   */
  closePosition(id, exitPrice, reason) {
    const position = this.activePositions.get(id);
    if (!position) return;
    
    // Calculate PnL before closing
    const pnl = position.direction === 'long'
      ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - exitPrice) / position.entryPrice) * 100;
    
    // Call parent implementation
    super.closePosition(id, exitPrice, reason);
    
    // Send closed trade results to TRAI
    const tradeResult = {
      id: id,
      direction: position.direction,
      entryPrice: position.entryPrice,
      exitPrice: exitPrice,
      pnl: pnl,
      pnlAmount: position.amount * (pnl / 100),
      reason: reason,
      duration: Date.now() - position.timestamp,
      patterns: position.patterns,
      confidence: position.confidence
    };
    
    this.sendToTRAI('trade_result', tradeResult);
    
    // If we have TRAI's analysis for this trade, log it
    const analysis = this.traiAnalysis.get(id);
    if (analysis) {
      console.log(`   🧠 TRAI's prediction: ${analysis.substring(0, 100)}`);
    }
  }
  
  /**
   * Get current indicator snapshot for TRAI
   */
  getIndicatorSnapshot() {
    if (!this.indicators || this.priceData.length < 20) return {};
    
    try {
      return {
        rsi: this.indicators.calculateRSI(this.priceData),
        macd: this.indicators.calculateMACD(this.priceData),
        bb: this.indicators.calculateBollingerBands(this.priceData),
        ema20: this.indicators.calculateEMA(this.priceData, 20),
        ema50: this.indicators.calculateEMA(this.priceData, 50)
      };
    } catch (error) {
      return {};
    }
  }
  
  /**
   * Calculate current volatility
   */
  calculateVolatility() {
    if (this.priceData.length < 20) return 0;
    
    const returns = [];
    for (let i = 1; i < this.priceData.length; i++) {
      returns.push((this.priceData[i] - this.priceData[i-1]) / this.priceData[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
  }
  
  /**
   * Override final report to include TRAI stats
   */
  printFinalReport() {
    super.printFinalReport();
    
    console.log('\n🤖 TRAI INTEGRATION REPORT');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Trades Analyzed: ${this.traiStats.tradesAnalyzed}`);
    console.log(`Insights Received: ${this.traiStats.insightsReceived}`);
    console.log(`Recommendations: ${this.traiStats.recommendations.length}`);
    
    if (this.traiStats.recommendations.length > 0) {
      console.log('\n📋 TRAI RECOMMENDATIONS:');
      this.traiStats.recommendations.slice(-3).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.recommendation.substring(0, 200)}...`);
      });
    }
    
    // Ask TRAI for final analysis
    if (this.traiConnected) {
      const finalStats = {
        totalTrades: this.systemState.totalTrades,
        winRate: this.systemState.winRate,
        totalPnL: this.systemState.totalPnL,
        maxDrawdown: this.systemState.maxDrawdownReached,
        sharpeRatio: this.results.sharpeRatio
      };
      
      this.sendToTRAI('question', 
        `Final backtest analysis: ${JSON.stringify(finalStats)}. What are your key insights and recommendations for improving this strategy?`
      );
    }
    
    // Close TRAI connection
    if (this.traiWs) {
      setTimeout(() => {
        this.traiWs.close();
      }, 5000);
    }
  }
}

// Main execution
async function runBacktestWithTRAI() {
  try {
    const argv = V13BacktestWithTRAI.parseArgs();

    // If symbol + range provided, auto-download to a temp file
    let targetFile = argv.file;
    if (!targetFile && argv.symbol && argv.from && argv.to) {
      const safeSym = argv.symbol.replace(/[^A-Z0-9:]/gi, '_');
      targetFile = path.join(__dirname, 'data', `${safeSym}-${argv.mult}${argv.span}-${argv.from}-${argv.to}.json`);
      console.log(`🔽 Preparing real data: ${argv.symbol} ${argv.mult}${argv.span} ${argv.from}→${argv.to}`);
      const { spawnSync } = require('child_process');
      const res = spawnSync(process.execPath, [path.join(__dirname, 'tools', 'download-polygon-range.js'),
        `--symbol=${argv.symbol}`, `--span=${argv.span}`, `--mult=${argv.mult}`, `--from=${argv.from}`, `--to=${argv.to}`, `--out=${targetFile}`
      ], { stdio: 'inherit', env: process.env });
      if (res.status !== 0) {
        console.warn('⚠️ Download failed; will try local file if present');
      }
    }

    const defaultFile = path.join(__dirname, 'data', 'polygon-btc-1y.json');
    const loader = new V13BacktestWithTRAI({});
    let allData = loader.loadHistoricalDataFromFile(targetFile || defaultFile);

    if (!allData) {
      console.error('❌ NO REAL DATA FILE FOUND!');
      console.error('This bot ONLY works with REAL market data. NO FAKE DATA ALLOWED!');
      console.error('\nDownload real data:');
      console.error('POLYGON_API_KEY=your_key node tools/download-polygon-range.js --symbol=X:BTCUSD --span=minute --mult=5 --from=2024-01-01 --to=2024-12-31 --out=data/real-btc.json');
      console.error('\nThen run:');
      console.error('npm run backtest:trai -- --file=data/real-btc.json');
      process.exit(1);
    }

    // Configure “just works” quick mode
    const quickCfg = {};
    if (argv.quick) {
      quickCfg.safetyMode = 'off';
      quickCfg.tier = argv.tier || 'pro';
      quickCfg.minTradeConfidence = argv.minConf ? parseFloat(argv.minConf) : 0;
      quickCfg.patternConfidence = argv.patternConf ? parseFloat(argv.patternConf) : 0.2;
      console.log('⚡ Quick mode: safety=off, tier=pro, low thresholds');
    }

    if (argv.safety) {
      quickCfg.safetyMode = argv.safety; // normal|relaxed|off
    }

    const limit = Math.max(500, argv.limit || 5000);
    const historicalData = allData.slice(-limit);
    console.log(`📊 Using ${historicalData.length} candles for backtest`);

    // Create backtest instance with TRAI
    const backtest = new V13BacktestWithTRAI({
      tier: quickCfg.tier || 'elite',
      safetyMode: quickCfg.safetyMode || process.env.BACKTEST_SAFETY || 'normal',
      initialBalance: 10000,
      maxPositionSize: 0.05,
      stopLossPercent: 5.0,
      takeProfitPercent: 12.0,
      minTradeConfidence: quickCfg.minTradeConfidence ?? undefined,
      patternConfidence: quickCfg.patternConfidence ?? undefined
    });
    
    // Initialize TRAI connection
    await backtest.initialize();
    
    // Run backtest
    console.log('\n🚀 Starting backtest with TRAI analysis...\n');
    const results = await backtest.runBacktest(historicalData);
    
    // Print final results
    console.log('\n🏁 Backtest completed!');
    if (results && results.finalBalance !== undefined) {
      console.log(`Final balance: $${results.finalBalance.toFixed(2)}`);
      console.log(`Total return: ${results.totalReturn.toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('❌ Backtest failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runBacktestWithTRAI();
}

module.exports = V13BacktestWithTRAI;
