// Simplified Kraken Adapter for direct integration with trading bot
// Bypasses complex broker system due to permission issues

const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');
const WebSocket = require('ws');

class KrakenAdapterSimple {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = 'https://api.kraken.com';
    this.wsUrl = 'wss://ws-auth.kraken.com/v2';
    this.connected = false;
    this.assetPairs = new Map();
    this.ws = null;
    this.authToken = null;

    // Capabilities
    this.capabilities = {
      markets: ['crypto'],
      orderTypes: ['market', 'limit', 'stop-loss', 'take-profit'],
      timeInForce: ['GTC', 'GTD', 'IOC'],
      crypto: true
    };
  }

  async connect() {
    try {
      // Test API credentials first
      await this.testCredentials();

      // Load asset pairs
      await this.loadAssetPairs();

      // Get WebSocket auth token
      await this.getAuthToken();

      this.connected = true;
      console.log('✅ Kraken adapter connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Kraken connection failed:', error.message);
      return false;
    }
  }

  async testCredentials() {
    const response = await this.makePrivateRequest('/0/private/Balance');
    if (response.error && response.error.length > 0) {
      throw new Error(`API Error: ${response.error.join(', ')}`);
    }
    return response.result;
  }

  async loadAssetPairs() {
    try {
      const response = await axios.get(`${this.baseUrl}/0/public/AssetPairs`);
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Asset pairs error: ${response.data.error.join(', ')}`);
      }

      const pairs = response.data.result;
      Object.entries(pairs).forEach(([key, value]) => {
        this.assetPairs.set(key, value);
      });

      console.log(`✅ Loaded ${this.assetPairs.size} asset pairs`);
    } catch (error) {
      throw new Error(`Failed to load asset pairs: ${error.message}`);
    }
  }

  async getAuthToken() {
    try {
      const response = await this.makePrivateRequest('/0/private/GetWebSocketsToken');
      if (response.error && response.error.length > 0) {
        throw new Error(`Token error: ${response.error.join(', ')}`);
      }

      this.authToken = response.result.token;
      console.log('✅ WebSocket auth token obtained');
    } catch (error) {
      throw new Error(`Failed to get auth token: ${error.message}`);
    }
  }

  async makePrivateRequest(endpoint, data = {}) {
    const nonce = Date.now() * 1000;
    const postData = querystring.stringify({ nonce, ...data });

    // Create signature
    const secret = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256').update(nonce + postData).digest();
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(endpoint, 'utf8');
    hmac.update(hash);
    const signature = hmac.digest('base64');

    const response = await axios.post(`${this.baseUrl}${endpoint}`, postData, {
      headers: {
        'API-Key': this.apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  async getAccountBalance() {
    const response = await this.makePrivateRequest('/0/private/Balance');
    if (response.error && response.error.length > 0) {
      throw new Error(`Balance error: ${response.error.join(', ')}`);
    }
    return response.result;
  }

  async getPositions() {
    // Kraken doesn't have a direct positions endpoint for spot trading
    // Use balance to determine holdings
    const balance = await this.getAccountBalance();
    const positions = [];

    Object.entries(balance).forEach(([asset, amount]) => {
      if (parseFloat(amount) > 0) {
        positions.push({
          symbol: asset,
          quantity: parseFloat(amount),
          side: 'long'
        });
      }
    });

    return positions;
  }

  convertToKrakenSymbol(symbol) {
    // Convert standard format to Kraken format
    if (symbol === 'BTC-USD' || symbol === 'BTC/USD') {
      return 'XXBTZUSD';
    }
    // Add more conversions as needed
    return symbol.replace('-', '').replace('/', '');
  }

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

    // Check if symbol exists
    const krakenSymbol = this.convertToKrakenSymbol(order.symbol);
    const pair = this.assetPairs.get(krakenSymbol);
    if (!pair) {
      errors.push(`Symbol ${order.symbol} not found in Kraken asset pairs`);
    } else {
      // Check minimum order size
      const minOrder = parseFloat(pair.ordermin || 0);
      if (order.quantity < minOrder) {
        errors.push(`Order quantity ${order.quantity} below minimum ${minOrder}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async placeOrder(order) {
    // Validate order first
    const validation = this.validateOrder(order);
    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert to Kraken format
    const krakenSymbol = this.convertToKrakenSymbol(order.symbol);

    const orderData = {
      pair: krakenSymbol,
      type: order.side,
      ordertype: order.type,
      volume: order.quantity.toString()
    };

    if (order.type === 'limit' && order.price) {
      orderData.price = order.price.toString();
    }

    try {
      const response = await this.makePrivateRequest('/0/private/AddOrder', orderData);

      if (response.error && response.error.length > 0) {
        throw new Error(`Order error: ${response.error.join(', ')}`);
      }

      return {
        orderId: response.result.txid[0],
        status: 'pending',
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        price: order.price
      };
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  async getMarketData(symbol) {
    const krakenSymbol = this.convertToKrakenSymbol(symbol);

    try {
      const response = await axios.get(`${this.baseUrl}/0/public/Ticker?pair=${krakenSymbol}`);

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Market data error: ${response.data.error.join(', ')}`);
      }

      const ticker = response.data.result[krakenSymbol];
      if (!ticker) {
        throw new Error(`No market data found for ${symbol}`);
      }

      return {
        symbol,
        price: parseFloat(ticker.c[0]), // Last trade price
        bid: parseFloat(ticker.b[0]),   // Bid price
        ask: parseFloat(ticker.a[0]),   // Ask price
        volume: parseFloat(ticker.v[1]), // 24h volume
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }
  }

  supportsSymbol(symbol) {
    const krakenSymbol = this.convertToKrakenSymbol(symbol);
    return this.assetPairs.has(krakenSymbol);
  }

  isCryptoSymbol(symbol) {
    return this.capabilities.crypto; // All Kraken symbols are crypto
  }

  // Add WebSocket streaming for real-time price data
  async connectWebSocketStream(onPriceUpdate) {
    try {
      // Public WebSocket for market data (no auth needed for public feeds)
      this.ws = new WebSocket('wss://ws.kraken.com');

      this.ws.on('open', () => {
        console.log('✅ Kraken WebSocket connected');

        // Subscribe to BTC-USD ticker
        const subscription = {
          event: 'subscribe',
          pair: ['XBT/USD'],  // Kraken uses XBT for Bitcoin
          subscription: {
            name: 'ticker'
          }
        };

        this.ws.send(JSON.stringify(subscription));
        console.log('📊 Subscribed to BTC-USD ticker stream');
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);

          // Kraken sends various message types, filter for ticker updates
          if (Array.isArray(msg) && msg[2] === 'ticker') {
            const tickerData = msg[1];
            const price = parseFloat(tickerData.c[0]); // Current price

            // Call the callback with price update
            if (onPriceUpdate) {
              onPriceUpdate({
                type: 'price',
                data: {
                  asset: 'BTC--USD',
                  price: price,
                  timestamp: Date.now(),
                  source: 'kraken'
                }
              });
            }
          }
        } catch (err) {
          // Ignore non-JSON messages (Kraken sends heartbeats)
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ Kraken WebSocket error:', error.message);
      });

      this.ws.on('close', () => {
        console.log('🔌 Kraken WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.connected) {
            this.connectWebSocketStream(onPriceUpdate);
          }
        }, 5000);
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to connect Kraken WebSocket:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    console.log('🔌 Kraken adapter disconnected');
    return true;
  }
}

module.exports = KrakenAdapterSimple;