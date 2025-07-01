/**
 * @fileoverview OGZ Prime Comprehensive Backtester - Advanced Trading System Performance Engine
 * @description Advanced backtesting engine with pattern recognition, risk management, and multi-threaded processing
 * @version 10.2
 * @author OGZ Prime Development Team
 * @created 2025
 * 
 * This comprehensive backtester addresses critical issues identified in previous system audits
 * and provides enterprise-grade backtesting capabilities for validating OGZ Prime trading strategies.
 * 
 * CORE FEATURES:
 * ==============
 * - Multi-threaded parallel processing for maximum performance
 * - Advanced pattern recognition with AI-powered confidence scoring
 * - Comprehensive risk management and position sizing
 * - Multi-timeframe analysis and synchronization
 * - Professional performance analytics and reporting
 * - Real-time progress tracking and event-driven architecture
 * 
 * INTEGRATION ARCHITECTURE:
 * ========================
 * This backtester integrates with all core OGZ Prime components:
 * - OptimizedIndicators: Technical analysis calculations
 * - EnhancedPatternRecognition: AI pattern matching with learning
 * - MaxProfitManager: Advanced exit strategies
 * - RiskManager: Position sizing and capital preservation
 * - PerformanceAnalyzer: Trade statistics and metrics
 * - PerformanceVisualizer: Charts and performance visualizations
 * - TimeframeManager: Multi-timeframe data management
 */

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const EventEmitter = require('events');

// Core system imports - using path resolution for reliability
const rootDir = path.resolve(__dirname, '..');
const corePath = path.join(rootDir, 'core');
const dataPath = path.join(rootDir, 'data');
const outputPath = path.join(rootDir, 'output');

// Import core trading components
const { indicators } = require(path.join(corePath, 'OptimizedIndicators'));
const { EnhancedPatternChecker, FeatureExtractor } = require(path.join(corePath, 'EnhancedPatternRecognition'));
const MaxProfitManager = require(path.join(corePath, 'MaxProfitManager'));
const RiskManager = require(path.join(corePath, 'RiskManager'));
const PerformanceAnalyzer = require(path.join(corePath, 'PerformanceAnalyzer'));
const PerformanceVisualizer = require(path.join(corePath, 'PerformanceVisualizer'));
const TimeframeManager = require(path.join(corePath, 'TimeframeManager'));

/**
 * @class ComprehensiveBacktester
 * @extends EventEmitter
 * @description Advanced backtesting engine for OGZ Prime trading system
 * 
 * This class provides comprehensive backtesting capabilities with support for:
 * - Single and multi-threaded operation for optimal performance
 * - Real-time progress tracking and event emission
 * - Advanced pattern recognition and confidence scoring
 * - Professional risk management and position sizing
 * - Detailed analytics and performance visualization
 * 
 * EVENT SYSTEM:
 * =============
 * The backtester emits events for real-time monitoring:
 * - 'initialized': System setup complete
 * - 'start': Backtest execution beginning
 * - 'progress': Real-time progress updates
 * - 'batchComplete': Processing batch completion
 * - 'error': Error conditions and recovery
 * - 'complete': Final results available
 * - 'stop': Manual termination
 * 
 * @example
 * const backtester = new ComprehensiveBacktester({
 *   dataFile: './data/btc-1y.json',
 *   initialBalance: 10000,
 *   useParallelProcessing: true,
 *   numThreads: 4
 * });
 * 
 * backtester.on('progress', (data) => {
 *   console.log(`Progress: ${data.percent}%`);
 * });
 * 
 * const results = await backtester.start();
 */
class ComprehensiveBacktester extends EventEmitter {
  /**
   * @constructor
   * @description Initialize the comprehensive backtesting engine
   * 
   * @param {Object} config - Configuration options for the backtesting system
   * @param {string} config.dataFile - Path to historical data file
   * @param {string} config.dataFormat - Data format ('json' or 'csv')
   * @param {string} config.baseTimeframe - Primary analysis timeframe
   * @param {Array<string>} config.additionalTimeframes - Additional timeframes for multi-timeframe analysis
   * @param {number} config.initialBalance - Starting capital for backtesting
   * @param {string} config.assetSymbol - Trading pair symbol
   * @param {number} config.feePercentage - Trading fees as percentage
   * @param {number} config.patternSimilarityThreshold - Pattern matching threshold
   * @param {number} config.minPatternMatches - Minimum pattern matches required
   * @param {number} config.minConfidenceThreshold - Minimum confidence for trade execution
   * @param {number} config.baseRiskPercent - Base risk per trade percentage
   * @param {number} config.maxDrawdownPercent - Maximum allowable drawdown
   * @param {boolean} config.enableTieredExit - Enable advanced exit strategies
   * @param {boolean} config.enableTrailingStop - Enable trailing stop functionality
   * @param {boolean} config.useParallelProcessing - Enable multi-threading
   * @param {number} config.numThreads - Number of worker threads
   * @param {number} config.batchSize - Processing batch size
   * @param {string} config.outputDir - Results output directory
   * @param {boolean} config.saveResults - Save results to files
   * @param {boolean} config.generateVisualizations - Generate performance charts
   * @param {boolean} config.detailedReporting - Enable detailed analytics
   * @param {boolean} config.verbose - Verbose logging
   * @param {boolean} config.debugMode - Debug mode with extra validation
   */
  constructor(config = {}) {
    super();
    
    // Default configuration with intelligent defaults
    this.config = {
      // === DATA CONFIGURATION ===
      dataFile: '',                   // Path to historical market data
      dataFormat: 'json',             // Data format: 'json' or 'csv'
      
      // === TIMEFRAME ANALYSIS ===
      baseTimeframe: '1m',            // Primary analysis timeframe
      additionalTimeframes: ['5m', '15m', '1h', '4h', '1d'], // Multi-timeframe confluence
      
      // === CAPITAL MANAGEMENT ===
      initialBalance: 10000,          // Starting capital (USD)
      assetSymbol: 'BTC-USD',         // Primary trading pair
      feePercentage: 0.1,             // Trading fees (0.1% = 10 basis points)
      
      // === PATTERN RECOGNITION SETTINGS ===
      patternSimilarityThreshold: 0.8,  // Pattern matching sensitivity (0-1)
      minPatternMatches: 3,             // Minimum historical matches required
      minConfidenceThreshold: 0.6,      // Minimum AI confidence for execution
      
      // === RISK MANAGEMENT ===
      baseRiskPercent: 1.5,           // Base risk per trade (% of capital)
      maxDrawdownPercent: 15,         // Maximum portfolio drawdown allowed
      enableTieredExit: true,         // Advanced profit-taking strategies
      enableTrailingStop: true,       // Dynamic stop-loss management
      
      // === PERFORMANCE OPTIMIZATION ===
      useParallelProcessing: true,    // Multi-core processing
      numThreads: require('os').cpus().length, // Utilize all available cores
      batchSize: 5000,                // Optimal batch size for memory efficiency
      
      // === OUTPUT AND REPORTING ===
      outputDir: path.join(outputPath, 'backtest-results'),
      saveResults: true,              // Persist results for analysis
      generateVisualizations: true,   // Performance charts and graphs
      detailedReporting: true,        // Comprehensive analytics
      
      // === DEVELOPMENT AND DEBUGGING ===
      verbose: false,                 // Detailed console output
      debugMode: false,               // Extra validation and checks
      
      // User configuration override
      ...config
    };
    
    // Ensure output directory exists
    if (this.config.saveResults && !fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
    
    // === BACKTEST STATE MANAGEMENT ===
    /**
     * @property {Object} state - Comprehensive state tracking for backtest execution
     */
    this.state = {
      // === EXECUTION STATE ===
      isRunning: false,               // Current execution status
      isInitialized: false,           // Initialization completion flag
      startTime: null,                // Execution start timestamp
      endTime: null,                  // Execution completion timestamp
      currentCandle: 0,               // Current processing position
      totalCandles: 0,                // Total candles in dataset
      currentBalance: this.config.initialBalance, // Real-time balance tracking
      
      // === TRADING STATE ===
      trades: [],                     // Complete trade history
      positions: [],                  // Open positions tracking
      
      // === RISK METRICS ===
      drawdown: {
        current: 0,                   // Current drawdown percentage
        max: 0,                       // Maximum drawdown reached
        periods: []                   // Drawdown period analysis
      },
      
      // === PERFORMANCE STATISTICS ===
      tradeStats: {
        total: 0,                     // Total trades executed
        wins: 0,                      // Winning trades count
        losses: 0,                    // Losing trades count
        breakeven: 0,                 // Breakeven trades count
        avgPnL: 0,                    // Average profit/loss per trade
        avgWin: 0,                    // Average winning trade size
        avgLoss: 0,                   // Average losing trade size
        largestWin: 0,                // Largest single win
        largestLoss: 0,               // Largest single loss
        avgHoldTimeMs: 0              // Average position hold time
      },
      
      // === PATTERN RECOGNITION METRICS ===
      patterns: {},                   // Pattern performance database
      patternStats: {
        detected: 0,                  // Total patterns detected
        traded: 0,                    // Patterns that triggered trades
        profitable: 0                 // Profitable pattern instances
      }
    };
    
    // === CORE COMPONENT ARCHITECTURE ===
    /**
     * @property {Object} components - Core trading system components
     */
    this.components = {
      timeframeManager: null,         // Multi-timeframe data management
      patternChecker: null,           // AI pattern recognition engine
      maxProfitManager: null,         // Advanced exit strategy manager
      riskManager: null,              // Position sizing and risk control
      performanceAnalyzer: null,      // Advanced analytics engine
      performanceVisualizer: null,    // Chart and visualization generator
      workers: []                     // Worker thread pool for parallel processing
    };
    
    // === DATA STORAGE ===
    this.historicalData = [];         // Main historical dataset
    this.lastError = null;            // Last error for debugging
    this.currentPosition = null;      // Active trading position
  }
  
  /**
   * @method initialize
   * @description Initialize all backtesting components and validate configuration
   * 
   * This method sets up the entire backtesting infrastructure including:
   * - Core component initialization
   * - Historical data loading and validation
   * - System resource allocation
   * - Performance monitoring setup
   * 
   * @returns {boolean} Success status - true if initialization completed successfully
   * @fires ComprehensiveBacktester#initialized
   * @fires ComprehensiveBacktester#error
   * 
   * @example
   * const success = backtester.initialize();
   * if (success) {
   *   console.log('Backtester ready for execution');
   * }
   */
  initialize() {
    try {
      console.log(`\n====== OGZ Prime Comprehensive Backtester ======`);
      console.log(`Initializing backtester for ${this.config.assetSymbol}...`);
      
      // Initialize core components
      this.initializeComponents();
      
      // Load historical data
      if (this.config.dataFile) {
        this.loadHistoricalData(this.config.dataFile);
      }
      
      this.state.isInitialized = true;
      console.log(`Backtester initialized successfully.`);
      
      // Emit initialization event
      this.emit('initialized', {
        config: this.config,
        candles: this.historicalData.length
      });
      
      return true;
    } catch (error) {
      this.lastError = error;
      console.error(`❌ Initialization failed: ${error.message}`);
      
      // Emit error event
      this.emit('error', {
        phase: 'initialization',
        error: error.message,
        stack: error.stack
      });
      
      return false;
    }
  }
  
  /**
   * @method initializeComponents
   * @description Initialize all required trading system components
   * @private
   * 
   * Creates and configures all subsystems with proper dependency injection:
   * - TimeframeManager for multi-timeframe data synchronization
   * - EnhancedPatternChecker for AI-powered pattern recognition
   * - RiskManager for position sizing and capital preservation
   * - MaxProfitManager for sophisticated exit strategies
   * - PerformanceAnalyzer for advanced analytics
   * - PerformanceVisualizer for chart generation
   */
  initializeComponents() {
    // Create timeframe manager
    this.components.timeframeManager = new TimeframeManager(this.config.baseTimeframe);
    
    // Add additional timeframes
    this.config.additionalTimeframes.forEach(tf => {
      this.components.timeframeManager.addTimeframe(tf);
    });
    
    // Initialize pattern checker
    this.components.patternChecker = new EnhancedPatternChecker({
      similarityThreshold: this.config.patternSimilarityThreshold,
      minTradeHistory: this.config.minPatternMatches,
      confidenceThreshold: this.config.minConfidenceThreshold,
      memory: {
        memoryFile: path.join(this.config.outputDir, `pattern-memory-${this.config.assetSymbol}.json`),
        persistToDisk: this.config.saveResults,
        maxPatterns: 10000
      }
    });
    
    // Initialize risk manager
    this.components.riskManager = new RiskManager({
      baseRiskPercent: this.config.baseRiskPercent,
      maxDrawdownPercent: this.config.maxDrawdownPercent,
      verboseLogging: this.config.verbose
    });
    
    // Initialize risk manager with starting balance
    this.components.riskManager.initialize(this.config.initialBalance);
    
    // Initialize max profit manager
    this.components.maxProfitManager = new MaxProfitManager({
      enableTieredExit: this.config.enableTieredExit,
      enableTrailingStop: this.config.enableTrailingStop
    });
    
    // Initialize performance analyzer
    this.components.performanceAnalyzer = new PerformanceAnalyzer({
      tradesDbPath: path.join(this.config.outputDir, `performance-${this.config.assetSymbol}.json`)
    });
    
    // Initialize performance visualizer
    this.components.performanceVisualizer = new PerformanceVisualizer({
      outputDir: path.join(this.config.outputDir, 'charts'),
      saveCharts: this.config.generateVisualizations,
      generateHtml: this.config.generateVisualizations
    });
    
    // Initialize visualizer with starting balance
    this.components.performanceVisualizer.initialize(this.config.initialBalance);
    
    console.log(`Core components initialized successfully.`);
  }
  
  /**
   * @method loadHistoricalData
   * @description Load and validate historical market data from file
   * 
   * Performs comprehensive data loading with validation:
   * - File existence and accessibility verification
   * - Format detection and parsing (JSON/CSV)
   * - Schema validation for required OHLCV fields
   * - Data integrity checks and chronological ordering
   * 
   * @param {string} filePath - Path to historical data file
   * @returns {boolean} Success status - true if data loaded successfully
   * 
   * @example
   * const success = backtester.loadHistoricalData('./data/btc-1y.json');
   * if (success) {
   *   console.log(`Loaded ${backtester.historicalData.length} candles`);
   * }
   */
  loadHistoricalData(filePath) {
    try {
      console.log(`Loading historical data from ${filePath}...`);
      
      // Handle both absolute and relative paths
      const resolvedPath = path.resolve(filePath);
      
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
      }
      
      // Read file based on format
      if (this.config.dataFormat === 'json') {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        this.historicalData = JSON.parse(fileContent);
      } else if (this.config.dataFormat === 'csv') {
        // Implement CSV parsing if needed
        throw new Error('CSV format not yet implemented.');
      } else {
        throw new Error(`Unsupported data format: ${this.config.dataFormat}`);
      }
      
      // Sort data by timestamp if not already sorted
      this.historicalData.sort((a, b) => a.timestamp - b.timestamp);
      
      // Validate data format
      if (this.historicalData.length > 0) {
        const firstCandle = this.historicalData[0];
        const requiredFields = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
        
        for (const field of requiredFields) {
          if (!(field in firstCandle)) {
            throw new Error(`Required field missing in data: ${field}`);
          }
        }
      }
      
      console.log(`✅ Loaded ${this.historicalData.length} candles from ${filePath}`);
      this.state.totalCandles = this.historicalData.length;
      
      return true;
    } catch (error) {
      this.lastError = error;
      console.error(`❌ Failed to load data: ${error.message}`);
      
      // Emit error event
      this.emit('error', {
        phase: 'data_loading',
        error: error.message,
        stack: error.stack
      });
      
      return false;
    }
  }
  
  /**
   * @method start
   * @description Start the comprehensive backtest execution
   * 
   * Orchestrates the complete backtesting process:
   * - Initialization validation
   * - Component reset and preparation
   * - Parallel or single-threaded execution
   * - Results compilation and reporting
   * 
   * @returns {Promise<Object>} Complete backtest results
   * @fires ComprehensiveBacktester#start
   * @fires ComprehensiveBacktester#complete
   * @fires ComprehensiveBacktester#error
   * 
   * @example
   * try {
   *   const results = await backtester.start();
   *   console.log(`Final balance: $${results.performance.finalBalance}`);
   * } catch (error) {
   *   console.error('Backtest failed:', error);
   * }
   */
  async start() {
    // Check if initialized
    if (!this.state.isInitialized) {
      if (!this.initialize()) {
        throw new Error('Failed to initialize backtester.');
      }
    }
    
    // Check if we have data
    if (this.historicalData.length === 0) {
      throw new Error('No historical data loaded. Please load data before starting backtest.');
    }
    
    // Update state
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.state.currentBalance = this.config.initialBalance;
    this.state.currentCandle = 0;
    
    // Reset trading components
    this.resetComponents();
    
    console.log(`\n====== Starting Backtest ======`);
    console.log(`Asset: ${this.config.assetSymbol}`);
    console.log(`Initial Balance: $${this.config.initialBalance.toFixed(2)}`);
    console.log(`Candles: ${this.historicalData.length}`);
    console.log(`Base Timeframe: ${this.config.baseTimeframe}`);
    
    // Emit start event
    this.emit('start', {
      startTime: this.state.startTime,
      initialBalance: this.config.initialBalance,
      totalCandles: this.state.totalCandles
    });
    
    try {
      // Run in parallel or single-threaded mode
      if (this.config.useParallelProcessing && this.config.numThreads > 1) {
        await this.runParallelBacktest();
      } else {
        await this.runSingleThreadedBacktest();
      }
      
      // Finalize and generate reports
      return this.finalizeResults();
    } catch (error) {
      this.lastError = error;
      console.error(`❌ Backtest failed: ${error.message}`);
      
      // Emit error event
      this.emit('error', {
        phase: 'execution',
        error: error.message,
        stack: error.stack
      });
      
      // Clean up
      this.state.isRunning = false;
      
      throw error;
    }
  }
  
  /**
   * @method resetComponents
   * @description Reset trading components for a fresh backtest
   * @private
   * 
   * Resets all stateful components to ensure clean backtest execution:
   * - TimeframeManager reset and reconfiguration
   * - RiskManager reset with fresh capital allocation
   * - Position state cleanup
   */
  resetComponents() {
    // Reset timeframe manager
    this.components.timeframeManager = new TimeframeManager(this.config.baseTimeframe);
    
    // Re-add additional timeframes
    this.config.additionalTimeframes.forEach(tf => {
      this.components.timeframeManager.addTimeframe(tf);
    });
    
    // Reset risk manager
    this.components.riskManager.reset();
    this.components.riskManager.initialize(this.config.initialBalance);
    
    // Reset position state
    this.currentPosition = null;
  }
  
  /**
   * @method runSingleThreadedBacktest
   * @description Execute backtest in single-threaded mode
   * @private
   * 
   * Processes historical data sequentially with batch optimization:
   * - Memory-efficient batch processing
   * - Real-time progress reporting
   * - Comprehensive error handling
   * - Resource cleanup and optimization
   * 
   * @returns {Promise<void>}
   */
  async runSingleThreadedBacktest() {
    console.log(`Running backtest in single-threaded mode...`);
    
    // Process candles in batches for better performance
    const batchSize = this.config.batchSize;
    const totalBatches = Math.ceil(this.historicalData.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, this.historicalData.length);
      const batch = this.historicalData.slice(startIdx, endIdx);
      
      // Process each candle in the batch
      for (let i = 0; i < batch.length; i++) {
        const candle = batch[i];
        
        // Process the candle
        this.processCandle(candle);
        
        // Update progress
        this.state.currentCandle++;
        
        // Report progress periodically
        if (this.state.currentCandle % 1000 === 0 || this.state.currentCandle === this.state.totalCandles) {
          this.reportProgress();
        }
      }
      
      // Emit batch complete event
      this.emit('batchComplete', {
        batchIndex,
        startIdx,
        endIdx,
        processedCandles: this.state.currentCandle,
        totalCandles: this.state.totalCandles
      });
    }
    
    console.log(`\n✅ Single-threaded backtest complete.`);
  }
  
  /**
   * @method runParallelBacktest
   * @description Execute backtest using parallel worker threads
   * @private
   * 
   * Implements high-performance parallel processing:
   * - Worker thread pool management
   * - Data chunk distribution across cores
   * - Inter-thread communication and error handling
   * - Result aggregation and synchronization
   * 
   * @returns {Promise<void>}
   */
  async runParallelBacktest() {
    console.log(`Running backtest in parallel mode with ${this.config.numThreads} threads...`);
    
    // Calculate chunk size for each worker
    const chunkSize = Math.ceil(this.historicalData.length / this.config.numThreads);
    
    // Create promises for each worker
    const workerPromises = [];
    
    for (let i = 0; i < this.config.numThreads; i++) {
      const startIdx = i * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, this.historicalData.length);
      const chunk = this.historicalData.slice(startIdx, endIdx);
      
      console.log(`Thread ${i+1}: Processing candles ${startIdx} to ${endIdx-1} (${chunk.length} candles)`);
      
      // Create worker promise
      const workerPromise = new Promise((resolve, reject) => {
        try {
          // Create worker
          const worker = new Worker(path.join(__dirname, 'backtester-worker.js'), {
            workerData: {
              id: i,
              config: this.config,
              candles: chunk,
              initialBalance: this.config.initialBalance / this.config.numThreads // Split initial balance
            }
          });
          
          // Store worker reference
          this.components.workers.push(worker);
          
          // Handle messages from worker
          worker.on('message', (message) => {
            if (message.type === 'progress') {
              // Update progress
              this.state.currentCandle += message.progress;
              
              // Report progress periodically
              if (this.state.currentCandle % 1000 === 0) {
                this.reportProgress();
              }
            } else if (message.type === 'result') {
              // Store worker result
              resolve(message.data);
            }
          });
          
          // Handle worker error
          worker.on('error', (error) => {
            console.error(`Thread ${i+1} error:`, error);
            reject(error);
          });
          
          // Handle worker exit
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        } catch (error) {
          reject(error);
        }
      });
      
      workerPromises.push(workerPromise);
    }
    
    // Wait for all workers to complete
    const workerResults = await Promise.all(workerPromises);
    
    // Combine results from all workers
    this.combineWorkerResults(workerResults);
    
    console.log(`\n✅ Parallel backtest complete.`);
  }
  
  /**
   * @method combineWorkerResults
   * @description Aggregate results from parallel worker threads
   * @private
   * 
   * Combines and synchronizes results from multiple workers:
   * - Trade history aggregation and chronological sorting
   * - Balance calculation and profit/loss compilation
   * - Pattern performance data merging
   * - Statistics calculation and validation
   * 
   * @param {Array} workerResults - Results from each worker thread
   */
  combineWorkerResults(workerResults) {
    console.log(`Combining results from ${workerResults.length} threads...`);
    
    // Reset state
    this.state.currentBalance = this.config.initialBalance;
    this.state.trades = [];
    this.state.patterns = {};
    
    // Combine trades and balances
    workerResults.forEach(result => {
      // Add profit/loss to balance
      this.state.currentBalance += result.balanceChange;
      
      // Merge trades
      this.state.trades = this.state.trades.concat(result.trades);
      
      // Merge patterns
      Object.entries(result.patterns).forEach(([patternId, patternData]) => {
        if (!this.state.patterns[patternId]) {
          this.state.patterns[patternId] = { ...patternData };
        } else {
          // Merge trades for this pattern
          this.state.patterns[patternId].trades = 
            this.state.patterns[patternId].trades.concat(patternData.trades);
        }
      });
    });
    
    // Sort trades by timestamp
    this.state.trades.sort((a, b) => a.entryTime - b.entryTime);
    
    // Calculate trade statistics
    this.calculateTradeStatistics();
    
    // Calculate drawdown
    this.calculateMaxDrawdown();
  }
  
  /**
   * @method processCandle
   * @description Process a single market data candle
   * @private
   * 
   * Core trading simulation logic for each data point:
   * - Multi-timeframe data aggregation
   * - Pattern recognition and signal generation
   * - Position management and risk monitoring
   * - Performance tracking and metrics updates
   * 
   * @param {Object} candle - OHLCV candle data with timestamp
   */
  processCandle(candle) {
    // Process through timeframe manager
    this.components.timeframeManager.processCandle(candle);
    
    // Get candles for all timeframes
    const tfCandles = {};
    tfCandles[this.config.baseTimeframe] = this.components.timeframeManager.getCandles(
      this.config.baseTimeframe, 
      100
    );
    
    // Get higher timeframe data
    this.config.additionalTimeframes.forEach(tf => {
      tfCandles[tf] = this.components.timeframeManager.getCandles(tf, 100);
    });
    
    // Check for pattern and trading opportunities
    if (tfCandles[this.config.baseTimeframe].length >= 30) {
      this.checkForTradingOpportunities(candle, tfCandles);
    }
    
    // Manage existing position
    if (this.currentPosition) {
      this.managePosition(candle);
    }
    
    // Update risk manager time periods
    this.components.riskManager.checkPeriodResets(
      new Date(candle.timestamp), 
      this.state.currentBalance
    );
  }
  
  /**
   * @method checkForTradingOpportunities
   * @description Analyze market conditions for potential trades
   * @private
   * 
   * Comprehensive trading opportunity analysis:
   * - Technical indicator calculation and evaluation
   * - AI pattern recognition with confidence scoring
   * - Risk management validation and position sizing
   * - Market condition assessment and signal generation
   * 
   * @param {Object} candle - Current market candle
   * @param {Object} tfCandles - Multi-timeframe candle data
   */
  checkForTradingOpportunities(candle, tfCandles) {
    // Skip if already in position
    if (this.currentPosition) return;
    
    // Check if we can trade
    const tradeStatus = this.components.riskManager.canTrade();
    if (!tradeStatus.allowed) {
      if (this.config.verbose) {
        console.log(`Trading disabled: ${tradeStatus.reason}`);
      }
      return;
    }
    
    // Get candles for base timeframe
    const candles = tfCandles[this.config.baseTimeframe];
    
    // Calculate indicators
    const rsi = indicators.calculateRSI(candles);
    const macdResult = indicators.calculateMACD(candles);
    const trend = indicators.determineTrend(candles);
    const volatility = indicators.calculateVolatility(candles);
    
    // Extract features for pattern recognition
    const features = FeatureExtractor.extract({
      candles,
      trend,
      macd: macdResult.macdLine,
      signal: macdResult.signalLine,
      rsi,
      lastTrade: null,
      useOptimizedIndicators: true
    });
    
    // Evaluate pattern
    const patternEvaluation = this.components.patternChecker.evaluatePattern(features);
    
    // Only take trades with sufficient confidence
    if (patternEvaluation.confidence >= this.config.minConfidenceThreshold) {
      const signal = patternEvaluation.direction;
      
      // Only process valid signals (buy or sell)
      if (signal === 'buy' || signal === 'sell') {
        // Get market conditions for risk manager
        const marketConditions = {
          volatility,
          trend,
          isCounterTrend: (signal === 'buy' && trend === 'downtrend') || 
                          (signal === 'sell' && trend === 'uptrend')
        };
        
        // Calculate position size
        const positionSize = this.components.riskManager.calculatePositionSize(
          this.state.currentBalance,
          candle.close,
          patternEvaluation.confidence,
          marketConditions
        );
        
        // Execute trade if position size allowed
        if (positionSize.allowed) {
          this.openPosition(
            signal, 
            candle, 
            positionSize, 
            patternEvaluation
          );
        }
      }
    }
  }
  
  /**
   * @method openPosition
   * @description Execute trade entry and create new position
   * @private
   * 
   * Position creation and trade execution:
   * - Position object creation with comprehensive metadata
   * - Trading fee calculation and balance adjustment
   * - Stop loss and take profit level calculation
   * - Pattern tracking and performance monitoring
   * 
   * @param {string} signal - Trade direction ('buy' or 'sell')
   * @param {Object} candle - Current market candle
   * @param {Object} positionSize - Position sizing information
   * @param {Object} patternEvaluation - Pattern analysis results
   */
  openPosition(signal, candle, positionSize, patternEvaluation) {
    // Create position object
    this.currentPosition = {
      signal,
      entryPrice: candle.close,
      entryTime: candle.timestamp,
      size: positionSize.size,
      confidence: patternEvaluation.confidence,
      patternId: `pattern_${Date.now()}`, // Generate ID if not provided
      patternName: patternEvaluation.reason || 'Unknown Pattern',
      riskAmount: positionSize.sizeUsd,
      stopLoss: null,
      takeProfit: null
    };
    
    // Apply trading fees
    const feesAmount = this.currentPosition.size * this.currentPosition.entryPrice * (this.config.feePercentage / 100);
    this.state.currentBalance -= feesAmount;
    
    // Start MaxProfitManager for trailing stops
    this.components.maxProfitManager.start(
      candle.close,
      signal,
      volatility || 0.01
    );
    
    // Set stop loss based on risk parameters
    // In a real system, this would be more sophisticated
    const stopDistance = this.config.baseRiskPercent / 100;
    if (signal === 'buy') {
      this.currentPosition.stopLoss = candle.close * (1 - stopDistance);
    } else {
      this.currentPosition.stopLoss = candle.close * (1 + stopDistance);
    }
    
    // Log entry if verbose
    if (this.config.verbose) {
      console.log(`🔴 ${signal.toUpperCase()} Entry @ $${candle.close.toFixed(2)} | Size: ${positionSize.size.toFixed(6)} | Pattern: ${patternEvaluation.reason}`);
    }
    
    // Track pattern detection
    this.state.patternStats.detected++;
    this.state.patternStats.traded++;
    
    // Store pattern if not already tracked
    if (!this.state.patterns[this.currentPosition.patternId]) {
      this.state.patterns[this.currentPosition.patternId] = {
        name: this.currentPosition.patternName,
        trades: []
      };
    }
  }
  
  /**
   * @method managePosition
   * @description Monitor and manage open trading position
   * @private
   * 
   * Active position management including:
   * - Stop loss and take profit monitoring
   * - Trailing stop updates via MaxProfitManager
   * - Partial exit execution and position sizing
   * - Risk override conditions and emergency exits
   * 
   * @param {Object} candle - Current market candle
   */
  managePosition(candle) {
    // Skip if no position
    if (!this.currentPosition) return;
    
    const currentPrice = candle.close;
    
    // Update MaxProfitManager with new price
    const result = this.components.maxProfitManager.update(currentPrice);
    
    // Check for exit conditions
    let shouldExit = false;
    let exitReason = '';
    
    // Check for exit signal from MaxProfitManager
    if (result.action === 'exit') {
      shouldExit = true;
      exitReason = result.reason;
    }
    // Check stop loss
    else if (this.currentPosition.signal === 'buy' && currentPrice <= this.currentPosition.stopLoss) {
      shouldExit = true;
      exitReason = 'Stop loss triggered';
    }
    else if (this.currentPosition.signal === 'sell' && currentPrice >= this.currentPosition.stopLoss) {
      shouldExit = true;
      exitReason = 'Stop loss triggered';
    }
    // Handle partial exits
    else if (result.action === 'partialExit') {
      // Calculate partial exit amount
      const partialSize = this.currentPosition.size * result.exitSize;
      
      // Calculate PnL for this partial exit
      const partialPnl = this.currentPosition.signal === 'buy'
        ? (currentPrice - this.currentPosition.entryPrice) * partialSize
        : (this.currentPosition.entryPrice - currentPrice) * partialSize;
      
      // Apply fees
      const feesAmount = partialSize * currentPrice * (this.config.feePercentage / 100);
      
      // Update balance and position size
      this.state.currentBalance += partialPnl - feesAmount;
      this.currentPosition.size -= partialSize;
      
      // Log partial exit if verbose
      if (this.config.verbose) {
        console.log(`🔵 Partial exit (${result.tier}) @ $${currentPrice.toFixed(2)} | Size: ${partialSize.toFixed(6)} | PnL: $${partialPnl.toFixed(2)}`);
      }
    }
    
    // Exit position if needed
    if (shouldExit) {
      this.closePosition(currentPrice, exitReason);
    }
  }
  
  /**
   * @method closePosition
   * @description Execute position exit and record trade results
   * @private
   * 
   * Position closure and trade finalization:
   * - Profit/loss calculation with fee adjustments
   * - Trade object creation with comprehensive metadata
   * - Performance statistics updates
   * - Pattern tracking and learning integration
   * - Component notification for analytics
   * 
   * @param {number} price - Exit price for position closure
   * @param {string} reason - Reason for position exit
   */
  closePosition(price, reason) {
    // Skip if no position
    if (!this.currentPosition) return;
    
    // Calculate PnL
    const pnl = this.currentPosition.signal === 'buy'
      ? (price - this.currentPosition.entryPrice) * this.currentPosition.size
      : (this.currentPosition.entryPrice - price) * this.currentPosition.size;
    
    // Apply trading fees
    const feesAmount = this.currentPosition.size * price * (this.config.feePercentage / 100);
    
    // Update balance
    this.state.currentBalance += pnl - feesAmount;
    
    // Create trade object
    const trade = {
      entryTime: this.currentPosition.entryTime,
      exitTime: Date.now(),
      entryPrice: this.currentPosition.entryPrice,
      exitPrice: price,
      size: this.currentPosition.size,
      direction: this.currentPosition.signal,
      pnl,
      fees: feesAmount,
      netPnl: pnl - feesAmount,
      confidence: this.currentPosition.confidence,
      patternId: this.currentPosition.patternId,
      patternName: this.currentPosition.patternName,
      exitReason: reason,
      holdTimeMs: Date.now() - this.currentPosition.entryTime
    };
    
    // Add to trade history
    this.state.trades.push(trade);
    
    // Update trade statistics
    this.state.tradeStats.total++;
    if (pnl > 0) {
      this.state.tradeStats.wins++;
      this.state.tradeStats.avgWin = (this.state.tradeStats.avgWin * (this.state.tradeStats.wins - 1) + pnl) / this.state.tradeStats.wins;
      this.state.tradeStats.largestWin = Math.max(this.state.tradeStats.largestWin, pnl);
      this.state.patternStats.profitable++;
    } else if (pnl < 0) {
      this.state.tradeStats.losses++;
      this.state.tradeStats.avgLoss = (this.state.tradeStats.avgLoss * (this.state.tradeStats.losses - 1) + Math.abs(pnl)) / this.state.tradeStats.losses;
      this.state.tradeStats.largestLoss = Math.min(this.state.tradeStats.largestLoss, pnl);
    } else {
      this.state.tradeStats.breakeven++;
    }
    
    // Update pattern tracking
    if (this.state.patterns[this.currentPosition.patternId]) {
      this.state.patterns[this.currentPosition.patternId].trades.push({
        entryTime: this.currentPosition.entryTime,
        exitTime: Date.now(),
        pnl,
        confidence: this.currentPosition.confidence
      });
    }
    
    // Process trade with PerformanceAnalyzer
    this.components.performanceAnalyzer.processTrade(trade, {
      price,
      rsi: indicators.calculateRSI(this.components.timeframeManager.getCandles(this.config.baseTimeframe, 100)),
      volatility: indicators.calculateVolatility(this.components.timeframeManager.getCandles(this.config.baseTimeframe, 100))
    });
    
    // Process trade with RiskManager
    this.components.riskManager.processTrade(trade, this.state.currentBalance);
    
    // Track with PerformanceVisualizer
    this.components.performanceVisualizer.trackTrade(trade, this.state.currentBalance);
    
    // Log exit if verbose
    if (this.config.verbose) {
      const emoji = pnl >= 0 ? '💰' : '📉';
      console.log(`${emoji} ${this.currentPosition.signal.toUpperCase()} Exit @ $${price.toFixed(2)} | PnL: $${pnl.toFixed(2)} | ${reason}`);
    }
    
    // Clear current position
    this.currentPosition = null;
  }
  
  /**
   * @method calculateTradeStatistics
   * @description Calculate comprehensive trade performance statistics
   * @private
   * 
   * Computes detailed trading metrics including:
   * - Win/loss ratios and averages
   * - Profit/loss statistics and extremes
   * - Hold time analysis
   * - Performance trend analysis
   */
  calculateTradeStatistics() {
    if (this.state.trades.length === 0) return;
    
    // Reset stats
    this.state.tradeStats = {
      total: this.state.trades.length,
      wins: 0,
      losses: 0,
      breakeven: 0,
      avgPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      avgHoldTimeMs: 0
    };
    
    // Calculate totals
    let totalPnL = 0;
    let totalHoldTime = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    
    for (const trade of this.state.trades) {
      totalPnL += trade.pnl;
      totalHoldTime += trade.holdTimeMs || 0;
      
      if (trade.pnl > 0) {
        winCount++;
        totalWinAmount += trade.pnl;
        this.state.tradeStats.largestWin = Math.max(this.state.tradeStats.largestWin, trade.pnl);
      } else if (trade.pnl < 0) {
        lossCount++;
        totalLossAmount += Math.abs(trade.pnl);
        this.state.tradeStats.largestLoss = Math.min(this.state.tradeStats.largestLoss, trade.pnl);
      } else {
        this.state.tradeStats.breakeven++;
      }
    }
    
    // Update stats
    this.state.tradeStats.wins = winCount;
    this.state.tradeStats.losses = lossCount;
    this.state.tradeStats.avgPnL = totalPnL / this.state.trades.length;
    this.state.tradeStats.avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    this.state.tradeStats.avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
    this.state.tradeStats.avgHoldTimeMs = totalHoldTime / this.state.trades.length;
  }
  
  /**
   * @method calculateMaxDrawdown
   * @description Calculate maximum drawdown and drawdown periods
   * @private
   * 
   * Computes risk metrics including:
   * - Maximum drawdown percentage
   * - Drawdown period identification
   * - Recovery time analysis
   * - Risk-adjusted performance metrics
   */
  calculateMaxDrawdown() {
    let balance = this.config.initialBalance;
    let peak = balance;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let drawdownStart = 0;
    let drawdownEnd = 0;
    
    // Sort trades by timestamp
    const sortedTrades = [...this.state.trades].sort((a, b) => a.entryTime - b.entryTime);
    
    for (const trade of sortedTrades) {
      // Update balance
      balance += trade.pnl;
      
      // Update peak
      if (balance > peak) {
        peak = balance;
      } else {
        // Calculate drawdown
        currentDrawdown = (peak - balance) / peak * 100;
        
        // Update max drawdown
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
          drawdownEnd = trade.exitTime;
        }
      }
    }
    
    // Update state
    this.state.drawdown.max = maxDrawdown;
    this.state.drawdown.periods.push({
      start: drawdownStart,
      end: drawdownEnd,
      drawdown: maxDrawdown
    });
  }
  
  /**
   * @method reportProgress
   * @description Report real-time backtest progress
   * @private
   * 
   * Provides comprehensive progress reporting including:
   * - Processing speed and estimated completion time
   * - Real-time performance metrics
   * - Memory usage and system health
   * - Trade execution statistics
   * 
   * @fires ComprehensiveBacktester#progress
   */
  reportProgress() {
    const progress = (this.state.currentCandle / this.state.totalCandles * 100).toFixed(1);
    const elapsed = (Date.now() - this.state.startTime) / 1000;
    const speed = Math.round(this.state.currentCandle / elapsed);
    
    console.log(`Progress: ${progress}% | Candles: ${this.state.currentCandle}/${this.state.totalCandles} | Speed: ${speed} candles/sec`);
    
    // Report trade statistics if available
    if (this.state.tradeStats.total > 0) {
      const winRate = (this.state.tradeStats.wins / this.state.tradeStats.total * 100).toFixed(1);
      console.log(`Trades: ${this.state.tradeStats.total} | Win Rate: ${winRate}% | Balance: $${this.state.currentBalance.toFixed(2)}`);
    }
    
    // Emit progress event
    this.emit('progress', {
      candle: this.state.currentCandle,
      total: this.state.totalCandles,
      percent: parseFloat(progress),
      elapsed,
      speed,
      tradeStats: this.state.tradeStats,
      balance: this.state.currentBalance
    });
  }
  
  /**
   * @method finalizeResults
   * @description Compile final backtest results and generate reports
   * @private
   * 
   * Results compilation including:
   * - Performance metrics calculation
   * - Trade statistics finalization
   * - Pattern analysis and top performers
   * - Visualization and report generation
   * - Results persistence and cleanup
   * 
   * @returns {Object} Comprehensive backtest results
   * @fires ComprehensiveBacktester#complete
   */
  finalizeResults() {
    // Update end time
    this.state.endTime = Date.now();
    this.state.isRunning = false;
    
    // Calculate final statistics
    this.calculateTradeStatistics();
    this.calculateMaxDrawdown();
    
    // Generate performance report
    const performanceReport = this.components.performanceVisualizer.generateFinalReport();
    
    // Calculate duration
    const duration = (this.state.endTime - this.state.startTime) / 1000;
    
    // Create results object
    const results = {
      config: this.config,
      performance: {
        initialBalance: this.config.initialBalance,
        finalBalance: this.state.currentBalance,
        absoluteReturn: this.state.currentBalance - this.config.initialBalance,
        percentReturn: ((this.state.currentBalance / this.config.initialBalance - 1) * 100),
        maxDrawdown: this.state.drawdown.max,
        sharpeRatio: performanceReport.metrics.sharpeRatio || 0,
        profitFactor: performanceReport.metrics.profitFactor || 0,
        duration
      },
      trades: {
        total: this.state.tradeStats.total,
        wins: this.state.tradeStats.wins,
        losses: this.state.tradeStats.losses,
        breakeven: this.state.tradeStats.breakeven,
        winRate: this.state.tradeStats.wins / (this.state.tradeStats.total || 1),
        avgPnL: this.state.tradeStats.avgPnL,
        avgWin: this.state.tradeStats.avgWin,
        avgLoss: this.state.tradeStats.avgLoss,
        largestWin: this.state.tradeStats.largestWin,
        largestLoss: this.state.tradeStats.largestLoss,
        avgHoldTimeMs: this.state.tradeStats.avgHoldTimeMs
      },
      patterns: {
        detected: this.state.patternStats.detected,
        traded: this.state.patternStats.traded,
        profitable: this.state.patternStats.profitable,
        topPatterns: this.getTopPatterns(5)
      }
    };
    
    // Display results
    this.displayResults(results);
    
    // Save results if enabled
    if (this.config.saveResults) {
      this.saveResults(results);
    }
    
    // Emit complete event
    this.emit('complete', results);
    
    return results;
  }
  
  /**
   * @method getTopPatterns
   * @description Identify and rank top performing patterns
   * @private
   * 
   * @param {number} count - Number of top patterns to return
   * @returns {Array} Array of top performing patterns with statistics
   */
  getTopPatterns(count = 5) {
    // Convert patterns to array for sorting
    const patternsArray = Object.entries(this.state.patterns).map(([patternId, data]) => {
      const trades = data.trades || [];
      const winCount = trades.filter(t => t.pnl > 0).length;
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      return {
        patternId,
        name: data.name || patternId,
        trades: trades.length,
        wins: winCount,
        winRate: trades.length > 0 ? winCount / trades.length : 0,
        totalPnL,
        avgPnL: trades.length > 0 ? totalPnL / trades.length : 0
      };
    });
    
    // Sort by total PnL and return top patterns
    return patternsArray
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, count);
  }
  
  /**
   * @method displayResults
   * @description Display comprehensive backtest results to console
   * @private
   * 
   * @param {Object} results - Complete backtest results object
   */
  displayResults(results) {
    console.log(`\n====== BACKTEST RESULTS ======`);
    console.log(`Asset: ${this.config.assetSymbol}`);
    console.log(`Duration: ${results.performance.duration.toFixed(1)} seconds`);
    console.log(`Candles processed: ${this.state.totalCandles}`);
    
    console.log(`\nPERFORMANCE:`);
    console.log(`Initial Balance: $${this.config.initialBalance.toFixed(2)}`);
    console.log(`Final Balance: $${results.performance.finalBalance.toFixed(2)}`);
    console.log(`Absolute Return: $${results.performance.absoluteReturn.toFixed(2)}`);
    console.log(`Percent Return: ${results.performance.percentReturn.toFixed(2)}%`);
    console.log(`Max Drawdown: ${results.performance.maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${results.performance.sharpeRatio.toFixed(2)}`);
    console.log(`Profit Factor: ${results.performance.profitFactor.toFixed(2)}`);
    
    console.log(`\nTRADES:`);
    console.log(`Total Trades: ${results.trades.total}`);
    console.log(`Win Rate: ${(results.trades.winRate * 100).toFixed(2)}%`);
    console.log(`Average PnL: $${results.trades.avgPnL.toFixed(2)}`);
    console.log(`Average Win: $${results.trades.avgWin.toFixed(2)}`);
    console.log(`Average Loss: $${results.trades.avgLoss.toFixed(2)}`);
    console.log(`Largest Win: $${results.trades.largestWin.toFixed(2)}`);
    console.log(`Largest Loss: $${results.trades.largestLoss.toFixed(2)}`);
    console.log(`Average Hold Time: ${(results.trades.avgHoldTimeMs / (1000 * 60)).toFixed(1)} minutes`);
    
    console.log(`\nPATTERNS:`);
    console.log(`Patterns Detected: ${results.patterns.detected}`);
    console.log(`Patterns Traded: ${results.patterns.traded}`);
    console.log(`Profitable Patterns: ${results.patterns.profitable}`);
    
    if (results.patterns.topPatterns.length > 0) {
      console.log(`\nTOP PERFORMING PATTERNS:`);
      results.patterns.topPatterns.forEach((pattern, index) => {
        console.log(`${index + 1}. ${pattern.name}: ${pattern.trades} trades, ${(pattern.winRate * 100).toFixed(1)}% win rate, $${pattern.totalPnL.toFixed(2)} total PnL`);
      });
    }
  }
  
  /**
   * @method saveResults
   * @description Save comprehensive backtest results to file
   * @private
   * 
   * @param {Object} results - Complete backtest results to persist
   */
  saveResults(results) {
    try {
      // Create full results object
      const fullResults = {
        ...results,
        timestamp: new Date().toISOString(),
        
        // Include sample of trades (max 1000 to keep file size reasonable)
        tradesSample: this.state.trades.slice(0, 1000),
        
        // Include all patterns
        allPatterns: this.state.patterns
      };
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backtest_${this.config.assetSymbol}_${timestamp}.json`;
      const filePath = path.join(this.config.outputDir, filename);
      
      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(fullResults, null, 2), 'utf8');
      
      console.log(`\n✅ Results saved to ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
    }
  }
  
  /**
   * @method stop
   * @description Stop the backtest execution and cleanup resources
   * 
   * Performs graceful shutdown including:
   * - Worker thread termination
   * - Resource cleanup and memory management
   * - Partial results compilation if applicable
   * - Event notification for external monitoring
   * 
   * @fires ComprehensiveBacktester#stop
   */
  stop() {
    if (!this.state.isRunning) return;
    
    console.log(`\n🛑 Stopping backtest...`);
    
    // Update state
    this.state.isRunning = false;
    
    // Stop workers if running
    this.components.workers.forEach(worker => {
      worker.terminate();
    });
    
    // Finalize results if any progress was made
    if (this.state.currentCandle > 0) {
      this.finalizeResults();
    }
    
    // Emit stop event
    this.emit('stop', {
      stoppedAt: this.state.currentCandle,
      totalCandles: this.state.totalCandles,
      elapsed: (Date.now() - this.state.startTime) / 1000
    });
    
    console.log(`Backtest stopped at candle ${this.state.currentCandle}/${this.state.totalCandles}`);
  }
}

module.exports = ComprehensiveBacktester;