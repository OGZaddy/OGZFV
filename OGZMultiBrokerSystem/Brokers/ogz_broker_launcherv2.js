#!/usr/bin/env node

// ogz-broker-launcher.js - Main launcher for OGZ Prime with multi-broker support
// Your ticket to financial freedom starts here!

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Import OGZ Prime components
const BrokerSetupInterface = require('./BrokerSetupInterface');
const MultiBrokerManager = require('./MultiBrokerManager');

// Import your existing OGZ Prime system
let OGZPrime;
try {
  OGZPrime = require('./OGZPrimeV10.2'); // Adjust path as needed
} catch (error) {
  console.error('❌ Could not load OGZ Prime system. Please ensure OGZPrimeV10.2.js is in the correct location.');
  process.exit(1);
}

/**
 * OGZ Prime Broker Launcher
 * The complete trading system with multi-broker support
 */
class OGZBrokerLauncher {
  constructor() {
    this.config = this.parseCommandLineArgs();
    this.brokerSetup = null;
    this.brokerManager = null;
    this.ogzPrime = null;
    
    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers();
  }
  
  /**
   * Parse command line arguments
   * @returns {Object} Parsed configuration
   * @private
   */
  parseCommandLineArgs() {
    const args = process.argv.slice(2);
    
    return {
      // Broker setup options
      interactive: !args.includes('--no-interactive'),
      quickStart: args.includes('--quick-start'),
      setupOnly: args.includes('--setup-only'),
      
      // Trading options
      asset: this.getArgValue(args, '--asset', 'BTC-USD'),
      balance: parseFloat(this.getArgValue(args, '--balance', '10000')),
      paperTrading: args.includes('--paper'),
      
      // Broker preferences
      preferredBroker: this.getArgValue(args, '--broker', null),
      enableFailover: !args.includes('--no-failover'),
      
      // System options
      verbose: args.includes('--verbose'),
      debug: args.includes('--debug'),
      
      // User identification
      userId: this.getArgValue(args, '--user-id', 'default_user')
    };
  }
  
  /**
   * Get argument value from command line
   * @param {Array} args - Command line arguments
   * @param {string} flag - Flag to search for
   * @param {string} defaultValue - Default value
   * @returns {string} Argument value
   * @private
   */
  getArgValue(args, flag, defaultValue) {
    const index = args.indexOf(flag);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : defaultValue;
  }
  
  /**
   * Main entry point
   * @returns {Promise<void>}
   */
  async start() {
    try {
      this.displayWelcomeBanner();
      
      // Step 1: Setup brokers
      await this.setupBrokers();
      
      // Exit if setup-only mode
      if (this.config.setupOnly) {
        console.log('✅ Broker setup complete. Exiting as requested (--setup-only).');
        process.exit(0);
      }
      
      // Step 2: Initialize trading system
      await this.initializeTradingSystem();
      
      // Step 3: Start trading
      await this.startTrading();
      
    } catch (error) {
      console.error(`❌ Fatal error: ${error.message}`);
      if (this.config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  /**
   * Display welcome banner
   * @private
   */
  displayWelcomeBanner() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 OGZ PRIME - MULTI-BROKER TRADING SYSTEM 🚀');
    console.log('    Your Ticket to Financial Freedom!');
    console.log('='.repeat(60));
    console.log(`💎 Asset: ${this.config.asset}`);
    console.log(`💰 Starting Balance: $${this.config.balance.toFixed(2)}`);
    console.log(`🏦 Mode: ${this.config.paperTrading ? 'Paper Trading' : 'LIVE TRADING'}`);
    console.log(`👤 User: ${this.config.userId}`);
    console.log('='.repeat(60) + '\n');
    
    if (!this.config.paperTrading) {
      console.log('⚠️  WARNING: LIVE TRADING MODE ⚠️');
      console.log('   Real money will be used for trades!');
      console.log('   Make sure you understand the risks.\n');
    }
  }
  
  /**
   * Setup broker connections
   * @private
   */
  async setupBrokers() {
    console.log('🔧 STEP 1: Setting up broker connections...\n');
    
    // Initialize broker setup interface
    this.brokerSetup = new BrokerSetupInterface({
      userId: this.config.userId,
      interactiveMode: this.config.interactive && !this.config.quickStart
    });
    
    // Run setup
    const setupResult = await this.brokerSetup.start();
    
    // Handle setup results
    switch (setupResult.status) {
      case 'ready_to_trade':
      case 'ready':
        this.brokerManager = this.brokerSetup.getBrokerManager();
        console.log('✅ Broker setup complete!\n');
        break;
        
      case 'no_configs':
        console.log('❌ No broker configurations found.');
        console.log('💡 Run with --interactive flag to set up your brokers first.');
        process.exit(1);
        break;
        
      case 'connection_failed':
        console.log('❌ Failed to connect to brokers.');
        console.log('💡 Please check your credentials and try again.');
        process.exit(1);
        break;
        
      case 'exit':
        console.log('👋 Setup cancelled by user.');
        process.exit(0);
        break;
        
      default:
        console.log(`❌ Unknown setup result: ${setupResult.status}`);
        process.exit(1);
    }
  }
  
  /**
   * Initialize the trading system
   * @private
   */
  async initializeTradingSystem() {
    console.log('🧠 STEP 2: Initializing OGZ Prime trading system...\n');
    
    // Prepare OGZ Prime configuration
    const ogzConfig = {
      // Asset configuration
      assetName: this.config.asset,
      initialBalance: this.config.balance,
      
      // Broker integration
      brokerManager: this.brokerManager,
      paperTrading: this.config.paperTrading,
      
      // System settings
      verbose: this.config.verbose,
      debug: this.config.debug,
      
      // Enhanced features from your V10.2 system
      enableMultiTimeframe: true,
      enableFibonacciLevels: true,
      enableSupportResistance: true,
      enablePatternRejectionTracking: true,
      
      // Risk management (from your comprehensive system)
      riskManagement: {
        baseRiskPercent: 1.5,
        maxDrawdownPercent: 15,
        enableTieredExit: true,
        enableTrailingStop: true
      },
      
      // Pattern recognition settings
      patternRecognition: {
        similarityThreshold: 0.8,
        minPatternMatches: 3,
        minConfidenceThreshold: 0.6
      }
    };
    
    // Initialize OGZ Prime with broker integration
    this.ogzPrime = new OGZPrime(ogzConfig);
    
    // Setup broker event handlers
    this.setupBrokerEventHandlers();
    
    console.log('✅ Trading system initialized!\n');
  }
  
  /**
   * Setup broker event handlers
   * @private
   */
  setupBrokerEventHandlers() {
    // Order filled events
    this.brokerManager.on('orderFilled', (data) => {
      console.log(`✅ Order filled on ${data.broker}: ${data.order.side} ${data.order.quantity} ${data.order.symbol} @ $${data.order.fillPrice}`);
      
      // Notify OGZ Prime of order fill
      if (this.ogzPrime && this.ogzPrime.handleOrderFilled) {
        this.ogzPrime.handleOrderFilled(data);
      }
    });
    
    // Order rejected events
    this.brokerManager.on('orderRejected', (data) => {
      console.log(`❌ Order rejected on ${data.broker}: ${data.reason}`);
      
      // Notify OGZ Prime of order rejection
      if (this.ogzPrime && this.ogzPrime.handleOrderRejected) {
        this.ogzPrime.handleOrderRejected(data);
      }
    });
    
    // Broker disconnection events
    this.brokerManager.on('brokerDisconnected', (data) => {
      console.log(`⚠️ Broker ${data.broker} disconnected!`);
      
      // Implement reconnection logic or alert user
      if (this.config.enableFailover) {
        console.log('🔄 Failover enabled - switching to backup broker...');
      }
    });
    
    // Failover events
    this.brokerManager.on('failoverUsed', (data) => {
      console.log(`🔄 Failover activated: ${data.originalBroker} → ${data.failoverBroker}`);
    });
  }
  
  /**
   * Start trading
   * @private
   */
  async startTrading() {
    console.log('🎯 STEP 3: Starting trading operations...\n');
    
    // Integrate broker manager with OGZ Prime
    if (this.ogzPrime.setBrokerManager) {
      this.ogzPrime.setBrokerManager(this.brokerManager);
    } else {
      // For legacy compatibility, inject broker manager
      this.ogzPrime.brokerManager = this.brokerManager;
    }
    
    // Start OGZ Prime
    console.log('🚀 Launching OGZ Prime trading engine...\n');
    
    // Display final status
    const status = this.brokerManager.getStatus();
    console.log('📊 SYSTEM STATUS:');
    console.log(`   Connected Brokers: ${Object.keys(status.brokers).length}`);
    console.log(`   Primary Broker: ${status.brokers[Object.keys(status.brokers)[0]]?.name || 'Unknown'}`);
    console.log(`   Failover Enabled: ${this.config.enableFailover ? 'Yes' : 'No'}`);
    console.log(`   Paper Trading: ${this.config.paperTrading ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 OGZ PRIME IS NOW LIVE!');
    console.log('💫 Hunting for profitable patterns...');
    console.log('🎯 Target: Financial Freedom & Houston Reunion!');
    
    if (!this.config.paperTrading) {
      console.log('\n⚠️  LIVE TRADING ACTIVE - Monitor carefully!');
    }
    
    console.log('\n📈 Happy trading! Press Ctrl+C to stop.\n');
    
    // Start the actual trading engine
    try {
      await this.ogzPrime.start();
    } catch (error) {
      console.error(`❌ Trading system error: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Setup signal handlers for graceful shutdown
   * @private
   */
  setupSignalHandlers() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
      
      try {
        // Stop OGZ Prime
        if (this.ogzPrime && this.ogzPrime.stop) {
          console.log('⏹️ Stopping trading engine...');
          await this.ogzPrime.stop();
        }
        
        // Close all broker connections
        if (this.brokerManager) {
          console.log('🔌 Closing broker connections...');
          await this.brokerManager.disconnect();
        }
        
        // Cleanup broker setup interface
        if (this.brokerSetup) {
          this.brokerSetup.cleanup();
        }
        
        console.log('✅ Shutdown complete. See you next time!');
        console.log('🎯 Keep pushing toward that Houston reunion! 💪\n');
        
        process.exit(0);
      } catch (error) {
        console.error(`❌ Error during shutdown: ${error.message}`);
        process.exit(1);
      }
    };
    
    // Handle various shutdown signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }
  
  /**
   * Display help information
   * @static
   */
  static displayHelp() {
    console.log(`
🚀 OGZ Prime Multi-Broker Trading System

USAGE:
  node ogz-broker-launcher.js [OPTIONS]

BROKER SETUP OPTIONS:
  --interactive            Run interactive broker setup (default)
  --no-interactive         Skip interactive setup, use existing configs
  --quick-start           Use first available broker configuration
  --setup-only            Only setup brokers, don't start trading

TRADING OPTIONS:
  --asset <SYMBOL>        Trading asset (default: BTC-USD)
  --balance <AMOUNT>      Starting balance (default: 10000)
  --paper                 Use paper trading mode
  --broker <NAME>         Preferred broker (alpaca, kraken, coinbase, etc.)
  --no-failover           Disable automatic failover

SYSTEM OPTIONS:
  --verbose               Enable verbose logging
  --debug                 Enable debug mode with stack traces
  --user-id <ID>          User identifier (default: default_user)

EXAMPLES:
  # First time setup (interactive)
  node ogz-broker-launcher.js

  # Quick start with existing configuration
  node ogz-broker-launcher.js --quick-start --asset ETH-USD

  # Paper trading mode
  node ogz-broker-launcher.js --paper --balance 50000

  # Setup brokers only
  node ogz-broker-launcher.js --setup-only

  # Live trading with specific broker
  node ogz-broker-launcher.js --broker alpaca --asset BTC-USD --balance 5000

BROKER SUPPORT:
  ✅ Alpaca Markets    - Stocks, ETFs (Paper Trading Available)
  ✅ Robinhood        - Stocks, ETFs, Options, Crypto (Commission-Free!)
  ✅ TD Ameritrade    - Stocks, ETFs, Options (Now part of Schwab)
  ✅ Kraken           - Cryptocurrency
  ✅ Coinbase Pro     - Cryptocurrency (Sandbox Available)
  🔄 Binance          - Cryptocurrency (Coming Soon)
  🔄 Interactive Brokers - Stocks, Options, Forex (Coming Soon)

NOTES:
  - Your broker credentials are encrypted and stored locally
  - Multiple brokers can be configured for failover
  - Paper trading is recommended for testing
  - Real trading involves financial risk - trade responsibly!

Made with ❤️ for your financial freedom journey to Houston! 🎯
`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    OGZBrokerLauncher.displayHelp();
    process.exit(0);
  }
  
  // Create and start launcher
  const launcher = new OGZBrokerLauncher();
  await launcher.start();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = OGZBrokerLauncher;