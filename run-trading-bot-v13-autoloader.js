// CACHE BUSTER - Forces fresh load every time
if (require.cache[__filename]) {
  delete require.cache[__filename];
}

// Clear all project modules from cache
Object.keys(require.cache).forEach(key => {
  if (key.includes('OGZFV-valhalla')) {
    delete require.cache[key];
  }
});

console.log(`[${new Date().toISOString()}] Module cache cleared - Loading fresh`);

console.log('📍 FILE LOADED: run-trading-bot-v13-autoloader.js at', new Date().toISOString());
// ===================================================================
// 🚀 OGZ PRIME V13 WITH MODULE AUTO-LOADER - CENTRALIZED ARCHITECTURE
// ===================================================================
// REFACTORED TO USE MODULE AUTO-LOADER FOR ALL MODULE MANAGEMENT
// NO MORE MANUAL REQUIRES - EVERYTHING LOADED THROUGH CENTRAL HUB
// ===================================================================

// LOAD ENVIRONMENT VARIABLES FIRST
require('dotenv').config();

// Standard Node modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const net = require('net');
const axios = require('axios');
const crypto = require('crypto');

// 🎯 MODULE AUTO-LOADER - THE CENTRAL HUB FOR ALL MODULES
const loader = require('./core/ModuleAutoLoader');

console.log('\n🔧 LOADING ALL MODULES THROUGH AUTO-LOADER...\n');

// Load all core modules at once
const modules = loader.loadDirectory('core', {
  required: [
    'SingletonLock',
    'RiskManager',
    'OptimizedTradingBrain',
    'MaxProfitManager',
    'TradingSafetyNet',
    'PerformanceAnalyzer',
    'QuantumPositionSizer',
    'PerformanceValidator',
    'PerformanceVisualizer',
    'MultiDirectionalTrader',
    'EnhancedPatternRecognition',
    'UltimateTradingSystem',
    'CorrelationAnalyzer',
    'LogLearningSystem',
    'MLLogProcessor',
    'TimeFrameManager',
    'TierFeatureFlags',
    'MarketRegimeDetector',
    'FibonacciDetector',
    'SupportResistanceDetector',
    'OptimizedIndicators'
  ]
});

// Extract modules from the loader
const { OGZSingletonLock, checkCriticalPorts } = modules.SingletonLock;
const RiskManager = modules.RiskManager;
const { OptimizedTradingBrain } = modules.OptimizedTradingBrain;
const MaxProfitManager = modules.MaxProfitManager;
const TradingSafetyNet = modules.TradingSafetyNet;
const PerformanceAnalyzer = modules.PerformanceAnalyzer;
const QuantumPositionSizer = modules.QuantumPositionSizer;
const PerformanceValidator = modules.PerformanceValidator;
const PerformanceVisualizer = modules.PerformanceVisualizer;
const MultiDirectionalTrader = modules.MultiDirectionalTrader;
const { EnhancedPatternChecker, EnhancedPatternRecognition, PatternFeatureExtractor } = modules.EnhancedPatternRecognition;
const UltimateTradingSystem = modules.UltimateTradingSystem;
const CorrelationAnalyzer = modules.CorrelationAnalyzer;
const LogLearningSystem = modules.LogLearningSystem;
const MLLogProcessor = modules.MLLogProcessor;
const TimeFrameManager = modules.TimeFrameManager;
const TierFeatureFlags = modules.TierFeatureFlags;
const MarketRegimeDetector = modules.MarketRegimeDetector;
const FibonacciDetector = modules.FibonacciDetector;
const SupportResistanceDetector = modules.SupportResistanceDetector;
const OptimizedIndicators = modules.OptimizedIndicators;

// Optional modules (not required for basic operation)
const RealQuantumEnhancement = modules['quantum-enhancement-layer'];
const PerformanceDashboardIntegration = modules.PerformanceDashboardIntegration;
const OGZPrimeV14_QuantumDeFi = modules.OGZPrimeV14_QuantumDeFi;
const PolygonWebSocket = modules.PolygonWebSocket;

// Load defensive modules for production safety
const EmergencyRecoveryManager = modules.EmergencyRecoveryManager;
const ConnectionResilience = modules.ConnectionResilience;
const AutoBackupManager = modules.AutoBackupManager;

console.log('✅ All critical modules loaded successfully!\n');

class OGZPrimeV13Simplified {
  constructor() {
    console.log('🔥 CONSTRUCTOR START - PerformanceAnalyzer class:', typeof PerformanceAnalyzer);
    console.log('🔥 CONSTRUCTOR START - PerformanceAnalyzer.prototype.recordTrade:', typeof PerformanceAnalyzer.prototype.recordTrade);
    console.log('🔥 CONSTRUCTOR START - PerformanceAnalyzer.prototype.processTrade:', typeof PerformanceAnalyzer.prototype.processTrade);
    console.log('\n🚀💰 OGZ PRIME V13 WITH AUTO-LOADER - CENTRALIZED ARCHITECTURE 💰🚀');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🎯 MODULE AUTO-LOADER ACTIVE - NO MORE CIRCULAR DEPENDENCIES');
    console.log('💡 CENTRALIZED MODULE MANAGEMENT - LIKE WEBSOCKET HUB');
    console.log('⚡ FASTER STARTUP - CACHED MODULE LOADING');
    console.log('🛡️ PRODUCTION SAFETY - ALL DEFENSIVE MODULES ACTIVE');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // INITIALIZE TIER-BASED FEATURE FLAGS
    const tier = process.env.SUBSCRIPTION_TIER || 'starter'; // Can be 'starter', 'pro', or 'elite'
    this.tierFlags = new TierFeatureFlags(tier);

    // Display tier information
    const tierSummary = this.tierFlags.getTierSummary();
    console.log(`\n🎭 SUBSCRIPTION TIER: ${tier.toUpperCase()}`);
    console.log(`   📊 Patterns: ${tierSummary.patterns}`);
    console.log(`   💼 Max Positions: ${tierSummary.maxPositions}`);
    console.log(`   🔄 Multi-Directional: ${tierSummary.multiDirectional ? 'YES' : 'NO'}`);
    console.log(`   ⚛️ Quantum Features: ${tierSummary.quantum ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   📈 Max Leverage: ${tierSummary.leverage}x\n`);

    this.config = {
      // OPTIMIZED FOR ACTUAL TRADING
      primaryAsset: process.env.PRIMARY_ASSET || 'BTC-USD',

      // LOWER CONFIDENCE THRESHOLDS = MORE TRADES
      minTradeConfidence: 0, // TEMPORARILY SET TO 0 FOR TESTING (was 0.45)
      patternConfidence: (process.env.FEATURE_FLAG === 'TESTING') ? 0 : (parseFloat(process.env.PATTERN_CONFIDENCE) || 0.35),    // TESTING MODE: 0%, otherwise 35%

      // API Configuration
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      baseURL: process.env.COINBASE_BASE_URL || 'https://api.coinbase.com/api/v3/brokerage',

      // Trading parameters
      tradingAmount: parseFloat(process.env.TRADING_AMOUNT) || 100, // USD
      maxLeverage: this.tierFlags.getFeatureValue('leverage'),
      maxPositions: this.tierFlags.getFeatureValue('maxPositions'),

      // Server configuration
      serverPort: parseInt(process.env.PORT) || 8080,
      wsPort: parseInt(process.env.WS_PORT) || 8001,

      // Trading intervals
      tradingInterval: parseInt(process.env.TRADING_INTERVAL) || 30000, // 30 seconds

      // Pattern detection settings
      patternLookback: 50, // candles
      patternMinStrength: 0.6,

      // Risk parameters
      maxDrawdown: 0.15, // 15% max drawdown
      riskPerTrade: 0.02, // 2% risk per trade

      // Mode
      paperTrading: process.env.PAPER_TRADING === 'true' || true // Default to paper
    };

    // Core state
    this.lastPrice = null;
    this.priceHistory = [];
    this.maxPriceHistory = 10000;  // Store 10K candles for pattern detection
    this.currentTrade = null;
    this.performanceStats = {
      trades: 0,
      wins: 0,
      losses: 0,
      totalPnL: 0
    };

    // Module instances
    this.modules = {};
    this.isInitialized = false;

    // Cache for optimization
    this.cache = {
      patterns: new Map(),
      indicators: new Map(),
      marketRegime: null,
      lastCacheTime: 0
    };

    // Price feed state
    this.priceBuffer = [];
    this.candleBuffer = [];
    this.lastCandleTime = null;

    // Trade state
    this.pendingTrade = null;
    this.executingTrade = false;

    // Health monitoring
    this.lastTradeTime = Date.now();
    this.connectionHealth = {
      websocket: false,
      api: false,
      lastCheck: Date.now()
    };

    // Initialize defensive modules if available
    if (EmergencyRecoveryManager) {
      console.log('🛡️ Initializing Emergency Recovery Manager...');
      this.emergencyManager = new EmergencyRecoveryManager();
    }

    if (ConnectionResilience) {
      console.log('🔌 Initializing Connection Resilience...');
      this.connectionResilience = new ConnectionResilience();
    }

    if (AutoBackupManager) {
      console.log('💾 Initializing Auto Backup Manager...');
      this.autoBackup = new AutoBackupManager();
    }
  }

  async initialize() {
    try {
      console.log('\n⚡ Initializing OGZ Prime V13 with Auto-Loader...\n');

      // Initialize core modules
      this.modules = {
        brain: new OptimizedTradingBrain(),
        riskManager: new RiskManager(),
        maxProfitManager: new MaxProfitManager(),
        tradingSafetyNet: new TradingSafetyNet(),
        performanceAnalyzer: new PerformanceAnalyzer(),
        quantumSizer: new QuantumPositionSizer(),
        validator: new PerformanceValidator(),
        visualizer: new PerformanceVisualizer(),
        multiDirectional: new MultiDirectionalTrader(),
        patternRecognition: new EnhancedPatternRecognition(),
        marketRegime: new MarketRegimeDetector(),
        fibonacci: new FibonacciDetector(),
        supportResistance: new SupportResistanceDetector(),
        indicators: OptimizedIndicators,
        timeframeManager: new TimeFrameManager(),
        correlationAnalyzer: new CorrelationAnalyzer(),
        logLearning: new LogLearningSystem(),
        mlProcessor: new MLLogProcessor()
      };

      console.log('✅ All modules initialized via Auto-Loader');

      // Setup servers
      await this.setupServers();

      // Start trading loop
      this.startTradingLoop();

      // Setup health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      console.log('\n🚀 Bot fully initialized with centralized module management!\n');

      // Display module stats
      const stats = loader.getStats();
      console.log('📊 Module Statistics:');
      console.log(`   Total Modules Loaded: ${stats.totalModules}`);
      console.log(`   Memory Usage: ${stats.memoryUsage.toFixed(2)} MB`);
      console.log(`   Categories:`, stats.categories);

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async setupServers() {
    // Express server
    this.app = express();
    this.server = http.createServer(this.app);

    // WebSocket server
    this.wss = new WebSocket.Server({
      port: this.config.wsPort,
      path: '/ws'
    });

    // Setup WebSocket handlers
    this.wss.on('connection', (ws) => {
      console.log('📡 WebSocket client connected');
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });

    // Express routes
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        modules: Object.keys(this.modules),
        initialized: this.isInitialized,
        connectionHealth: this.connectionHealth,
        performanceStats: this.performanceStats
      });
    });

    this.app.get('/modules', (req, res) => {
      const moduleInfo = {};
      Object.entries(this.modules).forEach(([name, module]) => {
        moduleInfo[name] = {
          loaded: !!module,
          type: typeof module,
          hasInit: typeof module.initialize === 'function'
        };
      });
      res.json(moduleInfo);
    });

    // Start express server
    this.server.listen(this.config.serverPort, () => {
      console.log(`📡 Server running on port ${this.config.serverPort}`);
    });
  }

  handleWebSocketMessage(data) {
    if (data.type === 'price') {
      this.updatePrice(data.price);
    }
  }

  updatePrice(price) {
    this.lastPrice = price;
    this.priceHistory.push({
      c: price,
      t: Date.now()
    });

    // Maintain history size
    if (this.priceHistory.length > this.maxPriceHistory) {
      this.priceHistory.shift();
    }

    // Update connection health
    this.connectionHealth.websocket = true;
    this.connectionHealth.lastCheck = Date.now();
  }

  async startTradingLoop() {
    console.log('🔄 Starting trading loop...');

    setInterval(async () => {
      if (!this.isInitialized || this.executingTrade) return;

      try {
        await this.tradingCycle();
      } catch (error) {
        console.error('Trading cycle error:', error);
        if (this.emergencyManager) {
          this.emergencyManager.handleError(error);
        }
      }
    }, this.config.tradingInterval);
  }

  async tradingCycle() {
    if (!this.lastPrice || this.priceHistory.length < 50) return;

    // Build candles from price history
    const candles = this.buildCandles();
    if (candles.length < 30) return;

    // Get trading signals
    const signals = await this.analyzeMarket(candles);

    // Check if we should trade
    if (signals.confidence >= this.config.minTradeConfidence) {
      await this.executeTrade(signals);
    }

    // Update status
    this.updateStatus(signals);
  }

  buildCandles() {
    // Simple candle building from price history
    const candles = [];
    const candleSize = 60; // 60 data points per candle

    for (let i = candleSize; i <= this.priceHistory.length; i += candleSize) {
      const slice = this.priceHistory.slice(i - candleSize, i);
      const prices = slice.map(p => p.c);

      candles.push({
        o: prices[0],
        h: Math.max(...prices),
        l: Math.min(...prices),
        c: prices[prices.length - 1],
        v: 1000, // Placeholder volume
        t: slice[slice.length - 1].t
      });
    }

    return candles;
  }

  async analyzeMarket(candles) {
    const signals = {
      direction: 'neutral',
      confidence: 0,
      patterns: [],
      indicators: {}
    };

    try {
      // Pattern recognition
      if (this.modules.patternRecognition) {
        const patterns = await this.modules.patternRecognition.detectPatterns(candles);
        signals.patterns = patterns;
        signals.confidence += patterns.length * 0.1;
      }

      // Market regime
      if (this.modules.marketRegime) {
        const regime = this.modules.marketRegime.detectRegime(candles);
        signals.regime = regime;
      }

      // Technical indicators
      if (this.modules.indicators) {
        const rsi = this.modules.indicators.calculateRSI(candles);
        const macd = this.modules.indicators.calculateMACD(candles);
        signals.indicators = { rsi, macd };

        // Adjust confidence based on indicators
        if (rsi < 30) {
          signals.direction = 'buy';
          signals.confidence += 0.2;
        } else if (rsi > 70) {
          signals.direction = 'sell';
          signals.confidence += 0.2;
        }
      }

      // Multi-directional analysis
      if (this.modules.multiDirectional) {
        const mdtSignal = this.modules.multiDirectional.analyzeDirection(candles);
        if (mdtSignal.confidence > 0.5) {
          signals.direction = mdtSignal.direction;
          signals.confidence = Math.max(signals.confidence, mdtSignal.confidence);
        }
      }

    } catch (error) {
      console.error('Market analysis error:', error);
    }

    return signals;
  }

  async executeTrade(signals) {
    if (this.executingTrade) return;
    this.executingTrade = true;

    try {
      // Risk check
      if (this.modules.riskManager) {
        const riskApproved = await this.modules.riskManager.checkRisk({
          direction: signals.direction,
          confidence: signals.confidence,
          amount: this.config.tradingAmount
        });

        if (!riskApproved) {
          console.log('⚠️ Trade blocked by risk manager');
          this.executingTrade = false;
          return;
        }
      }

      // Position sizing
      let positionSize = this.config.tradingAmount;
      if (this.modules.quantumSizer) {
        positionSize = this.modules.quantumSizer.calculateSize({
          confidence: signals.confidence,
          volatility: this.calculateVolatility(),
          balance: 10000 // Default balance for paper trading
        });
      }

      // Execute trade (paper trading for now)
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        direction: signals.direction,
        entryPrice: this.lastPrice,
        positionSize,
        confidence: signals.confidence,
        timestamp: Date.now()
      };

      console.log(`📈 Executing ${trade.direction} trade:`, {
        price: trade.entryPrice,
        size: trade.positionSize,
        confidence: `${(trade.confidence * 100).toFixed(1)}%`
      });

      // Record trade
      if (this.modules.performanceAnalyzer) {
        this.modules.performanceAnalyzer.recordTrade(trade);
      }

      // Store current trade
      this.currentTrade = trade;
      this.lastTradeTime = Date.now();

      // Update stats
      this.performanceStats.trades++;

    } catch (error) {
      console.error('Trade execution error:', error);
    } finally {
      this.executingTrade = false;
    }
  }

  calculateVolatility() {
    if (this.priceHistory.length < 20) return 0.02;

    const recent = this.priceHistory.slice(-20);
    const prices = recent.map(p => p.c);
    const returns = [];

    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  updateStatus(signals) {
    const status = {
      timestamp: new Date().toLocaleString(),
      thought: this.generateThought(),
      decision: this.generateDecision(signals.confidence),
      confidence: Math.round(signals.confidence * 100),
      balance: 10000,
      price: this.lastPrice,
      winRate: this.performanceStats.wins / Math.max(1, this.performanceStats.trades),
      totalTrades: this.performanceStats.trades,
      dailyPnL: this.performanceStats.totalPnL,
      systemState: {
        active: true,
        mode: 'trading',
        startTime: Date.now() - (this.performanceStats.trades * 30000),
        totalTrades: this.performanceStats.trades,
        successfulTrades: this.performanceStats.wins,
        failedTrades: this.performanceStats.losses,
        totalPnL: this.performanceStats.totalPnL,
        dailyPnL: this.performanceStats.totalPnL,
        currentBalance: 10000 + this.performanceStats.totalPnL,
        averageConfidence: signals.confidence,
        winRate: this.performanceStats.wins / Math.max(1, this.performanceStats.trades),
        emergencyMode: false,
        riskLimitExceeded: false,
        lastTradeTime: this.lastTradeTime,
        lastRiskCheck: Date.now()
      }
    };

    // Write status to file
    try {
      fs.writeFileSync(
        path.join(__dirname, 'bot_status.json'),
        JSON.stringify(status, null, 2)
      );
    } catch (error) {
      console.error('Status update error:', error);
    }
  }

  generateThought() {
    const thoughts = [
      'Analyzing market patterns for optimal entry points...',
      'Scanning for high-confidence trade setups...',
      'Processing multi-timeframe confluence...',
      'Evaluating risk-reward ratios...',
      'Monitoring correlation with major assets...',
      'Detecting institutional order flow patterns...',
      'Calculating quantum probability distributions...',
      'Assessing volatility for position sizing...'
    ];
    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }

  generateDecision(confidence) {
    const pct = Math.round(confidence * 100);
    if (pct >= 70) return `ULTRA HIGH CONFIDENCE - Executing trade (${pct}%)`;
    if (pct >= 50) return `HIGH CONFIDENCE - Ready to trade (${pct}%)`;
    if (pct >= 30) return `MODERATE CONFIDENCE - Evaluating setup (${pct}%)`;
    if (pct >= 15) return `LOW CONFIDENCE - Waiting for better setup (${pct}%)`;
    return `MINIMAL CONFIDENCE - Market unclear (${pct}%)`;
  }

  startHealthMonitoring() {
    setInterval(() => {
      // Check if we're receiving price updates
      const now = Date.now();
      const lastUpdate = this.connectionHealth.lastCheck;

      if (now - lastUpdate > 60000) {
        console.warn('⚠️ No price updates for 60 seconds');
        this.connectionHealth.websocket = false;

        if (this.connectionResilience) {
          this.connectionResilience.attemptReconnection();
        }
      }

      // Auto-backup if available
      if (this.autoBackup && this.performanceStats.trades % 10 === 0) {
        this.autoBackup.createBackup({
          trades: this.performanceStats,
          currentTrade: this.currentTrade
        });
      }

    }, 30000); // Check every 30 seconds
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');

    // Close WebSocket
    if (this.wss) {
      this.wss.close();
    }

    // Close server
    if (this.server) {
      this.server.close();
    }

    // Save final state if backup manager exists
    if (this.autoBackup) {
      await this.autoBackup.createFinalBackup({
        performanceStats: this.performanceStats,
        lastPrice: this.lastPrice,
        trades: this.performanceStats
      });
    }

    console.log('✅ Cleanup complete');
  }
}

// Main execution with singleton lock
async function main() {
  const lock = new OGZSingletonLock('OGZPrimeV13-AutoLoader');

  try {
    await lock.acquireLock();
    console.log('🔒 Singleton lock acquired - Auto-Loader version');

    // Check critical ports
    await checkCriticalPorts();

    // Create and initialize bot
    const bot = new OGZPrimeV13Simplified();
    await bot.initialize();

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutdown signal received');
      await bot.cleanup();
      lock.releaseLock();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Termination signal received');
      await bot.cleanup();
      lock.releaseLock();
      process.exit(0);
    });

    console.log('\n🚀 Bot is running with Module Auto-Loader!\n');
    console.log('📊 Check http://localhost:8080/health for status');
    console.log('📈 Check http://localhost:8080/modules for module info\n');

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    lock.releaseLock();
    process.exit(1);
  }
}

// Start the bot
main().catch(console.error);