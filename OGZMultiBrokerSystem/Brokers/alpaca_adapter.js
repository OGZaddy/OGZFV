// AlpacaAdapter.js - Alpaca Markets broker adapter
// Handles stock trading through Alpaca's API

const BaseBrokerAdapter = require('./BaseBrokerAdapter');
const WebSocket = require('ws');
const axios = require('axios');

/**
 * Alpaca Markets Broker Adapter
 * Supports stock trading with paper and live trading
 */
class AlpacaAdapter extends BaseBrokerAdapter {
  constructor(config = {}) {
    super({
      name: 'alpaca',
      baseUrl: config.sandbox ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets',
      dataUrl: config.sandbox ? 'wss://stream.data.sandbox.alpaca.markets' : 'wss://stream.data.alpaca.markets',
      maxRequestsPerSecond: 200, // Alpaca allows 200 requests per minute
      ...config
    });
    
    // Alpaca-specific capabilities
    this.capabilities = {
      markets: ['stocks', 'etfs'],
      orderTypes: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
      timeInForce: ['GTC', 'IOC', 'FOK', 'DAY'],
      streaming: true,
      paperTrading: true,
      fractionalShares: true,
      crypto: false,
      options: false,
      forex: false
    };
    
    // API client
    this.client = null;
    this.streamingWs = null;
    
    // Account info
    this.account = null;
  }
  
  /**
   * Connect to Alpaca
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      this.log('info', 'Connecting to Alpaca...');
      
      // Validate credentials
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('API key and secret are required');
      }
      
      // Setup HTTP client
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        headers: {
          'APCA-API-KEY-ID': this.config.apiKey,
          'APCA-API-SECRET-KEY': this.config.apiSecret,
          'Content-Type': 'application/json'
        },
        timeout: this.config.connectionTimeout
      });
      
      // Test connection by getting account info
      const response = await this.client.get('/v2/account');
      this.account = response.data;
      
      // Setup streaming if enabled
      if (this.config.enableStreaming !== false) {
        await this.setupStreaming();
      }
      
      this.setConnected(true);
      this.resetConnectionAttempts();
      
      this.log('info', 'Successfully connected to Alpaca', {
        accountId: this.account.id,
        status: this.account.status,
        equity: this.account.equity
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to Alpaca', { error: error.message });
      await this.handleConnectionError(error);
      return false;
    }
  }
  
  /**
   * Setup streaming connection
   * @private
   */
  async setupStreaming() {
    try {
      this.streamingWs = new WebSocket(this.config.dataUrl + '/v1beta1/news');
      
      this.streamingWs.on('open', () => {
        this.log('info', 'Streaming connection opened');
        
        // Authenticate streaming
        this.streamingWs.send(JSON.stringify({
          action: 'auth',
          key: this.config.apiKey,
          secret: this.config.apiSecret
        }));
      });
      
      this.streamingWs.on('message', (data) => {
        this.handleStreamingMessage(JSON.parse(data));
      });
      
      this.streamingWs.on('error', (error) => {
        this.log('error', 'Streaming error', { error: error.message });
      });
      
      this.streamingWs.on('close', () => {
        this.log('warn', 'Streaming connection closed');
      });
    } catch (error) {
      this.log('error', 'Failed to setup streaming', { error: error.message });
    }
  }
  
  /**
   * Handle streaming messages
   * @param {Object} message - Streaming message
   * @private
   */
  handleStreamingMessage(message) {
    if (message.T === 'success' && message.msg === 'authenticated') {
      this.log('info', 'Streaming authenticated');
    } else if (message.T === 'error') {
      this.log('error', 'Streaming error', { message: message.msg });
    }
  }
  
  /**
   * Disconnect from Alpaca
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    try {
      this.log('info', 'Disconnecting from Alpaca...');
      
      // Close streaming connection
      if (this.streamingWs) {
        this.streamingWs.close();
        this.streamingWs = null;
      }
      
      // Clear client
      this.client = null;
      this.account = null;
      
      this.setConnected(false);
      this.log('info', 'Disconnected from Alpaca');
      
      return true;
    } catch (error) {
      this.log('error', 'Error disconnecting from Alpaca', { error: error.message });
      return false;
    }
  }
  
  /**
   * Place an order on Alpaca
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
      
      // Prepare Alpaca order
      const alpacaOrder = {
        symbol: order.symbol,
        qty: order.quantity,
        side: order.side,
        type: order.type,
        time_in_force: order.timeInForce || 'GTC',
        client_order_id: order.clientOrderId
      };
      
      // Add price for limit orders
      if (order.type === 'limit' && order.price) {
        alpacaOrder.limit_price = order.price;
      }
      
      // Add stop price for stop orders
      if (order.type === 'stop' && order.stopPrice) {
        alpacaOrder.stop_price = order.stopPrice;
      }
      
      this.log('info', 'Placing order', { order: alpacaOrder });
      
      // Submit order
      const response = await this.client.post('/v2/orders', alpacaOrder);
      const alpacaOrderResponse = response.data;
      
      // Normalize response
      const normalizedOrder = this.normalizeOrderResponse(alpacaOrderResponse);
      
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
      throw new Error(`Alpaca order failed: ${error.response?.data?.message || error.message}`);
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
      
      const response = await this.client.delete(`/v2/orders/${orderId}`);
      
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
   * Get current positions
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions() {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.client.get('/v2/positions');
      const alpacaPositions = response.data;
      
      // Normalize positions
      const positions = alpacaPositions.map(pos => this.normalizePosition({
        symbol: pos.symbol,
        quantity: parseFloat(pos.qty),
        side: parseFloat(pos.qty) >= 0 ? 'long' : 'short',
        avgPrice: parseFloat(pos.avg_entry_price),
        marketValue: parseFloat(pos.market_value),
        unrealizedPnL: parseFloat(pos.unrealized_pl),
        realizedPnL: parseFloat(pos.realized_pl),
        lastPrice: parseFloat(pos.current_price)
      }));
      
      // Update position cache
      this.positions.clear();
      positions.forEach(pos => {
        this.positions.set(pos.symbol, pos);
      });
      
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
      
      const response = await this.client.get('/v2/account');
      const account = response.data;
      
      return this.normalizeBalance({
        cash: parseFloat(account.cash),
        equity: parseFloat(account.equity),
        buyingPower: parseFloat(account.buying_power),
        dayTradingBuyingPower: parseFloat(account.daytrading_buying_power),
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
    // Alpaca supports most US stocks and ETFs
    // Simple validation - in production, you'd check against Alpaca's asset list
    return /^[A-Z]{1,5}$/.test(symbol) && !symbol.includes('-');
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
      
      const response = await this.client.get(`/v2/orders/${orderId}`);
      return this.normalizeOrderResponse(response.data);
    } catch (error) {
      this.log('error', 'Failed to get order', { orderId, error: error.message });
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }
  
  /**
   * Get recent orders
   * @param {number} limit - Number of orders to retrieve
   * @returns {Promise<Array>} Array of recent orders
   */
  async getRecentOrders(limit = 50) {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      const response = await this.client.get('/v2/orders', {
        params: {
          status: 'all',
          limit,
          direction: 'desc'
        }
      });
      
      return response.data.map(order => this.normalizeOrderResponse(order));
    } catch (error) {
      this.log('error', 'Failed to get recent orders', { error: error.message });
      throw new Error(`Failed to get recent orders: ${error.message}`);
    }
  }
  
  /**
   * Normalize Alpaca order response
   * @param {Object} alpacaOrder - Alpaca order response
   * @returns {Object} Normalized order
   * @protected
   */
  normalizeOrderResponse(alpacaOrder) {
    return {
      orderId: alpacaOrder.id,
      clientOrderId: alpacaOrder.client_order_id,
      symbol: alpacaOrder.symbol,
      side: alpacaOrder.side,
      quantity: parseFloat(alpacaOrder.qty),
      price: alpacaOrder.limit_price ? parseFloat(alpacaOrder.limit_price) : null,
      stopPrice: alpacaOrder.stop_price ? parseFloat(alpacaOrder.stop_price) : null,
      type: alpacaOrder.order_type,
      status: this.normalizeAlpacaOrderStatus(alpacaOrder.status),
      fillPrice: alpacaOrder.filled_avg_price ? parseFloat(alpacaOrder.filled_avg_price) : null,
      filledQuantity: parseFloat(alpacaOrder.filled_qty || 0),
      timestamp: new Date(alpacaOrder.created_at).getTime(),
      fees: 0 // Alpaca doesn't charge commissions for stocks
    };
  }
  
  /**
   * Normalize Alpaca order status
   * @param {string} alpacaStatus - Alpaca order status
   * @returns {string} Normalized status
   * @private
   */
  normalizeAlpacaOrderStatus(alpacaStatus) {
    const statusMap = {
      'new': 'pending',
      'accepted': 'pending',
      'pending_new': 'pending',
      'accepted_for_bidding': 'pending',
      'pending_cancel': 'pending',
      'pending_replace': 'pending',
      'filled': 'filled',
      'done_for_day': 'filled',
      'canceled': 'cancelled',
      'expired': 'expired',
      'replaced': 'replaced',
      'partially_filled': 'partiallyFilled',
      'rejected': 'rejected',
      'stopped': 'cancelled',
      'suspended': 'cancelled'
    };
    
    return statusMap[alpacaStatus] || 'unknown';
  }
}

module.exports = AlpacaAdapter;