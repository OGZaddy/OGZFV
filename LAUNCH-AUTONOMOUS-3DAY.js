#!/usr/bin/env node

// ===================================================================
// OGZ AUTONOMOUS 3-DAY LAUNCHER - THE MONEY MAKER! 🚀💰
// ===================================================================
// THIS LAUNCHES YOUR BOT IN SEMI-AGGRESSIVE PATTERN LEARNING MODE
// SET IT AND FORGET IT FOR 3 DAYS OF AUTONOMOUS TRADING!

const OGZAutonomousTrader = require('./OGZ-AutonomousTrader-3Day');
const fs = require('fs').promises;
const path = require('path');

// ASCII Art Money Maker Header
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🚀 OGZ AUTONOMOUS TRADER 🚀                   ║
║                     💎 3-DAY MONEY MAKER 💎                      ║
║                                                                  ║
║              SEMI-AGGRESSIVE • PATTERN LEARNING                  ║
║              AUTONOMOUS OPERATION • RISK MANAGED                 ║
╚══════════════════════════════════════════════════════════════════╝

🎯 MISSION: Generate profits while you're away
⏰ DURATION: 3 days maximum autonomous operation
💰 MODE: Semi-aggressive (a notch above scalper)
🧠 LEARNING: Pattern memory and adaptive optimization
🛡️ PROTECTED: Advanced risk management with circuit breakers

`);

// Configuration for semi-aggressive 3-day operation
const AUTONOMOUS_CONFIG = {
  // Trading pair
  symbol: 'BTC-USD',
  
  // Starting capital (adjust as needed)
  initialBalance: 10000,
  
  // Semi-aggressive settings (higher than conservative, lower than full aggro)
  baseRisk: 0.015,        // 1.5% risk per trade
  maxRisk: 0.035,         // 3.5% maximum risk
  maxDrawdown: 0.18,      // 18% max drawdown
  
  // Trading frequency (semi-aggressive)
  minTradeGap: 180000,    // 3 minutes between trades
  maxDailyTrades: 25,     // Up to 25 trades per day
  confidenceThreshold: 0.65, // 65% confidence minimum
  
  // Autonomous operation
  operationMode: 'SEMI_AGGRESSIVE',
  maxOperationDays: 3,
  
  // Pattern learning
  enablePatternLearning: true,
  patternMemoryDays: 30,
  learningRateMultiplier: 1.2,
  
  // Extended trading hours for crypto
  tradingHours: {
    start: 0,  // 24/7 crypto markets
    end: 24,
    timezone: 'UTC'
  }
};

class AutonomousLauncher {
  constructor() {
    this.trader = null;
    this.isRunning = false;
    this.startTime = null;
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }
  
  /**
   * Launch the autonomous trading system
   */
  async launch() {
    try {
      console.log('🔧 Initializing OGZ Autonomous Trading System...\n');
      
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Create and initialize trader
      this.trader = new OGZAutonomousTrader(AUTONOMOUS_CONFIG);
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('🔌 Initializing core systems...');
      await this.trader.initialize();
      
      console.log('\n✅ All systems initialized successfully!');
      console.log('🎯 Ready to launch autonomous trading operation\n');
      
      // Confirm launch
      await this.confirmLaunch();
      
      // Start autonomous trading
      this.startTime = Date.now();
      this.isRunning = true;
      
      console.log('🚀 LAUNCHING AUTONOMOUS TRADING OPERATION!');
      console.log('💎 Semi-aggressive mode with pattern learning enabled');
      console.log('⏰ Will run for maximum 3 days');
      console.log('📊 Live monitoring and learning active\n');
      
      await this.trader.startAutonomousTrading();
      
      // Start monitoring loop
      this.startMonitoring();
      
    } catch (error) {
      console.error('❌ Launch failed:', error);
      process.exit(1);
    }
  }
  
  /**
   * Check system prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking system prerequisites...');
    
    // Check required files exist
    const requiredFiles = [
      './core/MarketRegimeDetector.js',
      './core/AdaptiveRiskManagementSystem.js',
      './core/MultiDirectionalTrader.js',
      './core/EnhancedPatternRecognition.js',
      './core/PolygonWebSocket.js'
    ];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        console.log(`✅ ${file}`);
      } catch (error) {
        console.error(`❌ Missing required file: ${file}`);
        throw new Error(`Missing required file: ${file}`);
      }
    }
    
    // Check environment variables
    if (!process.env.POLYGON_API_KEY) {
      console.warn('⚠️ POLYGON_API_KEY not set - using demo mode');
    }
    
    // Check node version
    const nodeVersion = process.version;
    console.log(`📦 Node.js version: ${nodeVersion}`);
    
    // Create logs directory if it doesn't exist
    try {
      await fs.mkdir('./logs', { recursive: true });
      await fs.mkdir('./logs/autonomous', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    console.log('✅ Prerequisites check complete\n');
  }
  
  /**
   * Setup event listeners for the trader
   */
  setupEventListeners() {
    // Autonomous trading events
    this.trader.on('autonomousStart', (data) => {
      console.log(`🚀 AUTONOMOUS TRADING STARTED`);
      console.log(`⏰ Start: ${new Date(data.startTime).toLocaleString()}`);
      console.log(`⏰ End: ${new Date(data.endTime).toLocaleString()}`);
      console.log(`🎯 Mode: ${data.mode}\n`);
    });
    
    this.trader.on('regimeChange', (regime) => {
      console.log(`📊 REGIME CHANGE: ${regime.previous} → ${regime.current}`);
      console.log(`🎯 Confidence: ${(regime.confidence * 100).toFixed(1)}%\n`);
    });
    
    this.trader.on('emergencyStop', (data) => {
      console.error(`🚨 EMERGENCY STOP: ${data.reason}`);
      console.error(`⏰ Time: ${new Date(data.timestamp).toLocaleString()}\n`);
      this.shutdown('Emergency stop triggered');
    });
    
    // Log all major events
    this.trader.on('positionOpened', (position) => {
      console.log(`📈 POSITION OPENED: ${position.symbol} ${position.direction}`);
      console.log(`💰 Size: $${position.positionSize.toFixed(2)} | Stop: $${position.stopLoss.toFixed(4)}\n`);
    });
    
    this.trader.on('positionClosed', (data) => {
      const { position, realizedPnL } = data;
      const emoji = realizedPnL > 0 ? '🟢' : '🔴';
      console.log(`${emoji} POSITION CLOSED: ${position.symbol}`);
      console.log(`💰 P&L: ${realizedPnL > 0 ? '+' : ''}$${realizedPnL.toFixed(2)}\n`);
    });
  }
  
  /**
   * Confirm launch with user
   */
  async confirmLaunch() {
    console.log('⚠️  FINAL CONFIRMATION REQUIRED ⚠️');
    console.log('This will start autonomous trading for up to 3 days');
    console.log(`Starting balance: $${AUTONOMOUS_CONFIG.initialBalance}`);
    console.log(`Risk per trade: ${AUTONOMOUS_CONFIG.baseRisk * 100}% - ${AUTONOMOUS_CONFIG.maxRisk * 100}%`);
    console.log(`Max drawdown: ${AUTONOMOUS_CONFIG.maxDrawdown * 100}%`);
    console.log(`Trading mode: ${AUTONOMOUS_CONFIG.operationMode}`);
    console.log('\nPress ENTER to confirm launch or Ctrl+C to cancel...');
    
    // Wait for user confirmation
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }
  
  /**
   * Start monitoring loop
   */
  startMonitoring() {
    console.log('📊 Starting monitoring loop...\n');
    
    // Status updates every 5 minutes
    this.statusInterval = setInterval(() => {
      this.printStatus();
    }, 300000);
    
    // Save progress every 15 minutes
    this.saveInterval = setInterval(() => {
      this.saveProgress();
    }, 900000);
    
    // Memory cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 3600000);
    
    // Initial status
    setTimeout(() => this.printStatus(), 30000); // First status after 30 seconds
  }
  
  /**
   * Print current status
   */
  printStatus() {
    if (!this.trader || !this.isRunning) return;
    
    try {
      const status = this.trader.getStatus();
      const runtime = Math.floor(status.runtime / 3600); // hours
      const remainingTime = Math.max(0, 72 - runtime); // hours remaining
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 AUTONOMOUS TRADING STATUS');
      console.log('='.repeat(60));
      console.log(`⏰ Runtime: ${runtime}h | Remaining: ${remainingTime}h`);
      console.log(`💰 Balance: $${status.currentBalance.toFixed(2)}`);
      console.log(`📈 Total Trades: ${status.totalTrades}`);
      console.log(`🎯 Win Rate: ${status.winRate.toFixed(1)}%`);
      console.log(`📊 Current Price: $${status.currentPrice.toFixed(2)}`);
      console.log(`🔢 Open Positions: ${status.openPositions}`);
      console.log(`🟢 Status: ${status.isRunning ? 'ACTIVE' : 'STOPPED'}`);
      console.log(`🩺 Health: ${status.healthStatus.dataFlowing ? '✅' : '⚠️'} Data | ${status.healthStatus.websocketConnected ? '✅' : '⚠️'} Connection`);
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('Error printing status:', error);
    }
  }
  
  /**
   * Save progress to file
   */
  async saveProgress() {
    try {
      if (!this.trader) return;
      
      const status = this.trader.getStatus();
      const progressData = {
        timestamp: Date.now(),
        runtime: status.runtime,
        ...status
      };
      
      const filename = `./logs/autonomous/progress_${new Date().toISOString().split('T')[0]}.json`;
      await fs.writeFile(filename, JSON.stringify(progressData, null, 2));
      
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  
  /**
   * Memory cleanup
   */
  cleanupMemory() {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log(`🧹 Memory cleanup: ${memMB}MB used`);
    
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection performed');
    }
  }
  
  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    // Handle various shutdown signals
    process.on('SIGINT', () => this.shutdown('SIGINT received'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM received'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown('Uncaught exception');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown('Unhandled rejection');
    });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(reason) {
    console.log(`\n🛑 Shutting down: ${reason}`);
    
    this.isRunning = false;
    
    // Clear intervals
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.saveInterval) clearInterval(this.saveInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    // Stop trader
    if (this.trader) {
      try {
        await this.trader.stopAutonomousTrading(reason);
        console.log('✅ Autonomous trader stopped successfully');
      } catch (error) {
        console.error('Error stopping trader:', error);
      }
    }
    
    // Save final progress
    await this.saveProgress();
    
    console.log('👋 Shutdown complete');
    process.exit(0);
  }
}

// Main execution
async function main() {
  try {
    const launcher = new AutonomousLauncher();
    await launcher.launch();
    
    // Keep process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Launch if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutonomousLauncher;