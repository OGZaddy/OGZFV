// RobinhoodAdapter.js - Robinhood broker adapter
// Handles commission-free trading through Robinhood's API

const BaseBrokerAdapter = require('./BaseBrokerAdapter');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Robinhood Broker Adapter
 * Supports commission-free stock and crypto trading
 */
class RobinhoodAdapter extends BaseBrokerAdapter {
  constructor(config = {}) {
    super({
      name: 'robinhood',
      baseUrl: 'https://robinhood.com/api',
      maxRequestsPerSecond: 5, // Conservative rate limiting
      ...config
    });
    
    // Robinhood-specific capabilities
    this.capabilities = {
      markets: ['stocks', 'etfs', 'crypto', 'options'],
      orderTypes: ['market', 'limit', 'stop_loss', 'stop_limit'],
      timeInForce: ['GTC', 'GFD', 'IOC', 'FOK'],
      streaming: true,
      paperTrading: false, // Robinhood doesn't offer paper trading
      fractionalShares: true,
      crypto: true,
      options: true,
      forex: false
    };
    
    // API client and authentication
    this.client = null;
    this.authToken = null;
    this.refreshToken = null;
    this.deviceId = null;
    
    // Account info
    this.account = null;
    this.user = null;
    
    // Robinhood-specific state
    this.instruments = new Map(); // Symbol to instrument URL mapping
    this.cryptoPairs = new Map(); // Crypto trading pairs
  }
  
  /**
   * Connect to Robinhood
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      this.log('info', 'Connecting to Robinhood...');
      
      // Validate credentials
      if (!this.config.username || !this.config.password) {
        throw new Error('Username and password are required for Robinhood');
      }
      
      // Generate device ID if not provided
      this.deviceId = this.config.deviceId || this.generateDeviceId();
      
      // Setup HTTP client
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.connectionTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OGZPrime/1.0)',
          'Content-Type': 'application/json'
        }
      });
      
      // Authenticate
      await this.authenticate();
      
      // Load account information
      await this.loadAccountInfo();
      
      // Load instruments for symbol mapping
      await this.loadPopularInstruments();
      
      // Load crypto pairs if crypto trading enabled
      if (this.capabilities.crypto) {
        await this.loadCryptoPairs();
      }
      
      this.setConnected(true);
      this.resetConnectionAttempts();
      
      this.log('info', 'Successfully connected to Robinhood', {
        accountNumber: this.account?.account_number,
        username: this.user?.username,
        instruments: this.instruments.size,
        cryptoPairs: this.cryptoPairs.size
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to Robinhood', { error: error.message });
      await this.handleConnectionError(error);
      return false;
    }
  }
  
  /**
   * Authenticate with Robinhood
   * @private
   */
  async authenticate() {
    try {
      // Prepare authentication request
      const authData = {
        username: this.config.username,
        password: this.config.password,
        grant_type: 'password',
        client_id: 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
        device_token: this.deviceId,
        scope: 'internal'
      };
      
      // Add MFA token if provided
      if (this.config.mfaCode) {
        authData.mfa_code = this.config.mfaCode;
      }
      
      this.log('info', 'Authenticating with Robinhood...');
      
      const response = await this.client.post('/api-token-auth/', authData);
      
      if (response.data.mfa_required) {
        throw new Error('MFA code required. Please provide mfaCode in configuration.');
      }
      
      // Store tokens
      this.authToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      // Update client headers with auth token
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      
      this.log('info', 'Successfully authenticated with Robinhood');
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid username/password or MFA code required');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Load account information
   * @private
   */
  async loadAccountInfo() {
    try {
      // Get user info
      const userResponse = await this.client.get('/user/');
      this.user = userResponse.data;
      
      // Get accounts
      const accountsResponse = await this.client.get('/accounts/');
      if (accountsResponse.data.results.length === 0) {
        throw new Error('No Robinhood account found');
      }
      
      this.account = accountsResponse.data.results[0];
      
      this.log('info', 'Loaded Robinhood account information');
    } catch (error) {
      throw new Error(`Failed to load account info: ${error.message}`);
    }
  }
  
  /**
   * Load popular instruments for symbol mapping
   * @private
   */
  async loadPopularInstruments() {
    try {
      // Load popular instruments
      const response = await this.client.get('/instruments/?popular=true');
      
      for (const instrument of response.data.results) {
        this.instruments.set(instrument.symbol, instrument);
      }
      
      this.log('info', `Loaded ${this.instruments.size} popular instruments`);
    } catch (error) {
      this.log('warn', 'Failed to load instruments, will fetch on demand');
    }
  }
  
  /**
   * Load crypto trading pairs
   * @private
   */
  async loadCryptoPairs() {
    try {
      const response = await this.client.get('/currency_pairs/');
      
      for (const pair of response.data.results) {
        if (pair.tradability === 'tradable') {
          this.cryptoPairs.set(pair.symbol, pair);
        }
      }
      
      this.log('info', `Loaded ${this.cryptoPairs.size} crypto pairs`);
    } catch (error) {
      this.log('warn', 'Failed to load crypto pairs');
    }
  }
  
  /**
   * Disconnect from Robinhood
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    try {
      this.log('info', 'Disconnecting from Robinhood...');
      
      // Logout to invalidate token
      if (this.authToken) {
        try {
          await this.client.post('/api-token-logout/');
        } catch (error) {
          this.log('warn', 'Failed to logout gracefully');
        }
      }
      
      // Clear state
      this.client = null;
      this.authToken = null;
      this.refreshToken = null;
      this.account = null;
      this.user = null;
      this.instruments.clear();
      this.cryptoPairs.clear();
      
      this.setConnected(false);
      this.log('info', 'Disconnected from Robinhood');
      
      return true;
    } catch (error) {
      this.log('error', 'Error disconnecting from Robinhood', { error: error.message });
      return false;
    }
  }
  
  /**
   * Place an order on Robinhood
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
      
      // Determine if this is a crypto or stock order
      const isCrypto = this.isCryptoSymbol(order.symbol);
      
      if (isCrypto) {
        return await this.placeCryptoOrder(order);
      } else {
        return await this.placeStockOrder(order);
      }
    } catch (error) {
      this.log('error', 'Failed to place order', { 
        error: error.response?.data || error.message,
        order 
      });
      throw new Error(`Robinhood order failed: ${error.message}`);
    }
  }
  
  /**
   * Place a stock order
   * @param {Object} order - Order parameters
   * @returns {Promise<Object>} Order result
   * @private
   */
  async placeStockOrder(order) {
    // Get instrument for symbol
    const instrument = await this.getInstrument(order.symbol);
    if (!instrument) {
      throw new Error(`Instrument not found for symbol: ${order.symbol}`);
    }
    
    // Prepare Robinhood stock order
    const robinhoodOrder = {
      account: this.account.url,
      instrument: instrument.url,
      symbol: order.symbol,
      side: order.side,
      type: this.convertOrderType(order.type),
      time_in_force: order.timeInForce || 'GTC',
      trigger: 'immediate',
      quantity: order.quantity.toString()
    };
    
    // Add price for limit orders
    if (order.type === 'limit' && order.price) {
      robinhoodOrder.price = order.price.toString();
    }
    
    // Add stop price for stop orders
    if (order.type === 'stop' && order.stopPrice) {
      robinhoodOrder.stop_price = order.stopPrice.toString();
      robinhoodOrder.trigger = 'stop';
    }
    
    this.log('info', 'Placing stock order', { order: robinhoodOrder });
    
    // Submit order
    const response = await this.client.post('/orders/', robinhoodOrder);
    const robinhoodOrderResponse = response.data;
    
    // Normalize response
    const normalizedOrder = this.normalizeRobinhoodOrder(robinhoodOrderResponse);
    
    // Store order
    this.orders.set(normalizedOrder.orderId, normalizedOrder);
    
    this.log('info', 'Stock order placed successfully', { 
      orderId: normalizedOrder.orderId,
      symbol: normalizedOrder.symbol,
      side: normalizedOrder.side,
      quantity: normalizedOrder.quantity
    });
    
    // Emit order placed event
    this.emit('orderPlaced', normalizedOrder);
    
    return normalizedOrder;
  }
  
  /**
   * Place a crypto order
   * @param {Object} order - Order parameters
   * @returns {Promise<Object>} Order result
   * @private
   */
  async placeCryptoOrder(order) {
    // Get crypto pair
    const pair = this.cryptoPairs.get(order.symbol);
    if (!pair) {
      throw new Error(`Crypto pair not found for symbol: ${order.symbol}`);
    }
    
    // Prepare Robinhood crypto order
    const robinhoodOrder = {
      account_id: this.account.id,
      currency_pair_id: pair.id,
      side: order.side,
      type: this.convertOrderType(order.type),
      time_in_force: order.timeInForce || 'GTC'
    };
    
    // For crypto, Robinhood uses quantity vs. amount
    if (order.side === 'buy' && order.type === 'market') {
      robinhoodOrder.amount = (order.quantity * order.price).toString(); // Dollar amount
    } else {
      robinhoodOrder.quantity = order.quantity.toString();
    }
    
    // Add price for limit orders
    if (order.type === 'limit' && order.price) {
      robinhoodOrder.price = order.price.toString();
    }
    
    this.log('info', 'Placing crypto order', { order: robinhoodOrder });
    
    // Submit crypto order
    const response = await this.client.post('/orders/crypto/', robinhoodOrder);
    const robinhoodOrderResponse = response.data;
    
    // Normalize response
    const normalizedOrder = this.normalizeRobinhoodCryptoOrder(robinhoodOrderResponse);
    
    // Store order
    this.orders.set(normalizedOrder.orderId, normalizedOrder);
    
    this.log('info', 'Crypto order placed successfully', { 
      orderId: normalizedOrder.orderId,
      symbol: normalizedOrder.symbol,
      side: normalizedOrder.side,
      quantity: normalizedOrder.quantity
    });
    
    // Emit order placed event
    this.emit('orderPlaced', normalizedOrder);
    
    return normalizedOrder;
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
      
      // Try stock order cancellation first
      try {
        const response = await this.client.post(`/orders/${orderId}/cancel/`);
        
        // Remove from local orders
        this.orders.delete(orderId);
        
        this.log('info', 'Order cancelled successfully', { orderId });
        
        this.emit('orderCancelled', { orderId });
        
        return {
          orderId,
          status: 'cancelled',
          timestamp: Date.now()
        };
      } catch (stockError) {
        // Try crypto order cancellation
        const response = await this.client.post(`/orders/crypto/${orderId}/cancel/`);
        
        this.orders.delete(orderId);
        this.log('info', 'Crypto order cancelled successfully', { orderId });
        
        this.emit('orderCancelled', { orderId });
        
        return {
          orderId,
          status: 'cancelled',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      this.log('error', 'Failed to cancel order', { 
        orderId,
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to cancel order: ${error.message}`);
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
      
      const positions = [];
      
      // Get stock positions
      const stockResponse = await this.client.get('/positions/');
      
      for (const position of stockResponse.data.results) {
        const quantity = parseFloat(position.quantity);
        
        if (quantity !== 0) {
          // Get instrument details for symbol
          const instrumentResponse = await this.client.get(position.instrument);
          const symbol = instrumentResponse.data.symbol;
          
          positions.push(this.normalizePosition({
            symbol,
            quantity: Math.abs(quantity),
            side: quantity > 0 ? 'long' : 'short',
            avgPrice: parseFloat(position.average_buy_price || 0),
            marketValue: parseFloat(position.current_price || 0) * quantity,
            unrealizedPnL: 0, // Would need current market price calculation
            realizedPnL: 0,
            lastPrice: parseFloat(position.current_price || 0)
          }));
        }
      }
      
      // Get crypto positions
      try {
        const cryptoResponse = await this.client.get('/holdings/crypto/');
        
        for (const holding of cryptoResponse.data.results) {
          const quantity = parseFloat(holding.quantity);
          
          if (quantity > 0) {
            // Get currency info
            const currencyResponse = await this.client.get(holding.currency);
            const symbol = currencyResponse.data.code;
            
            positions.push(this.normalizePosition({
              symbol,
              quantity,
              side: 'long',
              avgPrice: parseFloat(holding.cost_basis || 0),
              marketValue: parseFloat(holding.current_price || 0) * quantity,
              unrealizedPnL: 0,
              realizedPnL: 0,
              lastPrice: parseFloat(holding.current_price || 0)
            }));
          }
        }
      } catch (cryptoError) {
        this.log('warn', 'Failed to get crypto positions', { error: cryptoError.message });
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
      
      // Get account details
      const response = await this.client.get(`/accounts/${this.account.account_number}/`);
      const accountData = response.data;
      
      return this.normalizeBalance({
        cash: parseFloat(accountData.cash || 0),
        equity: parseFloat(accountData.total_equity || 0),
        buyingPower: parseFloat(accountData.buying_power || 0),
        dayTradingBuyingPower: parseFloat(accountData.day_trade_buying_power || 0),
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
    // Check if it's a known crypto symbol
    if (this.cryptoPairs.has(symbol)) {
      return true;
    }
    
    // Check if it's a known stock symbol
    if (this.instruments.has(symbol)) {
      return true;
    }
    
    // For stocks, most US symbols should be supported
    return /^[A-Z]{1,5}$/.test(symbol);
  }
  
  /**
   * Get instrument for symbol
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Instrument data
   * @private
   */
  async getInstrument(symbol) {
    // Check cache first
    if (this.instruments.has(symbol)) {
      return this.instruments.get(symbol);
    }
    
    try {
      // Fetch from API
      const response = await this.client.get(`/instruments/?symbol=${symbol}`);
      
      if (response.data.results.length > 0) {
        const instrument = response.data.results[0];
        this.instruments.set(symbol, instrument);
        return instrument;
      }
      
      return null;
    } catch (error) {
      this.log('error', `Failed to get instrument for ${symbol}`, { error: error.message });
      return null;
    }
  }
  
  /**
   * Check if symbol is cryptocurrency
   * @param {string} symbol - Trading symbol
   * @returns {boolean} Whether symbol is crypto
   * @private
   */
  isCryptoSymbol(symbol) {
    return this.cryptoPairs.has(symbol) || 
           ['BTC', 'ETH', 'LTC', 'BCH', 'DOGE', 'ETC'].some(crypto => symbol.includes(crypto));
  }
  
  /**
   * Convert order type to Robinhood format
   * @param {string} orderType - Standard order type
   * @returns {string} Robinhood order type
   * @private
   */
  convertOrderType(orderType) {
    const typeMap = {
      'market': 'market',
      'limit': 'limit',
      'stop': 'stop_loss',
      'stop_limit': 'stop_limit'
    };
    
    return typeMap[orderType] || 'market';
  }
  
  /**
   * Normalize Robinhood stock order
   * @param {Object} robinhoodOrder - Robinhood order response
   * @returns {Object} Normalized order
   * @private
   */
  normalizeRobinhoodOrder(robinhoodOrder) {
    return {
      orderId: robinhoodOrder.id,
      clientOrderId: robinhoodOrder.ref_id || null,
      symbol: robinhoodOrder.symbol,
      side: robinhoodOrder.side,
      quantity: parseFloat(robinhoodOrder.quantity),
      price: robinhoodOrder.price ? parseFloat(robinhoodOrder.price) : null,
      stopPrice: robinhoodOrder.stop_price ? parseFloat(robinhoodOrder.stop_price) : null,
      type: robinhoodOrder.type,
      status: this.normalizeRobinhoodOrderStatus(robinhoodOrder.state),
      fillPrice: robinhoodOrder.average_fill_price ? parseFloat(robinhoodOrder.average_fill_price) : null,
      filledQuantity: parseFloat(robinhoodOrder.executed_quantity || 0),
      timestamp: new Date(robinhoodOrder.created_at).getTime(),
      fees: parseFloat(robinhoodOrder.fees || 0)
    };
  }
  
  /**
   * Normalize Robinhood crypto order
   * @param {Object} robinhoodOrder - Robinhood crypto order response
   * @returns {Object} Normalized order
   * @private
   */
  normalizeRobinhoodCryptoOrder(robinhoodOrder) {
    return {
      orderId: robinhoodOrder.id,
      clientOrderId: robinhoodOrder.ref_id || null,
      symbol: robinhoodOrder.currency_pair_id, // This would need mapping to symbol
      side: robinhoodOrder.side,
      quantity: parseFloat(robinhoodOrder.quantity || robinhoodOrder.amount || 0),
      price: robinhoodOrder.price ? parseFloat(robinhoodOrder.price) : null,
      type: robinhoodOrder.type,
      status: this.normalizeRobinhoodOrderStatus(robinhoodOrder.state),
      fillPrice: robinhoodOrder.average_fill_price ? parseFloat(robinhoodOrder.average_fill_price) : null,
      filledQuantity: parseFloat(robinhoodOrder.executed_quantity || 0),
      timestamp: new Date(robinhoodOrder.created_at).getTime(),
      fees: parseFloat(robinhoodOrder.fees || 0)
    };
  }
  
  /**
   * Normalize Robinhood order status
   * @param {string} robinhoodStatus - Robinhood order status
   * @returns {string} Normalized status
   * @private
   */
  normalizeRobinhoodOrderStatus(robinhoodStatus) {
    const statusMap = {
      'queued': 'pending',
      'unconfirmed': 'pending',
      'confirmed': 'pending',
      'partially_filled': 'partiallyFilled',
      'filled': 'filled',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'failed': 'rejected'
    };
    
    return statusMap[robinhoodStatus] || 'unknown';
  }
  
  /**
   * Generate device ID for authentication
   * @returns {string} Device ID
   * @private
   */
  generateDeviceId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = RobinhoodAdapter;