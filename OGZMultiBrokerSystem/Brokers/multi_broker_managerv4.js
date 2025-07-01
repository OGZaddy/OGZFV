// MultiBrokerManager.js - Universal broker integration for OGZ Prime
// Supports multiple brokers with unified API and automatic failover

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Broker-specific adapters
const AlpacaAdapter = require('./adapters/AlpacaAdapter');
const RobinhoodAdapter = require('./adapters/RobinhoodAdapter');
const TDAmeriteAdapter = require('./adapters/TDAmeriteAdapter');
const IBKRAdapter = require('./adapters/IBKRAdapter');
const KrakenAdapter = require('./adapters/KrakenAdapter');
const CoinbaseAdapter = require('./adapters/CoinbaseAdapter');
const BinanceAdapter = require('./adapters/BinanceAdapter');

/**
 * Multi-Broker Manager for OGZ Prime
 * Provides unified interface for trading across multiple brokers
 */
class MultiBrokerManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Primary broker settings
      primaryBroker: 'alpaca',                // Default primary broker
      enableFailover: true,                   // Enable automatic failover
      failoverTimeout: 30000,                 // 30 seconds failover timeout
      
      // Order management
      orderTimeout: 60000,                    // 1 minute order timeout
      maxRetries: 3,                          // Max order retry attempts
      enablePartialFills: true,               // Allow partial order fills
      
      // Position synchronization
      syncPositions: true,                    // Sync positions across brokers
      enablePositionCheck: true,              // Verify positions periodically
      positionCheckInterval: 300000,          // 5 minutes position check
      
      // Security and authentication
      encryptCredentials: true,               // Encrypt stored credentials
      credentialsFile: 'broker-credentials.json', // Credentials storage file
      
      // Logging and monitoring
      logAllOrders: true,                     // Log all order activity
      logDirectory: path.join(process.cwd(), 'logs', 'brokers'),
      
      // Asset routing (which broker to use for which assets)
      assetRouting: {
        'stocks': ['alpaca', 'robinhood', 'tdameritrade', 'ibkr'],
        'crypto': ['robinhood', 'kraken', 'coinbase', 'binance'],
        'forex': ['ibkr', 'tdameritrade'],
        'options': ['robinhood', 'tdameritrade', 'ibkr']
      },
      
      ...config
    };
    
    // State management
    this.brokers = new Map();               // Active broker connections
    this.credentials = new Map();           // Stored credentials
    this.activeBroker = null;               // Currently active primary broker
    this.failoverBroker = null;             // Current failover broker
    this.orderQueue = [];                   // Pending orders
    this.positionCache = new Map();         // Cached positions
    this.orderHistory = [];                 // Order execution history
    
    // Available broker adapters
    this.availableAdapters = {
      'alpaca': AlpacaAdapter,
      'robinhood': RobinhoodAdapter,
      'tdameritrade': TDAmeriteAdapter,
      'ibkr': IBKRAdapter,
      'kraken': KrakenAdapter,
      'coinbase': CoinbaseAdapter,
      'binance': BinanceAdapter
    };
    
    // Status tracking
    this.status = {
      connected: false,
      primaryBrokerStatus: 'disconnected',
      failoverBrokerStatus: 'disconnected',
      lastError: null,
      totalOrders: 0,
      successfulOrders: 0,
      failedOrders: 0
    };
    
    // Ensure log directory exists
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }
    
    // Load saved credentials
    this.loadCredentials();
    
    // Setup position check interval
    if (this.config.enablePositionCheck) {
      setInterval(() => this.checkPositions(), this.config.positionCheckInterval);
    }
  }
  
  /**
   * Initialize and connect to brokers
   * @param {Object} brokerConfigs - Configuration for each broker
   * @returns {Promise<boolean>} Success status
   */
  async initialize(brokerConfigs = {}) {
    try {
      console.log('🔌 Initializing Multi-Broker Manager...');
      
      // Initialize primary broker
      if (brokerConfigs[this.config.primaryBroker]) {
        await this.addBroker(this.config.primaryBroker, brokerConfigs[this.config.primaryBroker]);
        this.activeBroker = this.config.primaryBroker;
        this.status.primaryBrokerStatus = 'connected';
      }
      
      // Initialize additional brokers
      for (const [brokerName, brokerConfig] of Object.entries(brokerConfigs)) {
        if (brokerName !== this.config.primaryBroker) {
          await this.addBroker(brokerName, brokerConfig);
        }
      }
      
      // Set failover broker if enabled
      if (this.config.enableFailover && this.brokers.size > 1) {
        const failoverCandidates = Array.from(this.brokers.keys())
          .filter(name => name !== this.activeBroker);
        
        if (failoverCandidates.length > 0) {
          this.failoverBroker = failoverCandidates[0];
          this.status.failoverBrokerStatus = 'standby';
        }
      }
      
      this.status.connected = true;
      console.log(`✅ Multi-Broker Manager initialized with ${this.brokers.size} brokers`);
      console.log(`🎯 Primary: ${this.activeBroker} | Failover: ${this.failoverBroker || 'None'}`);
      
      // Emit initialization event
      this.emit('initialized', {
        brokers: Array.from(this.brokers.keys()),
        primary: this.activeBroker,
        failover: this.failoverBroker
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Multi-Broker Manager:', error.message);
      this.status.lastError = error.message;
      
      this.emit('error', {
        phase: 'initialization',
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Add a broker connection
   * @param {string} brokerName - Name of the broker
   * @param {Object} config - Broker configuration
   * @returns {Promise<boolean>} Success status
   */
  async addBroker(brokerName, config) {
    try {
      console.log(`🔗 Connecting to ${brokerName}...`);
      
      // Check if adapter exists
      const AdapterClass = this.availableAdapters[brokerName.toLowerCase()];
      if (!AdapterClass) {
        throw new Error(`Unsupported broker: ${brokerName}`);
      }
      
      // Create and initialize adapter
      const adapter = new AdapterClass(config);
      
      // Connect to broker
      await adapter.connect();
      
      // Setup event listeners
      this.setupBrokerEventListeners(brokerName, adapter);
      
      // Store broker adapter
      this.brokers.set(brokerName, adapter);
      
      // Store credentials (encrypted if enabled)
      this.credentials.set(brokerName, this.encryptCredentials(config));
      
      console.log(`✅ Connected to ${brokerName}`);
      
      // Emit broker connected event
      this.emit('brokerConnected', {
        broker: brokerName,
        capabilities: adapter.getCapabilities()
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to ${brokerName}:`, error.message);
      
      this.emit('brokerError', {
        broker: brokerName,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Setup event listeners for a broker adapter
   * @param {string} brokerName - Name of the broker
   * @param {Object} adapter - Broker adapter instance
   * @private
   */
  setupBrokerEventListeners(brokerName, adapter) {
    // Order fill events
    adapter.on('orderFilled', (order) => {
      this.handleOrderFilled(brokerName, order);
    });
    
    // Order rejected events
    adapter.on('orderRejected', (order, reason) => {
      this.handleOrderRejected(brokerName, order, reason);
    });
    
    // Connection events
    adapter.on('disconnected', () => {
      this.handleBrokerDisconnected(brokerName);
    });
    
    // Error events
    adapter.on('error', (error) => {
      this.handleBrokerError(brokerName, error);
    });
    
    // Position updates
    adapter.on('positionUpdate', (position) => {
      this.handlePositionUpdate(brokerName, position);
    });
  }
  
  /**
   * Place a market order
   * @param {Object} orderParams - Order parameters
   * @returns {Promise<Object>} Order result
   */
  async placeMarketOrder(orderParams) {
    const {
      symbol,
      side,           // 'buy' or 'sell'
      quantity,
      timeInForce = 'GTC',
      brokerPreference = null
    } = orderParams;
    
    try {
      // Determine which broker to use
      const brokerName = this.selectBrokerForOrder(symbol, brokerPreference);
      
      if (!brokerName) {
        throw new Error('No suitable broker available for this order');
      }
      
      const broker = this.brokers.get(brokerName);
      
      // Prepare order for broker
      const order = {
        symbol,
        side,
        quantity,
        type: 'market',
        timeInForce,
        timestamp: Date.now(),
        clientOrderId: this.generateOrderId()
      };
      
      console.log(`📤 Placing ${side} order for ${quantity} ${symbol} via ${brokerName}`);
      
      // Place order through broker
      const result = await this.executeOrderWithTimeout(broker, order);
      
      // Update statistics
      this.status.totalOrders++;
      if (result.status === 'filled' || result.status === 'partiallyFilled') {
        this.status.successfulOrders++;
      }
      
      // Log order
      this.logOrder(brokerName, order, result);
      
      // Add to order history
      this.orderHistory.push({
        ...order,
        broker: brokerName,
        result,
        timestamp: Date.now()
      });
      
      // Emit order event
      this.emit('orderPlaced', {
        broker: brokerName,
        order,
        result
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Order failed:`, error.message);
      
      this.status.failedOrders++;
      this.status.lastError = error.message;
      
      // Try failover if enabled and error suggests broker issue
      if (this.config.enableFailover && this.shouldTryFailover(error)) {
        console.log('🔄 Attempting failover...');
        return this.executeOrderWithFailover(orderParams);
      }
      
      throw error;
    }
  }
  
  /**
   * Place a limit order
   * @param {Object} orderParams - Order parameters
   * @returns {Promise<Object>} Order result
   */
  async placeLimitOrder(orderParams) {
    const {
      symbol,
      side,
      quantity,
      price,
      timeInForce = 'GTC',
      brokerPreference = null
    } = orderParams;
    
    try {
      const brokerName = this.selectBrokerForOrder(symbol, brokerPreference);
      const broker = this.brokers.get(brokerName);
      
      const order = {
        symbol,
        side,
        quantity,
        price,
        type: 'limit',
        timeInForce,
        timestamp: Date.now(),
        clientOrderId: this.generateOrderId()
      };
      
      console.log(`📤 Placing ${side} limit order for ${quantity} ${symbol} @ $${price} via ${brokerName}`);
      
      const result = await this.executeOrderWithTimeout(broker, order);
      
      this.status.totalOrders++;
      if (result.status === 'filled' || result.status === 'partiallyFilled') {
        this.status.successfulOrders++;
      }
      
      this.logOrder(brokerName, order, result);
      this.orderHistory.push({
        ...order,
        broker: brokerName,
        result,
        timestamp: Date.now()
      });
      
      this.emit('orderPlaced', {
        broker: brokerName,
        order,
        result
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Limit order failed:`, error.message);
      
      this.status.failedOrders++;
      this.status.lastError = error.message;
      
      if (this.config.enableFailover && this.shouldTryFailover(error)) {
        return this.executeOrderWithFailover(orderParams);
      }
      
      throw error;
    }
  }
  
  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   * @param {string} brokerName - Broker where order was placed
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelOrder(orderId, brokerName) {
    try {
      const broker = this.brokers.get(brokerName);
      
      if (!broker) {
        throw new Error(`Broker ${brokerName} not connected`);
      }
      
      console.log(`❌ Cancelling order ${orderId} on ${brokerName}`);
      
      const result = await broker.cancelOrder(orderId);
      
      this.emit('orderCancelled', {
        broker: brokerName,
        orderId,
        result
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to cancel order ${orderId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get current positions across all brokers
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions() {
    const allPositions = [];
    
    for (const [brokerName, broker] of this.brokers) {
      try {
        const positions = await broker.getPositions();
        
        // Add broker name to each position
        const brokerPositions = positions.map(pos => ({
          ...pos,
          broker: brokerName
        }));
        
        allPositions.push(...brokerPositions);
        
        // Update position cache
        this.positionCache.set(brokerName, positions);
      } catch (error) {
        console.error(`❌ Failed to get positions from ${brokerName}:`, error.message);
      }
    }
    
    return allPositions;
  }
  
  /**
   * Get account balance from specific broker
   * @param {string} brokerName - Broker name
   * @returns {Promise<Object>} Account balance
   */
  async getAccountBalance(brokerName = null) {
    const targetBroker = brokerName || this.activeBroker;
    const broker = this.brokers.get(targetBroker);
    
    if (!broker) {
      throw new Error(`Broker ${targetBroker} not connected`);
    }
    
    try {
      const balance = await broker.getAccountBalance();
      return {
        broker: targetBroker,
        ...balance
      };
    } catch (error) {
      console.error(`❌ Failed to get balance from ${targetBroker}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Select the best broker for an order
   * @param {string} symbol - Trading symbol
   * @param {string} preference - Preferred broker
   * @returns {string} Selected broker name
   * @private
   */
  selectBrokerForOrder(symbol, preference = null) {
    // Use preference if provided and available
    if (preference && this.brokers.has(preference)) {
      const broker = this.brokers.get(preference);
      if (broker.isConnected() && broker.supportsSymbol(symbol)) {
        return preference;
      }
    }
    
    // Determine asset type for routing
    const assetType = this.getAssetType(symbol);
    const suitableBrokers = this.config.assetRouting[assetType] || [];
    
    // Find first available suitable broker
    for (const brokerName of suitableBrokers) {
      if (this.brokers.has(brokerName)) {
        const broker = this.brokers.get(brokerName);
        if (broker.isConnected() && broker.supportsSymbol(symbol)) {
          return brokerName;
        }
      }
    }
    
    // Fallback to primary broker if it supports the symbol
    if (this.brokers.has(this.activeBroker)) {
      const primaryBroker = this.brokers.get(this.activeBroker);
      if (primaryBroker.isConnected() && primaryBroker.supportsSymbol(symbol)) {
        return this.activeBroker;
      }
    }
    
    // Last resort: any connected broker that supports the symbol
    for (const [brokerName, broker] of this.brokers) {
      if (broker.isConnected() && broker.supportsSymbol(symbol)) {
        return brokerName;
      }
    }
    
    return null;
  }
  
  /**
   * Determine asset type from symbol
   * @param {string} symbol - Trading symbol
   * @returns {string} Asset type
   * @private
   */
  getAssetType(symbol) {
    const cryptoPatterns = ['BTC', 'ETH', 'ADA', 'DOT', 'USDT', 'USDC'];
    const forexPatterns = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];
    
    // Check for crypto patterns
    if (cryptoPatterns.some(pattern => symbol.includes(pattern))) {
      return 'crypto';
    }
    
    // Check for forex patterns
    if (forexPatterns.some(pattern => symbol.includes(pattern))) {
      return 'forex';
    }
    
    // Check for options (contains expiration dates)
    if (/\d{6}[CP]\d+/.test(symbol)) {
      return 'options';
    }
    
    // Default to stocks
    return 'stocks';
  }
  
  /**
   * Execute order with timeout protection
   * @param {Object} broker - Broker adapter
   * @param {Object} order - Order parameters
   * @returns {Promise<Object>} Order result
   * @private
   */
  async executeOrderWithTimeout(broker, order) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Order execution timeout'));
      }, this.config.orderTimeout);
      
      broker.placeOrder(order)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Execute order with failover capability
   * @param {Object} orderParams - Original order parameters
   * @returns {Promise<Object>} Order result
   * @private
   */
  async executeOrderWithFailover(orderParams) {
    if (!this.failoverBroker || !this.brokers.has(this.failoverBroker)) {
      throw new Error('No failover broker available');
    }
    
    try {
      console.log(`🔄 Executing order via failover broker: ${this.failoverBroker}`);
      
      // Temporarily switch to failover broker
      const originalBroker = this.activeBroker;
      this.activeBroker = this.failoverBroker;
      
      // Execute order
      const result = orderParams.price 
        ? await this.placeLimitOrder(orderParams)
        : await this.placeMarketOrder(orderParams);
      
      // Restore original broker
      this.activeBroker = originalBroker;
      
      this.emit('failoverUsed', {
        originalBroker: originalBroker,
        failoverBroker: this.failoverBroker,
        order: orderParams
      });
      
      return result;
    } catch (failoverError) {
      console.error(`❌ Failover also failed:`, failoverError.message);
      throw new Error(`Both primary and failover brokers failed: ${failoverError.message}`);
    }
  }
  
  /**
   * Determine if failover should be attempted
   * @param {Error} error - Original error
   * @returns {boolean} Whether to try failover
   * @private
   */
  shouldTryFailover(error) {
    const failoverTriggers = [
      'connection',
      'timeout',
      'network',
      'unavailable',
      'service',
      'maintenance'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return failoverTriggers.some(trigger => errorMessage.includes(trigger));
  }
  
  /**
   * Handle order filled event
   * @param {string} brokerName - Broker name
   * @param {Object} order - Filled order
   * @private
   */
  handleOrderFilled(brokerName, order) {
    console.log(`✅ Order filled on ${brokerName}: ${order.side} ${order.quantity} ${order.symbol} @ $${order.fillPrice}`);
    
    this.emit('orderFilled', {
      broker: brokerName,
      order
    });
  }
  
  /**
   * Handle order rejected event
   * @param {string} brokerName - Broker name
   * @param {Object} order - Rejected order
   * @param {string} reason - Rejection reason
   * @private
   */
  handleOrderRejected(brokerName, order, reason) {
    console.log(`❌ Order rejected on ${brokerName}: ${reason}`);
    
    this.emit('orderRejected', {
      broker: brokerName,
      order,
      reason
    });
  }
  
  /**
   * Handle broker disconnection
   * @param {string} brokerName - Broker name
   * @private
   */
  handleBrokerDisconnected(brokerName) {
    console.log(`⚠️ Broker ${brokerName} disconnected`);
    
    // Update status
    if (brokerName === this.activeBroker) {
      this.status.primaryBrokerStatus = 'disconnected';
    }
    
    if (brokerName === this.failoverBroker) {
      this.status.failoverBrokerStatus = 'disconnected';
    }
    
    this.emit('brokerDisconnected', {
      broker: brokerName
    });
  }
  
  /**
   * Handle broker error
   * @param {string} brokerName - Broker name
   * @param {Error} error - Error object
   * @private
   */
  handleBrokerError(brokerName, error) {
    console.error(`❌ Broker ${brokerName} error:`, error.message);
    
    this.status.lastError = error.message;
    
    this.emit('brokerError', {
      broker: brokerName,
      error: error.message
    });
  }
  
  /**
   * Handle position update
   * @param {string} brokerName - Broker name
   * @param {Object} position - Updated position
   * @private
   */
  handlePositionUpdate(brokerName, position) {
    // Update position cache
    if (!this.positionCache.has(brokerName)) {
      this.positionCache.set(brokerName, []);
    }
    
    const positions = this.positionCache.get(brokerName);
    const existingIndex = positions.findIndex(p => p.symbol === position.symbol);
    
    if (existingIndex >= 0) {
      positions[existingIndex] = position;
    } else {
      positions.push(position);
    }
    
    this.emit('positionUpdate', {
      broker: brokerName,
      position
    });
  }
  
  /**
   * Check positions across all brokers
   * @private
   */
  async checkPositions() {
    if (!this.config.syncPositions) return;
    
    try {
      await this.getPositions();
      console.log('🔍 Position check completed');
    } catch (error) {
      console.error('❌ Position check failed:', error.message);
    }
  }
  
  /**
   * Generate unique order ID
   * @returns {string} Order ID
   * @private
   */
  generateOrderId() {
    return `OGZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log order activity
   * @param {string} brokerName - Broker name
   * @param {Object} order - Order object
   * @param {Object} result - Order result
   * @private
   */
  logOrder(brokerName, order, result) {
    if (!this.config.logAllOrders) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      broker: brokerName,
      order,
      result
    };
    
    const logFile = path.join(this.config.logDirectory, `${brokerName}-orders.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
  
  /**
   * Encrypt credentials for storage
   * @param {Object} credentials - Credentials to encrypt
   * @returns {Object} Encrypted credentials
   * @private
   */
  encryptCredentials(credentials) {
    if (!this.config.encryptCredentials) {
      return credentials;
    }
    
    // Simple encryption - in production, use proper crypto library
    const encrypted = {};
    for (const [key, value] of Object.entries(credentials)) {
      encrypted[key] = Buffer.from(value).toString('base64');
    }
    
    return encrypted;
  }
  
  /**
   * Decrypt credentials
   * @param {Object} encryptedCredentials - Encrypted credentials
   * @returns {Object} Decrypted credentials
   * @private
   */
  decryptCredentials(encryptedCredentials) {
    if (!this.config.encryptCredentials) {
      return encryptedCredentials;
    }
    
    const decrypted = {};
    for (const [key, value] of Object.entries(encryptedCredentials)) {
      decrypted[key] = Buffer.from(value, 'base64').toString();
    }
    
    return decrypted;
  }
  
  /**
   * Load saved credentials
   * @private
   */
  loadCredentials() {
    const credentialsPath = path.join(process.cwd(), this.config.credentialsFile);
    
    if (fs.existsSync(credentialsPath)) {
      try {
        const savedCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        for (const [brokerName, encryptedCreds] of Object.entries(savedCredentials)) {
          this.credentials.set(brokerName, this.decryptCredentials(encryptedCreds));
        }
        
        console.log(`📋 Loaded credentials for ${this.credentials.size} brokers`);
      } catch (error) {
        console.error('❌ Failed to load credentials:', error.message);
      }
    }
  }
  
  /**
   * Save credentials to file
   * @private
   */
  saveCredentials() {
    const credentialsToSave = {};
    
    for (const [brokerName, credentials] of this.credentials) {
      credentialsToSave[brokerName] = this.encryptCredentials(credentials);
    }
    
    const credentialsPath = path.join(process.cwd(), this.config.credentialsFile);
    fs.writeFileSync(credentialsPath, JSON.stringify(credentialsToSave, null, 2));
  }
  
  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    const brokerStatus = {};
    
    for (const [brokerName, broker] of this.brokers) {
      brokerStatus[brokerName] = {
        connected: broker.isConnected(),
        capabilities: broker.getCapabilities(),
        lastError: broker.getLastError()
      };
    }
    
    return {
      ...this.status,
      brokers: brokerStatus,
      orderHistory: this.orderHistory.slice(-10) // Last 10 orders
    };
  }
  
  /**
   * Switch primary broker
   * @param {string} newPrimaryBroker - New primary broker name
   * @returns {boolean} Success status
   */
  switchPrimaryBroker(newPrimaryBroker) {
    if (!this.brokers.has(newPrimaryBroker)) {
      console.error(`❌ Broker ${newPrimaryBroker} not available`);
      return false;
    }
    
    const broker = this.brokers.get(newPrimaryBroker);
    if (!broker.isConnected()) {
      console.error(`❌ Broker ${newPrimaryBroker} not connected`);
      return false;
    }
    
    const oldPrimary = this.activeBroker;
    this.activeBroker = newPrimaryBroker;
    
    console.log(`🔄 Switched primary broker from ${oldPrimary} to ${newPrimaryBroker}`);
    
    this.emit('primaryBrokerChanged', {
      oldPrimary,
      newPrimary: newPrimaryBroker
    });
    
    return true;
  }
  
  /**
   * Disconnect from all brokers
   * @returns {Promise<void>}
   */
  async disconnect() {
    console.log('🔌 Disconnecting from all brokers...');
    
    const disconnectPromises = [];
    
    for (const [brokerName, broker] of this.brokers) {
      disconnectPromises.push(
        broker.disconnect()
          .then(() => console.log(`✅ Disconnected from ${brokerName}`))
          .catch(error => console.error(`❌ Error disconnecting from ${brokerName}:`, error.message))
      );
    }
    
    await Promise.all(disconnectPromises);
    
    // Save credentials before shutdown
    this.saveCredentials();
    
    this.status.connected = false;
    this.emit('disconnected');
    
    console.log('🔌 All brokers disconnected');
  }
}

module.exports = MultiBrokerManager;