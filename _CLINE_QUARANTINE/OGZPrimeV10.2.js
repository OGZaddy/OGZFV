/* 
 ============================================================================
 * DOCUMENTED_OGZPrimeV10.2.js - Advanced Modular Trading Orchestrator
 * ============================================================================
 * 
 * SYSTEM ROLE: Master orchestrator and integration hub for OGZ Prime trading system
 * 
 * ARCHITECTURE PURPOSE:
 * This is the central nervous system that coordinates all trading components:
 * - Market data ingestion and processing
 * - Technical analysis coordination  
 * - Pattern recognition and memory management
 * - Risk management integration
 * - Performance monitoring and optimization
 * - Real-time WebSocket communications
 * - Profile and configuration management
 * 
 * BUSINESS IMPACT:
 * This orchestrator is your path to financial freedom. It integrates cutting-edge
 * trading algorithms with robust risk management to maximize profits while
 * protecting capital. Built for 24/7 operation and designed to scale.
 * 
 * HOUSTON MISSION:
 * Every line of code here brings you closer to moving to Houston with your daughter.
 * This system is engineered for consistency, profitability, and reliability.
 * 
 * SS-TIER ENHANCEMENTS:
 * - RiskManager: Advanced drawdown protection and recovery
 * - PerformanceAnalyzer: AI-powered trade quality scoring and edge decay detection
 * - Multi-timeframe analysis with Fibonacci and Support/Resistance
 * - Advanced pattern memory with rejection tracking
 * - Comprehensive profile management system
 * - TRANSPARENCY LOGGING: Real-time AI thought process for investor demos
 * 
 * @author OGZ Prime Development Team
 * @version 10.2.0
 * @since 2025-06-16
 * ============================================================================
 */

// ========================================================================
// 🚨 CRITICAL SAFETY: SINGLETON PROTECTION SYSTEM
// ========================================================================
const fs = require('fs');
const path = require('path');

// Import singleton protection to prevent multiple instances
const { SingletonLock } = require('./CRITICAL_SAFETY');

// Initialize singleton lock only if NOT SSL server
let singletonLock = null;

// Allow SSL server to bypass singleton lock completely
if (process.env.OGZ_SSL_SERVER === 'true') {
  console.log('🔓 SSL Server mode: Bypassing singleton lock');
} else {
  // Initialize singleton lock for main bot instances
  singletonLock = new SingletonLock('ogz-prime-bot');
  
  if (!global.__ogzPrimeInstance) {
    // Attempt to acquire lock - will exit if another instance is running
    if (!singletonLock.acquireLock()) {
      console.error('🚨 CRITICAL SAFETY: Another OGZ Prime instance is already running!');
      console.error('🚨 Multiple instances could cause conflicting trades and financial losses!');
      console.error('🚨 Terminating this instance for safety...');
      process.exit(1);
    }
    global.__ogzPrimeInstance = true;
  } else {
    console.error('🚨 CRITICAL SAFETY: Another OGZ Prime instance is already running!');
    console.error('🚨 Multiple instances could cause conflicting trades and financial losses!');
    console.error('🚨 Terminating this instance for safety...');
    process.exit(1);
  }
}

console.log('� SINGLETON LOCK ACQUIRED: This is the only OGZ Prime instance running');

// Setup graceful shutdown to release lock
process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  if (singletonLock) {
    singletonLock.releaseLock();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Termination signal received...');
  if (singletonLock) {
    singletonLock.releaseLock();
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  if (singletonLock) {
    singletonLock.releaseLock();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  if (singletonLock) {
    singletonLock.releaseLock();
  }
  process.exit(1);
});

// Core Dependencies - The Foundation of Intelligence

// Trading Engine Components
const indicators = require('./core/OptimizedIndicators');
const { OptimizedTradingBrain } = require('./core/OptimizedTradingBrain');
const { EnhancedPatternChecker, FeatureExtractor, PatternMemorySystem } = require('./core/EnhancedPatternRecognition');
const MaxProfitManager = require('./core/MaxProfitManager');
const WebSocketManager = require('./core/WebsocketManager');
const ConnectionResilience = require('./core/ConnectionResilience');

// Utility Functions
const { logTrade } = require('./utils/tradeLogger');
const { generateDailySummary } = require('./utils/dailySummary');
const { sendDiscordMessage } = require('./utils/discordNotifier');

// SS-Tier Enhanced Components
const RiskManager = require('./core/RiskManager');
const PerformanceAnalyzer = require('./core/PerformanceAnalyzer');

// Optional Advanced Modules
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');

/**
 * OGZ Prime V10.2 - Advanced Cryptocurrency Trading Orchestrator
 * 
 * MASTER CLASS RESPONSIBILITIES:
 * 1. System Initialization and Configuration Management
 * 2. Market Data Processing and Multi-Timeframe Analysis  
 * 3. Trading Decision Coordination and Execution
 * 4. Risk Management and Performance Monitoring
 * 5. WebSocket Communication and GUI Integration
 * 6. Pattern Memory and Learning System Management
 * 7. Profile Management and Strategy Persistence
 * 8. Transparency Logging for Real-time AI Monitoring
 * 
 * INTEGRATION ARCHITECTURE:
 * This class acts as the central hub that coordinates all subsystems.
 * It implements the pub/sub pattern for loose coupling while maintaining
 * tight integration for performance-critical operations.
 */
class OGZPrimeV10 {
  /**
   * Initialize the OGZ Prime trading system
   * 
   * CONSTRUCTOR RESPONSIBILITIES:
   * - Load and validate configuration parameters
   * - Initialize all core trading components
   * - Set up directory structure and file system
   * - Configure WebSocket servers for real-time communication
   * - Initialize pattern memory and learning systems
   * - Set up risk management and performance monitoring
   * 
   * @param {Object} config - Configuration options for the trading system
   */
  constructor(config = {}) {
    // ========================================================================
    // DIAGNOSTIC LOGGING FOR MULTIPLE INSTANCE ISSUE
    // ========================================================================
    const caller = new Error().stack.split('\n')[2].trim();
    console.log(`🔍 INSTANCE DEBUG: OGZPrimeV10 constructor called from: ${caller}`);
    console.log(`🔍 INSTANCE DEBUG: Config ports - GUI: ${config.guiWebSocketPort || 3002}, Data: ${config.dataWebSocketPort || 3001}, Control: ${config.controlWebSocketPort || 3003}`);
    console.log(`🔍 INSTANCE DEBUG: Asset: ${config.assetName || 'BTC-USD'}, Profile: ${config.profileName || 'default'}`);
    
    // ========================================================================
    // CONFIGURATION MANAGEMENT
    // ========================================================================
    
    /**
     * System configuration with intelligent defaults
     * @type {Object}
     */
    this.config = {
      // Core Trading Parameters
      initialBalance: 10000,              // Starting capital
      timeframes: ['1m', '5m', '15m'],    // Multi-timeframe analysis
      primaryTimeframe: '1m',             // Main decision timeframe
      
      // Pattern Recognition Settings
      minPatternMatches: 2,               // Required pattern confirmations (AGGRESSIVE)
      patternSimilarityThreshold: 0.7,    // Pattern matching strictness (AGGRESSIVE)
      minConfidenceThreshold: 0.5,        // Minimum trade confidence (AGGRESSIVE)
      maxPositionSize: 0.25,              // Risk management: max 25% position
      
      // Feature Toggles for Advanced Analysis
      enableMultiTimeframe: true,         // Multi-timeframe correlation
      enableFibonacciLevels: true,        // Fibonacci retracement analysis
      enableSupportResistance: true,      // Support/resistance detection
      enablePatternRejectionTracking: true, // Pattern rejection analytics
      
      // Fibonacci Configuration
      fibLevels: [0.236, 0.382, 0.5, 0.618, 0.786], // Standard Fib levels
      goldenZone: [0.618, 0.65],          // Golden zone range
      maxSwingLookback: 100,              // Bars for swing point detection
      // Support/Resistance Settings
      srLevelStrength: 3,                 // Minimum touches for S/R confirmation
      srProximityPercent: 0.5,            // % distance for "near" S/R level
      
      // WebSocket Communication Ports
      dataWebSocketPort: 3001,            // Market data streaming
      guiWebSocketPort: 3002,             // Dashboard communication (FIXED: matches dashboard)
      controlWebSocketPort: 3003,         // Trading commands
      
      // File System Paths
      logDirectory: path.join(process.cwd(), 'logs'),
      profilesDirectory: path.join(process.cwd(), 'profiles'),
      patternMemoryDirectory: path.join(process.cwd(), 'data', 'patterns'),
      
      // Asset and Profile Management
      assetName: 'BTC-USD',               // Default trading pair
      profileName: 'default',             // Default strategy profile
      version: '10.2.0',                  // System version
      
      // Merge user configuration
      ...config
    };

    console.log(`🎯 OGZ Prime initializing with WebSocket ports:`);
    console.log(`   📊 Data Port: ${this.config.dataWebSocketPort}`);
    console.log(`   🖥️  GUI Port: ${this.config.guiWebSocketPort}`);
    console.log(`   🎮 Control Port: ${this.config.controlWebSocketPort}`);

    // ========================================================================
    // SYSTEM INITIALIZATION
    // ========================================================================
    
    // Ensure required directories exist
    this.ensureDirectories();
    
    // Load trading profile for this asset/strategy combination
    this.loadProfile();
    
    // Enable indicator caching for performance
    indicators.setCache(true);
    
    // Initialize all core components
    this.initializeComponents();
    
    // ========================================================================
    // DATA STRUCTURES
    // ========================================================================
    
    /**
     * Multi-timeframe candle data storage
     * @type {Object<string, Object>}
     */
    this.timeframeData = {};
    
    /**
     * Last analysis result with feature cache
     * @type {Object}
     */
    this.lastAnalysis = { time: 0, features: null };
    
    /**
     * Current Fibonacci retracement levels
     * @type {Object|null}
     */
    this.fibonacciLevels = null;
    
    /**
     * Active support and resistance levels
     * @type {Array<Object>}
     */
    this.supportResistanceLevels = [];
    
    /**
     * Pattern rejection tracking for analysis
     * @type {Array<Object>}
     */
    this.patternRejections = [];
    
    /**
     * System guidance messages for users
     * @type {Array<Object>}
     */
    this.guidanceMessages = [];
    
    // ========================================================================
    // SYSTEM STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Trading system operational state
     * @type {boolean}
     */
    this.isRunning = false;
    
    /**
     * System status and performance metrics
     * @type {Object}
     */
    this.status = {
      startTime: Date.now(),              // System startup timestamp
      lastUpdateTime: Date.now(),         // Last data update
      trades: 0,                          // Total trades executed
      wins: 0,                            // Winning trades count
      losses: 0,                          // Losing trades count
      dailyStats: this.createDailyStats() // Daily performance tracking
    };
    
    // Initialize timeframe data structures
    this.initializeTimeframes();
    
    // Set up WebSocket communication infrastructure
    this.initializeWebSockets();
    
    // ========================================================================
    // SS-TIER MAINTENANCE SYSTEM
    // ========================================================================
    
    /**
     * Periodic system maintenance for optimization
     * @type {NodeJS.Timeout}
     */
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance();
    }, 60 * 60 * 1000); // Every hour
    
    console.log(`[BOT-${Date.now()}] OGZ Prime V${this.config.version} initialized with ${this.config.profileName} profile for ${this.config.assetName}`);
    console.log(`🚀 OGZ Prime V${this.config.version} initialized with ${this.config.profileName} profile for ${this.config.assetName}`);
  }
  
  /**
   * Perform periodic system maintenance and optimization
   * 
   * SS-TIER ENHANCEMENT: Automated system health monitoring
   * 
   * MAINTENANCE TASKS:
   * - Risk manager period resets and limit checks
   * - Performance analyzer recommendation generation
   * - Memory cleanup and optimization
   * - Cache statistics monitoring
   * - Pattern memory defragmentation
   */
  performMaintenance() {
    console.log("🛠️ Running system maintenance...");
    this.logBotThought("Running hourly system maintenance and optimization", 'MAINTENANCE', 0.8);

    // SS-TIER: Risk Manager maintenance
    if (this.riskManager) {
      this.riskManager.checkPeriodResets(new Date(), parseFloat(this.tradingBrain.balance));
    }

    // SS-TIER: Performance analysis and recommendations
    if (this.performanceAnalyzer && this.tradingBrain.tradeHistory.length > 0) {
      const recommendations = this.performanceAnalyzer.generateRecommendations();
      if (recommendations.length > 0) {
        console.log(`📊 System generated ${recommendations.length} recommendations`);
        this.logBotThought(`Generated ${recommendations.length} AI performance recommendations`, 'OPTIMIZATION', 0.9);
      }
    }
  }
  
  /**
   * Ensure all required directories exist for file operations
   * 
   * DIRECTORY STRUCTURE:
   * - logs/: Trade logs, pattern logs, rejection logs
   * - profiles/: Trading strategy profiles
   * - data/patterns/: Pattern memory storage
   * 
   * Creates directories recursively if they don't exist
   */
  ensureDirectories() {
    const directories = [
      this.config.logDirectory,
      this.config.profilesDirectory,
      this.config.patternMemoryDirectory,
      path.join(this.config.logDirectory, 'trades'),
      path.join(this.config.logDirectory, 'patterns'),
      path.join(this.config.logDirectory, 'rejections')
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * Load trading profile from persistent storage
   * 
   * PROFILE MANAGEMENT:
   * Profiles contain strategy-specific settings, risk parameters,
   * and performance history. Enables multiple trading strategies
   * for different market conditions or asset classes.
   */
  loadProfile() {
    const profilePath = path.join(
      this.config.profilesDirectory, 
      `${this.config.assetName}_${this.config.profileName}.json`
    );
    
    // Load existing profile or create default
    if (fs.existsSync(profilePath)) {
      try {
        const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        
        // Check for version mismatch and migrate if needed
        if (profileData.version !== this.config.version) {
          this.migrateProfile(profileData);
        }
        
        // Merge profile settings with current config
        Object.assign(this.config, profileData);
        console.log(`📊 Loaded profile: ${this.config.profileName}`);
      } catch (err) {
        console.error(`❌ Error loading profile: ${err.message}`);
        // Create default profile if loading fails
        this.saveProfile();
      }
    } else {
      // Create default profile for new setup
      this.saveProfile();
      console.log(`📝 Created new profile: ${this.config.profileName}`);
    }
  }
  
  /**
   * Save current trading profile to persistent storage
   * 
   * @returns {boolean} Success status of save operation
   */
  saveProfile() {
    const profilePath = path.join(
      this.config.profilesDirectory, 
      `${this.config.assetName}_${this.config.profileName}.json`
    );
    
    // Extract configuration data for persistence
    const profileData = {
      version: this.config.version,
      assetName: this.config.assetName,
      profileName: this.config.profileName,
      timeframes: this.config.timeframes,
      primaryTimeframe: this.config.primaryTimeframe,
      minPatternMatches: this.config.minPatternMatches,
      patternSimilarityThreshold: this.config.patternSimilarityThreshold,
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      maxPositionSize: this.config.maxPositionSize,
      enableMultiTimeframe: this.config.enableMultiTimeframe,
      enableFibonacciLevels: this.config.enableFibonacciLevels,
      enableSupportResistance: this.config.enableSupportResistance,
      fibLevels: this.config.fibLevels,
      goldenZone: this.config.goldenZone,
      maxSwingLookback: this.config.maxSwingLookback,
      srLevelStrength: this.config.srLevelStrength,
      srProximityPercent: this.config.srProximityPercent,
      lastModified: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`❌ Error saving profile: ${err.message}`);
      return false;
    }
  }
  
  /**
   * Migrate profile from older version to current format
   * 
   * @param {Object} oldProfile - Profile data from previous version
   */
  migrateProfile(oldProfile) {
    console.log(`🔄 Migrating profile from v${oldProfile.version} to v${this.config.version}`);
    
    // Add new fields with defaults if they don't exist
    if (!oldProfile.enableFibonacciLevels) {
      oldProfile.enableFibonacciLevels = true;
    }
    
    if (!oldProfile.enableSupportResistance) {
      oldProfile.enableSupportResistance = true;
    }
    
    // Update version identifier
    oldProfile.version = this.config.version;
    
    // Save migrated profile
    const profilePath = path.join(
      this.config.profilesDirectory, 
      `${this.config.assetName}_${this.config.profileName}.json`
    );
    
    try {
      fs.writeFileSync(profilePath, JSON.stringify(oldProfile, null, 2), 'utf8');
      console.log('✅ Profile migration successful');
    } catch (err) {
      console.error(`❌ Profile migration failed: ${err.message}`);
    }
  }
  
  /**
   * Initialize all core trading system components
   * 
   * COMPONENT ARCHITECTURE:
   * Creates and configures all subsystems with proper dependency injection
   * and cross-references for optimal performance and maintainability.
   */
  initializeComponents() {
    // Initialize pattern memory file path based on asset & profile
    const memoryFilePath = path.join(
      this.config.patternMemoryDirectory,
      `${this.config.assetName}_${this.config.profileName}_memory.json`
    );
    
    // ========================================================================
    // CORE TRADING BRAIN INITIALIZATION
    // ========================================================================
    
    /**
     * Central trading decision engine
     * @type {OptimizedTradingBrain}
     */
    this.tradingBrain = new OptimizedTradingBrain(this.config.initialBalance);
    
    // ========================================================================
    // PATTERN RECOGNITION SYSTEM
    // ========================================================================
    
    /**
     * Advanced pattern recognition with memory
     * @type {EnhancedPatternChecker}
     */
    this.patternChecker = new EnhancedPatternChecker({
      similarityThreshold: this.config.patternSimilarityThreshold,
      minTradeHistory: this.config.minPatternMatches,
      confidenceThreshold: this.config.minConfidenceThreshold,
      memory: {
        memoryFile: memoryFilePath,
        persistToDisk: true,
        maxPatterns: 10000
      }
    });
    
    // Inject OGZ Prime reference for cross-component communication
    this.tradingBrain.ogzPrime = this;
    
    // ========================================================================
    // WEBSOCKET COMMUNICATION MANAGER
    // ========================================================================
    
    /**
     * Singleton WebSocket manager for all real-time communications
     * @type {WebSocketManager}
     */
    this.webSocketManager = WebSocketManager;
    
    // ========================================================================
    // FIBONACCI LEVEL DETECTION (Optional)
    // ========================================================================
    
    if (this.config.enableFibonacciLevels) {
      /**
       * Fibonacci retracement level detector
       * @type {FibonacciDetector}
       */
      this.fibDetector = new FibonacciDetector({
        levels: this.config.fibLevels,
        goldenZone: this.config.goldenZone,
        lookbackCandles: this.config.maxSwingLookback
      });
    }
    
    // ========================================================================
    // SUPPORT/RESISTANCE DETECTION (Optional)
    // ========================================================================
    
    if (this.config.enableSupportResistance) {
      /**
       * Support and resistance level detector
       * @type {SupportResistanceDetector}
       */
      this.srDetector = new SupportResistanceDetector({
        minStrength: this.config.srLevelStrength,
        proximityThresholdPercent: this.config.srProximityPercent
      });
    }
    
    // ========================================================================
    // SS-TIER ENHANCEMENT: RISK MANAGEMENT SYSTEM
    // ========================================================================
    
    /**
     * Advanced risk management with drawdown protection
     * @type {RiskManager}
     */
    this.riskManager = new RiskManager({
      baseRiskPercent: 2.0,               // Base risk per trade
      maxDrawdownPercent: 15,             // Maximum acceptable drawdown
      recoveryThreshold: 10,              // Recovery mode threshold
      dailyLossLimitPercent: 5.0,         // Daily loss limit
      volatilityScaling: true             // Dynamic risk adjustment
    });
   
    
    // ========================================================================
    // SS-TIER ENHANCEMENT: PERFORMANCE ANALYTICS
    // ========================================================================
    
    /**
     * AI-powered performance analysis and optimization
     * @type {PerformanceAnalyzer}
     */
    this.performanceAnalyzer = new PerformanceAnalyzer({
      minTradesForAnalysis: 20,           // Minimum trades for insights
      edgeDecayLookback: 50,              // Edge decay detection period
      tradesDbPath: path.join(this.config.logDirectory, 'trades', `${this.config.assetName}_analysis.json`)
    });
    
    // ========================================================================
    // CONNECTION RESILIENCE SYSTEM INTEGRATION
    // ========================================================================
    
    /**
     * Advanced connection resilience with exponential backoff
     * @type {ConnectionResilience}
     */
    this.connectionResilience = new ConnectionResilience(this);
    console.log('🛡️ Connection Resilience System: ACTIVATED');
  }
  
  /**
   * Create daily statistics tracking object
   * 
   * @returns {Object} Daily statistics tracker
   */
  createDailyStats() {
    return {
      date: new Date().toISOString().split('T')[0],
      trades: 0,                          // Total trades today
      wins: 0,                            // Winning trades
      losses: 0,                          // Losing trades
      breakeven: 0,                       // Breakeven trades
      totalPnL: 0,                        // Total profit/loss
      largestWin: 0,                      // Biggest winning trade
      largestLoss: 0,                     // Biggest losing trade
      avgHoldTime: 0,                     // Average position hold time
      totalHoldTime: 0,                   // Cumulative hold time
      patternHits: 0,                     // Successful pattern matches
      patternRejections: 0                // Rejected patterns count
    };
  }
  
  /**
   * Initialize multi-timeframe data storage structures
   */
  initializeTimeframes() {
    for (const tf of this.config.timeframes) {
      this.timeframeData[tf] = {
        candles: [],                      // OHLCV candle data
        lastUpdate: 0,                    // Last update timestamp
        interval: this.getIntervalMs(tf)  // Milliseconds per candle
      };
    }
  }
  
  /**
   * Convert timeframe string to milliseconds for interval calculations
   * 
   * @param {string} timeframe - Timeframe string (e.g., "1m", "5m", "1h")
   * @returns {number} Milliseconds for the timeframe interval
   */
  getIntervalMs(timeframe) {
    const match = timeframe.match(/(\d+)([mhd])/);
    if (!match) return 60000; // Default to 1 minute
    
    const [, value, unit] = match;
    const milliseconds = parseInt(value) * (
      unit === 'h' ? 3600000 : // hours to milliseconds
      unit === 'd' ? 86400000 : // days to milliseconds
      60000 // minutes to milliseconds (default)
    );
    
    return milliseconds;
  }
  
  initializeWebSockets() {
    console.log('🔌 Initializing WebSocket servers with cascade protection...');
    
    // Initialize each server with error isolation
    const servers = [
      { name: 'Data', port: this.config.dataWebSocketPort, var: 'dataServer' },
      { name: 'GUI', port: this.config.guiWebSocketPort, var: 'guiServer' },
      { name: 'Control', port: this.config.controlWebSocketPort, var: 'controlServer' }
    ];
    
    for (const server of servers) {
      try {
        console.log(`🔧 Initializing ${server.name} WebSocket on port ${server.port}...`);
        
        this[server.var] = this.webSocketManager.getServer(server.port, {
          perMessageDeflate: false,  // Disable compression for stability
          maxPayload: 16 * 1024 * 1024,
          clientTracking: true,
          skipUTF8Validation: false
        });
        
        if (this[server.var]) {
          console.log(`✅ ${server.name} WebSocket server ready on port ${server.port}`);
          
          // Add connection handler without crashing on errors
          this[server.var].on('connection', (ws) => {
            console.log(`📡 ${server.name} client connected`);
            
            // Wrap all handlers in try-catch
            ws.on('error', (error) => {
              console.error(`⚠️ ${server.name} client error:`, error.message);
              // Don't propagate - just log
            });
            
            ws.on('message', (message) => {
              try {
                if (server.name === 'Control') {
                  const command = JSON.parse(message);
                  this.handleControlCommand(command);
                }
              } catch (err) {
                console.error(`❌ Error processing ${server.name} message:`, err.message);
              }
            });
          });
        } else {
          console.warn(`⚠️ ${server.name} WebSocket server could not be created on port ${server.port}`);
        }
        
      } catch (err) {
        console.error(`❌ Failed to initialize ${server.name} WebSocket:`, err.message);
        // Continue with other servers - don't crash
      }
    }
    
    console.log('💓 WebSocket initialization complete (with cascade protection)');
  }
  
  /**
   * TRANSPARENCY LOGGING: Log bot thoughts for real-time monitoring
   * 
   * This method writes the bot's current thoughts to a JSON file that
   * can be read by the transparency dashboard for real-time AI monitoring.
   * Perfect for investor demos and system monitoring.
   * 
   * @param {string} thought - What the bot is thinking
   * @param {string} decision - Current decision (BUY/SELL/HOLD/ANALYZING)
   * @param {number} confidence - Confidence level (0-1)
   */
  logBotThought(thought, decision = 'ANALYZING', confidence = 0.5) {
    const data = {
      timestamp: new Date().toLocaleString(),
      thought: thought,
      decision: decision,
      confidence: Math.round(confidence * 100),
      balance: this.tradingBrain?.balance || this.config.initialBalance,
      price: this.getCurrentPrice() || 0
    };
    
    try {
      fs.writeFileSync('bot_status.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing bot status:', error);
    }
  }

  /**
   * Get current market price from latest candle data
   * 
   * @returns {number} Current market price
   */
  getCurrentPrice() {
    const candles = this.timeframeData[this.config.primaryTimeframe]?.candles;
    return candles && candles.length > 0 ? candles[candles.length - 1].close : 0;
  }
  
  /**
   * Handle control commands received from GUI clients
   * 
   * @param {Object} command - Command object from GUI
   */
  handleControlCommand(command) {
    console.log(`🎮 Received command: ${command.action}`);
    this.logBotThought(`Received ${command.action} command from GUI`, 'COMMAND', 0.8);
    
    switch (command.action) {
      case 'buy':
        this.executeManualBuy();
        break;
        
      case 'sell':
        this.executeManualSell();
        break;
        
      case 'kill':
        this.shutdown();
        break;
        
      case 'update_indicators':
        this.broadcastStatus();
        break;
        
      case 'change_profile':
        if (command.profileName) {
          this.changeProfile(command.profileName);
        }
        break;
        
      case 'change_asset':
        if (command.assetName) {
          this.changeAsset(command.assetName);
        }
        break;
        
      default:
        console.log(`❓ Unknown command: ${command.action}`);
    }
  }
  
  /**
   * Execute manual buy order from GUI
   */
  executeManualBuy() {
    if (this.tradingBrain.isInPosition()) {
      console.log('⚠️ Already in position, cannot buy');
      this.logBotThought('Cannot execute manual BUY - already in position', 'ERROR', 0.1);
      return;
    }
    
    const candles = this.timeframeData[this.config.primaryTimeframe].candles;
    if (!candles || candles.length === 0) {
      console.log('⚠️ No price data available');
      this.logBotThought('Cannot execute manual BUY - no price data available', 'ERROR', 0.1);
      return;
    }
    
    const price = candles[candles.length - 1].close;
    const size = this.tradingBrain.calculatePositionSize(price, 1.0);
    
    const success = this.tradingBrain.openPosition(
      price, 
      'buy', 
      size, 
      1.0, 
      'Manual buy command'
    );
    
    if (success) {
      this.logBotThought(`Manual BUY executed at $${price.toFixed(2)} - Position size: ${size.toFixed(4)}`, 'BUY', 1.0);
      
      this.broadcastTradeUpdate({
        action: 'buy',
        price: price,
        size: size,
        balance: this.tradingBrain.balance,
        entryTime: new Date()
      });
      
      // Log the manual trade
      logTrade({
        type: 'ENTRY',
        direction: 'BUY',
        price: price,
        size: size,
        balance: this.tradingBrain.balance,
        reason: 'Manual buy command',
        confidence: 1.0,
        assetName: this.config.assetName,
        profileName: this.config.profileName
      });
      
      // Send Discord notification if configured
      sendDiscordMessage(`🟢 Manual BUY executed at $${price.toFixed(2)}`);
    }
  }
  
  /**
   * Execute manual sell order from GUI
   */
 
  executeManualSell() {
    if (!this.tradingBrain.isInPosition()) {
      console.log('⚠️ Not in position, cannot sell');
      this.logBotThought('Cannot execute manual SELL - not in position', 'ERROR', 0.1);
      return;
    }
    
    const candles = this.timeframeData[this.config.primaryTimeframe].candles;
    if (!candles || candles.length === 0) {
      console.log('⚠️ No price data available');
      this.logBotThought('Cannot execute manual SELL - no price data available', 'ERROR', 0.1);
      return;
    }
    
    const price = candles[candles.length - 1].close;
    const tradeResult = this.tradingBrain.closePosition(price, 'Manual sell command');
    
    if (tradeResult) {
      this.logBotThought(`Manual SELL executed at $${price.toFixed(2)} - PnL: $${tradeResult.pnl.toFixed(2)}`, 'SELL', 1.0);
      
      this.broadcastTradeUpdate({
        action: 'sell',
        price: price,
        pnl: tradeResult.pnl,
        balance: this.tradingBrain.balance,
        entryTime: tradeResult.entryTime,
        exitTime: new Date()
      });
      
      // Log the manual exit
      logTrade({
        type: 'EXIT',
        direction: 'SELL',
        price: price,
        pnl: tradeResult.pnl,
        balance: this.tradingBrain.balance,
        reason: 'Manual sell command',
        entryPrice: tradeResult.entryPrice,
        holdTimeMs: new Date() - tradeResult.entryTime,
        assetName: this.config.assetName,
        profileName: this.config.profileName
      });
      
      // Send Discord notification if configured
      sendDiscordMessage(
        `🔴 Manual SELL executed at ${price.toFixed(2)} | PnL: ${tradeResult.pnl.toFixed(2)}`
      );
      
      // Update daily statistics
      this.updateDailyStats(tradeResult.pnl);
      
      // SS-TIER ENHANCEMENT: Process trade with RiskManager
      if (this.riskManager) {
        this.riskManager.processTrade(tradeResult, this.tradingBrain.balance);
      }
      
      // SS-TIER ENHANCEMENT: Process trade with PerformanceAnalyzer
      if (this.performanceAnalyzer) {
        const analysisData = this.lastAnalysis?.result || {};
        this.performanceAnalyzer.processTrade(tradeResult, analysisData);
      }
    }
  }
  
  /**
   * Change active trading profile
   * 
   * @param {string} profileName - New profile name to load
   */
  changeProfile(profileName) {
    if (this.tradingBrain.isInPosition()) {
      console.log('⚠️ Cannot change profile while in position');
      this.logBotThought(`Cannot change to profile ${profileName} - currently in position`, 'ERROR', 0.2);
      return;
    }
    
    // Save current profile state
    this.saveProfile();
    
    // Update profile name and load new configuration
    this.config.profileName = profileName;
    this.loadProfile();
    
    // Reinitialize components with new profile settings
    this.initializeComponents();
    
    console.log(`🔄 Changed to profile: ${profileName}`);
    this.logBotThought(`Successfully changed to trading profile: ${profileName}`, 'PROFILE_CHANGE', 0.9);
    this.broadcastStatus();
    
    // Send Discord notification if configured
    sendDiscordMessage(`🔄 Switched to profile: ${profileName} for ${this.config.assetName}`);
  }
  
  /**
   * Change traded asset
   * 
   * @param {string} assetName - New asset name to trade
   */
  changeAsset(assetName) {
    if (this.tradingBrain.isInPosition()) {
      console.log('⚠️ Cannot change asset while in position');
      this.logBotThought(`Cannot change to asset ${assetName} - currently in position`, 'ERROR', 0.2);
      return;
    }
    
    // Save current profile
    this.saveProfile();
    
    // Update asset name
    this.config.assetName = assetName;
    
    // Load profile for new asset
    this.loadProfile();
    
    // Reinitialize components for new asset
    this.initializeComponents();
    
    // Clear existing timeframe data
    this.initializeTimeframes();
    
    console.log(`🔄 Changed to asset: ${assetName}`);
    this.logBotThought(`Successfully changed to trading asset: ${assetName}`, 'ASSET_CHANGE', 0.9);
    this.broadcastStatus();
    
    // Send Discord notification if configured
    sendDiscordMessage(`🔄 Switched to asset: ${assetName} with ${this.config.profileName} profile`);
  }
  
  /**
   * Start the trading system
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Reset daily stats if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (this.status.dailyStats.date !== today) {
      this.status.dailyStats = this.createDailyStats();
    }
    
    console.log(`🟢 OGZ Prime V${this.config.version} started`);
    this.logBotThought(`OGZ Prime V${this.config.version} started with ${this.config.profileName} profile for ${this.config.assetName}`, 'STARTING', 0.9);
    
    sendDiscordMessage(`🟢 OGZ Prime started with ${this.config.profileName} profile for ${this.config.assetName}`);
    
    // Connect to live Polygon.io data
    console.log('🔗 Starting live data feed...');
    this.connectToLiveData();
  }
  
  connectToLiveData() {
    const PolygonWebSocket = require('./core/PolygonWebSocket');
    
    console.log('🔗 Connecting to live Polygon.io Bitcoin data...');
    this.logBotThought('Connecting to live Polygon.io market data feed', 'CONNECTING', 0.8);
    
    try {
      // Create Polygon socket with error isolation
      this.polygonSocket = new PolygonWebSocket((tick) => {
        try {
          // Update connection state
          if (this.connectionResilience) {
            this.connectionResilience.updateDataTimestamp();
          }
          
          // Process tick safely
          this.processTick(tick);
        } catch (error) {
          console.error('❌ Error processing tick:', error.message);
          // Don't crash - just skip this tick
        }
      });
      
      // Setup Polygon event handlers
      this.polygonSocket.on('connected', () => {
        console.log('✅ Polygon data feed connected');
        this.logBotThought('Successfully connected to Polygon.io data feed', 'CONNECTED', 0.9);
      });
      
      this.polygonSocket.on('disconnected', ({ code, reason }) => {
        console.log(`⚠️ Polygon disconnected - Code: ${code}, Reason: ${reason}`);
        this.logBotThought('Polygon data feed disconnected - will auto-reconnect', 'DISCONNECTED', 0.3);
        // Don't panic - PolygonWebSocket handles its own reconnection
      });
      
      this.polygonSocket.on('error', (error) => {
        console.error('❌ Polygon error:', error.message);
        // Don't crash - just log
      });
      
      // Connect to Polygon
      this.polygonSocket.connect().catch(error => {
        console.error('❌ Failed to connect to Polygon:', error.message);
        // Don't crash - system can still function
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Polygon connection:', error.message);
      this.logBotThought('Failed to initialize Polygon connection - bot can still function', 'ERROR', 0.2);
      // Don't crash - bot can still work with manual trades
    }
  }
  
  /**
   * Simulate market data for testing (DISABLED - using live data)
   */
  simulateMarketData() {
    let price = 30000; // Starting price
    let trend = 0;     // No trend initially
    let volatility = 0.01;
    let tickCount = 0;
    
    console.log('🎲 Starting market simulation...');
    this.logBotThought('Starting market simulation with realistic price movements', 'SIMULATION', 0.8);
    
    this.simulationInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      tickCount++;
      
      // Occasionally change trend direction and volatility
      if (Math.random() < 0.005) trend = Math.random() * 2 - 1;
      if (Math.random() < 0.01) volatility = 0.005 + Math.random() * 0.03;
      
      // Calculate price components
      const trendComponent = trend * 0.001 * price;
      const randomComponent = (Math.random() * 2 - 1) * volatility * price;
      
      // Update price
      price += trendComponent + randomComponent;
      price = Math.max(price, 100); // Prevent negative prices
      
      // Debug every 10 ticks
      if (tickCount % 10 === 0) {
        console.log(`🎲 Sim tick #${tickCount}: ${price.toFixed(2)}`);
        this.logBotThought(`Simulation tick #${tickCount}: Market price at $${price.toFixed(2)}`, 'SIMULATION', 0.5);
      }
      
      // Process the simulated tick
      this.processTick({
        timestamp: Date.now(),
        price,
        volume: Math.random() * 10 + 1
      });
    }, 1000); // 1 second tick interval
  }
  
  /**
   * Process a market data tick
   * 
   * @param {Object} tick - Market tick data
   */
  /**
 * Process a market data tick (now supports XA candles)
 * @param {Object} tick - Market tick data
 */
processTick(tick) {
  try {
    // Validate tick data
    if (!tick || (!tick.price && !tick.close)) {
      console.warn('⚠️ Invalid tick data received');
      return;
    }
    
    // Extract price safely
    const price = parseFloat(tick.price || tick.close || 0);
    const timestamp = tick.timestamp || Date.now();
    
    if (isNaN(price) || price <= 0) {
      console.error('❌ Invalid price in tick:', price);
      return;
    }
    
    // Update connection resilience timestamp
    if (this.connectionResilience) {
      this.connectionResilience.updateDataTimestamp();
    }
    
    // Log transparency thought
    this.logBotThought(`Processing market tick: $${price.toLocaleString()}`, 'ANALYZING', 0.6);
    
    // Update timeframes
    for (const tf of Object.keys(this.timeframeData)) {
      this.updateTimeframeCandle(tf, price, timestamp);
    }
    
    // Broadcast to GUI (with error protection)
    try {
      this.broadcastTick({
        timestamp,
        price,
        trailingStop: this.tradingBrain.isInPosition()
          ? this.tradingBrain.maxProfitManager?.getState()?.currentStop
          : null
      });
    } catch (error) {
      console.error('❌ Error broadcasting tick:', error.message);
    }
    
    // Run analysis if needed
    const now = Date.now();
    if (now - this.lastAnalysis.time >= 2000) {
      this.runAnalysis();
    }
    
    // Manage position if in trade
    if (this.tradingBrain.isInPosition()) {
      try {
        this.tradingBrain.managePosition(price);
      } catch (error) {
        console.error('❌ Error managing position:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Critical error in processTick:', error.message);
    // Don't crash - just skip this tick
  }
}

  
  /**
   * Update candle for specific timeframe
   * 
   * @param {string} tf - Timeframe identifier
   * @param {number} price - Current price
   * @param {number} timestamp - Current timestamp
   */
  updateTimeframeCandle(tf, price, timestamp) {
    const tfData = this.timeframeData[tf];
    const interval = tfData.interval;
    
    // Calculate start time of the current candle
    const startTime = Math.floor(timestamp / interval) * interval;
    
    // Create new candle or update existing one
    if (!tfData.candles.length || startTime > tfData.lastUpdate) {
      // Add new candle
      tfData.candles.push({
        timestamp: startTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1
      });
      
      tfData.lastUpdate = startTime;
      
      // Limit number of candles stored to prevent memory issues
      if (tfData.candles.length > 1000) {
        tfData.candles = tfData.candles.slice(-500);
      }
      
      // When a new candle forms on the primary timeframe, update S/R and Fibonacci levels
      if (tf === this.config.primaryTimeframe) {
        if (this.config.enableSupportResistance && this.srDetector) {
          this.supportResistanceLevels = this.srDetector.update(tfData.candles);
        }
        
        if (this.config.enableFibonacciLevels && this.fibDetector) {
          this.fibonacciLevels = this.fibDetector.update(tfData.candles);
        }
      }
    } else {
      // Update existing candle
      const candle = tfData.candles[tfData.candles.length - 1];
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
      candle.volume += 1;
    }
  }
  
  /**
   * Run trading analysis with all enabled features
   */
  runAnalysis() {
    console.log("🧠 Running market analysis...");
    this.logBotThought('Starting comprehensive AI market analysis with all indicators', 'ANALYZING', 0.7);
    this.lastAnalysis.time = Date.now();
    
    // Get candles for primary timeframe
    const candles = this.timeframeData[this.config.primaryTimeframe].candles;
    if (!candles || candles.length < 3) {
      console.log(`⚠️ Not enough candles to analyze (${candles?.length || 0}) - need at least 3`);
      this.logBotThought(`Insufficient data for analysis - only ${candles?.length || 0} candles available`, 'WAITING', 0.3);
      return;
    }
    
    console.log(`🧠 STARTING FULL AI ANALYSIS with ${candles.length} candles!`);
    
    // Update trading brain with current candles
    this.tradingBrain.setCandles(candles);
    
    // Calculate key technical indicators
    const rsi = indicators.calculateRSI(candles);
    const macdResult = indicators.calculateMACD(candles);
    const trend = indicators.determineTrend(candles);
    const volatility = indicators.calculateVolatility(candles);
    
    // Extract multi-timeframe features if enabled
    let features;
    if (this.config.enableMultiTimeframe && Object.keys(this.timeframeData).length > 1) {
      features = this.extractMultiTimeframeFeatures(rsi, macdResult, trend);
    } else {
      features = FeatureExtractor.extract({
        candles,
        trend,
        macd: macdResult.macdLine,
        signal: macdResult.signalLine,
        rsi,
        lastTrade: this.tradingBrain.isInPosition()
          ? { direction: this.tradingBrain.position.direction }
          : null,
        useOptimizedIndicators: true
      });
    }
    
    // Evaluate pattern using pattern memory
    const patternEvaluation = this.patternChecker.evaluatePattern(features);
    console.log("🧠 Pattern Eval:", patternEvaluation);
    if (patternEvaluation.confidence > 0) {
      console.log(`🔍 Pattern Confidence: ${patternEvaluation.confidence.toFixed(2)} | Direction: ${patternEvaluation.direction.toUpperCase()} | Match Reason: ${patternEvaluation.reason}`);
    }

    // Default decision is to hold
    let decision = 'hold';
    let confidence = 0;
    let reason = '';
    
    // Check if pattern evaluation has sufficient confidence
    if (patternEvaluation.confidence >= this.config.minConfidenceThreshold) {
      decision = patternEvaluation.direction;
      confidence = patternEvaluation.confidence;
      reason = patternEvaluation.reason;
    } else {
      // AGGRESSIVE: More sensitive technical indicators for active trading
      if (rsi < 40 && macdResult.macdLine > macdResult.signalLine) {
        decision = 'buy';
        confidence = 0.4 + (40 - rsi) / 80;
        reason = `AGGRESSIVE: RSI oversold (${rsi.toFixed(1)}) with positive MACD`;
      } else if (rsi > 60 && macdResult.macdLine < macdResult.signalLine) {
        decision = 'sell';
        confidence = 0.4 + (rsi - 60) / 80;
        reason = `AGGRESSIVE: RSI overbought (${rsi.toFixed(1)}) with negative MACD`;
      } else if (rsi < 45 && trend === 'uptrend') {
        decision = 'buy';
        confidence = 0.35;
        reason = `AGGRESSIVE: RSI dip (${rsi.toFixed(1)}) in uptrend`;
      } else if (rsi > 55 && trend === 'downtrend') {
        decision = 'sell';
        confidence = 0.35;
        reason = `AGGRESSIVE: RSI bounce (${rsi.toFixed(1)}) in downtrend`;
      } else if (macdResult.macdLine > macdResult.signalLine && trend !== 'downtrend') {
        decision = 'buy';
        confidence = 0.32;
        reason = `AGGRESSIVE: MACD bullish crossover`;
      } else if (macdResult.macdLine < macdResult.signalLine && trend !== 'uptrend') {
        decision = 'sell';
        confidence = 0.32;
        reason = `AGGRESSIVE: MACD bearish crossover`;
      } else {
        reason = 'No clear signals';
      }
    }
    
    // Adjust decisions based on Fibonacci and S/R proximity if enabled
    if (decision !== 'hold') {
      if (this.config.enableFibonacciLevels && this.fibonacciLevels) {
        this.adjustDecisionWithFibonacci(candles[candles.length - 1].close, decision, confidence);
      }
      
      if (this.config.enableSupportResistance && this.supportResistanceLevels && this.supportResistanceLevels.length > 0) {
        this.adjustDecisionWithSupportResistance(candles[candles.length - 1].close, decision, confidence);
      }
    }
    
    // Boost confidence for clarity in display (scale of 3)
    const displayConfidence = confidence * 3;
    
    // Create final analysis object
    const analysis = {
      decision,
      confidence,
      trend,
      rsi,
      macd: macdResult.macdLine,
      signal: macdResult.signalLine,
      features,
      patternEvaluation,
      price: candles[candles.length - 1].close,
      timestamp: Date.now(),
      reason,
      fibLevels: this.fibonacciLevels,
      srLevels: this.supportResistanceLevels,
      volatility
    };
    
    // Log the AI decision for transparency
    this.logBotThought(reason, decision.toUpperCase(), confidence);
    
    // If decision is to hold but confidence is above 0.5, log as pattern rejection
    if (decision === 'hold' && confidence > 0.5 && this.config.enablePatternRejectionTracking) {
      this.logPatternRejection(analysis);
    }
    
    // Store analysis result
    this.lastAnalysis = {
      time: Date.now(),
      features,
      result: analysis
    };
    
    // Broadcast analysis to GUI clients
    this.broadcastAnalysis(analysis);
    
    // Process analysis for trading decisions
    this.tradingBrain.processAnalysis(analysis, analysis.price);
  }
  
  /**
   * Extract features from multiple timeframes
   * 
   * @param {number} rsi - RSI value
   * @param {Object} macdResult - MACD calculation result
   * @param {string} trend - Trend direction
   * @returns {Array} Combined feature vector
   */
  extractMultiTimeframeFeatures(rsi, macdResult, trend) {
    // Get candles for each timeframe
    const candles1m = this.timeframeData['1m']?.candles;
    const candles5m = this.timeframeData['5m']?.candles;
    const candles15m = this.timeframeData['15m']?.candles;
    
    // Check that we have enough data in all timeframes
    if (!candles1m || !candles5m || !candles15m) {
      // Fallback to primary timeframe if multi-timeframe not available
      return FeatureExtractor.extract({
        candles: candles1m || this.timeframeData[this.config.primaryTimeframe].candles,
        trend,
        macd: macdResult.macdLine,
        signal: macdResult.signalLine,
        rsi,
        lastTrade: this.tradingBrain.isInPosition()
          ? { direction: this.tradingBrain.position.direction }
          : null,
        useOptimizedIndicators: true
      });
    }
    
    // Use multi-timeframe feature extraction
    return FeatureExtractor.extractMultiTimeframe({
      candles1m,
      candles5m, 
      candles15m,
      trend,
      macd: macdResult.macdLine,
      signal: macdResult.signalLine,
      rsi,
      lastTrade: this.tradingBrain.isInPosition()
        ? { direction: this.tradingBrain.position.direction }
        : null
    });
  }
  
  /**
   * Log rejected patterns for analysis
   * 
   * @param {Object} analysis - Analysis result that was rejected
   */
  logPatternRejection(analysis) {
    // Create rejection record
    const rejection = {
      timestamp: Date.now(),
      features: analysis.features,
      confidence: analysis.confidence,
      price: analysis.price,
      rsi: analysis.rsi,
      macd: analysis.macd,
      signal: analysis.signal,
      trend: analysis.trend,
      reason: 'Confidence below threshold'
    };
    
    // Store rejection for tracking
    this.patternRejections.push(rejection);
    if (this.patternRejections.length > 100) {
      this.patternRejections.shift(); // Keep only last 100
    }
    
    // Log rejection to file
    const rejectionsPath = path.join(
      this.config.logDirectory,
      'rejections',
      `${this.config.assetName}_${new Date().toISOString().split('T')[0]}.json`
    );
    
    try {
      let rejections = [];
      if (fs.existsSync(rejectionsPath)) {
        rejections = JSON.parse(fs.readFileSync(rejectionsPath, 'utf8'));
      }
      
      rejections.push(rejection);
      fs.writeFileSync(rejectionsPath, JSON.stringify(rejections, null, 2), 'utf8');
      
      // Update daily stats
      this.status.dailyStats.patternRejections++;
    } catch (err) {
      console.error(`❌ Error logging rejection: ${err.message}`);
    }
  }
  
  /**
   * Update daily statistics with trade result
   * 
   * @param {number} pnl - Profit and loss from trade
   */
  updateDailyStats(pnl) {
    const stats = this.status.dailyStats;
    
    stats.trades++;
    stats.totalPnL += pnl;
    
    if (pnl > 0) {
      stats.wins++;
      stats.largestWin = Math.max(stats.largestWin, pnl);
    } else if (pnl < 0) {
      stats.losses++;
      stats.largestLoss = Math.min(stats.largestLoss, pnl);
    } else {
      stats.breakeven++;
    }
    
    // Generate and send daily summary if needed
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Send daily summary at end of day (after market close)
    if (hours === 23 && minutes >= 55) {
      this.sendDailySummary();
    }
  }
  
  /**
   * Generate and send daily summary
   */
  sendDailySummary() {
    const summary = generateDailySummary(this.status.dailyStats, this.tradingBrain.balance);
    
    // Send to Discord if configured
    sendDiscordMessage(summary);
    
    // Log to console
    console.log(summary);
    
    // Reset for next day
    this.status.dailyStats = this.createDailyStats();
  }
  
  /**
   * Broadcast market tick to GUI clients
   * 
   * @param {Object} data - Tick data to broadcast
   */
  broadcastTick(data) {
    // Add technical indicators to tick if analysis exists
    if (this.lastAnalysis.result) {
      data.trend = this.lastAnalysis.result.trend;
      data.rsi = this.lastAnalysis.result.rsi;
      data.macd = this.lastAnalysis.result.macd;
      data.signal = this.lastAnalysis.result.signal;
      data.confidence = this.lastAnalysis.result.confidence;
    }
    
    // Add current position info
    if (this.tradingBrain.isInPosition()) {
      data.positionDirection = this.tradingBrain.position.direction;
      data.positionEntryPrice = this.tradingBrain.position.entryPrice;
      data.pnl = this.tradingBrain.calculatePnL(data.price);
    }
    
    data.type = 'candle';
    
    // Send to all connected GUI clients
    const success = this.webSocketManager.broadcast(this.config.guiWebSocketPort, data);
    
    if (!success) {
      console.warn(`⚠️ No GUI clients connected on port ${this.config.guiWebSocketPort}`);
    } else {
      console.log(`📡 Broadcasted tick to GUI on port ${this.config.guiWebSocketPort}`);
    }
    
    return success;
  }
  
  /**
   * Broadcast trade update to GUI clients
   * 
   * @param {Object} data - Trade data to broadcast
   */
  broadcastTradeUpdate(data) {
    data.type = 'trade';
    data.balance = this.tradingBrain.balance;
    
    // Send to all connected GUI clients
    this.webSocketManager.broadcast(this.config.guiWebSocketPort, data);
  }
  
  /**
   * Broadcast analysis result to GUI clients
   * 
   * @param {Object} analysis - Analysis result
   */
  broadcastAnalysis(analysis) {
    const data = {
      type: 'analysis',
      timestamp: analysis.timestamp,
      price: analysis.price,
      trend: analysis.trend,
      rsi: analysis.rsi,
      macd: analysis.macd,
      signal: analysis.signal,
      confidence: analysis.confidence,
      decision: analysis.decision,
      reason: analysis.reason,
      balance: this.tradingBrain.balance
    };
    
    // Add Fibonacci levels if available
    if (this.fibonacciLevels) {
      data.fibLevels = this.fibonacciLevels;
    }
    
    // Add support/resistance levels if available
    if (this.supportResistanceLevels && this.supportResistanceLevels.length > 0) {
      data.srLevels = this.supportResistanceLevels;
    }
    
    // Add risk status if available
    if (this.riskManager) {
      data.risk = this.riskManager.getRiskSummary();
    }
    
    // Send to all connected GUI clients
    this.webSocketManager.broadcast(this.config.guiWebSocketPort, data);
  }
  
  /**
   * Broadcast system status to GUI clients
   */
  broadcastStatus() {
    const data = {
      type: 'status',
      status: {
        version: this.config.version,
        running: this.isRunning,
        assetName: this.config.assetName,
        profileName: this.config.profileName,
        uptime: Date.now() - this.status.startTime,
        balance: this.tradingBrain.balance,
        startBalance: this.config.initialBalance,
        trades: this.status.dailyStats.trades,
        wins: this.status.dailyStats.wins,
        losses: this.status.dailyStats.losses,
        pnl: this.status.dailyStats.totalPnL,
        winRate: this.status.dailyStats.trades > 0 
          ? this.status.dailyStats.wins / this.status.dailyStats.trades * 100 
          : 0,
        inPosition: this.tradingBrain.isInPosition(),
        position: this.tradingBrain.position
      }
    };
    
    // Add memory stats if available
    if (this.patternChecker) {
      data.status.memoryStats = this.patternChecker.getMemoryStats();
    }
    
    // Add risk status if available
    if (this.riskManager) {
      data.status.risk = this.riskManager.getRiskSummary();
    }
    
    // Add performance metrics if available
    if (this.performanceAnalyzer) {
      data.status.performance = this.performanceAnalyzer.getPerformanceSummary();
    }
    
    // Add last update timestamp
    data.status.lastUpdate = Date.now();
    
    // Send to all connected GUI clients
    this.webSocketManager.broadcast(this.config.guiWebSocketPort, data);
  }
  
  /**
   * Get System Status - For Control Server
   *
   * CONTROL INTERFACE: Provides system status for control server and external monitoring
   *
   * @returns {Object} - System status summary
   */
  getStatus() {
    return {
      version: this.config.version,
      running: this.isRunning,
      assetName: this.config.assetName,
      profileName: this.config.profileName,
      uptime: Date.now() - this.status.startTime,
      balance: this.tradingBrain.balance,
      startBalance: this.config.initialBalance,
      trades: this.status.dailyStats.trades,
      wins: this.status.dailyStats.wins,
      losses: this.status.dailyStats.losses,
      pnl: this.status.dailyStats.totalPnL,
      winRate: this.status.dailyStats.trades > 0
        ? this.status.dailyStats.wins / this.status.dailyStats.trades * 100
        : 0,
      inPosition: this.tradingBrain.isInPosition(),
      position: this.tradingBrain.position,
      lastUpdate: Date.now()
    };
  }
  
  shutdown() {
    console.log('⚠️ Initiating graceful shutdown...');
    this.logBotThought('System shutdown initiated - closing all connections safely', 'SHUTDOWN', 0.9);
    
    // Set shutdown flag
    this.isShuttingDown = true;
    this.isRunning = false;
    
    // 1. Disconnect data feeds first (with error protection)
    try {
      if (this.polygonSocket) {
        this.polygonSocket.disconnect();
        this.polygonSocket = null;
      }
    } catch (error) {
      console.error('⚠️ Error disconnecting Polygon:', error.message);
    }
    
    // 2. Stop connection monitoring
    try {
      if (this.connectionResilience) {
        this.connectionResilience.cleanup();
      }
    } catch (error) {
      console.error('⚠️ Error cleaning up connection resilience:', error.message);
    }
    
    // 3. Close any open positions
    try {
      if (this.tradingBrain && this.tradingBrain.isInPosition()) {
        const candles = this.timeframeData[this.config.primaryTimeframe]?.candles;
        if (candles && candles.length > 0) {
          const price = candles[candles.length - 1].close;
          this.tradingBrain.closePosition(price, 'System shutdown');
        }
      }
    } catch (error) {
      console.error('⚠️ Error closing position:', error.message);
    }
    
    // 4. Save state
    try {
      this.saveProfile();
    } catch (error) {
      console.error('⚠️ Error saving profile:', error.message);
    }
    
    // 5. Clean up pattern checker
    try {
      if (this.patternChecker) {
        this.patternChecker.cleanup();
      }
    } catch (error) {
      console.error('⚠️ Error cleaning up pattern checker:', error.message);
    }
    
    // 6. Clear intervals
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    // 7. Close WebSocket servers gracefully
    console.log('🔌 Closing WebSocket servers...');
    const ports = [
      this.config.dataWebSocketPort,
      this.config.guiWebSocketPort,
      this.config.controlWebSocketPort
    ];
    
    for (const port of ports) {
      try {
        this.webSocketManager.closeServer(port);
      } catch (error) {
        console.error(`⚠️ Error closing server on port ${port}:`, error.message);
      }
    }
    
    // 8. Release singleton lock
    try {
      if (this.singletonLock) {
        this.singletonLock.releaseLock();
        console.log('🔓 Singleton lock released');
      }
    } catch (error) {
      console.error('⚠️ Error releasing singleton lock:', error.message);
    }
    
    // 9. Final notifications
    console.log('💤 OGZ Prime shutdown complete');
    this.logBotThought('OGZ Prime successfully shutdown - all systems safe', 'SHUTDOWN', 1.0);
    
    // Exit after giving time for cleanup
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }
}
// ========================================================================
// MAIN EXECUTION - START THE BOT
// ========================================================================

// Export only - no auto-execution
// Use run-trading-bot-v10.2.js to start the system

module.exports = OGZPrimeV10;