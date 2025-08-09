// CoinbaseAdapter.js - Coinbase Pro broker adapter
// Handles cryptocurrency trading through Coinbase Pro API

const BaseBrokerAdapter = require('./BaseBrokerAdapter');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Coinbase Pro Broker Adapter
 * Supports cryptocurrency trading with advanced order types
 */
class CoinbaseAdapter extends BaseBrokerAdapter {
  constructor(config = {}) {
    super({
      name: 'coinbase',
      baseUrl: config.sandbox ? 'https://api-public.sandbox.pro.coinbase.com' : 'https://api.pro.coinbase.com',
      maxRequestsPerSecond: 10, // Coinbase Pro rate limits
      ...config
    });
    
    // Coinbase-specific capabilities
    this.capabilities = {
      markets: ['crypto'],
      orderTypes: ['market', 'limit', 'stop'],
      timeInForce: ['GTC', 'IOC', 'FOK', 'GTT'],
      streaming: true,
      paperTrading: true, // Sandbox mode
      fractionalShares: true,
      crypto: true,
      options: false,
      forex: false
    };
    
    // API client
    this.client = null;
    
    // Coinbase-specific state
    this.products = new Map();
  }
  
  /**
   * Connect to Coinbase Pro
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      this.log('info', 'Connecting to Coinbase Pro...');
      
      // Validate credentials
      if (!this.config.apiKey || !this.config.apiSecret || !this.config.passphrase) {
        throw new Error('API key, secret, and passphrase are required');
      }
      
      // Setup HTTP client
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.connectionTimeout
      });
      
      // Load available products
      await this.loadProducts();
      
      // Test private API access
      const accountsResponse = await this.makePrivateRequest('GET', '/accounts');
      
      this.setConnected(true);
      this.resetConnectionAttempts();
      
      this.log('info', 'Successfully connected to Coinbase Pro', {
        products: this.products.size,
        accounts: accountsResponse.length
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to Coinbase Pro', { error: error.message });
      await this.handleConnectionError(error);
      return false;
    }
  }
  
  /**
   * Load available trading products
   * @private
   */
  async loadProducts() {
    try {
      const response = await this.client.get('/products');
      
      this.products.clear();
      for (const product of response.data) {
        if (product.status === 'online') {
          this.products.set(product.id, product);
        }
      }
      
      this.log('info', `Loaded ${this.products.size} trading products`);
    } catch (error) {
      this.log('error', 'Failed to load products', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Disconnect from Coinbase Pro
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    try {
      this.log('info', 'Disconnecting from Coinbase Pro...');
      
      // Clear client and state
      this.client = null;
      this.products.clear();
      
      this.setConnected(false);
      this.log('info', 'Disconnected from Coinbase Pro');
      
      return true;
    } catch (error) {
      this.log('error', 'Error disconnecting from Coinbase Pro', { error: error.message });
      return false;
    }
  }
  
  /**
   * Place an order on Coinbase Pro
   * @param {Object} order - Order parameters
   * @returns {Promise<Object>} Order result
   */
  async placeOrder(order) {
    try {
      // Validate order
      const validation = this.validateOrder(order);
      if (!validation.valid) {
        throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Check rate limit
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      // Convert symbol to Coinbase format
      const coinbaseSymbol = this.convertToCoinbaseSymbol(order.symbol);
      if (!coinbaseSymbol) {
        throw new Error(`Unsupported symbol: ${order.symbol}`);
      }
      
      // Prepare Coinbase order
      const coinbaseOrder = {
        product_id: coinbaseSymbol,
        side: order.side,
        type: order.type,
        size: order.quantity.toString()
      };
      
      // Add price for limit orders
      if (order.type === 'limit' && order.price) {
        coinbaseOrder.price = order.price.toString();
      }
      
      // Add client order ID if provided
      if (order.clientOrderId) {
        coinbaseOrder.client_oid = order.clientOrderId;
      }
      
      // Add time in force
      if (order.timeInForce && order.timeInForce !== 'GTC') {
        coinbaseOrder.time_in_force = order.timeInForce;
      }
      
      this.log('info', 'Placing order', { order: coinbaseOrder });
      
      // Submit order
      const response = await this.makePrivateRequest('POST', '/orders', coinbaseOrder);
      
      // Normalize response
      const normalizedOrder = this.normalizeCoinbaseOrder(response);
      
      // Store order
      this.orders.set(normalizedOrder.orderId, normalizedOrder);
      
      this.log('info', 'Order placed successfully', { 
        orderId: normalizedOrder.orderId,
        symbol: normalizedOrder.symbol,
        side: normalizedOrder.side,
        quantity: normalizedOrder.quantity
      });
      
      // Emit order placed event
      this.emit('orderPlaced', normalizedOrder);
      
      return normalizedOrder;
    } catch (error) {
      this.log('error', 'Failed to place order', { 
        error: error.response?.data?.message || error.message,
        order 
      });
      throw new Error(`Coinbase order failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelOrder(orderId) {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      this.log('info', 'Cancelling order', { orderId });
      
      const response = await this.makePrivateRequest('DELETE', `/orders/${orderId}`);
      
      // Remove from local orders
      this.orders.delete(orderId);
      
      this.log('info', 'Order cancelled successfully', { orderId });
      
      this.emit('orderCancelled', { orderId });
      
      return {
        orderId,
        status: 'cancelled',
        timestamp: Date.now()
      };
    } catch (error) {
      this.log('error', 'Failed to cancel order', { 
        orderId,
        error: error.response?.data?.message || error.message 
      });
      throw new Error(`Failed to cancel order: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Get current positions (account balances)
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions() {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.makePrivateRequest('GET', '/accounts');
      
      const positions = [];
      
      for (const account of response) {
        const balance = parseFloat(account.balance);
        
        if (balance > 0) {
          positions.push(this.normalizePosition({
            symbol: account.currency,
            quantity: balance,
            side: 'long',
            avgPrice: 0, // Not available from accounts endpoint
            marketValue: balance, // For base currencies
            unrealizedPnL: 0,
            realizedPnL: 0,
            lastPrice: 0
          }));
        }
      }
      
      return positions;
    } catch (error) {
      this.log('error', 'Failed to get positions', { error: error.message });
      throw new Error(`Failed to get positions: ${error.message}`);
    }
  }
  
  /**
   * Get account balance
   * @returns {Promise<Object>} Account balance information
   */
  async getAccountBalance() {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.makePrivateRequest('GET', '/accounts');
      
      // Find USD account
      const usdAccount = response.find(acc => acc.currency === 'USD' || acc.currency === 'USDC');
      const usdBalance = usdAccount ? parseFloat(usdAccount.balance) : 0;
      
      // Calculate total portfolio value (simplified)
      let totalValue = usdBalance;
      
      return this.normalizeBalance({
        cash: usdBalance,
        equity: totalValue,
        buyingPower: usdBalance,
        dayTradingBuyingPower: usdBalance,
        currency: 'USD'
      });
    } catch (error) {
      this.log('error', 'Failed to get account balance', { error: error.message });
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }
  
  /**
   * Check if symbol is supported
   * @param {string} symbol - Trading symbol
   * @returns {boolean} Whether symbol is supported
   */
  supportsSymbol(symbol) {
    const coinbaseSymbol = this.convertToCoinbaseSymbol(symbol);
    return coinbaseSymbol !== null && this.products.has(coinbaseSymbol);
  }
  
  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order information
   */
  async getOrder(orderId) {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.makePrivateRequest('GET', `/orders/${orderId}`);
      return this.normalizeCoinbaseOrder(response);
    } catch (error) {
      this.log('error', 'Failed to get order', { orderId, error: error.message });
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }
  
  /**
   * Make authenticated request to Coinbase Pro
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} API response
   * @private
   */
  async makePrivateRequest(method, endpoint, body = null) {
    const timestamp = Date.now() / 1000;
    const bodyString = body ? JSON.stringify(body) : '';
    
    // Create signature
    const message = timestamp + method + endpoint + bodyString;
    const signature = crypto
      .createHmac('sha256', Buffer.from(this.config.apiSecret, 'base64'))
      .update(message)
      .digest('base64');
    
    // Prepare request
    const requestConfig = {
      method: method.toLowerCase(),
      url: endpoint,
      headers: {
        'CB-ACCESS-KEY': this.config.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-ACCESS-PASSPHRASE': this.config.passphrase,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      requestConfig.data = body;
    }
    
    // Make request
    const response = await this.client(requestConfig);
    return response.data;
  }
  
  /**
   * Convert symbol to Coinbase format
   * @param {string} symbol - Standard symbol (e.g., BTC-USD)
   * @returns {string|null} Coinbase symbol or null if not supported
   * @private
   */
  convertToCoinbaseSymbol(symbol) {
    // Coinbase Pro uses the same format as our standard (BTC-USD)
    // But we need to check if it exists in their products
    if (this.products.has(symbol)) {
      return symbol;
    }
    
    // Try some common variations
    const variations = [
      symbol,
      symbol.replace('-', ''),
      symbol.replace('/', '-'),
      symbol.toUpperCase()
    ];
    
    for (const variation of variations) {
      if (this.products.has(variation)) {
        return variation;
      }
    }
    
    return null;
  }
  
  /**
   * Normalize Coinbase order
   * @param {Object} coinbaseOrder - Coinbase order data
   * @returns {Object} Normalized order
   * @private
   */
  normalizeCoinbaseOrder(coinbaseOrder) {
    return {
      orderId: coinbaseOrder.id,
      clientOrderId: coinbaseOrder.client_oid || null,
      symbol: this.convertFromCoinbaseSymbol(coinbaseOrder.product_id),
      side: coinbaseOrder.side,
      quantity: parseFloat(coinbaseOrder.size || coinbaseOrder.specified_funds || 0),
      price: coinbaseOrder.price ? parseFloat(coinbaseOrder.price) : null,
      type: coinbaseOrder.type,
      status: this.normalizeCoinbaseOrderStatus(coinbaseOrder.status),
      fillPrice: coinbaseOrder.executed_value && coinbaseOrder.filled_size 
        ? parseFloat(coinbaseOrder.executed_value) / parseFloat(coinbaseOrder.filled_size) 
        : null,
      filledQuantity: parseFloat(coinbaseOrder.filled_size || 0),
      timestamp: new Date(coinbaseOrder.created_at).getTime(),
      fees: parseFloat(coinbaseOrder.fill_fees || 0)
    };
  }
  
  /**
   * Convert from Coinbase symbol format
   * @param {string} coinbaseSymbol - Coinbase symbol
   * @returns {string} Standard symbol
   * @private
   */
  convertFromCoinbaseSymbol(coinbaseSymbol) {
    // Coinbase Pro symbols are already in our standard format
    return coinbaseSymbol;
  }
  
  /**
   * Normalize Coinbase order status
   * @param {string} coinbaseStatus - Coinbase order status
   * @returns {string} Normalized status
   * @private
   */
  normalizeCoinbaseOrderStatus(coinbaseStatus) {
    const statusMap = {
      'pending': 'pending',
      'open': 'pending',
      'active': 'pending',
      'done': 'filled',
      'settled': 'filled',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'rejected': 'rejected'
    };
    
    return statusMap[coinbaseStatus] || 'unknown';
  }
}

module.exports = CoinbaseAdapter;