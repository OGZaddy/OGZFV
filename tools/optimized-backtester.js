// optimized-backtester.js - Optimized for high-performance systems
// OGZ Prime backtesting infrastructure

// Core dependencies
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Resolve paths correctly regardless of working directory
const rootDir = path.resolve(__dirname, '..');
const corePath = path.join(rootDir, 'core');
const dataPath = path.join(rootDir, 'data');

// OGZ Prime components with absolute paths
const TimeframeManager = require(path.join(corePath, 'TimeframeManager'));
const RiskManager = require(path.join(corePath, 'RiskManager'));
const PatternMonitor = require(path.join(corePath, 'EnhancedPatternRecognition'));
// Force initialize pattern_performance if not available
if (!PatternMonitor.pattern_performance) {
  PatternMonitor.pattern_performance = {};
}
const WebSocketManager = require(path.join(corePath, 'WebsocketManager'));
const MobileMonitor = require(path.join(corePath, 'MobileMonitor'));
const { HistoricalDataServer, trainOnHistoricalData } = require(path.join(__dirname, 'historical-data-loader'));

// Initialize PatternMonitor if it doesn't exist or doesn't have the required properties
if (!PatternMonitor || typeof PatternMonitor !== 'object') {
  console.log("Creating PatternMonitor object since it wasn't properly initialized");
  // Create a simple stub implementation
  global.PatternMonitor = {
    pattern_performance: {},
    trackPatternResult: function(patternId, entryTime, exitTime, pnl, confidence) {
      if (!this.pattern_performance[patternId]) {
        this.pattern_performance[patternId] = { trades: [] };
      }
      
      this.pattern_performance[patternId].trades.push({
        entryTime,
        exitTime,
        pnl,
        confidence
      });
      
      return true;
    },
    // Add basic pattern detection
    detectPattern: function(candles, timeframe) {
      if (!candles || candles.length < 3) return null;
      
      console.log(`Analyzing ${candles.length} candles on ${timeframe} timeframe`);
      
      // Simple bullish pattern: 3 consecutive up candles
      if (candles[candles.length-1].close > candles[candles.length-2].close && 
          candles[candles.length-2].close > candles[candles.length-3].close) {
        
        console.log("✅ DETECTED: Three consecutive bullish candles");
        return {
          id: `bullish_uptrend_${Date.now()}`,
          name: "Bullish Uptrend",
          confidence: 0.75,
          direction: "buy"
        };
      }
      
      // Simple bearish pattern: 3 consecutive down candles
      if (candles[candles.length-1].close < candles[candles.length-2].close && 
          candles[candles.length-2].close < candles[candles.length-3].close) {
        
        console.log("✅ DETECTED: Three consecutive bearish candles");
        return {
          id: `bearish_downtrend_${Date.now()}`,
          name: "Bearish Downtrend",
          confidence: 0.75,
          direction: "sell"
        };
      }
      
      // Bullish engulfing pattern
      if (candles[candles.length-1].close > candles[candles.length-1].open && // Current is bullish
          candles[candles.length-2].close < candles[candles.length-2].open && // Previous is bearish
          candles[candles.length-1].open < candles[candles.length-2].close && // Current opens below previous close
          candles[candles.length-1].close > candles[candles.length-2].open) { // Current closes above previous open
        
        console.log("✅ DETECTED: Bullish engulfing pattern");
        return {
          id: `bullish_engulfing_${Date.now()}`,
          name: "Bullish Engulfing",
          confidence: 0.8,
          direction: "buy"
        };
      }
      
      // Bearish engulfing pattern
      if (candles[candles.length-1].close < candles[candles.length-1].open && // Current is bearish
          candles[candles.length-2].close > candles[candles.length-2].open && // Previous is bullish
          candles[candles.length-1].open > candles[candles.length-2].close && // Current opens above previous close
          candles[candles.length-1].close < candles[candles.length-2].open) { // Current closes below previous open
        
        console.log("✅ DETECTED: Bearish engulfing pattern");
        return {
          id: `bearish_engulfing_${Date.now()}`,
          name: "Bearish Engulfing",
          confidence: 0.8,
          direction: "sell"
        };
      }
      
      return null; // No pattern detected
    }
  };
} else if (!PatternMonitor.pattern_performance) {
  console.log("Initializing PatternMonitor.pattern_performance");
  PatternMonitor.pattern_performance = {};
}

// Add detectPattern method if it doesn't exist
if (PatternMonitor && !PatternMonitor.detectPattern) {
  console.log("Adding detectPattern method to PatternMonitor");
  PatternMonitor.detectPattern = function(candles, timeframe) {
    if (!candles || candles.length < 3) return null;
    
    console.log(`Analyzing ${candles.length} candles on ${timeframe} timeframe`);
    
    // Simple bullish pattern: 3 consecutive up candles
    if (candles[candles.length-1].close > candles[candles.length-2].close && 
        candles[candles.length-2].close > candles[candles.length-3].close) {
      
      console.log("✅ DETECTED: Three consecutive bullish candles");
      return {
        id: `bullish_uptrend_${Date.now()}`,
        name: "Bullish Uptrend",
        confidence: 0.75,
        direction: "buy"
      };
    }
    
    // Simple bearish pattern: 3 consecutive down candles
    if (candles[candles.length-1].close < candles[candles.length-2].close && 
        candles[candles.length-2].close < candles[candles.length-3].close) {
      
      console.log("✅ DETECTED: Three consecutive bearish candles");
      return {
        id: `bearish_downtrend_${Date.now()}`,
        name: "Bearish Downtrend",
        confidence: 0.75,
        direction: "sell"
      };
    }
    
    // Bullish engulfing pattern
    if (candles[candles.length-1].close > candles[candles.length-1].open && // Current is bullish
        candles[candles.length-2].close < candles[candles.length-2].open && // Previous is bearish
        candles[candles.length-1].open < candles[candles.length-2].close && // Current opens below previous close
        candles[candles.length-1].close > candles[candles.length-2].open) { // Current closes above previous open
      
      console.log("✅ DETECTED: Bullish engulfing pattern");
      return {
        id: `bullish_engulfing_${Date.now()}`,
        name: "Bullish Engulfing",
        confidence: 0.8,
        direction: "buy"
      };
    }
    
    // Bearish engulfing pattern
    if (candles[candles.length-1].close < candles[candles.length-1].open && // Current is bearish
        candles[candles.length-2].close > candles[candles.length-2].open && // Previous is bullish
        candles[candles.length-1].open > candles[candles.length-2].close && // Current opens above previous close
        candles[candles.length-1].close < candles[candles.length-2].open) { // Current closes below previous open
      
      console.log("✅ DETECTED: Bearish engulfing pattern");
      return {
        id: `bearish_engulfing_${Date.now()}`,
        name: "Bearish Engulfing",
        confidence: 0.8,
        direction: "sell"
      };
    }
    
    return null; // No pattern detected
  };
}

// Create data server
const dataServer = new HistoricalDataServer(3022);  // FIXED: Changed from 3001 to avoid conflict

// Configuration
const config = {
  // Data settings
  dataFile: path.join(dataPath, "polygon-btc-1y.json"),
  websocketPort: 3022,              // FIXED: Updated to match new data server port
  speedMultiplier: 10,
  
  // Trading settings
  baseTimeframe: '1m',
  additionalTimeframes: ['5m', '15m', '1h', '4h', '1d'],
  initialBalance: 10000,
  
  // Risk settings
  baseRiskPercent: 1.5,
  maxDrawdownPercent: 20,
  
  // System optimization settings
  useParallelProcessing: true,
  numThreads: os.cpus().length, // Use all available cores (16 threads)
  batchSize: 5000, // Process data in batches for better performance
  maxMemoryUsage: Math.floor(os.totalmem() * 0.7 / 1024 / 1024), // Use up to 70% of available RAM (MB)
  useGPUAcceleration: false, // Set to true if you install TensorFlow.js with GPU support
  
  // Mobile monitoring settings
  enableMobileMonitor: true,
  mobilePort: 4000,
  
  // Flags
  verbose: true,
  saveResults: true,
  
  // Output file for results
  resultsFile: path.join(__dirname, 'backtest_results.json')
};

// Global state
const state = {
  isRunning: false,
  startTime: Date.now(),
  endTime: null,
  currentBalance: config.initialBalance,
  currentCandle: 0,
  totalCandles: 0,
  trades: [],
  patterns: {},
  performance: {
    drawdown: {
      current: 0,
      max: 0
    },
    returns: {
      absolute: 0,
      percent: 0
    },
    trades: {
      total: 0,
      wins: 0,
      losses: 0
    }
  }
};

/**
 * Initialize system components
 * @returns {Object} Initialized components
 */
function initializeComponents() {
  console.log(`🚀 Initializing OGZ Prime backtester on ${os.hostname()}`);
  console.log(`System: ${os.cpus()[0].model} with ${config.numThreads} threads, ${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB RAM`);
  
  // Create timeframe manager
  const timeframeManager = new TimeframeManager(config.baseTimeframe);
  
  // Add additional timeframes
  config.additionalTimeframes.forEach(tf => {
    timeframeManager.addTimeframe(tf);
  });
  
  // Create risk manager
  const riskManager = new RiskManager({
    baseRiskPercent: config.baseRiskPercent,
    maxDrawdownPercent: config.maxDrawdownPercent,
    verboseLogging: config.verbose
  });
  
  // Initialize risk manager with starting balance
  riskManager.initialize(config.initialBalance);
  
  // Build OGZ Prime stub for monitoring
  const ogzPrime = {
    isRunning: true,
    config: {
      initialBalance: config.initialBalance,
      primaryTimeframe: config.baseTimeframe,
      profileName: 'Backtest',
      assetName: 'BTC/USDT',
      guiWebSocketPort: config.websocketPort
    },
    tradingBrain: {
      balance: config.initialBalance,
      position: null,
      tradeHistory: [],
      isInPosition: () => false
    },
    riskManager: riskManager,
    timeframeData: {},
    webSocketManager: WebSocketManager,
    status: {
      startTime: Date.now()
    }
  };
  
  // Create mobile monitor if enabled
  let mobileMonitor = null;
  if (config.enableMobileMonitor) {
    mobileMonitor = new MobileMonitor(ogzPrime, {
      port: config.mobilePort,
      enableSecurity: false
    });
  }
  
  return {
    dataServer,
    timeframeManager,
    riskManager,
    ogzPrime,
    mobileMonitor
  };
}

/**
 * Start data server and feed
 */
function startDataServer() {
  // Load data file
  const dataLoaded = dataServer.loadDataFromFile(config.dataFile);
  if (!dataLoaded) {
    console.error(`❌ Failed to load data file: ${config.dataFile}`);
    return false;
  }
  
  // Start data server
  dataServer.startServer();
  
  // Start data feed
  dataServer.startDataFeed(config.speedMultiplier);
  
  console.log(`🚀 Data server started with ${config.speedMultiplier}x speed`);
  return true;
}

/**
 * Setup event handlers for backtesting
 * @param {Object} components - Initialized components
 */
function setupEventHandlers(components) {
  const { dataServer, timeframeManager, riskManager, ogzPrime } = components;
  
  // Monitor progress
  dataServer.onProgress((progress) => {
    // Update state
    state.currentCandle = progress.current;
    state.totalCandles = progress.total;
    
    // Report progress periodically
    if (progress.current % 1000 === 0 || progress.current === progress.total - 1) {
      const elapsedSeconds = (Date.now() - state.startTime) / 1000;
      const candlesPerSecond = Math.round(progress.current / elapsedSeconds);
      
      console.log(`\nProcessing: ${progress.percent}% complete (${progress.current}/${progress.total} candles)`);
      console.log(`Speed: ${candlesPerSecond} candles/sec | Time elapsed: ${elapsedSeconds.toFixed(1)}s`);
      
      // Show pattern stats periodically
      const patternMonitor = global.PatternMonitor || PatternMonitor || {};
      const patternPerformance = patternMonitor.pattern_performance || {};
      if (Object.keys(patternPerformance).length > 0) {
        console.log(`Patterns detected: ${Object.keys(patternPerformance).length}`);
      }
      
      // Show trade stats if available
      if (state.performance.trades.total > 0) {
        const winRate = state.performance.trades.wins / state.performance.trades.total * 100;
        console.log(`Trades: ${state.performance.trades.total} | Win rate: ${winRate.toFixed(1)}% | P&L: $${state.performance.returns.absolute.toFixed(2)}`);
      }
    }
    
    // Update mobile monitor every 30 seconds if enabled
    if (components.mobileMonitor && progress.current % 30 === 0) {
      ogzPrime.tradingBrain.balance = state.currentBalance;
      components.mobileMonitor.updateDataCache();
    }
  });
  
  // Handle completion
  dataServer.onComplete((results) => {
    state.endTime = Date.now();
    state.isRunning = false;
    
    displayFinalResults(results);
  });
  
  // Wire WebSocket for candle processing
  WebSocketManager.getServer(config.websocketPort).on('connection', (client) => {
    client.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'candle') {
          // Process the candle
          processCandle(data.data, components);
        }
      } catch (error) {
        console.error(`Error processing message: ${error.message}`);
      }
    });
  });
}

/**
 * Process a single candle through the trading system
 * @param {Object} candle - Candle data
 * @param {Object} components - System components
 */
function processCandle(candle, components) {
  const { timeframeManager, riskManager, ogzPrime } = components;
  
  // Process through timeframe manager
  timeframeManager.processCandle(candle);
  
  // Update OGZ Prime stub with latest data
  const tf = config.baseTimeframe;
  ogzPrime.timeframeData = {};
  ogzPrime.timeframeData[tf] = {
    candles: timeframeManager.getCandles(tf, 100)
  };
  
  // Get higher timeframe data
  config.additionalTimeframes.forEach(higherTf => {
    ogzPrime.timeframeData[higherTf] = {
      candles: timeframeManager.getCandles(higherTf, 100)
    };
  });
  
  // Every few candles, check for trade opportunities
  if (state.currentCandle % 10 === 0) {
    simulateTrade(candle, components);
  }
  
  // Check period resets (daily/weekly/monthly)
  riskManager.checkPeriodResets(new Date(candle.timestamp), state.currentBalance);
}

/**
 * Simulate a trade based on candle data
 * @param {Object} candle - Current candle
 * @param {Object} components - System components
 */
function simulateTrade(candle, components) {
  const { timeframeManager, riskManager, ogzPrime } = components;
  
  // Check if we can trade
  const tradeStatus = riskManager.canTrade();
  if (!tradeStatus.allowed) {
    return;
  }
  
  // Get candles for pattern analysis
  const tf = config.baseTimeframe;
  const candles = timeframeManager.getCandles(tf, 100);
  
  // Check for pattern using the PatternMonitor instead of random signal
  const patternDetector = global.PatternMonitor || PatternMonitor;
  const patternResult = patternDetector.detectPattern(candles, tf);
  
  // If pattern detected, process trade
  if (patternResult && patternResult.confidence > 0.6) {
    // Pattern detected, use its signal
    const signal = patternResult.direction;
    const confidence = patternResult.confidence;
    const patternId = patternResult.id;
    
    console.log(`🔍 PATTERN DETECTED: ${patternResult.name} with ${confidence.toFixed(2)} confidence`);
    
    // Get market conditions
    const marketConditions = {
      volatility: 0.01 + (Math.random() * 0.02), // Random 1-3%
      trend: patternResult.direction === 'buy' ? 'uptrend' : 'downtrend',
      isCounterTrend: Math.random() > 0.7
    };
    
    // Calculate position size
    const positionSize = riskManager.calculatePositionSize(
      state.currentBalance,
      candle.close,
      confidence,
      marketConditions
    );
    
    // Execute trade if position size allowed
    if (positionSize.allowed) {
      executeTrade(signal, candle, positionSize, components, patternId, patternResult.name);
    }
  } else {
    // No pattern detected, occasionally log this
    if (state.currentCandle % 100 === 0) {
      console.log(`No patterns detected at candle ${state.currentCandle}`);
    }
  }
}

/**
 * Execute a simulated trade
 * @param {string} signal - Trade signal (buy/sell)
 * @param {Object} candle - Current candle
 * @param {Object} positionSize - Position sizing info
 * @param {Object} components - System components
 * @param {string} patternId - Pattern identifier
 * @param {string} patternName - Pattern name
 */
function executeTrade(signal, candle, positionSize, components, patternId, patternName) {
  const { riskManager, ogzPrime } = components;
  
  // Use the provided pattern ID instead of generating a random one
  if (!patternId) {
    patternId = `unknown_pattern_${Date.now()}`;
  }
  
  // Entry price
  const entryPrice = candle.close;
  const entryTime = candle.timestamp;
  const size = positionSize.size;
  
  // Simulate holding for 5-15 candles
  const holdCandles = Math.floor(5 + (Math.random() * 10));
  const exitTime = entryTime + (holdCandles * 60 * 1000); // Add minutes
  
  // Simulate exit price with some slippage and random movement
  const priceMove = entryPrice * (0.005 + (Math.random() * 0.02)) * (Math.random() > 0.5 ? 1 : -1);
  const exitPrice = entryPrice + (signal === 'buy' ? priceMove : -priceMove);
  
  // Calculate PnL
  const direction = signal;
  const pnl = direction === 'buy' 
    ? (exitPrice - entryPrice) * size
    : (entryPrice - exitPrice) * size;
  
  // Create trade object
  const trade = {
    patternId,
    patternName,
    entryTime,
    exitTime,
    entryPrice,
    exitPrice,
    size,
    direction,
    pnl,
    confidence: positionSize.adjustments.confidenceFactor,
    exitReason: pnl > 0 ? 'profit_target' : 'stop_loss'
  };
  
  // Update account balance
  state.currentBalance += pnl;
  
  // Update trade statistics
  state.trades.push(trade);
  state.performance.trades.total++;
  if (pnl > 0) {
    state.performance.trades.wins++;
  } else {
    state.performance.trades.losses++;
  }
  
  // Update returns
  state.performance.returns.absolute = state.currentBalance - config.initialBalance;
  state.performance.returns.percent = (state.currentBalance / config.initialBalance - 1) * 100;
  
  // Process trade in risk manager
  riskManager.processTrade(trade, state.currentBalance);
  
  // Update current drawdown
  state.performance.drawdown.current = riskManager.state.currentDrawdown;
  state.performance.drawdown.max = Math.max(
    state.performance.drawdown.max,
    riskManager.state.currentDrawdown
  );
  
  // Track pattern result with safety checks
  if (PatternMonitor && typeof PatternMonitor.trackPatternResult === 'function') {
    PatternMonitor.trackPatternResult(
      patternId,
      entryTime,
      exitTime,
      pnl,
      positionSize.adjustments.confidenceFactor
    );
  } else {
    // Create pattern tracking manually if the function doesn't exist
    if (!state.patterns[patternId]) {
      state.patterns[patternId] = { 
        trades: [],
        name: patternName || patternId.split('_')[0]
      };
    }
    state.patterns[patternId].trades.push({
      entryTime,
      exitTime,
      pnl,
      confidence: positionSize.adjustments.confidenceFactor
    });
  }
  
  // Add to trade history in OGZ Prime stub
  ogzPrime.tradingBrain.tradeHistory.push(trade);
  ogzPrime.tradingBrain.balance = state.currentBalance;
  
  // Log trade result with emoji based on profitability
  const emoji = pnl > 0 ? '💰' : '📉';
  console.log(`${emoji} ${direction.toUpperCase()} using pattern ${patternName || patternId} | P&L: ${pnl.toFixed(2)} | Balance: ${state.currentBalance.toFixed(2)}`);
  
  // Notify mobile monitor of new trade
  if (components.mobileMonitor) {
    components.mobileMonitor.handleNewTrade(trade);
  }
}

/**
 * Display final backtest results
 * @param {Object} results - Backtest completion data
 */
function displayFinalResults(results) {
  const duration = (state.endTime - state.startTime) / 1000;
  const candlesPerSecond = Math.round(state.totalCandles / duration);
  
  console.log('\n====== BACKTEST COMPLETE ======');
  console.log(`Duration: ${duration.toFixed(1)} seconds | Processing speed: ${candlesPerSecond} candles/sec`);
  console.log(`Total candles: ${state.totalCandles}`);
  console.log(`\nAccount Performance:`);
  console.log(`Initial Balance: $${config.initialBalance.toFixed(2)}`);
  console.log(`Final Balance: $${state.currentBalance.toFixed(2)}`);
  console.log(`Profit/Loss: $${state.performance.returns.absolute.toFixed(2)} (${state.performance.returns.percent.toFixed(2)}%)`);
  console.log(`Max Drawdown: ${state.performance.drawdown.max.toFixed(2)}%`);
  
  console.log(`\nTrade Statistics:`);
  console.log(`Total Trades: ${state.performance.trades.total}`);
  
  if (state.performance.trades.total > 0) {
    const winRate = state.performance.trades.wins / state.performance.trades.total * 100;
    console.log(`Win Rate: ${winRate.toFixed(2)}%`);
    console.log(`Win/Loss Ratio: ${state.performance.trades.wins}/${state.performance.trades.losses}`);
  }
  
  // Display pattern analysis results
  displayPatternResults();
  
  // Save results if enabled
  if (config.saveResults) {
    saveResults();
  }
}

/**
 * Display pattern detection results
 */
function displayPatternResults() {
  console.log("\n==== PATTERN DETECTION RESULTS ====");
  
  // Make sure PatternMonitor and pattern_performance exist
  const patternMonitor = global.PatternMonitor || PatternMonitor || {};
  const patternPerformance = patternMonitor.pattern_performance || {};
  
  // If pattern_performance is empty but state.patterns isn't, use state.patterns
  let patterns = Object.keys(patternPerformance).length > 0 ? 
                 patternPerformance : 
                 state.patterns;
  
  const patternCount = Object.keys(patterns).length;
  console.log(`Total patterns detected: ${patternCount}`);

  // Display the top performing patterns if any were detected
  if (patternCount > 0) {
    console.log("\nTop performing patterns:");
    
    // Convert to array and sort by performance
    try {
      const sortedPatterns = Object.entries(patterns)
        .map(([patternId, data]) => {
          const trades = data.trades || [];
          const winCount = trades.filter(t => t.pnl > 0).length;
          const winRate = trades.length > 0 ? (winCount / trades.length) : 0;
          const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          
          return {
            patternId,
            name: data.name || patternId.split('_')[0],
            trades: trades.length,
            winRate,
            totalPnl
          };
        })
        .sort((a, b) => b.totalPnl - a.totalPnl)
        .slice(0, 5); // Top 5 patterns
      
      sortedPatterns.forEach(p => {
        console.log(`  ${p.name}: ${p.trades} trades, ${(p.winRate * 100).toFixed(1)}% win rate, $${p.totalPnl.toFixed(2)} total P&L`);
      });
      
      // Analyze patterns for decay or ghosting
      const ghostPatterns = Object.entries(patterns)
        .filter(([_, data]) => {
          const trades = data.trades || [];
          if (trades.length < 20) return false;
          
          // Calculate win rate in first and second half
          const midpoint = Math.floor(trades.length / 2);
          const firstHalf = trades.slice(0, midpoint);
          const secondHalf = trades.slice(midpoint);
          
          const firstHalfWinRate = firstHalf.filter(t => t.pnl > 0).length / firstHalf.length;
          const secondHalfWinRate = secondHalf.filter(t => t.pnl > 0).length / secondHalf.length;
          
          // Check for significant decay
          return secondHalfWinRate < firstHalfWinRate * 0.7; // More than 30% decay
        })
        .map(([patternId, data]) => ({
          id: patternId,
          name: data.name || patternId.split('_')[0]
        }));
      
      if (ghostPatterns.length > 0) {
        console.log("\nPotential ghost patterns (significant performance decay):");
        ghostPatterns.forEach(p => {
          console.log(`  ${p.name}`);
        });
      }
    } catch (error) {
      console.error(`Error analyzing patterns: ${error.message}`);
    }
  } else {
    console.log("No patterns were detected during this backtest run.");
    console.log("This is normal during initial testing with a small dataset.");
  }
}

/**
 * Save backtest results to a file
 */
function saveResults() {
  try {
    // Create results object with safeguards for undefined values
    const results = {
      config,
      performance: state.performance || {},
      trades: (state.trades || []).slice(0, 1000), // Limit to prevent huge files
      patterns: (PatternMonitor && PatternMonitor.pattern_performance) ? 
                PatternMonitor.pattern_performance : state.patterns,
      timestamp: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(
      config.resultsFile,
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log(`✅ Results saved to ${config.resultsFile}`);
  } catch (error) {
    console.error(`❌ Failed to save results: ${error.message}`);
  }
}

/**
 * Run backtest in parallel using worker threads
 * Leverages all available CPU cores for maximum performance
 */
function runParallelBacktest() {
  // Only available if parallel processing is enabled
  if (!config.useParallelProcessing) {
    console.log("Parallel processing disabled. Using single-threaded mode.");
    return startBacktest();
  }
  
  console.log(`Starting parallel backtest with ${config.numThreads} threads...`);
  
  // Load data
  try {
    const candles = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
    state.totalCandles = candles.length;
    
    // Calculate chunk size for each worker
    const chunkSize = Math.ceil(candles.length / config.numThreads);
    
    // Create and start workers
    const workers = [];
    const results = [];
    
    // Path to worker file - ensure consistency in filename
    const workerPath = path.join(__dirname, 'backtester-worker.js');
    
    for (let i = 0; i < config.numThreads; i++) {
      const startIdx = i * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, candles.length);
      const chunk = candles.slice(startIdx, endIdx);
      
      console.log(`Thread ${i+1}: Processing candles ${startIdx} to ${endIdx-1}`);
      
      const worker = new Worker(workerPath, {
        workerData: {
          id: i,
          config: config,
          candles: chunk,
          initialBalance: config.initialBalance / config.numThreads // Split initial balance
        }
      });
      
      // Handle messages from worker
      worker.on('message', (message) => {
        if (message.type === 'progress') {
          // Update progress
          state.currentCandle += message.progress;
          
          // Report overall progress
          if (state.currentCandle % 1000 === 0) {
            const progress = (state.currentCandle / state.totalCandles * 100).toFixed(1);
            const elapsed = (Date.now() - state.startTime) / 1000;
            const speed = Math.round(state.currentCandle / elapsed);
            console.log(`Progress: ${progress}% | Speed: ${speed} candles/sec`);
          }
        } else if (message.type === 'result') {
          // Store results
          results.push(message.data);
        }
      });
      
      // Handle worker completion
      worker.on('exit', () => {
        console.log(`Thread ${i+1} complete`);
        
        // Check if all workers are done
        if (results.length === config.numThreads) {
          // Combine results
          combineResults(results);
        }
      });
      
      workers.push(worker);
    }
  } catch (error) {
    console.error(`Failed to start parallel backtest: ${error.message}`);
  }
}

/**
 * Combine results from parallel workers
 * @param {Array} workerResults - Results from each worker
 */
function combineResults(workerResults) {
  console.log("Combining results from all threads...");
  
  // Reset state
  state.endTime = Date.now();
  state.currentBalance = config.initialBalance;
  state.trades = [];
  state.patterns = {};
  
  // Combine trades and balances
  workerResults.forEach(result => {
    // Add profit/loss to balance
    state.currentBalance += result.balanceChange;
    
    // Merge trades
    state.trades = state.trades.concat(result.trades);
    
    // Merge patterns
    Object.entries(result.patterns).forEach(([patternId, patternData]) => {
      if (!state.patterns[patternId]) {
        state.patterns[patternId] = patternData;
      } else {
        // Merge trades for this pattern
        state.patterns[patternId].trades = state.patterns[patternId].trades.concat(patternData.trades);
      }
    });
  });
  
  // Update performance metrics
  state.performance.returns.absolute = state.currentBalance - config.initialBalance;
  state.performance.returns.percent = (state.currentBalance / config.initialBalance - 1) * 100;
  state.performance.trades.total = state.trades.length;
  state.performance.trades.wins = state.trades.filter(t => t.pnl > 0).length;
  state.performance.trades.losses = state.trades.filter(t => t.pnl <= 0).length;
  
  // Sort trades by timestamp
  state.trades.sort((a, b) => a.entryTime - b.entryTime);
  
  // Calculate max drawdown
  let peak = config.initialBalance;
  let maxDrawdown = 0;
  
  state.trades.reduce((currentBalance, trade) => {
    const newBalance = currentBalance + trade.pnl;
    if (newBalance > peak) {
      peak = newBalance;
    } else {
      const drawdown = (peak - newBalance) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    return newBalance;
  }, config.initialBalance);
  
  state.performance.drawdown.max = maxDrawdown;
  
  // Display final results
  displayFinalResults({
    elapsed: state.endTime - state.startTime
  });
}

/**
 * Start the backtest in single-threaded mode
 */
function startBacktest() {
  // Initialize state
  state.isRunning = true;
  state.startTime = Date.now();
  state.currentBalance = config.initialBalance;
  state.trades = [];
  
  // Initialize components
  const components = initializeComponents();
  
  // Setup event handlers
  setupEventHandlers(components);
  
  // Start mobile monitor if enabled
  if (components.mobileMonitor) {
    components.mobileMonitor.start();
  }
  
  // Start data server and feed
  startDataServer();
  
  console.log(`🚀 Backtest started in single-threaded mode`);
  return true;
}

/**
 * Run basic testing without WebSocket server
 */
function runBatchBacktest() {
  console.log(`Starting batch backtest mode...`);
  
  try {
    // Load candles from file
    const candles = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
    
    // Run training
    const results = trainOnHistoricalData(candles);
    
    // Display pattern analysis
    displayPatternResults();
    
    console.log(`✅ Batch backtest complete.`);
    return results;
  } catch (error) {
    console.error(`❌ Batch backtest failed: ${error.message}`);
    return null;
  }
}

// Check command line arguments for mode
const args = process.argv.slice(2);

if (args.includes('--batch')) {
  // Run in batch mode
  runBatchBacktest();
} else if (args.includes('--parallel') && config.useParallelProcessing) {
  // Run in parallel mode
  runParallelBacktest();
} else {
  // Start interactive backtest
  startBacktest();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log("\nGracefully shutting down...");
  if (dataServer) {
    dataServer.stopDataFeed();
  }
  
  // Display results if any processing was done
  if (state.currentCandle > 0) {
    displayFinalResults({
      elapsed: (Date.now() - state.startTime)
    });
  }
  
  process.exit(0);
});

module.exports = {
  startBacktest,
  runBatchBacktest,
  runParallelBacktest,
  config,
  state
};