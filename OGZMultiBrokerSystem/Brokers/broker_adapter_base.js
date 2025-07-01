// BaseBrokerAdapter.js - Base class for all broker adapters
// Provides standardized interface for broker integration

const EventEmitter = require('events');

/**
 * Base Broker Adapter Class
 * All broker adapters must extend this class and implement required methods
 */
class BaseBrokerAdapter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Base configuration
      name: 'base',
      apiKey: '',
      apiSecret: '',
      sandbox: false,
      
      // Rate limiting
      maxRequestsPerSecond: 10,
      requestQueue: [],
      
      // Connection settings
      connectionTimeout: 30000,
      reconnectAttempts: 5,
      reconnectDelay: 5000,
      
      ...config
    };
    
    // Connection state
    this.connected = false;
    this.connecting = false;
    this.lastError = null;
    this.connectionAttempts = 0;
    
    // Capabilities - override in child classes
    this.capabilities = {
      markets: ['stocks'],          // Supported markets
      orderTypes: ['market', 'limit'], // Supported order types
      timeInForce: ['GTC', 'IOC'],  // Supported time in force
      streaming: false,             // Real-time data streaming
      paperTrading: false,          // Paper trading support
      fractionalShares: false,      // Fractional share support
      crypto: false,                // Cryptocurrency support
      options: false,               // Options trading support
      forex: false                  // Forex trading support
    };
    
    // Rate limiting
    this.requestTimes = [];
    
    // Position tracking
    this.positions = new Map();
    this.orders = new Map();
  }
  
  // ==================== REQUIRED METHODS ====================
  // These methods must be implemented by all broker adapters
  
  /**
   * Connect to the broker
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    throw new Error('connect() method must be implemented by broker adapter');
  }
  
  /**
   * Disconnect from the broker
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented by broker adapter');
  }
  
  /**
   * Place an order
   * @param {Object} order - Order parameters
   * @returns {Promise<Object>} Order result
   */
  async placeOrder(order) {
    throw new Error('placeOrder() method must be implemented by broker adapter');
  }
  
  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelOrder(orderId) {
    throw new Error('cancelOrder() method must be implemented by broker adapter');
  }
  
  /**
   * Get current positions
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions() {
    throw new Error('getPositions() method must be implemented by broker adapter');
  }
  
  /**
   * Get account balance
   * @returns {Promise<Object>} Account balance information
   */
  async getAccountBalance() {
    throw new Error('getAccountBalance() method must be implemented by broker adapter');
  }
  
  /**
   * Check if symbol is supported
   * @param {string} symbol - Trading symbol
   * @returns {boolean} Whether symbol is supported
   */
  supportsSymbol(symbol) {
    throw new Error('supportsSymbol() method must be implemented by broker adapter');
  }
  
  // ==================== UTILITY METHODS ====================
  // Common functionality shared across all adapters
  
  /**
   * Check if adapter is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }
  
  /**
   * Get adapter capabilities
   * @returns {Object} Capabilities object
   */
  getCapabilities() {
    return { ...this.capabilities };
  }
  
  /**
   * Get last error
   * @returns {string|null} Last error message
   */
  getLastError() {
    return this.lastError;
  }
  
  /**
   * Set connection status
   * @param {boolean} status - Connection status
   * @protected
   */
  setConnected(status) {
    const wasConnected = this.connected;
    this.connected = status;
    
    if (status && !wasConnected) {
      this.emit('connected');
    } else if (!status && wasConnected) {
      this.emit('disconnected');
    }
  }
  
  /**
   * Set last error
   * @param {string} error - Error message
   * @protected
   */
  setError(error) {
    this.lastError = error;
    this.emit('error', new Error(error));
  }
  
  /**
   * Rate limiting check
   * @returns {boolean} Whether request is allowed
   * @protected
   */
  checkRateLimit() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Remove old requests
    this.requestTimes = this.requestTimes.filter(time => time > oneSecondAgo);
    
    // Check if we're at the limit
    if (this.requestTimes.length >= this.config.maxRequestsPerSecond) {
      return false;
    }
    
    // Add current request
    this.requestTimes.push(now);
    return true;
  }
  
  /**
   * Wait for rate limit availability
   * @returns {Promise<void>}
   * @protected
   */
  async waitForRateLimit() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.checkRateLimit()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  
  /**
   * Validate order parameters
   * @param {Object} order - Order to validate
   * @returns {Object} Validation result
   * @protected
   */
  validateOrder(order) {
    const errors = [];
    
    // Required fields
    if (!order.symbol) errors.push('Symbol is required');
    if (!order.side) errors.push('Side is required');
    if (!order.quantity || order.quantity <= 0) errors.push('Valid quantity is required');
    if (!order.type) errors.push('Order type is required');
    
    // Side validation
    if (order.side && !['buy', 'sell'].includes(order.side.toLowerCase())) {
      errors.push('Side must be "buy" or "sell"');
    }
    
    // Order type validation
    if (order.type && !this.capabilities.orderTypes.includes(order.type)) {
      errors.push(`Order type "${order.type}" not supported`);
    }
    
    // Limit order price validation
    if (order.type === 'limit' && (!order.price || order.price <= 0)) {
      errors.push('Limit orders require a valid price');
    }
    
    // Time in force validation
    if (order.timeInForce && !this.capabilities.timeInForce.includes(order.timeInForce)) {
      errors.push(`Time in force "${order.timeInForce}" not supported`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Normalize order response
   * @param {Object} brokerResponse - Raw broker response
   * @returns {Object} Normalized order response
   * @protected
   */
  normalizeOrderResponse(brokerResponse) {
    // Override in child classes to normalize broker-specific responses
    return {
      orderId: brokerResponse.id || brokerResponse.orderId,
      clientOrderId: brokerResponse.clientOrderId,
      symbol: brokerResponse.symbol,
      side: brokerResponse.side,
      quantity: brokerResponse.quantity || brokerResponse.qty,
      price: brokerResponse.price,
      type: brokerResponse.type || brokerResponse.orderType,
      status: this.normalizeOrderStatus(brokerResponse.status),
      fillPrice: brokerResponse.fillPrice || brokerResponse.avgFillPrice,
      filledQuantity: brokerResponse.filledQuantity || brokerResponse.filledQty,
      timestamp: brokerResponse.timestamp || Date.now(),
      fees: brokerResponse.fees || 0
    };
  }
  
  /**
   * Normalize order status
   * @param {string} brokerStatus - Broker-specific status
   * @returns {string} Normalized status
   * @protected
   */
  normalizeOrderStatus(brokerStatus) {
    if (!brokerStatus) return 'unknown';
    
    const status = brokerStatus.toLowerCase();
    
    // Map common broker statuses to normalized statuses
    const statusMap = {
      'new': 'pending',
      'pending': 'pending',
      'accepted': 'pending',
      'filled': 'filled',
      'completed': 'filled',
      'partial': 'partiallyFilled',
      'partially_filled': 'partiallyFilled',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'rejected': 'rejected',
      'expired': 'expired',
      'replaced': 'replaced'
    };
    
    return statusMap[status] || 'unknown';
  }
  
  /**
   * Normalize position data
   * @param {Object} brokerPosition - Raw broker position
   * @returns {Object} Normalized position
   * @protected
   */
  normalizePosition(brokerPosition) {
    return {
      symbol: brokerPosition.symbol,
      quantity: brokerPosition.quantity || brokerPosition.qty || 0,
      side: brokerPosition.side || (brokerPosition.quantity > 0 ? 'long' : 'short'),
      avgPrice: brokerPosition.avgPrice || brokerPosition.averagePrice || 0,
      marketValue: brokerPosition.marketValue || 0,
      unrealizedPnL: brokerPosition.unrealizedPnL || brokerPosition.unrealizedPL || 0,
      realizedPnL: brokerPosition.realizedPnL || brokerPosition.realizedPL || 0,
      lastPrice: brokerPosition.lastPrice || brokerPosition.currentPrice || 0
    };
  }
  
  /**
   * Normalize account balance
   * @param {Object} brokerBalance - Raw broker balance
   * @returns {Object} Normalized balance
   * @protected
   */
  normalizeBalance(brokerBalance) {
    return {
      cash: brokerBalance.cash || brokerBalance.buyingPower || 0,
      equity: brokerBalance.equity || brokerBalance.totalValue || 0,
      buyingPower: brokerBalance.buyingPower || brokerBalance.cash || 0,
      dayTradingBuyingPower: brokerBalance.dayTradingBuyingPower || 0,
      currency: brokerBalance.currency || 'USD'
    };
  }
  
  /**
   * Handle connection error with retry logic
   * @param {Error} error - Connection error
   * @protected
   */
  async handleConnectionError(error) {
    this.setError(error.message);
    this.setConnected(false);
    
    // Increment connection attempts
    this.connectionAttempts++;
    
    if (this.connectionAttempts < this.config.reconnectAttempts) {
      console.log(`🔄 Reconnecting to ${this.config.name} in ${this.config.reconnectDelay}ms (attempt ${this.connectionAttempts}/${this.config.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          // Error will be handled by recursive call
        });
      }, this.config.reconnectDelay);
    } else {
      console.error(`❌ Failed to connect to ${this.config.name} after ${this.config.reconnectAttempts} attempts`);
      this.emit('connectionFailed', error);
    }
  }
  
  /**
   * Reset connection attempts counter
   * @protected
   */
  resetConnectionAttempts() {
    this.connectionAttempts = 0;
  }
  
  /**
   * Log adapter activity
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @protected
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      broker: this.config.name,
      level,
      message,
      ...data
    };
    
    console.log(`[${timestamp}] ${this.config.name.toUpperCase()} ${level.toUpperCase()}: ${message}`);
    
    // Emit log event for external logging systems
    this.emit('log', logEntry);
  }
  
  /**
   * Create a delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @protected
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BaseBrokerAdapter;