// BaseBrokerAdapter.js - Base class for all broker adapters
// Provides common functionality and interface for trading adapters

/**
 * Base Broker Adapter Class
 * All broker adapters should extend this class
 */
class BaseBrokerAdapter {
  constructor(config = {}) {
    this.config = config;
    this.name = config.name || 'unknown';
    this.baseUrl = config.baseUrl || '';
    this.maxRequestsPerSecond = config.maxRequestsPerSecond || 10;
    this.connected = false;
    this.client = null;

    // Default capabilities - override in child classes
    this.capabilities = {
      markets: ['stocks'],
      orderTypes: ['market', 'limit'],
      timeInForce: ['GTC'],
      streaming: false,
      paperTrading: false,
      fractionalShares: false,
      crypto: false
    };

    // Rate limiting
    this.lastRequestTime = 0;
    this.requestInterval = 1000 / this.maxRequestsPerSecond;
  }

  /**
   * Connect to the broker
   * Override in child classes
   */
  async connect() {
    throw new Error('connect() must be implemented by child class');
  }

  /**
   * Disconnect from the broker
   * Override in child classes
   */
  async disconnect() {
    this.connected = false;
    return true;
  }

  /**
   * Get account balance
   * Override in child classes
   */
  async getAccountBalance() {
    throw new Error('getAccountBalance() must be implemented by child class');
  }

  /**
   * Get current positions
   * Override in child classes
   */
  async getPositions() {
    throw new Error('getPositions() must be implemented by child class');
  }

  /**
   * Place an order
   * Override in child classes
   */
  async placeOrder(order) {
    throw new Error('placeOrder() must be implemented by child class');
  }

  /**
   * Cancel an order
   * Override in child classes
   */
  async cancelOrder(orderId) {
    throw new Error('cancelOrder() must be implemented by child class');
  }

  /**
   * Get order status
   * Override in child classes
   */
  async getOrderStatus(orderId) {
    throw new Error('getOrderStatus() must be implemented by child class');
  }

  /**
   * Get market data
   * Override in child classes
   */
  async getMarketData(symbol) {
    throw new Error('getMarketData() must be implemented by child class');
  }

  /**
   * Validate an order
   * Override in child classes for broker-specific validation
   */
  validateOrder(order) {
    const errors = [];

    if (!order.symbol) errors.push('Symbol is required');
    if (!order.side || !['buy', 'sell'].includes(order.side)) {
      errors.push('Side must be "buy" or "sell"');
    }
    if (!order.type || !this.capabilities.orderTypes.includes(order.type)) {
      errors.push(`Order type must be one of: ${this.capabilities.orderTypes.join(', ')}`);
    }
    if (!order.quantity || order.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a symbol is supported
   * Override in child classes
   */
  supportsSymbol(symbol) {
    return true; // Default implementation
  }

  /**
   * Rate limiting helper
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestInterval) {
      const waitTime = this.requestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Log helper
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = BaseBrokerAdapter;