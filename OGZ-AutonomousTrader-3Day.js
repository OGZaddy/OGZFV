// ===================================================================
// OGZ AUTONOMOUS TRADER - 3 DAY MONEY MAKER! 🚀💰
// ===================================================================
// SEMI-AGGRESSIVE AUTONOMOUS TRADING WITH PATTERN LEARNING
// THIS IS THE MONEY MACHINE THAT TRADES WHILE YOU'RE AWAY!

require('dotenv').config(); // ADDED THIS!

const EventEmitter = require('events');
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const AdaptiveRiskManagementSystem = require('./core/AdaptiveRiskManagementSystem');
const MultiDirectionalTrader = require('./core/MultiDirectionalTrader');
const { EnhancedPatternChecker, FeatureExtractor } = require('./core/EnhancedPatternRecognition');
const FreeWebSocket = require('./core/FreeWebSocket');
const fs = require('fs').promises;

class OGZAutonomousTrader extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Trading pair
      symbol: config.symbol || 'BTC-USD',
      
      // Autonomous operation settings
      operationMode: 'SEMI_AGGRESSIVE', // A notch above scalper
      maxOperationDays: 3,
      
      // Starting capital
      initialBalance: config.initialBalance || 10000,
      
      // Semi-aggressive settings
      minTradeGap: 120000, // 2 minutes between trades (faster for autonomous operation)
      maxDailyTrades: 35, // Up to 35 trades per day (more aggressive)
      confidenceThreshold: 0.45, // 45% confidence minimum (lower for more trades)
      
      // Pattern learning
      enablePatternLearning: true,
      patternMemoryDays: 30,
      learningRateMultiplier: 1.2, // Faster learning for 3-day operation
      
      // Risk settings (semi-aggressive)
      baseRisk: 0.015, // 1.5% per trade
      maxRisk: 0.035, // 3.5% max
      maxDrawdown: 0.18, // 18% max drawdown
      
      // Trading hours (extended for autonomous operation)
      tradingHours: {
        start: 0, // 24/7 crypto trading
        end: 24,
        timezone: 'UTC'
      },
      
      ...config
    };
    
    // Core systems
    this.regimeDetector = null;
    this.riskManager = null;
    this.trader = null;
    this.patternRecognition = null;
    this.websocket = null;
    
    // Operational state
    this.operationalState = {
      isRunning: false,
      startTime: null,
      endTime: null,
      
      // Performance tracking
      totalTrades: 0,
      winningTrades: 0,
      totalProfit: 0,
      currentBalance: this.config.initialBalance,
      peakBalance: this.config.initialBalance,
      
      // Learning metrics
      patternDatabase: new Map(),
      regimeSuccessRates: new Map(),
      timeOfDayPerformance: new Array(24).fill(0.5),
      
      // Market data
      currentPrice: 0,
      lastTradeTime: 0,
      
      // Safety systems
      emergencyStopTriggered: false,
      healthCheck: {
        lastUpdate: Date.now(),
        websocketConnected: false,
        dataFlowing: false
      }
    };
    
    // Performance monitoring
    this.performanceLog = [];
    this.dailyStats = new Map();
    
    // Error handling
    this.errorCount = 0;
    this.maxErrors = 10;
    
    console.log('🚀 OGZ AUTONOMOUS TRADER initialized for 3-day operation');
    console.log(`💰 Starting Balance: $${this.config.initialBalance}`);
    console.log(`🎯 Mode: ${this.config.operationMode}`);
    console.log(`⏰ Max Operation: ${this.config.maxOperationDays} days`);
  }
  
  /**
   * Initialize all core systems
   */
  async initialize() {
    try {
      console.log('🔧 Initializing core trading systems...');
      
      // 1. Initialize Market Regime Detector
      this.regimeDetector = new MarketRegimeDetector({
        symbol: this.config.symbol,
        correlationAssets: ['ETH-USD', 'SPY', 'GLD', 'TLT'], // Multi-asset regime detection
        enableMacroAnalysis: true,
        learningMode: true
      });
      
      // 2. Initialize Risk Management (SEMI-AGGRESSIVE)
      this.riskManager = new AdaptiveRiskManagementSystem({
        initialBalance: this.config.initialBalance,
        baseRiskPerTrade: this.config.baseRisk,
        maxRiskPerTrade: this.config.maxRisk,
        maxDrawdown: this.config.maxDrawdown,
        maxOpenPositions: 4, // Up to 4 concurrent positions
        useKellyCriterion: true,
        kellyFraction: 0.4 // More aggressive Kelly
      });
      
      // 3. Initialize Multi-Directional Trader
      this.trader = new MultiDirectionalTrader({
        symbol: this.config.symbol,
        enableHedging: true,
        enableArbitrage: true,
        riskLevel: 'semi_aggressive'
      });
      
      // 4. Initialize Pattern Recognition
      this.patternRecognition = new EnhancedPatternChecker({
        symbol: this.config.symbol,
        similarityThreshold: 0.8,
        minTradeHistory: 3,
        confidenceThreshold: 0.6,
        memory: {
          memoryFile: './data/pattern-memory.json',
          persistToDisk: true,
          maxPatterns: 10000
        }
      });
      
      // 5. Initialize Alpha Vantage WebSocket (REAL DATA - NO FAKE PRICES!)
      this.websocket = new FreeWebSocket({
        symbols: [this.config.symbol, 'ETH-USD'],
        apiKey: process.env.ALPHA_VANTAGE_API_KEY,
        enableRealTime: true,
        pollInterval: 5000 // 5 seconds for free tier
      });
      console.log('📈 Alpha Vantage WebSocket initialized - REAL MARKET DATA ONLY');
      console.log('💎 NO SIMULATION, NO FAKE DATA - REAL TRADING ONLY!');
      
      // 6. Setup event handlers
      this.setupEventHandlers();
      
      // 7. Load historical learning data
      await this.loadLearningData();
      
      console.log('✅ All systems initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }
  
  // DEMO MODE FUNCTIONS REMOVED - REAL DATA ONLY!
  // No fake data, no simulation - only real market trading
  
  /**
   * Setup event handlers for system integration
   */
  setupEventHandlers() {
    // Market data events
    this.websocket.on('price_update', (data) => {
      this.handlePriceUpdate(data);
    });
    
    this.websocket.on('trade', (data) => {
      this.handleTradeData(data);
    });
    
    // Regime detection events
    this.regimeDetector.on('regime_change', (regime) => {
      this.handleRegimeChange(regime);
    });
    
    // Risk management events
    this.riskManager.on('positionOpened', (position) => {
      this.handlePositionOpened(position);
    });
    
    this.riskManager.on('positionClosed', (data) => {
      this.handlePositionClosed(data);
    });
    
    this.riskManager.on('maxDrawdownReached', (drawdown) => {
      this.handleEmergencyStop('Max drawdown reached');
    });
    
    // Pattern recognition doesn't emit events - it's called directly during analysis
    
    // Trading events
    this.trader.on('trade_executed', (trade) => {
      this.handleTradeExecuted(trade);
    });
    
    this.trader.on('error', (error) => {
      this.handleTradingError(error);
    });
    
    // Health monitoring
    setInterval(() => this.performHealthCheck(), 30000); // Every 30 seconds
    setInterval(() => this.saveLearningData(), 300000); // Every 5 minutes
    setInterval(() => this.generatePerformanceReport(), 3600000); // Every hour
  }
  
  /**
   * Start autonomous trading operation
   */
  async startAutonomousTrading() {
    try {
      if (this.operationalState.isRunning) {
        console.log('⚠️ Trading already running');
        return;
      }
      
      console.log('🚀 STARTING AUTONOMOUS TRADING - 3 DAY OPERATION');
      
      // Set operation timeframe
      this.operationalState.startTime = Date.now();
      this.operationalState.endTime = Date.now() + (this.config.maxOperationDays * 24 * 60 * 60 * 1000);
      this.operationalState.isRunning = true;
      
      // Connect to market data - REAL DATA ONLY!
      await this.websocket.connect();
      console.log('📡 Live WebSocket connected - REAL DATA ONLY');
      
      // Regime detector is ready (no explicit start method needed)
      console.log('📊 Regime detection system ready');
      
      // Pattern recognition is ready (no explicit start method needed)
      console.log('🧠 Pattern recognition system active');
      
      // Setup autonomous operation timer
      this.setupAutonomousTimer();
      
      // Initial market analysis
      await this.performInitialAnalysis();
      
      console.log('✅ AUTONOMOUS TRADING ACTIVE');
      console.log(`⏰ Will run until: ${new Date(this.operationalState.endTime).toLocaleString()}`);
      
      // Emit start event
      this.emit('autonomousStart', {
        startTime: this.operationalState.startTime,
        endTime: this.operationalState.endTime,
        mode: this.config.operationMode
      });
      
    } catch (error) {
      console.error('❌ Failed to start autonomous trading:', error);
      this.handleEmergencyStop('Startup failure');
      throw error;
    }
  }
  
  /**
   * Handle incoming price updates
   */
  async handlePriceUpdate(data) {
    try {
      this.operationalState.currentPrice = data.price;
      this.operationalState.healthCheck.lastUpdate = Date.now();
      this.operationalState.healthCheck.dataFlowing = true;
      
      // Update all systems with new price
      await this.updatePrice(data);
      // Pattern recognition analyzes data when evaluatePattern is called
      
      // Check for trading opportunities
      await this.evaluateTradingOpportunity(data);
      
    } catch (error) {
      console.error('Error handling price update:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Evaluate trading opportunities (MAIN TRADING LOGIC)
   */
  async evaluateTradingOpportunity(priceData) {
    try {
      // Check if we can trade
      if (!this.canTrade()) {
        return;
      }
      
      // Get current market regime
      const currentRegime = await this.getCurrentRegime();
      
      // Get pattern analysis using feature extraction
      const patternAnalysis = await this.getPatternAnalysis(priceData);
      
      // Check regime success rate
      const regimeSuccessRate = this.operationalState.regimeSuccessRates.get(currentRegime.name) || 0.5;
      
      // Only trade in favorable regimes for semi-aggressive mode
      if (regimeSuccessRate < 0.45) {
        console.log(`⏸️ Skipping trade - poor regime performance: ${currentRegime.name} (${(regimeSuccessRate * 100).toFixed(1)}%)`);
        return;
      }
      
      // Generate trading signal
      const signal = await this.generateTradingSignal(currentRegime, patternAnalysis, priceData);
      
      if (signal && signal.confidence >= this.config.confidenceThreshold) {
        console.log(`🎯 High confidence signal detected: ${signal.direction} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
        
        // Execute trade through risk manager
        await this.executeTrade(signal);
      }
      
    } catch (error) {
      console.error('Error evaluating trading opportunity:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Get current market regime
   */
  async getCurrentRegime() {
    try {
      // For now, return a default regime state
      // In a real implementation, this would analyze recent candles
      const state = this.regimeDetector.getState();
      
      return {
        regime: state.regime || 'ranging',
        name: state.regime || 'ranging',
        confidence: state.strength || 0.5,
        volatility: state.metrics?.volatility || 0.02,
        trendStrength: state.metrics?.trendStrength || 0.5,
        recommendedAction: this.getActionFromRegime(state.regime || 'ranging')
      };
    } catch (error) {
      console.error('Error getting current regime:', error);
      return {
        regime: 'ranging',
        name: 'ranging',
        confidence: 0.5,
        volatility: 0.02,
        trendStrength: 0.5,
        recommendedAction: 'hold'
      };
    }
  }
  
  /**
   * Convert regime to trading action
   */
  getActionFromRegime(regime) {
    const actions = {
      'trending_up': 'buy',
      'trending_down': 'sell',
      'breakout': 'buy',
      'breakdown': 'sell',
      'ranging': 'hold',
      'volatile': 'hold',
      'quiet': 'hold'
    };
    
    return actions[regime] || 'hold';
  }
  
  /**
   * Update regime detector with price data
   */
  async updatePrice(data) {
    try {
      // Store price data for regime analysis
      if (!this.priceHistory) {
        this.priceHistory = [];
      }
      
      this.priceHistory.push({
        timestamp: data.timestamp || Date.now(),
        open: data.price,
        high: data.price,
        low: data.price,
        close: data.price,
        volume: data.volume || 0
      });
      
      // Keep only last 200 candles
      if (this.priceHistory.length > 200) {
        this.priceHistory = this.priceHistory.slice(-200);
      }
      
      // Analyze market if we have enough data
      if (this.priceHistory.length >= 50) {
        this.regimeDetector.analyzeMarket(this.priceHistory);
      }
      
    } catch (error) {
      console.error('Error updating price data:', error);
    }
  }
  
  /**
   * Get pattern analysis using feature extraction
   */
  async getPatternAnalysis(priceData) {
    try {
      // Get market data for feature extraction
      const candles = await this.regimeDetector.getCandles(); // Assuming this method exists
      
      if (!candles || candles.length < 30) {
        return { patterns: [], confidence: 0 };
      }
      
      // Extract features from current market state
      const features = FeatureExtractor.extract({
        candles: candles,
        trend: 'sideways', // Default, will be updated by regime detector
        macd: 0,
        signal: 0,
        rsi: 50,
        lastTrade: null,
        useOptimizedIndicators: true
      });
      
      // Evaluate pattern using the pattern checker
      const evaluation = this.patternRecognition.evaluatePattern(features, {
        scalperMode: this.config.operationMode === 'SEMI_AGGRESSIVE',
        confidenceThreshold: this.config.confidenceThreshold
      });
      
      return {
        patterns: evaluation.confidence > 0 ? [{
          type: evaluation.exactMatch ? 'exact_match' : 'similar_pattern',
          direction: evaluation.direction,
          confidence: evaluation.confidence,
          timesSeen: evaluation.timesSeen || 0,
          winRate: evaluation.winRate || 0
        }] : [],
        confidence: evaluation.confidence,
        evaluation: evaluation
      };
      
    } catch (error) {
      console.error('Error in pattern analysis:', error);
      return { patterns: [], confidence: 0 };
    }
  }
  
  /**
   * Generate trading signal combining all analysis
   */
  async generateTradingSignal(regime, patternAnalysis, priceData) {
    try {
      // Base signal from regime
      let signal = {
        symbol: this.config.symbol,
        direction: regime.recommendedAction,
        entryPrice: priceData.price,
        confidence: regime.confidence,
        regime: regime.name,
        timestamp: Date.now()
      };
      
      // Enhance with pattern analysis
      if (patternAnalysis && patternAnalysis.patterns.length > 0) {
        const strongestPattern = patternAnalysis.patterns[0];
        
        // Pattern confidence boost
        if (strongestPattern.direction === signal.direction) {
          signal.confidence += strongestPattern.confidence * 0.3; // 30% boost for alignment
          signal.patternType = strongestPattern.type;
        } else {
          signal.confidence -= 0.15; // Reduce confidence for conflicting signals
        }
      }
      
      // Time of day adjustment
      const hour = new Date().getHours();
      const timePerformance = this.operationalState.timeOfDayPerformance[hour];
      signal.confidence *= (0.7 + timePerformance * 0.6); // 0.7x to 1.3x adjustment
      
      // Volatility adjustment for semi-aggressive mode
      if (regime.volatility > 0.8) {
        signal.confidence *= 1.2; // Boost confidence in high volatility
      }
      
      // Trend strength bonus
      if (regime.trendStrength > 0.7) {
        signal.confidence *= 1.15; // Trend following bonus
      }
      
      // Cap confidence at 95%
      signal.confidence = Math.min(0.95, signal.confidence);
      
      // Add stop loss suggestion
      signal.stopLoss = signal.direction === 'BUY' 
        ? signal.entryPrice * (1 - (regime.volatility * 0.02 + 0.008))
        : signal.entryPrice * (1 + (regime.volatility * 0.02 + 0.008));
      
      return signal;
      
    } catch (error) {
      console.error('Error generating trading signal:', error);
      return null;
    }
  }
  
  /**
   * Execute trade through risk management system
   */
  async executeTrade(signal) {
    try {
      console.log(`🔥 EXECUTING TRADE: ${signal.direction} ${signal.symbol} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      
      // Let risk manager calculate position size and execute
      const position = await this.riskManager.openPosition(signal);
      
      if (position) {
        // Execute through trader
        const execution = await this.trader.executeTrade({
          symbol: signal.symbol,
          direction: signal.direction,
          quantity: position.positionSize,
          price: signal.entryPrice,
          stopLoss: position.stopLoss,
          metadata: {
            regime: signal.regime,
            confidence: signal.confidence,
            patternType: signal.patternType
          }
        });
        
        if (execution.success) {
          this.operationalState.totalTrades++;
          this.operationalState.lastTradeTime = Date.now();
          
          console.log(`✅ Trade executed successfully: ${execution.orderId}`);
          
          // Log trade for learning
          this.logTradeForLearning(signal, position, execution);
        } else {
          console.error('❌ Trade execution failed:', execution.error);
        }
      }
      
    } catch (error) {
      console.error('Error executing trade:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Check if trading is allowed
   */
  canTrade() {
    // Basic operational checks
    if (!this.operationalState.isRunning) return false;
    if (this.operationalState.emergencyStopTriggered) return false;
    if (Date.now() > this.operationalState.endTime) {
      this.stopAutonomousTrading('Operation time limit reached');
      return false;
    }
    
    // Rate limiting (semi-aggressive)
    if (Date.now() - this.operationalState.lastTradeTime < this.config.minTradeGap) {
      return false;
    }
    
    // Daily trade limit
    const today = new Date().toDateString();
    const todayStats = this.dailyStats.get(today) || { trades: 0 };
    if (todayStats.trades >= this.config.maxDailyTrades) {
      return false;
    }
    
    // Risk manager check
    const riskMetrics = this.riskManager.getRiskMetrics();
    if (!riskMetrics.tradingEnabled) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle regime changes
   */
  handleRegimeChange(regime) {
    console.log(`📊 REGIME CHANGE: ${regime.previous} → ${regime.current} | Confidence: ${(regime.confidence * 100).toFixed(1)}%`);
    
    // Adjust trading parameters for new regime
    this.adjustForRegime(regime.current);
    
    // Log regime change
    this.emit('regimeChange', regime);
  }
  
  /**
   * Adjust trading parameters for regime
   */
  adjustForRegime(regime) {
    // Get regime success rate
    const successRate = this.operationalState.regimeSuccessRates.get(regime.name) || 0.5;
    
    if (successRate > 0.7) {
      // High performing regime - increase aggression
      this.config.confidenceThreshold = 0.6; // Lower threshold
      this.config.minTradeGap = 120000; // 2 minutes
    } else if (successRate < 0.4) {
      // Poor performing regime - reduce aggression
      this.config.confidenceThreshold = 0.75; // Higher threshold
      this.config.minTradeGap = 300000; // 5 minutes
    } else {
      // Normal regime - default settings
      this.config.confidenceThreshold = 0.65;
      this.config.minTradeGap = 180000; // 3 minutes
    }
    
    console.log(`⚙️ Adjusted for regime ${regime.name}: threshold=${(this.config.confidenceThreshold * 100).toFixed(0)}%, gap=${this.config.minTradeGap/1000}s`);
  }
  
  /**
   * Handle position closed and update learning
   */
  handlePositionClosed(data) {
    const { position, realizedPnL, isWin } = data;
    
    // Update operational metrics
    this.operationalState.totalProfit += realizedPnL;
    this.operationalState.currentBalance += realizedPnL;
    
    if (isWin) {
      this.operationalState.winningTrades++;
    }
    
    // Update peak balance
    if (this.operationalState.currentBalance > this.operationalState.peakBalance) {
      this.operationalState.peakBalance = this.operationalState.currentBalance;
    }
    
    // Update regime success rates (LEARNING!)
    if (position.regime) {
      const currentRate = this.operationalState.regimeSuccessRates.get(position.regime) || 0.5;
      const newRate = (currentRate * 0.9) + (isWin ? 0.1 : 0); // Exponential moving average
      this.operationalState.regimeSuccessRates.set(position.regime, newRate);
    }
    
    // Update time of day performance
    const hour = new Date(position.openTime).getHours();
    const currentPerf = this.operationalState.timeOfDayPerformance[hour];
    this.operationalState.timeOfDayPerformance[hour] = (currentPerf * 0.95) + (isWin ? 0.05 : 0);
    
    // Update daily stats
    const today = new Date().toDateString();
    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, { trades: 0, profit: 0, wins: 0 });
    }
    const dayStats = this.dailyStats.get(today);
    dayStats.profit += realizedPnL;
    if (isWin) dayStats.wins++;
    
    console.log(`💰 Position closed: ${isWin ? 'WIN' : 'LOSS'} | P&L: ${realizedPnL > 0 ? '+' : ''}$${realizedPnL.toFixed(2)} | Balance: $${this.operationalState.currentBalance.toFixed(2)}`);
  }
  
  /**
   * Log trade for learning purposes
   */
  logTradeForLearning(signal, position, execution) {
    const tradeLog = {
      timestamp: Date.now(),
      signal,
      position,
      execution,
      marketConditions: {
        hour: new Date().getHours(),
        regime: signal.regime,
        confidence: signal.confidence
      }
    };
    
    this.performanceLog.push(tradeLog);
    
    // Keep only last 1000 trades to manage memory
    if (this.performanceLog.length > 1000) {
      this.performanceLog = this.performanceLog.slice(-1000);
    }
  }
  
  /**
   * Perform health check
   */
  performHealthCheck() {
    const now = Date.now();
    const health = this.operationalState.healthCheck;
    
    // Check data flow
    if (now - health.lastUpdate > 120000) { // 2 minutes
      console.warn('⚠️ No market data for 2 minutes');
      health.dataFlowing = false;
    }
    
    // Check WebSocket connection
    health.websocketConnected = this.websocket && this.websocket.isConnected();
    
    // Check system health
    if (!health.dataFlowing || !health.websocketConnected) {
      console.warn('🩺 System health check failed - attempting recovery');
      this.attemptRecovery();
    }
    
    // Memory usage check
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High memory usage detected');
      this.cleanupMemory();
    }
  }
  
  /**
   * Attempt system recovery
   */
  async attemptRecovery() {
    try {
      console.log('🔧 Attempting system recovery...');
      
      // Reconnect WebSocket
      if (!this.operationalState.healthCheck.websocketConnected && this.websocket) {
        try {
          await this.websocket.reconnect();
          console.log('📡 WebSocket reconnected');
        } catch (wsError) {
          console.error('❌ WebSocket reconnect failed:', wsError);
          throw new Error('REAL DATA CONNECTION REQUIRED - No demo fallback allowed');
        }
      }
      
      // Restart regime detection if needed (defensive check)
      if (!this.operationalState.healthCheck.dataFlowing && this.regimeDetector) {
        try {
          if (typeof this.regimeDetector.restart === 'function') {
            await this.regimeDetector.restart();
            console.log('📊 Regime detector restarted');
          } else {
            console.log('⚠️ Regime detector restart method not available - reinitializing');
            // Reinitialize regime detector
            this.regimeDetector = new (require('./core/MarketRegimeDetector'))({
              symbol: this.config.symbol,
              correlationAssets: ['ETH-USD', 'SPY', 'GLD', 'TLT'],
              enableMacroAnalysis: true,
              learningMode: true
            });
            console.log('📊 Regime detector reinitialized');
          }
        } catch (regimeError) {
          console.error('❌ Regime detector restart failed:', regimeError);
          // Continue without regime detection for now
          console.log('🔄 Continuing without regime detection temporarily');
        }
      }
      
      // Reset health check flags
      this.operationalState.healthCheck.lastUpdate = Date.now();
      this.operationalState.healthCheck.dataFlowing = true;
      this.operationalState.healthCheck.websocketConnected = this.websocket && this.websocket.isConnected();
      
      console.log('✅ Recovery attempt completed');
      
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      // Don't call handleError here to avoid potential infinite loop
      console.log('🔄 Continuing with degraded functionality...');
    }
  }
  
  /**
   * Handle errors with counting
   */
  handleError(error) {
    this.errorCount++;
    console.error(`❌ Error ${this.errorCount}/${this.maxErrors}:`, error);
    
    if (this.errorCount >= this.maxErrors) {
      console.error('🚨 Maximum errors reached - triggering emergency stop');
      this.handleEmergencyStop('Too many errors');
    }
  }
  
  /**
   * Emergency stop
   */
  async handleEmergencyStop(reason) {
    console.error(`🚨 EMERGENCY STOP TRIGGERED: ${reason}`);
    
    this.operationalState.emergencyStopTriggered = true;
    this.operationalState.isRunning = false;
    
    try {
      // Close all open positions
      const openPositions = this.riskManager.accountState.openPositions;
      for (const [id, position] of openPositions) {
        await this.riskManager.closePosition(id, this.operationalState.currentPrice, 'Emergency stop');
      }
      
      // Save final state
      await this.saveLearningData();
      await this.generateFinalReport();
      
      // Emit emergency stop event
      this.emit('emergencyStop', { reason, timestamp: Date.now() });
      
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  }
  
  /**
   * Stop autonomous trading normally
   */
  async stopAutonomousTrading(reason = 'Manual stop') {
    console.log(`🛑 Stopping autonomous trading: ${reason}`);
    
    this.operationalState.isRunning = false;
    
    try {
      // Wait for any pending trades to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Close any remaining positions at market
      const openPositions = this.riskManager.accountState.openPositions;
      for (const [id, position] of openPositions) {
        await this.riskManager.closePosition(id, this.operationalState.currentPrice, 'Trading stopped');
      }
      
      // Disconnect systems
      await this.websocket.disconnect();
      
      // Save final learning data
      await this.saveLearningData();
      
      // Generate final report
      await this.generateFinalReport();
      
      console.log('✅ Autonomous trading stopped successfully');
      
    } catch (error) {
      console.error('Error stopping trading:', error);
    }
  }
  
  /**
   * Save learning data for persistence
   */
  async saveLearningData() {
    try {
      const learningData = {
        timestamp: Date.now(),
        regimeSuccessRates: Array.from(this.operationalState.regimeSuccessRates.entries()),
        timeOfDayPerformance: this.operationalState.timeOfDayPerformance,
        patternDatabase: Array.from(this.operationalState.patternDatabase.entries()),
        performanceLog: this.performanceLog.slice(-100), // Last 100 trades
        operationalMetrics: {
          totalTrades: this.operationalState.totalTrades,
          winningTrades: this.operationalState.winningTrades,
          totalProfit: this.operationalState.totalProfit,
          currentBalance: this.operationalState.currentBalance
        }
      };
      
      await fs.writeFile('learning_data.json', JSON.stringify(learningData, null, 2));
      console.log('💾 Learning data saved');
      
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }
  
  /**
   * Load learning data from previous sessions
   */
  async loadLearningData() {
    try {
      const data = await fs.readFile('learning_data.json', 'utf8');
      const learningData = JSON.parse(data);
      
      // Restore regime success rates
      this.operationalState.regimeSuccessRates = new Map(learningData.regimeSuccessRates || []);
      
      // Restore time performance
      this.operationalState.timeOfDayPerformance = learningData.timeOfDayPerformance || new Array(24).fill(0.5);
      
      // Restore pattern database
      this.operationalState.patternDatabase = new Map(learningData.patternDatabase || []);
      
      console.log('📚 Learning data loaded from previous sessions');
      
    } catch (error) {
      console.log('📚 No previous learning data found - starting fresh');
    }
  }
  
  /**
   * Generate performance report
   */
  async generateFinalReport() {
    try {
      const runtime = Date.now() - this.operationalState.startTime;
      const winRate = this.operationalState.totalTrades > 0 
        ? (this.operationalState.winningTrades / this.operationalState.totalTrades) * 100 
        : 0;
      
      const report = {
        '🚀 AUTONOMOUS TRADING REPORT': '===========================',
        '⏰ Operation Duration': `${(runtime / (1000 * 60 * 60)).toFixed(1)} hours`,
        '💰 Starting Balance': `$${this.config.initialBalance}`,
        '💎 Final Balance': `$${this.operationalState.currentBalance.toFixed(2)}`,
        '📈 Total Profit/Loss': `${this.operationalState.totalProfit > 0 ? '+' : ''}$${this.operationalState.totalProfit.toFixed(2)}`,
        '📊 Return %': `${((this.operationalState.totalProfit / this.config.initialBalance) * 100).toFixed(2)}%`,
        '🎯 Total Trades': this.operationalState.totalTrades,
        '🏆 Win Rate': `${winRate.toFixed(1)}%`,
        '📉 Max Drawdown': `${(this.riskManager.accountState.drawdown * 100).toFixed(1)}%`,
        '⚡ Trading Mode': this.config.operationMode,
        '🧠 Patterns Learned': this.operationalState.patternDatabase.size,
        '📅 Daily Stats': Object.fromEntries(this.dailyStats)
      };
      
      console.log('\n' + '='.repeat(50));
      Object.entries(report).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      console.log('='.repeat(50) + '\n');
      
      // Save report to file
      await fs.writeFile(`autonomous_trading_report_${Date.now()}.json`, JSON.stringify(report, null, 2));
      
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const runtime = this.operationalState.startTime 
      ? Date.now() - this.operationalState.startTime 
      : 0;
    
    return {
      isRunning: this.operationalState.isRunning,
      runtime: Math.floor(runtime / 1000), // seconds
      currentBalance: this.operationalState.currentBalance,
      totalTrades: this.operationalState.totalTrades,
      winRate: this.operationalState.totalTrades > 0 
        ? (this.operationalState.winningTrades / this.operationalState.totalTrades) * 100 
        : 0,
      currentPrice: this.operationalState.currentPrice,
      openPositions: this.riskManager ? this.riskManager.accountState.openPositions.size : 0,
      emergencyStop: this.operationalState.emergencyStopTriggered,
      healthStatus: this.operationalState.healthCheck
    };
  }
  
  /**
   * Setup autonomous operation timer
   */
  setupAutonomousTimer() {
    // Check every hour if we should continue
    this.autonomousTimer = setInterval(() => {
      if (Date.now() >= this.operationalState.endTime) {
        console.log('⏰ 3-day operation period completed');
        this.stopAutonomousTrading('Time limit reached');
      }
    }, 3600000); // Check every hour
  }
  
  /**
   * Cleanup memory
   */
  cleanupMemory() {
    // Limit performance log size
    if (this.performanceLog.length > 500) {
      this.performanceLog = this.performanceLog.slice(-500);
    }
    
    // Clear old daily stats (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const [date] of this.dailyStats) {
      if (new Date(date) < sevenDaysAgo) {
        this.dailyStats.delete(date);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  /**
   * Perform initial market analysis
   */
  async performInitialAnalysis() {
    console.log('🔍 Performing initial market analysis...');
    
    // Wait for initial data
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get current regime
    const regime = await this.getCurrentRegime();
    console.log(`📊 Current Market Regime: ${regime.regime} (${(regime.confidence * 100).toFixed(0)}%)`);
    
    // Pattern recognition is ready for evaluation
    console.log('🧩 Pattern recognition system ready for market analysis');
    
    console.log('✅ Initial analysis complete - ready to trade');
  }
}

module.exports = OGZAutonomousTrader;