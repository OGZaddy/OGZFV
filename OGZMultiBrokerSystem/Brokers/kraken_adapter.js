// KrakenAdapter.js - Kraken Exchange broker adapter
// Handles cryptocurrency trading through Kraken's API

const BaseBrokerAdapter = require('./BaseBrokerAdapter');
const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

/**
 * Kraken Exchange Broker Adapter
 * Supports cryptocurrency trading
 */
class KrakenAdapter extends BaseBrokerAdapter {
  constructor(config = {}) {
    super({
      name: 'kraken',
      baseUrl: 'https://api.kraken.com',
      maxRequestsPerSecond: 1, // Kraken has strict rate limits
      ...config
    });
    
    // Kraken-specific capabilities
    this.capabilities = {
      markets: ['crypto'],
      orderTypes: ['market', 'limit', 'stop-loss', 'take-profit'],
      timeInForce: ['GTC', 'IOC', 'FOK'],
      streaming: false,
      paperTrading: false,
      fractionalShares: true,
      crypto: true,
      options: false,
      forex: false
    };
    
    // API client
    this.client = null;
    
    // Kraken-specific state
    this.nonce = Date.now();
    this.assetPairs = new Map();
  }
  
  /**
   * Connect to Kraken
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      this.log('info', 'Connecting to Kraken...');
      
      // Validate credentials
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('API key and secret are required');
      }
      
      // Setup HTTP client
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.connectionTimeout
      });
      
      // Test connection by getting server time
      const response = await this.client.get('/0/public/Time');
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API error: ${response.data.error.join(', ')}`);
      }
      
      // Load asset pairs for symbol validation
      await this.loadAssetPairs();
      
      // Test private API access
      const balanceResponse = await this.makePrivateRequest('/0/private/Balance');
      
      this.setConnected(true);
      this.resetConnectionAttempts();
      
      this.log('info', 'Successfully connected to Kraken', {
        serverTime: response.data.result.unixtime,
        assets: this.assetPairs.size
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to Kraken', { error: error.message });
      await this.handleConnectionError(error);
      return false;
    }
  }
  
  /**
   * Load asset pairs from Kraken
   * @private
   */
  async loadAssetPairs() {
    try {
      const response = await this.client.get('/0/public/AssetPairs');
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Failed to load asset pairs: ${response.data.error.join(', ')}`);
      }
      
      this.assetPairs.clear();
      for (const [pairName, pairInfo] of Object.entries(response.data.result)) {
        this.assetPairs.set(pairName, pairInfo);
      }
      
      this.log('info', `Loaded ${this.assetPairs.size} asset pairs`);
    } catch (error) {
      this.log('error', 'Failed to load asset pairs', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Disconnect from Kraken
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    try {
      this.log('info', 'Disconnecting from Kraken...');
      
      // Clear client and state
      this.client = null;
      this.assetPairs.clear();
      
      this.setConnected(false);
      this.log('info', 'Disconnected from Kraken');
      
      return true;
    } catch (error) {
      this.log('error', 'Error disconnecting from Kraken', { error: error.message });
      return false;
    }
  }
  
  /**
   * Place an order on Kraken
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
      
      // Convert symbol to Kraken format
      const krakenSymbol = this.convertToKrakenSymbol(order.symbol);
      if (!krakenSymbol) {
        throw new Error(`Unsupported symbol: ${order.symbol}`);
      }
      
      // Prepare Kraken order
      const krakenOrder = {
        pair: krakenSymbol,
        type: order.side,
        ordertype: this.convertOrderType(order.type),
        volume: order.quantity.toString()
      };
      
      // Add price for limit orders
      if (order.type === 'limit' && order.price) {
        krakenOrder.price = order.price.toString();
      }
      
      // Add client order ID if provided
      if (order.clientOrderId) {
        krakenOrder.userref = order.clientOrderId;
      }
      
      this.log('info', 'Placing order', { order: krakenOrder });
      
      // Submit order
      const response = await this.makePrivateRequest('/0/private/AddOrder', krakenOrder);
      
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken order error: ${response.error.join(', ')}`);
      }
      
      // Extract order ID from response
      const orderId = response.result.txid[0];
      
      // Get full order details
      const orderDetails = await this.getOrder(orderId);
      
      this.log('info', 'Order placed successfully', { 
        orderId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity
      });
      
      // Emit order placed event
      this.emit('orderPlaced', orderDetails);
      
      return orderDetails;
    } catch (error) {
      this.log('error', 'Failed to place order', { 
        error: error.message,
        order 
      });
      throw new Error(`Kraken order failed: ${error.message}`);
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
      
      const response = await this.makePrivateRequest('/0/private/CancelOrder', {
        txid: orderId
      });
      
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken cancel error: ${response.error.join(', ')}`);
      }
      
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
        error: error.message 
      });
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }
  
  /**
   * Get current positions (balances for crypto)
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions() {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.makePrivateRequest('/0/private/Balance');
      
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken balance error: ${response.error.join(', ')}`);
      }
      
      const positions = [];
      
      for (const [asset, balance] of Object.entries(response.result)) {
        const balanceFloat = parseFloat(balance);
        
        if (balanceFloat > 0) {
          positions.push(this.normalizePosition({
            symbol: asset,
            quantity: balanceFloat,
            side: 'long',
            avgPrice: 0, // Not available from balance endpoint
            marketValue: 0, // Would need current prices
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
      
      const response = await this.makePrivateRequest('/0/private/Balance');
      
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken balance error: ${response.error.join(', ')}`);
      }
      
      // Calculate total value in USD (simplified)
      let totalValue = 0;
      const usdBalance = parseFloat(response.result.ZUSD || 0);
      
      return this.normalizeBalance({
        cash: usdBalance,
        equity: totalValue || usdBalance,
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
    const krakenSymbol = this.convertToKrakenSymbol(symbol);
    return krakenSymbol !== null;
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
      
      const response = await this.makePrivateRequest('/0/private/QueryOrders', {
        txid: orderId
      });
      
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken query error: ${response.error.join(', ')}`);
      }
      
      const orderData = response.result[orderId];
      return this.normalizeKrakenOrder(orderId, orderData);
    } catch (error) {
      this.log('error', 'Failed to get order', { orderId, error: error.message });
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }
  
  /**
   * Make authenticated request to Kraken
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} API response
   * @private
   */
  async makePrivateRequest(endpoint, params = {}) {
    // Increment nonce
    this.nonce++;
    
    // Add nonce to parameters
    const data = {
      nonce: this.nonce,
      ...params
    };
    
    // Create query string
    const postData = querystring.stringify(data);
    
    // Create signature
    const signature = this.createSignature(endpoint, postData);
    
    // Make request
    const response = await this.client.post(endpoint, postData, {
      headers: {
        'API-Key': this.config.apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  }
  
  /**
   * Create API signature for Kraken
   * @param {string} endpoint - API endpoint
   * @param {string} postData - POST data
   * @returns {string} API signature
   * @private
   */
  createSignature(endpoint, postData) {
    const secret = Buffer.from(this.config.apiSecret, 'base64');
    const hash = crypto.createHash('sha256').update(this.nonce + postData).digest();
    const hmac = crypto.createHmac('sha512', secret);
    
    hmac.update(endpoint, 'utf8');
    hmac.update(hash);
    
    return hmac.digest('base64');
  }
  
  /**
   * Convert symbol to Kraken format
   * @param {string} symbol - Standard symbol (e.g., BTC-USD)
   * @returns {string|null} Kraken symbol or null if not supported
   * @private
   */
  convertToKrakenSymbol(symbol) {
    // Simple mapping - in production, use comprehensive symbol mapping
    const symbolMappings = {
      'BTC-USD': 'XBTUSD',
      'ETH-USD': 'ETHUSD',
      'ADA-USD': 'ADAUSD',
      'DOT-USD': 'DOTUSD',
      'LINK-USD': 'LINKUSD',
      'LTC-USD': 'LTCUSD',
      'XRP-USD': 'XRPUSD'
    };
    
    return symbolMappings[symbol] || null;
  }
  
  /**
   * Convert order type to Kraken format
   * @param {string} orderType - Standard order type
   * @returns {string} Kraken order type
   * @private
   */
  convertOrderType(orderType) {
    const typeMap = {
      'market': 'market',
      'limit': 'limit',
      'stop': 'stop-loss',
      'stop_limit': 'stop-loss-limit'
    };
    
    return typeMap[orderType] || 'market';
  }
  
  /**
   * Normalize Kraken order
   * @param {string} orderId - Order ID
   * @param {Object} krakenOrder - Kraken order data
   * @returns {Object} Normalized order
   * @private
   */
  normalizeKrakenOrder(orderId, krakenOrder) {
    return {
      orderId,
      clientOrderId: krakenOrder.userref || null,
      symbol: this.convertFromKrakenSymbol(krakenOrder.descr.pair),
      side: krakenOrder.descr.type,
      quantity: parseFloat(krakenOrder.vol),
      price: krakenOrder.descr.price ? parseFloat(krakenOrder.descr.price) : null,
      type: krakenOrder.descr.ordertype,
      status: this.normalizeKrakenOrderStatus(krakenOrder.status),
      fillPrice: krakenOrder.price ? parseFloat(krakenOrder.price) : null,
      filledQuantity: parseFloat(krakenOrder.vol_exec),
      timestamp: Math.floor(krakenOrder.opentm * 1000),
      fees: parseFloat(krakenOrder.fee || 0)
    };
  }
  
  /**
   * Convert from Kraken symbol format
   * @param {string} krakenSymbol - Kraken symbol
   * @returns {string} Standard symbol
   * @private
   */
  convertFromKrakenSymbol(krakenSymbol) {
    const reverseMap = {
      'XBTUSD': 'BTC-USD',
      'ETHUSD': 'ETH-USD',
      'ADAUSD': 'ADA-USD',
      'DOTUSD': 'DOT-USD',
      'LINKUSD': 'LINK-USD',
      'LTCUSD': 'LTC-USD',
      'XRPUSD': 'XRP-USD'
    };
    
    return reverseMap[krakenSymbol] || krakenSymbol;
  }
  
  /**
   * Normalize Kraken order status
   * @param {string} krakenStatus - Kraken order status
   * @returns {string} Normalized status
   * @private
   */
  normalizeKrakenOrderStatus(krakenStatus) {
    const statusMap = {
      'pending': 'pending',
      'open': 'pending',
      'closed': 'filled',
      'canceled': 'cancelled',
      'expired': 'expired'
    };
    
    return statusMap[krakenStatus] || 'unknown';
  }
}

module.exports = KrakenAdapter;