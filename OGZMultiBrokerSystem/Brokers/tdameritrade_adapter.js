// TDAmeriteAdapter.js - TD Ameritrade/Schwab broker adapter
// Handles trading through TD Ameritrade API (now part of Charles Schwab)

const BaseBrokerAdapter = require('./BaseBrokerAdapter');
const axios = require('axios');
const querystring = require('querystring');

/**
 * TD Ameritrade Broker Adapter
 * Supports stocks, ETFs, options, and more through TD Ameritrade API
 */
class TDAmeriteAdapter extends BaseBrokerAdapter {
  constructor(config = {}) {
    super({
      name: 'tdameritrade',
      baseUrl: 'https://api.tdameritrade.com/v1',
      authUrl: 'https://auth.tdameritrade.com/auth',
      maxRequestsPerSecond: 120, // TD Ameritrade allows 120 requests per minute
      ...config
    });
    
    // TD Ameritrade-specific capabilities
    this.capabilities = {
      markets: ['stocks', 'etfs', 'options', 'mutual_funds'],
      orderTypes: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
      timeInForce: ['DAY', 'GTC', 'FOK', 'IOC'],
      streaming: true,
      paperTrading: true, // TD Ameritrade offers paper trading
      fractionalShares: false, // TD Ameritrade doesn't support fractional shares
      crypto: false, // TD Ameritrade doesn't support crypto
      options: true,
      forex: false
    };
    
    // API client and authentication
    this.client = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Account info
    this.accounts = [];
    this.primaryAccount = null;
    
    // Market data
    this.watchlists = new Map();
  }
  
  /**
   * Connect to TD Ameritrade
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      this.log('info', 'Connecting to TD Ameritrade...');
      
      // Validate credentials
      if (!this.config.clientId) {
        throw new Error('Client ID is required for TD Ameritrade');
      }
      
      // If we have a refresh token, use it; otherwise require manual auth
      if (!this.config.refreshToken && !this.config.accessToken) {
        throw new Error('Either refresh token or access token is required. Please complete OAuth flow first.');
      }
      
      // Setup HTTP client
      this.client = axios.create({
        baseURL: this.config.baseUrl,
        timeout: this.config.connectionTimeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Authenticate
      await this.authenticate();
      
      // Load account information
      await this.loadAccounts();
      
      // Load watchlists for symbol validation
      await this.loadWatchlists();
      
      this.setConnected(true);
      this.resetConnectionAttempts();
      
      this.log('info', 'Successfully connected to TD Ameritrade', {
        accounts: this.accounts.length,
        primaryAccount: this.primaryAccount?.accountId,
        watchlists: this.watchlists.size
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to TD Ameritrade', { error: error.message });
      await this.handleConnectionError(error);
      return false;
    }
  }
  
  /**
   * Authenticate with TD Ameritrade
   * @private
   */
  async authenticate() {
    try {
      // If we have an access token and it's not expired, use it
      if (this.config.accessToken && this.config.tokenExpiry && Date.now() < this.config.tokenExpiry) {
        this.accessToken = this.config.accessToken;
        this.updateClientAuth();
        this.log('info', 'Using provided access token');
        return;
      }
      
      // If we have a refresh token, use it to get new access token
      if (this.config.refreshToken) {
        await this.refreshAccessToken();
        return;
      }
      
      throw new Error('No valid authentication method available');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Refresh access token using refresh token
   * @private
   */
  async refreshAccessToken() {
    try {
      this.log('info', 'Refreshing access token...');
      
      const data = {
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId
      };
      
      const response = await axios.post('https://api.tdameritrade.com/v1/oauth2/token', 
        querystring.stringify(data), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // Store new tokens
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.config.refreshToken;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      // Update client headers
      this.updateClientAuth();
      
      this.log('info', 'Successfully refreshed access token');
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Update client authentication headers
   * @private
   */
  updateClientAuth() {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }
  
  /**
   * Load account information
   * @private
   */
  async loadAccounts() {
    try {
      const response = await this.client.get('/accounts');
      this.accounts = response.data;
      
      // Set primary account (first one or the one marked as primary)
      this.primaryAccount = this.accounts.find(acc => acc.securitiesAccount.isClosingOnlyRestricted === false) 
                          || this.accounts[0];
      
      if (!this.primaryAccount) {
        throw new Error('No trading account found');
      }
      
      this.log('info', `Loaded ${this.accounts.length} TD Ameritrade accounts`);
    } catch (error) {
      throw new Error(`Failed to load accounts: ${error.message}`);
    }
  }
  
  /**
   * Load watchlists for symbol validation
   * @private
   */
  async loadWatchlists() {
    try {
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      const response = await this.client.get(`/accounts/${accountId}/watchlists`);
      
      for (const watchlist of response.data) {
        this.watchlists.set(watchlist.name, watchlist);
      }
      
      this.log('info', `Loaded ${this.watchlists.size} watchlists`);
    } catch (error) {
      this.log('warn', 'Failed to load watchlists');
    }
  }
  
  /**
   * Disconnect from TD Ameritrade
   * @returns {Promise<boolean>} Disconnection success
   */
  async disconnect() {
    try {
      this.log('info', 'Disconnecting from TD Ameritrade...');
      
      // Clear state
      this.client = null;
      this.accessToken = null;
      this.accounts = [];
      this.primaryAccount = null;
      this.watchlists.clear();
      
      this.setConnected(false);
      this.log('info', 'Disconnected from TD Ameritrade');
      
      return true;
    } catch (error) {
      this.log('error', 'Error disconnecting from TD Ameritrade', { error: error.message });
      return false;
    }
  }
  
  /**
   * Place an order on TD Ameritrade
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
      
      // Check if token needs refresh
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      
      // Prepare TD Ameritrade order
      const tdOrder = {
        orderType: this.convertOrderType(order.type).toUpperCase(),
        session: 'NORMAL',
        duration: this.convertTimeInForce(order.timeInForce || 'GTC'),
        orderStrategyType: 'SINGLE',
        orderLegCollection: [
          {
            instruction: order.side.toUpperCase(),
            quantity: order.quantity,
            instrument: {
              symbol: order.symbol.toUpperCase(),
              assetType: 'EQUITY' // Defaulting to equity, could be enhanced
            }
          }
        ]
      };
      
      // Add price for limit orders
      if (order.type === 'limit' && order.price) {
        tdOrder.price = order.price;
      }
      
      // Add stop price for stop orders
      if ((order.type === 'stop' || order.type === 'stop_limit') && order.stopPrice) {
        tdOrder.stopPrice = order.stopPrice;
      }
      
      // Add client order ID if provided
      if (order.clientOrderId) {
        tdOrder.requestedDestination = 'AUTO';
      }
      
      this.log('info', 'Placing order', { order: tdOrder });
      
      // Submit order
      const response = await this.client.post(`/accounts/${accountId}/orders`, tdOrder);
      
      // TD Ameritrade returns order ID in Location header
      const locationHeader = response.headers.location || response.headers.Location;
      const orderId = locationHeader ? locationHeader.split('/').pop() : null;
      
      if (!orderId) {
        throw new Error('Failed to extract order ID from response');
      }
      
      // Get full order details
      const orderDetails = await this.getOrder(orderId);
      
      // Store order
      this.orders.set(orderId, orderDetails);
      
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
        error: error.response?.data || error.message,
        order 
      });
      throw new Error(`TD Ameritrade order failed: ${error.response?.data?.error || error.message}`);
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
      
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      
      this.log('info', 'Cancelling order', { orderId });
      
      await this.client.delete(`/accounts/${accountId}/orders/${orderId}`);
      
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
      
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      const response = await this.client.get(`/accounts/${accountId}?fields=positions`);
      
      const account = response.data.securitiesAccount;
      const positions = [];
      
      if (account.positions) {
        for (const position of account.positions) {
          const quantity = position.longQuantity - position.shortQuantity;
          
          if (quantity !== 0) {
            positions.push(this.normalizePosition({
              symbol: position.instrument.symbol,
              quantity: Math.abs(quantity),
              side: quantity > 0 ? 'long' : 'short',
              avgPrice: position.averagePrice,
              marketValue: position.marketValue,
              unrealizedPnL: position.currentDayProfitLoss,
              realizedPnL: 0, // Not provided in this endpoint
              lastPrice: position.marketValue / Math.abs(quantity)
            }));
          }
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
      
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      const response = await this.client.get(`/accounts/${accountId}`);
      
      const account = response.data.securitiesAccount;
      const balances = account.currentBalances;
      
      return this.normalizeBalance({
        cash: balances.cashBalance || 0,
        equity: balances.equity || 0,
        buyingPower: balances.buyingPower || 0,
        dayTradingBuyingPower: balances.dayTradingBuyingPower || 0,
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
    // TD Ameritrade supports most US stocks, ETFs, and options
    // Basic validation - in production, you'd validate against their instruments API
    return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
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
      
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      const response = await this.client.get(`/accounts/${accountId}/orders/${orderId}`);
      
      return this.normalizeTDOrder(response.data);
    } catch (error) {
      this.log('error', 'Failed to get order', { orderId, error: error.message });
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }
  
  /**
   * Get recent orders
   * @param {number} maxResults - Maximum number of orders to retrieve
   * @returns {Promise<Array>} Array of recent orders
   */
  async getRecentOrders(maxResults = 50) {
    try {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
      }
      
      await this.checkTokenExpiry();
      
      const accountId = this.primaryAccount.securitiesAccount.accountId;
      const fromEnteredTime = new Date();
      fromEnteredTime.setDate(fromEnteredTime.getDate() - 30); // Last 30 days
      
      const response = await this.client.get(`/accounts/${accountId}/orders`, {
        params: {
          maxResults,
          fromEnteredTime: fromEnteredTime.toISOString(),
          status: 'FILLED,WORKING,PENDING_ACTIVATION,REJECTED,CANCELED'
        }
      });
      
      return response.data.map(order => this.normalizeTDOrder(order));
    } catch (error) {
      this.log('error', 'Failed to get recent orders', { error: error.message });
      throw new Error(`Failed to get recent orders: ${error.message}`);
    }
  }
  
  /**
   * Check if token needs refresh
   * @private
   */
  async checkTokenExpiry() {
    if (this.tokenExpiry && Date.now() > (this.tokenExpiry - 300000)) { // Refresh 5 minutes before expiry
      await this.refreshAccessToken();
    }
  }
  
  /**
   * Convert order type to TD Ameritrade format
   * @param {string} orderType - Standard order type
   * @returns {string} TD Ameritrade order type
   * @private
   */
  convertOrderType(orderType) {
    const typeMap = {
      'market': 'MARKET',
      'limit': 'LIMIT',
      'stop': 'STOP',
      'stop_limit': 'STOP_LIMIT',
      'trailing_stop': 'TRAILING_STOP'
    };
    
    return typeMap[orderType] || 'MARKET';
  }
  
  /**
   * Convert time in force to TD Ameritrade format
   * @param {string} timeInForce - Standard time in force
   * @returns {string} TD Ameritrade time in force
   * @private
   */
  convertTimeInForce(timeInForce) {
    const tifMap = {
      'GTC': 'GTC',
      'DAY': 'DAY',
      'IOC': 'IOC',
      'FOK': 'FOK'
    };
    
    return tifMap[timeInForce] || 'GTC';
  }
  
  /**
   * Normalize TD Ameritrade order
   * @param {Object} tdOrder - TD Ameritrade order data
   * @returns {Object} Normalized order
   * @private
   */
  normalizeTDOrder(tdOrder) {
    const orderLeg = tdOrder.orderLegCollection?.[0] || {};
    const instrument = orderLeg.instrument || {};
    
    return {
      orderId: tdOrder.orderId?.toString() || '',
      clientOrderId: tdOrder.tag || null,
      symbol: instrument.symbol || '',
      side: orderLeg.instruction?.toLowerCase() || '',
      quantity: orderLeg.quantity || 0,
      price: tdOrder.price || null,
      stopPrice: tdOrder.stopPrice || null,
      type: tdOrder.orderType?.toLowerCase() || '',
      status: this.normalizeTDOrderStatus(tdOrder.status),
      fillPrice: tdOrder.price || null, // TD doesn't always provide separate fill price
      filledQuantity: tdOrder.filledQuantity || 0,
      timestamp: tdOrder.enteredTime ? new Date(tdOrder.enteredTime).getTime() : Date.now(),
      fees: 0 // TD Ameritrade doesn't charge commissions for stocks
    };
  }
  
  /**
   * Normalize TD Ameritrade order status
   * @param {string} tdStatus - TD Ameritrade order status
   * @returns {string} Normalized status
   * @private
   */
  normalizeTDOrderStatus(tdStatus) {
    const statusMap = {
      'AWAITING_PARENT_ORDER': 'pending',
      'AWAITING_CONDITION': 'pending',
      'AWAITING_MANUAL_REVIEW': 'pending',
      'ACCEPTED': 'pending',
      'AWAITING_UR_OUT': 'pending',
      'PENDING_ACTIVATION': 'pending',
      'QUEUED': 'pending',
      'WORKING': 'pending',
      'REJECTED': 'rejected',
      'PENDING_CANCEL': 'pending',
      'CANCELED': 'cancelled',
      'PENDING_REPLACE': 'pending',
      'REPLACED': 'replaced',
      'FILLED': 'filled',
      'EXPIRED': 'expired'
    };
    
    return statusMap[tdStatus] || 'unknown';
  }
  
  /**
   * Get OAuth authorization URL for first-time setup
   * @returns {string} Authorization URL
   * @static
   */
  static getAuthorizationUrl(clientId, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: redirectUri,
      client_id: clientId + '@AMER.OAUTHAP'
    });
    
    return `https://auth.tdameritrade.com/auth?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for tokens
   * @param {string} authCode - Authorization code from OAuth flow
   * @param {string} redirectUri - Redirect URI used in OAuth
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Token response
   * @static
   */
  static async exchangeCodeForTokens(authCode, redirectUri, clientId) {
    try {
      const data = {
        grant_type: 'authorization_code',
        access_type: 'offline',
        code: decodeURIComponent(authCode),
        client_id: clientId + '@AMER.OAUTHAP',
        redirect_uri: redirectUri
      };
      
      const response = await axios.post('https://api.tdameritrade.com/v1/oauth2/token',
        querystring.stringify(data), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

module.exports = TDAmeriteAdapter;